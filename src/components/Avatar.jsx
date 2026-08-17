export function Avatar({ contact, large = false }) {
  return (
    <div className={`avatar ${contact.avatarType === 'emoji' ? 'avatar-emoji' : ''} ${contact.avatarImage ? 'avatar-image' : ''} ${large ? 'avatar-large' : ''}`}>
      {contact.avatarImage ? <img src={contact.avatarImage} alt="" /> : <span>{contact.avatar}</span>}
      <span className={`status-dot ${contact.status}`} />
    </div>
  );
}
