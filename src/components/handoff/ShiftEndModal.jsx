import { useEffect, useState } from 'react';
import { presenceOf } from '../../utils/timing.js';

const preparationItems = [
  {
    icon: 'bi-people-fill',
    title: '팀 대화',
    source: 'Slack, Microsoft Teams 수집',
    count: '18개',
  },
  {
    icon: 'bi-arrow-clockwise',
    title: '작업 업데이트',
    source: 'Notion, Figma',
    count: '6개',
  },
  {
    icon: 'bi-github',
    title: 'Pull Request',
    source: 'Github Project Repository',
    count: '2개',
  },
  {
    icon: 'bi-activity',
    title: '결정사항 후보',
    source: 'Notion',
    count: '2개',
  },
];

const generationSteps = [
  {
    label: '오늘 완료된 작업 확인 중...',
    startCount: 0,
    totalCount: 32,
  },
  {
    label: '진행 중인 작업 확인 중...',
    startCount: 0,
    totalCount: 15,
  },
  {
    label: '막힌 작업 탐지 중...',
    startCount: 0,
    totalCount: 3,
  },
  {
    label: '주요 결정사항 정리 중...',
    startCount: 0,
    totalCount: 23,
  },
  {
    label: '다음작업 정리 및 팀원 현지어 변환 중..',
  },
];

const handoffReviewTasks = [
  {
    state: '완료',
    number: '01',
    title: '로그인 UI 개편',
    description: '신규 인증 플로우에 맞게 로그인 화면을 개편합니다.',
    done: true,
  },
  {
    state: '완료',
    number: '02',
    title: 'OAuth API 연동',
    description: '프론트엔드와 신규 인증 API를 연결합니다.',
    done: true,
  },
  {
    state: '진행중',
    number: '03',
    title: 'Production 배포',
    description: '신규 인증 시스템을 운영 환경에 배포합니다.',
    done: false,
  },
  {
    state: '진행중',
    number: '04',
    title: '인증 플로우 QA',
    description: '로그인 및 토큰 갱신 시나리오를 검증합니다.',
    done: false,
  },
];

const handoffReviewStatuses = [
  {
    state: '완료',
    title: '로그인 UI · OAuth API · PR #142',
    done: true,
  },
  {
    state: '진행 중',
    title: 'Production QA',
    done: true,
  },
  {
    state: '미해결사항',
    title: 'IAM Role 권한',
    description: 'Production 배포 권한이 없습니다.',
    danger: true,
  },
];

const handoffReviewPriorities = [
  { title: 'IAM Role 권한 확인', assignee: 'John' },
  { title: 'Production 배포 재시도', assignee: '김의중' },
  { title: '최종 인증 플로우 QA', assignee: 'Alex' },
];

const handoffReviewTasksJa = [
  {
    state: '完了',
    number: '01',
    title: 'ログインUIの改善',
    description: '新しい認証フローに合わせてログイン画面を改善しました。',
    done: true,
  },
  {
    state: '完了',
    number: '02',
    title: 'OAuth API連携',
    description: 'フロントエンドと新しい認証APIを接続しました。',
    done: true,
  },
  {
    state: '進行中',
    number: '03',
    title: 'Productionデプロイ',
    description: '新しい認証システムを本番環境へデプロイします。',
    done: false,
  },
  {
    state: '進行中',
    number: '04',
    title: '認証フローQA',
    description: 'ログインとトークン更新シナリオを検証します。',
    done: false,
  },
];

const handoffReviewStatusesJa = [
  {
    state: '完了',
    title: 'ログインUI・OAuth API・PR #142',
    done: true,
  },
  {
    state: '進行中',
    title: 'Production QA',
    done: true,
  },
  {
    state: '未解決事項',
    title: 'IAM Role権限',
    description: 'Productionデプロイ権限がありません。',
    danger: true,
  },
];

const handoffReviewPrioritiesJa = [
  { title: 'IAM Role権限の確認', assignee: 'John' },
  { title: 'Productionデプロイの再試行', assignee: '김의중' },
  { title: '最終認証フローQA', assignee: 'Alex' },
];

const taskLocalizationNotesJa = [
  '로그인 UI 개편을 일본어 업무 문서에서 쓰는 자연스러운 표현으로 바꿨어요.',
  'OAuth API는 기술 약어라 그대로 보존하고, 연결 업무라는 의미만 일본어로 풀었어요.',
  'Production과 배포는 개발팀이 이해하기 쉬운 일본어 업무 표현으로 유지했어요.',
  'QA는 약어를 보존하고, 인증 플로우 검증이라는 문맥을 살렸어요.',
];

const statusLocalizationNotesJa = [
  '완료된 범위를 일본 팀이 바로 파악할 수 있게 항목 중심으로 압축했어요.',
  '진행 중 상태는 일본 업무 문서의 짧은 상태 라벨로 변환했어요.',
  '미해결사항은 blocker보다 부드러운 일본 업무 표현으로 바꿨어요.',
];

const priorityLocalizationNotesJa = [
  '권한 확인은 담당자가 바로 실행할 수 있는 액션 문장으로 바꿨어요.',
  '재시도는 배포 맥락을 유지하면서 다음 행동으로 자연스럽게 표현했어요.',
  '최종 QA는 일본어에서도 통용되는 기술 약어를 보존했어요.',
];

const japaneseCityLabels = {
  KR: '韓国',
  JP: '日本 東京',
  US: '米国 ニューヨーク',
  GB: '英国 ロンドン',
  UK: '英国 ロンドン',
  RU: 'ロシア モスクワ',
};

function formatReviewLocalTime(countryCode, locationLabel) {
  const { clock } = presenceOf(countryCode);

  return `${clock} ${locationLabel}`;
}

function LocalizationHint({ children, note }) {
  return (
    <span className="localized-hint" data-note={note} tabIndex={0}>
      {children}
    </span>
  );
}

const TASK_STATE_LABEL = {
  in_progress: '진행중',
  todo: '예정',
  blocked: '막힘',
};

const TASK_PRIORITY_ORDER = {
  blocked: 0,
  in_progress: 1,
  todo: 2,
};

/**
 * Border 04 API 응답을 검토 화면의 항목 형태로 변환합니다.
 * 확정된 결정사항이 먼저 오고, 그 뒤에 남은 작업이 붙습니다.
 */
function buildReviewTasks(briefing) {
  const decisions = (briefing.decisions ?? []).map((decision) => ({
    state: '완료',
    title: decision.content,
    description: decision.detail || '',
    done: true,
  }));

  const tasks = (briefing.tasks ?? []).map((task) => ({
    state: TASK_STATE_LABEL[task.status] ?? '진행중',
    title: task.content,
    description: task.owner ? `담당 ${task.owner}` : '',
    done: false,
  }));

  return [...decisions, ...tasks].map((item, index) => ({
    ...item,
    number: String(index + 1).padStart(2, '0'),
  }));
}

function buildReviewStatuses(briefing) {
  const decisions = (briefing.decisions ?? []).map((decision) => ({
    state: '완료',
    title: decision.content,
    description: decision.detail || decision.source || '',
    done: true,
  }));

  const blockers = (briefing.tasks ?? [])
    .filter((task) => task.status === 'blocked')
    .map((task) => ({
      state: '미해결사항',
      title: task.content,
      description: task.source ? `출처: ${task.source}` : '',
      danger: true,
    }));

  return [...decisions, ...blockers];
}

function buildReviewPriorities(briefing) {
  return [...(briefing.tasks ?? [])]
    .sort((currentTask, nextTask) => {
      const currentPriority = TASK_PRIORITY_ORDER[currentTask.status] ?? 99;
      const nextPriority = TASK_PRIORITY_ORDER[nextTask.status] ?? 99;

      return currentPriority - nextPriority;
    })
    .map((task) => ({
      title: task.content,
      assignee: task.owner || '미정',
      source: task.source || '',
      status: task.status,
    }));
}

function projectNameFromSelection(selectedProject, projects) {
  if (!selectedProject) return projects[0] ?? 'Project Aurora';
  return selectedProject.replace(/-\d+$/, '');
}

export function ShiftEndModal({
  step,
  recipients,
  projects,
  selectedRecipient,
  selectedProject,
  onSelectRecipient,
  onSelectProject,
  onClose,
  onConfirm,
  onHandoff,
  onBack,
  onNext,
  onAdditionalNoteChange,
  briefing = null,
  briefingError = '',
}) {
  const isRecipientStep = step === 'recipient';
  const isProjectStep = step === 'project';
  const isPreparingStep = step === 'preparing';
  const isAdditionalStep = step === 'additional';
  const isGeneratingStep = step === 'generating';
  const isReviewStep = step === 'review';
  const isSendingStep = step === 'sending';
  const isSentStep = step === 'sent';
  const selectedMember = recipients.find((member) => member.name === selectedRecipient) ?? recipients[0];
  const selectedProjectName = projectNameFromSelection(selectedProject, projects);
  const reviewProjectName = selectedProjectName === 'Project Aurora' ? 'Aurora Project' : selectedProjectName;
  const [visiblePreparationCount, setVisiblePreparationCount] = useState(0);
  const [additionalNote, setAdditionalNote] = useState('');
  const [generationPhase, setGenerationPhase] = useState(0);
  const [generationCount, setGenerationCount] = useState(0);
  const [isJapaneseReview, setIsJapaneseReview] = useState(false);
  const [localTimeTick, setLocalTimeTick] = useState(0);
  const generationStepIndex = Math.min(generationPhase, generationSteps.length - 1);
  const activeGenerationStep = generationSteps[generationStepIndex];
  // Border 04: 애니메이션이 끝나도 실제 AI 응답이 도착할 때까지 "생성 중" 상태를 유지합니다.
  const isBriefingSettled = Boolean(briefing) || Boolean(briefingError);
  const isGenerationComplete =
    isGeneratingStep && generationPhase >= generationSteps.length && isBriefingSettled;

  // 실제 브리핑이 오면 목업 대신 그 결과로 검토 화면을 채웁니다.
  const liveReviewTasks = briefing ? buildReviewTasks(briefing) : null;
  const liveReviewStatuses = briefing ? buildReviewStatuses(briefing) : null;
  const liveReviewPriorities = briefing ? buildReviewPriorities(briefing) : null;
  const reviewTasks =
    liveReviewTasks && !isJapaneseReview
      ? liveReviewTasks
      : isJapaneseReview
        ? handoffReviewTasksJa
        : handoffReviewTasks;
  const reviewStatuses =
    liveReviewStatuses && !isJapaneseReview
      ? liveReviewStatuses
      : isJapaneseReview
        ? handoffReviewStatusesJa
        : handoffReviewStatuses;
  const reviewPriorities =
    liveReviewPriorities && !isJapaneseReview
      ? liveReviewPriorities
      : isJapaneseReview
        ? handoffReviewPrioritiesJa
        : handoffReviewPriorities;
  const briefingDecisionCount = briefing?.decisions?.length ?? 0;
  const briefingBlockedCount = briefing?.tasks?.filter((task) => task.status === 'blocked').length ?? 0;
  const handoffGiverLocalTime = formatReviewLocalTime('KR', '대한민국');
  const handoffRecipientLocalTime = formatReviewLocalTime(selectedMember.countryCode ?? 'JP', selectedMember.cityLabel ?? '일본 도쿄');
  const handoffGiverLocalTimeJa = formatReviewLocalTime('KR', japaneseCityLabels.KR);
  const handoffRecipientLocalTimeJa = formatReviewLocalTime(
    selectedMember.countryCode ?? 'JP',
    japaneseCityLabels[selectedMember.countryCode] ?? selectedMember.cityLabel ?? japaneseCityLabels.JP
  );

  useEffect(() => {
    if (!isPreparingStep) {
      setVisiblePreparationCount(0);
      return undefined;
    }

    setVisiblePreparationCount(0);
    const timers = preparationItems.map((_, index) =>
      window.setTimeout(() => {
        setVisiblePreparationCount(index + 1);
      }, 420 + index * 520)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [isPreparingStep]);

  useEffect(() => {
    if (!isReviewStep) {
      setIsJapaneseReview(false);
      setLocalTimeTick(0);
      return undefined;
    }

    setLocalTimeTick((tick) => tick + 1);
    const timer = window.setInterval(() => {
      setLocalTimeTick((tick) => tick + 1);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [isReviewStep]);

  useEffect(() => {
    if (!isSendingStep) return undefined;

    const sendingTimer = window.setTimeout(() => {
      onNext();
    }, 3000);

    return () => window.clearTimeout(sendingTimer);
  }, [isSendingStep, onNext]);

  useEffect(() => {
    if (!isGeneratingStep) {
      setGenerationPhase(0);
      setGenerationCount(0);
      return undefined;
    }

    setGenerationPhase(0);
    const timers = Array.from({ length: generationSteps.length }, (_, index) =>
      window.setTimeout(() => {
        setGenerationPhase(index + 1);
      }, 2000 + index * 2000)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [isGeneratingStep]);

  useEffect(() => {
    if (!isGeneratingStep || isGenerationComplete || activeGenerationStep.totalCount == null) {
      setGenerationCount(0);
      return undefined;
    }

    setGenerationCount(activeGenerationStep.startCount);
    const remainingCount = Math.max(activeGenerationStep.totalCount - activeGenerationStep.startCount, 1);
    const intervalDelay = Math.max(55, Math.floor(1600 / remainingCount));
    const counter = window.setInterval(() => {
      setGenerationCount((currentCount) => {
        if (currentCount >= activeGenerationStep.totalCount) {
          window.clearInterval(counter);
          return currentCount;
        }

        return currentCount + 1;
      });
    }, intervalDelay);

    return () => window.clearInterval(counter);
  }, [activeGenerationStep, isGenerationComplete, isGeneratingStep]);

  const canContinue = isAdditionalStep || isGeneratingStep
    ? true
    : isPreparingStep
      ? visiblePreparationCount === preparationItems.length
      : isProjectStep
        ? Boolean(selectedProject)
        : Boolean(selectedRecipient);

  return (
    <div className="shift-modal-layer" role="presentation" onMouseDown={isGeneratingStep || isReviewStep || isSendingStep || isSentStep ? undefined : onClose}>
      <section
        className={`shift-modal ${isRecipientStep ? 'recipient' : ''} ${isProjectStep ? 'project' : ''} ${isPreparingStep ? 'preparing' : ''} ${isAdditionalStep ? 'additional' : ''} ${isGeneratingStep || isSendingStep ? 'generating' : ''} ${isGenerationComplete || isSentStep ? 'generated' : ''} ${isSendingStep ? 'sending' : ''} ${isSentStep ? 'sent' : ''} ${isReviewStep ? 'review' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!isGeneratingStep && !isReviewStep && !isSendingStep && !isSentStep && (
          <button className="shift-modal-close" type="button" aria-label="닫기" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        )}
        {!isRecipientStep && !isProjectStep && !isPreparingStep && !isAdditionalStep && !isGeneratingStep && !isReviewStep && !isSendingStep && !isSentStep ? (
          <div className="shift-modal-content" key="confirm">
            <div className="shift-modal-icon">
              <i className="bi bi-box-arrow-right" />
            </div>
            <h2 id="shift-modal-title">근무를 끝낼까요?</h2>
            <p>퇴근까지 08:59 남았어요.</p>
          </div>
        ) : isRecipientStep ? (
          <div className="shift-modal-content handoff-select" key="recipient">
            <div className="shift-modal-icon person">
              <i className="bi bi-person-circle" />
            </div>
            <h2 id="shift-modal-title">누구에게 인수인계 할까요?</h2>
            <div className="handoff-recipient-list" role="listbox" aria-label="인수인계 받을 팀원">
              {recipients.map((member) => (
                <button
                  className={`handoff-recipient ${selectedRecipient === member.name ? 'selected' : ''}`}
                  type="button"
                  role="option"
                  aria-selected={selectedRecipient === member.name}
                  key={member.name}
                  onClick={() => onSelectRecipient(member.name)}
                >
                  <span className={`handoff-recipient-avatar ${member.status}`}>
                    {member.avatarImage ? <img src={member.avatarImage} alt="" /> : <span>{member.avatar}</span>}
                  </span>
                  <span>
                    <strong>{member.name}</strong>
                    <small>{member.meta}</small>
                  </span>
                </button>
              ))}
            </div>
            <button className="handoff-add-recipient" type="button" aria-label="팀원 추가">
              <i className="bi bi-plus-lg" />
            </button>
          </div>
        ) : isProjectStep ? (
          <div className="shift-modal-content project-select" key="project">
            <span className="handoff-target-label">인수인계 대상자</span>
            <div className={`project-target-avatar ${selectedMember.status}`}>
              {selectedMember.avatarImage ? <img src={selectedMember.avatarImage} alt="" /> : <span>{selectedMember.avatar}</span>}
            </div>
            <strong className="project-target-name">{selectedMember.name}</strong>
            <small className="project-target-meta">{selectedMember.meta}</small>
            <h2 id="shift-modal-title">인계할 프로젝트를 선택해주세요.</h2>
            <div className="handoff-project-list" role="listbox" aria-label="인계할 프로젝트">
              {projects.map((project, index) => (
                <button
                  className={`handoff-project ${selectedProject === `${project}-${index}` ? 'selected' : ''}`}
                  type="button"
                  role="option"
                  aria-selected={selectedProject === `${project}-${index}`}
                  key={`${project}-${index}`}
                  onClick={() => onSelectProject(`${project}-${index}`)}
                >
                  <span>{project}</span>
                  <i className="bi bi-three-dots" />
                </button>
              ))}
            </div>
          </div>
        ) : isPreparingStep ? (
          <div className="shift-modal-content preparing-select" key="preparing">
            <span className="handoff-target-label">인수인계 준비</span>
            <strong className="handoff-preparing-project">{selectedProjectName}</strong>
            <span className="handoff-preparing-divider" />
            <div className="handoff-ai-note">
              <i className="bi bi-stars" />
              AI가 오늘 프로젝트에서 발생한 업무 기록을 수집했어요.
            </div>
            <div className="handoff-preparing-list" aria-label="수집된 업무 기록">
              {preparationItems.map((item, index) => (
                <article className={`handoff-preparing-item ${visiblePreparationCount > index ? 'visible' : ''}`} key={item.title}>
                  <i className={`bi ${item.icon}`} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.source}</small>
                  </span>
                  <em>{visiblePreparationCount > index ? item.count : ''}</em>
                </article>
              ))}
            </div>
          </div>
        ) : isAdditionalStep ? (
          <div className="shift-modal-content additional-note" key="additional">
            <div className="shift-modal-icon note">
              <i className="bi bi-chat-left-text" />
            </div>
            <h2 id="shift-modal-title">추가적으로 전달할 내용이 있나요?</h2>
            <textarea
              aria-label="추가 전달 내용"
              className="handoff-additional-input"
              maxLength={500}
              placeholder="내용을 입력하세요."
              value={additionalNote}
              onChange={(event) => {
                setAdditionalNote(event.target.value);
                onAdditionalNoteChange?.(event.target.value);
              }}
            />
            <span className="handoff-additional-count">{additionalNote.length}/500</span>
          </div>
        ) : isSendingStep ? (
          <div className="shift-modal-content handoff-sending" key="handoff-sending">
            <div className="handoff-sending-icon">
              <i className="bi bi-upload" />
            </div>
            <h2 id="shift-modal-title">전송 중...</h2>
          </div>
        ) : isSentStep ? (
          <div className="shift-modal-content handoff-sent" key="handoff-sent">
            <div className="generation-complete-icon">
              <i className="bi bi-check-circle" />
            </div>
            <h2 id="shift-modal-title">
              {selectedMember.name} 님에게 인수인계가
              <br />
              완료되었어요.
            </h2>
          </div>
        ) : isReviewStep ? (
          <div className={`shift-modal-content handoff-review ${isJapaneseReview ? 'translated-review' : ''}`} key="handoff-review">
            {isJapaneseReview && (
              <div className="handoff-review-japanese">
                <header className="handoff-review-header">
                  <span>
                    <LocalizationHint note="업무 인수인계서를 일본 업무 문서에서 자연스러운 제목으로 바꿨어요.">業務引き継ぎ書</LocalizationHint>
                  </span>
                  <strong>{reviewProjectName}</strong>
                </header>
                <section className="handoff-review-parties" aria-label="引き継ぎ参加者">
                  <div>
                    <span>引き継ぐ人</span>
                    <strong>김의중</strong>
                    <small>開発チーム フロントエンド</small>
                    <small>{handoffGiverLocalTimeJa}</small>
                  </div>
                  <i className="bi bi-arrow-right" aria-hidden="true" />
                  <div>
                    <span>引き継ぎ先</span>
                    <strong>{selectedMember.name}</strong>
                    <small>製品チーム PM</small>
                    <small>{handoffRecipientLocalTimeJa}</small>
                  </div>
                </section>
                <div className="handoff-review-grid">
                  <div className="handoff-review-column">
                    <section className="handoff-review-section">
                      <h3>引き継ぎ業務</h3>
                      <p className="handoff-review-lead">
                        <LocalizationHint note="AURORA는 프로젝트명이므로 보존하고, 인증 시스템 개편은 일본어 제품 문맥으로 자연스럽게 변환했어요.">
                          AURORA認証システム改編
                        </LocalizationHint>
                      </p>
                      <p>
                        グローバルユーザー認証システムを既存方式から
                        <LocalizationHint note="OAuth는 기술 약어라 그대로 두고, 기반 구조라는 의미만 일본어로 현지화했어요.">OAuthベースの認証構造</LocalizationHint>
                        へ移行するプロジェクトです。
                      </p>
                    </section>
                    <section className="handoff-review-section">
                      <h3>担当業務</h3>
                      <div className="handoff-review-task-list">
                        {handoffReviewTasksJa.map((task, index) => (
                          <article className={task.done ? 'done' : ''} key={task.number}>
                            <span>{task.state}</span>
                            <div>
                              <strong>{task.number}</strong>
                              <b>
                                <LocalizationHint note={taskLocalizationNotesJa[index]}>{task.title}</LocalizationHint>
                              </b>
                              <small>{task.description}</small>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                  <div className="handoff-review-column">
                    <section className="handoff-review-section">
                      <h3>進行状況および未解決事項</h3>
                      <p>
                        認証機能の開発とAPI連携は完了しており、
                        <LocalizationHint note="Production은 개발 용어로 보존하고, 배포는 일본 개발팀에서 쓰는 デプロイ로 변환했어요.">Productionデプロイ</LocalizationHint>
                        を準備しています。
                      </p>
                      <div className="handoff-review-status-list">
                        {handoffReviewStatusesJa.map((item, index) => (
                          <article className={item.danger ? 'danger' : ''} key={item.state}>
                            <span>{item.done ? <i className="bi bi-check" /> : <i className="bi bi-x" />}</span>
                            <div>
                              <strong>{item.state}</strong>
                              <small>
                                <LocalizationHint note={statusLocalizationNotesJa[index]}>{item.title}</LocalizationHint>
                              </small>
                              {item.description && <small>{item.description}</small>}
                            </div>
                          </article>
                        ))}
                      </div>
                      <p className="handoff-review-note">
                        影響: <LocalizationHint note="배포 중단의 영향을 일본어 상태 문장으로 짧게 정리했어요.">Productionデプロイ停止</LocalizationHint>
                        <br />
                        状態: <LocalizationHint note="확인 대기를 일본 업무 커뮤니케이션에서 자연스러운 待ち 표현으로 바꿨어요.">Platformチーム確認待ち</LocalizationHint>
                        <br />
                        関連作業: AURORA #128
                      </p>
                    </section>
                    <section className="handoff-review-section">
                      <h3>推進計画および優先順位</h3>
                      <div className="handoff-review-priority-list">
                        {handoffReviewPrioritiesJa.map((item, index) => (
                          <article key={item.title}>
                            <span />
                            <div>
                              <strong>
                                <LocalizationHint note={priorityLocalizationNotesJa[index]}>{item.title}</LocalizationHint>
                              </strong>
                              <small>担当者: {item.assignee}</small>
                            </div>
                          </article>
                        ))}
                        <i className="bi bi-arrow-down" aria-hidden="true" />
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
            <header className="handoff-review-header">
              <span>업무 인수인계서</span>
              <strong>{reviewProjectName}</strong>
            </header>
            <section className="handoff-review-parties" aria-label="인수인계 참여자">
              <div>
                <span>인수자</span>
                <strong>김의중</strong>
                <small>개발팀 프론트엔드</small>
                <small>{handoffGiverLocalTime}</small>
              </div>
              <i className="bi bi-arrow-right" aria-hidden="true" />
              <div>
                <span>인계자</span>
                <strong>{selectedMember.name}</strong>
                <small>제품팀 PM</small>
                <small>{handoffRecipientLocalTime}</small>
              </div>
            </section>
            <div className="handoff-review-grid">
              <div className="handoff-review-column">
                <section className="handoff-review-section">
                  <h3>인수인계 업무</h3>
                  <p className="handoff-review-lead">
                    {briefing ? `${reviewProjectName} 인수인계 요약` : 'AURORA 인증 시스템 개편'}
                  </p>
                  <p>
                    {briefing
                      ? `${reviewProjectName}에서 다음 시간대 팀이 이어받아야 할 업무 범위를 정리했습니다.`
                      : '글로벌 사용자 인증 시스템을 기존 방식에서 OAuth 기반 인증 구조로 전환하는 프로젝트입니다.'}
                  </p>
                </section>
                <section className="handoff-review-section">
                  <h3>담당 업무</h3>
                  <div className="handoff-review-task-list">
                    {reviewTasks.map((task) => (
                      <article className={task.done ? 'done' : ''} key={task.number}>
                        <span>{task.state}</span>
                        <div>
                          <strong>{task.number}</strong>
                          <b>{task.title}</b>
                          <small>{task.description}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
              <div className="handoff-review-column">
                <section className="handoff-review-section">
                  <h3>진행상황 및 미해결사항</h3>
                  <p>
                    {briefing?.summary ??
                      '인증 기능 개발과 API 연동은 완료됐으며, Production 배포를 준비하고 있습니다.'}
                  </p>
                  <div className="handoff-review-status-list">
                    {reviewStatuses.map((item) => (
                      <article className={item.danger ? 'danger' : ''} key={`${item.state}-${item.title}`}>
                        <span>{item.done ? <i className="bi bi-check" /> : <i className="bi bi-x" />}</span>
                        <div>
                          <strong>{item.state}</strong>
                          <small>{item.title}</small>
                          {item.description && <small>{item.description}</small>}
                        </div>
                      </article>
                    ))}
                  </div>
                  {briefing ? (
                    <p className="handoff-review-note">
                      완료: 결정사항 {briefingDecisionCount}건
                      <br />
                      미해결: 막힌 작업 {briefingBlockedCount}건
                    </p>
                  ) : (
                    <p className="handoff-review-note">
                      영향: Production 배포 중단
                      <br />
                      상태: Platform 팀 확인 대기
                      <br />
                      관련 작업: AURORA #128
                    </p>
                  )}
                </section>
                <section className="handoff-review-section">
                  <h3>추진계획 및 우선순위</h3>
                  <div className="handoff-review-priority-list">
                    {reviewPriorities.map((item) => (
                      <article key={`${item.status ?? 'mock'}-${item.title}-${item.assignee}`}>
                        <span />
                        <div>
                          <strong>{item.title}</strong>
                          {item.status && <small>상태: {TASK_STATE_LABEL[item.status] ?? item.status}</small>}
                          <small>담당자: {item.assignee}</small>
                          {item.source && <small>출처: {item.source}</small>}
                        </div>
                      </article>
                    ))}
                    <i className="bi bi-arrow-down" aria-hidden="true" />
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : isGenerationComplete ? (
          <div className="shift-modal-content generation-complete" key="generation-complete">
            <div className="generation-complete-icon">
              <i className="bi bi-check-circle" />
            </div>
            <h2 id="shift-modal-title">인수인계 생성이 완료되었어요.</h2>
          </div>
        ) : (
          <div className="shift-modal-content generation-progress" key={`generation-${generationStepIndex}`}>
            <div className="generation-progress-icon">
              <i className="bi bi-stars" />
            </div>
            <h2 id="shift-modal-title">인수인계를 준비하고 있어요.</h2>
            <div className="generation-status-box" aria-live="polite">
              <span>{activeGenerationStep.label}</span>
              {activeGenerationStep.totalCount != null && (
                <strong>
                  ({generationCount}/{activeGenerationStep.totalCount})
                </strong>
              )}
            </div>
            <div className="generation-track" aria-label={`인수인계 생성 단계 ${generationStepIndex + 1} / ${generationSteps.length}`}>
              {generationSteps.map((item, index) => (
                <span className={`generation-dot ${index === generationStepIndex ? 'active' : ''}`} key={item.label} />
              ))}
            </div>
          </div>
        )}
        {!isRecipientStep && !isProjectStep && !isPreparingStep && !isAdditionalStep && !isGeneratingStep && !isReviewStep && !isSendingStep && !isSentStep ? (
          <div className="shift-modal-actions">
            <button className="confirm" type="button" onClick={onConfirm}>
              네, 끝낼게요.
            </button>
            <button type="button" onClick={onHandoff}>
              인수인계 후 끝낼게요.
            </button>
          </div>
        ) : isSentStep ? (
          <div className="shift-modal-actions handoff-sent-actions">
            <button type="button" onClick={onNext}>
              확인하기
            </button>
            <button className="confirm" type="button" onClick={onClose}>
              퇴근하기
            </button>
          </div>
        ) : isGenerationComplete ? (
          <div className="shift-modal-actions generation-complete-actions">
            <button className="confirm" type="button" onClick={onNext}>
              확인하기
            </button>
          </div>
        ) : isReviewStep ? (
          <div className="handoff-review-actions">
            <button type="button" onClick={() => setIsJapaneseReview((current) => !current)}>
              {isJapaneseReview ? '한국어 원문 보기' : '번역 원문 보기'}
            </button>
            <button type="button" onClick={onBack}>
              수정하기
            </button>
            <button type="button">문서파일로 내보내기</button>
            <button className="confirm" type="button" onClick={onNext}>
              인수인계하기
            </button>
          </div>
        ) : isGeneratingStep || isSendingStep ? null : (
          <div className="shift-modal-actions recipient-actions">
            <button type="button" onClick={onBack}>
              이전
            </button>
            <button className="confirm" type="button" onClick={onNext} disabled={!canContinue}>
              {isAdditionalStep ? 'AI 인수인계 생성하기' : '다음'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
