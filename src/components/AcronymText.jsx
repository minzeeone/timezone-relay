import { escapeRegExp } from '../utils/acronyms.js';

export function AcronymText({ text, acronyms = [], onShow, onHide }) {
  if (!acronyms.length) return text;

  const explanations = new Map(acronyms.map((item) => [item.acronym, item]));
  const pattern = new RegExp(`(${acronyms.map((item) => escapeRegExp(item.acronym)).join('|')})`, 'g');

  return text.split(pattern).map((part, index) => {
    const explanation = explanations.get(part);

    if (!explanation) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <span
        className="acronym-term"
        key={`${part}-${index}`}
        tabIndex="0"
        onMouseEnter={(event) => onShow(explanation, event.currentTarget)}
        onFocus={(event) => onShow(explanation, event.currentTarget)}
        onMouseLeave={onHide}
        onBlur={onHide}
      >
        {part}
      </span>
    );
  });
}
