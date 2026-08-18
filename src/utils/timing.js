/**
 * Border 01 — 지리 (원작: 준서, border01-geo 브랜치)
 *
 * 준서님이 만든 `runRadarAnalysis()` 의 계산 부분을 화면 코드와 분리해
 * 값을 돌려주는 순수 함수로 옮긴 것입니다.
 * COUNTRY_DB, 공휴일·주말·업무시간 판정, 위험도별 권고 문구 모두 원본 그대로이고,
 * `document.getElementById(...)` 로 화면에 직접 쓰던 부분만 return 값으로 바꿨습니다.
 *
 * 나라나 공휴일을 추가하려면 COUNTRY_DB 만 고치면 됩니다.
 */

export const COUNTRY_DB = {
  KR: { name: '대한민국', zone: 'Asia/Seoul', holidays: ['01-01', '03-01', '08-15', '10-03'], abbr: 'KST' },
  US: { name: '미국', zone: 'America/New_York', holidays: ['07-04', '12-25', '01-01'], abbr: 'ET' },
  GB: { name: '영국', zone: 'Europe/London', holidays: ['12-25', '12-26', '01-01'], abbr: 'GMT' },
  UK: { name: '영국', zone: 'Europe/London', holidays: ['12-25', '12-26', '01-01'], abbr: 'GMT' },
  DE: { name: '독일', zone: 'Europe/Berlin', holidays: ['10-03', '12-25', '01-01'], abbr: 'CET' },
  JP: { name: '일본', zone: 'Asia/Tokyo', holidays: ['01-01', '05-03', '11-03'], abbr: 'JST' },
  SG: { name: '싱가포르', zone: 'Asia/Singapore', holidays: ['08-09', '12-25', '01-01'], abbr: 'SGT' },
  RU: { name: '러시아', zone: 'Europe/Moscow', holidays: ['01-01', '05-09', '06-12'], abbr: 'MSK' },
};

/**
 * 특정 국가 기준으로 지금(또는 주어진 시각)이 메시지를 보내기 좋은 타이밍인지 판정합니다.
 *
 * @param {string} countryCode  COUNTRY_DB 의 키 (KR, US, JP ...)
 * @param {Date}  [at=new Date()]
 * @returns {{
 *   country: string, localTime: string, localHour: number, diffHours: number,
 *   isHoliday: boolean, isWeekend: boolean, isWorkHours: boolean,
 *   riskLevel: 'green'|'yellow'|'red', workState: string,
 *   timingDiagnosis: string, responseExpectation: string, suggestion: string,
 * }}
 */
export function analyzeTiming(countryCode, at = new Date()) {
  const info = COUNTRY_DB[countryCode] ?? COUNTRY_DB.KR;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: info.zone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(at).map((part) => [part.type, part.value]),
  );

  // Intl 은 자정을 24 로 주기도 해서 0 으로 맞춥니다.
  const localHour = parseInt(parts.hour, 10) % 24;
  const mmdd = `${parts.month}-${parts.day}`;
  const localDate = new Date(
    `${parts.year}-${parts.month}-${parts.day}T${String(localHour).padStart(2, '0')}:${parts.minute}:00`,
  );

  const dayOfWeek = localDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = info.holidays.includes(mmdd);
  const isWorkHours = localHour >= 9 && localHour < 18;
  const diffHours = Math.round((localDate - at) / (1000 * 60 * 60));

  const base = {
    country: info.name,
    localTime: `${parts.year}-${parts.month}-${parts.day} ${String(localHour).padStart(2, '0')}:${parts.minute}`,
    localHour,
    diffHours,
    isHoliday,
    isWeekend,
    isWorkHours,
  };

  if (isHoliday || isWeekend) {
    return {
      ...base,
      riskLevel: 'red',
      workState: isHoliday ? `국가 공휴일 (${info.name})` : '주말 휴무',
      timingDiagnosis: '상대국이 휴무일입니다. 메시지를 보내더라도 즉각적인 업무 처리가 불가능합니다.',
      responseExpectation: '최소 24~48시간 이상 응답이 지연될 가능성이 매우 높습니다.',
      suggestion: '공휴일 일정 이후 업무 복귀 시점에 편하게 확인 부탁드립니다.',
    };
  }

  if (!isWorkHours) {
    return {
      ...base,
      riskLevel: 'yellow',
      workState: '퇴근 / 야간 시간대',
      timingDiagnosis: '현지 상주 인원의 퇴근 후 시간입니다. 알림으로 인한 피로도를 유발할 수 있습니다.',
      responseExpectation: '다음 날 출근 시간(오전 9시 이후)에 순차적으로 확인될 것으로 예상됩니다.',
      suggestion: '퇴근 후 시간대이므로, 익일 출근 후 확인해 주셔도 무방합니다.',
    };
  }

  return {
    ...base,
    riskLevel: 'green',
    workState: '정상 업무 시간',
    timingDiagnosis: '상대방이 현재 데스크에서 근무 중인 최적의 골든 타임입니다.',
    responseExpectation: '수 분 내 실시간 확인 및 빠른 피드백을 기대할 수 있습니다.',
    suggestion: '현재 업무 시간 중 공유해 드리는 건으로, 편하신 때 확인 부탁드립니다.',
  };
}

/**
 * 팀원 목록·프로필에 표시할 현재 상태와 현지 시각을 만듭니다.
 *
 * 회의중 / 자리비움 처럼 캘린더에서 오는 상태는 타임존으로 알 수 없으므로
 * fixedState 로 넘기면 그대로 씁니다. 넘기지 않으면 업무시간 여부로 판정합니다.
 *
 * @returns {{ state: string, clock: string, clock12: string, zoneAbbr: string }}
 */
export function presenceOf(countryCode, fixedState) {
  const info = COUNTRY_DB[countryCode] ?? COUNTRY_DB.KR;
  const timing = analyzeTiming(countryCode);
  const now = new Date();

  const clock12 = new Intl.DateTimeFormat('en-US', {
    timeZone: info.zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  // 'EDT', 'KST' 같은 타임존 약어를 뽑습니다.
  // en-US 기준이라 미국 밖은 'GMT+9' 처럼 오프셋으로 나오는데,
  // 그럴 때만 COUNTRY_DB 의 abbr(KST, JST, MSK ...)로 바꿔 읽기 쉽게 합니다.
  // 미국은 Intl 이 EDT/EST 를 계절에 맞게 주므로 그대로 씁니다.
  const intlAbbr =
    new Intl.DateTimeFormat('en-US', { timeZone: info.zone, timeZoneName: 'short' })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  const zoneAbbr = intlAbbr.startsWith('GMT') ? info.abbr ?? intlAbbr : intlAbbr;

  return {
    state: fixedState ?? (timing.isWorkHours ? '근무중' : '근무종료'),
    clock: timing.localTime.slice(11), // 'YYYY-MM-DD HH:mm' → 'HH:mm'
    clock12,
    zoneAbbr,
  };
}

/** 타임라인 블록의 status 값(working / starting / ending / offline)으로 변환합니다. */
export function toTimelineStatus(timing) {
  if (timing.riskLevel === 'red') return 'offline';
  if (!timing.isWorkHours) return 'offline';
  if (timing.localHour < 10) return 'starting';
  if (timing.localHour >= 16) return 'ending';
  return 'working';
}
