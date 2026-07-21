import {
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
  copyFile,
  stat
} from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'site');
const DOCS = join(ROOT, 'docs');
const SITE_TITLE = 'debug-recorder-mcp documentation';
const SITE_URL = 'https://oaslananka.github.io/debug-recorder-mcp/';

const TOP_LEVEL_DOCS = [
  ['README.md', 'Project overview'],
  ['docs/usage.md', 'Usage guide'],
  ['docs/client-recipes.md', 'Client setup recipes'],
  ['docs/configuration.md', 'Configuration'],
  ['docs/architecture.md', 'Architecture'],
  ['docs/security.md', 'Security model'],
  ['docs/storage-retention.md', 'Storage retention'],
  ['docs/troubleshooting.md', 'Troubleshooting'],
  ['docs/testing.md', 'Testing'],
  ['docs/release-flow.md', 'Release flow'],
  ['docs/security-sbom-vex.md', 'SBOM and VEX policy'],
  ['CHANGELOG.md', 'Changelog'],
  ['LICENSE', 'License']
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function slugify(value) {
  return value
    .toLowerCase()
    .replaceAll('`', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function replaceMarkdownLinks(value) {
  let cursor = 0;
  let html = '';

  while (cursor < value.length) {
    const labelStart = value.indexOf('[', cursor);
    if (labelStart < 0) {
      return html + value.slice(cursor);
    }

    const labelEnd = value.indexOf('](', labelStart + 1);
    const hrefEnd = labelEnd < 0 ? -1 : value.indexOf(')', labelEnd + 2);
    if (labelEnd < 0 || hrefEnd < 0) {
      return html + value.slice(cursor);
    }

    const label = value.slice(labelStart + 1, labelEnd);
    const href = escapeHtml(value.slice(labelEnd + 2, hrefEnd));
    html += `${value.slice(cursor, labelStart)}<a href="${href}">${label}</a>`;
    cursor = hrefEnd + 1;
  }

  return html;
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = replaceMarkdownLinks(html);
  return html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function parseHeading(line) {
  let level = 0;
  while (level < 4 && line[level] === '#') {
    level += 1;
  }

  if (level === 0 || line[level] !== ' ') {
    return null;
  }

  const text = line.slice(level + 1).trim();
  return text ? { level, text } : null;
}

function parseBullet(line) {
  if (
    line.length < 3 ||
    (line[0] !== '-' && line[0] !== '*') ||
    line[1] !== ' '
  ) {
    return null;
  }

  const text = line.slice(2).trim();
  return text || null;
}

function closeList(state, html) {
  if (!state.inList) {
    return;
  }

  html.push('</ul>');
  state.inList = false;
}

function toggleCodeBlock(state, html) {
  if (state.inCode) {
    html.push('</code></pre>');
    state.inCode = false;
    return;
  }

  closeList(state, html);
  html.push('<pre><code>');
  state.inCode = true;
}

function renderMarkdownLine(line, state, html) {
  if (line.startsWith('```')) {
    toggleCodeBlock(state, html);
    return;
  }

  if (state.inCode) {
    html.push(`${escapeHtml(line)}\n`);
    return;
  }

  if (!line.trim()) {
    closeList(state, html);
    return;
  }

  const heading = parseHeading(line);
  if (heading) {
    closeList(state, html);
    const id = slugify(heading.text);
    html.push(
      `<h${heading.level} id="${id}">${inlineMarkdown(heading.text)}</h${heading.level}>`
    );
    return;
  }

  const bullet = parseBullet(line);
  if (bullet) {
    if (!state.inList) {
      html.push('<ul>');
      state.inList = true;
    }
    html.push(`<li>${inlineMarkdown(bullet)}</li>`);
    return;
  }

  closeList(state, html);
  html.push(`<p>${inlineMarkdown(line)}</p>`);
}

function markdownToHtml(markdown) {
  const html = [];
  const state = { inCode: false, inList: false };

  for (const line of markdown.split(/\r?\n/)) {
    renderMarkdownLine(line, state, html);
  }

  closeList(state, html);
  return html.join('\n');
}

function page(title, body, depth = 0) {
  const prefix = depth === 0 ? '' : '../'.repeat(depth);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${prefix}assets/site.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${prefix}index.html">debug-recorder-mcp</a>
    <nav>
      <a href="${prefix}docs/index.html">Docs</a>
      <a href="${prefix}api/index.html">API</a>
      <a href="https://github.com/oaslananka/debug-recorder-mcp">GitHub</a>
      <a href="https://www.npmjs.com/package/debug-recorder-mcp">npm</a>
    </nav>
  </header>
  <main>
${body}
  </main>
</body>
</html>
`;
}

async function copyRecursive(from, to) {
  const info = await stat(from);
  if (info.isDirectory()) {
    await mkdir(to, { recursive: true });
    for (const entry of await readdir(from)) {
      await copyRecursive(join(from, entry), join(to, entry));
    }
    return;
  }

  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
}

function withoutMarkdownExtension(path) {
  return path.toLowerCase().endsWith('.md') ? path.slice(0, -3) : path;
}

async function writeMarkdownPage(sourcePath, outputPath, title, depth) {
  const markdown = await readFile(join(ROOT, sourcePath), 'utf8');
  const html = markdownToHtml(markdown);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    page(title, `<article class="doc">\n${html}\n</article>`, depth)
  );
}

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, 'assets'), { recursive: true });
await writeFile(join(OUT, '.nojekyll'), '');
await writeFile(
  join(OUT, 'assets/site.css'),
  `:root{color-scheme:light dark;--bg:#0f172a;--panel:#111827;--text:#e5e7eb;--muted:#9ca3af;--accent:#f59e0b;--border:#334155}*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:linear-gradient(180deg,#020617,#111827);color:var(--text);line-height:1.65}.site-header{position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 1.5rem;background:rgba(2,6,23,.9);border-bottom:1px solid var(--border);backdrop-filter:blur(12px)}.brand{font-weight:800;color:#fff;text-decoration:none}.site-header nav{display:flex;gap:.8rem;flex-wrap:wrap}.site-header nav a{color:var(--muted);text-decoration:none}.site-header nav a:hover{color:#fff}main{max-width:1120px;margin:0 auto;padding:3rem 1.25rem}.hero{padding:4rem 0}.eyebrow{color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:.08em}.hero h1{font-size:clamp(2.4rem,7vw,5rem);line-height:1;margin:.4rem 0 1rem}.lead{font-size:1.25rem;color:#cbd5e1;max-width:760px}.actions{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.5rem}.button{display:inline-flex;padding:.8rem 1rem;border-radius:.8rem;border:1px solid var(--border);text-decoration:none;color:#fff;background:#1f2937}.button.primary{background:var(--accent);color:#111827;border-color:var(--accent);font-weight:800}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;margin:2rem 0}.card{padding:1.2rem;border:1px solid var(--border);background:rgba(15,23,42,.72);border-radius:1rem}.card h3{margin-top:0}.card a{color:#fbbf24}.doc{padding:2rem;border:1px solid var(--border);border-radius:1rem;background:rgba(15,23,42,.72)}a{color:#fbbf24}code{padding:.1rem .3rem;border-radius:.25rem;background:#020617}pre{overflow:auto;padding:1rem;border-radius:.75rem;background:#020617;border:1px solid var(--border)}table{border-collapse:collapse;width:100%}td,th{border:1px solid var(--border);padding:.5rem}hr{border:0;border-top:1px solid var(--border);margin:2rem 0}@media(max-width:640px){.site-header{align-items:flex-start;flex-direction:column}.hero{padding-top:2rem}}`
);

await copyRecursive(DOCS, join(OUT, 'source-docs'));

for (const [source, title] of TOP_LEVEL_DOCS) {
  const clean = withoutMarkdownExtension(source);
  const target =
    source === 'README.md'
      ? join(OUT, 'readme.html')
      : join(OUT, `${clean}.html`);
  await writeMarkdownPage(
    source,
    target,
    `${title} | ${SITE_TITLE}`,
    target.split('/').length - OUT.split('/').length - 1
  );
}

await writeFile(
  join(OUT, 'index.html'),
  page(
    SITE_TITLE,
    `<section class="hero">
      <div class="eyebrow">Local-first MCP debug memory</div>
      <h1>Search your own debugging history from any MCP client.</h1>
      <p class="lead">Record incidents, commands, failed attempts, successful fixes, diagnostics, exports, and reusable search presets in a local SQLite database.</p>
      <div class="actions">
        <a class="button primary" href="readme.html">Read the overview</a>
        <a class="button" href="docs/usage.html">Usage guide</a>
        <a class="button" href="api/index.html">API reference</a>
      </div>
    </section>
    <section class="grid">
      ${TOP_LEVEL_DOCS.map(([source, title]) => {
        const href =
          source === 'README.md'
            ? 'readme.html'
            : `${withoutMarkdownExtension(source)}.html`;
        return `<article class="card"><h3>${escapeHtml(title)}</h3><p><a href="${href}">Open ${escapeHtml(title)}</a></p></article>`;
      }).join('\n')}
    </section>
    <section class="card">
      <h2>Published documentation</h2>
      <p>This site is generated by <code>npm run docs:site</code> and published from the <code>gh-pages</code> branch. Raw generated TypeDoc Markdown is also available under <a href="source-docs/api/README.md">source-docs/api</a>.</p>
      <p><a href="${SITE_URL}">${SITE_URL}</a></p>
    </section>`
  )
);

await mkdir(join(OUT, 'docs'), { recursive: true });
await writeFile(
  join(OUT, 'docs/index.html'),
  page(
    `Docs | ${SITE_TITLE}`,
    `<article class="doc"><h1>Documentation</h1><ul>${TOP_LEVEL_DOCS.filter(
      ([source]) => source.startsWith('docs/')
    )
      .map(
        ([source, title]) =>
          `<li><a href="../${withoutMarkdownExtension(source)}.html">${escapeHtml(title)}</a></li>`
      )
      .join('')}</ul></article>`,
    1
  )
);

await mkdir(join(OUT, 'api'), { recursive: true });
await writeFile(
  join(OUT, 'api/index.html'),
  page(
    `API reference | ${SITE_TITLE}`,
    `<article class="doc"><h1>API reference</h1><p>The generated TypeDoc Markdown reference is published with this site.</p><p><a href="../source-docs/api/README.md">Open generated API Markdown index</a></p></article>`,
    1
  )
);

await writeFile(
  join(OUT, '404.html'),
  page(
    `Not found | ${SITE_TITLE}`,
    '<article class="doc"><h1>Not found</h1><p><a href="index.html">Return to docs home</a>.</p></article>'
  )
);
console.log(`Docs site generated at ${relative(ROOT, OUT)}`);
