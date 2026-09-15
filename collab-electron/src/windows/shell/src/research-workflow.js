function unique(rows) {
	return rows.length === 1 ? rows[0] : null;
}

/** Resolve one exact investigation closure. Ambiguous or unrelated rows stay off the Canvas. */
export function deriveResearchWorkflow(world) {
	const objects = Array.isArray(world?.objects) ? world.objects : [];
	const links = Array.isArray(world?.links) ? world.links : [];
	const byId = new Map(objects.map((entry) => [String(entry.id), entry]));
	const object = (id) => byId.get(String(id ?? "")) ?? null;
	const linksFrom = (id, kind) => links.filter((link) => link.from_id === id && (!kind || link.kind === kind));
	const linksTo = (id, kind) => links.filter((link) => link.to_id === id && (!kind || link.kind === kind));
	const root = object(world?.root?.id);
	const currentReport = object(world?.current_report_id);
	const evaluation = currentReport
		? unique(objects.filter((entry) => entry.type === "evaluation" && (
			entry.fields?.report_artifact_id === currentReport.id ||
			links.some((link) => link.kind === "gates" && link.from_id === entry.id && link.to_id === currentReport.id)
		)))
		: null;
	const sourceWork = evaluation?.fields?.source_work && typeof evaluation.fields.source_work === "object"
		? evaluation.fields.source_work : null;
	const rootedTask = root?.type === "task" ? root : null;
	const rootedMission = root?.type === "mission" ? root : object(unique(linksFrom(rootedTask?.id, "belongs_to"))?.to_id);
	const openMissionTasks = rootedMission ? objects.filter((entry) => entry.type === "task" && entry.fields?.status === "open" && links.some((link) => link.kind === "belongs_to" && link.from_id === entry.id && link.to_id === rootedMission.id)) : [];
	const activeReviewTask = unique(openMissionTasks.filter((entry) => typeof entry.fields?.review_source_task_id === "string"));
	const activeMissionTask = unique(openMissionTasks.filter((entry) => typeof entry.fields?.review_source_task_id !== "string"));
	const sourceTask = sourceWork
		? object(sourceWork.source_task_id)
		: (rootedTask ?? object(activeReviewTask?.fields?.review_source_task_id) ?? activeMissionTask);
	const mission = rootedMission ?? object(unique(linksFrom(sourceTask?.id, "belongs_to"))?.to_id);
	const exactTaskRuns = sourceTask ? objects.filter((entry) => entry.type === "run" && entry.fields?.source_task_id === sourceTask.id) : [];
	const run = object(world?.current_attempt_run_id) ?? (sourceWork ? object(sourceWork.run_id) : unique(exactTaskRuns));
	const rawArtifact = sourceWork ? object(sourceWork.result_artifact_id) : object(run?.fields?.result_artifact_id);
	const executor = sourceWork ? object(sourceWork.executor_session_id) : object(run?.fields?.executor_session_id ?? unique(linksFrom(sourceTask?.id, "assigned_to"))?.to_id);
	const originalDelegator = object(unique(linksFrom(sourceTask?.id, "delegated_by"))?.to_id ?? sourceTask?.fields?.original_delegator_session_id ?? sourceTask?.fields?.delegator_session_id);
	const director = object(unique(linksFrom(sourceTask?.id, "coordinated_by"))?.to_id ?? sourceTask?.fields?.current_coordinator_session_id ?? originalDelegator?.id);
	const reviewTask = object(evaluation?.fields?.review_task_id) ?? activeReviewTask;
	const critic = object(unique(linksFrom(evaluation?.id, "performed_by"))?.to_id ?? evaluation?.fields?.critic_session_id ?? unique(linksFrom(reviewTask?.id, "assigned_to"))?.to_id);
	const investigation = unique(linksFrom(mission?.id, "investigates"));
	const marketQuote = object(investigation?.to_id);
	const marketInstrument = object(unique(linksFrom(marketQuote?.id, "quotes"))?.to_id);
	const marketEvent = object(unique(linksFrom(marketInstrument?.id, "offered_on"))?.to_id);
	const marketVenue = object(unique(linksTo(marketInstrument?.id, "lists"))?.from_id);
	return { objects, links, byId, mission, sourceTask, sourceWork, executor, director, originalDelegator, run, attemptRuns: exactTaskRuns, rawArtifact, evaluation, reviewTask, critic, currentReport, marketQuote, marketInstrument, marketEvent, marketVenue, reportIds: Array.isArray(world?.report_ids) ? world.report_ids : [] };
}

export function criticMaterialAttack(workflow) {
	const findingsId = workflow?.evaluation?.fields?.findings_artifact_id;
	if (!findingsId) return null;
	const artifact = workflow?.byId?.get?.(String(findingsId)) ?? workflow?.objects?.find?.((entry) => entry.id === findingsId);
	const preview = artifact?.fields?.receipt?.preview;
	if (typeof preview !== "string") return null;
	try {
		const findings = JSON.parse(preview);
		if (!Array.isArray(findings)) return null;
		const attack = findings.find((finding) => finding?.code === "material_attack");
		return typeof attack?.message === "string" && attack.message.trim() ? attack.message.trim() : null;
	} catch {
		return null;
	}
}

/** Exact context for Inspect; never a claim that a field dump is lineage. */
export function contextualInspectReceipt(workflow, selected) {
	if (!workflow || !selected) return null;
	const relevantLinks = workflow.links.filter((link) => link.from_id === selected.id || link.to_id === selected.id);
	const evidence = [workflow.marketQuote, workflow.marketInstrument, workflow.marketEvent, workflow.run, workflow.rawArtifact]
		.filter(Boolean).filter((entry, index, rows) => rows.findIndex((candidate) => candidate.id === entry.id) === index);
	return {
		selected: { type: selected.type, id: selected.id, fields: selected.fields },
		relationships: relevantLinks,
		evidence: evidence.map((entry) => ({ type: entry.type, id: entry.id, fields: entry.fields })),
		evaluation: workflow.evaluation ? { type: workflow.evaluation.type, id: workflow.evaluation.id, fields: workflow.evaluation.fields } : null,
		source_work: workflow.sourceWork,
		attempts: workflow.attemptRuns?.map((entry) => ({ type: entry.type, id: entry.id, fields: entry.fields })) ?? [],
		original_delegator: workflow.originalDelegator ? { type: workflow.originalDelegator.type, id: workflow.originalDelegator.id, fields: workflow.originalDelegator.fields } : null,
		current_coordinator: workflow.director ? { type: workflow.director.type, id: workflow.director.id, fields: workflow.director.fields } : null,
		revisions: workflow.reportIds,
	};
}
