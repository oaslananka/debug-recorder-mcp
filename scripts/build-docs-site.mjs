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
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = escapeHtml(href);
    return `<a href="${safeHref}">${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return html;
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inCode = false;
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        closeList();
        html.push('<pre><code>');
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugify(text);
      html.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
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
  const clean = source.replace(/\.md$/i, '').replace(/^docs\//, 'docs/');
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
            : `${source.replace(/\.md$/i, '')}.html`;
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
          `<li><a href="../${source.replace(/\.md$/i, '')}.html">${escapeHtml(title)}</a></li>`
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
