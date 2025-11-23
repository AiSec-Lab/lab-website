const fs = require('fs').promises;
const path = require('path');

async function main() {
  const root = __dirname;
  const dist = path.join(root, 'dist');
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });

  const data = await loadAllData(root);
  const pages = ['index.html', 'news.html', 'papers.html', 'projects.html', 'people.html', 'gallery.html', 'grants.html'];

  for (const page of pages) {
    const html = await fs.readFile(path.join(root, page), 'utf8');
    const rendered = injectData(html, data);
    await fs.writeFile(path.join(dist, page), rendered, 'utf8');
  }

  await fs.cp(path.join(root, 'assets'), path.join(dist, 'assets'), { recursive: true });
  await fs.cp(path.join(root, 'data'), path.join(dist, 'data'), { recursive: true });
  await fs.cp(path.join(root, 'papers'), path.join(dist, 'papers'), { recursive: true });

  console.log('Built static pages to dist/');
}

async function loadAllData(root) {
  const [news, projects, people, gallery, papers] = await Promise.all([
    loadJSON(path.join(root, 'data/news.json')),
    loadJSON(path.join(root, 'data/projects.json')),
    loadJSON(path.join(root, 'data/people.json')),
    loadJSON(path.join(root, 'data/gallery.json')),
    loadBibPapers(path.join(root, 'papers')),
  ]);
  return { news, projects, people, gallery, papers };
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
  const field = (name) => {
    const match = text.match(new RegExp(`${name}\\s*=\\s*[{\"]([^{}\n]+)[}\"]`, 'i'));
    return match ? match[1].trim() : '';
  };
  const title = field('title');
  const authors = field('author');
  const year = field('year');
  const journal = field('journal') || field('booktitle') || '';
  const doi = field('doi');
  const url = field('url') || (doi ? `https://doi.org/${doi}` : '');
  const venue = journal;
  const image = field('image');
  return {
    title,
    authors: formatAuthors(authors),
    year,
    venue,
    url,
    image,
  };
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
  out = fillSlot(out, 'data-gallery-list', renderGallery(data.gallery));
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
      (item) => `
        <div class="card news-card${item.image ? ' with-thumb' : ''}">
          ${item.image ? `<div class="thumb" style="background-image:url('${item.image}')"></div>` : ''}
          <div>
            <div class="pill">${formatDate(item.date)}</div>
            <h3>${item.title || 'Untitled update'}</h3>
            <p class="muted">${item.summary || ''}</p>
            ${item.link ? `<a class="text-link" href="${item.link}" target="_blank" rel="noopener">Learn more</a>` : ''}
          </div>
        </div>
      `,
    )
    .join('');
}

function renderNews(news) {
  if (!news || !news.length) return '<p class="muted">Add items to data/news.json to see them here.</p>';
  return news
    .map(
      (item) => `
      <div class="card news-card${item.image ? ' with-thumb' : ''}">
        ${item.image ? `<div class="thumb" style="background-image:url('${item.image}')"></div>` : ''}
        <div>
          <div class="pill">${formatDate(item.date)}</div>
          <h3>${item.title || 'Untitled update'}</h3>
          <p class="muted">${item.summary || ''}</p>
          ${item.link ? `<a class="text-link" href="${item.link}" target="_blank" rel="noopener">Learn more</a>` : ''}
        </div>
      </div>
    `,
    )
    .join('');
}

function renderProjects(projects) {
  if (!projects || !projects.length) return '<p class="muted">Add projects to data/projects.json to see them here.</p>';
  return projects
    .map(
      (project) => `
      <div class="card${project.image ? ' with-thumb' : ''}">
        ${project.image ? `<div class="thumb" style="background-image:url('${project.image}')"></div>` : ''}
        <div>
          <h3>${project.title || 'Project title'}</h3>
          <p class="muted">${project.summary || ''}</p>
          ${renderTags(project.tags)}
          ${project.link ? `<div class="cta-row"><a class="text-link" href="${project.link}" target="_blank" rel="noopener">Project page</a></div>` : ''}
        </div>
      </div>
    `,
    )
    .join('');
}

function renderPeople(people) {
  if (!people || !people.length) return '<p class="muted">Add members to data/people.json to see them here.</p>';
  const ranked = [...people].sort((a, b) => rankRole(a.role) - rankRole(b.role));
  return ranked
    .map(
      (person) => `
      <div class="card person">
        ${
          person.image
            ? `<div class="avatar photo" style="background-image:url('${person.image}')"></div>`
            : `<div class="avatar">${getInitials(person.name)}</div>`
        }
        <div>
          <h3>${person.name || 'Name'}</h3>
          <div class="role">${person.role || 'Role'}</div>
          <p class="muted">${person.bio || ''}</p>
          ${renderTags(person.focus)}
          ${person.link ? `<div class="cta-row"><a class="text-link" href="${person.link}" target="_blank" rel="noopener">Profile</a></div>` : ''}
        </div>
      </div>
    `,
    )
    .join('');
}

function rankRole(role = '') {
  const r = role.toLowerCase();
  if (r.includes('pi') && !r.includes('co')) return 0;
  if (r.includes('co') && r.includes('pi')) return 1;
  if (r.includes('student')) return 2;
  return 3;
}

function renderGallery(gallery) {
  if (!gallery || !gallery.length) return '<p class="muted">Add items to data/gallery.json to see them here.</p>';
  return gallery
    .map((item) => {
      const background = item.image ? `style="background-image:url('${item.image}');"` : '';
      return `
        <div class="gallery-item" ${background}>
          <div class="gallery-overlay">
            <div class="gallery-title">${item.title || 'Untitled'}</div>
            <div class="gallery-caption">${item.caption || ''}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderPapers(papers) {
  if (!papers || !papers.length) return '<p class="muted">Add numbered .bib files in the papers/ folder (1.bib, 2.bib, ...).</p>';
  return papers
    .map(
      (paper) => `
      <div class="paper${paper.image ? ' with-thumb' : ''}">
        ${paper.image ? `<div class="paper-thumb" style="background-image:url('${paper.image}')"></div>` : ''}
        <div>
          <div class="title">${paper.title || 'Untitled'}</div>
          <div class="meta">${paper.authors || ''}</div>
          <div class="meta">${paper.venue ? paper.venue + ' · ' : ''}${paper.year || ''}</div>
          ${paper.url ? `<a class="text-link" href="${paper.url}" target="_blank" rel="noopener">Link</a>` : ''}
        </div>
      </div>
    `,
    )
    .join('');
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
