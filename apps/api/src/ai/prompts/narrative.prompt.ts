import type { ChatMessage } from '../provider.js';
import type { ComplianceEvaluationResult } from '../../modules/agent/agent.rules.js';

/**
 * The `COMPLIANCE_JSON:` marker is a convention the mock provider parses to
 * phrase a grounded summary from the structured evaluation. Real providers
 * ignore the marker and just read the JSON + instruction naturally.
 */
export function buildNarrativePrompt(evaluation: ComplianceEvaluationResult): ChatMessage[] {
  return [
    {
      role: 'system',
      content:
        'Summarize this CA-firm client compliance evaluation in 1-2 plain-English sentences for the firm\'s dashboard. Be specific about counts and filing types, not generic.',
    },
    { role: 'user', content: `COMPLIANCE_JSON: ${JSON.stringify(evaluation)}` },
  ];
}
