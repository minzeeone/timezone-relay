import { Avatar } from './Avatar.jsx';

export function ProfilePanel({ contact, profile, onClose }) {
  return (
    <aside className="profile-panel" aria-label={`${contact.name} 프로필`}>
      <button className="profile-close" type="button" onClick={onClose} aria-label="프로필 닫기">
        <i className="bi bi-x-lg" />
      </button>
      <div
        className="profile-cover"
        style={{
          '--profile-cover-image': `url(${profile.coverImage})`,
        }}
      >
        <strong>프로필</strong>
      </div>
      <div className="profile-body">
        <div className="profile-identity">
          <Avatar contact={contact} />
          <div>
            <strong>{contact.name}</strong>
            <small>{profile.email}</small>
          </div>
        </div>

        <div className="profile-meta">
          <span>
            <i className="bi bi-globe2" /> {profile.location}
          </span>
          <span>
            <i className="bi bi-clock" /> {profile.localTime}
          </span>
        </div>

        <section className="profile-section">
          <h3>소개</h3>
          <p>
            {profile.role}
            <br />
            email: {profile.email}
            <br />
            tel: {profile.phone}
          </p>
        </section>

        <section className="profile-section">
          <h3>함께 진행중인 프로젝트</h3>
          <div className="profile-projects">
            {profile.projects.map((project) => (
              <button className={`profile-project ${project.tone}`} type="button" key={project.title}>
                <i className={`bi ${project.icon}`} />
                <span>
                  <strong>{project.title}</strong>
                  <small>진행률 {project.progress}%</small>
                </span>
                <i className="bi bi-chevron-right" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
