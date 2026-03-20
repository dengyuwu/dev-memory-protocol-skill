export function tokenize(input) {
  const normalized = String(input || "").trim().normalize("NFKC").toLowerCase();
  const tokens = new Set();

  for (const token of normalized.split(/[^a-z0-9_-]+/)) {
    if (token.length >= 2) {
      tokens.add(token);
    }
  }

  const chineseMatches = normalized.match(/\p{Script=Han}+/gu) || [];
  for (const segment of chineseMatches) {
    if (!segment) {
      continue;
    }

    tokens.add(segment);

    if (segment.length === 1) {
      continue;
    }

    for (let index = 0; index < segment.length - 1; index += 1) {
      tokens.add(segment.slice(index, index + 2));
    }
  }

  return Array.from(tokens);
}

export function scoreDocument(document, tokens) {
  const haystack = `${document.path} ${document.content}`.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (document.path.toLowerCase().includes(token)) {
      score += 3;
    }

    if (haystack.includes(token)) {
      score += 1;
    }
  }

  return score;
}
