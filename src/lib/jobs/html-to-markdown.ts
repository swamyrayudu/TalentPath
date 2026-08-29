/**
 * Job descriptions arrive from external boards as WYSIWYG HTML — nested spans,
 * inline `font-family: verdana` and hardcoded `color: #000000` that turns
 * invisible in dark mode, plus whatever else the poster pasted in.
 *
 * Rather than sanitising HTML and rendering it raw (a blocklist you have to keep
 * winning), we convert the useful structure to Markdown and render that with
 * react-markdown *without* rehype-raw. Anything that is not converted here is
 * stripped to text, and react-markdown does not execute raw HTML, so the result
 * is safe by construction.
 */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201C',
  rdquo: '\u201D',
  hellip: '…',
  bull: '•',
  middot: '·',
  eacute: 'é',
  reg: '®',
  copy: '©',
  trade: '™',
  deg: '°',
  rupee: '₹',
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => safeCodePoint(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => safeCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+[0-9]*);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/** Only http(s) links survive — no javascript:, data: or relative surprises. */
function safeHref(href: string): string | null {
  const trimmed = decodeEntities(href).trim();
  return /^https?:\/\/[^\s<>"']+$/i.test(trimmed) ? trimmed : null;
}

/** Escapes the characters that would otherwise be read as Markdown syntax. */
function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_[\]])/g, '\\$1').replace(/^(\s*)([#>+-]|\d+\.)\s/gm, '$1$2\u200b ');
}

export function htmlToMarkdown(html: string | null | undefined): string {
  if (!html) return '';

  let out = html;

  // Drop anything whose *content* should never be shown.
  out = out.replace(/<(script|style|iframe|object|embed|noscript)\b[\s\S]*?<\/\1>/gi, '');
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  // Block boundaries become blank lines; do this before tags are stripped.
  out = out.replace(/<br\s*\/?>/gi, '\n');
  out = out.replace(/<\/(p|div|section|article|tr|table|blockquote)\s*>/gi, '\n\n');
  out = out.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');

  // Headings.
  out = out.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi, (_, level, inner) => {
    const text = stripToText(inner);
    return text ? `\n\n${'#'.repeat(Math.min(6, Number(level) + 2))} ${text}\n\n` : '\n\n';
  });

  // List items. Ordered lists are rendered with "1." throughout — Markdown
  // renumbers them, and tracking indices across nested lists is not worth it.
  out = out.replace(/<li\b[^>]*>([\s\S]*?)(?=<\/li\s*>|<li\b|<\/[uo]l\s*>)/gi, (_, inner) => {
    const text = stripToText(inner);
    return text ? `\n- ${text}` : '';
  });
  out = out.replace(/<\/li\s*>/gi, '');
  out = out.replace(/<\/[uo]l\s*>/gi, '\n\n');
  out = out.replace(/<[uo]l\b[^>]*>/gi, '\n');

  // Inline emphasis. Run repeatedly so nested <strong><em> pairs both convert.
  for (let i = 0; i < 3; i++) {
    out = out.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi, (_, __, inner) => {
      const text = inner.trim();
      return text ? `**${text}**` : '';
    });
    out = out.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi, (_, __, inner) => {
      const text = inner.trim();
      return text ? `*${text}*` : '';
    });
    out = out.replace(/<code\b[^>]*>([\s\S]*?)<\/code\s*>/gi, (_, inner) => {
      const text = inner.trim();
      return text ? `\`${text}\`` : '';
    });
  }

  // Links.
  out = out.replace(/<a\b[^>]*?href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a\s*>/gi, (_, href, inner) => {
    const text = stripToText(inner);
    const url = safeHref(href);
    if (!text) return '';
    return url ? `[${text}](${url})` : text;
  });

  // Everything left over is structural noise (span, font, div, table cells...).
  out = out.replace(/<[^>]*>/g, ' ');
  out = decodeEntities(out);

  return tidy(out);
}

/** Reduces a fragment to a single line of plain text. */
function stripToText(fragment: string): string {
  return decodeEntities(
    fragment
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function tidy(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    // Collapse runs of spaces/tabs, but never across a newline.
    .replace(/[^\S\n]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Plain-text version, for previews and meta descriptions. */
export function htmlToPlainText(html: string | null | undefined, maxLength = 300): string {
  if (!html) return '';
  const text = tidy(decodeEntities(html.replace(/<[^>]*>/g, ' '))).replace(/\n+/g, ' ');
  if (text.length <= maxLength) return text;
  return text.slice(0, text.lastIndexOf(' ', maxLength) || maxLength).trimEnd() + '…';
}

export const _internal = { decodeEntities, safeHref, escapeMarkdown };
