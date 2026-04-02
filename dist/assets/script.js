document.addEventListener('DOMContentLoaded', () => {
  initNav();
  fillYear();
  renderHeroNews();
  renderNews();
  renderProjects();
  renderPeople();
  renderPapers();
  renderDetailPage();
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

async function loadText(path, fallback = '') {
  try {
    const res = await fetch(path);
    if (!res.ok) return fallback;
    return await res.text();
  } catch (err) {
    console.warn(`Could not load ${path}`, err);
    dataLoadError = true;
    return fallback;
  }
}

let cachedData = null;
let dataLoadError = false;
let currentPath = ['/'];
const rootDirs = ['news', 'projects', 'people', 'publications'];
const terminalCommands = ['help', 'man', 'ls', 'cd', 'view', 'cat', 'clear', 'news', 'projects', 'people', 'publications', 'papers'];
const defaultLabIntro = [
  'Our primary focus is on the intersection of AI and security, exploring how artificial intelligence can both enhance and threaten cybersecurity.',
  'The lab intends to develop tools to enhance security and privacy measures using AI, while also investigating potential vulnerabilities introduced by AI systems.',
];
const manualPages = {
  help: {
    name: 'help - show quick command summary',
    synopsis: ['help'],
    description: [
      'Prints available commands and root directories.',
      'Also includes shortcuts for history navigation and tab autocomplete.',
    ],
    examples: ['help'],
  },
  man: {
    name: 'man - display manual pages',
    synopsis: ['man <command>', 'man'],
    description: ['Shows usage details for a terminal command.', 'Without arguments, lists available manual pages.'],
    examples: ['man view', 'man cd'],
  },
  ls: {
    name: 'ls - list items in the current directory',
    synopsis: ['ls'],
    description: ['Lists available entries in the active terminal directory.'],
    examples: ['ls'],
  },
  cd: {
    name: 'cd - change terminal directory',
    synopsis: ['cd <dir>', 'cd ..', 'cd /'],
    description: [
      'Changes the active terminal directory.',
      'Valid root directories: news, projects, people, publications.',
    ],
    examples: ['cd people/', 'cd publications/', 'cd ..'],
  },
  view: {
    name: 'view - print item details from the current directory',
    synopsis: ['view <index|name>', 'view <index|name> --link'],
    description: ['Prints the selected item in terminal format.', 'With --link, opens the corresponding detail page after printing.'],
    examples: ['view 1', 'view Exploiting HDMI', 'view 2 --link'],
  },
  cat: {
    name: 'cat - alias of view',
    synopsis: ['cat <index|name>', 'cat <index|name> --link'],
    description: ['Same behavior as view.'],
    examples: ['cat 1', 'cat 1 --link'],
  },
  clear: {
    name: 'clear - clear terminal output',
    synopsis: ['clear'],
    description: ['Clears all output lines in the terminal window.'],
    examples: ['clear'],
  },
  news: {
    name: 'news - jump to /news and list entries',
    synopsis: ['news'],
    description: ['Shortcut for changing directory to /news and running ls.'],
    examples: ['news'],
  },
  projects: {
    name: 'projects - jump to /projects and list entries',
    synopsis: ['projects'],
    description: ['Shortcut for changing directory to /projects and running ls.'],
    examples: ['projects'],
  },
  people: {
    name: 'people - jump to /people and list entries',
    synopsis: ['people'],
    description: ['Shortcut for changing directory to /people and running ls.'],
    examples: ['people'],
  },
  publications: {
    name: 'publications - jump to /publications and list entries',
    synopsis: ['publications', 'papers'],
    description: ['Shortcut for changing directory to /publications and running ls.', 'papers is an alias of publications.'],
    examples: ['publications', 'papers'],
  },
};
async function loadAllData() {
  if (cachedData) return cachedData;
  const [news, projects, people, papers] = await Promise.all([
    loadJSON('data/news.json'),
    loadJSON('data/projects.json'),
    loadJSON('data/people.json'),
    loadBibPapers(),
  ]);
  cachedData = { news, projects, people, papers };
  return cachedData;
}

async function renderHeroNews() {
  const target = document.querySelector('[data-hero-news]');
  if (!target) return;
  if (shouldUsePrerenderedContent(target)) return;
  const { news } = await loadAllData();
  if (!news.length) {
    target.innerHTML = '<p class="muted">Add items to data/news.json to see them here.</p>';
    return;
  }
  target.innerHTML = news
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

async function renderNews() {
  const target = document.querySelector('[data-news-list]');
  if (!target) return;
  if (shouldUsePrerenderedContent(target)) return;
  const { news } = await loadAllData();
  if (!news.length) {
    target.innerHTML = '<p class="muted">Add items to data/news.json to see them here.</p>';
    return;
  }
  target.innerHTML = news
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

async function renderProjects() {
  const target = document.querySelector('[data-projects-list]');
  if (!target) return;
  if (shouldUsePrerenderedContent(target)) return;
  const { projects } = await loadAllData();
  if (!projects.length) {
    target.innerHTML = '<p class="muted">Add projects to data/projects.json to see them here.</p>';
    return;
  }
  target.innerHTML = projects
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

async function renderPeople() {
  const target = document.querySelector('[data-people-list]');
  if (!target) return;
  if (shouldUsePrerenderedContent(target)) return;
  const { people } = await loadAllData();
  if (!people.length) {
    target.innerHTML = '<p class="muted">Add members to data/people.json to see them here.</p>';
    return;
  }
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

  target.innerHTML = `<div class="people-rows">${sections.join('')}</div>`;
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

async function renderPapers() {
  const target = document.querySelector('[data-papers-list]');
  if (!target) return;
  if (shouldUsePrerenderedContent(target)) return;
  const { papers } = await loadAllData();
  if (!papers.length) {
    target.innerHTML = '<p class="muted">Add numbered .bib files in the papers/ folder (1.bib, 2.bib, ...).</p>';
    return;
  }
  target.innerHTML = papers
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

async function renderDetailPage() {
  const target = document.querySelector('[data-detail-content]');
  if (!target) return;

  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') || '').toLowerCase();
  const id = parseInt(params.get('id') || '', 10);
  const data = await loadAllData();
  const collections = {
    news: data.news || [],
    projects: data.projects || [],
    people: data.people || [],
    publications: data.papers || [],
    papers: data.papers || [],
  };
  const list = collections[type];

  if (!list) {
    target.innerHTML = '<div class="panel"><p class="muted">Unknown detail type.</p></div>';
    return;
  }
  const index = Number.isInteger(id) ? id - 1 : -1;
  const item = list[index];
  if (!item) {
    target.innerHTML = '<div class="panel"><p class="muted">Item not found.</p></div>';
    return;
  }

  target.innerHTML = await renderDetailItem(type, item, data);
  initDetailSliders(target);
}

async function renderDetailItem(type, item, data = {}) {
  const backPage = type === 'publications' || type === 'papers' ? 'papers.html' : `${type}.html`;
  switch (type) {
    case 'news':
      return `
        <div class="panel detail-panel">
          <a class="text-link" href="${backPage}">← Back to News</a>
          <h1>${item.title || 'Untitled update'}</h1>
          <div class="detail-meta">${formatDate(item.date)}</div>
          ${renderDetailSlider(item, 'News image')}
          <p>${item.summary || 'No summary provided.'}</p>
          ${item.link ? `<div class="cta-row"><a class="text-link" href="${item.link}" target="_blank" rel="noopener">Source link</a></div>` : ''}
        </div>
      `;
    case 'projects':
      return `
        <div class="panel detail-panel">
          <a class="text-link" href="${backPage}">← Back to Projects</a>
          <h1>${item.title || 'Untitled project'}</h1>
          ${renderDetailSlider(item, 'Project image')}
          <p>${item.summary || 'No summary provided.'}</p>
          ${renderTags(item.tags)}
          ${renderResourceLinksFromObject(item, ['publications', 'poster', 'presentation', 'slides', 'code', 'dataset'])}
          ${item.link ? `<div class="cta-row"><a class="text-link" href="${item.link}" target="_blank" rel="noopener">Project link</a></div>` : ''}
        </div>
      `;
    case 'people':
      {
        const profileBox = await renderPeopleProfilesBox(item);
        const interestsBox = renderPeopleInterestsBox(item.focus);
        const publicationsBox = renderPeoplePublicationsBox(item, data.papers || []);
        const personPhoto = item.image
          ? `<div class="person-detail-photo photo" style="background-image:url('${escapeAttr(item.image)}')"></div>`
          : `<div class="person-detail-photo person-detail-photo-fallback">${escapeHTML(getInitials(item.name))}</div>`;
      return `
        <div class="panel detail-panel detail-panel-person">
          <a class="text-link" href="${backPage}">← Back to People</a>
          <div class="person-detail-hero">
            <div class="person-detail-main">
              <h1>${item.name || 'Unnamed person'}</h1>
              <div class="detail-meta">${item.role || ''}</div>
              <p>${item.bio || 'No bio provided.'}</p>
            </div>
            ${personPhoto}
          </div>
          ${interestsBox}
          ${profileBox}
          ${publicationsBox}
        </div>
      `;
      }
    case 'publications':
    case 'papers': {
      const logo = item.image
        ? `<div class="publication-logo-wrap"><img class="publication-logo" src="${escapeAttr(item.image)}" alt="Publication venue logo" loading="lazy" /></div>`
        : '';
      return `
        <div class="panel detail-panel${logo ? ' has-publication-logo' : ''}">
          <a class="text-link" href="${backPage}">← Back to Publications</a>
          ${logo}
          <h1>${item.title || 'Untitled publication'}</h1>
          ${renderPublicationFields(item)}
          ${renderPublicationBottomBubbles(item)}
        </div>
      `;
    }
    default:
      return '<div class="panel"><p class="muted">Item not found.</p></div>';
  }
}

function renderPeopleInterestsBox(focus) {
  const interests = Array.isArray(focus) ? focus.filter(Boolean) : [];
  if (!interests.length) return '';
  const chips = interests.map((entry) => `<span class="bubble-chip">${escapeHTML(String(entry))}</span>`).join('');
  return `
    <section class="detail-box">
      <h3 class="detail-box-title">Research Interests</h3>
      <div class="bubble-links">${chips}</div>
    </section>
  `;
}

async function renderPeopleProfilesBox(item) {
  const profileEntries = [
    { key: 'cv', label: 'CV' },
    { key: 'googleScholar', label: 'Google Scholar' },
    { key: 'github', label: 'GitHub' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'researchGate', label: 'ResearchGate' },
    { key: 'scopus', label: 'Scopus' },
    { key: 'orcid', label: 'ORCID' },
    { key: 'link', label: 'Profile' },
  ];

  const links = [];
  for (const { key, label } of profileEntries) {
    const entries = normalizeResourceEntries(item?.[key]);
    for (let idx = 0; idx < entries.length; idx += 1) {
      const entry = entries[idx];
      const href = normalizeExternalUrl(entry.href);
      if (!href) continue;
      if (key === 'cv') {
        if (/\/$/.test(href)) continue;
        const exists = await linkExists(href);
        if (!exists) continue;
      }
      const suffix = entries.length > 1 ? ` ${idx + 1}` : '';
      links.push(
        `<a class="bubble-link" href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHTML(label + suffix)}</a>`,
      );
    }
  }

  if (!links.length) return '';
  return `
    <section class="detail-box">
      <h3 class="detail-box-title">Profiles</h3>
      <div class="bubble-links">${links.join('')}</div>
    </section>
  `;
}

const linkExistsCache = new Map();

async function linkExists(href) {
  if (!href) return false;
  if (linkExistsCache.has(href)) return linkExistsCache.get(href);
  const isExternal = /^(https?:)?\/\//i.test(href);
  if (isExternal) {
    linkExistsCache.set(href, true);
    return true;
  }

  const check = fetch(href, { method: 'HEAD' })
    .then(async (res) => {
      if (res.ok) return true;
      if (res.status === 405 || res.status === 501 || res.status === 403) {
        try {
          const fallback = await fetch(href, { method: 'GET' });
          return fallback.ok;
        } catch {
          return false;
        }
      }
      return false;
    })
    .catch(async () => {
      try {
        const fallback = await fetch(href, { method: 'GET' });
        return fallback.ok;
      } catch {
        return false;
      }
    });
  linkExistsCache.set(href, check);
  return check;
}

function renderPeoplePublicationsBox(person, papers) {
  const matches = findPublicationsByPerson(person, papers);
  const items = matches
    .map((paper) => {
      const title = String(paper.title || 'Untitled publication').trim();
      const href = getDetailLink('publications', paper._detailId);
      return `<li><a class="text-link" href="${href}">${escapeHTML(title)}</a></li>`;
    })
    .join('');

  return `
    <section class="detail-box">
      <h3 class="detail-box-title">Publications</h3>
      ${items ? `<ul class="people-publication-list">${items}</ul>` : '<span class="muted">No matching publications found.</span>'}
    </section>
  `;
}

function renderPublicationBottomBubbles(item) {
  const links = [
    { label: 'Publication', href: normalizeExternalUrl(item?.url) },
    { label: 'PDF', href: normalizeExternalUrl(item?.fields?.pdf) },
    { label: 'Poster', href: normalizeExternalUrl(item?.fields?.poster) },
    { label: 'Slides', href: normalizeExternalUrl(item?.fields?.slides) },
  ].filter((entry) => entry.href);

  if (!links.length) return '';
  const bubbles = links
    .map(
      (entry) =>
        `<a class="bubble-link" href="${escapeAttr(entry.href)}" target="_blank" rel="noopener">${escapeHTML(entry.label)}</a>`,
    )
    .join('');

  return `
    <section class="detail-box">
      <h3 class="detail-box-title">Links</h3>
      <div class="bubble-links">${bubbles}</div>
    </section>
  `;
}

function findPublicationsByPerson(person, papers) {
  if (!person || !person.name || !Array.isArray(papers)) return [];
  const personNameNorm = normalizeAuthorName(person.name);
  const personTokens = personNameNorm.split(' ').filter((token) => token.length > 1);
  const firstToken = personTokens[0] || '';
  const lastToken = personTokens[personTokens.length - 1] || '';

  return papers
    .map((paper, idx) => ({ ...paper, _detailId: idx + 1 }))
    .filter((paper) => {
      const authorText = normalizeAuthorName(paper?.fields?.author || paper?.authors || '');
      if (!authorText) return false;
      if (authorText.includes(personNameNorm)) return true;
      if (personTokens.length === 1) return authorText.includes(personTokens[0]);
      if (!authorText.includes(lastToken)) return false;
      if (firstToken && authorText.includes(firstToken)) return true;
      if (firstToken && authorText.includes(firstToken[0])) return true;
      return false;
    });
}

function normalizeAuthorName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPublicationDisplayData(item) {
  const fields = item.fields && typeof item.fields === 'object' ? item.fields : {};
  const venue = fields.booktitle || fields.journal || item.venue || '';
  const year = fields.year || item.year || '';
  const allFields = {
    entrytype: item.entryType || '',
    citationkey: item.citationKey || '',
    ...fields,
  };

  const hiddenKeys = new Set([
    'entrytype',
    'citationkey',
    'eprint',
    'primaryclass',
    // Already shown in the fixed header block.
    'title',
    'author',
    'booktitle',
    'journal',
    'year',
    'month',
    'image',
    'pages',
    'address',
    'pdf',
    'poster',
    'url',
  ]);

  const preferredOrder = [
    'editor',
    'volume',
    'number',
    'publisher',
    'location',
    'series',
    'doi',
    'abstract',
    'keywords',
    'isbn',
    'issn',
    'numpages',
    'archiveprefix',
  ];

  const fixedRows = [
    item.authors ? { label: 'Authors', value: item.authors } : null,
    venue ? { label: 'Journal/Conference', value: venue } : null,
    year ? { label: 'Year', value: year } : null,
  ]
    .filter(Boolean);

  const remaining = Object.keys(allFields)
    .filter((key) => !preferredOrder.includes(key) && !hiddenKeys.has(key))
    .sort();
  const orderedKeys = [...preferredOrder, ...remaining]
    .filter((key, idx, arr) => arr.indexOf(key) === idx)
    .filter((key) => !hiddenKeys.has(key));

  const fieldRows = orderedKeys
    .filter((key) => allFields[key])
    .map((key) => ({
      key,
      label: prettyBibKey(key),
      value: String(allFields[key]).trim(),
    }));

  return { fixedRows, fieldRows };
}

function renderPublicationFields(item) {
  const data = getPublicationDisplayData(item);
  const fixedRowsHtml = data.fixedRows
    .map(
      (row) => `
        <div class="bib-field">
          <div class="bib-key">${escapeHTML(row.label)}</div>
          <div class="bib-value">${escapeHTML(row.value)}</div>
        </div>
      `,
    )
    .join('');

  const rowsHtml = data.fieldRows
    .map((row) => {
      const valueHtml = formatBibValue(row.key, row.value);
      return `
        <div class="bib-field">
          <div class="bib-key">${escapeHTML(row.label)}</div>
          <div class="bib-value">${valueHtml}</div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="bib-fields">
      ${fixedRowsHtml}${rowsHtml || (!fixedRowsHtml ? '<div class="bib-empty">No BibTeX fields found.</div>' : '')}
    </div>
  `;
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

function renderDetailSlider(item, altBase) {
  const images = getImageList(item);
  if (!images.length) return '';

  const slides = images
    .map(
      (img, idx) => `
      <img
        class="detail-slider-image${idx === 0 ? ' is-active' : ''}"
        data-slide-image
        src="${escapeAttr(img)}"
        alt="${escapeAttr(`${altBase} ${idx + 1}`)}"
        loading="lazy"
      />
    `,
    )
    .join('');

  if (images.length === 1) {
    return `
      <div class="detail-slider is-single">
        <div class="detail-slider-viewport">${slides}</div>
      </div>
    `;
  }

  const dots = images
    .map(
      (_, idx) => `
      <button
        type="button"
        class="detail-slider-dot${idx === 0 ? ' is-active' : ''}"
        data-slide-dot
        data-slide-index="${idx}"
        aria-label="Go to image ${idx + 1}"
      ></button>
    `,
    )
    .join('');

  return `
    <div class="detail-slider" data-detail-slider>
      <button type="button" class="detail-slider-nav prev" data-slide-prev aria-label="Previous image">‹</button>
      <div class="detail-slider-viewport">${slides}</div>
      <button type="button" class="detail-slider-nav next" data-slide-next aria-label="Next image">›</button>
      <div class="detail-slider-counter" data-slide-counter>1 / ${images.length}</div>
      <div class="detail-slider-dots">${dots}</div>
    </div>
  `;
}

function initDetailSliders(scope = document) {
  const sliders = scope.querySelectorAll('[data-detail-slider]');
  sliders.forEach((slider) => {
    const images = Array.from(slider.querySelectorAll('[data-slide-image]'));
    const prevBtn = slider.querySelector('[data-slide-prev]');
    const nextBtn = slider.querySelector('[data-slide-next]');
    const counter = slider.querySelector('[data-slide-counter]');
    const dots = Array.from(slider.querySelectorAll('[data-slide-dot]'));
    if (images.length < 2) return;

    let current = 0;
    const setCurrent = (next) => {
      const max = images.length;
      current = ((next % max) + max) % max;
      images.forEach((img, idx) => img.classList.toggle('is-active', idx === current));
      dots.forEach((dot, idx) => dot.classList.toggle('is-active', idx === current));
      if (counter) counter.textContent = `${current + 1} / ${max}`;
    };

    prevBtn?.addEventListener('click', () => setCurrent(current - 1));
    nextBtn?.addEventListener('click', () => setCurrent(current + 1));
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-slide-index') || '0', 10);
        if (!Number.isNaN(idx)) setCurrent(idx);
      });
    });

    setCurrent(0);
  });
}

function prettyBibKey(key) {
  if (!key) return '';
  const alias = {
    googleScholar: 'Google Scholar',
    researchGate: 'ResearchGate',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    orcid: 'ORCID',
    scopus: 'Scopus',
  };
  if (alias[key]) return alias[key];
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatBibValue(key, value) {
  if (!value) return '<span class="bib-empty">Not provided</span>';
  const raw = String(value).trim();
  if (!raw) return '<span class="bib-empty">Not provided</span>';

  if (key === 'author') {
    return escapeHTML(formatAuthors(raw));
  }

  if (key === 'doi') {
    const normalized = raw.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').trim();
    const href = normalized ? `https://doi.org/${normalized}` : '';
    if (href) {
      return `<a class="text-link" href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHTML(raw)}</a>`;
    }
  }

  if (['url', 'image', 'pdf', 'poster', 'presentation', 'slides', 'code', 'dataset', 'publications'].includes(key)) {
    const href = normalizeExternalUrl(raw);
    if (href) {
      return `<a class="text-link" href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHTML(raw)}</a>`;
    }
  }

  return escapeHTML(raw);
}

function normalizeExternalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:)?\/\//i.test(raw)) return raw.startsWith('//') ? `https:${raw}` : raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return raw;
}

function renderResourceLinksFromObject(source, keys = []) {
  if (!source || typeof source !== 'object' || !keys.length) return '';

  const rows = keys
    .map((key) => {
      const links = normalizeResourceEntries(source[key]);
      if (!links.length) return '';
      const linksHtml = links
        .map((link) => {
          const href = normalizeExternalUrl(link.href);
          if (!href) return '';
          return `<a class="text-link resource-link" href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHTML(link.text)}</a>`;
        })
        .filter(Boolean)
        .join('');
      if (!linksHtml) return '';
      return `
        <div class="resource-row">
          <span class="resource-label">${escapeHTML(prettyBibKey(key))}:</span>
          <span class="resource-links">${linksHtml}</span>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');

  if (!rows) return '';
  return `<div class="detail-resources">${rows}</div>`;
}

function normalizeResourceEntries(value) {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeResourceEntries(item))
      .filter((entry) => entry && entry.href);
  }

  if (typeof value === 'object') {
    const href = value.url || value.link || value.href || '';
    const label = value.title || value.label || '';
    if (!href) return [];
    return [{ href: String(href).trim(), text: String(label || href).trim() }];
  }

  const raw = String(value).trim();
  if (!raw) return [];
  const parts = raw.split(/\s*;\s*/).filter(Boolean);
  return parts.map((part) => ({
    href: part,
    text: part.replace(/^https?:\/\//i, ''),
  }));
}

async function loadBibPapers() {
  const items = [];
  for (let i = 1; i <= 200; i++) {
    const path = `papers/${i}.bib`;
    let res;
    try {
      res = await fetch(path);
    } catch (err) {
      console.warn(`Could not load ${path}`, err);
      dataLoadError = true;
      break;
    }
    if (!res.ok) break;
    const text = await res.text();
    const parsed = parseBib(text);
    if (parsed) items.push(parsed);
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

function shouldUsePrerenderedContent(target) {
  return window.location.protocol === 'file:' && Boolean(target?.innerHTML.trim());
}

function initTerminal() {
  const panel = document.querySelector('.terminal-panel');
  const output = document.querySelector('[data-terminal-output]');
  const form = document.querySelector('[data-terminal-form]');
  const input = document.querySelector('[data-terminal-input]');
  const promptSpan = document.querySelector('[data-terminal-prompt]');
  const promptHeader = document.querySelector('[data-terminal-prompt-header]');
  if (!output || !form || !input || !promptSpan) return;

  let history = [];
  let historyIndex = history.length;
  let draftInput = '';

  renderPromptHeader(promptHeader);
  initTerminalWindowControls(panel);
  updatePrompt(promptSpan);
  syncKaliCursor(form, input, promptSpan);
  renderTerminalWelcome(output);
  input.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const command = input.value.trim();
    if (!command) return;
    appendLine(output, command, true, getPrompt());
    if (!history.length || history[history.length - 1] !== command) history.push(command);
    historyIndex = history.length;
    draftInput = '';
    await handleCommand(command, output, promptSpan);
    input.value = '';
    syncKaliCursor(form, input, promptSpan);
  });

  input.addEventListener('input', () => syncKaliCursor(form, input, promptSpan));
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      let data = cachedData;
      if (!data) {
        try {
          data = await loadAllData();
        } catch {
          data = { news: [], projects: [], people: [], papers: [] };
        }
      }
      const completed = autocompleteCommand(input.value, data);
      input.value = completed;
      syncKaliCursor(form, input, promptSpan);
      return;
    }

    if (e.key === 'ArrowUp') {
      if (!history.length) return;
      if (historyIndex >= history.length) draftInput = input.value;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] || '';
      syncKaliCursor(form, input, promptSpan);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (!history.length) return;
      if (historyIndex < history.length - 1) {
        historyIndex += 1;
        input.value = history[historyIndex] || '';
      } else {
        historyIndex = history.length;
        input.value = draftInput;
      }
      syncKaliCursor(form, input, promptSpan);
      e.preventDefault();
    }
  });
}

async function renderTerminalWelcome(output) {
  appendStyledLine(output, '<span class="terminal-banner terminal-green">Welcome to AiSec Lab at University of Dayton</span>');

  const introText = await loadText('data/lab-intro.txt', defaultLabIntro.join('\n'));
  const lines = introText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  for (const line of lines) {
    await appendTypewriterLine(output, line, 'terminal-orange');
  }

  appendStyledLine(output, '<span class="terminal-red">Type help to get started.</span>');
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
      printHelp(output);
      break;
    case 'man':
      printMan(output);
      break;
    case 'ls':
      listCurrent(output, data);
      break;
    case 'cd':
      appendLine(output, 'cd: missing parameter.');
      appendLine(output, 'Usage: cd <dir>');
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
    case 'publications':
    case 'papers':
      changeDir('publications', output, promptSpan);
      listCurrent(output, data);
      break;
    default:
      if (cmd.startsWith('man ')) {
        const topic = command.slice(4).trim().split(/\s+/)[0] || '';
        printMan(output, topic);
        break;
      }
      if (cmd.startsWith('cd ')) {
        const target = command.slice(3).trim();
        changeDir(target, output, promptSpan);
        break;
      }
      {
        const openAfterPrint = /\s--link\s*$/i.test(command.trim());
        const clean = command.replace(/\s--link\s*$/i, '').trim();
        const parts = clean.split(/\s+/).filter(Boolean);
        const verb = (parts[0] || '').toLowerCase();
        if (verb === 'view' || verb === 'cat') {
          parts.shift();
          const target = parts.join(' ');
          handleView(target, data, output, openAfterPrint);
          break;
        }
      }
      if (handleDummyTerminalCommand(command, output)) break;
      appendLine(output, `Not supported: ${command}`);
  }
}

function handleDummyTerminalCommand(command, output) {
  const raw = command.trim();
  const cmd = raw.toLowerCase();
  const dir = currentPath[currentPath.length - 1];
  const fakePwd = dir === '/' ? '/home/visitor/aiseclab' : `/home/visitor/aiseclab/${dir}`;

  if (cmd === 'pwd') {
    appendLine(output, fakePwd);
    appendLine(output, 'Yep, same path as your productivity spiral.');
    return true;
  }

  if (cmd === 'whoami') {
    appendLine(output, 'visitor');
    appendLine(output, 'Root is on vacation, indefinitely.');
    return true;
  }

  if (cmd === 'uname') {
    appendLine(output, 'Linux');
    appendLine(output, 'Definitely Linux, emotionally also Linux.');
    return true;
  }

  if (cmd === 'uname -a') {
    appendLine(output, 'Linux aiseclab 6.8.0-demo #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux');
    appendLine(output, 'This kernel is 80% imagination, 20% terminal cosplay.');
    return true;
  }

  if (cmd === 'date') {
    appendLine(output, new Date().toString());
    appendLine(output, 'Time flies, especially during debugging.');
    return true;
  }

  if (cmd === 'cat /etc/os-release') {
    appendLine(output, 'NAME="Ubuntu"');
    appendLine(output, 'VERSION="24.04 LTS (Noble Numbat)"');
    appendLine(output, 'ID=ubuntu');
    appendLine(output, 'PRETTY_NAME="Ubuntu 24.04 LTS"');
    appendLine(output, 'This distro is so stable even typos feel permanent.');
    return true;
  }

  if (cmd.startsWith('echo ')) {
    appendLine(output, raw.slice(5));
    appendLine(output, 'Finally, a command that always agrees with you.');
    return true;
  }

  if (cmd.startsWith('mkdir ') || cmd.startsWith('touch ') || cmd.startsWith('rm ') || cmd.startsWith('cp ') || cmd.startsWith('mv ')) {
    appendLine(output, 'Demo mode: filesystem-changing commands are simulated only.');
    appendLine(output, 'Your files are safe from both accidents and ambition.');
    return true;
  }

  return false;
}

function printHelp(output) {
  const dir = currentPath[currentPath.length - 1];
  if (dir === '/') {
    appendLine(output, 'Commands: man, ls, cd <dir>, cd .., help, clear');
    appendLine(output, 'Root dirs:');
    rootDirs.forEach((entry) => appendStyledLine(output, `<span class="terminal-green">/${escapeHTML(entry)}</span>`));
    appendLine(output, 'Tip: use "cd <dir>" to enter a section, then "ls" to list its items.');
  } else {
    appendLine(output, 'Commands: man, ls, cd .., view <index|name> [--link], cat <index|name> [--link], help, clear');
    appendLine(output, `Current dir: /${dir}`);
    appendLine(output, 'View usage: view <index|name> [--link]');
    appendLine(output, 'Examples: view 1, view "LocalMind", view 2 --link');
    appendLine(output, 'Tip: use "view <index|name>" or "cat <index|name>" to print details, or add "--link" to open the link.');
  }
  appendLine(output, 'Manuals: use "man <command>" to view command documentation.');
  appendLine(output, 'History: use ↑ and ↓ to browse previous commands.');
  appendLine(output, 'Autocomplete: press Tab to complete commands, dirs, and item names.');
}

function printMan(output, topic = '') {
  const clean = String(topic || '').trim().toLowerCase().replace(/\/+$/, '');
  const key = clean === 'papers' ? 'publications' : clean;

  if (!key) {
    appendLine(output, 'MAN(1)');
    appendLine(output, '');
    appendLine(output, 'NAME');
    appendLine(output, '    man - display manual pages');
    appendLine(output, '');
    appendLine(output, 'SYNOPSIS');
    appendLine(output, '    man <command>');
    appendLine(output, '');
    appendLine(output, 'AVAILABLE PAGES');
    appendLine(output, `    ${Object.keys(manualPages).join(', ')}`);
    return;
  }

  const page = manualPages[key];
  if (!page) {
    appendLine(output, `No manual entry for ${topic}.`);
    appendLine(output, 'Try: man help');
    return;
  }

  appendLine(output, `${key.toUpperCase()}(1)`);
  appendLine(output, '');
  appendLine(output, 'NAME');
  appendLine(output, `    ${page.name}`);
  appendLine(output, '');
  appendLine(output, 'SYNOPSIS');
  page.synopsis.forEach((line) => appendLine(output, `    ${line}`));
  appendLine(output, '');
  appendLine(output, 'DESCRIPTION');
  page.description.forEach((line) => appendLine(output, `    ${line}`));
  if (page.examples?.length) {
    appendLine(output, '');
    appendLine(output, 'EXAMPLES');
    page.examples.forEach((line) => appendLine(output, `    ${line}`));
  }
}

function changeDir(target, output, promptSpan) {
  if (!target || target === '.') return;
  const clean = normalizePath(target);
  if (clean === '..') {
    if (currentPath.length > 1) currentPath.pop();
    updatePrompt(promptSpan);
    return;
  }
  if (clean === '/') {
    currentPath = ['/'];
    updatePrompt(promptSpan);
    return;
  }
  const normalizedTarget = clean.toLowerCase() === 'papers' ? 'publications' : clean.toLowerCase();
  if (rootDirs.includes(normalizedTarget)) {
    currentPath = ['/', normalizedTarget];
    updatePrompt(promptSpan);
  } else {
    appendLine(output, `No such directory: ${target}`);
  }
}

function listCurrent(output, data) {
  const dir = currentPath[currentPath.length - 1];
  switch (dir) {
    case '/':
      appendLine(output, 'news/  projects/  people/  publications/');
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
    case 'publications':
    case 'papers':
      if (!data.papers?.length) appendLine(output, 'No publications yet.');
      data.papers?.forEach((p, idx) =>
        appendLine(output, `${idx + 1}. ${p.title || ''} — ${p.authors || ''} (${p.year || ''})`),
      );
      break;
    default:
      appendLine(output, `Unknown path: ${dir}`);
  }
}

function handleView(target, data, output, openAfterPrint = false) {
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
      publications: 'papers.html',
      papers: 'papers.html',
    };
    const key = target.toLowerCase().replace(/\/+$/, '');
    if (pageLinks[key]) openLink(pageLinks[key]);
    else appendLine(output, `No such item: ${target}`);
    return;
  }

  const index = parseInt(target, 10);
  const isIndex = !Number.isNaN(index);

  switch (dir) {
    case 'news': {
      const itemIndex = isIndex
        ? index - 1
        : (data.news || []).findIndex((n) => (n.title || '').toLowerCase().includes(target.toLowerCase()));
      const item = itemIndex >= 0 ? data.news?.[itemIndex] : undefined;
      if (!item) return appendLine(output, 'Item not found.');
      const detailLink = getDetailLink('news', itemIndex + 1);
      printEntry(output, {
        title: item.title || 'Untitled update',
        body: item.summary || 'No summary provided.',
        meta: item.date ? `Date: ${formatDate(item.date)}` : '',
        link: detailLink,
      });
      if (openAfterPrint) openLink(detailLink);
      break;
    }
    case 'projects': {
      const itemIndex = isIndex
        ? index - 1
        : (data.projects || []).findIndex((p) => (p.title || '').toLowerCase().includes(target.toLowerCase()));
      const item = itemIndex >= 0 ? data.projects?.[itemIndex] : undefined;
      if (!item) return appendLine(output, 'Item not found.');
      const detailLink = getDetailLink('projects', itemIndex + 1);
      printEntry(output, {
        title: item.title || 'Untitled project',
        body: item.summary || 'No summary provided.',
        meta: item.tags?.length ? `Tags: ${item.tags.join(', ')}` : '',
        link: detailLink,
      });
      if (openAfterPrint) openLink(detailLink);
      break;
    }
    case 'people': {
      const itemIndex = isIndex
        ? index - 1
        : (data.people || []).findIndex((p) => (p.name || '').toLowerCase().includes(target.toLowerCase()));
      const item = itemIndex >= 0 ? data.people?.[itemIndex] : undefined;
      if (!item) return appendLine(output, 'Item not found.');
      const detailLink = getDetailLink('people', itemIndex + 1);
      printEntry(output, {
        title: item.name || 'Unnamed person',
        body: item.bio || 'No bio provided.',
        meta: item.role ? `Role: ${item.role}` : '',
        link: detailLink,
      });
      if (openAfterPrint) openLink(detailLink);
      break;
    }
    case 'publications':
    case 'papers': {
      const itemIndex = isIndex
        ? index - 1
        : (data.papers || []).findIndex((p) => (p.title || '').toLowerCase().includes(target.toLowerCase()));
      const item = itemIndex >= 0 ? data.papers?.[itemIndex] : undefined;
      if (!item) return appendLine(output, 'Item not found.');
      const detailLink = getDetailLink('publications', itemIndex + 1);
      printPublicationEntry(output, item, detailLink);
      if (openAfterPrint) openLink(detailLink);
      break;
    }
    default:
      appendLine(output, 'Cannot view item here.');
  }
}

function printEntry(output, entry) {
  appendLine(output, '________________________________________');
  appendStyledLine(output, `<span class="terminal-green">${escapeHTML(entry.title || 'Untitled')}</span>`);
  appendLine(output, '________________________________________');
  appendLine(output, entry.body || 'No details available.');
  if (entry.meta) appendLine(output, entry.meta);
  if (entry.link) {
    appendStyledLine(
      output,
      `<span class="terminal-orange">Link</span>: <a class="terminal-link" href="${escapeAttr(entry.link)}" target="_blank" rel="noopener">${escapeHTML(entry.link)}</a>`,
    );
  } else {
    appendStyledLine(output, '<span class="terminal-orange">Link</span>: <span class="terminal-green">N/A</span>');
  }
}

function printPublicationEntry(output, item, detailLink) {
  const data = getPublicationDisplayData(item);
  appendLine(output, '________________________________________');
  appendStyledLine(output, `<span class="terminal-green">${escapeHTML(item.title || 'Untitled publication')}</span>`);
  appendLine(output, '________________________________________');

  const rows = [...data.fixedRows, ...data.fieldRows];
  if (!rows.length) {
    appendLine(output, 'No details available.');
  } else {
    rows.forEach((row) => appendLine(output, `${row.label}: ${row.value}`));
  }

  const links = [
    { label: 'Publication', href: normalizeExternalUrl(item?.url) },
    { label: 'PDF', href: normalizeExternalUrl(item?.fields?.pdf) },
    { label: 'Poster', href: normalizeExternalUrl(item?.fields?.poster) },
    { label: 'Slides', href: normalizeExternalUrl(item?.fields?.slides) },
    { label: 'Details', href: detailLink },
  ].filter((entry) => entry.href);

  if (!links.length) {
    appendStyledLine(output, '<span class="terminal-orange">Link</span>: <span class="terminal-green">N/A</span>');
    return;
  }
  links.forEach((entry) => appendTerminalLinkRow(output, entry.label, entry.href));
}

function appendTerminalLinkRow(output, label, href) {
  appendStyledLine(
    output,
    `<span class="terminal-orange">${escapeHTML(label)}</span>: <a class="terminal-link" href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHTML(href)}</a>`,
  );
}

function autocompleteCommand(inputValue, data) {
  const trimmed = inputValue.trim();
  if (!trimmed) return inputValue;
  const parts = trimmed.split(/\s+/);
  const currentDir = currentPath[currentPath.length - 1];
  const last = parts[parts.length - 1];
  const commandWord = (parts[0] || '').toLowerCase();
  const isCd = commandWord === 'cd';
  const isMan = commandWord === 'man';

  if (isCd) {
    const target = parts[1] || '';
    const clean = target.replace(/\/+$/, '');
    if (clean && 'papers'.startsWith(clean.toLowerCase())) {
      parts[1] = 'publications/';
      return parts.join(' ');
    }
    const match = rootDirs.find((d) => d.startsWith(clean.toLowerCase()));
    if (match) {
      parts[1] = match + '/';
      return parts.join(' ');
    }
    return inputValue;
  }

  if (isMan) {
    const target = (parts[1] || '').toLowerCase();
    const topics = Object.keys(manualPages);
    const match = topics.find((page) => page.startsWith(target));
    if (!match) return inputValue;
    parts[1] = match;
    return parts.slice(0, 2).join(' ');
  }

  if (parts.length === 1) {
    const match = [...terminalCommands, ...rootDirs].find((d) => d.startsWith(last.toLowerCase()));
    return match ? match : inputValue;
  }

  const list = (() => {
    switch (currentDir) {
      case 'news':
        return data.news || [];
      case 'projects':
        return data.projects || [];
      case 'people':
        return data.people || [];
      case 'publications':
      case 'papers':
        return data.papers || [];
      default:
        return [];
    }
  })();

  const titles = list
    .map((item, idx) => [`${idx + 1}`, (item.title || item.name || '').toLowerCase()])
    .flat();

  const matchTitle = titles.find((t) => t.startsWith(last.toLowerCase()));
  if (matchTitle) {
    parts[parts.length - 1] = matchTitle;
    return parts.join(' ');
  }

  return inputValue;
}

function appendLine(output, text, isCommand = false, promptText = '$', autoScroll = true) {
  const line = document.createElement('div');
  line.className = 'terminal-line';
  if (isCommand) {
    line.innerHTML = `<span class="prompt">${escapeHTML(promptText)}</span>${escapeHTML(text)}`;
  } else {
    line.innerHTML = escapeHTML(text);
  }
  output.appendChild(line);
  if (autoScroll) scrollTerminal(output);
}

function appendStyledLine(output, html, autoScroll = true) {
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.innerHTML = html;
  output.appendChild(line);
  if (autoScroll) scrollTerminal(output);
}

async function appendTypewriterLine(output, text, className = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${className}`.trim();
  output.appendChild(line);
  for (const ch of text) {
    line.textContent += ch;
    scrollTerminal(output);
    await delay(8);
  }
  await delay(120);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updatePrompt(span) {
  if (!span) return;
  span.textContent = getPrompt();
  const panel = span.closest('.terminal-panel');
  const header = panel?.querySelector('[data-terminal-prompt-header]');
  renderPromptHeader(header);
  const form = span.closest('.terminal-form');
  const input = form?.querySelector('input');
  syncKaliCursor(form, input, span);
}

function getPrompt() {
  return '└─$';
}

function normalizePath(path) {
  if (!path) return '/';
  let clean = path.trim();
  clean = clean.replace(/^\/+/, '');
  clean = clean.replace(/\/+$/, '');
  if (clean === '') return '/';
  if (clean === '..') return '..';
  return clean;
}

function getDetailLink(type, id) {
  return `detail.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
}

function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str = '') {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function syncKaliCursor(form, input, promptSpan) {
  if (!form || !input || !promptSpan) return;
  const promptLength = (promptSpan.textContent || '').length;
  const inputLength = (input.value || '').length;
  const cursorHost = promptSpan.closest('.terminal-input-row') || form;
  cursorHost.style.setProperty('--prompt-ch', `${promptLength}`);
  cursorHost.style.setProperty('--cursor-ch', `${inputLength}`);
}

function renderPromptHeader(headerEl) {
  if (!headerEl) return;
  const dir = currentPath[currentPath.length - 1];
  const home = dir === '/' ? '~' : `~/${dir}`;
  headerEl.innerHTML =
    `<span class="terminal-green">┌──(visitor@aiseclab)-</span><span class="terminal-home">[${escapeHTML(home)}]</span>`;
}

function scrollTerminal(output) {
  const terminalWindow = output?.closest('.terminal-window');
  if (!terminalWindow) return;
  terminalWindow.scrollTop = terminalWindow.scrollHeight;
}

function initTerminalWindowControls(panel) {
  if (!panel) return;
  const maxBtn = panel.querySelector('[data-terminal-maximize]');
  if (!maxBtn) return;

  maxBtn.setAttribute('aria-pressed', 'false');
  maxBtn.addEventListener('click', () => {
    const next = !panel.classList.contains('terminal-panel-maximized');
    panel.classList.toggle('terminal-panel-maximized', next);
    document.body.classList.toggle('terminal-maximized-lock', next);
    maxBtn.setAttribute('aria-pressed', String(next));
    maxBtn.textContent = next ? '❐' : '▢';
    maxBtn.title = next ? 'Restore' : 'Maximize';
  });
}
