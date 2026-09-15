function unique(rows) {
	return rows.length === 1 ? rows[0] : null;
}

function sourceWorkOf(evaluation) {
	const value = evaluation?.fields?.source_work;
	return value && typeof value === "object" && !Array.isArray(value) ? value : null;
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
	const reportEvaluation = currentReport
		? unique(objects.filter((entry) => entry.type === "evaluation" && (
			entry.fields?.report_artifact_id === currentReport.id ||
			links.some((link) => link.kind === "gates" && link.from_id === entry.id && link.to_id === currentReport.id)
		)))
		: null;
	const rootedTask = root?.type === "task" ? root : null;
	const rootedSourceTask = rootedTask?.fields?.review_source_task_id ? object(rootedTask.fields.review_source_task_id) : rootedTask;
	const rootedMission = root?.type === "mission" ? root : object(unique(linksFrom(rootedTask?.id, "belongs_to"))?.to_id);
	const openMissionTasks = rootedMission ? objects.filter((entry) => entry.type === "task" && entry.fields?.status === "open" && links.some((link) => link.kind === "belongs_to" && link.from_id === entry.id && link.to_id === rootedMission.id)) : [];
	const missionReviewTask = unique(openMissionTasks.filter((entry) => typeof entry.fields?.review_source_task_id === "string"));
	const activeMissionTask = unique(openMissionTasks.filter((entry) => typeof entry.fields?.review_source_task_id !== "string"));
	const projectedEvaluations = objects.filter((entry) => entry.type === "evaluation" && sourceWorkOf(entry));
	const evaluatedSourceTask = unique(projectedEvaluations.map((entry) => object(sourceWorkOf(entry)?.source_task_id)).filter(Boolean));
	const missionSourceTask = rootedMission ? unique(objects.filter((entry) => entry.type === "task" && typeof entry.fields?.review_source_task_id !== "string" && links.some((link) => link.kind === "belongs_to" && link.from_id === entry.id && link.to_id === rootedMission.id))) : null;
	const reportSourceWork = sourceWorkOf(reportEvaluation);
	const sourceTask = reportSourceWork
		? object(reportSourceWork.source_task_id)
		: (rootedSourceTask ?? object(missionReviewTask?.fields?.review_source_task_id) ?? activeMissionTask ?? evaluatedSourceTask ?? missionSourceTask);
	const mission = rootedMission ?? object(unique(linksFrom(sourceTask?.id, "belongs_to"))?.to_id);
	const activeReviewTask = unique(objects.filter((entry) => entry.type === "task" && entry.fields?.status === "open" && entry.fields?.review_source_task_id === sourceTask?.id));
	const exactEvaluations = projectedEvaluations.filter((entry) => sourceWorkOf(entry)?.source_task_id === sourceTask?.id);
	const evaluationById = new Map(exactEvaluations.map((entry) => [entry.id, entry]));
	const evaluationDepth = (entry, seen = new Set()) => {
		if (!entry || seen.has(entry.id)) return 0;
		seen.add(entry.id);
		const triggeringId = object(entry.fields?.review_task_id)?.fields?.review_triggering_evaluation_id;
		return triggeringId && evaluationById.has(triggeringId) ? 1 + evaluationDepth(evaluationById.get(triggeringId), seen) : 0;
	};
	const evaluations = exactEvaluations
		.sort((left, right) => {
			const leftTask = object(left.fields?.review_task_id);
			const rightTask = object(right.fields?.review_task_id);
			return evaluationDepth(left) - evaluationDepth(right) || String(leftTask?.fields?.review_created_at ?? "").localeCompare(String(rightTask?.fields?.review_created_at ?? "")) || String(left.id).localeCompare(String(right.id));
		});
	const triggeringEvaluation = object(activeReviewTask?.fields?.review_triggering_evaluation_id);
	const triggeredIds = new Set(objects.filter((entry) => entry.type === "task" && entry.fields?.review_source_task_id === sourceTask?.id).map((entry) => entry.fields?.review_triggering_evaluation_id).filter(Boolean));
	const terminalEvaluation = unique(evaluations.filter((entry) => !triggeredIds.has(entry.id)));
	const evaluation = reportEvaluation ?? (triggeringEvaluation?.type === "evaluation" ? triggeringEvaluation : null) ?? terminalEvaluation ?? evaluations.at(-1) ?? null;
	const sourceWork = sourceWorkOf(evaluation);
	const exactTaskRuns = sourceTask ? objects.filter((entry) => entry.type === "run" && entry.fields?.source_task_id === sourceTask.id) : [];
	const run = object(world?.current_attempt_run_id) ?? (sourceWork ? object(sourceWork.run_id) : unique(exactTaskRuns));
	const rawArtifact = sourceWork ? object(sourceWork.result_artifact_id) : object(run?.fields?.result_artifact_id);
	const executor = sourceWork ? object(sourceWork.executor_session_id) : object(run?.fields?.executor_session_id ?? unique(linksFrom(sourceTask?.id, "assigned_to"))?.to_id);
	const originalDelegator = object(unique(linksFrom(sourceTask?.id, "delegated_by"))?.to_id ?? sourceTask?.fields?.original_delegator_session_id ?? sourceTask?.fields?.delegator_session_id);
	const director = object(unique(linksFrom(sourceTask?.id, "coordinated_by"))?.to_id ?? sourceTask?.fields?.current_coordinator_session_id ?? originalDelegator?.id);
	const reviewTask = activeReviewTask ?? object(evaluation?.fields?.review_task_id);
	const critic = object(unique(linksFrom(evaluation?.id, "performed_by"))?.to_id ?? evaluation?.fields?.critic_session_id ?? unique(linksFrom(reviewTask?.id, "assigned_to"))?.to_id);
	const investigation = unique(linksFrom(mission?.id, "investigates"));
	const marketQuote = object(investigation?.to_id);
	const marketInstrument = object(unique(linksFrom(marketQuote?.id, "quotes"))?.to_id);
	const marketEvent = object(unique(linksFrom(marketInstrument?.id, "offered_on"))?.to_id);
	const marketVenue = object(unique(linksTo(marketInstrument?.id, "lists"))?.from_id);
	return { objects, links, byId, mission, sourceTask, sourceWork, executor, director, originalDelegator, run, attemptRuns: exactTaskRuns, rawArtifact, evaluations, evaluation, reviewTask, critic, currentReport, marketQuote, marketInstrument, marketEvent, marketVenue, reportIds: Array.isArray(world?.report_ids) ? world.report_ids : [] };
}

export function criticMaterialAttack(workflow, evaluation = workflow?.evaluation) {
	const findingsId = evaluation?.fields?.findings_artifact_id;
	if (!findingsId) return null;
	const artifact = workflow?.byId?.get?.(String(findingsId)) ?? workflow?.objects?.find?.((entry) => entry.id === findingsId);
	const preview = artifact?.fields?.receipt?.preview;
	if (typeof preview !== "string") return null;
	try {
		const findings = JSON.parse(preview);
		if (!Array.isArray(findings)) return null;
		const attack = findings.find((finding) => finding?.code === "material_attack") ?? findings.find((finding) => typeof finding?.message === "string" && finding.message.trim());
		return typeof attack?.message === "string" && attack.message.trim() ? attack.message.trim() : null;
	} catch {
		return null;
	}
}

export function blockedReviewPresentation(workflow) {
	if (!workflow || workflow.currentReport || !workflow.evaluation || !["rejects", "inconclusive"].includes(workflow.evaluation.fields?.verdict)) return null;
	const evaluations = Array.isArray(workflow.evaluations) && workflow.evaluations.length ? workflow.evaluations : [workflow.evaluation];
	return {
		state: "Publication blocked",
		evaluations: evaluations.map((evaluation, index) => ({
			index: index + 1,
			id: evaluation.id,
			verdict: String(evaluation.fields?.verdict ?? ""),
			attack: criticMaterialAttack(workflow, evaluation) ?? (typeof evaluation.fields?.rationale === "string" && evaluation.fields.rationale.trim() ? evaluation.fields.rationale.trim() : null) ?? (typeof evaluation.fields?.block_reason?.message === "string" && evaluation.fields.block_reason.message.trim() ? evaluation.fields.block_reason.message.trim() : null),
		})),
		reviewInProgress: workflow.reviewTask?.fields?.status === "open",
		secondCriticInProgress: workflow.reviewTask?.fields?.status === "open" && workflow.reviewTask?.fields?.review_kind === "second_critic",
	};
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
		evaluations: workflow.evaluations?.map((entry) => ({ type: entry.type, id: entry.id, fields: entry.fields })) ?? [],
		source_work: workflow.sourceWork,
		attempts: workflow.attemptRuns?.map((entry) => ({ type: entry.type, id: entry.id, fields: entry.fields })) ?? [],
		original_delegator: workflow.originalDelegator ? { type: workflow.originalDelegator.type, id: workflow.originalDelegator.id, fields: workflow.originalDelegator.fields } : null,
		current_coordinator: workflow.director ? { type: workflow.director.type, id: workflow.director.id, fields: workflow.director.fields } : null,
		revisions: workflow.reportIds,
	};
}
