document.addEventListener('DOMContentLoaded', () => {
  initNav();
  fillYear();
  renderHeroNews();
  renderNews();
  renderProjects();
  renderPeople();
  renderGallery();
  renderPapers();
  initTerminal();
});

function initNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle?.addEventListener('click', () => navLinks?.classList.toggle('open'));
  navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

function fillYear() {
  const yearSlot = document.querySelector('[data-year]');
  if (yearSlot) yearSlot.textContent = new Date().getFullYear();
}

async function loadJSON(path, fallback = []) {
  try {
    const res = await fetch(path);
    if (!res.ok) return fallback;
    return await res.json();
  } catch (err) {
    console.warn(`Could not load ${path}`, err);
    dataLoadError = true;
    return fallback;
  }
}

let cachedData = null;
let dataLoadError = false;
async function loadAllData() {
  if (cachedData) return cachedData;
  const [news, projects, people, gallery, papers] = await Promise.all([
    loadJSON('data/news.json'),
    loadJSON('data/projects.json'),
    loadJSON('data/people.json'),
    loadJSON('data/gallery.json'),
    loadBibPapers(),
  ]);
  cachedData = { news, projects, people, gallery, papers };
  return cachedData;
}

async function renderHeroNews() {
  const target = document.querySelector('[data-hero-news]');
  if (!target) return;
  const { news } = await loadAllData();
  if (!news.length) {
    target.innerHTML = '<p class="muted">Add items to data/news.json to see them here.</p>';
    return;
  }
  target.innerHTML = news
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

async function renderNews() {
  const target = document.querySelector('[data-news-list]');
  if (!target) return;
  const { news } = await loadAllData();
  if (!news.length) {
    target.innerHTML = '<p class="muted">Add items to data/news.json to see them here.</p>';
    return;
  }
  target.innerHTML = news
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

async function renderProjects() {
  const target = document.querySelector('[data-projects-list]');
  if (!target) return;
  const { projects } = await loadAllData();
  if (!projects.length) {
    target.innerHTML = '<p class="muted">Add projects to data/projects.json to see them here.</p>';
    return;
  }
  target.innerHTML = projects
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

async function renderPeople() {
  const target = document.querySelector('[data-people-list]');
  if (!target) return;
  const { people } = await loadAllData();
  if (!people.length) {
    target.innerHTML = '<p class="muted">Add members to data/people.json to see them here.</p>';
    return;
  }
  target.innerHTML = people
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

async function renderGallery() {
  const target = document.querySelector('[data-gallery-list]');
  if (!target) return;
  const { gallery } = await loadAllData();
  if (!gallery.length) {
    target.innerHTML = '<p class="muted">Add items to data/gallery.json to see them here.</p>';
    return;
  }
  target.innerHTML = gallery
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

async function renderPapers() {
  const target = document.querySelector('[data-papers-list]');
  if (!target) return;
  const { papers } = await loadAllData();
  if (!papers.length) {
    target.innerHTML = '<p class="muted">Add numbered .bib files in the papers/ folder (1.bib, 2.bib, ...).</p>';
    return;
  }
  target.innerHTML = papers
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

async function loadBibPapers() {
  const items = [];
  for (let i = 1; i <= 200; i++) {
    const path = `papers/${i}.bib`;
    const res = await fetch(path);
    if (!res.ok) break;
    const text = await res.text();
    const parsed = parseBib(text);
    if (parsed) items.push(parsed);
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

function formatDate(dateStr) {
  if (!dateStr) return 'Undated';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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

function initTerminal() {
  const output = document.querySelector('[data-terminal-output]');
  const form = document.querySelector('[data-terminal-form]');
  const input = document.querySelector('[data-terminal-input]');
  if (!output || !form || !input) return;

  let history = [];
  let historyIndex = history.length;

  appendLine(output, 'Type "help" to see available commands.');
  input.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const command = input.value.trim();
    if (!command) return;
    appendLine(output, `$ ${command}`, true);
    history.push(command);
    historyIndex = history.length;
    await handleCommand(command, output);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] || '';
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || '';
      e.preventDefault();
    }
  });
}

async function handleCommand(command, output) {
  const data = await loadAllData();
  const cmd = command.toLowerCase();
  if (dataLoadError) {
    appendLine(output, 'Warning: Some data could not be loaded. Serve over http(s) for fetch to work.');
    dataLoadError = false;
  }
  switch (cmd) {
    case 'help':
      appendLine(output, 'Commands: help, news, projects, people, papers, gallery, clear');
      break;
    case 'news':
      if (!data.news.length) appendLine(output, 'No news items yet.');
      data.news.slice(0, 5).forEach((item, idx) =>
        appendLine(output, `${idx + 1}. ${formatDate(item.date)} — ${item.title || ''}`),
      );
      break;
    case 'projects':
      if (!data.projects.length) appendLine(output, 'No projects yet.');
      data.projects.forEach((p, idx) =>
        appendLine(output, `${idx + 1}. ${p.title || 'Untitled'} — ${p.summary || ''}`),
      );
      break;
    case 'people':
      if (!data.people.length) appendLine(output, 'No people yet.');
      data.people.forEach((p, idx) =>
        appendLine(output, `${idx + 1}. ${p.name || ''} [${p.role || ''}] — ${p.bio || ''}`),
      );
      break;
    case 'papers':
      if (!data.papers.length) appendLine(output, 'No papers yet.');
      data.papers.forEach((p, idx) =>
        appendLine(output, `${idx + 1}. ${p.title || ''} — ${p.authors || ''} (${p.year || ''})`),
      );
      break;
    case 'gallery':
      if (!data.gallery.length) appendLine(output, 'No gallery items yet.');
      data.gallery.forEach((g, idx) =>
        appendLine(output, `${idx + 1}. ${g.title || 'Untitled'} — ${g.caption || ''}`),
      );
      break;
    case 'clear':
      output.innerHTML = '';
      break;
    default:
      appendLine(output, `Unknown command: ${command}`);
  }
}

function appendLine(output, text, isCommand = false) {
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.innerHTML = isCommand ? `<span class="prompt">$</span>${escapeHTML(text.replace(/^\$/, '').trim())}` : escapeHTML(text);
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
