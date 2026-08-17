/**
 * Border 01 — 지리 (담당: 준서)
 *
 * 타임존 자동 감지, 상대 국가 시간 표시(KST/UTC), 공휴일·휴업일 반영.
 *
 * 붙이는 법: 아래 run() 안에서 결과 객체를 반환하기만 하면 됩니다.
 * LLM 이 필요하면 `import { callClaude } from '../llm.js'` 로 공용 래퍼를 쓰세요.
 * (JSON 스키마를 넘기면 파싱된 객체가 그대로 돌아옵니다 — border04-org.js 참고)
 */

export const meta = {
  id: 'border01',
  name: '지리',
  owner: '준서',
  description: '타임존 자동 감지 · 상대 국가 시간 표시 · 공휴일/휴업일 반영',
  implemented: false,
};

export async function run(_input) {
  const error = new Error(`${meta.name} 모듈은 아직 구현 전입니다. (담당: ${meta.owner})`);
  error.status = 501;
  throw error;
}

const COUNTRY_DB = {
  US: { name: '미국', flag: '🇺🇸', zone: 'America/New_York', holidays: ['07-04', '12-25', '01-01'] },
  UK: { name: '영국', flag: '🇬🇧', zone: 'Europe/London', holidays: ['12-25', '12-26', '01-01'] },
  DE: { name: '독일', flag: '🇩🇪', zone: 'Europe/Berlin', holidays: ['10-03', '12-25', '01-01'] },
  JP: { name: '일본', flag: '🇯🇵', zone: 'Asia/Tokyo', holidays: ['01-01', '05-03', '11-03'] },
  SG: { name: '싱가포르', flag: '🇸🇬', zone: 'Asia/Singapore', holidays: ['08-09', '12-25', '01-01'] }
};

document.addEventListener('DOMContentLoaded', () => {
  // 실시간 KST 시계 구동
  setInterval(updateLiveClock, 1000);
  updateLiveClock();

  // 기본 일시 설정 (현재 시각)
  const now = new Date();
  document.getElementById('sendDateTime').value = formatForDateTimeInput(now);

  document.getElementById('analyzeBtn').addEventListener('click', runRadarAnalysis);

  // Initial Run
  runRadarAnalysis();
});

function updateLiveClock() {
  const now = new Date();
  document.getElementById('kstClock').innerText = `KST ${now.toLocaleTimeString('ko-KR')}`;
}

function formatForDateTimeInput(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// 빠른 테스트용 프리셋 설정 함수
function setPreset(type) {
  const dtInput = document.getElementById('sendDateTime');
  const countrySelect = document.getElementById('targetCountry');
  const today = new Date();

  if (type === 'holiday') {
    countrySelect.value = 'US';
    // 미국 독립기념일 (7월 4일 14:00 KST)
    dtInput.value = `${today.getFullYear()}-07-04T14:00`;
  } else if (type === 'night') {
    countrySelect.value = 'US';
    // 한국 시간 오후 2시 (미국 New York은 새벽 1시)
    dtInput.value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}T14:00`;
  } else if (type === 'work') {
    countrySelect.value = 'US';
    // 한국 시간 밤 11시 (미국 New York은 오전 10시)
    dtInput.value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}T23:00`;
  }

  runRadarAnalysis();
}

function runRadarAnalysis() {
  const countryCode = document.getElementById('targetCountry').value;
  const sendTimeVal = document.getElementById('sendDateTime').value;
  if (!sendTimeVal) return;

  const targetInfo = COUNTRY_DB[countryCode];
  const inputDate = new Date(sendTimeVal);

  // 현지 시간 구하기 (Intl API)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: targetInfo.zone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });

  const parts = Object.fromEntries(formatter.formatToParts(inputDate).map(p => [p.type, p.value]));
  const tHour = parseInt(parts.hour, 10);
  const mmdd = `${parts.month}-${parts.day}`;
  
  const targetDateObj = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`);
  const dayOfWeek = targetDateObj.getDay();

  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
  const isHoliday = targetInfo.holidays.includes(mmdd);
  const isWorkHours = (tHour >= 9 && tHour < 18);

  // UI 요수 갱신
  document.getElementById('targetFlag').innerText = targetInfo.flag;
  document.getElementById('targetLocalTimeText').innerText = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;

  // 하루 중 진행도 계산 (%)
  const dayPercent = Math.round((tHour / 24) * 100);
  document.getElementById('timeProgressFill').style.width = `${dayPercent}%`;

  // 시차 계산
  const diffHours = Math.round((targetDateObj - inputDate) / (1000 * 60 * 60));
  document.getElementById('timeDiffVal').innerText = `${Math.abs(diffHours)}시간 ${diffHours < 0 ? '느림' : '빠름'}`;

  // 상태별 분기 레이더 로직
  const banner = document.getElementById('statusBanner');
  const riskStatus = document.getElementById('riskStatus');
  const workStateVal = document.getElementById('workStateVal');
  const timingDiag = document.getElementById('timingDiag');
  const responseExpect = document.getElementById('responseExpect');
  const suggestedOpener = document.getElementById('suggestedOpener');
  const actionList = document.getElementById('actionList');

  if (isHoliday || isWeekend) {
    banner.style.borderLeftColor = 'var(--accent-red)';
    riskStatus.innerText = '🔴 발송 비권장 (휴무일)';
    riskStatus.style.color = 'var(--accent-red)';
    workStateVal.innerText = isHoliday ? `국가 공휴일 (${targetInfo.name})` : '주말 휴무';

    timingDiag.innerText = '상대국이 휴무일입니다. 메시지를 보내더라도 즉각적인 업무 처리가 불가능합니다.';
    responseExpect.innerText = '최소 24~48시간 이상 응답이 지연될 가능성이 매우 높습니다.';
    suggestedOpener.innerText = `"공휴일 일정 이후 업무 복귀 시점에 편하게 확인 부탁드립니다."`;

    actionList.innerHTML = `
      <li>메시지를 즉시 발송하지 말고, 현지 다음 영업일 오전 09:30으로 [예약 발송]을 설정하세요.</li>
      <li>긴급 장애 상황인 경우에만 비상 핫라인 채널을 활용하세요.</li>
    `;
  } else if (!isWorkHours) {
    banner.style.borderLeftColor = 'var(--accent-yellow)';
    riskStatus.innerText = '🟡 시간대 주의 (업무 외 시간)';
    riskStatus.style.color = 'var(--accent-yellow)';
    workStateVal.innerText = '퇴근 / 야간 시간대';

    timingDiag.innerText = '현지 상주 인원의 퇴근 후 시간입니다. 알림으로 인한 피로도를 유발할 수 있습니다.';
    responseExpect.innerText = '다음 날 출근 시간(오전 9시 이후)에 순차적으로 확인될 것으로 예상됩니다.';
    suggestedOpener.innerText = `"퇴근 후 시간대이므로, 익일 출근 후 확인해 주셔도 무방합니다."`;

    actionList.innerHTML = `
      <li>슬랙/이메일의 [수신자 시간대에 맞춰 예약 발송] 기능을 활용하세요.</li>
      <li>아침 업무 시작 시 알림 상단에 위치하도록 현지 08:50분 발송을 추천합니다.</li>
    `;
  } else {
    banner.style.borderLeftColor = 'var(--accent-green)';
    riskStatus.innerText = '🟢 브리핑 최적 (업무 진행 중)';
    riskStatus.style.color = 'var(--accent-green)';
    workStateVal.innerText = '정상 업무 시간';

    timingDiag.innerText = '상대방이 현재 데스크에서 근무 중인 최적의 골든 타임입니다.';
    responseExpect.innerText = '수 분 내 실시간 확인 및 빠른 피드백을 기대할 수 있습니다.';
    suggestedOpener.innerText = `"현재 업무 시간 중 공유해 드리는 건으로, 편하신 때 확인 부탁드립니다."`;

    actionList.innerHTML = `
      <li>지금 즉시 브리핑 문서 및 핵심 요약 메시지를 발송하세요.</li>
      <li>실시간 대화가 가능한 상태이므로 주요 결정사항 질의를 포함해도 좋습니다.</li>
    `;
  }
}
