import { useEffect, useState } from 'react';
import { activeHandoffs, handoffRecipients } from '../../data/handoffFlowMock.js';
import { presenceOf } from '../../utils/timing.js';

const memberStatusLabels = {
  online: '근무중',
  offline: '근무종료',
  busy: '회의중',
  away: '자리비움',
};

const formatMemberMeta = (member) => {
  const timing = presenceOf(member.countryCode ?? 'KR');
  const statusLabel = memberStatusLabels[member.status] ?? timing.state;
  return `${statusLabel} - ${timing.clock} ${member.cityLabel ?? timing.country}`;
};

export function HandoffDashboard({ data, onOpenMessenger, onOpenShiftEnd }) {
  const [, setLocalTimeTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLocalTimeTick((tick) => tick + 1);
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="handoff-dashboard" aria-label="AI 업무 인수인계 대시보드">
      <section className="wire-hero">
        <p>수고하셨어요, <strong>의중님.</strong></p>
        <h2>퇴근까지 <span>9분</span> 남았어요.</h2>
        <div className="wire-hero-actions">
          <button className="primary" type="button" onClick={onOpenShiftEnd}>
            <i className="bi bi-box-arrow-right" /> 근무 종료 & 인수인계
          </button>
          <button type="button">야근하기</button>
        </div>
      </section>

      <section className="wire-stat-row" aria-label="업무 요약">
        <article>
          <i className="bi bi-check" />
          <strong>8</strong>
          <span>완료된 작업</span>
        </article>
        <article>
          <i className="bi bi-x" />
          <strong>4</strong>
          <span>막힌 작업</span>
        </article>
        <article>
          <i className="bi bi-exclamation" />
          <strong>{data.attentionCount}</strong>
          <span>확인 필요</span>
        </article>
        <article>
          <i className="bi bi-activity" />
          <strong>{data.morningBrief.decisionCount}</strong>
          <span>결정 사항</span>
        </article>
      </section>

      <section className="wire-handoff">
        <header>
          <h3>진행중인 인수인계 (2)</h3>
          <button type="button" aria-label="진행중인 인수인계 더보기">
            <i className="bi bi-arrow-up-right" />
          </button>
        </header>
        <div className="wire-handoff-list">
          {activeHandoffs.map((handoff) => (
            <button className="wire-handoff-row" type="button" key={handoff.title} onClick={onOpenMessenger}>
              <i className={`bi ${handoff.icon}`} />
              <span>{handoff.title}</span>
              <small>› {handoff.team}</small>
              <em>{handoff.status}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="wire-attention">
        <header>
          <h3>지금 확인이 필요해요</h3>
          <button type="button" aria-label="확인 필요 더보기">
            <i className="bi bi-arrow-up-right" />
          </button>
        </header>
        <button className="wire-task-row" type="button" onClick={onOpenMessenger}>
          <span>PR#162 검토</span>
          <small>Aurora</small>
          <i className="bi bi-chevron-right" />
        </button>
        <button className="wire-task-row" type="button" onClick={onOpenMessenger}>
          <span>운영환경 배포 중단</span>
          <small>Aurora</small>
          <i className="bi bi-chevron-right" />
        </button>
      </section>

      <section className="wire-request">
        <header>
          <h3>최근 요청사항 (1)</h3>
          <button type="button" aria-label="최근 요청사항 더보기">
            <i className="bi bi-arrow-up-right" />
          </button>
        </header>
        <button className="wire-task-row" type="button" onClick={onOpenMessenger}>
          <span>Aurora PR#132 Merge</span>
          <small>3시간 전</small>
          <i className="bi bi-chevron-right" />
        </button>
      </section>

      <section className="wire-team">
        <header>
          <h3>팀원 (5)</h3>
          <button type="button" aria-label="팀원 추가">
            <i className="bi bi-plus" />
          </button>
        </header>
        <div className="wire-team-card">
          {handoffRecipients.map((member) => (
            <article className="wire-member" key={member.name}>
              <div className={`wire-member-avatar ${member.status}`}>
                {member.avatarImage ? <img src={member.avatarImage} alt="" /> : <span>{member.avatar}</span>}
              </div>
              <div>
                <strong>{member.name}</strong>
                <small>{formatMemberMeta(member)}</small>
              </div>
              <button type="button" aria-label={`${member.name}에게 전화`}>
                <i className="bi bi-telephone" />
              </button>
              <button type="button" aria-label={`${member.name}에게 메시지`}>
                <i className="bi bi-chat" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
