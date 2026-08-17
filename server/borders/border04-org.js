import { callClaude, hasApiKey } from '../llm.js';
import { getLastBriefing, saveBriefing } from '../store.js';
import { demoAnalyze } from './border04-demo.js';

/**
 * Border 04 — 조직 (담당: 지원)
 *
 * 여러 툴(Slack/GitHub/Notion)에 흩어진 기록을 프로젝트 단위로 통합하고,
 *   1) 중복 제거   2) 결정사항 분리   3) 작업사항 분리   4) 지난 브리핑 대비 변경점
 * 을 만들어 냅니다.
 *
 * AI 가 핵심인 지점: "문자열이 비슷한가" 가 아니라 "가리키는 사건이 같은가" 를 판단해야
 * Slack 의 "결제 다 됐어요" 와 GitHub 의 "merged PR #42" 를 한 건으로 묶을 수 있습니다.
 * 이건 규칙으로는 안 되고 의미 이해가 필요합니다.
 */

export const meta = {
  id: 'border04',
  name: '조직',
  owner: '지원',
  description: '여러 툴의 기록을 프로젝트 단위로 통합 · 중복 제거 · 결정/작업 분리 · 변경점 추출',
};

const SYSTEM_PROMPT = `당신은 국경을 넘어 일하는 팀의 "인수인계 브리핑" 을 만드는 분석기입니다.
입력은 한 팀원이 하루 동안 Slack / GitHub / Notion 등에 남긴 원시 작업 로그이고,
출력을 읽는 사람은 몇 시간 뒤 다른 시간대에서 출근하는 동료입니다.
그 사람은 오늘 무슨 일이 있었는지 전혀 모릅니다.

아래 네 가지를 판단해 JSON 으로만 반환하세요.

## 1. deduped_logs — 중복 제거된 로그
- 같은 사건이 툴마다 다른 표현으로 여러 번 기록됩니다. 표현이 달라도 **가리키는 사건이 같으면 한 건으로 병합**하세요.
  예) Slack "결제 API 다 됐어요" + GitHub "Merged PR #42 payment API" + Notion "결제 API 구현 완료" → 1건
- 판단 기준은 문자열 유사도가 아니라 의미입니다. 단어가 하나도 안 겹쳐도 같은 사건이면 병합합니다.
- 반대로 단어가 비슷해도 다른 사건이면(예: PR #42 를 "열었다" vs "머지했다" 가 아니라, PR #42 와 PR #47) 병합하지 마세요.
- 같은 작업의 진행 단계가 이어지는 경우(올림 → 리뷰 → 머지)는 **가장 마지막 상태를 content 로** 쓰고 앞 단계는 병합합니다.
- content 는 가장 정보가 많은 표현으로 다시 쓰되, 원문에 없는 사실을 추가하지 마세요.
- sources 에는 병합한 원문 줄을 그대로 모두 넣습니다.
- 인수인계에 필요 없는 노이즈(인사, 잡담, 봇 알림, 이모지만 있는 줄)는 결과에서 빼고 noise_removed 에 개수만 셉니다.

## 2. decisions — 결정사항 (이미 확정된 것만)
- "~하기로 했다", 합의/승인, 머지된 PR, 확정된 스펙·일정·정책.
- 아직 논의 중, 제안 단계, 누군가 물어보기만 한 것은 **결정사항이 아닙니다**. 그건 작업사항이거나 아예 빼세요.
- detail 에는 "그래서 다음 사람이 뭘 전제로 일하면 되는지" 를 한 문장으로 씁니다.

## 3. tasks — 작업사항 (진행중이거나 앞으로 할 일)
- status 는 셋 중 하나: in_progress(진행중) / todo(아직 시작 안 함) / blocked(외부 요인·다른 사람 때문에 막힘).
- blocked 는 특히 중요합니다. 다음 시간대 사람이 대신 풀어줄 수 있는 게 있는지 판단할 근거가 됩니다.
- owner 를 로그에서 알 수 없으면 빈 문자열로 두세요. 추측해서 채우지 마세요.

## 4. changes — 지난 브리핑 대비 변경점
- previous_briefing 이 주어지면, **그 이후로 새로 생기거나 바뀐 것만** 넣습니다. 이미 지난 브리핑에 있던 그대로인 항목은 넣지 마세요.
- type: new(새로 생김) / updated(내용이나 상태가 바뀜, 예: in_progress → 완료) / removed(취소·철회됨).
- detail 에는 "무엇이 어떻게 바뀌었는지" 를 씁니다. 예: "진행중 → 머지 완료".
- previous_briefing 이 비어 있으면 changes 는 빈 배열로 두고 is_first_briefing 을 true 로 하세요.

## 공통 규칙
- 로그에 없는 내용을 지어내지 마세요. 근거가 없으면 항목을 만들지 않습니다.
- source 에는 판단 근거가 된 원문을 그대로 인용합니다 (요약하지 말 것).
- 모든 출력 텍스트는 한국어로 씁니다.
- summary 는 다음 담당자가 30초 안에 읽고 상황을 파악할 수 있는 한 문단입니다. 항목 나열이 아니라 서술로 쓰세요.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'is_first_briefing', 'noise_removed', 'deduped_logs', 'decisions', 'tasks', 'changes'],
  properties: {
    summary: {
      type: 'string',
      description: '다음 시간대 담당자가 30초 안에 읽을 한 문단 요약',
    },
    is_first_briefing: {
      type: 'boolean',
      description: '이전 브리핑이 없어서 변경점을 계산할 수 없는 경우 true',
    },
    noise_removed: {
      type: 'integer',
      description: '인수인계에 불필요하다고 판단해 제외한 로그 줄 수',
    },
    deduped_logs: {
      type: 'array',
      description: '중복이 병합된 로그. 원본 순서를 최대한 유지합니다.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['content', 'sources', 'merged_count'],
        properties: {
          content: { type: 'string', description: '병합 후의 대표 표현' },
          sources: {
            type: 'array',
            description: '병합에 사용된 원문 줄 (그대로 인용)',
            items: { type: 'string' },
          },
          merged_count: { type: 'integer', description: '이 항목으로 합쳐진 원문 줄 수' },
        },
      },
    },
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['content', 'detail', 'source'],
        properties: {
          content: { type: 'string', description: '확정된 결정 한 줄' },
          detail: { type: 'string', description: '다음 사람이 무엇을 전제로 일하면 되는지' },
          source: { type: 'string', description: '근거가 된 원문 인용' },
        },
      },
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['content', 'status', 'owner', 'source'],
        properties: {
          content: { type: 'string' },
          status: { type: 'string', enum: ['in_progress', 'todo', 'blocked'] },
          owner: { type: 'string', description: '로그에서 알 수 없으면 빈 문자열' },
          source: { type: 'string', description: '근거가 된 원문 인용' },
        },
      },
    },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['content', 'type', 'detail'],
        properties: {
          content: { type: 'string' },
          type: { type: 'string', enum: ['new', 'updated', 'removed'] },
          detail: { type: 'string', description: '무엇이 어떻게 바뀌었는지' },
        },
      },
    },
  },
};

function buildUserMessage({ projectId, logText, previous }) {
  const previousBlock = previous
    ? JSON.stringify(
        {
          savedAt: previous.savedAt,
          decisions: previous.decisions,
          tasks: previous.tasks,
        },
        null,
        2,
      )
    : '(없음 — 이 프로젝트의 첫 브리핑입니다)';

  return `<project>${projectId}</project>

<previous_briefing>
${previousBlock}
</previous_briefing>

<raw_logs>
${logText}
</raw_logs>`;
}

/**
 * @param {object} input
 * @param {string} input.logText    붙여넣은 원시 작업 로그
 * @param {string} input.projectId  프로젝트 식별자
 */
export async function run({ logText, projectId = 'default' }) {
  if (!logText || !logText.trim()) {
    const error = new Error('작업 로그가 비어 있습니다.');
    error.status = 400;
    throw error;
  }

  const previous = await getLastBriefing(meta.id, projectId);
  const inputLineCount = logText.split('\n').filter((line) => line.trim()).length;

  let result;
  let runMeta;

  if (hasApiKey()) {
    const { data, usage, model, latencyMs } = await callClaude({
      system: SYSTEM_PROMPT,
      user: buildUserMessage({ projectId, logText, previous }),
      schema: SCHEMA,
      maxTokens: 8000,
    });
    result = data;
    runMeta = {
      mode: 'live',
      model,
      latencyMs,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    };
  } else {
    const { data, latencyMs } = demoAnalyze({ logText, previous });
    result = data;
    runMeta = { mode: 'demo', model: null, latencyMs };
  }

  const briefing = {
    ...result,
    projectId,
    generatedAt: new Date().toISOString(),
    stats: {
      inputLines: inputLineCount,
      outputLines: result.deduped_logs.length,
      mergedLines: Math.max(0, inputLineCount - result.deduped_logs.length - result.noise_removed),
      noiseRemoved: result.noise_removed,
    },
    meta: runMeta,
  };

  await saveBriefing(meta.id, projectId, briefing);
  return briefing;
}
