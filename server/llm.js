import OpenAI from 'openai';

/**
 * border 모듈들이 공유하는 LLM 호출 래퍼.
 *
 * 팀 전체가 OpenAI 크레딧 하나(조직 단위)로 굴러가도록 OpenAI Responses API 를 씁니다.
 * 팀원들은 이 파일을 건드릴 필요 없이 callLLM({ system, user, schema }) 만 쓰면 됩니다.
 */

const DEFAULT_MODEL = process.env.OPENAI_HANDOFF_MODEL || 'gpt-5.4';

export function hasApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

let client = null;
function getClient() {
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

/** Responses API 응답에서 텍스트만 뽑아냅니다. (server/index.js 와 동일한 방식) */
function extractOutputText(response) {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  const parts = [];
  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('');
}

/**
 * JSON 스키마를 강제해서 모델을 호출합니다.
 * strict: true 라서 "JSON 으로 답해줘" 라고 부탁할 필요가 없고,
 * 마크다운 코드펜스 같은 게 섞여 나오지 않습니다.
 *
 * @param {object} opts
 * @param {string} opts.system   시스템 지시문
 * @param {string} opts.user     유저 입력
 * @param {object} opts.schema   JSON Schema (모든 속성이 required + additionalProperties:false 여야 함)
 * @param {string} [opts.schemaName='result']
 * @returns {Promise<{ data: object, usage: object, model: string, latencyMs: number }>}
 */
export async function callLLM({ system, user, schema, schemaName = 'result' }) {
  const startedAt = Date.now();

  const response = await getClient().responses.create({
    model: DEFAULT_MODEL,
    store: false,
    input: [
      { role: 'system', content: [{ type: 'input_text', text: system }] },
      { role: 'user', content: [{ type: 'input_text', text: user }] },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  const outputText = extractOutputText(response);
  if (!outputText) {
    throw new Error('모델 응답에 텍스트가 없습니다.');
  }

  return {
    data: JSON.parse(outputText),
    usage: response.usage ?? {},
    model: response.model ?? DEFAULT_MODEL,
    latencyMs: Date.now() - startedAt,
  };
}
