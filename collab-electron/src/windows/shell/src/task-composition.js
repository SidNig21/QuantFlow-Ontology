import { participantFieldRows } from "./participant-projection.js";

function node(tag, className, text) {
	const value = document.createElement(tag);
	if (className) value.className = className;
	if (text !== undefined) value.textContent = text;
	return value;
}

export function taskFactForSession(assignments, sessionId) {
	if (!Array.isArray(assignments)) return { text: "No task", state: "none" };
	const unavailable = assignments.find((row) =>
		row?.assignmentState === "unavailable" &&
		Array.isArray(row?.unavailableSessionIds) &&
		row.unavailableSessionIds.includes(sessionId)
	);
	if (unavailable) return { text: "Assignment unavailable", state: "unavailable", task: unavailable };
	const assigned = assignments.find((row) =>
		row?.assignmentState === "assigned" && row?.assignedToSessionId === sessionId
	);
	if (!assigned) return { text: "No task", state: "none" };
	return {
		text: `${assigned.title} · ${String(assigned.status ?? "").toUpperCase()}`,
		state: assigned.status === "open" ? "open" : "terminal",
		task: assigned,
	};
}

function isOrchestrator(tile, session) {
	return String(tile?.role ?? session?.role ?? "").toLowerCase() === "orchestrator" ||
		String(session?.display_name ?? "") === "Orchestrator";
}

function runningSessions(sessions) {
	return (Array.isArray(sessions) ? sessions : [])
		.filter((session) => session?.status === "running" && typeof session?.id === "string");
}

function selectAssignee(sessions, selectedId) {
	const select = node("select", "task-assignee");
	for (const session of runningSessions(sessions)) {
		const option = node("option", null, session.display_name || session.label || session.id);
		option.value = session.id;
		if (session.id === selectedId) option.selected = true;
		select.appendChild(option);
	}
	return select;
}

function errorLine(foot, message) {
	const existing = foot.querySelector(".task-foot-error");
	if (existing) existing.remove();
	foot.appendChild(node("div", "task-foot-error", message));
}

function renderHistory(foot, history) {
	if (!Array.isArray(history)) return;
	const list = node("div", "task-history");
	for (const fact of history) {
		const row = node("div", "task-history-fact");
		row.dataset.eventId = String(fact?.event_id ?? "");
		row.dataset.sequence = String(fact?.sequence ?? "");
		row.dataset.kind = String(fact?.kind ?? "");
		row.dataset.taskId = String(fact?.task_id ?? "");
		row.dataset.mode = fact?.mode == null ? "" : String(fact.mode);
		row.dataset.text = fact?.text == null ? "" : String(fact.text);
		row.dataset.outcome = fact?.outcome == null ? "" : String(fact.outcome);
		row.dataset.targetSessionId = fact?.target_session_id == null ? "" : String(fact.target_session_id);
		row.appendChild(node("span", "task-history-action", String(fact?.kind ?? "")));
		row.appendChild(node("span", "task-history-text", fact?.text == null ? "" : String(fact.text)));
		row.appendChild(node("span", "task-history-outcome", fact?.outcome == null ? "" : String(fact.outcome)));
		row.appendChild(node("span", "task-history-target", fact?.target_session_id == null ? "" : String(fact.target_session_id)));
		list.appendChild(row);
	}
	foot.appendChild(list);
}

function isSessionReceipt(child) {
	return child?.classList?.length === 1 && child.classList.contains("qf-world-session-receipt");
}

export function renderTaskFoot(dom, tile, {
	focused = false,
	sessions = [],
	assignments = [],
	participantView = null,
	onCreate,
	onReassign,
	onCancel,
	onSteer,
	onSecondOpinion,
	onRequestReview,
	onRequestRevision,
	onSecondCritic,
} = {}) {
	const foot = dom?.taskFoot;
	if (!foot) return;
	const existingForm = foot.querySelector(".task-create-form");
	const preservedForm = existingForm ? {
		title: existingForm.querySelector(".task-title")?.value ?? "",
		description: existingForm.querySelector(".task-description")?.value ?? "",
		assigneeSessionId: existingForm.querySelector(".task-assignee")?.value ?? "",
	} : null;
	const preservedError = foot.querySelector(".task-foot-error")?.textContent ?? "";
	const retainedReceipt = [...foot.children].find(isSessionReceipt) ?? null;
	if (retainedReceipt) foot.replaceChildren(retainedReceipt);
	else foot.replaceChildren();
	if (!tile?.sessionId) {
		if (retainedReceipt) foot.appendChild(retainedReceipt);
		return;
	}
	if (participantView) {
		const receipt = retainedReceipt || node("div", "qf-world-session-receipt");
		receipt.replaceChildren(...participantFieldRows(participantView).map(({ field, value }) => {
			const row = node("div", "qf-world-context-field");
			row.appendChild(node("span", "qf-world-field-label", field));
			row.appendChild(node("span", "qf-world-field-value", value));
			return row;
		}));
		if (!retainedReceipt) foot.appendChild(receipt);
	}

	const session = (Array.isArray(sessions) ? sessions : []).find((row) => row?.id === tile.sessionId);
	const fact = taskFactForSession(assignments, tile.sessionId);
	const factRow = node("div", `task-fact task-fact-${fact.state}`);
	if (fact.task?.assignmentState === "assigned") {
		factRow.dataset.taskId = fact.task.taskId;
		factRow.dataset.delegatedBySessionId = fact.task.delegatedBySessionId;
		factRow.dataset.assignedToSessionId = fact.task.assignedToSessionId;
		factRow.appendChild(node("span", "qf-task-title", fact.task.title));
		factRow.appendChild(node("span", "qf-task-status", String(fact.task.status).toUpperCase()));
		factRow.appendChild(node("span", "qf-task-delegator", `Assigned by ${fact.task.delegatorDisplayName}`));
		factRow.appendChild(node("span", "qf-task-reason", fact.task.description));
	} else {
		factRow.appendChild(node("span", "task-fact-label", fact.text));
	}
	foot.appendChild(factRow);
	if (fact.task?.assignmentState === "assigned") renderHistory(foot, fact.task.history);

	if (fact.task?.assignmentState === "assigned" && fact.task.reviewable) {
		const review = fact.task.reviewProjection;
		if (review) {
			const reviewFacts = node("div", "governed-review-facts");
			reviewFacts.dataset.verdict = String(review.verdict ?? "");
			reviewFacts.dataset.criticName = String(review.critic_name ?? "");
			reviewFacts.dataset.overall = review.overall == null ? "" : String(review.overall);
			reviewFacts.dataset.rationale = String(review.rationale ?? "");
			reviewFacts.appendChild(node("span", "governed-review-state", String(review.state ?? "")));
			reviewFacts.appendChild(node("span", "governed-review-critic", String(review.critic_name ?? "")));
			reviewFacts.appendChild(node("span", "governed-review-verdict", String(review.verdict ?? "")));
			if (review.rubric) for (const key of ["faithfulness", "answer_relevancy", "context_precision", "context_recall"]) {
				const score = node("span", `governed-review-score governed-review-score-${key}`, `${key}: ${String(review.rubric[key])}`);
				reviewFacts.appendChild(score);
			}
			reviewFacts.appendChild(node("span", "governed-review-overall", `overall: ${review.overall == null ? "null" : String(review.overall)}`));
			reviewFacts.appendChild(node("span", "governed-review-rationale", String(review.rationale ?? "")));
			if (review.block_reason?.message) {
				reviewFacts.dataset.blockReasonCode = String(review.block_reason.code ?? "");
				reviewFacts.appendChild(node("span", "governed-review-block-code", String(review.block_reason.code ?? "")));
				reviewFacts.appendChild(node("span", "governed-review-block-reason", String(review.block_reason.message)));
			}
			if (review.publication?.report_id) reviewFacts.appendChild(node("span", "governed-review-report", String(review.publication.report_id)));
			foot.appendChild(reviewFacts);
			if (Array.isArray(review.actions) && review.actions.length > 0) {
				const nextActions = node("div", "governed-review-actions");
				const revision = node("button", "task-action governed-review-revision", "Request revision");
				const second = node("button", "task-action governed-review-second", "Second critic");
				revision.addEventListener("click", async (event) => {
					event.stopPropagation();
					try { await onRequestRevision?.(fact.task.taskId, String(review.evaluation_id), crypto.randomUUID()); }
					catch (error) { errorLine(foot, error?.message ?? String(error)); }
				});
				second.addEventListener("click", async (event) => {
					event.stopPropagation();
					try { await onSecondCritic?.(fact.task.taskId, String(review.evaluation_id), crypto.randomUUID()); }
					catch (error) { errorLine(foot, error?.message ?? String(error)); }
				});
				nextActions.appendChild(revision);
				nextActions.appendChild(second);
				foot.appendChild(nextActions);
			}
		}
		const reviewButton = node("button", "task-action governed-review-request", "Request review");
		let reviewAttemptId = null;
		let reviewSubmitting = false;
		reviewButton.addEventListener("click", async (event) => {
			event.stopPropagation();
			if (reviewSubmitting) return;
			reviewAttemptId ??= crypto.randomUUID();
			reviewSubmitting = true;
			reviewButton.disabled = true;
			try {
				await onRequestReview?.(fact.task.taskId, reviewAttemptId);
				reviewAttemptId = null;
				reviewSubmitting = false;
				reviewButton.disabled = false;
			} catch (error) {
				reviewSubmitting = false;
				reviewButton.disabled = false;
				errorLine(foot, error?.message ?? String(error));
			}
		});
		foot.appendChild(reviewButton);
	}

	if ((fact.task?.status === "open" || fact.task?.status === "cancelled") && fact.task.assignedToSessionId === tile.sessionId) {
		const actions = node("div", "task-foot-actions");
		const reassign = node("button", "task-action", "Reassign");
		const cancel = node("button", "task-action task-action-cancel", "Cancel");
		const clarify = node("button", "task-action", "Clarify");
		const redirect = node("button", "task-action", "Redirect");
		const secondOpinion = node("button", "task-action", "Second opinion");
		if (fact.task.status !== "open") {
			reassign.disabled = true;
			clarify.disabled = true;
			redirect.disabled = true;
			secondOpinion.disabled = true;
		}
		reassign.addEventListener("click", (event) => {
			event.stopPropagation();
			const chooser = selectAssignee(sessions, "");
			for (const option of [...chooser.options]) {
				if (option.value === tile.sessionId) option.remove();
			}
			const apply = node("button", "task-action", "Apply");
			const chooserRow = node("div", "task-reassign-row");
			chooserRow.appendChild(chooser);
			chooserRow.appendChild(apply);
			reassign.replaceWith(chooserRow);
			apply.addEventListener("click", async (applyEvent) => {
				applyEvent.stopPropagation();
				if (!chooser.value) return errorLine(foot, "Choose a running assignee.");
				try {
					await onReassign?.(fact.task.taskId, chooser.value);
				} catch (error) {
					errorLine(foot, error?.message ?? String(error));
				}
			});
		});
		cancel.addEventListener("click", async (event) => {
			event.stopPropagation();
			try {
				await onCancel?.(fact.task.taskId);
			} catch (error) {
				errorLine(foot, error?.message ?? String(error));
			}
		});
		const openSteer = (mode) => {
			const form = node("form", "task-steering-form");
			const input = node("textarea", "task-steering-input");
			input.placeholder = mode === "clarify" ? "Add context" : "New completion description";
			input.required = true;
			const submit = node("button", "task-action", "Submit");
			submit.type = "submit";
			form.appendChild(input);
			form.appendChild(submit);
			actions.replaceChildren(form);
			input.focus();
			form.addEventListener("submit", async (submitEvent) => {
				submitEvent.preventDefault();
				submitEvent.stopPropagation();
				try {
					await onSteer?.(fact.task.taskId, mode, input.value);
				} catch (error) {
					errorLine(foot, error?.message ?? String(error));
				}
			});
		};
		clarify.addEventListener("click", (event) => { event.stopPropagation(); openSteer("clarify"); });
		redirect.addEventListener("click", (event) => { event.stopPropagation(); openSteer("redirect"); });
		secondOpinion.addEventListener("click", async (event) => {
			event.stopPropagation();
			try { await onSecondOpinion?.(fact.task.taskId); }
			catch (error) { errorLine(foot, error?.message ?? String(error)); }
		});
		actions.appendChild(reassign);
		actions.appendChild(cancel);
		actions.appendChild(clarify);
		actions.appendChild(redirect);
		actions.appendChild(secondOpinion);
		foot.appendChild(actions);
	}

	if (isOrchestrator(tile, session)) {
		const renderCreateForm = (formState = null) => {
			const form = node("form", "task-create-form");
			const title = node("input", "task-title");
			title.placeholder = "Task title";
			title.required = true;
			title.value = formState?.title ?? "";
			const description = node("textarea", "task-description");
			description.placeholder = "Completion description";
			description.required = true;
			description.value = formState?.description ?? "";
			const assignee = selectAssignee(
				sessions,
				formState?.assigneeSessionId ||
					(runningSessions(sessions).find((row) => row.id !== tile.sessionId)?.id ?? ""),
			);
			const submit = node("button", "task-action", "Create");
			submit.type = "submit";
			let submitting = false;
			const setSubmitting = (value) => {
				submitting = value;
				submit.disabled = value;
				title.disabled = value;
				description.disabled = value;
				assignee.disabled = value;
			};
			form.appendChild(title);
			form.appendChild(description);
			form.appendChild(assignee);
			form.appendChild(submit);
			form.addEventListener("submit", async (submitEvent) => {
				submitEvent.preventDefault();
				submitEvent.stopPropagation();
				if (submitting) return;
				setSubmitting(true);
				try {
					await onCreate?.({
						tileId: tile.id,
						title: title.value.trim(),
						description: description.value.trim(),
						assigneeSessionId: assignee.value,
					});
					const liveForm = foot.querySelector(".task-create-form");
					liveForm?.querySelector(".task-title") &&
						(liveForm.querySelector(".task-title").value = "");
					liveForm?.querySelector(".task-description") &&
						(liveForm.querySelector(".task-description").value = "");
				} catch (error) {
					setSubmitting(false);
					errorLine(foot, error?.message ?? String(error));
				}
			});
			return { form, title };
		};

		if (preservedForm) {
			const { form } = renderCreateForm(preservedForm);
			foot.appendChild(form);
		} else {
			const create = node("button", "task-create-button", "Create Task");
			create.type = "button";
			create.addEventListener("click", (event) => {
				event.stopPropagation();
				const { form, title } = renderCreateForm();
				create.replaceWith(form);
				title.focus();
			});
			foot.appendChild(create);
		}
	}

	if (preservedError) errorLine(foot, preservedError);
	if (retainedReceipt) foot.appendChild(retainedReceipt);
}
