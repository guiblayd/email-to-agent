import { parseEmail }              from './parser';
import { classifyEmail }           from './classifier';
import { resolveDecision }         from './decision';
import { calculateScores }         from './scoring';
import { generateRecommendations } from './recommendations';
import { computeRelevanceScore }   from './relevance';
import { computeProfileRelevance } from './profiles';
import { inferSensitivity }        from './sensitivity';
import { inferExternalDependency } from './externalDependency';
import type { AnalysisResult }     from '../types';

/**
 * Analyses a raw email string and returns a structured AnalysisResult.
 *
 * Pipeline:
 *   parseEmail → classifyEmail → resolveDecision → calculateScores → generateRecommendations
 *
 * resolveDecision is the structured context layer. It determines availability
 * and what is required (date, time, link policy) based on type × availability —
 * not hardcoded per-field exceptions. scoring.ts consumes that context exclusively.
 *
 * To upgrade from heuristics to real AI: replace the timeout + synchronous
 * pipeline with an async API call returning a ClassificationResult-shaped payload.
 */
export async function analyzeEmail(text: string): Promise<AnalysisResult> {
  await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 700));

  const parsed     = parseEmail(text);
  const classified = classifyEmail(parsed);
  const context    = resolveDecision(parsed, classified);

  const { relevanceScore } = computeRelevanceScore(parsed.rawText);

  const { agentReadinessScore, safeActionScore, scoreBreakdown, reasoning, issues, failureModes,
          priority, urgency, intrinsicScore, priorityScore } =
    calculateScores(parsed, classified, context, relevanceScore);

  const profileAnalysis = computeProfileRelevance(parsed.signalGroups, intrinsicScore);
  const sensitivity        = inferSensitivity(classified.type, classified.subtype, parsed);
  const externalDependency = inferExternalDependency(classified.type, classified.subtype, parsed);

  const { agentInterpretation, idealHumanVersion, idealStructuredVersion } =
    generateRecommendations(parsed, classified, priority, urgency, sensitivity, externalDependency);

  return {
    emailType:              classified.type,
    subtype:                classified.subtype,
    availability:           context.availability,
    confidence:             classified.confidence,
    alternatives:           classified.alternatives,
    intent:                 classified.intent,
    sensitivity,
    externalDependency,
    agentReadinessScore,
    safeActionScore,
    scoreBreakdown,
    reasoning,
    language:               parsed.language,
    priority,
    urgency,
    intrinsicScore,
    relevanceScore,
    priorityScore,
    strongestEvidence:      classified.strongestEvidence,
    decisionReason:         classified.decisionReason,
    contradictions:         classified.contradictions,
    detectedIssues:         [...issues, ...classified.classificationNotes],
    failureModes,
    agentInterpretation,
    idealHumanVersion,
    idealStructuredVersion,
    profileAnalysis,
    detectedData: {
      dates:      parsed.normalizedDates,
      times:      parsed.normalizedTimes,
      timezone:   parsed.timezone,
      ctaText:    parsed.ctaText,
      linksFound: parsed.linksFound,
    },
  };
}
