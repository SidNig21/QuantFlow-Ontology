const LIVE_SESSION_STATUSES = new Set(["starting", "running", "blocked"]);
const CLOSED_SESSION_STATUSES = new Set(["closed", "cancelled", "failed"]);

function recorded(value) {
	return value !== null && value !== undefined && String(value).trim().length > 0;
}

function text(value) {
	return recorded(value) ? String(value) : "Not recorded";
}

export function runtimeObservationForSession(snapshot, sessionId) {
	const id = String(sessionId ?? "");
	const row = (Array.isArray(snapshot) ? snapshot : []).find((candidate) =>
		String(candidate?.sessionId ?? "") === id,
	);
	return { live: row?.live === true, runtime: "Native TUI" };
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
	const exactTask = (task?.assignmentState === "assigned" || task?.assignmentState === "unavailable") &&
		task?.assignedToSessionId === session.id;
	const assignmentUnavailable = exactTask && task?.assignmentState === "unavailable";
	const taskStatus = String(task?.status ?? "");
	const work = exactTask
		? taskStatus === "done"
			? "completed"
			: taskStatus === "cancelled"
				? "blocked"
				: task?.reviewProjection?.state === "PUBLICATION BLOCKED"
					? "blocked"
					: taskStatus === "open"
						? assignmentUnavailable ? "blocked" : "working"
						: "Not recorded"
		: "unassigned";
	const missionNoTask = planningDirector?.missionId && planningDirector.missionId === missionBinding.missionId && missionBinding.hasTask === false;
	const taskDisplay = exactTask
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
	const configuredProfile = recorded(definition.runtime_profile)
		? String(definition.runtime_profile)
		: null;
	const observedRuntime = runtimeObservation.live === true && recorded(runtimeObservation.runtime)
		? String(runtimeObservation.runtime)
		: null;
	const runtimeProfile = observedRuntime
		? configuredProfile
			? `${observedRuntime} · profile ${configuredProfile}`
			: observedRuntime
		: text(configuredProfile);
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
		taskId: exactTask ? text(task.taskId) : "Not recorded",
		recruiterReason: reason,
		output,
		outputId: producedArtifact ? text(producedArtifact.id) : "Not recorded",
		missionId: text(missionBinding.missionId),
		capabilityGroups,
		historical: CLOSED_SESSION_STATUSES.has(sessionStatus),
	});
}

/**
 * Build the participant view from the exact session id shared by Canvas and
 * Dock. The session surface is the identity source; role names never select a
 * substitute session. Runtime status is deliberately derived here as well so
 * both consumers cannot disagree about a live/stopped participant.
 */
export function participantViewForSession({
	sessionId,
	sessions = [],
	definitions = [],
	assignments = [],
	world = null,
	planningDirector = null,
	runtimeSnapshot = [],
} = {}) {
	const id = String(sessionId ?? "");
	const worldObject = Array.isArray(world?.objects)
		? world.objects.find((object) => object?.type === "agent_session" && String(object.id ?? "") === id)
		: null;
	const session = (Array.isArray(sessions) ? sessions : []).find((row) => String(row?.id ?? "") === id) ??
		(worldObject ? { id, ...worldObject.fields } : { id });
	const definition = (Array.isArray(definitions) ? definitions : []).find((row) => String(row?.id ?? "") === String(session?.definition_id ?? "")) ?? session;
	const task = (Array.isArray(assignments) ? assignments : []).find((row) =>
		(row?.assignmentState === "assigned" || row?.assignmentState === "unavailable") &&
		String(row?.assignedToSessionId ?? "") === id,
	) ?? null;
	const producedLink = Array.isArray(world?.links)
		? world.links.find((link) => link?.kind === "produces" && String(link?.from_id ?? "") === id)
		: null;
	const producedArtifact = producedLink && Array.isArray(world?.objects)
		? world.objects.find((object) => object?.type === "artifact" && String(object.id ?? "") === String(producedLink.to_id ?? "")) ?? null
		: null;
	const hasTask = Array.isArray(world?.objects) && world.objects.some((object) => object?.type === "task");
	return participantView({
		session,
		definition,
		task,
		runtimeObservation: runtimeObservationForSession(runtimeSnapshot, id),
		missionBinding: {
			missionId: world?.root?.id ?? planningDirector?.missionId,
			hasTask,
			reason: task?.description,
		},
		producedArtifact,
		planningDirector,
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
		["Mission binding", view?.missionId],
	].map(([field, value]) => ({ field, value: text(value) }));
}
