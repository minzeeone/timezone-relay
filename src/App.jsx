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
import { isClusteredMessage, shouldShowMessageTime } from './utils/messageGrouping.js';

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

  return 'dashboard';
};

const replaceHash = (hash) => {
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', hash);
};

const createJapaneseLocalVersion = (original = '', localizedText = '') => {
  const source = `${original} ${localizedText}`.toLowerCase();

  if (source.includes('aurora') && source.includes('iam')) {
    return 'AuroraのデプロイがIAM権限の問題で止まっているため、本日のリリースは難しい見込みです。ご確認をお願いいたします。';
  }

  if (source.includes('tomorrow morning') || source.includes('내일') || source.includes('明日')) {
    return 'はい、明日の午前中にお送りします。';
  }

  if (source.includes('pr') || source.includes('review') || source.includes('검토')) {
    return 'PRの内容をご確認いただき、必要なフィードバックをお願いいたします。';
  }

  if (source.includes('deployment') || source.includes('release') || source.includes('배포')) {
    return 'デプロイ状況を確認し、必要な対応を進めていただけますと幸いです。';
  }

  return '内容をチームメンバーの現地語に合わせて、自然な日本語表現に変換しました。';
};

const handoffDocumentTerms = [
  {
    acronym: 'AURORA #128',
    fullForm: 'Aurora 작업 티켓 번호',
    explanation: 'Aurora 프로젝트에서 IAM Role 권한 문제를 추적하는 작업 항목입니다.',
    action: 'explain',
    reason: '인수자가 원본 기록이나 이슈를 다시 찾아볼 때 기준점이 됩니다.',
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
    explanation: '실제 사용자가 접속하는 운영 환경을 의미합니다.',
    action: 'keep',
    reason: '개발팀과 제품팀 모두 자주 쓰는 운영 용어라 원문을 유지합니다.',
    tone: 'handoff',
  },
  {
    acronym: 'PR #142',
    fullForm: 'Pull Request #142',
    explanation: '코드 변경사항을 병합하기 전에 검토하는 요청 번호입니다.',
    action: 'explain',
    reason: '검토해야 할 코드 변경 단위를 명확히 하기 위해 표시합니다.',
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
    explanation: '공통 인프라, 권한, 배포 환경을 관리하는 팀을 의미합니다.',
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
    explanation: '서로 다른 시스템이나 화면이 데이터를 주고받기 위한 연결 규칙입니다.',
    action: 'explain',
    reason: '엔지니어링 문맥에서는 유지하되 비개발자에게는 설명이 도움이 됩니다.',
    tone: 'handoff',
  },
  {
    acronym: 'QA',
    fullForm: 'Quality Assurance',
    explanation: '기능이 요구사항대로 동작하는지 검증하는 품질 확인 과정입니다.',
    action: 'explain',
    reason: '다음 담당자가 해야 할 검증 업무를 이해하는 데 필요합니다.',
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
    fullForm: 'Aurora作業チケット番号',
    explanation: 'AuroraプロジェクトでIAM Role権限の問題を追跡する作業項目です。',
    action: 'explain',
    reason: '引き継ぎ先が元の記録やIssueを確認するときの基準になります。',
    tone: 'handoff',
  },
  {
    acronym: 'IAM Role',
    fullForm: 'Identity and Access Management Role',
    explanation: 'クラウドリソースへアクセスできる権限をまとめた役割です。',
    action: 'explain',
    reason: 'Productionデプロイ停止の直接原因なので、文脈説明が必要です。',
    tone: 'handoff',
  },
  {
    acronym: 'Production',
    fullForm: '本番環境',
    explanation: '実際のユーザーが利用する運用環境を意味します。',
    action: 'keep',
    reason: '開発チームとプロダクトチームの両方で一般的に使うため、表記を維持します。',
    tone: 'handoff',
  },
  {
    acronym: 'PR #142',
    fullForm: 'Pull Request #142',
    explanation: 'コード変更をマージする前にレビューするためのリクエスト番号です。',
    action: 'explain',
    reason: '確認すべきコード変更の単位を明確にするために表示します。',
    tone: 'handoff',
  },
  {
    acronym: 'OAuth',
    fullForm: 'Open Authorization',
    explanation: 'パスワードを直接共有せず、安全に認証権限を委任する標準方式です。',
    action: 'explain',
    reason: '認証構造変更の中心になる技術用語です。',
    tone: 'handoff',
  },
  {
    acronym: 'Platform',
    fullForm: 'Platform Team',
    explanation: '共通インフラ、権限、デプロイ環境を管理するチームを指します。',
    action: 'explain',
    reason: '現在確認待ちになっている担当チームを正しく理解する必要があります。',
    tone: 'handoff',
  },
  {
    acronym: 'Aurora',
    fullForm: 'Aurora Project',
    explanation: 'グローバル認証システムを改修する社内プロジェクト名です。',
    action: 'keep',
    reason: '社内プロジェクト名なので翻訳せず、そのまま保持します。',
    tone: 'handoff',
  },
  {
    acronym: 'AURORA',
    fullForm: 'Aurora Project',
    explanation: 'グローバル認証システムを改修する社内プロジェクト名です。',
    action: 'keep',
    reason: '大文字で記録された社内プロジェクト表記です。',
    tone: 'handoff',
  },
  {
    acronym: 'API',
    fullForm: 'Application Programming Interface',
    explanation: '異なるシステムや画面がデータをやり取りするための接続ルールです。',
    action: 'explain',
    reason: 'エンジニアリング文脈では保持しつつ、非エンジニアにも意味が伝わるよう補足します。',
    tone: 'handoff',
  },
  {
    acronym: 'QA',
    fullForm: 'Quality Assurance',
    explanation: '機能が要件どおりに動作するかを検証する品質確認プロセスです。',
    action: 'explain',
    reason: '次の担当者が行う検証作業を理解するために必要です。',
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
    body: ['오늘 완료된 작업과 담당 범위를 정리했습니다.'],
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
    body: ['다음 시간대 팀원이 바로 이어서 확인해야 할 작업입니다.'],
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

const createJapaneseHandoffDocumentPages = (handoff) => [
  {
    type: 'cover',
    title: '業務引き継ぎブリーフィング',
    eyebrow: handoff.projectName,
    icon: 'bi-folder2-open',
  },
  {
    title: 'プロジェクト概要',
    icon: 'bi-layers',
    terms: handoffDocumentTerms,
    body: [
      'Auroraは、既存の認証方式をOAuthベースの認証構造へ移行するプロジェクトです。',
      'グローバルユーザー認証とAPI連携範囲を含み、現在はProductionデプロイ前の最終確認段階です。',
    ],
    points: ['Project Aurora', 'OAuth認証構造', 'Productionデプロイ準備'],
  },
  {
    title: '完了した作業',
    icon: 'bi-check2-square',
    terms: handoffDocumentTerms,
    body: ['本日完了した作業と担当範囲を整理しました。'],
    tasks: [
      { state: '完了', title: 'ログインUI改修', desc: '新しい認証フローに合わせてログイン画面を改修しました。' },
      { state: '完了', title: 'OAuth API連携', desc: 'フロントエンドと新しい認証APIを接続しました。' },
      { state: '完了', title: 'PR #142レビュー反映', desc: '認証機能変更に関するレビューコメントを反映しました。' },
    ],
  },
  {
    title: 'ブロッカーと進捗状況',
    icon: 'bi-exclamation-diamond',
    terms: handoffDocumentTerms,
    body: ['ProductionデプロイはIAM Role権限の問題により保留中です。'],
    points: ['影響: Aurora Production環境デプロイ停止', '状態: Platformチーム確認待ち', '関連作業: AURORA #128'],
  },
  {
    title: '次のアクション',
    icon: 'bi-arrow-up-right-circle',
    terms: handoffDocumentTerms,
    body: ['次のタイムゾーンのメンバーがすぐに確認すべき作業です。'],
    tasks: [
      { state: '優先', title: 'IAM Role権限の確認', desc: '担当者: John' },
      { state: '次', title: 'Productionデプロイの再試行', desc: '担当者: 김의중' },
      { state: '確認', title: '最終認証フローQA', desc: '担当者: Alex' },
    ],
  },
  {
    title: '추가 요청 사항',
    icon: 'bi-chat-left-text',
    terms: handoffDocumentTerms,
    body: [handoff.additionalNote || '추가 요청 사항은 없습니다.'],
    points: ['추가 요청 사항은 원문 그대로 유지됩니다.', '필요 시 메신저에서 바로 확인해 주세요.'],
  },
];

const createLocalizedHandoffDocumentPages = (handoff, language) => {
  if (language === 'ja') {
    return createJapaneseHandoffDocumentPages(handoff).map((page) => (
      page.type === 'cover' ? page : { ...page, terms: handoffDocumentTermsJa }
    ));
  }

  return createHandoffDocumentPages(handoff);
};

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
  const conversationEndRef = useRef(null);

  const selectedContact = contacts.find((contact) => contact.id === selectedId) ?? contacts[0];
  const selectedProfile = contactProfiles[selectedContact.id] ?? contactProfiles.default;
  const isMessengerView = activeView === 'messenger';
  const isScheduleView = activeView === 'schedule';
  const isDashboardView = activeView === 'dashboard';

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

  const activeHandoffPages = useMemo(() => {
    return activeHandoffDocument ? createLocalizedHandoffDocumentPages(activeHandoffDocument.handoff, handoffDocumentLanguage) : [];
  }, [activeHandoffDocument, handoffDocumentLanguage]);

  const closeHandoffDocument = () => {
    setActiveHandoffDocumentId(null);
    setHandoffDocumentPage(0);
    setHandoffPageDirection('open');
    setHandoffDocumentLanguage('ko');
  };

  const openHandoffDocument = (messageId) => {
    setActiveHandoffDocumentId(messageId);
    setHandoffDocumentPage(0);
    setHandoffPageDirection('open');
    setHandoffDocumentLanguage('ko');
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
        throw new Error('API 응답을 읽을 수 없습니다. dev server를 재시작한 뒤 다시 시도해주세요.');
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

  const closeShiftEndModal = () => {
    setShiftEndOpen(false);
    setShiftModalStep('confirm');
    setSelectedHandoffRecipient('');
    setSelectedHandoffProject('');
    setHandoffAdditionalNote('');
    setHandoffBriefing(null);
    setHandoffBriefingError('');
  };

  /**
   * Border 04 (조직) — 실제 인수인계 브리핑을 생성합니다.
   *
   * 서버가 프로젝트별 수집 로그(Slack/GitHub/Notion)를 모아 AI 에 넘기고,
   * 중복 제거 / 결정사항 / 작업사항 / 지난 브리핑 대비 변경점을 돌려줍니다.
   * 실패해도 모달 흐름은 끊지 않고, 검토 단계에서 기존 목업으로 표시됩니다.
   */
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
          cleanRoute: '서울 → 도쿄',
          date: '8월 15일',
          timestamp: '2026.8.15 PM 9:26',
          from: '개발팀 프론트엔드 김의중',
          cleanSummary: 'Aurora 인증 기능 개발은 대부분 완료됐지만, IAM 권한 문제로 Production 배포가 보류된 상태입니다.',
          additionalNote: handoffAdditionalNote.trim(),
          route: '서울 → 도쿄',
          summary: 'Aurora 인증 기능 개발은 대부분 완료됐지만, IAM 권한 문제로 Production 배포가 보류된 상태입니다.',
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
                      {handoffDocumentLanguage === 'ja' ? '業務引き継ぎブリーフィング' : '업무 인수인계 브리핑'}
                    </strong>
                  </div>
                  <span className="handoff-language-pill">
                    <i className="bi bi-circle-fill" />
                    {handoffDocumentLanguage === 'ja' ? '日本語' : '한국어'}
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
              <div className="handoff-document-language-toggle" aria-label="인수인계서 언어 선택">
                <button
                  className={handoffDocumentLanguage === 'ko' ? 'active' : ''}
                  type="button"
                  onClick={() => setHandoffDocumentLanguage('ko')}
                >
                  한국어
                </button>
                <button
                  className={handoffDocumentLanguage === 'ja' ? 'active' : ''}
                  type="button"
                  onClick={() => setHandoffDocumentLanguage('ja')}
                >
                  일본어 <small>현지어</small>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      <section className={`apex-window ${isMessengerView ? 'view-messenger' : isScheduleView ? 'view-schedule' : 'view-dashboard'} ${chatOpen ? 'mobile-chat-open' : ''} ${isMessengerView && profileOpen ? 'profile-open' : ''}`}>
        <header className="topbar">
          <h1>APEX</h1>
          {isMessengerView ? (
            <h2>채팅</h2>
          ) : isScheduleView ? (
            <h2>팀 일정</h2>
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
            {!isMessengerView && <span className="dashboard-date">2026년 8월 13일</span>}
            <button className="notification-button" type="button" aria-label="알림">
              <i className="bi bi-bell" />
              <span />
            </button>
            <button className="profile" type="button" aria-label="프로필 메뉴">
              <span className="profile-avatar">👩🏼</span>
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
          <button className={isDashboardView ? 'selected' : ''} type="button" onClick={openDashboard} aria-label="인수인계 대시보드">
            <i className="bi bi-grid" />
          </button>
          <button className={isMessengerView ? 'selected' : ''} type="button" onClick={openMessenger} aria-label="채팅">
            <i className="bi bi-chat" />
          </button>
          <button className={isScheduleView ? 'selected' : ''} type="button" onClick={openSchedule} aria-label="팀 일정">
            <i className="bi bi-calendar3" />
          </button>
          <button type="button" aria-label="설정">
            <i className="bi bi-gear" />
          </button>
        </nav>

        {isDashboardView && <HandoffDashboard data={handoffDashboardMock} onOpenMessenger={openMessenger} onOpenShiftEnd={() => setShiftEndOpen(true)} />}
        {isScheduleView && <TeamSchedule />}

        {isMessengerView && (
          <>
        <aside className="message-list">
          <div className="panel-head">
            <strong>메세지</strong>
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
                  <time>{contact.time}</time>
                  <span className="star" onClick={(event) => toggleStar(event, contact.id)} role="button" tabIndex="0" aria-label="즐겨찾기">
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
                            <small>{message.handoff.recipientName} 님에게 전달됨</small>
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
                        <strong>입력 원문</strong>
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
                    <i className="bi bi-journal-plus" /> 용어 설명 추가
                  </span>
                  <button type="button" onClick={closeTermEditor} aria-label="용어 설명 닫기">
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
                            <button type="button" onClick={() => removeUserAcronym(item.acronym)} aria-label={`${item.acronym} 삭제`}>
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
              placeholder="메세지를 입력하세요..."
            />
            {(localizationLoading || localizationError || localizationResult) && (
              <div className={`localization-preview ${localizationResult ? 'has-result' : ''}`} aria-live="polite">
                {localizationLoading && (
                  <div className="localization-loading">
                    <i className="bi bi-arrow-repeat" />
                    <span>AI가 상대방의 언어와 업무 맥락에 맞게 현지화하고 있어요.</span>
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
                            {change.original} → {change.localized}
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
                  aria-label="용어 설명 추가"
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
                  {localizationLoading ? '현지화 중' : 'AI 현지화'} <i className={`bi ${localizationLoading ? 'bi-arrow-repeat spin' : 'bi-stars'}`} />
                </button>
                <button className="send" type="button" onClick={sendMessage}>
                  전송 <i className="bi bi-send" />
                </button>
              </div>
            </div>
          </footer>
        </section>

        {profileOpen && <ProfilePanel contact={selectedContact} profile={selectedProfile} onClose={() => setProfileOpen(false)} />}
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
