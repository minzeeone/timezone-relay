/**
 * 인수인계서 안에 쓰이는 라벨을 인계받는 사람의 언어로 보여줍니다.
 *
 * 여기 있는 건 앱이 직접 쓰는 UI 문자열이라 AI 번역이 아니라 사전으로 둡니다.
 * (매번 같은 단어를 모델에 물어볼 이유가 없고, 결과가 흔들리지도 않아야 합니다)
 * 브리핑 본문은 server/borders/border02-handoff-translate.js 가 번역합니다.
 *
 * 문서 바깥의 액션 버튼(수정하기 / 문서파일로 내보내기 / 인수인계하기)은
 * 인계자가 아니라 지금 화면을 보는 우리 팀원이 누르는 것이라 한국어로 둡니다.
 *
 * 국가 코드 → 언어 매핑은 border02-handoff-translate.js 와 같습니다.
 */

const LOCALE_BY_COUNTRY = {
  KR: 'ko',
  JP: 'ja',
  US: 'en',
  GB: 'en',
  UK: 'en',
  SG: 'en',
  DE: 'de',
  RU: 'ru',
};

const LABELS = {
  ko: {
    documentTitle: '업무 인수인계서',
    giver: '인수자',
    receiver: '인계자',
    giverRole: '개발팀 프론트엔드',
    receiverRole: '제품팀 PM',
    handoffWork: '인수인계 업무',
    summaryTitle: (project) => `${project} 인수인계 요약`,
    summaryLead: (project) => `${project}에서 다음 시간대 팀이 이어받아야 할 업무 범위를 정리했습니다.`,
    assignedTasks: '담당 업무',
    statusSection: '진행상황 및 미해결사항',
    prioritySection: '추진계획 및 우선순위',
    done: '완료',
    blocked: '막힘',
    todo: '예정',
    inProgress: '진행중',
    unresolved: '미해결사항',
    ownerPrefix: '담당',
    statusPrefix: '상태',
    assigneePrefix: '담당자',
    sourcePrefix: '출처',
    unassigned: '미정',
    decisionCount: (count) => `완료: 결정사항 ${count}건`,
    blockedCount: (count) => `미해결: 막힌 작업 ${count}건`,
  },
  en: {
    documentTitle: 'Work Handoff Document',
    giver: 'From',
    receiver: 'To',
    giverRole: 'Frontend, Dev Team',
    receiverRole: 'PM, Product Team',
    handoffWork: 'Handoff Scope',
    summaryTitle: (project) => `${project} Handoff Summary`,
    summaryLead: (project) => `Here is the work being handed over to the next timezone team on ${project}.`,
    assignedTasks: 'Tasks',
    statusSection: 'Progress & Blockers',
    prioritySection: 'Next Steps & Priority',
    done: 'Done',
    blocked: 'Blocked',
    todo: 'To do',
    inProgress: 'In progress',
    unresolved: 'Blocker',
    ownerPrefix: 'Owner',
    statusPrefix: 'Status',
    assigneePrefix: 'Assignee',
    sourcePrefix: 'Source',
    unassigned: 'Unassigned',
    decisionCount: (count) => `Done: ${count} decision(s)`,
    blockedCount: (count) => `Unresolved: ${count} blocked task(s)`,
  },
  ja: {
    documentTitle: '業務引き継ぎ書',
    giver: '引き継ぐ人',
    receiver: '引き継ぎ先',
    giverRole: '開発チーム フロントエンド',
    receiverRole: '製品チーム PM',
    handoffWork: '引き継ぎ業務',
    summaryTitle: (project) => `${project} 引き継ぎ要約`,
    summaryLead: (project) => `${project}で次の時間帯のチームが引き継ぐ業務範囲をまとめました。`,
    assignedTasks: '担当業務',
    statusSection: '進捗と未解決事項',
    prioritySection: '今後の予定と優先順位',
    done: '完了',
    blocked: 'ブロック',
    todo: '予定',
    inProgress: '進行中',
    unresolved: '未解決事項',
    ownerPrefix: '担当',
    statusPrefix: '状態',
    assigneePrefix: '担当者',
    sourcePrefix: '出典',
    unassigned: '未定',
    decisionCount: (count) => `完了: 決定事項 ${count}件`,
    blockedCount: (count) => `未解決: ブロック中の作業 ${count}件`,
  },
  ru: {
    documentTitle: 'Документ передачи дел',
    giver: 'Передаёт',
    receiver: 'Принимает',
    giverRole: 'Фронтенд, команда разработки',
    receiverRole: 'PM, продуктовая команда',
    handoffWork: 'Объём передачи',
    summaryTitle: (project) => `${project} — сводка передачи`,
    summaryLead: (project) => `Ниже — работа по ${project}, которую принимает команда следующего часового пояса.`,
    assignedTasks: 'Задачи',
    statusSection: 'Прогресс и блокеры',
    prioritySection: 'Дальнейшие шаги и приоритет',
    done: 'Готово',
    blocked: 'Заблокировано',
    todo: 'Запланировано',
    inProgress: 'В работе',
    unresolved: 'Блокер',
    ownerPrefix: 'Ответственный',
    statusPrefix: 'Статус',
    assigneePrefix: 'Исполнитель',
    sourcePrefix: 'Источник',
    unassigned: 'Не назначен',
    decisionCount: (count) => `Готово: решений — ${count}`,
    blockedCount: (count) => `Не решено: заблокированных задач — ${count}`,
  },
  de: {
    documentTitle: 'Übergabedokument',
    giver: 'Übergeber',
    receiver: 'Empfänger',
    giverRole: 'Frontend, Entwicklungsteam',
    receiverRole: 'PM, Produktteam',
    handoffWork: 'Übergabeumfang',
    summaryTitle: (project) => `${project} – Übergabe-Zusammenfassung`,
    summaryLead: (project) => `Hier ist der Arbeitsstand zu ${project}, den das Team der nächsten Zeitzone übernimmt.`,
    assignedTasks: 'Aufgaben',
    statusSection: 'Fortschritt & Blocker',
    prioritySection: 'Nächste Schritte & Priorität',
    done: 'Erledigt',
    blocked: 'Blockiert',
    todo: 'Geplant',
    inProgress: 'In Arbeit',
    unresolved: 'Blocker',
    ownerPrefix: 'Zuständig',
    statusPrefix: 'Status',
    assigneePrefix: 'Zuständige Person',
    sourcePrefix: 'Quelle',
    unassigned: 'Offen',
    decisionCount: (count) => `Erledigt: ${count} Entscheidung(en)`,
    blockedCount: (count) => `Ungelöst: ${count} blockierte Aufgabe(n)`,
  },
};

/**
 * @param {string} countryCode  인계자의 국가 코드
 * @param {boolean} translated  번역 보기가 켜져 있는지. 꺼져 있으면 한국어입니다.
 */
export function handoffLabels(countryCode, translated) {
  if (!translated) return LABELS.ko;
  return LABELS[LOCALE_BY_COUNTRY[countryCode] ?? 'en'] ?? LABELS.en;
}

/** 작업 상태(blocked / in_progress / todo)를 해당 언어 라벨로 바꿉니다. */
export function taskStateLabel(labels, status) {
  if (status === 'blocked') return labels.blocked;
  if (status === 'todo') return labels.todo;
  if (status === 'in_progress') return labels.inProgress;
  return labels.inProgress;
}
