/**
 * Border 02 — 언어 × Border 04 — 조직
 *
 * Border 04 가 만든 인수인계서를 인계받는 사람의 언어로 옮깁니다.
 * 원래 화면에는 일본어 번역문이 목업으로 박혀 있어서, 인계자가 미국·영국
 * 사람이어도 일본어가 나왔습니다.
 *
 * 사람 이름, 프로젝트명, PR 번호, IAM Role 같은 고유명사·기술 용어는
 * 번역하지 않고 그대로 둡니다. 인수인계에서 그게 바뀌면 못 찾습니다.
 */

import { callLLM, hasApiKey } from '../llm.js';

/** 국가 코드 → 번역할 언어. COUNTRY_DB(Border 01)와 같은 코드를 씁니다. */
const LANGUAGE_BY_COUNTRY = {
  KR: { name: '한국어', englishName: 'Korean' },
  JP: { name: '일본어', englishName: 'Japanese' },
  US: { name: '영어', englishName: 'English' },
  GB: { name: '영어', englishName: 'English' },
  UK: { name: '영어', englishName: 'English' },
  SG: { name: '영어', englishName: 'English' },
  DE: { name: '독일어', englishName: 'German' },
  RU: { name: '러시아어', englishName: 'Russian' },
};

export function languageForCountry(countryCode) {
  return LANGUAGE_BY_COUNTRY[countryCode] ?? LANGUAGE_BY_COUNTRY.US;
}

const SYSTEM_PROMPT = `당신은 글로벌 협업 도구의 인수인계 문서 번역기입니다.
한국어로 작성된 인수인계서를 인계받는 사람의 언어로 옮깁니다.

번역 원칙
- 업무 문서 말투로 씁니다. 과하게 공손하거나 캐주얼하지 않게, 동료에게 보고하듯 씁니다.
- 다음은 **절대 번역하지 않고 원문 그대로** 둡니다:
  - 사람 이름 (김의중, 카오루코, 지원 등)
  - 프로젝트명 (Aurora, Orbit, Nova)
  - 기술 용어와 고유명사 (PR #128, IAM Role, staging, production, JSON, main, QA)
  - 이슈·티켓 번호 (#131)
  인수인계에서 이 값들이 바뀌면 다음 사람이 원본을 찾지 못합니다.
- 문장 수와 항목 수를 원문과 똑같이 유지합니다. 요약하거나 합치지 마세요.
- 항목의 순서를 바꾸지 마세요. 입력 순서 그대로 출력합니다.

localization_notes
- 번역하면서 문화적으로 손본 부분만 적습니다. 없으면 빈 배열로 둡니다.
- 예: 완곡한 한국어 표현을 상대 문화권에서 오해 없게 바꾼 경우.
- 한국어로 씁니다. 이건 우리 팀원이 읽는 메모입니다.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'decisions', 'tasks', 'localization_notes'],
  properties: {
    summary: { type: 'string', description: '요약 문단 번역' },
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['content', 'detail'],
        properties: {
          content: { type: 'string' },
          detail: { type: 'string' },
        },
      },
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['content', 'owner'],
        properties: {
          content: { type: 'string' },
          owner: { type: 'string', description: '사람 이름이므로 번역하지 않고 그대로' },
        },
      },
    },
    localization_notes: {
      type: 'array',
      items: { type: 'string' },
      description: '문화적으로 손본 부분 메모 (한국어). 없으면 빈 배열',
    },
  },
};

/** 키가 없을 때: 번역하지 않고 원문을 그대로 돌려줍니다. 화면이 비지 않게 합니다. */
function demoTranslate(briefing, language) {
  return {
    summary: briefing.summary ?? '',
    decisions: (briefing.decisions ?? []).map((decision) => ({
      content: decision.content,
      detail: decision.detail ?? '',
    })),
    tasks: (briefing.tasks ?? []).map((task) => ({
      content: task.content,
      owner: task.owner ?? '',
    })),
    localization_notes: [`데모 모드입니다. API 키가 있으면 ${language.name}로 번역됩니다.`],
  };
}

/**
 * @param {object} params
 * @param {object} params.briefing      Border 04 가 만든 브리핑
 * @param {string} params.countryCode   인계자의 국가 코드
 */
export async function run({ briefing, countryCode }) {
  if (!briefing) {
    const error = new Error('briefing 이 필요합니다.');
    error.statusCode = 400;
    throw error;
  }

  const language = languageForCountry(countryCode);

  if (!hasApiKey()) {
    return {
      ...demoTranslate(briefing, language),
      meta: { mode: 'demo', language: language.name, countryCode, model: null, latencyMs: 0 },
    };
  }

  const payload = {
    target_language: language.englishName,
    summary: briefing.summary ?? '',
    decisions: (briefing.decisions ?? []).map(({ content, detail }) => ({ content, detail })),
    tasks: (briefing.tasks ?? []).map(({ content, owner }) => ({ content, owner })),
  };

  const { data, usage, model, latencyMs } = await callLLM({
    system: SYSTEM_PROMPT,
    user: [
      `아래 인수인계서를 ${language.englishName}(으)로 번역하세요.`,
      '',
      JSON.stringify(payload, null, 2),
    ].join('\n'),
    schema: SCHEMA,
    schemaName: 'handoff_translation',
  });

  return {
    ...data,
    meta: { mode: 'live', language: language.name, countryCode, model, latencyMs, usage },
  };
}

/* ------------------------------------------------------------------ *
 * 전달 후 문서 화면 (메신저에서 인수인계 카드를 열었을 때 보이는 문서)
 *
 * 화면에 박혀 있던 일본어 목업을 대신합니다. 페이지 구조(제목 / 본문 /
 * 포인트 / 작업 카드)를 그대로 유지한 채 각 문자열만 인계자 언어로 옮깁니다.
 * 배열 길이가 달라지면 화면이 어긋나므로 개수를 반드시 맞춥니다.
 * ------------------------------------------------------------------ */

const DOCUMENT_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

이번 입력은 인수인계 "문서 화면"의 페이지 목록입니다.
- pages 배열의 길이, 각 페이지의 body / points / tasks 배열 길이를 입력과 정확히 같게 유지합니다.
- 순서도 그대로 둡니다. 비어 있는 배열은 비어 있는 채로 돌려줍니다.
- title 은 페이지 제목입니다. 영어로 적혀 있어도 대상 언어로 옮깁니다.
- tasks[].state 는 '완료' / '우선' / '다음' / '확인' 같은 짧은 상태 라벨입니다. 짧게 옮깁니다.
- 이 응답에는 localization_notes 를 넣지 않습니다.`;

const DOCUMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['pages'],
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'body', 'points', 'tasks'],
        properties: {
          title: { type: 'string' },
          body: { type: 'array', items: { type: 'string' } },
          points: { type: 'array', items: { type: 'string' } },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['state', 'title', 'desc'],
              properties: {
                state: { type: 'string' },
                title: { type: 'string' },
                desc: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

/** 화면이 보내온 페이지에서 번역할 문자열만 남깁니다. */
function toTranslatablePage(page) {
  return {
    title: typeof page?.title === 'string' ? page.title : '',
    body: (page?.body ?? []).map((line) => String(line)),
    points: (page?.points ?? []).map((line) => String(line)),
    tasks: (page?.tasks ?? []).map((task) => ({
      state: String(task?.state ?? ''),
      title: String(task?.title ?? ''),
      desc: String(task?.desc ?? ''),
    })),
  };
}

/**
 * 문서 페이지를 인계자 언어로 번역합니다.
 *
 * @param {object} params
 * @param {Array}  params.pages        화면이 쓰는 페이지 배열
 * @param {string} params.countryCode  인계자의 국가 코드
 */
export async function runDocument({ pages, countryCode }) {
  if (!Array.isArray(pages) || pages.length === 0) {
    const error = new Error('pages 가 필요합니다.');
    error.statusCode = 400;
    throw error;
  }

  const language = languageForCountry(countryCode);
  const source = pages.map(toTranslatablePage);
  const meta = { language: language.name, countryCode };

  // 키가 없으면 원문(한국어)을 그대로 돌려줍니다. 화면이 비지 않게 합니다.
  if (!hasApiKey()) {
    return { pages: source, meta: { ...meta, mode: 'demo', model: null, latencyMs: 0 } };
  }

  const { data, usage, model, latencyMs } = await callLLM({
    system: DOCUMENT_SYSTEM_PROMPT,
    user: [
      `아래 인수인계 문서를 ${language.englishName}(으)로 번역하세요.`,
      '',
      JSON.stringify({ pages: source }, null, 2),
    ].join('\n'),
    schema: DOCUMENT_SCHEMA,
    schemaName: 'handoff_document_translation',
  });

  // 모델이 페이지 수를 바꿔 오면 화면이 어긋나므로 원문으로 메꿉니다.
  const translated = source.map((page, index) => data.pages?.[index] ?? page);

  return { pages: translated, meta: { ...meta, mode: 'live', model, latencyMs, usage } };
}
