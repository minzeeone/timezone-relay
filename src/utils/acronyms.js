export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function mergeAcronyms(messageAcronyms = [], userAcronyms = []) {
  const merged = new Map();

  userAcronyms.forEach((item) => {
    if (item.acronym) merged.set(item.acronym, item);
  });

  messageAcronyms.forEach((item) => {
    if (item.acronym) merged.set(item.acronym, item);
  });

  return Array.from(merged.values()).sort((a, b) => b.acronym.length - a.acronym.length);
}

export function findAcronymsInLines(lines, acronyms) {
  return acronyms.filter((item) => lines.some((line) => line.includes(item.acronym)));
}
