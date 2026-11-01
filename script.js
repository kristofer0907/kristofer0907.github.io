// ---------- theme (dark by default) ----------
const root = document.documentElement;

document.getElementById('theme-toggle').addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// ---------- marquee: duplicate the list so the loop is seamless ----------
const track = document.getElementById('marquee-track');
[...track.children].forEach(li => {
  const copy = li.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  track.appendChild(copy);
});

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- projects ----------
const grid = document.getElementById('grid');
const pad = n => String(n).padStart(2, '0');

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text != null) node.textContent = text;
  return node;
}

function tagList(tags = []) {
  const ul = el('ul', { class: 'tags' });
  tags.forEach(t => ul.appendChild(el('li', {}, t)));
  return ul;
}

function renderCard(p, i, total) {
  const card = el('button', { class: 'card', type: 'button' });

  const imgWrap = el('div', { class: 'card-img' });
  const img = el('img', { src: p.images?.[0] || '', alt: p.title, loading: 'lazy' });
  imgWrap.appendChild(img);

  const body = el('div', { class: 'card-body' });
  const meta = el('div', { class: 'card-meta mono' });
  meta.appendChild(el('span', { class: 'num' }, `${pad(i + 1)} / ${pad(total)}`));
  meta.appendChild(el('span', {}, p.year || ''));

  body.append(meta, el('h3', {}, p.title), el('p', {}, p.summary), tagList(p.tags));
  card.append(imgWrap, body);
  card.addEventListener('click', () => openModal(p, i, total));
  return card;
}

async function loadProjects() {
  try {
    const res = await fetch('projects.json', { cache: 'no-store' });
    const projects = await res.json();
    projects.forEach((p, i) => grid.appendChild(renderCard(p, i, projects.length)));
    document.getElementById('project-count').textContent = `${projects.length} total`;
    updateRail();
  } catch (err) {
    grid.textContent = 'Could not load projects.json — open the site through a local server (see README).';
  }
}

// ---------- project rail controls ----------
const prevBtn = document.getElementById('rail-prev');
const nextBtn = document.getElementById('rail-next');
const thumb = document.getElementById('rail-thumb');

function updateRail() {
  const max = grid.scrollWidth - grid.clientWidth;
  const visible = grid.clientWidth / grid.scrollWidth;
  thumb.style.width = `${visible * 100}%`;
  thumb.style.left = `${max > 0 ? (grid.scrollLeft / max) * (1 - visible) * 100 : 0}%`;
  prevBtn.disabled = grid.scrollLeft <= 2;
  nextBtn.disabled = grid.scrollLeft >= max - 2;
}

function slide(dir) {
  const card = grid.querySelector('.card');
  if (card) grid.scrollBy({ left: dir * (card.offsetWidth + 20) });
}

prevBtn.addEventListener('click', () => slide(-1));
nextBtn.addEventListener('click', () => slide(1));
grid.addEventListener('scroll', updateRail, { passive: true });
window.addEventListener('resize', updateRail);

// ---------- modal ----------
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const thumbs = document.getElementById('modal-thumbs');

function openModal(p, i, total) {
  const images = p.images || [];
  modalImg.src = images[0] || '';
  modalImg.alt = p.title;

  thumbs.replaceChildren();
  if (images.length > 1) {
    images.forEach((src, idx) => {
      const b = el('button', { type: 'button', 'aria-label': `Image ${idx + 1}` });
      if (idx === 0) b.classList.add('active');
      b.appendChild(el('img', { src, alt: '' }));
      b.addEventListener('click', () => {
        modalImg.src = src;
        thumbs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
      thumbs.appendChild(b);
    });
  }

  document.getElementById('modal-meta').textContent = `${pad(i + 1)} / ${pad(total)} · ${p.year || ''}`;
  document.getElementById('modal-title').textContent = p.title;

  const desc = document.getElementById('modal-desc');
  desc.replaceChildren();
  String(p.description || p.summary || '').split(/\n\s*\n/).forEach(para => {
    desc.appendChild(el('p', {}, para.trim()));
  });

  document.getElementById('modal-tags').replaceWith(Object.assign(tagList(p.tags), { id: 'modal-tags' }));

  const links = document.getElementById('modal-links');
  links.replaceChildren();
  Object.entries(p.links || {}).forEach(([label, url]) => {
    if (url) links.appendChild(el('a', { href: url, target: '_blank', rel: 'noopener' }, `${label} ↗`));
  });

  modal.showModal();
}

modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
// click on backdrop closes
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

loadProjects();

// ---------- hero swarm (simple boids) ----------
(function swarm() {
  const canvas = document.getElementById('swarm');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouse = { x: -9999, y: -9999 };
  let w, h, agents = [], running = true;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (w * h) / 11000));
    agents = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 - 1,
    }));
  }

  function step() {
    for (const a of agents) {
      let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
      for (const b of agents) {
        if (a === b) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 < 6400) {           // neighbours within 80px
          cx += b.x; cy += b.y; ax += b.vx; ay += b.vy; n++;
          if (d2 < 576) { sx -= dx; sy -= dy; } // keep 24px apart
        }
      }
      if (n) {
        a.vx += ((cx / n - a.x) * 0.0006) + ((ax / n - a.vx) * 0.04);
        a.vy += ((cy / n - a.y) * 0.0006) + ((ay / n - a.vy) * 0.04);
      }
      a.vx += sx * 0.004;
      a.vy += sy * 0.004;

      // scatter away from the cursor
      const mx = a.x - mouse.x, my = a.y - mouse.y, md2 = mx * mx + my * my;
      if (md2 < 14400) { a.vx += mx / Math.sqrt(md2 + 1) * 0.25; a.vy += my / Math.sqrt(md2 + 1) * 0.25; }

      const speed = Math.hypot(a.vx, a.vy), max = 1.4, min = 0.5;
      if (speed > max) { a.vx *= max / speed; a.vy *= max / speed; }
      if (speed < min) { a.vx *= min / speed; a.vy *= min / speed; }

      a.x = (a.x + a.vx + w) % w;
      a.y = (a.y + a.vy + h) % h;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const rgb = getComputedStyle(document.documentElement).getPropertyValue('--agent').trim();

    // faint links between close agents
    ctx.lineWidth = 1;
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i], b = agents[j];
        const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (d2 < 3600) {
          ctx.strokeStyle = `rgba(${rgb}, ${0.12 * (1 - d2 / 3600)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    // agents as small heading-aligned triangles
    ctx.fillStyle = `rgba(${rgb}, 0.45)`;
    for (const a of agents) {
      const ang = Math.atan2(a.vy, a.vx);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, 2.5); ctx.lineTo(-3, -2.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  function loop() {
    if (running) { step(); draw(); }
    requestAnimationFrame(loop);
  }

  canvas.parentElement.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  // pause when the hero is off screen
  new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(canvas);

  window.addEventListener('resize', resize);
  resize();
  if (reduceMotion) { for (let i = 0; i < 200; i++) step(); draw(); }
  else loop();
})();
