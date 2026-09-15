const REQUEST = Object.freeze({ sport: "ufc", competition: "ufc", market_class: "moneyline" });

function element(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

export function observationAge(observedAt, now = Date.now()) {
	const elapsed = now - Date.parse(String(observedAt ?? ""));
	if (!Number.isFinite(elapsed) || elapsed < 0) return "time unavailable";
	if (elapsed < 60_000) return "just now";
	const minutes = Math.floor(elapsed / 60_000);
	if (minutes < 60) return `${minutes}m ago`;
	return `${Math.floor(minutes / 60)}h ago`;
}

export function selectionLabel(selection) {
	return selection.handicap == null ? selection.label : `${selection.label} ${selection.handicap}`;
}

export function visibleMarketRows(rows, clearHistorical) {
	return clearHistorical ? rows.filter((row) => row.current) : rows;
}

export function createMarketDesk({ tileManager, onOpen, onResearch, showStatus } = {}) {
	const root = element("section", "market-desk-surface");
	root.setAttribute("aria-label", "Bovada live markets");
	root.innerHTML = `<header><span class="market-desk-kicker">DATA · BOVADA</span><div class="market-desk-actions"><button type="button" data-market-clear-history title="Clear historical and superseded rows from this board only">Clear historical</button><button type="button" data-market-refresh>Refresh</button></div></header><div class="market-desk-status" role="status" aria-live="polite"></div><div class="market-desk-rows"></div>`;
	const status = root.querySelector(".market-desk-status");
	const rowsHost = root.querySelector(".market-desk-rows");
	rowsHost.addEventListener("wheel", (event) => event.stopPropagation());
	let rows = [];
	let loading = false;
	let historicalCleared = false;

	function setStatus(text, tone = "") {
		status.textContent = text;
		status.dataset.tone = tone;
	}

	function render() {
		rowsHost.replaceChildren();
		const visibleRows = visibleMarketRows(rows, historicalCleared);
		if (visibleRows.length === 0) {
			rowsHost.appendChild(element("div", "market-desk-empty", "No captured current markets yet."));
			return;
		}
		for (const row of visibleRows) {
			const state = row.state === "superseded" ? "superseded" : row.current ? "current" : "historical";
			const stateClass = state === "current" ? "is-current" : state === "superseded" ? "is-superseded" : "is-historical";
			const card = element("article", `market-row ${stateClass}`);
			card.dataset.quoteId = String(row.quote_id ?? "");
			card.dataset.current = row.current ? "true" : "false";
			const head = element("div", "market-row-head");
			head.appendChild(element("span", "market-row-state", state.toUpperCase()));
			head.appendChild(element("time", null, new Date(row.starts_at).toLocaleString()));
			card.appendChild(head);
			card.appendChild(element("h3", null, row.event));
			card.appendChild(element("div", "market-row-kind", `${row.market} · ${row.period}`));
			const prices = element("div", "market-prices");
			for (const selection of Array.isArray(row.selections) ? row.selections : []) {
				const side = element("div", "market-price");
				side.appendChild(element("span", null, selectionLabel(selection)));
				side.appendChild(element("b", null, selection.american));
				prices.appendChild(side);
			}
			card.appendChild(prices);
			card.appendChild(element("div", "market-row-meta", `Observed ${observationAge(row.observed_at)} · Source ${row.venue?.name ?? "Bovada"}${row.provider_time ? ` · Provider event updated ${new Date(row.provider_time).toLocaleString()}` : " · Provider time unavailable"}`));
			const inspect = element("details", "market-inspect");
			inspect.appendChild(element("summary", null, "Inspect"));
			const facts = element("dl", null);
			for (const [label, value] of [
				["Venue", `${row.venue?.name ?? ""} · ${row.venue?.id ?? ""}`],
				["Event", `${row.market_event_id} · provider ${row.provider_event_id}`],
				["Instrument", `${row.instrument_id} · provider ${row.provider_market_id}`],
				["Quote", row.quote_id],
				["Observed", row.observed_at],
				["Provider time", row.provider_time ?? "unavailable"],
				["Source hash", row.source_hash],
			]) {
				facts.appendChild(element("dt", null, label));
				facts.appendChild(element("dd", null, String(value ?? "")));
			}
			for (const investigation of Array.isArray(row.investigations) ? row.investigations : []) {
				facts.appendChild(element("dt", null, "Investigation"));
				facts.appendChild(element("dd", null, `${investigation.investigates?.from_id ?? ""} → ${investigation.investigates?.to_id ?? ""} · ${investigation.tasks?.length ?? 0} Task(s)`));
			}
			inspect.appendChild(facts);
			card.appendChild(inspect);
			for (const investigation of Array.isArray(row.investigations) ? row.investigations : []) {
				const missionId = String(investigation.investigates?.from_id ?? "");
				if (!missionId) continue;
				const reopen = element("button", "market-reopen-investigation", "Open saved investigation");
				reopen.type = "button";
				reopen.dataset.missionId = missionId;
				reopen.addEventListener("click", () => void onResearch?.(missionId));
				card.appendChild(reopen);
			}
			if (row.current) {
				const researchDetails = element("details", "market-research-details");
				researchDetails.appendChild(element("summary", null, "Research this market"));
				researchDetails.addEventListener("toggle", () => {
					if (!researchDetails.open) return;
					for (const open of root.querySelectorAll(".market-research-details[open]")) {
						if (open !== researchDetails) open.removeAttribute("open");
					}
				});
				const inquiry = element("div", "market-inquiry");
				const claim = document.createElement("input");
				claim.className = "market-inquiry-input";
				claim.placeholder = "Your claim, e.g. the underdog wins by submission";
				claim.setAttribute("aria-label", "Research claim");
				const market = document.createElement("input");
				market.className = "market-inquiry-input";
				market.placeholder = "Exact Bovada market, e.g. Method of Victory";
				market.setAttribute("aria-label", "Exact Bovada market");
				const outcome = document.createElement("input");
				outcome.className = "market-inquiry-input";
				outcome.placeholder = "Exact offered outcome, e.g. Fighter B by Submission";
				outcome.setAttribute("aria-label", "Exact offered outcome");
				inquiry.append(claim, market, outcome);
				const research = element("button", "market-research", "Open investigation");
				research.type = "button";
				research.addEventListener("click", async () => {
					const expression = claim.value.trim();
					const marketDescription = market.value.trim();
					const outcomeDescription = outcome.value.trim();
					if (!expression || !outcomeDescription) {
						setStatus("Enter your claim and the exact Bovada outcome you want tested.", "error");
						return;
					}
					research.disabled = true;
					setStatus("Checking the complete live fight menu for that exact expression…");
					try {
						const result = await window.shellApi.qf.investigateMarket({
							quote_id: row.quote_id,
							name: expression,
							objective: `Support, challenge, or find insufficient evidence for: ${expression}`,
							requested_expression: {
								expression,
								outcome_description: outcomeDescription,
								...(marketDescription ? { market_description: marketDescription } : {}),
							},
						});
						if (!result?.ok) throw new Error(result?.error?.message ?? "Investigation could not be opened");
						rows = Array.isArray(result.rows) ? result.rows : rows;
						render();
						setStatus("Ready to staff · Method: not selected", "ok");
						await onResearch?.(String(result.mission_id));
					} catch (error) {
						setStatus(error?.message ?? String(error), "error");
						showStatus?.(error?.message ?? String(error), { tone: "error" });
					} finally {
						research.disabled = false;
					}
				});
				researchDetails.append(inquiry, research);
				card.appendChild(researchDetails);
			}
			rowsHost.appendChild(card);
		}
	}

	async function load({ capture = false } = {}) {
		if (loading) return;
		loading = true;
		setStatus(capture ? "Capturing current UFC markets…" : "Restoring market evidence…");
		try {
			const result = capture
				? await window.shellApi.qf.captureMarkets(REQUEST)
				: await window.shellApi.qf.listMarkets();
			if (!result?.ok) throw new Error(result?.error?.message ?? "Market evidence unavailable");
			rows = Array.isArray(result.rows) ? result.rows : [];
			render();
			setStatus(rows.length > 0 ? `${rows.filter((row) => row.current).length} current · ${rows.filter((row) => !row.current).length} historical` : "No supported markets in the bounded response", rows.length > 0 ? "ok" : "");
		} catch (error) {
			setStatus(error?.message ?? String(error), "error");
			showStatus?.(error?.message ?? String(error), { tone: "error" });
		} finally {
			loading = false;
		}
	}

	root.querySelector("[data-market-refresh]")?.addEventListener("click", () => void load({ capture: true }));
	root.querySelector("[data-market-clear-history]")?.addEventListener("click", () => {
		historicalCleared = true;
		render();
		setStatus("Historical rows cleared from this board only. Saved evidence and research remain available.", "ok");
	});
	return {
		open: () => {
			const tile = tileManager.openCapabilityTile({ id: "bovada-live-markets", title: "Bovada Live Markets", content: root });
			onOpen?.(tile);
			return load();
		},
		refresh: () => load(),
		root,
	};
}
