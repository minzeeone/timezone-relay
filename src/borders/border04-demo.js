/**
 * API 키가 없을 때 쓰는 데모 모드.
 *
 * 규칙(키워드 + 토큰 겹침)만으로 흉내를 냅니다. UI 흐름을 확인하기 위한 것이고,
 * 실제 발표/제출에서는 반드시 .env 에 ANTHROPIC_API_KEY 를 넣고 live 모드로 돌리세요.
 *
 * 이 파일이 존재하는 이유 자체가 Border 04 의 논지이기도 합니다:
 * 아래 규칙들은 "결제 API 다 됐어요" 와 "Merged PR #42" 를 절대 같은 사건으로 못 묶습니다.
 * 그걸 묶으려면 의미를 이해해야 하고, 그게 LLM 이 하는 일입니다.
 */

const NOISE_PATTERNS = [
  /^\s*(굿모닝|좋은\s*아침|안녕하세요|수고|고생|점심|퇴근|ㅋㅋ|ㅎㅎ|good\s*morning|hi|hello|thanks?)\b/i,
  /\bbot\b|\bdeploy(ed)?\s+to\b|build\s*#\d+|succeeded|CI\s+passed/i,
  /^[\s\p{Emoji}\p{P}]*$/u,
];

const DECISION_KEYWORDS = [
  '하기로', '결정', '확정', '합의', '승인', '통일', '채택', '머지', 'merged', 'merge pr', '승인함', '동의',
];

const BLOCKED_KEYWORDS = ['막혀', '블로커', '대기', '기다리', '못 ', '보류', 'blocked', 'waiting'];
const TODO_KEYWORDS = ['todo', '해야', '예정', '초안', '필요', '작성 예정', '다음 주', '내일'];

const SOURCE_PREFIX = /^\s*\[([^\]]+)\]\s*/;

function stripSource(line) {
  const match = line.match(SOURCE_PREFIX);
  return {
    source: match ? match[1].trim() : '',
    body: line.replace(SOURCE_PREFIX, '').trim(),
  };
}

function tokenize(text) {
  const refs = [...text.matchAll(/#\d+/g)].map((m) => m[0]);
  const words = text
    .toLowerCase()
    .replace(/[^0-9a-z가-힣#\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
  return new Set([...words, ...refs]);
}

function similarity(a, b) {
  // 같은 이슈/PR 번호를 참조하면 같은 사건으로 취급 (규칙 기반이 잡아낼 수 있는 유일한 강한 신호)
  const refsA = [...a].filter((t) => t.startsWith('#'));
  const refsB = [...b].filter((t) => t.startsWith('#'));
  if (refsA.length && refsB.length) {
    return refsA.some((r) => refsB.includes(r)) ? 1 : 0;
  }
  const intersection = [...a].filter((t) => b.has(t)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function includesAny(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

export function demoAnalyze({ logText, previous }) {
  const startedAt = Date.now();

  const rawLines = logText.split('\n').map((line) => line.trim()).filter(Boolean);

  const kept = [];
  let noiseRemoved = 0;
  for (const line of rawLines) {
    const { body } = stripSource(line);
    if (!body || NOISE_PATTERNS.some((pattern) => pattern.test(body))) {
      noiseRemoved += 1;
      continue;
    }
    kept.push(line);
  }

  // --- 중복 제거 (토큰 겹침 기준) ---
  const groups = [];
  for (const line of kept) {
    const { body } = stripSource(line);
    const tokens = tokenize(body);
    const match = groups.find((group) => similarity(group.tokens, tokens) >= 0.45);
    if (match) {
      match.sources.push(line);
      // 가장 긴 표현을 대표로
      if (body.length > match.content.length) match.content = body;
      match.tokens = new Set([...match.tokens, ...tokens]);
    } else {
      groups.push({ content: body, tokens, sources: [line] });
    }
  }

  const dedupedLogs = groups.map((group) => ({
    content: group.content,
    sources: group.sources,
    merged_count: group.sources.length,
  }));

  // --- 결정 / 작업 분리 ---
  const decisions = [];
  const tasks = [];
  for (const group of groups) {
    const text = group.content;
    if (includesAny(text, DECISION_KEYWORDS)) {
      decisions.push({
        content: text,
        detail: '(데모 모드 — 결정 키워드로 분류했습니다)',
        source: group.sources[0],
      });
      continue;
    }
    let status = 'in_progress';
    if (includesAny(text, BLOCKED_KEYWORDS)) status = 'blocked';
    else if (includesAny(text, TODO_KEYWORDS)) status = 'todo';
    tasks.push({ content: text, status, owner: '', source: group.sources[0] });
  }

  // --- 변경점 ---
  const changes = [];
  if (previous) {
    const previousContents = [
      ...(previous.decisions ?? []).map((d) => d.content),
      ...(previous.tasks ?? []).map((t) => t.content),
    ];
    const seen = (content) => previousContents.some((prev) => similarity(tokenize(prev), tokenize(content)) >= 0.45);

    for (const decision of decisions) {
      if (!seen(decision.content)) {
        changes.push({ content: decision.content, type: 'new', detail: '새로 확정된 결정사항' });
      }
    }
    for (const task of tasks) {
      if (!seen(task.content)) {
        changes.push({ content: task.content, type: 'new', detail: '새로 추가된 작업' });
      }
    }
  }

  return {
    latencyMs: Date.now() - startedAt,
    data: {
      summary:
        '데모 모드로 생성된 브리핑입니다. 규칙 기반이라 표현이 다른 같은 사건은 묶이지 않습니다. ' +
        '.env 에 ANTHROPIC_API_KEY 를 넣고 서버를 다시 켜면 실제 AI 분석이 동작합니다.',
      is_first_briefing: !previous,
      noise_removed: noiseRemoved,
      deduped_logs: dedupedLogs,
      decisions,
      tasks,
      changes,
    },
  };
}
