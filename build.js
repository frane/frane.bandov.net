import fs from "fs";
import path from "path";
import { marked } from "marked";
import matter from "gray-matter";

// --- site config ---
const SITE = {
  title: "Frane Bandov",
  url: "https://frane.bandov.net",
  description: "Essays by Frane Bandov",
};
const SRC = "src";
const OUT = "public";
const STATIC = "static";
const TEMPLATE_PATH = "template.html";

// --- helpers ---

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walk(dir) {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) entries.push(...walk(full));
    else entries.push(full);
  }
  return entries;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  for (const file of walk(src)) {
    const rel = path.relative(src, file);
    const target = path.join(dest, rel);
    mkdirp(path.dirname(target));
    fs.copyFileSync(file, target);
  }
}

function rfc822(date) {
  return new Date(date).toUTCString();
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- math shielding ---

function shieldMath(md) {
  const slots = [];
  md = md.replace(/\$\$[\s\S]*?\$\$/g, (m) => {
    slots.push(m);
    return `<!--MATH${slots.length - 1}-->`;
  });
  md = md.replace(/\$[^$\n]+?\$/g, (m) => {
    slots.push(m);
    return `<!--MATH${slots.length - 1}-->`;
  });
  return { md, slots };
}

function restoreMath(html, slots) {
  return html.replace(/<!--MATH(\d+)-->/g, (_, i) => slots[Number(i)]);
}

// --- directives ---

// {{include path}} — inline another .md file's body (frontmatter stripped)
function processIncludes(md) {
  return md.replace(/\{\{include\s+(.+?)\}\}/g, (_, ref) => {
    const file = path.join(SRC, ref.endsWith(".md") ? ref : ref + ".md");
    if (!fs.existsSync(file)) {
      console.warn(`  warn: include not found: ${file}`);
      return "";
    }
    const { content } = matter(fs.readFileSync(file, "utf-8"));
    // recurse so included files can also use {{include}}
    return processIncludes(content);
  });
}

// {{list folder}} — auto-generate a list from all .md files in src/folder
function processList(html, index) {
  // marked wraps {{list ...}} in <p>, so match both wrapped and bare
  return html.replace(/<p>\{\{list\s+(.+?)\}\}<\/p>|\{\{list\s+(.+?)\}\}/g, (_, f1, f2) => {
    const folder = f1 || f2;
    const items = (index.get(folder) || []).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    if (!items.length) return "";
    return items
      .map(
        (e) =>
          `<article class="essay-item"><time>${formatDate(e.date)}</time> ` +
          `<a href="${e.url}">${e.title}</a>` +
          (e.summary ? `<span class="summary"> — ${e.summary}</span>` : "") +
          `</article>`
      )
      .join("\n");
  });
}

// --- main ---

const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

function render(title, contentHtml, metaHtml = "") {
  return template
    .replace("{{title}}", () => title)
    .replace("{{meta}}", () => metaHtml)
    .replace("{{content}}", () => contentHtml);
}

function pageMeta(data, rel, folder) {
  const pageUrl = `${SITE.url}/${rel.split(path.sep).join("/")}`;
  const lines = [
    `<meta property="og:title" content="${escapeXml(data.title || SITE.title)}">`,
    `<meta property="og:url" content="${pageUrl}">`,
    `<meta property="og:type" content="${folder === "essays" ? "article" : "website"}">`,
  ];
  if (data.summary)
    lines.push(`<meta property="og:description" content="${escapeXml(data.summary)}">`);
  if (data.image) {
    lines.push(`<meta property="og:image" content="${SITE.url}${data.image}">`);
    lines.push(`<meta name="twitter:card" content="summary_large_image">`);
    lines.push(`<meta name="twitter:image" content="${SITE.url}${data.image}">`);
  }
  return lines.join("\n  ");
}

// wipe output
rmrf(OUT);
mkdirp(OUT);

// Pass 1: collect metadata from all .md files
const mdFiles = walk(SRC).filter((f) => f.endsWith(".md"));
const folderIndex = new Map(); // folder name → [{title, date, summary, url}]

for (const file of mdFiles) {
  const raw = fs.readFileSync(file, "utf-8");
  const { data } = matter(raw);
  const rel = path.relative(SRC, file).replace(/\.md$/, ".html");
  const folder = path.dirname(path.relative(SRC, file));

  if (folder !== ".") {
    if (!folderIndex.has(folder)) folderIndex.set(folder, []);
    folderIndex.get(folder).push({
      title: data.title || path.basename(file, ".md"),
      date: data.date || "",
      summary: data.summary || "",
      url: "/" + rel,
    });
  }
}

// Pass 2: render all pages
const essays = folderIndex.get("essays") || [];
essays.sort((a, b) => new Date(b.date) - new Date(a.date));

for (const file of mdFiles) {
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);

  // process directives, then markdown
  let md = processIncludes(content);
  const { md: safeContent, slots } = shieldMath(md);
  let html = restoreMath(marked(safeContent), slots);
  html = processList(html, folderIndex);

  const rel = path.relative(SRC, file).replace(/\.md$/, ".html");
  const outPath = path.join(OUT, rel);

  mkdirp(path.dirname(outPath));
  const folder = path.dirname(path.relative(SRC, file));
  fs.writeFileSync(
    outPath,
    render(data.title || SITE.title, html, pageMeta(data, rel, folder))
  );
}

// essays listing page
const essaysListHtml = essays
  .map(
    (e) =>
      `<article class="essay-item"><time>${formatDate(e.date)}</time> <a href="${e.url}">${e.title}</a></article>`
  )
  .join("\n");
fs.writeFileSync(
  path.join(OUT, "essays.html"),
  render(`Essays — ${SITE.title}`, `<h1>Essays</h1>\n${essaysListHtml}`)
);

// RSS feed
const rssItems = essays
  .map(
    (e) => `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${SITE.url}${e.url}</link>
      <guid>${SITE.url}${e.url}</guid>
      <pubDate>${rfc822(e.date)}</pubDate>
      <description>${escapeXml(e.summary)}</description>
    </item>`
  )
  .join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE.title}</title>
    <link>${SITE.url}</link>
    <description>${SITE.description}</description>
    <language>en</language>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(OUT, "rss.xml"), rss);

// copy static assets
copyDir(STATIC, OUT);

console.log(`Built ${essays.length} essay(s), ${mdFiles.length} page(s) total.`);
