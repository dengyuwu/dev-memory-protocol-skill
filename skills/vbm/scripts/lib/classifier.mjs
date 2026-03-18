export function tokenize(input) {
  return Array.from(
    new Set(
      String(input || "")
        .toLowerCase()
        .split(/[^a-z0-9_-]+/)
        .filter((token) => token.length >= 2)
    )
  );
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
