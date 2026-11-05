/* 木构架交互图谱 · SVG 构件引擎（无依赖，可离线 file:// 打开）
 * 模型坐标：x 向右、y 向上（单位随模型，如"尺"或示意单位 u）。渲染时 y 取反。
 * model = { id, title, intro, evidence, bounds:{x0,x1,y0,y1}（仅图形范围）, parts:[], steps:[], load:[], bands:[], annos:[] }
 * part  = { id, cat, name, alias, desc, g:[几何], lab:[ax,ay]|null, ex:[dx,dy], minor, side:'L'|'R' }
 * 标注两种模式：电脑端"引线标注"（左右两列）；窄屏"编号+图例"（建筑图常用的编号图例法）。
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const CATS = {
    column: { n: '柱', c: '#8c5a3c' },
    beam: { n: '梁栿', c: '#b5772a' },
    purlin: { n: '檩/槫', c: '#c0392b' },
    fang: { n: '枋/额/串', c: '#3f6e8c' },
    bracket: { n: '斗栱/铺作', c: '#2e7d4f' },
    strut: { n: '蜀柱/瓜柱/驼峰', c: '#9a6b00' },
    brace: { n: '叉手/托脚/斜撑', c: '#6d4fa3' },
    ceiling: { n: '天花', c: '#2f6fb0' },
    rafter: { n: '椽/屋面', c: '#5b5b5b' },
    base: { n: '台基/柱础', c: '#8d8676' },
    other: { n: '其他', c: '#777' }
  };
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); if (a) for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const fy = y => -y;
  const f3 = v => (+v).toFixed(3);
  const ptsStr = pts => pts.map(p => f3(p[0]) + ',' + f3(fy(p[1]))).join(' ');

  function drawGeom(g, parent) {
    switch (g.t) {
      case 'r': return el('rect', { x: g.x, y: fy(g.y + g.h), width: g.w, height: g.h, class: 'shp' + (g.cls ? ' ' + g.cls : '') }, parent);
      case 'p': return el('polygon', { points: ptsStr(g.pts), class: 'shp' + (g.cls ? ' ' + g.cls : '') }, parent);
      case 'l': return el('polyline', { points: ptsStr(g.pts), class: 'ln' + (g.dash ? ' dash' : '') + (g.cls ? ' ' + g.cls : ''), style: `stroke-width:${g.w || 0.16}` }, parent);
      case 'c': return el('circle', { cx: g.x, cy: fy(g.y), r: g.r, class: 'shp' + (g.cls ? ' ' + g.cls : '') }, parent);
      case 'm': { // 月梁：上缘略拱、梁底略向上凹（教材 p.280 "梁肩呈弧形，梁底略向上凹"），两端卷杀
        const { x1, x2, y, h } = g, a = g.a == null ? h * 0.22 : g.a, k = Math.min(0.12 * (x2 - x1), h * 1.1);
        const d = `M${f3(x1)},${f3(fy(y + h * 0.8))} Q${f3(x1 + k * 0.25)},${f3(fy(y + h))} ${f3(x1 + k)},${f3(fy(y + h))} L${f3(x2 - k)},${f3(fy(y + h))} Q${f3(x2 - k * 0.25)},${f3(fy(y + h))} ${f3(x2)},${f3(fy(y + h * 0.8))} L${f3(x2)},${f3(fy(y + h * 0.15))} Q${f3((x1 + x2) / 2)},${f3(fy(y + a))} ${f3(x1)},${f3(fy(y + h * 0.15))} Z`;
        return el('path', { d, class: 'shp' }, parent);
      }
    }
  }

  let UID = 0;
  class Viewer {
    constructor(host, model, opt) {
      this.host = typeof host === 'string' ? document.querySelector(host) : host;
      this.opt = Object.assign({ tools: ['mode', 'cats', 'load', 'explode', 'steps', 'exam', 'bands'], labelMode: 'auto', height: null }, opt || {});
      this.listeners = {};
      this._lastMode = null;
      this.setModel(model);
      this._ro = () => { const m = this.calcMode(); if (m !== this._lastMode) this.render(true); };
      window.addEventListener('resize', this._ro);
    }
    on(ev, fn) { (this.listeners[ev] = this.listeners[ev] || []).push(fn); return this; }
    emit(ev, d) { (this.listeners[ev] || []).forEach(f => f(d)); }
    calcMode() { if (this.opt.labelMode !== 'auto') return this.opt.labelMode; const w = this.host.clientWidth || window.innerWidth; return w < 700 ? 'num' : 'col'; }
    setModel(model) {
      this.model = model; this.state = { hidden: false, cat: null, explode: false, step: null, exam: false, bands: false, sel: null, focus: null };
      this.render();
    }
    render(keep) {
      const m = this.model, o = this.opt, host = this.host; host.innerHTML = '';
      host.classList.add('viewer');
      const mode = this.calcMode(); this._lastMode = mode; this.mode = mode;
      // 工具条
      const tb = document.createElement('div'); tb.className = 'vt'; host.appendChild(tb); this.tb = tb;
      const btn = (txt, title, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip ' + (cls || ''); b.textContent = txt; if (title) b.title = title; b.onclick = fn; tb.appendChild(b); return b; };
      this.btns = {};
      if (o.tools.includes('mode')) this.btns.mode = btn('学习模式', '切换"学习模式（显示名称）/ 隐藏标注模式"', () => this.setHidden(!this.state.hidden));
      if (o.tools.includes('load') && m.load && m.load.length) this.btns.load = btn('▶ 荷载传递', '逐步演示屋面荷载如何传到地面', () => this.playLoad());
      if (o.tools.includes('explode') && m.parts.some(p => p.ex)) this.btns.explode = btn('拆解', '构件分层拆开 / 复原', () => this.setExplode(!this.state.explode));
      if (o.tools.includes('bands') && m.bands && m.bands.length) this.btns.bands = btn('结构分层', '显示结构分层色带', () => this.setBands(!this.state.bands));
      if (o.tools.includes('steps') && m.steps && m.steps.length) this.btns.steps = btn('逐个出现', '构件按搭建/画图顺序逐步出现', () => this.setStep(this.state.step == null ? 0 : null));
      if (o.tools.includes('exam')) this.btns.exam = btn('考试线稿', '切换为黑白考试简图（去掉次要构件）', () => this.setExam(!this.state.exam));
      if (o.tools.includes('cats')) {
        const used = [...new Set(m.parts.map(p => p.cat))].filter(c => CATS[c]);
        const sel = document.createElement('select'); sel.className = 'chip sel'; sel.title = '按构件类别高亮'; sel.setAttribute('aria-label', '按构件类别高亮');
        sel.innerHTML = '<option value="">高亮：全部构件</option>' + used.map(c => `<option value="${c}">高亮：${CATS[c].n}</option>`).join('');
        sel.onchange = () => this.setCat(sel.value || null); tb.appendChild(sel); this.catSel = sel;
      }
      if (!tb.children.length) tb.remove();
      // 画布
      const wrap = document.createElement('div'); wrap.className = 'vsvg'; host.appendChild(wrap); this.wrap = wrap;
      const b = m.bounds; const W = b.x1 - b.x0, H = b.y1 - b.y0;
      const labParts = m.parts.filter(p => p.lab);
      // 字号（模型单位）
      let size = m.labelSize || W / 40;
      let vx0 = b.x0, vx1 = b.x1, vy0 = b.y0, vy1 = b.y1;
      let LW = 0;
      if (mode === 'col' && labParts.length) {
        LW = Math.max(3, ...labParts.map(p => p.name.length)) * 0.98 + 0.4;
        const hasL = labParts.some(p => this.sideOf(p) === 'L'), hasR = labParts.some(p => this.sideOf(p) === 'R');
        if (hasL) vx0 -= size * (LW + 1.2);
        if (hasR) vx1 += size * (LW + 1.2);
      } else { size = m.numSize || W / 30; }
      if (m.bands && m.bands.length) vx0 -= size * (Math.max(...m.bands.map(b => b.n.length)) * 0.62 + 1.2);
      vy1 += size * 0.8; vy0 -= size * 0.4;
      const svg = el('svg', { viewBox: `${f3(vx0)} ${f3(-vy1)} ${f3(vx1 - vx0)} ${f3(vy1 - vy0)}`, class: 'draw', role: 'img', 'aria-label': m.title, preserveAspectRatio: 'xMidYMid meet' }, wrap);
      svg.dataset.uid = ++UID; this.svg = svg; this.size = size;
      const defs = el('defs', null, svg);
      const mk = el('marker', { id: 'ah-' + svg.dataset.uid, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#d0342c' }, mk);
      if (o.height) svg.style.maxHeight = o.height;
      svg.style.setProperty('--fs', size + 'px');
      // 分层色带
      this.gBands = el('g', { class: 'bands' }, svg);
      (m.bands || []).forEach(bd => {
        el('rect', { x: vx0, y: fy(bd.y1), width: vx1 - vx0, height: bd.y1 - bd.y0, class: 'band', fill: bd.c || '#eef' }, this.gBands);
        const t = el('text', { x: vx0 + size * 0.4, y: fy(bd.y1) + size * 1.1, class: 'bandt' }, this.gBands); t.textContent = bd.n;
      });
      // 构件
      this.gParts = el('g', { class: 'parts' }, svg);
      this.partEls = {};
      m.parts.forEach(p => {
        const g = el('g', { class: `part cat-${p.cat}` + (p.minor ? ' minor' : '') + (p.ghost ? ' ghost' : ''), 'data-id': p.id }, this.gParts);
        g.style.setProperty('--cc', (CATS[p.cat] || CATS.other).c);
        p.g.forEach(gg => drawGeom(gg, g));
        if (!p.ghost) g.addEventListener('click', e => { e.stopPropagation(); this.select(p.id); });
        this.partEls[p.id] = g;
      });
      // 注记
      this.gAnno = el('g', { class: 'annos' }, svg);
      (m.annos || []).forEach(a => {
        let n;
        if (a.t === 'text') { n = el('text', { x: a.x, y: fy(a.y), class: 'anno ' + (a.cls || ''), 'text-anchor': a.anchor || 'middle' }, this.gAnno); n.textContent = a.s; }
        else if (a.t === 'line') { n = el('polyline', { points: ptsStr(a.pts), class: 'annol ' + (a.cls || '') }, this.gAnno); }
        if (n && a.step != null) n.dataset.step = a.step;
      });
      // 标注
      this.gLab = el('g', { class: 'labels' }, svg);
      this.numOf = {};
      if (mode === 'col') this.drawColLabels(labParts, size, LW, vx0, vx1, vy0, vy1);
      else this.drawNumLabels(labParts, size);
      this.gLoad = el('g', { class: 'load' }, svg);
      svg.addEventListener('click', () => this.select(null));
      // 图例（窄屏）
      if (mode === 'num' && labParts.length) {
        const lg = document.createElement('ol'); lg.className = 'vlegend'; this.legend = lg;
        const seen = new Set();
        labParts.forEach(p => { if (seen.has(p.name)) return; seen.add(p.name); const li = document.createElement('li'); li.dataset.id = p.id; li.innerHTML = `<b>${this.numOf[p.name]}</b><span>${p.name}</span>`; li.onclick = () => this.select(p.id); lg.appendChild(li); });
        host.appendChild(lg);
      } else this.legend = null;
      // 信息面板
      const info = document.createElement('div'); info.className = 'vinfo'; info.setAttribute('aria-live', 'polite'); host.appendChild(info); this.info = info;
      this.showInfoDefault();
      if (m.footnote) { const f = document.createElement('div'); f.className = 'vfoot'; f.innerHTML = m.footnote; host.appendChild(f); }
      this.apply();
      if (keep && this.state.step != null) this.setStep(this.state.step);
    }
    sideOf(p) { const b = this.model.bounds; return p.side || (p.lab[0] < (b.x0 + b.x1) / 2 ? 'L' : 'R'); }
    drawColLabels(parts, size, LW, vx0, vx1, vy0, vy1) {
      const gap = size * 1.5; const L = [], R = [];
      parts.forEach(p => (this.sideOf(p) === 'L' ? L : R).push(p));
      const place = (arr, side) => {
        arr.sort((a, c) => c.lab[1] - a.lab[1]);
        let last = Infinity; const top = vy1 - size * 0.8;
        arr.forEach(p => { const ty = Math.min(p.lab[1], top, last - gap); p._ty = ty; last = ty; });
        const minY = vy0 + size * 0.6;
        if (arr.length && arr[arr.length - 1]._ty < minY) { // 底部越界：自下而上重排
          let floor = minY; for (let i = arr.length - 1; i >= 0; i--) { if (arr[i]._ty < floor) arr[i]._ty = floor; floor = arr[i]._ty + gap; }
        }
        arr.forEach(p => { p._side = side; });
      };
      place(L, 'L'); place(R, 'R');
      parts.forEach(p => {
        const g = el('g', { class: 'lab', 'data-id': p.id }, this.gLab);
        const L_ = p._side === 'L';
        const tx = L_ ? vx0 + size * (LW + 0.3) : vx1 - size * (LW + 0.3);
        const ex = L_ ? tx + size * 0.5 : tx - size * 0.5;
        el('polyline', { points: ptsStr([[p.lab[0], p.lab[1]], [ex, p._ty], [tx + (L_ ? size * 0.15 : -size * 0.15), p._ty]]), class: 'leader' }, g);
        el('circle', { cx: p.lab[0], cy: fy(p.lab[1]), r: size * 0.16, class: 'dot' }, g);
        const t = el('text', { x: tx, y: fy(p._ty) + size * 0.36, 'text-anchor': L_ ? 'end' : 'start', class: 'labt' }, g);
        t.textContent = p.name;
        el('rect', { x: L_ ? tx - size * LW : tx, y: fy(p._ty) - size * 0.7, width: size * LW, height: size * 1.4, class: 'labhit' }, g);
        g.addEventListener('click', e => { e.stopPropagation(); this.select(p.id); });
      });
    }
    drawNumLabels(parts, size) {
      let k = 0;
      parts.forEach(p => {
        if (!(p.name in this.numOf)) this.numOf[p.name] = ++k;
        const g = el('g', { class: 'lab num', 'data-id': p.id }, this.gLab);
        const r = size * 0.62;
        el('circle', { cx: p.lab[0], cy: fy(p.lab[1]), r, class: 'nbg' }, g);
        const t = el('text', { x: p.lab[0], y: fy(p.lab[1]) + r * 0.42, 'text-anchor': 'middle', class: 'nt' }, g);
        t.textContent = this.numOf[p.name];
        g.addEventListener('click', e => { e.stopPropagation(); this.select(p.id); });
      });
    }
    showInfoDefault() {
      const m = this.model;
      this.info.innerHTML = `<div class="vi-h">${m.title}</div><div class="vi-b">${m.intro || '点击任一构件查看名称与作用。'}</div>`;
    }
    partInfo(p) {
      return `<div class="vi-h"><span class="cdot" style="background:${(CATS[p.cat] || CATS.other).c}"></span>${p.name}${p.alias ? `<span class="alias">${p.alias}</span>` : ''}</div><div class="vi-b">${p.desc || ''}</div><div class="vi-c">类别：${(CATS[p.cat] || CATS.other).n}</div>`;
    }
    select(id) {
      this.state.sel = id;
      Object.values(this.partEls).forEach(g => g.classList.remove('sel'));
      this.gLab.querySelectorAll('.lab').forEach(g => g.classList.remove('sel'));
      if (this.legend) this.legend.querySelectorAll('li').forEach(li => li.classList.remove('sel'));
      if (!id) { if (!this._stepInfo && !this._loadInfo) this.showInfoDefault(); this.emit('pick', null); return; }
      const p = this.model.parts.find(q => q.id === id); if (!p) return;
      const same = this.model.parts.filter(q => q.name === p.name);
      same.forEach(q => { this.partEls[q.id].classList.add('sel'); const lg = this.gLab.querySelector(`.lab[data-id="${q.id}"]`); if (lg) lg.classList.add('sel'); });
      if (this.legend) this.legend.querySelectorAll('li').forEach(li => { if (same.some(q => q.id === li.dataset.id)) li.classList.add('sel'); });
      if (!this._quizLock) this.info.innerHTML = this.partInfo(p);
      this.emit('pick', p);
    }
    setHidden(v) { this.state.hidden = v; this.apply(); }
    setCat(c) { this.state.cat = c; if (this.catSel) this.catSel.value = c || ''; this.apply(); }
    setExplode(v) { this.state.explode = v; this.apply(); }
    setExam(v) { this.state.exam = v; this.apply(); }
    setBands(v) { this.state.bands = v; this.apply(); }
    focus(ids) { this.state.focus = ids && ids.length ? ids : null; this.apply(); }
    setStep(n) {
      const st = this.model.steps;
      if (n == null) { this.state.step = null; this._stepInfo = false; this.showInfoDefault(); this.apply(); this.emit('step', null); return; }
      n = Math.max(0, Math.min(st.length - 1, n)); this.state.step = n; this._stepInfo = true;
      const s = st[n];
      this.info.innerHTML = `<div class="vi-h">第 ${n + 1}/${st.length} 步 · ${s.title}</div><div class="vi-b">${s.hint || ''}</div>
        <div class="vi-nav"><button class="chip" data-a="prev" ${n === 0 ? 'disabled' : ''}>◀ 上一步</button><button class="chip pri" data-a="next" ${n === st.length - 1 ? 'disabled' : ''}>下一步 ▶</button><button class="chip" data-a="all">显示全部</button><button class="chip" data-a="exit">退出</button></div>`;
      this.info.querySelector('[data-a=prev]').onclick = () => this.setStep(n - 1);
      this.info.querySelector('[data-a=next]').onclick = () => this.setStep(n + 1);
      this.info.querySelector('[data-a=all]').onclick = () => this.setStep(st.length - 1);
      this.info.querySelector('[data-a=exit]').onclick = () => this.setStep(null);
      this.apply();
      this.emit('step', n);
    }
    stepOf(id) { const st = this.model.steps || []; for (let i = 0; i < st.length; i++) if (st[i].ids.includes(id)) return i; return st.length; }
    apply() {
      const s = this.state, m = this.model;
      this.svg.classList.toggle('hidelab', s.hidden);
      this.svg.classList.toggle('exam', s.exam);
      this.svg.classList.toggle('showbands', s.bands);
      if (this.legend) this.legend.classList.toggle('hidelab', s.hidden);
      if (this.btns.mode) { this.btns.mode.textContent = s.hidden ? '隐藏标注模式' : '学习模式'; this.btns.mode.classList.toggle('on', s.hidden); }
      if (this.btns.explode) { this.btns.explode.textContent = s.explode ? '复原' : '拆解'; this.btns.explode.classList.toggle('on', s.explode); }
      if (this.btns.exam) this.btns.exam.classList.toggle('on', s.exam);
      if (this.btns.bands) this.btns.bands.classList.toggle('on', s.bands);
      if (this.btns.steps) this.btns.steps.classList.toggle('on', s.step != null);
      m.parts.forEach(p => {
        const g = this.partEls[p.id];
        const dimByCat = !!s.cat && p.cat !== s.cat, dimByFocus = !!s.focus && !s.focus.includes(p.id);
        g.classList.toggle('dim', dimByCat || dimByFocus);
        g.classList.toggle('hl', (!!s.cat && p.cat === s.cat) || (!!s.focus && s.focus.includes(p.id)));
        const ex = s.explode && p.ex ? p.ex : [0, 0];
        g.style.transform = `translate(${ex[0]}px, ${-ex[1]}px)`;
        let vis = true, isNew = false;
        if (s.step != null) { const k = this.stepOf(p.id); vis = k <= s.step; isNew = k === s.step; }
        g.classList.toggle('gone', !vis); g.classList.toggle('new', isNew);
        this.gLab.querySelectorAll(`.lab[data-id="${p.id}"]`).forEach(lg => { lg.classList.toggle('gone', !vis || s.explode); lg.classList.toggle('dim', dimByCat || dimByFocus); });
      });
      this.gAnno.querySelectorAll('[data-step]').forEach(a => a.classList.toggle('gone', s.step != null && +a.dataset.step > s.step));
      this.gAnno.classList.toggle('gone', s.explode);
    }
    clearLoad() { this.gLoad.innerHTML = ''; clearTimeout(this._lt); this.svg.classList.remove('loading'); this._loadInfo = false; }
    playLoad() {
      const L = this.model.load; if (!L) return; this.clearLoad(); this.setExplode(false);
      if (this.state.step != null) this.setStep(null);
      this.svg.classList.add('loading'); this._loadInfo = true; const uid = this.svg.dataset.uid;
      let i = 0;
      const next = () => {
        if (i >= L.length) {
          const nav = document.createElement('div'); nav.className = 'vi-nav';
          nav.innerHTML = '<button class="chip" data-a="re">重播</button><button class="chip" data-a="x">清除箭头</button>';
          this.info.appendChild(nav);
          nav.querySelector('[data-a=re]').onclick = () => this.playLoad();
          nav.querySelector('[data-a=x]').onclick = () => { this.clearLoad(); this.showInfoDefault(); };
          return;
        }
        const st = L[i];
        this.gLoad.querySelectorAll('.arw').forEach(a => a.classList.add('old'));
        (st.segs || []).forEach(sg => {
          const pl = el('polyline', { points: ptsStr(sg), class: 'arw', 'marker-end': `url(#ah-${uid})` }, this.gLoad);
          const len = sg.reduce((a, p, k) => k ? a + Math.hypot(p[0] - sg[k - 1][0], p[1] - sg[k - 1][1]) : 0, 0);
          pl.style.strokeDasharray = len; pl.style.strokeDashoffset = len;
          requestAnimationFrame(() => requestAnimationFrame(() => { pl.style.strokeDashoffset = 0; }));
        });
        (st.hl || []).forEach(id => { const g = this.partEls[id]; if (g) { g.classList.add('flash'); setTimeout(() => g.classList.remove('flash'), 1500); } });
        this.info.innerHTML = `<div class="vi-h">荷载传递 ${i + 1}/${L.length}</div><div class="vi-b">${st.t}</div>`;
        i++; this._lt = setTimeout(next, 1900);
      };
      next();
    }
    pulse(id) { Object.values(this.partEls).forEach(g => g.classList.remove('quiz')); if (id) { const p = this.model.parts.find(q => q.id === id); this.model.parts.filter(q => q.name === p.name).forEach(q => this.partEls[q.id].classList.add('quiz')); } }
    destroy() { window.removeEventListener('resize', this._ro); clearTimeout(this._lt); }
  }

  window.MGJ = window.MGJ || {};
  window.MGJ.Viewer = Viewer; window.MGJ.CATS = CATS; window.MGJ.svgEl = el;
})();
