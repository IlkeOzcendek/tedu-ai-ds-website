(() => {
  'use strict';
  const art = document.querySelector('.hero-art');
  const hero = document.querySelector('.hero');
  if (!art || !hero) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-ambient';
  canvas.setAttribute('aria-hidden', 'true');
  art.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const mobile = matchMedia('(max-width: 800px)');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const video = art.querySelector('video');
  let fallback = false, active = false, visible = true;
  let width = 1, height = 1, frame = 0, lastDraw = 0, elapsed = 0, lastTick = 0;
  let renderCount = 0;
  const cols = 24, rows = 11, points = [], edges = [];
  for (let row = 0; row < rows; row++) {
    const v = (row + 1) / (rows + 1), theta = v * Math.PI;
    for (let col = 0; col < cols; col++) {
      const u = col / cols, phi = u * Math.PI * 2;
      points.push({ x: Math.sin(theta) * Math.cos(phi), y: Math.cos(theta), z: Math.sin(theta) * Math.sin(phi), u, v, row, col });
      const i = row * cols + col;
      edges.push([i, row * cols + (col + 1) % cols]);
      if (row < rows - 1) {
        edges.push([i, i + cols]);
        if ((row + col) % 2 === 0) edges.push([i, (row + 1) * cols + (col + 1) % cols]);
      }
    }
  }
  const projected = points.map(() => ({ x: 0, y: 0, z: 0, size: 0, tint: 0 }));
  const sprites = ['182,255,110', '97,233,201'].map(rgb => {
    const c = document.createElement('canvas'); c.width = c.height = 40;
    const g = c.getContext('2d'), glow = g.createRadialGradient(20, 20, 0, 20, 20, 20);
    glow.addColorStop(0, 'rgba(245,255,230,1)');
    glow.addColorStop(.12, `rgba(${rgb},.92)`);
    glow.addColorStop(.26, `rgba(${rgb},.36)`);
    glow.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = glow; g.fillRect(0, 0, 40, 40); return c;
  });
  const smooth = n => n * n * (3 - 2 * n);
  function morphAt(t) {
    const p = t % 24;
    if (p < 5) return 0;
    if (p < 10) return smooth((p - 5) / 5);
    if (p < 14) return 1;
    if (p < 20) return 1 - smooth((p - 14) / 6);
    return 0;
  }
  function paint(time) {
    if (!width || !height) return;
    renderCount++;
    canvas.dataset.renderCount = String(renderCount);
    const t = calm.matches ? 2 : time;
    const blend = calm.matches ? 0 : morphAt(t);
    const cx = width * (mobile.matches ? .5 : .75);
    const cy = height * (mobile.matches ? .45 : .48);
    const radius = mobile.matches ? Math.min(width * .30, height * .365) : Math.min(width * .23, height * .33);
    const yaw = t * .105, pitch = -.19 + Math.sin(t * .16) * .055;
    ctx.clearRect(0, 0, width, height);
    const halo = ctx.createRadialGradient(cx, cy, radius * .12, cx, cy, radius * 1.8);
    halo.addColorStop(0, '#66df9e16'); halo.addColorStop(.46, '#77e59a10'); halo.addColorStop(1, '#61e9c900');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.25 + Math.sin(t * .09) * .045);
    ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.30, radius * .46, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#61e9c925'; ctx.lineWidth = .65; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.31, radius * .47, 0, t * .18, t * .18 + .8);
    ctx.strokeStyle = '#b6ff6e88'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const waveX = (p.col / (cols - 1) - .5) * 2.18;
      const waveZ = (p.v - .5) * 1.75;
      const waveY = Math.sin(waveX * 2.4 + t * .72 + waveZ * 2) * .22 + Math.cos(waveZ * 3 - t * .35) * .09;
      const x = p.x * (1 - blend) + waveX * blend;
      const y = p.y * (1 - blend) + waveY * blend;
      const z = p.z * (1 - blend) + waveZ * blend;
      const angleBlend = 1 - blend * .70;
      const a = yaw * angleBlend + blend * .28;
      const sa = Math.sin(a), ca = Math.cos(a);
      const xx = x * ca + z * sa, zz = -x * sa + z * ca;
      const pp = pitch - blend * .40, s = Math.sin(pp), c = Math.cos(pp);
      const yy = y * c - zz * s, depth = y * s + zz * c;
      const perspective = 3.8 / (3.8 - depth);
      const q = projected[i]; q.x = cx + xx * radius * perspective; q.y = cy - yy * radius * perspective;
      q.z = depth; q.size = .65 + (depth + 1.2) * .46; q.tint = xx < -.14 ? 0 : 1;
    }
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      for (let j = 0; j < edges.length; j++) {
        const a = projected[edges[j][0]], b = projected[edges[j][1]], depth = (a.z + b.z) / 2;
        const edgeLayer = depth < -.28 ? 0 : depth < .35 ? 1 : 2;
        if (edgeLayer !== layer) continue;
        if (blend > .2 && Math.abs(points[edges[j][0]].col - points[edges[j][1]].col) > 2) continue;
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      }
      ctx.lineWidth = layer === 2 ? .78 : .55;
      ctx.strokeStyle = ['rgba(97,233,201,.085)', 'rgba(134,244,158,.20)', 'rgba(182,255,110,.40)'][layer]; ctx.stroke();
    }
    const order = projected.map((_, i) => i).sort((a, b) => projected[a].z - projected[b].z);
    for (const i of order) {
      const p = projected[i], pulse = .83 + Math.sin(t * 1.5 + i * .21) * .17;
      const size = p.size * (p.z > .25 ? 10 : 6);
      ctx.globalAlpha = Math.max(.15, (.42 + (p.z + 1) * .26) * pulse);
      ctx.drawImage(sprites[p.tint], p.x - size / 2, p.y - size / 2, size, size);
      ctx.fillStyle = p.tint ? '#a0f7df' : '#dbffa7';
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.45, p.size * .55), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399 + t * (i % 2 ? -.025 : .035);
      const spread = radius * (1.38 + (i % 3) * .10);
      const x = cx + Math.cos(a) * spread, y = cy + Math.sin(a) * spread * .76;
      const alpha = .33 + (Math.sin(t * 1.15 + i * 2) + 1) * .22;
      ctx.globalAlpha = alpha; ctx.drawImage(sprites[i % 2], x - 5, y - 5, 10, 10);
      if (i % 2 === 0) { ctx.strokeStyle = '#7adaab55'; ctx.lineWidth = .65; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0;
    if (!active || !visible || document.hidden || calm.matches) return;
    if (!lastTick) lastTick = now;
    elapsed += Math.min((now - lastTick) / 1000, .08); lastTick = now;
    if (now - lastDraw >= 31) { paint(elapsed); lastDraw = now; }
    frame = requestAnimationFrame(tick);
  }
  function update() {
    active = mobile.matches || fallback;
    art.classList.toggle('uses-ambient', active);
    canvas.dataset.active = String(active);
    if (active && video && !video.paused) video.pause();
    cancelAnimationFrame(frame); frame = 0; lastTick = 0;
    if (active && visible && !document.hidden) { paint(elapsed); if (!calm.matches) frame = requestAnimationFrame(tick); }
  }
  function resize() {
    const bounds = art.getBoundingClientRect(); width = bounds.width; height = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.6);
    canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (active && visible && !document.hidden) paint(elapsed);
  }
  window.setHeroFallback = value => { fallback = Boolean(value); update(); };
  window.heroAmbientActive = () => mobile.matches || fallback;
  new ResizeObserver(resize).observe(art);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }, { threshold: 0 }).observe(hero);
  mobile.addEventListener('change', () => { resize(); update(); }); calm.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  video?.addEventListener('play', () => { if (mobile.matches || fallback) video.pause(); });
  resize(); update();
})();
