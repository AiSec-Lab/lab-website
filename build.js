const fs = require('fs').promises;
const path = require('path');

async function main() {
  const root = __dirname;
  const dist = path.join(root, 'dist');
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });

  const data = await loadAllData(root);
  const pages = ['index.html', 'news.html', 'papers.html', 'projects.html', 'people.html', 'detail.html', 'grants.html'];

  for (const page of pages) {
    const html = await fs.readFile(path.join(root, page), 'utf8');
    const rendered = injectData(html, data);
    await fs.writeFile(path.join(dist, page), rendered, 'utf8');
  }

  await fs.cp(path.join(root, 'assets'), path.join(dist, 'assets'), { recursive: true });
  await fs.cp(path.join(root, 'data'), path.join(dist, 'data'), { recursive: true });
  await fs.cp(path.join(root, 'papers'), path.join(dist, 'papers'), { recursive: true });
  await fs.cp(path.join(root, 'papers-pdf'), path.join(dist, 'papers-pdf'), { recursive: true });
  await fs.cp(path.join(root, 'papers-poster'), path.join(dist, 'papers-poster'), { recursive: true });
  await fs.cp(path.join(root, 'cv'), path.join(dist, 'cv'), { recursive: true });

  console.log('Built static pages to dist/');
}

async function loadAllData(root) {
  const [news, projects, people, papers] = await Promise.all([
    loadJSON(path.join(root, 'data/news.json')),
    loadJSON(path.join(root, 'data/projects.json')),
    loadJSON(path.join(root, 'data/people.json')),
    loadBibPapers(path.join(root, 'papers')),
  ]);
  return { news, projects, people, papers };
}

async function loadJSON(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    console.warn(`Could not load ${filePath}: ${err.message}`);
    return [];
  }
}

async function loadBibPapers(folder) {
  const items = [];
  for (let i = 1; i <= 200; i++) {
    const file = path.join(folder, `${i}.bib`);
    try {
      const text = await fs.readFile(file, 'utf8');
      const parsed = parseBib(text);
      if (parsed) items.push(parsed);
    } catch (err) {
      break;
    }
  }
  return items;
}

function parseBib(text) {
  if (!text) return null;
  const parsed = parseBibEntry(text);
  if (!parsed) return null;

  const fields = parsed.fields;
  const title = fields.title || '';
  const author = fields.author || '';
  const year = fields.year || '';
  const venue = fields.booktitle || fields.journal || '';
  const doi = fields.doi || '';
  const url = fields.url || (doi ? `https://doi.org/${doi}` : '');
  const image = fields.image || '';

  return {
    entryType: parsed.entryType,
    citationKey: parsed.citationKey,
    fields,
    title,
    authors: formatAuthors(author),
    year,
    venue,
    url,
    image,
  };
}

function parseBibEntry(rawText) {
  const text = String(rawText || '').replace(/\r\n?/g, '\n');
  const atIndex = text.indexOf('@');
  if (atIndex < 0) return null;

  const typeMatch = text.slice(atIndex + 1).match(/^\s*([a-zA-Z]+)/);
  if (!typeMatch) return null;
  const entryType = typeMatch[1].toLowerCase();
  let i = atIndex + 1 + typeMatch[0].length;

  while (i < text.length && /\s/.test(text[i])) i += 1;
  const openChar = text[i];
  if (openChar !== '{' && openChar !== '(') return null;
  const closeChar = openChar === '{' ? '}' : ')';
  const closeIndex = findMatchingDelimiter(text, i, openChar, closeChar);
  if (closeIndex < 0) return null;

  const entryBody = text.slice(i + 1, closeIndex).trim();
  const firstComma = findTopLevelComma(entryBody);
  if (firstComma < 0) return null;

  const citationKey = entryBody.slice(0, firstComma).trim();
  const fieldsText = entryBody.slice(firstComma + 1);
  const fields = parseBibFields(fieldsText);
  return { entryType, citationKey, fields };
}

function findMatchingDelimiter(text, startIndex, openChar, closeChar) {
  let depth = 0;
  let inQuote = false;
  for (let i = startIndex; i < text.length; i += 1) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';

    if (ch === '"' && prev !== '\\') {
      inQuote = !inQuote;
      continue;
    }
    if (inQuote) continue;

    if (ch === openChar) {
      depth += 1;
      continue;
    }
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findTopLevelComma(text) {
  let depth = 0;
  let inQuote = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    if (ch === '"' && prev !== '\\') {
      inQuote = !inQuote;
      continue;
    }
    if (inQuote) continue;
    if (ch === '{') depth += 1;
    if (ch === '}') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) return i;
  }
  return -1;
}

function parseBibFields(text) {
  const fields = {};
  let i = 0;

  while (i < text.length) {
    while (i < text.length && /[\s,]/.test(text[i])) i += 1;
    if (i >= text.length) break;

    const keyStart = i;
    while (i < text.length && /[a-zA-Z0-9_:-]/.test(text[i])) i += 1;
    const key = text.slice(keyStart, i).trim().toLowerCase();
    if (!key) {
      i += 1;
      continue;
    }

    while (i < text.length && /\s/.test(text[i])) i += 1;
    if (text[i] !== '=') {
      while (i < text.length && text[i] !== ',') i += 1;
      continue;
    }
    i += 1;
    while (i < text.length && /\s/.test(text[i])) i += 1;

    const { value, nextIndex } = readBibValue(text, i);
    fields[key] = cleanupBibValue(value);
    i = nextIndex;

    while (i < text.length && /\s/.test(text[i])) i += 1;
    if (text[i] === ',') i += 1;
  }

  return fields;
}

function readBibValue(text, startIndex) {
  if (startIndex >= text.length) return { value: '', nextIndex: startIndex };
  const startChar = text[startIndex];

  if (startChar === '{') {
    let depth = 0;
    for (let i = startIndex; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '{') depth += 1;
      if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          return {
            value: text.slice(startIndex + 1, i),
            nextIndex: i + 1,
          };
        }
      }
    }
    return { value: text.slice(startIndex + 1), nextIndex: text.length };
  }

  if (startChar === '"') {
    let i = startIndex + 1;
    while (i < text.length) {
      if (text[i] === '"' && text[i - 1] !== '\\') {
        return {
          value: text.slice(startIndex + 1, i),
          nextIndex: i + 1,
        };
      }
      i += 1;
    }
    return { value: text.slice(startIndex + 1), nextIndex: text.length };
  }

  let i = startIndex;
  while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') i += 1;
  return {
    value: text.slice(startIndex, i),
    nextIndex: i,
  };
}

function cleanupBibValue(value) {
  let clean = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  while (clean.startsWith('{') && clean.endsWith('}') && clean.length > 1) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

function formatAuthors(authors) {
  if (!authors) return '';
  return authors
    .split(/\s+and\s+/i)
    .map((a) => a.trim())
    .filter(Boolean)
    .join(', ');
}

function injectData(html, data) {
  let out = html;
  out = fillSlot(out, 'data-hero-news', renderHeroNews(data.news));
  out = fillSlot(out, 'data-news-list', renderNews(data.news));
  out = fillSlot(out, 'data-projects-list', renderProjects(data.projects));
  out = fillSlot(out, 'data-people-list', renderPeople(data.people));
  out = fillSlot(out, 'data-papers-list', renderPapers(data.papers));
  return out;
}

function fillSlot(html, attr, content) {
  const pattern = new RegExp(`(<[^>]+${attr}[^>]*>)([\\s\\S]*?)(<\\/[^>]+>)`);
  if (!pattern.test(html)) return html;
  return html.replace(pattern, `$1${content}$3`);
}

function renderHeroNews(news) {
  if (!news || !news.length) return '<p class="muted">Add items to data/news.json to see them here.</p>';
  return news
    .slice(0, 5)
    .map(
      (item, idx) => {
        const thumb = getPrimaryImage(item);
        return `
        <a class="detail-card-link" href="${getDetailLink('news', idx + 1)}">
        <div class="card news-card detail-card${thumb ? ' with-thumb' : ''}">
          ${thumb ? `<div class="thumb" style="background-image:url('${thumb}')"></div>` : ''}
          <div>
            <div class="pill">${formatDate(item.date)}</div>
            <h3>${item.title || 'Untitled update'}</h3>
            <p class="muted">${item.summary || ''}</p>
            <div class="cta-row"><span class="text-link">Open details</span></div>
          </div>
        </div>
        </a>
      `;
      },
    )
    .join('');
}

function renderNews(news) {
  if (!news || !news.length) return '<p class="muted">Add items to data/news.json to see them here.</p>';
  return news
    .map(
      (item, idx) => {
        const thumb = getPrimaryImage(item);
        return `
      <a class="detail-card-link" href="${getDetailLink('news', idx + 1)}">
      <div class="card news-card detail-card${thumb ? ' with-thumb' : ''}">
        ${thumb ? `<div class="thumb" style="background-image:url('${thumb}')"></div>` : ''}
        <div>
          <div class="pill">${formatDate(item.date)}</div>
          <h3>${item.title || 'Untitled update'}</h3>
          <p class="muted">${item.summary || ''}</p>
          <div class="cta-row"><span class="text-link">Open details</span></div>
        </div>
      </div>
      </a>
    `;
      },
    )
    .join('');
}

function renderProjects(projects) {
  if (!projects || !projects.length) return '<p class="muted">Add projects to data/projects.json to see them here.</p>';
  return projects
    .map(
      (project, idx) => {
        const thumb = getPrimaryImage(project);
        return `
      <a class="detail-card-link" href="${getDetailLink('projects', idx + 1)}">
      <div class="card detail-card${thumb ? ' with-thumb' : ''}">
        ${thumb ? `<div class="thumb" style="background-image:url('${thumb}')"></div>` : ''}
        <div>
          <h3>${project.title || 'Project title'}</h3>
          <p class="muted">${project.summary || ''}</p>
          ${renderTags(project.tags)}
          <div class="cta-row"><span class="text-link">Open details</span></div>
        </div>
      </div>
      </a>
    `;
      },
    )
    .join('');
}

function getImageList(item) {
  if (!item || typeof item !== 'object') return [];
  if (Array.isArray(item.images)) {
    return item.images.map((img) => String(img || '').trim()).filter(Boolean);
  }
  const single = String(item.image || '').trim();
  return single ? [single] : [];
}

function getPrimaryImage(item) {
  return getImageList(item)[0] || '';
}

function renderPeople(people) {
  if (!people || !people.length) return '<p class="muted">Add members to data/people.json to see them here.</p>';
  const ranked = people
    .map((person, idx) => ({ ...person, _detailId: idx + 1 }))
    .sort((a, b) => rankRole(a.role) - rankRole(b.role));
  const leadTeam = ranked.filter((person) => isLeadRole(person.role));
  const students = ranked.filter((person) => isStudentRole(person.role));
  const others = ranked.filter((person) => !isLeadRole(person.role) && !isStudentRole(person.role));

  const sections = [];
  if (leadTeam.length) {
    sections.push(`<div class="grid people-grid people-grid-leads">${renderPeopleCards(leadTeam)}</div>`);
  }
  if (students.length) {
    sections.push(`<div class="grid people-grid people-grid-students">${renderPeopleCards(students)}</div>`);
  }
  if (others.length) {
    sections.push(`<div class="grid people-grid people-grid-others">${renderPeopleCards(others)}</div>`);
  }

  return `<div class="people-rows">${sections.join('')}</div>`;
}

function rankRole(role = '') {
  const r = role.toLowerCase();
  if (r.includes('pi') && !r.includes('co')) return 0;
  if (r.includes('co') && r.includes('pi')) return 1;
  if (r.includes('student')) return 2;
  return 3;
}

function isLeadRole(role = '') {
  return role.toLowerCase().includes('pi');
}

function isStudentRole(role = '') {
  return role.toLowerCase().includes('student');
}

function renderPeopleCards(people) {
  return people
    .map(
      (person) => `
      <a class="detail-card-link" href="${getDetailLink('people', person._detailId)}">
      <div class="card person detail-card">
        <div class="person-card-body">
          <h3>${person.name || 'Name'}</h3>
          <div class="role">${person.role || 'Role'}</div>
          <p class="muted">${person.bio || ''}</p>
          <div class="cta-row"><span class="text-link">Open details</span></div>
        </div>
        ${
          person.image
            ? `<div class="avatar photo" style="background-image:url('${person.image}')"></div>`
            : `<div class="avatar">${getInitials(person.name)}</div>`
        }
      </div>
      </a>
    `,
    )
    .join('');
}

function renderPapers(papers) {
  if (!papers || !papers.length) return '<p class="muted">Add numbered .bib files in the papers/ folder (1.bib, 2.bib, ...).</p>';
  return papers
    .map(
      (paper, idx) => `
      <a class="detail-card-link" href="${getDetailLink('publications', idx + 1)}">
      <div class="paper publication-row${paper.image ? ' with-thumb' : ''}">
        ${paper.image ? `<div class="paper-thumb" style="background-image:url('${paper.image}')"></div>` : ''}
        <div>
          <div class="title">${paper.title || 'Untitled'}</div>
          <div class="meta">${paper.authors || ''}</div>
          <div class="meta">${paper.venue ? paper.venue + ' · ' : ''}${paper.year || ''}</div>
          <div class="cta-row"><span class="text-link">Open details</span></div>
        </div>
      </div>
      </a>
    `,
    )
    .join('');
}

function getDetailLink(type, id) {
  return `detail.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
}

function getInitials(name = '') {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('');
  return letters.slice(0, 3).toUpperCase() || 'ID';
}

function renderTags(tags) {
  if (!tags || !tags.length) return '';
  return `<div class="tags">${tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Undated';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
