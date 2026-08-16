const BORDER_ID = 'border04';

const $ = (id) => document.getElementById(id);

const el = {
  modeBadge: $('mode-badge'),
  project: $('project'),
  logInput: $('log-input'),
  sampleBtn: $('sample-btn'),
  resetBtn: $('reset-btn'),
  runBtn: $('run-btn'),
  prevInfo: $('prev-info'),
  status: $('status'),
  results: $('results'),
  summaryText: $('summary-text'),
  stats: $('stats'),
  decisions: $('decisions'),
  tasks: $('tasks'),
  changes: $('changes'),
  logs: $('logs'),
  decisionsCount: $('decisions-count'),
  tasksCount: $('tasks-count'),
  changesCount: $('changes-count'),
  logsCount: $('logs-count'),
};

const SAMPLE_LOG = `[Slack #proj-payment 09:14 KST] 지원: 결제 모듈 리팩터링 브랜치 올렸어요. 리뷰 부탁드립니다
[GitHub 09:20 KST] opened PR #42 "refactor: split payment module into service layer"
[Notion / 결제 개편 09:40 KST] 지원: 결제 모듈 리팩터링 작업 진행중 (PR 올림)
[Slack #proj-payment 10:02 KST] 민석: PR #42 봤습니다. 에러 핸들링만 보완하면 될 것 같아요
[Slack #proj-payment 11:30 KST] 준서: 굿모닝~ ☕
[GitHub 13:05 KST] merged PR #42 into main
[Slack #proj-payment 13:10 KST] 지원: PR #42 머지했습니다
[Notion / 결제 개편 13:20 KST] 결제 모듈 리팩터링 완료 ✅
[Slack #proj-payment 14:00 KST] 의중: 결제 실패 로그 포맷은 JSON으로 통일하기로 했습니다. 다들 동의하신 걸로 알게요
[GitHub 14:30 KST] opened issue #47 "PG사 타임아웃 재시도 정책 필요"
[Slack #proj-payment 15:10 KST] 지원: #47은 PG사 답변 기다리는 중이라 이번 주는 못 건드릴 것 같아요
[Slack #proj-payment 15:12 KST] deploy-bot: Deploy to staging succeeded (build #881)
[Notion / 결제 개편 16:00 KST] TODO: 환불 API 스펙 초안 작성 — 담당 민석`;

const STATUS_LABEL = { in_progress: '진행중', todo: '할 일', blocked: '막힘' };
const CHANGE_LABEL = { new: '신규', updated: '변경', removed: '취소' };

/* ---------- 렌더링 헬퍼 ---------- */

function esc(text) {
  return String(text ?? '').replace(/[&<>"]/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch],
  );
}

function sourcesBlock(sources) {
  if (!sources?.length) return '';
  return `<details class="sources">
    <summary>원문 ${sources.length}건</summary>
    <ul>${sources.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
  </details>`;
}

function render(container, items, buildHtml, emptyText) {
  if (!items?.length) {
    container.innerHTML = `<p class="empty">${esc(emptyText)}</p>`;
    return;
  }
  container.innerHTML = items.map(buildHtml).join('');
}

function renderBriefing(briefing) {
  el.summaryText.textContent = briefing.summary;

  const { stats, meta } = briefing;
  const chips = [
    `원본 <b>${stats.inputLines}</b>줄`,
    `병합 <b>${stats.mergedLines}</b>줄`,
    `노이즈 제거 <b>${stats.noiseRemoved}</b>줄`,
    `최종 <b>${stats.outputLines}</b>건`,
  ];
  if (meta.mode === 'live') {
    chips.push(`<b>${esc(meta.model)}</b>`);
    chips.push(`${(meta.latencyMs / 1000).toFixed(1)}초`);
    chips.push(`토큰 in <b>${meta.inputTokens}</b> / out <b>${meta.outputTokens}</b>`);
  } else {
    chips.push('<b>데모 모드</b> (AI 미사용)');
  }
  el.stats.innerHTML = chips.map((chip) => `<li>${chip}</li>`).join('');

  el.decisionsCount.textContent = briefing.decisions.length;
  el.tasksCount.textContent = briefing.tasks.length;
  el.changesCount.textContent = briefing.changes.length;
  el.logsCount.textContent = briefing.deduped_logs.length;

  render(
    el.decisions,
    briefing.decisions,
    (item) => `<div class="item">
      <div class="item-title">${esc(item.content)}</div>
      ${item.detail ? `<div class="item-detail">${esc(item.detail)}</div>` : ''}
      ${sourcesBlock(item.source ? [item.source] : [])}
    </div>`,
    '확정된 결정사항이 없습니다.',
  );

  render(
    el.tasks,
    briefing.tasks,
    (item) => `<div class="item">
      <div class="item-title">
        <span class="tag tag-${esc(item.status)}">${esc(STATUS_LABEL[item.status] ?? item.status)}</span>
        ${esc(item.content)}
        ${item.owner ? `<span class="owner">@${esc(item.owner)}</span>` : ''}
      </div>
      ${sourcesBlock(item.source ? [item.source] : [])}
    </div>`,
    '진행중이거나 남아 있는 작업이 없습니다.',
  );

  render(
    el.changes,
    briefing.changes,
    (item) => `<div class="item">
      <div class="item-title">
        <span class="tag tag-${esc(item.type)}">${esc(CHANGE_LABEL[item.type] ?? item.type)}</span>
        ${esc(item.content)}
      </div>
      ${item.detail ? `<div class="item-detail">${esc(item.detail)}</div>` : ''}
    </div>`,
    briefing.is_first_briefing
      ? '이 프로젝트의 첫 브리핑입니다. 다음 브리핑부터 이 카드에 "달라진 것만" 표시됩니다.'
      : '지난 브리핑 이후 달라진 점이 없습니다.',
  );

  render(
    el.logs,
    briefing.deduped_logs,
    (item) => `<div class="item">
      <div class="item-title">
        ${item.merged_count > 1 ? `<span class="tag tag-merge">${item.merged_count}건 병합</span>` : ''}
        ${esc(item.content)}
      </div>
      ${sourcesBlock(item.sources)}
    </div>`,
    '남은 로그가 없습니다.',
  );

  el.results.hidden = false;
}

/* ---------- 상태 표시 ---------- */

function setStatus(text, kind) {
  if (!text) {
    el.status.hidden = true;
    return;
  }
  el.status.hidden = false;
  el.status.textContent = text;
  el.status.className = `status status-${kind}`;
}

/* ---------- 서버 통신 ---------- */

async function refreshPrevInfo() {
  const projectId = el.project.value;
  try {
    const response = await fetch(`/api/${BORDER_ID}/previous?projectId=${encodeURIComponent(projectId)}`);
    const { previous } = await response.json();
    el.prevInfo.textContent = previous
      ? `직전 브리핑: ${new Date(previous.savedAt).toLocaleString('ko-KR')} — 변경점은 이것과 비교됩니다`
      : '직전 브리핑 없음 — 이번이 첫 브리핑입니다';
  } catch {
    el.prevInfo.textContent = '';
  }
}

async function runBriefing() {
  const logText = el.logInput.value.trim();
  if (!logText) {
    setStatus('작업 로그를 붙여넣어 주세요.', 'error');
    return;
  }

  el.runBtn.disabled = true;
  setStatus('로그를 분석하는 중입니다… (모델이 판단하는 데 10~40초 정도 걸립니다)', 'loading');

  try {
    const response = await fetch(`/api/${BORDER_ID}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logText, projectId: el.project.value }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `서버 오류 (${response.status})`);

    renderBriefing(payload);
    setStatus(null);
    refreshPrevInfo();
  } catch (error) {
    setStatus(`브리핑 생성 실패: ${error.message}`, 'error');
  } finally {
    el.runBtn.disabled = false;
  }
}

/* ---------- 초기화 ---------- */

el.runBtn.addEventListener('click', runBriefing);
el.sampleBtn.addEventListener('click', () => {
  el.logInput.value = SAMPLE_LOG;
  el.logInput.focus();
});
el.project.addEventListener('change', refreshPrevInfo);
el.resetBtn.addEventListener('click', async () => {
  await fetch(`/api/${BORDER_ID}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: el.project.value }),
  });
  el.results.hidden = true;
  setStatus('직전 브리핑을 초기화했습니다. 다음 생성은 첫 브리핑으로 처리됩니다.', 'loading');
  refreshPrevInfo();
});

// Cmd/Ctrl + Enter 로 실행
el.logInput.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') runBriefing();
});

fetch('/api/health')
  .then((response) => response.json())
  .then(({ mode }) => {
    el.modeBadge.textContent = mode === 'live' ? 'Claude API 연결됨' : '데모 모드 (API 키 없음)';
    el.modeBadge.className = `badge badge-${mode}`;
  })
  .catch(() => {
    el.modeBadge.textContent = '서버 연결 실패';
    el.modeBadge.className = 'badge badge-demo';
  });

refreshPrevInfo();
