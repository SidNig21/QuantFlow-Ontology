const LIVE_SESSION_STATUSES = new Set(["starting", "running", "blocked"]);
const CLOSED_SESSION_STATUSES = new Set(["closed", "cancelled", "failed"]);

function recorded(value) {
	return value !== null && value !== undefined && String(value).trim().length > 0;
}

function text(value) {
	return recorded(value) ? String(value) : "Not recorded";
}

export function shortParticipantId(id) {
	const value = text(id);
	return value.length <= 14 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`;
}

export function participantView({
	session = {},
	definition = {},
	task = null,
	runtimeObservation = {},
	missionBinding = {},
	producedArtifact = null,
	planningDirector = null,
} = {}) {
	const id = text(session.id);
	const sessionStatus = text(session.status);
	const sessionAxis = LIVE_SESSION_STATUSES.has(sessionStatus)
		? "active"
		: CLOSED_SESSION_STATUSES.has(sessionStatus)
			? "closed"
			: "Not recorded";
	const available = definition?.availability?.available;
	const runtime = runtimeObservation.live === true
		? "running"
		: LIVE_SESSION_STATUSES.has(sessionStatus)
			? "starting"
			: available === false
				? "unavailable"
				: CLOSED_SESSION_STATUSES.has(sessionStatus)
					? "stopped"
					: "Not recorded";
	const exactAssignment = task?.assignmentState === "assigned" && task?.assignedToSessionId === session.id;
	const taskStatus = String(task?.status ?? "");
	const work = exactAssignment
		? taskStatus === "done"
			? "completed"
			: taskStatus === "cancelled"
				? "blocked"
				: task?.reviewProjection?.state === "PUBLICATION BLOCKED"
					? "blocked"
					: taskStatus === "open"
						? "working"
						: "Not recorded"
		: "unassigned";
	const missionNoTask = planningDirector?.missionId && planningDirector.missionId === missionBinding.missionId && missionBinding.hasTask === false;
	const taskDisplay = exactAssignment
		? text(task.title)
		: planningDirector?.sessionId === session.id && missionNoTask
			? "Planning mission"
			: "Not recorded";
	const canLaunchSameProfile = definition && Object.keys(definition).length > 0 && available !== false;
	const recovery = LIVE_SESSION_STATUSES.has(sessionStatus)
		? "not restartable"
		: canLaunchSameProfile
			? "restartable"
			: "not restartable";
	const role = text(definition.role ?? session.role ?? definition.display_name);
	const runtimeProfile = text(definition.runtime_profile ?? runtimeObservation.runtime);
	const reason = text(missionBinding.reason ?? session.creation_reason ?? session.reason);
	const capabilityGroups = Array.isArray(definition.capability_groups)
		? definition.capability_groups.map(text)
		: [];
	const output = producedArtifact
		? `${text(producedArtifact.fields?.kind ?? producedArtifact.kind)} · ${shortParticipantId(producedArtifact.id)}`
		: "Not recorded";
	return Object.freeze({
		id,
		displayName: text(definition.display_name ?? session.display_name ?? session.label),
		role,
		runtime: runtimeProfile,
		session: sessionAxis,
		runtimeState: runtime,
		work,
		recovery,
		task: taskDisplay,
		taskId: exactAssignment ? text(task.taskId) : "Not recorded",
		recruiterReason: reason,
		output,
		outputId: producedArtifact ? text(producedArtifact.id) : "Not recorded",
		missionId: text(missionBinding.missionId),
		capabilityGroups,
	});
}

export function participantFieldRows(view) {
	return [
		["role", view?.role],
		["runtime", view?.runtime],
		["session", view?.session],
		["runtime state", view?.runtimeState],
		["work", view?.work],
		["recovery", view?.recovery],
		["recruiter / reason", view?.recruiterReason],
		["Task", view?.task],
		["output", view?.output],
	].map(([field, value]) => ({ field, value: text(value) }));
}
