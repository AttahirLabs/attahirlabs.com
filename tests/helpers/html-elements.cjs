// Small source-level element reader for contracts that allow different layouts.
// It balances matching tag names instead of truncating a nested <div> early.
function elementsWithAttribute(html, attribute) {
  const result = [];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const attributePattern = new RegExp(`\\s${escaped}=(['"])(.*?)\\1`, 'i');
  const openings = /<([a-z][\w:-]*)\b[^>]*>/gi;
  for (let opening; (opening = openings.exec(html));) {
    const found = opening[0].match(attributePattern);
    if (!found) continue;
    const tag = opening[1].toLowerCase();
    if (voidTags.has(tag) || opening[0].endsWith('/>')) {
      result.push({ tag, value: found[2], opening: opening[0], html: opening[0] });
      continue;
    }
    const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    tokens.lastIndex = openings.lastIndex;
    let depth = 1;
    let end = openings.lastIndex;
    for (let token; depth && (token = tokens.exec(html));) {
      if (token[0].startsWith('</')) depth -= 1;
      else if (!token[0].endsWith('/>')) depth += 1;
      end = tokens.lastIndex;
    }
    if (depth) throw new Error(`Unclosed <${tag}> with ${attribute}="${found[2]}"`);
    result.push({ tag, value: found[2], opening: opening[0], html: html.slice(opening.index, end) });
  }
  return result;
}

module.exports = { elementsWithAttribute };
