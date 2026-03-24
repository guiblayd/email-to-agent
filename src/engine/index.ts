import { parseEmail }              from './parser';
import { classifyEmail }           from './classifier';
import { resolveDecision }         from './decision';
import { calculateScores }         from './scoring';
import { generateRecommendations } from './recommendations';
import type { AnalysisResult }     from '../types';

/**
 * Analyses a raw email string and returns a structured AnalysisResult.
 *
 * Pipeline:
 *   parseEmail → classifyEmail → resolveDecision → calculateScores → generateRecommendations
 *
 * resolveDecision is the new structured context layer. It determines availability
 * and what is required (date, time, link policy) based on type × availability —
 * not hardcoded per-field exceptions. scoring.ts consumes that context exclusively.
 *
 * To upgrade from heuristics to AI: replace the timeout + synchronous pipeline
 * with an async API call that returns a ClassificationResult-shaped payload.
 */
export async function analyzeEmail(text: string): Promise<AnalysisResult> {
  await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 700));

  const parsed     = parseEmail(text);
  const classified = classifyEmail(parsed);
  const context    = resolveDecision(parsed, classified);

  const { agentReadinessScore, safeActionScore, scoreBreakdown, reasoning, issues, priority, urgency } =
    calculateScores(parsed, classified, context);

  const { agentInterpretation, idealHumanVersion, idealStructuredVersion } =
    generateRecommendations(parsed, classified, agentReadinessScore, priority, urgency);

  return {
    emailType:              classified.type,
    subtype:                classified.subtype,
    availability:           context.availability,
    confidence:             classified.confidence,
    alternatives:           classified.alternatives,
    intent:                 classified.intent,
    agentReadinessScore,
    safeActionScore,
    scoreBreakdown,
    reasoning,
    language:               parsed.language,
    priority,
    urgency,
    detectedIssues:         issues,
    agentInterpretation,
    idealHumanVersion,
    idealStructuredVersion,
    detectedData: {
      dates:      parsed.normalizedDates,
      times:      parsed.normalizedTimes,
      timezone:   parsed.timezone,
      ctaText:    parsed.ctaText,
      linksFound: parsed.linksFound,
    },
  };
}
