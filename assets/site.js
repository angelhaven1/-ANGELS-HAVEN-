(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => {
    nav?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
  }));
  const galleryFilters = document.querySelectorAll('[data-gallery-filter]');
  const galleryCards = document.querySelectorAll('.gallery-grid [data-category]');
  galleryFilters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.galleryFilter;
    galleryFilters.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('is-active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    galleryCards.forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
  }));

  // Booking inquiries stay on the guest's device and are composed into WhatsApp.
  const phone = '9779846743395';
  const openInquiry = message => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  const localIsoDate = input => {
    const date = new Date(input || Date.now());
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  };
  const nextDate = input => {
    const date = input ? new Date(`${input}T12:00:00`) : new Date();
    date.setDate(date.getDate() + 1);
    return localIsoDate(date);
  };
  function constrainDateRange(form) {
    const checkIn = form?.querySelector('[name="arrival"]');
    const checkOut = form?.querySelector('[name="check_out"]');
    if (!checkIn || !checkOut) return;
    checkIn.min = localIsoDate();
    const update = () => {
      checkOut.min = nextDate(checkIn.value);
      if (checkOut.value && checkOut.value < checkOut.min) checkOut.value = '';
    };
    checkIn.addEventListener('change', update);
    update();
  }
  const detailedForm = document.querySelector('#detailed-inquiry');
  if (detailedForm) constrainDateRange(detailedForm);
  detailedForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!detailedForm.reportValidity()) return;
    const values = new FormData(detailedForm);
    const message = [
      'Namaste Angels Haven, I would like to plan a visit.',
      `Name: ${values.get('name')}`,
      `Phone / WhatsApp: ${values.get('phone')}`,
      values.get('email') ? `Email: ${values.get('email')}` : '',
      `Request: ${values.get('visit')}`,
      `Check-in: ${values.get('arrival') || 'Dates flexible'}`,
      `Check-out: ${values.get('check_out') || 'Not set'}`,
      `Group: ${values.get('guests')}; ${values.get('rooms')}`,
      values.get('message') ? `Message: ${values.get('message')}` : '',
    ].filter(Boolean).join('\n');
    openInquiry(message);
  });



  const revealItems = document.querySelectorAll(
    '.intro-copy,.summit-list,.room-card,.gallery-card,.trailband-inner,.getting-intro,.route-card,.best-time,.faq-wrap>div,.google-reviews-heading,.guest-review-card,.inquiry-copy,.inquiry-form,.contact-cta>*,.footer-brand,.footer-col,.footer-bottom'
  );
  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: .12, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach((item, index) => { item.classList.add('reveal'); item.style.setProperty('--reveal-delay', `${(index % 4) * 65}ms`); observer.observe(item); });
  }


  // Expand a selected guest review in a native dialog, preserving its photos and source link.
  const reviewDialog = document.querySelector('#review-zoom-viewer');
  const reviewContent = document.querySelector('#review-zoom-content');
  const closeReview = () => {
    if (typeof reviewDialog?.close === 'function') reviewDialog.close();
    else reviewDialog?.removeAttribute('open');
  };
  const openReview = card => {
    if (!reviewDialog || !reviewContent) return;
    const clone = card.cloneNode(true);
    clone.className = 'guest-review-card review-zoom-card';
    clone.querySelectorAll('[data-review-zoom]').forEach(button => button.remove());
    reviewContent.replaceChildren(clone);
    if (typeof reviewDialog.showModal === 'function') reviewDialog.showModal();
    else reviewDialog.setAttribute('open', '');
  };
  document.querySelectorAll('.guest-review-card').forEach(card => {
    const author = card.querySelector('.guest-review-author')?.textContent?.trim() || 'guest';
    card.style.cursor = 'zoom-in';
    card.addEventListener('click', event => {
      if (event.target.closest('a,button,input,select,textarea,video')) return;
      openReview(card);
    });
    const source = card.querySelector('.guest-review-source');
    if (source) {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'review-zoom-trigger';
      trigger.dataset.reviewZoom = '';
      trigger.textContent = 'Zoom review ↗';
      trigger.setAttribute('aria-label', `Enlarge guest review by ${author}`);
      trigger.addEventListener('click', () => openReview(card));
      source.append(trigger);
    }
  });
  document.querySelector('[data-review-close]')?.addEventListener('click', closeReview);
  reviewDialog?.addEventListener('click', event => {
    if (event.target === reviewDialog) closeReview();
  });

  // Guest photo zoom uses a separate dialog and delegated clicks, so photos work in review zoom too.
  const photoDialog = document.querySelector('#camp-photo-viewer');
  const photoViewerImage = document.querySelector('#camp-photo-viewer-image');
  const photoViewerCaption = document.querySelector('#camp-photo-viewer-caption');
  const photoViewerCredit = document.querySelector('#camp-photo-viewer-credit');
  document.addEventListener('click', event => {
    const photo = event.target.closest('[data-photo-viewer]');
    if (!photo || !photoDialog || !photoViewerImage) return;
    event.preventDefault();
    photoViewerImage.src = photo.dataset.full;
    photoViewerImage.alt = photo.dataset.alt || '';
    if (photoViewerCaption) photoViewerCaption.textContent = photo.dataset.caption || '';
    if (photoViewerCredit) {
      photoViewerCredit.href = photo.href || photo.dataset.source || '#reviews';
      photoViewerCredit.textContent = photo.dataset.credit || 'Photo source and license';
    }
    if (typeof photoDialog.showModal === 'function') photoDialog.showModal();
    else photoDialog.setAttribute('open', '');
  });
  document.querySelector('[data-camp-photo-close]')?.addEventListener('click', () => {
    if (typeof photoDialog?.close === 'function') photoDialog.close();
    else photoDialog?.removeAttribute('open');
  });
  photoDialog?.addEventListener('click', event => {
    if (event.target === photoDialog) photoDialog.close?.();
  });
  // Guest-photo hero carousel: one image loads at a time, with manual and pause controls.
  const photoDataNode = document.querySelector('#hero-slides-data');
  const heroPhoto = document.querySelector('#hero-carousel-image');
  const heroPhotoCredit = document.querySelector('#hero-review-credit');
  const heroPhotoCount = document.querySelector('#hero-carousel-count');
  const heroPhotoPrev = document.querySelector('[data-hero-prev]');
  const heroPhotoNext = document.querySelector('[data-hero-next]');
  const heroPhotoPause = document.querySelector('[data-hero-pause]');
  let heroPhotos = [];
  try { heroPhotos = JSON.parse(photoDataNode?.textContent || '[]'); } catch (_) { heroPhotos = []; }
  if (heroPhoto && heroPhotos.length) {
    let activePhoto = 0;
    let paused = reduceMotion || heroPhotos.length < 2;
    let photoSwapTimeout;
    const renderHeroPhoto = index => {
      activePhoto = (index + heroPhotos.length) % heroPhotos.length;
      const item = heroPhotos[activePhoto];
      if (item.url !== heroPhoto.src) {
        heroPhoto.classList.add('is-fading');
        window.clearTimeout(photoSwapTimeout);
        photoSwapTimeout = window.setTimeout(() => {
          heroPhoto.src = item.url;
          heroPhoto.alt = item.alt || 'Guest photograph from Australian Camp';
          heroPhoto.classList.remove('is-fading');
        }, reduceMotion ? 0 : 260);
      }
      if (heroPhotoCredit) {
        heroPhotoCredit.href = item.author_url || '#reviews';
        heroPhotoCredit.textContent = item.credit_label || `Guest photo ${activePhoto + 1}`;
      }
      if (heroPhotoCount) heroPhotoCount.textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${String(heroPhotos.length).padStart(2, '0')}`;
    };
    const updatePauseControl = () => {
      if (!heroPhotoPause) return;
      heroPhotoPause.textContent = paused ? '▶' : 'Ⅱ';
      heroPhotoPause.setAttribute('aria-label', paused ? 'Play photo slideshow' : 'Pause photo slideshow');
      heroPhotoPause.setAttribute('aria-pressed', String(paused));
    };
    heroPhotoPrev?.addEventListener('click', () => renderHeroPhoto(activePhoto - 1));
    heroPhotoNext?.addEventListener('click', () => renderHeroPhoto(activePhoto + 1));
    heroPhotoPause?.addEventListener('click', () => { paused = !paused; updatePauseControl(); });
    if (heroPhotos.length > 1) window.setInterval(() => {
      if (!paused && !document.hidden) renderHeroPhoto(activePhoto + 1);
    }, 6500);
    updatePauseControl();
    renderHeroPhoto(0);
  }})();
