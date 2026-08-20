import { useEffect, useMemo, useRef, useState } from 'react';
import { AcronymText } from './components/AcronymText.jsx';
import { Avatar } from './components/Avatar.jsx';
import { HandoffDashboard } from './components/dashboard/HandoffDashboard.jsx';
import { ShiftEndModal } from './components/handoff/ShiftEndModal.jsx';
import { ProfilePanel } from './components/ProfilePanel.jsx';
import { TeamSchedule } from './components/schedule/TeamSchedule.jsx';
import { contactsSeed, contactProfiles, emptyTermForm, initialMessages, languageMap, localizationGlossary } from './data/chatMock.js';
import { handoffDashboardMock } from './data/handoffMock.js';
import { handoffProjects, handoffRecipients } from './data/handoffFlowMock.js';
import { findAcronymsInLines, mergeAcronyms } from './utils/acronyms.js';
import { languageLabelForCountry } from './utils/handoffLabels.js';
import { isClusteredMessage, shouldShowMessageTime } from './utils/messageGrouping.js';
import { presenceOf } from './utils/timing.js';
import profileBanner from './assets/profile-banner.jpg';
import trLogo from './assets/TR_Logo.png';

const viewFromLocation = () => {
  if (typeof window === 'undefined') return 'dashboard';

  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();

  if (hash === '#schedule' || hash === '#/schedule' || hash === '#scadule' || hash === '#/scadule' || path === '/schedule' || path === '/scadule') {
    return 'schedule';
  }

  if (hash === '#messenger' || hash === '#/messenger' || path === '/messenger') {
    return 'messenger';
  }

  if (hash === '#settings' || hash === '#/settings' || path === '/settings') {
    return 'settings';
  }

  return 'dashboard';
};

const replaceHash = (hash) => {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', hash);
};

const contactTimingMap = {
  1: { countryCode: 'US' },
  2: { countryCode: 'RU' },
  3: { countryCode: 'KR' },
  4: { countryCode: 'JP' },
  5: { countryCode: 'GB' },
};

const formatContactTime = (contact) => {
  const timing = presenceOf(contact.countryCode ?? contactTimingMap[contact.id]?.countryCode ?? 'KR');
  return timing.clock;
};

const formatProfileLocalTime = (contact) => {
  const timing = presenceOf(contact.countryCode ?? contactTimingMap[contact.id]?.countryCode ?? 'KR');
  return `${timing.clock12} · ${timing.zoneAbbr}`;
};

const createJapaneseLocalVersion = (original = '', localizedText = '') => {
  const source = `${original} ${localizedText}`.toLowerCase();

  if (source.includes('aurora') && source.includes('iam')) {
    return 'Aurora の作業は IAM 権限の確認が必要です。';
  }

  if (source.includes('tomorrow morning')) {
    return '明日の午前中にお送りします。';
  }

  if (source.includes('pr') || source.includes('review')) {
    return 'PR のレビューをお願いします。';
  }

  if (source.includes('deployment') || source.includes('release')) {
    return 'デプロイ状況を確認してください。';
  }

  return localizedText || original;
};
const handoffDocumentTerms = [
  {
    acronym: 'AURORA #128',
    fullForm: 'Aurora 작업 추적 번호',
    explanation: 'Aurora 프로젝트에서 IAM Role 권한 문제를 추적하는 작업 항목입니다.',
    action: 'explain',
    reason: '인수자가 원본 기록이나 이슈를 다시 찾아볼 수 있는 기준점입니다.',
    tone: 'handoff',
  },
  {
    acronym: 'IAM Role',
    fullForm: 'Identity and Access Management Role',
    explanation: '클라우드 리소스에 접근할 수 있는 권한 묶음입니다.',
    action: 'explain',
    reason: '배포 중단의 직접 원인이므로 문맥 설명이 필요합니다.',
    tone: 'handoff',
  },
  {
    acronym: 'Production',
    fullForm: 'Production environment',
    explanation: '실제 사용자가 접속하는 운영 환경을 뜻합니다.',
    action: 'keep',
    reason: '개발팀과 제품팀 모두 자주 쓰는 운영 용어이므로 유지합니다.',
    tone: 'handoff',
  },
  {
    acronym: 'PR #142',
    fullForm: 'Pull Request #142',
    explanation: '코드 변경사항을 병합하기 전에 검토하는 요청 번호입니다.',
    action: 'explain',
    reason: '검토해야 할 코드 변경 범위를 명확히 하기 위해 표시합니다.',
    tone: 'handoff',
  },
  {
    acronym: 'OAuth',
    fullForm: 'Open Authorization',
    explanation: '비밀번호를 직접 공유하지 않고 안전하게 인증 권한을 위임하는 표준 방식입니다.',
    action: 'explain',
    reason: '인증 구조 변경의 핵심 기술 용어입니다.',
    tone: 'handoff',
  },
  {
    acronym: 'Platform',
    fullForm: 'Platform Team',
    explanation: '공통 인프라, 권한, 배포 환경을 관리하는 팀을 뜻합니다.',
    action: 'explain',
    reason: '현재 확인 대기 중인 팀을 정확히 이해해야 합니다.',
    tone: 'handoff',
  },
  {
    acronym: 'Aurora',
    fullForm: 'Aurora Project',
    explanation: '글로벌 인증 시스템 개편 프로젝트명입니다.',
    action: 'keep',
    reason: '회사 내부 프로젝트명이므로 번역하지 않고 보존합니다.',
    tone: 'handoff',
  },
  {
    acronym: 'AURORA',
    fullForm: 'Aurora Project',
    explanation: '글로벌 인증 시스템 개편 프로젝트명입니다.',
    action: 'keep',
    reason: '대문자로 기록된 내부 프로젝트 표기입니다.',
    tone: 'handoff',
  },
  {
    acronym: 'API',
    fullForm: 'Application Programming Interface',
    explanation: '서로 다른 시스템이 화면이나 데이터를 주고받기 위한 연결 규칙입니다.',
    action: 'explain',
    reason: '원어는 유지하되 비개발자에게도 설명이 필요합니다.',
    tone: 'handoff',
  },
  {
    acronym: 'QA',
    fullForm: 'Quality Assurance',
    explanation: '기능이 요구사항대로 동작하는지 검증하고 품질을 확인하는 과정입니다.',
    action: 'explain',
    reason: '다음 담당자가 이어서 검증 업무를 이해하는 데 필요합니다.',
    tone: 'handoff',
  },
];

const languageFlagMap = {
  ENG: 'us',
  KOR: 'kr',
  JPN: 'jp',
};

const handoffDocumentTermsJa = [
  {
    acronym: 'AURORA #128',
    fullForm: 'Aurora issue',
    explanation: 'Aurora project issue identifier. Keep it unchanged in localized handoff documents.',
    action: 'explain',
    reason: 'Project issue IDs should remain traceable across teams.',
    tone: 'handoff',
  },
  {
    acronym: 'IAM Role',
    fullForm: 'Identity and Access Management Role',
    explanation: 'A permission role used to control access to production resources.',
    action: 'explain',
    reason: 'This is important context for production deployment blockers.',
    tone: 'handoff',
  },
  {
    acronym: 'Production',
    fullForm: 'Production environment',
    explanation: 'The live service environment used by real users.',
    action: 'explain',
    reason: 'The business impact depends on the production deployment state.',
    tone: 'handoff',
  },
  {
    acronym: 'API',
    fullForm: 'Application Programming Interface',
    explanation: 'A software interface used for systems to communicate with each other.',
    action: 'explain',
    reason: 'Useful for recipients who need implementation context.',
    tone: 'handoff',
  },
  {
    acronym: 'QA',
    fullForm: 'Quality Assurance',
    explanation: 'A verification process for checking whether the product works as expected.',
    action: 'explain',
    reason: 'Clarifies the next validation step in the handoff.',
    tone: 'handoff',
  },
];
const createHandoffDocumentPages = (handoff) => [
  {
    type: 'cover',
    title: '업무 인수인계 브리핑',
    eyebrow: handoff.projectName,
    icon: 'bi-folder2-open',
  },
  {
    title: 'About the project',
    icon: 'bi-layers',
    terms: handoffDocumentTerms,
    body: [
      'AURORA 인증 시스템을 기존 방식에서 OAuth 기반 인증 구조로 전환하는 프로젝트입니다.',
      '글로벌 사용자 인증과 API 연동 범위를 포함하며, 현재 Production 배포 전 최종 점검 단계입니다.',
    ],
    points: ['Project Aurora', 'OAuth 인증 구조', 'Production 배포 준비'],
  },
  {
    title: 'Completed work',
    icon: 'bi-check2-square',
    terms: handoffDocumentTerms,
    body: ['오늘 완료한 작업과 담당 범위를 정리했습니다.'],
    tasks: [
      { state: '완료', title: '로그인 UI 개편', desc: '신규 인증 플로우에 맞게 로그인 화면을 개선했습니다.' },
      { state: '완료', title: 'OAuth API 연동', desc: '프론트엔드와 신규 인증 API를 연결했습니다.' },
      { state: '완료', title: 'PR #142 리뷰 반영', desc: '인증 기능 변경사항에 대한 리뷰 코멘트를 반영했습니다.' },
    ],
  },
  {
    title: 'Blocker & status',
    icon: 'bi-exclamation-diamond',
    terms: handoffDocumentTerms,
    body: ['Production 배포는 IAM Role 권한 문제로 보류된 상태입니다.'],
    points: ['영향: Aurora 운영 환경 배포 중단', '상태: Platform 팀 확인 대기', '관련 작업: AURORA #128'],
  },
  {
    title: 'Next actions',
    icon: 'bi-arrow-up-right-circle',
    terms: handoffDocumentTerms,
    body: ['다음 시간대 팀이 바로 이어서 확인해야 할 작업입니다.'],
    tasks: [
      { state: '우선', title: 'IAM Role 권한 확인', desc: '담당자: John' },
      { state: '다음', title: 'Production 배포 재시도', desc: '담당자: 김의중' },
      { state: '확인', title: '최종 인증 플로우 QA', desc: '담당자: Alex' },
    ],
  },
  {
    title: 'Additional request',
    icon: 'bi-chat-left-text',
    terms: handoffDocumentTerms,
    body: [handoff.additionalNote || '추가 요청 사항은 없습니다.'],
    points: ['전달자가 마지막으로 남긴 요청 사항입니다.', '필요 시 메신저에서 바로 확인해 주세요.'],
  },
];

/**
 * 서버(/api/handoff/translate)가 돌려준 번역을 한국어 페이지 위에 덮어씁니다.
 *
 * 아이콘·용어 팝오버·페이지 종류는 화면 구조라서 그대로 두고, 사람이 읽는
 * 문자열만 갈아끼웁니다. 번역이 없으면 한국어 원문 그대로 보여줍니다.
 * 원문에 없던 칸(points / tasks)은 만들지 않습니다. 빈 블록이 생깁니다.
 */
const mergeHandoffDocumentTranslation = (pages, translation) => {
  if (!translation?.pages) return pages;

  return pages.map((page, index) => {
    const translated = translation.pages[index];
    if (!translated) return page;

    const merged = { ...page, title: translated.title || page.title };

    if (page.type === 'cover') return merged;

    // 용어 설명도 인계자가 읽는 것이라 번역 보기에서는 영문 설명을 씁니다.
    merged.terms = handoffDocumentTermsJa;

    if (page.body) merged.body = translated.body ?? page.body;
    if (page.points) merged.points = translated.points ?? page.points;
    if (page.tasks) {
      merged.tasks = page.tasks.map((task, taskIndex) => ({
        ...task,
        ...(translated.tasks?.[taskIndex] ?? {}),
      }));
    }

    return merged;
  });
};

/** 번역 요청에 담을 문자열만 뽑습니다. (아이콘·용어는 서버가 알 필요가 없습니다) */
const toTranslatablePages = (pages) =>
  pages.map((page) => ({
    title: page.title ?? '',
    body: page.body ?? [],
    points: page.points ?? [],
    tasks: (page.tasks ?? []).map(({ state, title, desc }) => ({ state, title, desc })),
  }));

const settingsTabs = [
  { id: 'personal', label: '개인', icon: 'bi-person' },
  { id: 'workflow', label: '워크플로우', icon: 'bi-activity' },
  { id: 'team', label: '팀', icon: 'bi-people' },
  { id: 'environment', label: '환경설정', icon: 'bi-gear' },
  { id: 'account', label: '계정', icon: 'bi-person-circle' },
];

const settingsPanelData = {
  personal: {
    title: '개인',
    description: '프로필과 근무 시간, 시간대 등 개인 업무 정보를 관리합니다.',
    icon: 'bi-person',
    rows: [
      { label: '이름', value: '김의중' },
      { label: '이메일', value: 'roplekorea@example.com' },
      { label: '시간대', value: '대한민국 서울 | KST' },
      { label: '언어', value: '한국어', flag: 'KR' },
    ],
    details: [
      { label: '내 소개', value: '', action: '편집' },
      { label: '소셜 연동 관리', value: '', action: '편집', socials: ['bi-telegram', 'bi-linkedin', 'bi-slack', 'bi-github'] },
      { label: '프로필 정보 공개 여부', value: '전체 공개', action: '편집' },
    ],
    footer: { label: '근무 시간', value: '08:30 - 17:30', action: '편집' },
  },
  workflow: {
    title: '워크플로우',
    description: '근무 종료와 인수인계 생성 흐름을 관리합니다.',
    icon: 'bi-activity',
    rows: [
      { label: '인수인계 알림', value: '근무 종료 15분 전' },
      { label: '자동 요약 범위', value: '최근 24시간' },
      { label: '우선순위 정렬', value: 'Blocker 먼저' },
      { label: '현지어 변환', value: '켜짐' },
    ],
    details: [
      { label: '브리핑 미리보기', value: '전송 전 확인', action: '편집' },
      { label: '메신저 카드 전달', value: '확인 후 전송', action: '편집' },
      { label: '추가 요청사항', value: '마지막 페이지 반영', action: '편집' },
    ],
    footer: { label: '기본 흐름', value: '생성 → 검토 → 전송', action: '편집' },
  },
  team: {
    title: '팀',
    description: '인수인계 대상과 팀 표시 정보를 관리합니다.',
    icon: 'bi-people',
    rows: [
      { label: '기본 인수인계 순서', value: '서울 > 도쿄 > 미국' },
      { label: '자리비움 팀원 표시', value: '켜짐' },
      { label: '현지 시간 자동 표기', value: 'timing.js 기준' },
      { label: '팀원 목록', value: '5명' },
    ],
    details: [
      { label: 'Aurora 기본 인계자', value: 'Waguri Kaoruko · 도쿄', action: '편집' },
      { label: '프로젝트 범위', value: '진행 중 프로젝트', action: '편집' },
      { label: '상태 표시', value: '근무중 / 회의중 / 자리비움', action: '편집' },
    ],
    footer: { label: '팀 기준 시간대', value: 'KST · JST · EST', action: '편집' },
  },
  environment: {
    title: '환경설정',
    description: '알림, 언어, 표시 옵션 등 사용 환경을 관리합니다.',
    icon: 'bi-gear',
    rows: [
      { label: '테마', value: 'Dark Glass' },
      { label: '알림', value: '켜짐' },
      { label: '기본 언어', value: '한국어', flag: 'KR' },
      { label: '시간 표시', value: '24시간제' },
    ],
    details: [
      { label: '브라우저 알림', value: '중요 항목만', action: '편집' },
      { label: '애니메이션', value: '켜짐', action: '편집' },
      { label: '접근성 표시', value: '기본', action: '편집' },
    ],
    footer: { label: '데이터 새로고침', value: '수동', action: '편집' },
  },
  account: {
    title: '계정',
    description: '로그인 계정과 보안 정보를 관리합니다.',
    icon: 'bi-person-circle',
    rows: [
      { label: '계정 유형', value: '개발팀' },
      { label: '로그인 이메일', value: 'roplekorea@example.com' },
      { label: '권한', value: '관리자' },
      { label: '세션', value: '활성' },
    ],
    details: [
      { label: '비밀번호', value: '최근 변경 12일 전', action: '변경' },
      { label: '연결된 서비스', value: 'Github · Slack', action: '관리' },
      { label: '계정 공개 범위', value: '조직 내부', action: '편집' },
    ],
    footer: { label: '보안 알림', value: '켜짐', action: '편집' },
  },
};

function SettingsPanel() {
  const [activeSettingsTab, setActiveSettingsTab] = useState('personal');
  const activeSettings = settingsPanelData[activeSettingsTab] ?? settingsPanelData.personal;
  const profileTiming = presenceOf('KR');
  const settingRows = activeSettings.rows;
  const privacyRows = activeSettings.details;
  const footerRow = activeSettings.footer;

  return (
    <main className="settings-page" aria-label="설정">
      <nav className="settings-tabs" aria-label="설정 분류">
        {settingsTabs.map((tab) => (
          <button
            className={tab.id === activeSettingsTab ? 'active' : ''}
            type="button"
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id)}
            aria-pressed={tab.id === activeSettingsTab}
          >
            <i className={'bi ' + tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <section className="settings-copy" aria-label="현재 설정 섹션">
        <i className={'bi ' + activeSettings.icon} />
        <div>
          <strong>{activeSettings.title}</strong>
          <p>{activeSettings.description}</p>
        </div>
      </section>

      <section className="settings-preview" aria-label={activeSettingsTab === 'personal' ? '프로필 미리보기' : activeSettings.title + ' 미리보기'}>
        {activeSettingsTab === 'personal' ? (
          <>
            <h3>프로필 미리보기</h3>
            <article className="settings-profile-card">
              <div className="settings-profile-banner">
                <img src={profileBanner} alt="프로필 배너" />
              </div>
              <div className="settings-profile-body">
                <div className="settings-preview-avatar">
                  <span>김</span>
                </div>
                <strong>김의중</strong>
                <small>roplekorea@example.com</small>
                <div className="settings-profile-pills">
                  <span><i className="bi bi-globe2" /> 대한민국 서울</span>
                  <span><i className="bi bi-clock" /> {profileTiming.clock} - KST</span>
                </div>
                <div className="settings-profile-section">
                  <b>소개</b>
                  <p>Front Engineer of APEX Company<br />email: roplekorea@example.com<br />tel: 123-456-2101</p>
                </div>
                <div className="settings-profile-section social">
                  <b>소셜 연결</b>
                  <div>
                    <span><i className="bi bi-github" /> Github</span>
                    <span><i className="bi bi-slack" /> Slack</span>
                    <span><i className="bi bi-linkedin" /> LinkedIn</span>
                    <span><i className="bi bi-telegram" /> Telegram</span>
                  </div>
                </div>
              </div>
            </article>
          </>
        ) : (
          <>
            <h3>{activeSettings.title}</h3>
            <article className="settings-context-card settings-card">
              <i className={'bi ' + activeSettings.icon} />
              <small>{activeSettings.title}</small>
              <strong>{activeSettings.description}</strong>
              <div>
                {settingRows.slice(0, 3).map((row) => (
                  <span key={row.label}>
                    <b>{row.label}</b>
                    <em>{row.value}</em>
                  </span>
                ))}
              </div>
            </article>
          </>
        )}
      </section>

      <div className="settings-link-line" aria-hidden="true"><span /></div>

      <section className="settings-panel-list" aria-label={activeSettings.title + ' 설정 목록'}>
        <article className="settings-card account-info">
          {settingRows.map((row) => (
            <div className="settings-row" key={row.label}>
              <span>{row.label}</span>
              <strong className={row.flag ? 'settings-language-value' : ''}>
                {row.flag && <em>{row.flag}</em>}
                {row.value}
              </strong>
              <button type="button">수정</button>
            </div>
          ))}
        </article>

        <article className="settings-card privacy-info">
          {privacyRows.map((row) => (
            <div className="settings-row" key={row.label}>
              <span>{row.label}</span>
              {row.socials ? (
                <div className="settings-social-icons">
                  {row.socials.map((icon) => <i className={'bi ' + icon} key={icon} />)}
                </div>
              ) : (
                <strong>{row.value}</strong>
              )}
              <button type="button">{row.action}</button>
            </div>
          ))}
        </article>

        <article className="settings-card work-hours">
          <div className="settings-row">
            <span>{footerRow.label}</span>
            <strong>{footerRow.value}</strong>
            <button type="button">{footerRow.action}</button>
          </div>
        </article>
      </section>
    </main>
  );
}
function App() {
  const [contacts, setContacts] = useState(contactsSeed);
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('전체');
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [translateMode, setTranslateMode] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [localizationResult, setLocalizationResult] = useState(null);
  const [appliedLocalization, setAppliedLocalization] = useState(null);
  const [localizationLoading, setLocalizationLoading] = useState(false);
  const [localizationError, setLocalizationError] = useState('');
  const [openOriginalIds, setOpenOriginalIds] = useState([]);
  const [openHandoffCardIds, setOpenHandoffCardIds] = useState([]);
  const [activeHandoffDocumentId, setActiveHandoffDocumentId] = useState(null);
  const [handoffDocumentPage, setHandoffDocumentPage] = useState(0);
  const [handoffPageDirection, setHandoffPageDirection] = useState('open');
  const [handoffDocumentLanguage, setHandoffDocumentLanguage] = useState('ko');
  // 문서 화면의 인계자 언어 번역 (Border 02 × Border 04)
  const [handoffDocumentTranslation, setHandoffDocumentTranslation] = useState(null);
  const [handoffDocumentTranslating, setHandoffDocumentTranslating] = useState(false);
  const [handoffDocumentTranslateError, setHandoffDocumentTranslateError] = useState('');
  const [handoffAdditionalNote, setHandoffAdditionalNote] = useState('');
  const [localLanguageNotice, setLocalLanguageNotice] = useState(false);
  const [activeAcronym, setActiveAcronym] = useState(null);
  const [userAcronyms, setUserAcronyms] = useState([]);
  const [termPanelOpen, setTermPanelOpen] = useState(false);
  const [termListOpen, setTermListOpen] = useState(false);
  const [editingAcronym, setEditingAcronym] = useState('');
  const [activeView, setActiveView] = useState(viewFromLocation);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shiftEndOpen, setShiftEndOpen] = useState(false);
  const [shiftModalStep, setShiftModalStep] = useState('confirm');
  const [selectedHandoffRecipient, setSelectedHandoffRecipient] = useState('');
  const [selectedHandoffProject, setSelectedHandoffProject] = useState('');
  // Border 04 (조직) — 실제 AI 인수인계 브리핑 결과
  const [handoffBriefing, setHandoffBriefing] = useState(null);
  const [handoffBriefingError, setHandoffBriefingError] = useState('');
  const [termForm, setTermForm] = useState(emptyTermForm);
  const [profileTimeTick, setProfileTimeTick] = useState(0);
  const conversationEndRef = useRef(null);

  const selectedContact = contacts.find((contact) => contact.id === selectedId) ?? contacts[0];
  const selectedProfile = contactProfiles[selectedContact.id] ?? contactProfiles.default;
  const selectedProfileWithTiming = useMemo(
    () => ({
      ...selectedProfile,
      localTime: formatProfileLocalTime(selectedContact),
    }),
    [selectedContact, selectedProfile, profileTimeTick]
  );
  const isMessengerView = activeView === 'messenger';
  const isScheduleView = activeView === 'schedule';
  const isDashboardView = activeView === 'dashboard';
  const isSettingsView = activeView === 'settings';

  
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()),
    [],
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesQuery = `${contact.name} ${contact.message}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === '전체' || (filter === '읽지 않음' && contact.unread > 0) || (filter === '즐겨찾기' && contact.starred);
      return matchesQuery && matchesFilter;
    });
  }, [contacts, filter, query]);

  const visibleMessages = useMemo(() => {
    return messages.filter((message) => !message.contactId || message.contactId === selectedId);
  }, [messages, selectedId]);

  const activeHandoffDocument = useMemo(() => {
    return visibleMessages.find((message) => message.id === activeHandoffDocumentId && message.type === 'handoff-card') ?? null;
  }, [activeHandoffDocumentId, visibleMessages]);

  // 한국어 원문 페이지. 번역은 이 위에 덮어씁니다.
  const activeHandoffSourcePages = useMemo(() => {
    return activeHandoffDocument ? createHandoffDocumentPages(activeHandoffDocument.handoff) : [];
  }, [activeHandoffDocument]);

  const activeHandoffPages = useMemo(() => {
    if (handoffDocumentLanguage !== 'local') return activeHandoffSourcePages;
    return mergeHandoffDocumentTranslation(activeHandoffSourcePages, handoffDocumentTranslation);
  }, [activeHandoffSourcePages, handoffDocumentLanguage, handoffDocumentTranslation]);

  // 인계자 국가 → 번역 언어. 카드에 없으면 예전 목업대로 일본으로 봅니다.
  const handoffRecipientCountryCode = activeHandoffDocument?.handoff?.countryCode ?? 'JP';
  const handoffRecipientLanguageLabel = languageLabelForCountry(handoffRecipientCountryCode);

  /**
   * 번역 보기 토글. 처음 켤 때 한 번만 서버를 부르고 이후에는 캐시를 씁니다.
   * (ShiftEndModal 의 번역 토글과 같은 방식입니다)
   */
  const toggleHandoffDocumentLanguage = async () => {
    if (handoffDocumentLanguage === 'local') {
      setHandoffDocumentLanguage('ko');
      return;
    }

    if (handoffDocumentTranslation) {
      setHandoffDocumentLanguage('local');
      return;
    }

    setHandoffDocumentTranslating(true);
    setHandoffDocumentTranslateError('');

    try {
      const response = await fetch('/api/handoff/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: toTranslatablePages(activeHandoffSourcePages),
          countryCode: handoffRecipientCountryCode,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? `서버 오류 (${response.status})`);

      setHandoffDocumentTranslation(payload);
      setHandoffDocumentLanguage('local');
    } catch (error) {
      setHandoffDocumentTranslateError(error.message || '번역에 실패했습니다.');
    } finally {
      setHandoffDocumentTranslating(false);
    }
  };

  const closeHandoffDocument = () => {
    setActiveHandoffDocumentId(null);
    setHandoffDocumentPage(0);
    setHandoffPageDirection('open');
    setHandoffDocumentLanguage('ko');
    setHandoffDocumentTranslation(null);
    setHandoffDocumentTranslateError('');
  };

  const openHandoffDocument = (messageId) => {
    setActiveHandoffDocumentId(messageId);
    setHandoffDocumentPage(0);
    setHandoffPageDirection('open');
    setHandoffDocumentLanguage('ko');
    setHandoffDocumentTranslation(null);
    setHandoffDocumentTranslateError('');
  };

  const moveHandoffPage = (direction) => {
    setHandoffPageDirection(direction);
    setHandoffDocumentPage((page) => {
      if (direction === 'next') {
        return Math.min(activeHandoffPages.length - 1, page + 1);
      }

      return Math.max(0, page - 1);
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncViewFromLocation = () => setActiveView(viewFromLocation());
    window.addEventListener('hashchange', syncViewFromLocation);

    return () => window.removeEventListener('hashchange', syncViewFromLocation);
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProfileTimeTick((tick) => tick + 1);
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!localLanguageNotice) return undefined;

    const noticeTimer = window.setTimeout(() => {
      setLocalLanguageNotice(false);
    }, 2200);

    return () => window.clearTimeout(noticeTimer);
  }, [localLanguageNotice]);

  const toggleStar = (event, id) => {
    event.stopPropagation();
    setContacts((items) => items.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item)));
  };

  const handleDraftChange = (value) => {
    setDraft(value);
    setLocalizationError('');

    if (localizationResult && value.trim() !== localizationResult.original && value.trim() !== localizationResult.localizedText) {
      setLocalizationResult(null);
    }

    if (appliedLocalization && value.trim() !== appliedLocalization.localizedText) {
      setAppliedLocalization(null);
    }
  };

  const localizeDraft = async () => {
    const value = draft.trim();
    if (!value || localizationLoading) return;

    setLocalizationLoading(true);
    setLocalizationError('');
    setLocalizationResult(null);
    setAppliedLocalization(null);

    try {
      const response = await fetch('/api/localize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: value,
          sourceLanguage: 'ko',
          targetLanguage: languageMap[selectedContact.language] ?? 'en',
          recipient: {
            country: selectedContact.language === 'ENG' ? 'US' : 'KR',
            role: 'Product Manager',
            team: 'Product',
          },
          glossary: localizationGlossary,
        }),
      });

      const responseText = await response.text();
      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error('API 응답을 읽을 수 없습니다. dev server를 다시 실행한 뒤 다시 시도해 주세요.');
      }

      if (!response.ok) {
        throw new Error(data?.error || 'AI 현지화 요청에 실패했습니다.');
      }

      setTranslateMode(true);
      setLocalizationResult(data);
    } catch (error) {
      setLocalizationError(error.message || 'AI 현지화 요청에 실패했습니다.');
    } finally {
      setLocalizationLoading(false);
    }
  };

  const applyLocalization = () => {
    if (!localizationResult) return;
    setDraft(localizationResult.localizedText);
    setAppliedLocalization(localizationResult);
  };

  const toggleOriginal = (messageId) => {
    setOpenOriginalIds((ids) => (ids.includes(messageId) ? ids.filter((id) => id !== messageId) : [...ids, messageId]));
  };

  const showAcronymPopover = (acronym, target) => {
    const rect = target.getBoundingClientRect();
    const width = Math.min(390, window.innerWidth - 32);
    const left = Math.min(Math.max(rect.left + rect.width / 2, 16 + width / 2), window.innerWidth - 16 - width / 2);
    const top = rect.top - 14;

    setActiveAcronym({
      ...acronym,
      position: {
        left,
        top,
        width,
      },
    });
  };

  const hideAcronymPopover = () => {
    setActiveAcronym(null);
  };

  const updateTermForm = (field, value) => {
    setTermForm((form) => ({ ...form, [field]: value }));
  };

  const resetTermEditor = () => {
    setTermForm(emptyTermForm);
    setEditingAcronym('');
  };

  const closeTermEditor = () => {
    setTermPanelOpen(false);
    setTermListOpen(false);
    resetTermEditor();
  };

  const saveUserAcronym = (event) => {
    event.preventDefault();

    const nextTerm = {
      acronym: termForm.acronym.trim(),
      fullForm: termForm.fullForm.trim(),
      explanation: termForm.explanation.trim(),
      action: termForm.action,
      reason: termForm.reason.trim(),
    };

    if (!nextTerm.acronym || !nextTerm.fullForm || !nextTerm.explanation) return;

    setUserAcronyms((items) => {
      const withoutDuplicate = items.filter((item) => item.acronym !== nextTerm.acronym && item.acronym !== editingAcronym);
      return [...withoutDuplicate, nextTerm];
    });
    resetTermEditor();
    setTermListOpen(true);
  };

  const removeUserAcronym = (acronym) => {
    setUserAcronyms((items) => items.filter((item) => item.acronym !== acronym));
    if (editingAcronym === acronym) {
      resetTermEditor();
    }
  };

  const editUserAcronym = (item) => {
    setTermForm({
      acronym: item.acronym,
      fullForm: item.fullForm,
      explanation: item.explanation,
      action: item.action,
      reason: item.reason,
    });
    setEditingAcronym(item.acronym);
    setTermPanelOpen(true);
  };

  const sendMessage = () => {
    const activeLocalization = appliedLocalization ?? localizationResult;
    const value =
      translateMode && activeLocalization
        ? appliedLocalization
          ? draft.trim()
          : activeLocalization.localizedText.trim()
        : draft.trim();
    if (!value) return;
    const createdAt = Date.now();
    const messageAcronyms = findAcronymsInLines([value], userAcronyms);
    const localLanguageText = activeLocalization ? createJapaneseLocalVersion(activeLocalization.original, value) : '';

    setMessages((items) => [
      ...items,
      {
        id: createdAt,
        sender: 'me',
        text: [value],
        time: new Date(createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
        createdAt,
        contactId: selectedId,
        translated: translateMode && Boolean(activeLocalization),
        localization: activeLocalization ? { ...activeLocalization, localizedText: value, localLanguageText } : null,
        acronyms: messageAcronyms.length ? messageAcronyms : undefined,
      },
    ]);
    setDraft('');
    setLocalizationResult(null);
    setAppliedLocalization(null);
    setLocalizationError('');
    setContacts((items) =>
      items.map((item) => (item.id === selectedId ? { ...item, message: `나: ${value}`, unread: 0, time: '방금 전' } : item))
    );
  };

  const openDashboard = () => {
    setActiveView('dashboard');
    replaceHash('#dashboard');
    setProfileOpen(false);
    setChatOpen(false);
  };

  const openMessenger = () => {
    setActiveView('messenger');
    replaceHash('#messenger');
  };

  const openSchedule = () => {
    setActiveView('schedule');
    replaceHash('#schedule');
    setProfileOpen(false);
    setChatOpen(false);
  };

  const openSettings = () => {
    setActiveView('settings');
    replaceHash('#settings');
    setProfileOpen(false);
    setChatOpen(false);
  };

  const closeShiftEndModal = () => {
    setShiftEndOpen(false);
    setShiftModalStep('confirm');
    setSelectedHandoffRecipient('');
    setSelectedHandoffProject('');
    setHandoffAdditionalNote('');
    setHandoffBriefing(null);
    setHandoffBriefingError('');
  };
  const generateHandoffBriefing = async () => {
    setHandoffBriefing(null);
    setHandoffBriefingError('');

    const projectName = selectedHandoffProject
      ? selectedHandoffProject.replace(/-\d+$/, '')
      : 'Project Aurora';

    try {
      const response = await fetch('/api/handoff/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: projectName,
          additionalNote: handoffAdditionalNote,
          recipient: selectedHandoffRecipient,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `서버 오류 (${response.status})`);

      setHandoffBriefing(payload);
    } catch (error) {
      setHandoffBriefingError(error.message);
    }
  };

  const deliverHandoffToMessenger = () => {
    const recipientIndex = handoffRecipients.findIndex((member) => member.name === selectedHandoffRecipient);
    const targetContact = contacts[recipientIndex] ?? contacts.find((contact) => contact.name === selectedHandoffRecipient) ?? contacts[0];
    const projectName = selectedHandoffProject ? selectedHandoffProject.replace(/-\d+$/, '') : 'Project Aurora';
    const createdAt = Date.now();

    setSelectedId(targetContact.id);
    setChatOpen(true);
    setProfileOpen(false);
    setMessages((items) => [
      ...items,
      {
        id: createdAt,
        type: 'handoff-card',
        sender: 'me',
        time: new Date(createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }),
        createdAt,
        contactId: targetContact.id,
        handoff: {
          projectName,
          recipientName: targetContact.name,
          // 문서 화면을 어떤 언어로 번역할지 정하는 값입니다.
          countryCode: handoffRecipients[recipientIndex]?.countryCode ?? 'JP',
          cleanRoute: '서울 → 도쿄',
          date: '8월 15일',
          timestamp: '2026.8.15 PM 9:26',
          from: '개발팀 프론트엔드 김의중',
          cleanSummary: 'Aurora 인증 기능 개발은 대부분 완료되었지만 IAM 권한 문제로 Production 배포가 보류된 상태입니다.',
          additionalNote: handoffAdditionalNote.trim(),
          route: '서울 → 도쿄',
          summary: 'Aurora 인증 기능 개발은 대부분 완료되었지만 IAM 권한 문제로 Production 배포가 보류된 상태입니다.',
          completed: 8,
          blockers: 4,
          actions: 2,
          decisions: 1,
        },
      },
    ]);
    setContacts((items) =>
      items.map((item) =>
        item.id === targetContact.id
          ? {
              ...item,
              message: '업무 인수인계 브리핑이 도착했어요.',
              unread: 0,
              time: '방금 전',
            }
          : item
      )
    );
  };

  const getMessageLocalization = (message) => {
    if (message.localization) return message.localization;
    if (!message.translated || message.type === 'date') return null;

    const messageText = Array.isArray(message.text) ? message.text.join(' ') : message.text;

    return {
      original: messageText,
      localizedText: messageText,
    };
  };

  return (
    <main className="app-shell">
      {activeAcronym && (
        <div
          className={`acronym-popover ${activeAcronym.tone === 'handoff' ? 'handoff-term-popover' : ''}`}
          role="tooltip"
          style={{
            left: activeAcronym.position.left,
            top: activeAcronym.position.top,
            width: activeAcronym.position.width,
          }}
        >
          <strong>{activeAcronym.acronym}</strong>
          <span>{activeAcronym.fullForm}</span>
          <small>{activeAcronym.explanation}</small>
          <em>{activeAcronym.reason}</em>
        </div>
      )}
      {activeHandoffDocument && (
        <div
          className="handoff-document-layer"
          role="presentation"
          onMouseDown={closeHandoffDocument}
        >
          <section
            className="handoff-document-viewer"
            role="dialog"
            aria-modal="true"
            aria-label="업무 인수인계 브리핑"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="handoff-document-close"
              type="button"
              aria-label="브리핑 닫기"
              onClick={closeHandoffDocument}
            >
              <i className="bi bi-x-lg" />
            </button>
            <div className={`handoff-page-stack page-${handoffPageDirection}`}>
              {handoffDocumentPage === 0 ? (
                <article className="handoff-document-page cover" key={`handoff-page-${handoffDocumentPage}`}>
                  <div className="handoff-cover-top">
                    <span>
                      From
                      <strong>{activeHandoffDocument.handoff.from ?? '개발팀 프론트엔드 김의중'}</strong>
                    </span>
                    <time>{activeHandoffDocument.handoff.timestamp ?? '2026.8.15 PM 9:26'}</time>
                  </div>
                  <div className="handoff-cover-title">
                    <small>{activeHandoffDocument.handoff.projectName}</small>
                    <strong>
                      {activeHandoffPages[0]?.title ?? '업무 인수인계 브리핑'}
                    </strong>
                  </div>
                  <span className="handoff-language-pill">
                    <i className="bi bi-circle-fill" />
                    {handoffDocumentLanguage === 'local' ? handoffRecipientLanguageLabel : '한국어'}
                  </span>
                </article>
              ) : (
                <article className="handoff-document-page content" key={`handoff-page-${handoffDocumentPage}`}>
                  <div className="handoff-page-head">
                    <i className={`bi ${activeHandoffPages[handoffDocumentPage]?.icon ?? 'bi-file-earmark-text'}`} />
                    <h3>{activeHandoffPages[handoffDocumentPage]?.title}</h3>
                  </div>
                  <div className="handoff-page-body">
                    {activeHandoffPages[handoffDocumentPage]?.body?.map((paragraph) => (
                      <p key={paragraph}>
                        <AcronymText
                          text={paragraph}
                          acronyms={activeHandoffPages[handoffDocumentPage]?.terms ?? []}
                          onShow={showAcronymPopover}
                          onHide={hideAcronymPopover}
                        />
                      </p>
                    ))}
                    {activeHandoffPages[handoffDocumentPage]?.points && (
                      <div className="handoff-page-points">
                        {activeHandoffPages[handoffDocumentPage].points.map((point) => (
                          <span key={point}>
                            <i className="bi bi-dot" />
                            <AcronymText
                              text={point}
                              acronyms={activeHandoffPages[handoffDocumentPage]?.terms ?? []}
                              onShow={showAcronymPopover}
                              onHide={hideAcronymPopover}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                    {activeHandoffPages[handoffDocumentPage]?.tasks && (
                      <div className="handoff-page-tasks">
                        {activeHandoffPages[handoffDocumentPage].tasks.map((task) => (
                          <article key={task.title}>
                            <span>{task.state}</span>
                            <div>
                              <strong>
                                <AcronymText
                                  text={task.title}
                                  acronyms={activeHandoffPages[handoffDocumentPage]?.terms ?? []}
                                  onShow={showAcronymPopover}
                                  onHide={hideAcronymPopover}
                                />
                              </strong>
                              <small>
                                <AcronymText
                                  text={task.desc}
                                  acronyms={activeHandoffPages[handoffDocumentPage]?.terms ?? []}
                                  onShow={showAcronymPopover}
                                  onHide={hideAcronymPopover}
                                />
                              </small>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              )}
            </div>
            <div className="handoff-document-toolbar">
              <div className="handoff-document-controls">
                <button type="button" onClick={() => moveHandoffPage('prev')} disabled={handoffDocumentPage === 0}>
                  <i className="bi bi-chevron-left" />
                </button>
                <span>
                  {handoffDocumentPage + 1} / {activeHandoffPages.length}
                </span>
                <button
                  type="button"
                  onClick={() => moveHandoffPage('next')}
                  disabled={handoffDocumentPage === activeHandoffPages.length - 1}
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
              <div className="handoff-document-language-toggle" aria-label="인수인계 문서 언어 선택">
                <button
                  className={handoffDocumentLanguage === 'ko' ? 'active' : ''}
                  type="button"
                  onClick={() => setHandoffDocumentLanguage('ko')}
                >
                  한국어
                </button>
                <button
                  className={handoffDocumentLanguage === 'local' ? 'active' : ''}
                  type="button"
                  onClick={toggleHandoffDocumentLanguage}
                  disabled={handoffDocumentTranslating}
                >
                  {handoffDocumentTranslating ? '번역 중…' : handoffRecipientLanguageLabel} <small>현지어</small>
                </button>
              </div>
            </div>
            {handoffDocumentTranslateError && (
              <p className="handoff-document-translate-error" role="alert">
                {handoffDocumentTranslateError}
              </p>
            )}
          </section>
        </div>
      )}
      <section className={`apex-window ${isMessengerView ? 'view-messenger' : isScheduleView ? 'view-schedule' : isSettingsView ? 'view-settings' : 'view-dashboard'} ${chatOpen ? 'mobile-chat-open' : ''} ${isMessengerView && profileOpen ? 'profile-open' : ''}`}>
        <header className="topbar">
          <h1 className="brand-logo">
            <img src={trLogo} alt="Timezone Relay" />
          </h1>
          {isMessengerView ? (
            <h2>채팅</h2>
          ) : isScheduleView ? (
            <h2>팀 일정</h2>
          ) : isSettingsView ? (
            <h2>설정</h2>
          ) : (
            <div className="dashboard-org">
              <span>
                <i className="bi bi-building" />
              </span>
              <div>
                <small>내 조직</small>
                <strong>APEX Global Industry (한국지사)</strong>
              </div>
            </div>
          )}
          <div className="top-actions">
            {(isDashboardView || isScheduleView) && <span className="dashboard-date">{todayLabel}</span>}
            <button className="notification-button" type="button" aria-label="알림">
              <i className="bi bi-bell" />
              <span />
            </button>
            <button className="profile" type="button" aria-label="프로필 메뉴">
              <span className="profile-avatar">김</span>
              <span className="profile-copy">
                <strong>김의중</strong>
                <small>개발팀</small>
              </span>
              <i className="bi bi-chevron-down" />
            </button>
          </div>
        </header>

        {localLanguageNotice && (
          <div className="local-language-notice" role="status" aria-live="polite">
            <i className="bi bi-stars" />
            <span>AI가 팀원의 현지어로 변환했어요</span>
          </div>
        )}

        <nav className="sidebar" aria-label="주요 메뉴">
          <button className={isDashboardView ? 'selected' : ''} type="button" onClick={openDashboard} aria-label="대시보드">
            <i className="bi bi-grid" />
          </button>
          <button className={isMessengerView ? 'selected' : ''} type="button" onClick={openMessenger} aria-label="채팅">
            <i className="bi bi-chat" />
          </button>
          <button className={isScheduleView ? 'selected' : ''} type="button" onClick={openSchedule} aria-label="팀 일정">
            <i className="bi bi-calendar3" />
          </button>
          <button className={isSettingsView ? 'selected' : ''} type="button" onClick={openSettings} aria-label="설정">
            <i className="bi bi-gear" />
          </button>
        </nav>

        {isDashboardView && <HandoffDashboard data={handoffDashboardMock} onOpenMessenger={openMessenger} onOpenShiftEnd={() => setShiftEndOpen(true)} />}
        {isScheduleView && <TeamSchedule />}
        {isSettingsView && <SettingsPanel />}

        {isMessengerView && (
          <>
        <aside className="message-list">
          <div className="panel-head">
            <strong>메시지</strong>
            <div className="tools">
              <label className="search-control" aria-label="메시지 검색">
                <i className="bi bi-search" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색" />
              </label>
              <button type="button" className="filter" onClick={() => setFilter(filter === '전체' ? '읽지 않음' : filter === '읽지 않음' ? '즐겨찾기' : '전체')}>
                {filter}
                <i className="bi bi-chevron-down" />
              </button>
            </div>
          </div>

          <div className="contacts">
            {filteredContacts.map((contact) => (
              <button
                className={`contact-row ${contact.id === selectedId ? 'active' : ''}`}
                key={contact.id}
                onClick={() => {
                  setSelectedId(contact.id);
                  setChatOpen(true);
                }}
                type="button"
              >
                <Avatar contact={contact} />
                <span className="contact-text">
                  <strong>{contact.name}</strong>
                  <small>
                    {contact.unread > 0 && <span className="blue-dot" />}
                    {contact.message}
                  </small>
                </span>
                <span className="contact-meta">
                  <time>{formatContactTime(contact)}</time>
                  <span className="star" onClick={(event) => toggleStar(event, contact.id)} role="button" tabIndex="0" aria-label="利먭꺼李얘린">
                    <i className={`bi ${contact.starred ? 'bi-star-fill' : 'bi-star'}`} />
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button className="new-chat" type="button" aria-label="새 채팅">
            <i className="bi bi-plus-lg" />
          </button>
        </aside>

        <section className="chat-panel">
          <header className="chat-head">
            <div className="chat-title">
              <button className="mobile-back" type="button" onClick={() => setChatOpen(false)} aria-label="채팅 목록으로 돌아가기">
                <i className="bi bi-chevron-left" />
              </button>
              <button className="chat-profile-trigger" type="button" onClick={() => setProfileOpen(true)} aria-label={`${selectedContact.name} 프로필 열기`}> 
                <Avatar contact={selectedContact} large />
                <div>
                  <div className="name-line">
                    <strong>{selectedContact.name}</strong>
                    <span className="language">
                      <span className={`language-flag flag-${languageFlagMap[selectedContact.language] ?? 'us'}`} aria-hidden="true" />
                      {selectedContact.language}
                    </span>
                  </div>
                  <small>온라인</small>
                </div>
              </button>
            </div>
            <div className="chat-actions">
              <button type="button" aria-label="음성 통화">
                <i className="bi bi-telephone" />
              </button>
              <button type="button" aria-label="영상 통화">
                <i className="bi bi-camera-video" />
              </button>
              <button type="button" aria-label="더보기">
                <i className="bi bi-three-dots" />
              </button>
            </div>
          </header>

          <div className="conversation">
            {visibleMessages.map((message, index) => {
              const messageLocalization = getMessageLocalization(message);

              return message.type === 'date' ? (
                <div className="date-divider" key={message.id}>
                  <span />
                  <strong>{message.text}</strong>
                  <span />
                </div>
              ) : message.type === 'handoff-card' ? (
                <article className={`message ${message.sender} handoff-message`} key={message.id}>
                  <div className="bubble-stack">
                    <button
                      className="handoff-preview-card"
                      type="button"
                      onClick={() => openHandoffDocument(message.id)}
                      aria-label={`${message.handoff.projectName} 인수인계 브리핑 열기`}
                    >
                      <span className="handoff-preview-action">
                        <i className="bi bi-arrow-up-right" />
                      </span>
                      <span className="handoff-preview-icon">
                        <i className="bi bi-folder2-open" />
                      </span>
                      <span className="handoff-preview-copy">
                        <small>{message.handoff.date ?? '8월 15일'}</small>
                        <strong>{message.handoff.projectName} 인수인계</strong>
                        <em>From. 김의중</em>
                      </span>
                      <span className="folder-front" aria-hidden={openHandoffCardIds.includes(message.id)}>
                        <span className="folder-tab">CONFIDENTIAL</span>
                        <span className="folder-mark">
                          <i className="bi bi-folder2" />
                        </span>
                        <strong>인수인계 브리핑</strong>
                        <small>{message.handoff.projectName} · {message.handoff.route}</small>
                        <em>눌러서 브리핑 열기</em>
                      </span>
                      <span className="folder-back" aria-hidden={!openHandoffCardIds.includes(message.id)}>
                        <span className="folder-back-head">
                          <i className="bi bi-file-earmark-text" />
                          <span>
                            <strong>{message.handoff.projectName}</strong>
                            <small>{message.handoff.recipientName} 에게 전달됨</small>
                          </span>
                        </span>
                        <span className="folder-summary">{message.handoff.summary}</span>
                        <span className="folder-metrics">
                          <span><b>{message.handoff.completed}</b> 완료</span>
                          <span><b>{message.handoff.blockers}</b> 막힘</span>
                          <span><b>{message.handoff.actions}</b> 확인</span>
                          <span><b>{message.handoff.decisions}</b> 결정</span>
                        </span>
                      </span>
                    </button>
                    <div className="message-extra">
                      {message.time && <time>{message.time}</time>}
                      <span className="localized-label">
                        <i className="bi bi-check-circle" /> 인수인계 전달됨
                      </span>
                    </div>
                  </div>
                </article>
              ) : (
                <article className={`message ${message.sender} ${isClusteredMessage(visibleMessages, index) ? 'clustered' : ''}`} key={message.id}>
                  {message.sender === 'them' && <Avatar contact={selectedContact} />}
                  <div className="bubble-stack">
                    {message.text.map((line) => (
                      <p className="bubble" key={line}>
                        <AcronymText
                          text={line}
                          acronyms={mergeAcronyms(message.acronyms, userAcronyms)}
                          onShow={showAcronymPopover}
                          onHide={hideAcronymPopover}
                        />
                      </p>
                    ))}
                    {(shouldShowMessageTime(visibleMessages, index) || messageLocalization) && (
                      <div className="message-extra">
                        {shouldShowMessageTime(visibleMessages, index) && message.time && <time>{message.time}</time>}
                        {messageLocalization && (
                          <span className="localized-label">
                            <i className="bi bi-stars" /> 현지어 변환됨{' '}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                toggleOriginal(message.id);
                              }}
                            >
                              {openOriginalIds.includes(message.id) ? '원문 닫기' : '원문 보기'}
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                    {messageLocalization && openOriginalIds.includes(message.id) && (
                      <div className="original-message">
                        <strong>?낅젰 ?먮Ц</strong>
                        <p>{messageLocalization.original}</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            <div ref={conversationEndRef} className="conversation-end" />
          </div>

          <footer className="composer">
            {termPanelOpen && (
              <form className="term-editor" onSubmit={saveUserAcronym}>
                <div className="term-editor-head">
                  <span>
                    <i className="bi bi-journal-plus" /> ?⑹뼱 ?ㅻ챸 異붽?
                  </span>
                  <button type="button" onClick={closeTermEditor} aria-label="?⑹뼱 ?ㅻ챸 ?リ린">
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
                <div className="term-fields">
                  <input value={termForm.acronym} onChange={(event) => updateTermForm('acronym', event.target.value)} placeholder="용어" />
                  <input value={termForm.fullForm} onChange={(event) => updateTermForm('fullForm', event.target.value)} placeholder="전체 표현" />
                  <select value={termForm.action} onChange={(event) => updateTermForm('action', event.target.value)} aria-label="설명 방식">
                    <option value="explain">설명</option>
                    <option value="keep">유지</option>
                    <option value="simplify">단순화</option>
                  </select>
                  <textarea
                    value={termForm.explanation}
                    onChange={(event) => updateTermForm('explanation', event.target.value)}
                    placeholder="사용자에게 보여줄 설명"
                  />
                  <textarea value={termForm.reason} onChange={(event) => updateTermForm('reason', event.target.value)} placeholder="설명 이유" />
                </div>
                <div className="term-actions">
                  <button className="save-term" type="submit">
                    {editingAcronym ? '수정 저장' : '저장'}
                  </button>
                  <button
                    className={`term-list-toggle ${termListOpen ? 'active' : ''}`}
                    type="button"
                    onClick={() => setTermListOpen((open) => !open)}
                  >
                    <i className="bi bi-card-list" /> 내 용어 보기
                  </button>
                  {editingAcronym && (
                    <button className="cancel-edit-term" type="button" onClick={resetTermEditor}>
                      수정 취소
                    </button>
                  )}
                </div>
                {termListOpen && (
                  <div className="term-list">
                    <strong>내 용어</strong>
                    {userAcronyms.length > 0 ? (
                      userAcronyms.map((item) => (
                        <div className="term-list-item" key={item.acronym}>
                          <span>
                            <b>{item.acronym}</b>
                            <small>{item.fullForm}</small>
                          </span>
                          <div className="term-list-controls">
                            <button type="button" onClick={() => editUserAcronym(item)} aria-label={`${item.acronym} 수정`}>
                              <i className="bi bi-pencil-square" />
                            </button>
                            <button type="button" onClick={() => removeUserAcronym(item.acronym)} aria-label={`${item.acronym} ?젣`}>
                              <i className="bi bi-trash3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>아직 추가한 용어가 없습니다.</p>
                    )}
                  </div>
                )}
              </form>
            )}
            <textarea
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="메시지를 입력하세요..."
            />
            {(localizationLoading || localizationError || localizationResult) && (
              <div className={`localization-preview ${localizationResult ? 'has-result' : ''}`} aria-live="polite">
                {localizationLoading && (
                  <div className="localization-loading">
                    <i className="bi bi-arrow-repeat" />
                    <span>AI가 상대방의 언어와 업무 맥락에 맞게 현지화하고 있어요</span>
                  </div>
                )}

                {localizationError && (
                  <div className="localization-error">
                    <i className="bi bi-exclamation-circle" />
                    <span>{localizationError}</span>
                  </div>
                )}

                {localizationResult && (
                  <>
                    <div className="preview-head">
                      <span>
                        <i className="bi bi-stars" /> 현지화 완료!
                      </span>
                      <button type="button" onClick={() => setLocalizationResult(null)} aria-label="현지화 프리뷰 닫기">
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                    <p className="localized-text">{localizationResult.localizedText}</p>
                    {localizationResult.culturalNote && <p className="cultural-note">{localizationResult.culturalNote}</p>}
                    {localizationResult.changes?.length > 0 && (
                      <div className="change-list">
                        {localizationResult.changes.slice(0, 4).map((change) => (
                          <span className="change-pill" key={`${change.original}-${change.localized}-${change.type}`} title={change.reason}>
                            {change.original} ?{change.localized}
                          </span>
                        ))}
                      </div>
                    )}
                    <button className="apply-localization" type="button" onClick={applyLocalization}>
                      프리뷰 적용
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="composer-tools">
              <div className="left-tools">
                <button
                  type="button"
                  aria-label="?⑹뼱 ?ㅻ챸 異붽?"
                  onClick={() => {
                    if (termPanelOpen) {
                      closeTermEditor();
                    } else {
                      setTermPanelOpen(true);
                    }
                  }}
                >
                  <i className="bi bi-journal-plus" />
                </button>
                <span />
                <button type="button" aria-label="첨부">
                  <i className="bi bi-paperclip" />
                </button>
                <button type="button" aria-label="이모지">
                  <i className="bi bi-emoji-smile" />
                </button>
                <button type="button" aria-label="더보기">
                  <i className="bi bi-three-dots" />
                </button>
              </div>
              <div className="send-tools">
                <button className={`translate ${translateMode ? 'on' : ''}`} type="button" onClick={localizeDraft} disabled={localizationLoading || !draft.trim()}>
                  {localizationLoading ? '번역 중' : 'AI 현지어'} <i className={localizationLoading ? 'bi bi-arrow-repeat spin' : 'bi bi-stars'} />
                </button>
                <button className="send" type="button" onClick={sendMessage}>
                  전송 <i className="bi bi-send" />
                </button>
              </div>
            </div>
          </footer>
        </section>

        {profileOpen && <ProfilePanel contact={selectedContact} profile={selectedProfileWithTiming} onClose={() => setProfileOpen(false)} />}
          </>
        )}
        {shiftEndOpen && (
          <ShiftEndModal
            step={shiftModalStep}
            recipients={handoffRecipients}
            projects={handoffProjects}
            selectedRecipient={selectedHandoffRecipient}
            selectedProject={selectedHandoffProject}
            briefing={handoffBriefing}
            briefingError={handoffBriefingError}
            onSelectRecipient={setSelectedHandoffRecipient}
            onSelectProject={setSelectedHandoffProject}
            onAdditionalNoteChange={setHandoffAdditionalNote}
            onClose={closeShiftEndModal}
            onConfirm={closeShiftEndModal}
            onHandoff={() => {
              setSelectedHandoffRecipient('');
              setSelectedHandoffProject('');
              setHandoffAdditionalNote('');
              setShiftModalStep('recipient');
            }}
            onBack={() => {
              if (shiftModalStep === 'recipient') {
                setShiftModalStep('confirm');
                return;
              }
              if (shiftModalStep === 'project') {
                setShiftModalStep('recipient');
                return;
              }
              if (shiftModalStep === 'preparing') {
                setShiftModalStep('project');
                return;
              }
              if (shiftModalStep === 'additional') {
                setShiftModalStep('preparing');
                return;
              }
              if (shiftModalStep === 'review') {
                setShiftModalStep('additional');
              }
            }}
            onNext={() => {
              if (shiftModalStep === 'recipient') {
                if (!selectedHandoffRecipient) return;
                setSelectedHandoffProject('');
                setShiftModalStep('project');
                return;
              }
              if (shiftModalStep === 'project') {
                if (!selectedHandoffProject) return;
                setShiftModalStep('preparing');
                return;
              }
              if (shiftModalStep === 'preparing') {
                setShiftModalStep('additional');
                return;
              }
              if (shiftModalStep === 'additional') {
                setShiftModalStep('generating');
                generateHandoffBriefing();
                return;
              }
              if (shiftModalStep === 'generating') {
                setShiftModalStep('review');
                return;
              }
              if (shiftModalStep === 'review') {
                setShiftModalStep('sending');
                return;
              }
              if (shiftModalStep === 'sending') {
                setShiftModalStep('sent');
                return;
              }
              if (shiftModalStep === 'sent') {
                deliverHandoffToMessenger();
                closeShiftEndModal();
                openMessenger();
                return;
              }
              closeShiftEndModal();
              openMessenger();
            }}
          />
        )}
      </section>
    </main>
  );
}

export default App;









