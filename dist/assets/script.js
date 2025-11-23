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
let currentPath = ['/'];
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
  const promptSpan = document.querySelector('.terminal-form .prompt');
  if (!output || !form || !input) return;

  let history = [];
  let historyIndex = history.length;

  updatePrompt(promptSpan);
  appendLine(output, 'Type "help" to see available commands.');
  input.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const command = input.value.trim();
    if (!command) return;
    appendLine(output, command, true, getPrompt());
    history.push(command);
    historyIndex = history.length;
    await handleCommand(command, output, promptSpan);
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

async function handleCommand(command, output, promptSpan) {
  const data = await loadAllData();
  const cmd = command.toLowerCase();
  if (dataLoadError) {
    appendLine(output, 'Warning: Some data could not be loaded. Serve over http(s) for fetch to work.');
    dataLoadError = false;
  }
  switch (cmd) {
    case 'help':
      appendLine(
        output,
        'Commands: ls, cd <dir>, cd .., view <item> [--view], help, clear. Root dirs: papers, projects, people, news, gallery.',
      );
      break;
    case 'ls':
      listCurrent(output, data);
      break;
    case 'cd ..':
    case 'cd..':
      changeDir('..', output, promptSpan);
      break;
    case 'clear':
      output.innerHTML = '';
      break;
    case 'news':
      changeDir('news', output, promptSpan);
      listCurrent(output, data);
      break;
    case 'projects':
      changeDir('projects', output, promptSpan);
      listCurrent(output, data);
      break;
    case 'people':
      changeDir('people', output, promptSpan);
      listCurrent(output, data);
      break;
    case 'papers':
      changeDir('papers', output, promptSpan);
      listCurrent(output, data);
      break;
    case 'gallery':
      changeDir('gallery', output, promptSpan);
      listCurrent(output, data);
      break;
    default:
      if (cmd.startsWith('cd ')) {
        const target = command.slice(3).trim();
        changeDir(target, output, promptSpan);
        break;
      }
      if (cmd.startsWith('view ') || cmd.endsWith('--view')) {
        const clean = command.replace('--view', '').trim();
        const parts = clean.split(/\s+/).filter(Boolean);
        parts.shift();
        const target = parts.join(' ');
        handleView(target, data, output);
        break;
      }
      appendLine(output, `Unknown command: ${command}`);
  }
}

function changeDir(target, output, promptSpan) {
  if (!target || target === '.') return;
  if (target === '..') {
    if (currentPath.length > 1) currentPath.pop();
    updatePrompt(promptSpan);
    listCurrent(output, cachedData || {});
    return;
  }
  if (target === '/') {
    currentPath = ['/'];
    updatePrompt(promptSpan);
    listCurrent(output, cachedData || {});
    return;
  }
  const dirs = ['news', 'projects', 'people', 'papers', 'gallery'];
  if (dirs.includes(target.toLowerCase())) {
    currentPath = ['/', target.toLowerCase()];
    updatePrompt(promptSpan);
    listCurrent(output, cachedData || {});
  } else {
    appendLine(output, `No such directory: ${target}`);
  }
}

function listCurrent(output, data) {
  const dir = currentPath[currentPath.length - 1];
  switch (dir) {
    case '/':
      appendLine(output, 'news/  projects/  people/  papers/  gallery/');
      break;
    case 'news':
      if (!data.news?.length) appendLine(output, 'No news items yet.');
      data.news?.forEach((item, idx) =>
        appendLine(output, `${idx + 1}. ${formatDate(item.date)} — ${item.title || ''}`),
      );
      break;
    case 'projects':
      if (!data.projects?.length) appendLine(output, 'No projects yet.');
      data.projects?.forEach((p, idx) =>
        appendLine(output, `${idx + 1}. ${p.title || 'Untitled'} — ${p.summary || ''}`),
      );
      break;
    case 'people':
      if (!data.people?.length) appendLine(output, 'No people yet.');
      data.people?.forEach((p, idx) =>
        appendLine(output, `${idx + 1}. ${p.name || ''} [${p.role || ''}] — ${p.bio || ''}`),
      );
      break;
    case 'papers':
      if (!data.papers?.length) appendLine(output, 'No papers yet.');
      data.papers?.forEach((p, idx) =>
        appendLine(output, `${idx + 1}. ${p.title || ''} — ${p.authors || ''} (${p.year || ''})`),
      );
      break;
    case 'gallery':
      if (!data.gallery?.length) appendLine(output, 'No gallery items yet.');
      data.gallery?.forEach((g, idx) =>
        appendLine(output, `${idx + 1}. ${g.title || 'Untitled'} — ${g.caption || ''}`),
      );
      break;
    default:
      appendLine(output, `Unknown path: ${dir}`);
  }
}

function handleView(target, data, output) {
  if (!target) {
    appendLine(output, 'Specify an item to view.');
    return;
  }
  const dir = currentPath[currentPath.length - 1];
  const openLink = (href) => {
    if (!href) {
      appendLine(output, 'No link available.');
      return;
    }
    window.location.href = href;
  };

  if (dir === '/') {
    const pageLinks = {
      news: 'news.html',
      projects: 'projects.html',
      people: 'people.html',
      papers: 'papers.html',
      gallery: 'gallery.html',
    };
    const key = target.toLowerCase();
    if (pageLinks[key]) openLink(pageLinks[key]);
    else appendLine(output, `No such item: ${target}`);
    return;
  }

  const index = parseInt(target, 10);
  const isIndex = !Number.isNaN(index);

  switch (dir) {
    case 'news': {
      const item = isIndex
        ? data.news?.[index - 1]
        : data.news?.find((n) => (n.title || '').toLowerCase().includes(target.toLowerCase()));
      if (!item) return appendLine(output, 'Item not found.');
      openLink(item.link || 'news.html');
      break;
    }
    case 'projects': {
      const item = isIndex
        ? data.projects?.[index - 1]
        : data.projects?.find((p) => (p.title || '').toLowerCase().includes(target.toLowerCase()));
      if (!item) return appendLine(output, 'Item not found.');
      openLink(item.link || 'projects.html');
      break;
    }
    case 'people': {
      const item = isIndex
        ? data.people?.[index - 1]
        : data.people?.find((p) => (p.name || '').toLowerCase().includes(target.toLowerCase()));
      if (!item) return appendLine(output, 'Item not found.');
      openLink(item.link || 'people.html');
      break;
    }
    case 'papers': {
      const item = isIndex
        ? data.papers?.[index - 1]
        : data.papers?.find((p) => (p.title || '').toLowerCase().includes(target.toLowerCase()));
      if (!item) return appendLine(output, 'Item not found.');
      openLink(item.url || 'papers.html');
      break;
    }
    case 'gallery': {
      const item = isIndex
        ? data.gallery?.[index - 1]
        : data.gallery?.find((g) => (g.title || '').toLowerCase().includes(target.toLowerCase()));
      if (!item) return appendLine(output, 'Item not found.');
      openLink(item.image || 'gallery.html');
      break;
    }
    default:
      appendLine(output, 'Cannot view item here.');
  }
}

function appendLine(output, text, isCommand = false, promptText = '$') {
  const line = document.createElement('div');
  line.className = 'terminal-line';
  if (isCommand) {
    line.innerHTML = `<span class="prompt">${escapeHTML(promptText)}</span>${escapeHTML(text)}`;
  } else {
    line.innerHTML = escapeHTML(text);
  }
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function updatePrompt(span) {
  if (!span) return;
  span.textContent = getPrompt();
}

function getPrompt() {
  const suffix = currentPath.length === 1 ? '/' : '/' + currentPath.slice(1).join('/');
  return `${suffix} $`;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
