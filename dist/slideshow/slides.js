(function () {
  const CONTACT_URL =
    'https://udayton.edu/_resources/contact_form.php?cmsId=76ac207d0a480e99411d8665a6867a10';
  const CONTACT_EMAIL = 'sarefin1[at][universityname].edu';
  const FALLBACK_INTRO =
    'The primary focus of the lab is on the intersection of A.I. and cybersecurity, exploring how artificial intelligence can both enhance and threaten cybersecurity.';
  const FALLBACK_PROJECTS = [
    {
      title: 'LocalMind: OS-Integrated Local LLM Systems',
      summary:
        'LocalMind integrates large language models with operating-system abstractions for secure, privacy-preserving local intelligence.',
      tags: ['Systems', 'LLMs', 'OS Integration', 'Edge AI'],
    },
    {
      title: 'Side-Channel Attacks on Neural Networks',
      summary:
        'This work studies hardware-level leakage in neural network systems with a focus on GPU and peripheral side channels.',
      tags: ['AI Security', 'Side Channels', 'GPU Systems'],
    },
    {
      title: 'VTON: Real-World Virtual Try-On Systems',
      summary:
        'This project develops robust virtual try-on systems with text-guided masking and diffusion-based generation.',
      tags: ['Computer Vision', 'Diffusion Models', 'Applied AI'],
    },
  ];

  window.AiSecSlideshowData = {
    buildSlides,
  };

  async function buildSlides() {
    const [introText, projects] = await Promise.all([
      loadText('../data/lab-intro.txt', FALLBACK_INTRO),
      loadJSON('../data/projects.json', FALLBACK_PROJECTS),
    ]);

    const intro = compactText(introText) || FALLBACK_INTRO;
    const projectList = Array.isArray(projects) && projects.length ? projects : FALLBACK_PROJECTS;

    const slides = [
      {
        title: 'Intro',
        command: './aiseclab --intro',
        duration: 8200,
        lines: [
          { text: intro },
        ],
      },
      {
        title: 'What We Do',
        command: './aiseclab --what-we-do',
        duration: 8600,
        lines: [
          { tone: 'accent', text: 'We work where A.I., systems, and security meet.' },
          { text: 'We build tools that use intelligent systems to strengthen security and privacy in practical environments.' },
          { text: 'We also study how modern AI systems, hardware, and software stacks can leak information or introduce new attack surfaces.' },
          { text: 'Our work spans systems, LLM evaluation, AI security, computer vision, IoT, networking, and edge computing.' },
        ],
      },
      ...projectList.map((project, index) => buildProjectSlide(project, index)),
      {
        title: 'Interested?',
        command: './aiseclab --contact',
        duration: 9800,
        lines: [
          { tone: 'contact', text: 'Interested in contributing to any of these projects?' },
          { text: `Join our lab and send an email to ${CONTACT_EMAIL}.` },
          { text: 'Or send a message here:' },
          { tone: 'accent', text: CONTACT_URL },
        ],
      },
    ];

    return slides;
  }

  function buildProjectSlide(project, index) {
    const sentences = splitSentences(project.summary || '').slice(0, 2);
    const lines = [];
    if (sentences[0]) lines.push({ text: sentences[0] });
    if (sentences[1]) lines.push({ text: sentences[1] });
    if (Array.isArray(project.tags) && project.tags.length) {
      lines.push({ tone: 'accent', text: `Focus areas: ${project.tags.join(' | ')}` });
    }
    if (!lines.length) {
      lines.push({ text: 'Project details can be expanded here for future revisions.' });
    }

    return {
      title: project.title || `Project ${index + 1}`,
      command: `./aiseclab --project ${index + 1}`,
      duration: 9000,
      lines,
    };
  }

  function splitSentences(text) {
    return compactText(text)
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function compactText(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function loadText(path, fallback) {
    try {
      const response = await fetch(path);
      if (!response.ok) return fallback;
      return await response.text();
    } catch {
      return fallback;
    }
  }

  async function loadJSON(path, fallback) {
    try {
      const response = await fetch(path);
      if (!response.ok) return fallback;
      return await response.json();
    } catch {
      return fallback;
    }
  }
})();
