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

export function renderTaskFoot(dom, tile, {
	focused = false,
	sessions = [],
	assignments = [],
	onCreate,
	onReassign,
	onCancel,
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
	foot.replaceChildren();
	if (!tile?.sessionId) return;

	const session = (Array.isArray(sessions) ? sessions : []).find((row) => row?.id === tile.sessionId);
	const fact = taskFactForSession(assignments, tile.sessionId);
	const factRow = node("div", `task-fact task-fact-${fact.state}`);
	factRow.appendChild(node("span", "task-fact-label", fact.text));
	foot.appendChild(factRow);

	if (fact.task?.status === "open" && fact.task.assignedToSessionId === tile.sessionId) {
		const actions = node("div", "task-foot-actions");
		const reassign = node("button", "task-action", "Reassign");
		const cancel = node("button", "task-action task-action-cancel", "Cancel");
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
		actions.appendChild(reassign);
		actions.appendChild(cancel);
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
}
