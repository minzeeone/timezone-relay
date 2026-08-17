/**
 * BorderBridge Culture AI prompt module
 * Import this file from a server-side JavaScript route or API handler.
 * Do not expose an OpenAI API key in browser-side code.
 */

export const CULTURE_ANALYSIS_INSTRUCTIONS = `
You are BorderBridge, an intercultural workplace communication assistant.
Analyze a workplace message as a hypothesis, never as a fact.
Avoid stereotypes: cultural contexts can influence communication, but they do not determine an individual's intent.
Write every result field in Korean. Be concise and useful for a workplace audience.
Recommend wording in the receiver's likely working language when appropriate.
Return only data matching the supplied JSON schema.
`.trim();

export const CULTURE_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    risk_level: {
      type: "string",
      enum: ["\ub0ae\uc74c", "\ubcf4\ud1b5", "\ub192\uc74c"],
    },
    risk_score: { type: "integer", minimum: 0, maximum: 100 },
    surface_meaning: { type: "string" },
    likely_intent: { type: "string" },
    misunderstanding_points: {
      type: "array",
      items: { type: "string" },
    },
    recommended_expression: { type: "string" },
    next_actions: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "risk_level",
    "risk_score",
    "surface_meaning",
    "likely_intent",
    "misunderstanding_points",
    "recommended_expression",
    "next_actions",
  ],
  additionalProperties: false,
};

export function buildCultureAnalysisInput({
  message,
  senderCulture,
  receiverCulture,
  workContext,
}) {
  return [
    "Analyze this workplace message.",
    `Sender cultural context: ${senderCulture}`,
    `Receiver cultural context: ${receiverCulture}`,
    `Work context: ${workContext}`,
    `Message: ${message}`,
  ].join("\n");
}

/**
 * Spread the returned object into openai.responses.create(...).
 * Example:
 * const response = await openai.responses.create({
 *   model: "gpt-4.1-mini",
 *   ...createCultureAnalysisRequest(values),
 * });
 */
export function createCultureAnalysisRequest(values) {
  return {
    instructions: CULTURE_ANALYSIS_INSTRUCTIONS,
    input: buildCultureAnalysisInput(values),
    text: {
      format: {
        type: "json_schema",
        name: "culture_analysis",
        strict: true,
        schema: CULTURE_ANALYSIS_SCHEMA,
      },
    },
  };
}
