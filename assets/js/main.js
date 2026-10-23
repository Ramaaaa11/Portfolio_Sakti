(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cursor aura + click particles (desktop pointer only; disabled for reduced motion).
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-follower';
    cursor.setAttribute('aria-hidden', 'true');
    const aura = document.createElement('div');
    aura.className = 'cursor-aura';
    aura.setAttribute('aria-hidden', 'true');
    document.body.append(aura, cursor);

    document.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      const x = event.clientX;
      const y = event.clientY;
      document.body.style.setProperty('--cursor-x', `${x}px`);
      document.body.style.setProperty('--cursor-y', `${y}px`);
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      aura.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      cursor.classList.add('is-visible');
      aura.classList.add('is-visible');
    }, { passive: true });

    const interactiveItems = $$('a, button, [role="button"], .photo-slide, .feature-card, input, textarea, select');
    interactiveItems.forEach((item) => {
      item.addEventListener('pointerenter', () => cursor.classList.add('is-hovering'));
      item.addEventListener('pointerleave', () => cursor.classList.remove('is-hovering'));
    });

    document.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const wave = document.createElement('span');
      wave.className = 'click-wave';
      wave.style.left = `${event.clientX}px`;
      wave.style.top = `${event.clientY}px`;
      document.body.append(wave);
      window.setTimeout(() => wave.remove(), 650);

      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.22;
        const distance = 22 + Math.random() * 24;
        const spark = document.createElement('span');
        spark.className = 'click-spark';
        spark.style.left = `${event.clientX}px`;
        spark.style.top = `${event.clientY}px`;
        spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
        spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
        document.body.append(spark);
        window.setTimeout(() => spark.remove(), 700);
      }
    }, { passive: true });
  }

  // Entrance and scroll reveals
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      revealObserver.observe(el);
    });
  } else revealItems.forEach((el) => el.classList.add('is-visible'));

  // Mobile navigation
  const toggle = $('.menu-toggle');
  const nav = $('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', open);
    });
    $$('.site-nav a').forEach((link) => link.addEventListener('click', (event) => {
      if (link.origin !== location.origin) return;
      event.preventDefault();
      const target = link.href;
      const wipe = $('.page-wipe');
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (wipe && !reduceMotion) {
        wipe.classList.add('is-leaving');
        window.setTimeout(() => { location.href = target; }, 300);
      } else location.href = target;
    }));
  }

  // Soft page transition for local in-site links
  $$('a[href$=".html"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      event.preventDefault();
      const wipe = $('.page-wipe');
      if (!wipe || reduceMotion) { location.href = url.href; return; }
      wipe.classList.add('is-leaving');
      window.setTimeout(() => { location.href = url.href; }, 300);
    });
  });

  // Contact form: prepare an email in the visitor's email client (no server/storage).
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const type = String(data.get('type') || 'Project inquiry');
      const message = String(data.get('message') || '').trim();
      const note = $('#form-note');
      // EDIT THIS ADDRESS to receive messages.
      const destination = 'hello@example.com';
      if (!name || !email || !message) {
        if (note) note.textContent = 'Please complete your name, email, and message first.';
        return;
      }
      const subject = encodeURIComponent(`[Portfolio] ${type} — ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${type}\n\n${message}`);
      if (note) note.textContent = `Opening your email app. Change ${destination} in assets/js/main.js to your own address.`;
      location.href = `mailto:${destination}?subject=${subject}&body=${body}`;
    });
  }

  // Gallery tabs
  const tabs = $$('[data-gallery-tab]');
  const panels = $$('[data-gallery-panel]');
  if (tabs.length && panels.length) {
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      const target = tab.dataset.galleryTab;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      panels.forEach((panel) => {
        const active = panel.dataset.galleryPanel === target;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
        if (active) panel.classList.remove('panel-refresh');
      });
    }));
  }

  // Gallery image carousel: arrows, swipe/trackpad and numbered jump controls.
  const carousel = $('.photo-carousel');
  const track = $('.photo-track');
  const slides = $$('.photo-slide');
  const prev = $('.carousel-prev');
  const next = $('.carousel-next');
  const currentCount = $('[data-current-slide]');
  const progress = $('.carousel-progress span');
  const jumpButtons = $$('[data-jump]');
  if (carousel && track && slides.length) {
    // Ratio can be set with data-ratio; .wide and .portrait remain convenient defaults.
    slides.forEach((slide, index) => {
      const ratioLabel = $('.photo-meta span:last-child', slide);
      const ratio = slide.dataset.ratio || (slide.classList.contains('portrait') ? '9:16' : '16:9');
      if (ratioLabel) ratioLabel.textContent = `${ratio} FRAME`;
      slide.setAttribute('aria-label', `Photo ${index + 1}, ${ratio} frame`);
    });
    let current = 0;
    const nearestIndex = () => {
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let nearest = 0; let diff = Infinity;
      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        const distance = Math.abs(slideCenter - center);
        if (distance < diff) { diff = distance; nearest = index; }
      });
      return nearest;
    };
    const updateUI = (index) => {
      current = Math.max(0, Math.min(slides.length - 1, index));
      if (currentCount) currentCount.textContent = String(current + 1).padStart(2, '0');
      if (progress) progress.style.width = `${((current + 1) / slides.length) * 100}%`;
      jumpButtons.forEach((button) => button.classList.toggle('active', Number(button.dataset.jump) === current + 1));
    };
    const goTo = (index) => {
      const safeIndex = Math.max(0, Math.min(slides.length - 1, index));
      const slide = slides[safeIndex];
      carousel.scrollTo({ left: slide.offsetLeft - (carousel.clientWidth - slide.clientWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      updateUI(safeIndex);
    };
    prev?.addEventListener('click', () => goTo(current - 1));
    next?.addEventListener('click', () => goTo(current + 1));
    jumpButtons.forEach((button) => button.addEventListener('click', () => goTo(Number(button.dataset.jump) - 1)));
    let scrollTick = false;
    carousel.addEventListener('scroll', () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => { updateUI(nearestIndex()); scrollTick = false; });
    }, { passive: true });
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); goTo(current + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(current - 1); }
    });
    window.addEventListener('resize', () => goTo(current));
    updateUI(0);
  }

  // Hide the banner placeholder when a real video file starts loading successfully.
  const video = $('#portfolio-video');
  const videoShell = $('.video-shell');
  if (video && videoShell) {
    const emptyState = $('#video-empty-state');
    video.addEventListener('loadeddata', () => { if (emptyState) emptyState.hidden = true; });
    video.addEventListener('play', () => videoShell.classList.add('is-playing'));
    video.addEventListener('pause', () => videoShell.classList.remove('is-playing'));
    video.addEventListener('ended', () => videoShell.classList.remove('is-playing'));
    video.addEventListener('error', () => { if (emptyState) emptyState.hidden = false; });
  }

  // Local audio selection: a visitor can preview an MP3 without uploading it anywhere.
  const audioInput = $('#audio-file');
  const audioPlayer = $('#local-audio-player');
  const audioName = $('#audio-file-name');
  let audioObjectUrl = null;
  if (audioInput && audioPlayer) {
    audioInput.addEventListener('change', () => {
      const file = audioInput.files && audioInput.files[0];
      if (!file) return;
      if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
      audioObjectUrl = URL.createObjectURL(file);
      audioPlayer.src = audioObjectUrl;
      audioPlayer.hidden = false;
      if (audioName) audioName.textContent = file.name.toUpperCase();
      const audioPanel = $('[data-gallery-panel="audio"]');
      audioPanel?.classList.add('is-playing');
      audioPlayer.play().catch(() => {});
    });
    audioPlayer.addEventListener('play', () => $('[data-gallery-panel="audio"]')?.classList.add('is-playing'));
    audioPlayer.addEventListener('pause', () => $('[data-gallery-panel="audio"]')?.classList.remove('is-playing'));
    window.addEventListener('beforeunload', () => { if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl); });
  }
})();
