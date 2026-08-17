import Anthropic from '@anthropic-ai/sdk';

/**
 * 4개 border 모듈이 공유하는 Claude 호출 래퍼.
 * 팀원들은 이 파일을 건드릴 필요 없이 callClaude({ system, user, schema }) 만 쓰면 됩니다.
 */

const MODEL = 'claude-opus-5';

export function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client = null;
function getClient() {
  client ??= new Anthropic(); // ANTHROPIC_API_KEY 를 환경변수에서 자동으로 읽습니다
  return client;
}

/**
 * JSON 스키마를 강제해서 Claude 를 호출합니다.
 * output_config.format 을 쓰기 때문에 "JSON 으로 답해줘" 라고 부탁할 필요가 없고,
 * 파싱 실패나 마크다운 코드펜스 같은 게 섞여 나오지 않습니다.
 *
 * @param {object}   opts
 * @param {string}   opts.system   시스템 프롬프트 (프롬프트 캐싱 적용)
 * @param {string}   opts.user     유저 메시지
 * @param {object}   opts.schema   JSON Schema
 * @param {number}  [opts.maxTokens=8000]
 * @returns {Promise<{ data: object, usage: object, model: string, latencyMs: number }>}
 */
export async function callClaude({ system, user, schema, maxTokens = 8000 }) {
  const startedAt = Date.now();

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    // 시스템 프롬프트는 매 요청마다 동일하므로 캐싱해서 비용을 줄입니다.
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
    output_config: { format: { type: 'json_schema', schema } },
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('모델이 요청 처리를 거부했습니다. 입력 로그 내용을 확인해 주세요.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('응답이 너무 길어 잘렸습니다. 로그를 나눠서 넣거나 maxTokens 를 올려 주세요.');
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('모델 응답에 텍스트 블록이 없습니다.');

  return {
    data: JSON.parse(textBlock.text),
    usage: response.usage,
    model: response.model,
    latencyMs: Date.now() - startedAt,
  };
}
