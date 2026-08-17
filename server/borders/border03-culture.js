import { callLLM, hasApiKey } from '../llm.js';
import {
  CULTURE_ANALYSIS_INSTRUCTIONS,
  CULTURE_ANALYSIS_SCHEMA,
  buildCultureAnalysisInput,
} from './culture-analysis-prompt.mjs';

/**
 * Border 03 — 문화 (담당: 민석)
 *
 * 완곡한 표현을 실제 의미로 재해석합니다.
 *   예: "일정상 조금 어려울 것 같아요" → "실제로 막혔을 가능성 높음, 확인 필요"
 *
 * 프롬프트와 스키마는 민석님이 옮겨 준 culture-analysis-prompt.mjs 를 그대로 씁니다.
 * (원본: Rople-ONR 아님 — beluga05 의 border03-culture 브랜치 culture_analysis_prompt.mjs)
 * 이 파일은 그 모듈을 서버 라우트에 연결하는 얇은 껍데기입니다.
 * 프롬프트를 고칠 일이 있으면 이 파일이 아니라 culture-analysis-prompt.mjs 를 고치세요.
 */

export const meta = {
  id: 'border03',
  name: '문화',
  owner: '민석',
  description: '완곡 표현의 실제 의미 재해석 · 오해 지점 · 권장 표현',
  implemented: true,
};

const HEDGE_WORDS = ['어려울', '확인', '검토', '고민', 'maybe', 'might', 'try', 'consider', 'review'];

/** API 키가 없을 때 쓰는 규칙 기반 대체 (민석님 app.py 의 generic_demo 를 옮김) */
function demoAnalyze({ message, senderCulture, receiverCulture }) {
  const hedged = HEDGE_WORDS.some((word) => message.toLowerCase().includes(word));

  return {
    risk_level: hedged ? '높음' : '보통',
    risk_score: hedged ? 72 : 38,
    surface_meaning: `메시지를 그대로 읽으면: ${message}`,
    likely_intent: hedged
      ? '실현 가능성·우선순위·일정에 대한 우려가 말해지지 않았을 수 있습니다. 가설로 두고, 필요한 결정과 기한을 확인하세요.'
      : '정보를 공유하거나 합의를 구하는 것으로 보입니다. 다음 단계와 담당자를 명확히 하세요.',
    misunderstanding_points: [
      `${senderCulture} 와 ${receiverCulture} 는 직설적으로 말하는 정도에 대한 기대가 다를 수 있습니다.`,
      '추론한 의도를 사실로 단정하지 말고 확인 질문으로 검증하세요.',
    ],
    recommended_expression:
      '현재 제약과 그 영향, 다음 업데이트 시점을 정리해 전달하고, 담당자와 기한을 확인해 주세요.',
    next_actions: [
      '현재 상태 · 막힌 지점 · 영향을 문장으로 나눠 쓰기',
      '확인이 필요한 질문 하나만 명확히 던지기',
      '다음 업데이트 시점과 담당자 합의하기',
    ],
    _demo: true,
  };
}

/**
 * @param {object} input
 * @param {string} input.message          해석할 메시지
 * @param {string} [input.senderCulture]  보낸 사람의 문화권 (예: Korea)
 * @param {string} [input.receiverCulture] 받는 사람의 문화권 (예: United States)
 * @param {string} [input.workContext]    업무 맥락 (예: Project timeline)
 */
export async function run({
  message,
  senderCulture = 'Korea',
  receiverCulture = 'United States',
  workContext = '업무 협업',
}) {
  if (!message || !message.trim()) {
    const error = new Error('해석할 메시지가 비어 있습니다.');
    error.status = 400;
    throw error;
  }

  const values = { message: message.trim(), senderCulture, receiverCulture, workContext };

  if (!hasApiKey()) {
    return { ...demoAnalyze(values), meta: { mode: 'demo', model: null, latencyMs: 0 } };
  }

  const { data, model, latencyMs, usage } = await callLLM({
    system: CULTURE_ANALYSIS_INSTRUCTIONS,
    user: buildCultureAnalysisInput(values),
    schema: CULTURE_ANALYSIS_SCHEMA,
    schemaName: 'culture_analysis',
  });

  return {
    ...data,
    meta: {
      mode: 'live',
      model,
      latencyMs,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    },
  };
}
