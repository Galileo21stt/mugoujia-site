/* 页面逻辑：路由与七个模块 */
(function () {
  const { Viewer, models: MD, D } = window.MGJ;
  const $ = (s, r) => (r || document).querySelector(s);
  const h = (tag, attrs, html) => { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k.startsWith('on')) e[k] = attrs[k]; else e.setAttribute(k, attrs[k]); } if (html != null) e.innerHTML = html; return e; };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const S = (tag, a, p) => { const e = document.createElementNS(SVGNS, tag); for (const k in a || {}) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const evTag = t => t.startsWith('A') ? 'ev-a' : t.startsWith('B') ? 'ev-b' : 'ev-c';
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clone = m => Object.assign({}, m);

  /* 灯箱 */
  const lb = $('#lb'); lb.onclick = () => lb.classList.remove('on');
  document.addEventListener('click', e => { const t = e.target; if (t.tagName === 'IMG' && t.closest('.figs')) { lb.querySelector('img').src = t.src; lb.classList.add('on'); } });

  /* ---------------- 路由 ---------------- */
  const inited = {};
  const pages = { map: initMap, timeline: initTimeline, compare: initCompare, fashi: initFashi, cases: initCases, draw: initDraw, quiz: initQuiz, sources: initSources };
  function route() {
    let id = (location.hash || '#map').slice(1).split('/')[0]; if (!pages[id]) id = 'map';
    document.querySelectorAll('section.page').forEach(s => s.classList.toggle('on', s.id === 'p-' + id));
    document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
    if (!inited[id]) { inited[id] = true; pages[id](); }
    const sub = (location.hash.split('/')[1] || ''); if (sub && pages[id].sub) pages[id].sub(decodeURIComponent(sub));
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ================= 1 知识地图 ================= */
  let mapViewer = null, mapSel = 'tl';
  function initMap() { drawMap(); showNode('tl'); let w = window.innerWidth; window.addEventListener('resize', () => { if ((w < 640) !== (window.innerWidth < 640)) { w = window.innerWidth; drawMap(); } }); }
  function drawMap() {
    const host = $('#mapSvg'); host.innerHTML = '';
    const narrow = host.clientWidth < 560;
    const L = narrow ? {
      vb: [400, 700], w: 170, hh: 56,
      root: [200, 34], dimA: [200, 112], tl: [105, 192], cd: [295, 192], jg: [200, 268],
      dimB: [200, 362], dt: [105, 442], tt: [295, 442], yw: [200, 520], qs: [200, 610]
    } : {
      vb: [900, 470], w: 170, hh: 60,
      root: [450, 38], dimA: [225, 128], dimB: [675, 128], tl: [125, 248], cd: [325, 248], jg: [225, 350],
      dt: [575, 248], tt: [775, 248], yw: [675, 350], qs: [450, 430]
    };
    const svg = S('svg', { viewBox: `0 0 ${L.vb[0]} ${L.vb[1]}`, role: 'img', 'aria-label': '木构架概念关系图' }, host);
    const N = D.map.nodes; const pos = k => L[k];
    const size = k => N[k].dim ? [L.w * 1.5, 46] : N[k].minor ? [L.w * 0.86, 44] : k === 'root' ? [200, 46] : [L.w, L.hh];
    D.map.edges.forEach(([a, b]) => { const [x1, y1] = pos(a), [x2, y2] = pos(b); S('path', { d: `M${x1},${y1 + size(a)[1] / 2} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2 - size(b)[1] / 2}`, class: 'edge' }, svg); });
    const relG = S('g', {}, svg);
    const rels = D.map.rels.concat([{ a: 'qs', b: 'tl', t: '清官式大木亦属抬梁体系', s: 'AI解释' }]);
    rels.forEach((r, i) => {
      const [x1, y1] = pos(r.a), [x2, y2] = pos(r.b);
      let d, tx, ty;
      if (Math.abs(y1 - y2) < 5) { const yy = y1 + size(r.a)[1] / 2; const dy = narrow ? 34 : 40; d = `M${x1},${yy} Q${(x1 + x2) / 2},${yy + dy * 2} ${x2},${yy}`; tx = (x1 + x2) / 2; ty = yy + dy + 4; }
      else { const off = narrow ? (r.a === 'tt' ? 190 : r.a === 'qs' ? -175 : -190) : 0; if (narrow) { const xx1 = x1 + Math.sign(off) * size(r.a)[0] / 2, xx2 = x2 + Math.sign(off) * size(r.b)[0] / 2; d = `M${xx1},${y1} C${x1 + off},${y1} ${x2 + off},${y2} ${xx2},${y2}`; tx = (x1 + x2) / 2 + off * 0.62; ty = (y1 + y2) / 2; } else { const yy1 = y1 + size(r.a)[1] / 2, yy2 = y2 + size(r.b)[1] / 2; const dy = r.a === 'qs' ? -40 : 70 + i * 14; d = `M${x1},${yy1} C${x1},${yy1 + dy} ${x2},${yy2 + dy} ${x2},${yy2}`; tx = (x1 + x2) / 2; ty = Math.max(yy1, yy2) + dy * 0.72; if (r.a === 'qs') { d = `M${x1 - 60},${y1 - 22} C${x1 - 200},${y1 - 40} ${x2},${y2 + 120} ${x2},${y2 + size(r.b)[1] / 2}`; tx = 250; ty = 405; } } }
      const p = S('path', { d, class: 'rel', 'data-a': r.a, 'data-b': r.b }, relG);
      const g = S('g', { class: 'relw', 'data-a': r.a, 'data-b': r.b }, relG);
      const t = S('text', { x: tx, y: ty, 'text-anchor': 'middle', class: 'relt' }, g); t.textContent = r.t + '（' + r.s + '）';
      void p;
    });
    Object.keys(N).forEach(k => {
      const n = N[k], [x, y] = pos(k), [w, hh] = size(k);
      const g = S('g', { class: 'node' + (n.dim ? ' dim' : '') + (n.minor ? ' minor' : ''), 'data-k': k, tabindex: n.key ? 0 : -1 }, svg);
      S('rect', { x: x - w / 2, y: y - hh / 2, width: w, height: hh, rx: 8 }, g);
      const t = S('text', { x, y: y - (n.sub ? 3 : -6), 'text-anchor': 'middle', class: 't' }, g); t.textContent = n.t;
      if (n.sub) { const s = S('text', { x, y: y + 15, 'text-anchor': 'middle', class: 's' }, g); s.textContent = n.sub; }
      if (n.key) { g.addEventListener('click', () => showNode(n.key)); g.addEventListener('keydown', e => { if (e.key === 'Enter') showNode(n.key); }); }
    });
    markMap();
  }
  function markMap() {
    const host = $('#mapSvg');
    host.querySelectorAll('.node').forEach(g => g.classList.toggle('on', D.map.nodes[g.dataset.k].key === mapSel));
    host.querySelectorAll('.rel').forEach(p => p.classList.toggle('on', p.dataset.a === mapSel || p.dataset.b === mapSel));
    host.querySelectorAll('.relw').forEach(g => { g.style.display = 'none'; });
  }
  function showNode(k) {
    mapSel = k; markMap();
    const I = D.map.info[k]; const node = Object.values(D.map.nodes).find(n => n.key === k);
    const box = $('#mapInfo'); box.innerHTML = '';
    const c = h('div', { class: 'card' }, `<h3>${I.h} <span class="tag">${I.dim}</span></h3><p>${I.def}</p>${I.pts.length ? '<ul>' + I.pts.map(p => `<li>${p}</li>`).join('') + '</ul>' : ''}${I.mix ? `<div class="warn">${I.mix}</div>` : ''}`);
    const rels = D.map.rels.concat([{ a: 'qs', b: 'tl', t: '清官式大木亦属抬梁体系', s: 'AI解释' }]).filter(r => r.a === k || r.b === k);
    if (rels.length) c.appendChild(h('div', null, '<b>图中红色虚线关系：</b><ul>' + rels.map(r => { const o = r.a === k ? r.b : r.a; return `<li>与<b>${D.map.info[o] ? D.map.info[o].h : o}</b>：${r.t}〔${r.s}〕</li>`; }).join('') + '</ul>'));
    box.appendChild(c);
    if (mapViewer) { mapViewer.destroy(); mapViewer = null; }
    if (node.model) {
      const vh = h('div'); const wrapV = h('div'); wrapV.appendChild(vh); box.appendChild(wrapV);
      mapViewer = new Viewer(vh, MD[node.model], { tools: ['mode', 'load', 'cats'] });
      const go = h('p', null, `<a href="#${node.model === 'tailiang' || node.model === 'chuandou' ? 'compare' : 'fashi'}">→ 到完整交互模块深入</a>`); wrapV.appendChild(go);
    }
  }

  /* ================= 2 时间线 ================= */
  const TL = { cur: 1, cmp: null, picking: false };
  function initTimeline() {
    const rail = $('#tlRail');
    D.eras.forEach((e, i) => { const b = h('button', { type: 'button' }, `<b>${e.n}</b><small>${e.y}</small>`); b.onclick = () => { if (TL.picking) { TL.cmp = i === TL.cur ? null : i; TL.picking = false; } else { TL.cur = i; if (TL.cmp === i) TL.cmp = null; } renderTL(); }; rail.appendChild(b); });
    renderTL();
  }
  function renderTL() {
    const btns = [...$('#tlRail').children];
    btns.forEach((b, i) => { b.classList.toggle('on', i === TL.cur); b.classList.toggle('cmp', i === TL.cmp); });
    const mode = $('#tlMode'); mode.innerHTML = '';
    const b1 = h('button', { class: 'chip' + (TL.picking ? ' on' : ''), type: 'button' }, TL.picking ? '请在上方点选要对照的时期…' : (TL.cmp == null ? '对照：选第二个时期' : '更换对照时期'));
    b1.onclick = () => { TL.picking = !TL.picking; renderTL(); }; mode.appendChild(b1);
    if (TL.cmp != null) { const b2 = h('button', { class: 'chip', type: 'button' }, '取消对照'); b2.onclick = () => { TL.cmp = null; renderTL(); }; mode.appendChild(b2); }
    const pv = h('button', { class: 'chip', type: 'button' }, '◀ 上一时期'); pv.onclick = () => { TL.cur = Math.max(0, TL.cur - 1); renderTL(); }; mode.appendChild(pv);
    const nx = h('button', { class: 'chip', type: 'button' }, '下一时期 ▶'); nx.onclick = () => { TL.cur = Math.min(D.eras.length - 1, TL.cur + 1); renderTL(); }; mode.appendChild(nx);
    const body = $('#tlBody'); body.innerHTML = '';
    const ids = [TL.cur].concat(TL.cmp != null ? [TL.cmp] : []).sort((a, b) => a - b);
    if (ids.length === 1) body.appendChild(eraCard(D.eras[TL.cur], true));
    else { const g = h('div', { class: 'grid2' }); ids.forEach(i => g.appendChild(eraCard(D.eras[i], false))); body.appendChild(g); body.appendChild(bridgeCard(ids[0], ids[1])); }
    body.appendChild(chartsCard(ids));
    body.appendChild(presenceCard(ids));
  }
  function eraCard(e, full) {
    const c = h('div', { class: 'card' });
    c.innerHTML = `<h3>${e.n} <small class="muted">${e.y}</small></h3><div class="one">${e.one}</div><div>${e.kw.map(k => `<span class="kw">${k}</span>`).join('')}</div>
      <p><b>案例：</b>${e.case.link ? `<a href="#cases/${e.case.link}">${e.case.n}</a>` : e.case.n}<br><small>${e.case.why}</small></p>`;
    const keys = Object.keys(e.qa);
    const dl = h('dl', { class: 'qa' });
    (full ? keys : ['与前期相比的变化', '为什么变化', '构件/制度变化']).forEach((k, i) => { dl.innerHTML += `<dt>${full ? (i + 1) + '. ' : ''}${k}</dt><dd>${e.qa[k]}</dd>`; });
    c.appendChild(dl);
    c.appendChild(h('div', { class: 'warn' }, '<b>例外与边界：</b>' + e.ex));
    return c;
  }
  function bridgeCard(a, b) {
    const c = h('div', { class: 'card' });
    let html = `<h3>串讲：${D.eras[a].n} → ${D.eras[b].n}</h3><ol>`;
    for (let i = a + 1; i <= b; i++) html += `<li><b>${D.eras[i].n}</b>：${D.eras[i].qa['与前期相比的变化']}<br><small>原因：${D.eras[i].qa['为什么变化']}</small></li>`;
    c.innerHTML = html + '</ol><p class="muted">口述结构：先说起点特点 → 逐段说"变了什么＋为什么" → 举一个案例 → 补一条例外。</p>';
    return c;
  }
  function chartsCard(ids) {
    const c = h('div', { class: 'card' }); c.innerHTML = '<h3>结构指标对照（只用教材给出的数据）</h3>';
    const g = h('div', { class: 'charts' }); c.appendChild(g);
    const on = i => ids.includes(i), col = i => i === TL.cur ? '#9b2f22' : (i === TL.cmp ? '#2f5f7a' : '#b9b2a4');
    // (1) 用材截面
    { const d = h('div', { class: 'chart' }, '<h4>① 斗栱用材截面（同一比例，cm）</h4>'); const svg = S('svg', { viewBox: '0 0 330 170' }, d); let x = 12;
      D.eras.forEach((e, i) => { if (!e.chart.cai) return; const [hh, w, src] = e.chart.cai; const k = 4.2; S('rect', { x, y: 140 - hh * k, width: w * k, height: hh * k, fill: on(i) ? col(i) : '#e8e3d8', stroke: col(i), 'stroke-width': on(i) ? 2 : 1 }, svg); const t = S('text', { x: x + w * k / 2, y: 156, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': on(i) ? 700 : 400 }, svg); t.textContent = e.n; const t2 = S('text', { x: x + w * k / 2, y: 136 - hh * k, 'text-anchor': 'middle', 'font-size': 10, fill: '#55514a' }, svg); t2.textContent = hh + '×' + w; x += w * k + 12; });
      d.appendChild(h('div', { class: 'cap' }, '唐佛光寺(七间) 30×20.5；宋辽金五间殿约 24×18；元永乐宫重阳殿 18×12.5；明智化寺 11.5×7.5；清太和殿(九间) 12.6×9。"斗栱用材总的趋势是由大变小"〔教材p.278〕。')); g.appendChild(d); }
    // (2) 补间铺作
    { const d = h('div', { class: 'chart' }, '<h4>② 一间之内的补间铺作（立面示意）</h4>'); const svg = S('svg', { viewBox: '0 0 330 200' }, d);
      const list = D.eras.map((e, i) => [e, i]).filter(([e]) => typeof e.chart.bujian === 'number');
      list.forEach(([e, i], r) => { const y = 14 + r * 36, x0 = 70, x1 = 300; S('text', { x: 4, y: y + 18, 'font-size': 12, 'font-weight': on(i) ? 700 : 400, fill: on(i) ? col(i) : '#55514a' }, svg).textContent = e.n;
        S('rect', { x: x0 - 4, y: y + 10, width: 8, height: 20, fill: '#8c5a3c' }, svg); S('rect', { x: x1 - 4, y: y + 10, width: 8, height: 20, fill: '#8c5a3c' }, svg);
        S('line', { x1: x0, y1: y + 12, x2: x1, y2: y + 12, stroke: '#3f6e8c', 'stroke-width': 2 }, svg);
        const br = (x, big) => S('path', { d: `M${x - (big ? 9 : 6)},${y + 9} h${big ? 18 : 12} l-${big ? 3 : 2},-6 h-${big ? 12 : 8} z`, fill: on(i) ? col(i) : '#cfc8b8' }, svg);
        br(x0, true); br(x1, true); const n = e.chart.bujian; for (let k = 1; k <= n; k++) br(x0 + (x1 - x0) * k / (n + 1), false);
        S('text', { x: 316, y: y + 18, 'font-size': 11, 'text-anchor': 'end', fill: '#55514a' }, svg).textContent = n + (e.id === 'ming' ? '*' : ''); });
      d.appendChild(h('div', { class: 'cap' }, list.map(([e]) => e.n + '：' + e.chart.bujianNote).join('；') + '。* 明代仅有"更加繁密"的定性描述，4 朵为示意。')); g.appendChild(d); }
    // (3) 举高
    { const d = h('div', { class: 'chart' }, '<h4>③ 举高（屋顶高 ÷ 进深）</h4>'); const svg = S('svg', { viewBox: '0 0 330 170' }, d); let x = 12;
      D.eras.forEach((e, i) => { if (!e.chart.ju) return; const [r] = e.chart.ju; const B = 92, H = B * r; S('path', { d: `M${x},140 L${x + B / 2},${140 - H} L${x + B},140 Z`, fill: on(i) ? col(i) : '#e8e3d8', 'fill-opacity': on(i) ? .85 : 1, stroke: col(i), 'stroke-width': on(i) ? 2 : 1 }, svg); S('text', { x: x + B / 2, y: 156, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': on(i) ? 700 : 400 }, svg).textContent = e.n; S('text', { x: x + B / 2, y: 134 - H, 'text-anchor': 'middle', 'font-size': 10, fill: '#55514a' }, svg).textContent = e.chart.ju[1].split('（')[0]; x += B + 14; });
      d.appendChild(h('div', { class: 'cap' }, '唐南禅寺、佛光寺约 1/6，宋 1/4～1/3（图取 1/3.5），清某些建筑达 1/2〔教材p.279〕。另：p.158 称佛光寺约 1/4.77。辽金元、明教材未给统一数值，不画。')); g.appendChild(d); }
    // (4) 斗栱角色
    const roles = h('div', { style: 'margin-top:10px' }, '<b>斗栱结构作用：</b>' + D.eras.map((e, i) => `<span class="tag" style="${on(i) ? `border-color:${col(i)};color:${col(i)};font-weight:700` : ''}">${e.n}：${e.chart.role}</span>`).join(' → ') + '<div class="cap muted" style="font-size:.78rem">依据：唐"结构职能极其鲜明"(p.41)；明"斗栱的结构作用减小…昂成为纯装饰"(p.49)；清溜金斗栱"斜昂的结构作用至此已丧失殆尽"(p.279)。</div>');
    c.appendChild(roles);
    return c;
  }
  function presenceCard(ids) {
    const c = h('div', { class: 'card' }); c.innerHTML = '<h3>构件与做法的存续表</h3>';
    const P = D.presence; const idx = P.cols.map(id => D.eras.findIndex(e => e.id === id));
    let t = '<div class="tw"><table class="t pres"><tr><th>构件/做法</th>' + idx.map(i => `<th class="${i === TL.cur ? 'cur' : i === TL.cmp ? 'cmp' : ''}">${D.eras[i].n}</th>`).join('') + '<th>教材</th></tr>';
    P.rows.forEach(r => { t += `<tr><td><b>${r.n}</b></td>` + r.v.map((v, k) => `<td class="${idx[k] === TL.cur ? 'cur' : idx[k] === TL.cmp ? 'cmp' : ''}">${v}</td>`).join('') + `<td><small>${r.s}</small></td></tr>`; });
    c.innerHTML += t + '</table></div><p class="muted" style="font-size:.8rem">"—"＝教材未给出该期结论，不代表不存在。</p>';
    void ids; return c;
  }

  /* ================= 3 抬梁×穿斗 ================= */
  let vTL, vCD;
  function initCompare() {
    vTL = new Viewer('#vTL', MD.tailiang); vCD = new Viewer('#vCD', MD.chuandou);
    const bar = $('#syncBar'); const both = f => { f(vTL); f(vCD); };
    const mk = (t, f) => { const b = h('button', { class: 'chip', type: 'button' }, t); b.onclick = () => f(b); bar.appendChild(b); return b; };
    bar.appendChild(h('span', { class: 'muted', style: 'align-self:center;font-size:.86rem' }, '同步操作：'));
    mk('▶ 两边同时播放荷载', () => both(v => v.playLoad()));
    mk('隐藏/显示标注', () => { const v = !vTL.state.hidden; both(x => x.setHidden(v)); });
    mk('拆解/复原', () => { const v = !vTL.state.explode; both(x => x.setExplode(v)); });
    mk('考试线稿', () => { const v = !vTL.state.exam; both(x => x.setExam(v)); });
    ['column', 'beam', 'purlin', 'fang', 'strut'].forEach(cat => mk('高亮' + window.MGJ.CATS[cat].n, () => { const v = vTL.state.cat === cat ? null : cat; both(x => x.setCat(v)); }));
    const rows = [
      ['传力路径', '屋面→椽→檩→<b>梁</b>（→瓜柱→下层梁）→柱→柱础', '屋面→椽→檩→<b>柱</b>→柱础（不经过梁）'],
      ['柱', '柱少而粗；前后檐柱＋金柱', '柱多而细；每檩（或隔檩）一柱，中柱最高'],
      ['水平构件', '梁：受弯、承檩，需大料；枋：拉结', '穿枋：穿过柱身拉结成榀；斗枋：纵向串联——都不承檩'],
      ['用材', '用料粗大（北方屋面重、需保温防雪）〔p.5〕', '用料小，可用小材〔p.5〕'],
      ['空间', '梁跨大，减少柱子，室内空间大〔p.5〕', '柱密，只适合居室、杂屋等空间不大的房屋〔p.5〕'],
      ['柱网', '内部可少柱/无柱，进深方向柱距大', '进深方向柱距小而均匀'],
      ['整体性', '靠梁柱榫卯与枋拉结；斗栱/梁头承檐', '穿枋把柱串成整体框架，整体性强'],
      ['营造', '构件大、加工与吊装要求高；官式有模数（宋材、清斗口）', '构件小、易加工与预制，民间广泛采用'],
      ['地区与类型', '北方地区及宫殿、庙宇等较大建筑〔p.4〕', '江西、湖南、四川等南方地区〔p.4〕'],
      ['混合', '南方庙宇、厅堂常二者混用（中跨抬梁、山面穿斗）〔p.5〕', '同左'],
    ];
    $('#cmpTable').innerHTML = '<table class="t"><tr><th></th><th>抬梁式</th><th>穿斗式</th></tr>' + rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('') + '</table><div class="ev">依据：教材 p.4–5 定义与比较；"柱少而粗/柱多而细""易预制"等为据定义推出的理解性概括〔AI解释〕。</div>';
    const steps = (m, extra) => `<div><h4>${m.title}</h4><ol>${m.steps.map(s => `<li><b>${s.title}</b>：${s.hint}</li>`).join('')}</ol><div class="hint">${extra}</div><a class="chip" href="#draw/${m.id}">去画图训练 →</a></div>`;
    $('#cmpSteps').innerHTML = steps(MD.tailiang, '<b>三笔口诀：</b>柱（高低两种）→ 梁叠梁（五架、三架、瓜柱）→ 檩落梁头。') + steps(MD.chuandou, '<b>三笔口诀：</b>一排柱（中高边低）→ 檩直接放柱头 → 穿枋横穿。');
  }

  /* ================= 4 殿堂×厅堂 ================= */
  let vDT, vTT;
  function initFashi() {
    const ex = D.exams[0];
    $('#exam2026').innerHTML = `<h3>2026 浙大第57题 <span class="tag exam">${ex.s}</span> <span class="tag">${ex.id}</span></h3><p><b>${ex.q}</b></p><p class="muted" style="font-size:.84rem">${ex.note}</p>
      <details><summary>答题框架（定位→分论点→案例→收束）</summary><div>${frameHTML(ex.frame)}</div></details>
      <div class="seg"><a class="chip pri" href="#draw/tingtang">按步骤练画这张图</a><button class="chip" id="ttFocus" type="button">在右图逐段拆解题名</button></div>`;
    vDT = new Viewer('#vDT', MD.diantang); vTT = new Viewer('#vTT', MD.tingtang);
    vDT.setBands(true);
    $('#ttFocus').onclick = () => { $('#vTT').scrollIntoView({ behavior: 'smooth' }); nameWalk(); };
    const rows = [
      ['① 内外柱是否等高？', '等高（柱网层齐平）', '内柱高于檐柱（随举势定其短长）'],
      ['② 柱头上有没有一圈连续铺作（含内柱头）？', '有：内外柱头都有铺作，明栿落在铺作上 → 铺作层', '一般只在檐柱头有铺作；梁栿直接插入内柱'],
      ['③ 有无天花把梁分成明栿/草栿？', '有平棊/平闇，天花上为草架', '多彻上明造，梁架外露'],
      ['④ 梁架如何组织？', '水平分层叠垒（可分层"拆"开）', '按缝组合（每缝几柱、几栿可变化）'],
    ];
    $('#judge').innerHTML = '<table class="t"><tr><th>看什么</th><th>殿堂型</th><th>厅堂型</th></tr>' + rows.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('') + '</table><div class="ev">①有教材依据（p.157、p.274–275）；②③据教材 p.158 佛光寺与图8-3；④"水平分层/竖向分缝"为学界通行概括（陈明达、潘谷西等），教材无原句。试一试：把上面两张图都切到"隐藏标注模式"，用这四条自己判断。</div>';
    buildDecoder();
    $('#relTable').innerHTML = `<table class="t"><tr><th></th><th>殿堂型</th><th>厅堂型</th></tr>
      <tr><th>分类维度</th><td colspan="2">《营造法式》官式大木构架类型（另有余屋）；与"抬梁/穿斗"（传力方式）不是同一维度</td></tr>
      <tr><th>与抬梁式</th><td>梁（栿）承槫、梁上叠梁——属广义抬梁体系</td><td>同样梁上叠梁、栿承槫——属广义抬梁体系</td></tr>
      <tr><th>与穿斗式</th><td>无关：柱网整齐、铺作层隔开柱与屋架</td><td>梁栿插入内柱、串枋拉结，带"柱梁穿插"特点；但槫仍由栿承托，不是穿斗</td></tr>
      <tr><th>典型实例</th><td>佛光寺东大殿（唐）、独乐寺观音阁（辽）</td><td>《法式》厅堂侧样；宋辽金多数中小殿宇</td></tr></table><div class="ev">"属广义抬梁体系""带柱梁穿插特点"为理解性解释〔AI解释〕，答题时可写"笔者理解"。</div>`;
    $('#refFigs').innerHTML = `<figure><img src="img/ref/png2_46-1.png" alt="八架椽屋前后乳栿用四柱侧样复原"><figcaption>八架椽屋前后乳栿用四柱·侧样复原（台北科技大学《营造法式注释》大木作图样四十六建模，Hsieh & Chen，CC BY-NC-SA 4.0）。本站厅堂图的柱距与柱高取自此图。</figcaption></figure>
      <figure><img src="img/ref/png_perspective2_46-1.png" alt="八架椽屋前后乳栿用四柱轴测复原"><figcaption>同上·轴测复原（同一来源与许可）。</figcaption></figure>
      <figure><img src="img/textbook/fig8-3.jpg" alt="教材图8-3"><figcaption>教材图8-3《宋〈营造法式〉大木作示意图（殿堂）》（p.268）：注意 28–31 号草栿叠置、33/34 号明栿月梁、36 号平棊。</figcaption></figure>`;
  }
  function nameWalk() {
    const segs = [
      ['八架椽屋', ['chuan', 'jt', 'spt', 'spt_r', 'zpt', 'zpt_r', 'xpt', 'xpt_r', 'lyf', 'lyf_r'], '进深八椽：从前撩檐到后撩檐，屋面被各缝槫分成 8 段椽（脊槫两侧各 4 段）。'],
      ['前后乳栿', ['rf', 'rf_r'], '前、后各一根乳栿（跨两椽的梁），栿首在檐柱铺作上，栿尾插入内柱。'],
      ['（中跨）四椽栿', ['scf', 'pl', 'tf', 'tf_r'], '题名没写出的中跨：四椽栿跨 4 椽，上面驼峰承平梁。'],
      ['用四柱', ['yz', 'yz_r', 'nz', 'nz_r'], '一缝梁架用四根柱：两根檐柱＋两根升高的内柱。'],
    ];
    let i = 0;
    const step = () => { if (i >= segs.length) { vTT.focus(null); vTT.showInfoDefault(); return; } const s = segs[i++]; vTT.focus(s[1]); vTT.info.innerHTML = `<div class="vi-h">题名拆解 ${i}/${segs.length}：${s[0]}</div><div class="vi-b">${s[2]}</div><div class="vi-nav"><button class="chip pri" type="button">${i < segs.length ? '下一段 ▶' : '结束'}</button></div>`; vTT.info.querySelector('button').onclick = step; };
    step();
  }
  function frameHTML(f) { return `<p><b>定位一句：</b>${f.pos}</p><ol>${f.pts.map(p => `<li>${p}</li>`).join('')}</ol><p><b>案例依据：</b>${f.cases}</p><p><b>收束一句：</b>${f.end}</p>`; }
  function buildDecoder() {
    const host = $('#decoder');
    const sel = h('select', { class: 'chip sel', 'aria-label': '选择厅堂侧样名称' }); D.names.forEach((n, i) => sel.appendChild(h('option', { value: i }, n.n))); host.appendChild(sel);
    const nm = h('div', { class: 'nm', style: 'margin:10px 0' }); host.appendChild(nm);
    const box = h('div'); host.appendChild(box);
    const note = h('div', { class: 'ev' }); host.appendChild(note);
    let hl = null;
    const draw = () => {
      const n = D.names[+sel.value]; const m = n.n.match(/^(.+?架椽屋)(.*?)(用.柱)$/);
      const parts = m ? [m[1], m[2], m[3]] : [n.n];
      nm.innerHTML = parts.map((p, i) => `<span data-i="${i}" class="${hl === i ? 'on' : ''}">${p}</span>`).join('');
      nm.querySelectorAll('span').forEach(s => s.onclick = () => { hl = hl === +s.dataset.i ? null : +s.dataset.i; draw(); });
      const N = n.N, W = 520, x0 = 40, u = (W - 2 * x0) / N, base = 230, eaveY = 130, ridge = eaveY - N * 11;
      const ry = k => eaveY - (ridge - eaveY) * -1 * (1 - Math.abs(k - N / 2) / (N / 2)) ; // 屋面直线示意
      const svg = S('svg', { viewBox: `0 0 ${W} 260` }); box.innerHTML = ''; box.appendChild(svg);
      const X = k => x0 + k * u;
      S('line', { x1: 10, y1: base, x2: W - 10, y2: base, stroke: '#8d8676', 'stroke-width': 2 }, svg);
      // 屋面与槫
      const pts = []; for (let k = 0; k <= N; k++) pts.push([X(k), ry(k)]);
      S('polyline', { points: `${X(-0.6)},${ry(0) + 0.6 * u * (ridge - eaveY) / (N / 2 * u) * -1} ` + pts.map(p => p.join(',')).join(' ') + ` ${X(N + 0.6)},${ry(N) + 0.6 * u * (ridge - eaveY) / (N / 2 * u) * -1}`, fill: 'none', stroke: hl === 0 ? '#9b2f22' : '#555', 'stroke-width': hl === 0 ? 3 : 2 }, svg);
      pts.forEach((p, k) => { S('circle', { cx: p[0], cy: p[1], r: 5, fill: '#fff', stroke: '#c0392b', 'stroke-width': 2 }, svg); if (k < N) { const t = S('text', { x: (p[0] + pts[k + 1][0]) / 2, y: (p[1] + pts[k + 1][1]) / 2 - 10, 'text-anchor': 'middle', 'font-size': 12, fill: hl === 0 ? '#9b2f22' : '#8d8676', 'font-weight': hl === 0 ? 700 : 400 }, svg); t.textContent = k + 1; } });
      // 梁与柱
      const beamY = b => Math.max(ry(b[0]), ry(b[1])) + 14; // 梁位于较低一端槫下
      const colTop = {}; n.cols.forEach(c => colTop[c] = ry(c) + 14);
      n.beams.forEach(b => { const y = beamY(b); [b[0], b[1]].forEach(c => { if (c in colTop) colTop[c] = Math.min(colTop[c], y + 10); }); });
      n.cols.forEach(c => { const on = hl === 2; S('rect', { x: X(c) - 6, y: colTop[c], width: 12, height: base - colTop[c], fill: on ? '#f3c9b2' : '#ead9c9', stroke: on ? '#9b2f22' : '#8c5a3c', 'stroke-width': on ? 2.5 : 1.5 }, svg); });
      n.beams.forEach(b => { const y = beamY(b); const named = parts[1] && parts[1].includes(b[2].replace('栿', '')) || (parts[1] && parts[1].includes(b[2])); const on = hl === 1 && named; const implied = !named; S('rect', { x: X(b[0]) - 4, y, width: X(b[1]) - X(b[0]) + 8, height: 10, rx: 4, fill: on ? '#f6d28c' : '#f1e3c6', stroke: on ? '#9b2f22' : '#b5772a', 'stroke-width': on ? 2.5 : 1.3, 'stroke-dasharray': implied && hl === 1 ? '5 3' : 'none' }, svg); const t = S('text', { x: (X(b[0]) + X(b[1])) / 2, y: y + 24, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': on ? 700 : 400, fill: on ? '#9b2f22' : '#55514a' }, svg); t.textContent = b[2] + (implied ? '（题名未写）' : ''); });
      S('text', { x: W - 12, y: 252, 'text-anchor': 'end', 'font-size': 11, fill: '#8d8676' }, svg).textContent = `${N} 椽 · ${n.cols.length} 柱（上部平梁、蜀柱、叉手从略）`;
      note.innerHTML = (n.v ? '<span class="tag ev-a">已对照复原图</span>' : '<span class="tag ev-b">按命名规则推得 · 待对照《法式》原图</span>') + ' ' + (n.note || '') + '<br>命名规则：先说进深"×架椽屋"，再列出梁栿组合（乳栿＝两椽栿，劄牵＝一椽栿，"分心"＝正中一列柱），最后"用×柱"＝一缝梁架中落地的柱数。点题名的三段可分别高亮。';
    };
    sel.onchange = () => { hl = null; draw(); }; draw();
  }

  /* ================= 5 案例 ================= */
  let caseViewer = null, caseCur = null;
  function initCases() {
    const tabs = $('#caseTabs');
    D.cases.forEach(c => { const b = h('button', { class: 'chip', type: 'button', 'data-id': c.id }, c.n); b.onclick = () => showCase(c.id); tabs.appendChild(b); });
    if (!caseCur) showCase('foguang');
  }
  initCases.sub = id => { if (D.cases.some(c => c.id === id)) showCase(id); };
  pages.cases.sub = initCases.sub;
  function showCase(id) {
    caseCur = id; const c = D.cases.find(x => x.id === id);
    $('#caseTabs').querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    const body = $('#caseBody'); body.innerHTML = '';
    body.appendChild(h('div', { class: 'card' }, `<h3>${c.n} <small class="muted">${c.era} · ${c.place}</small></h3><p>${c.sig}</p><span class="tag ${evTag(c.ev)}">证据：${c.ev}</span>`));
    const g = h('div', { class: 'grid2' }); body.appendChild(g);
    const left = h('div', { class: 'card' }); g.appendChild(left);
    const ph = h('div', { class: 'photo' }); left.appendChild(ph);
    ph.appendChild(h('img', { src: c.photo.src, alt: c.n + '照片' }));
    const spotInfo = h('div', { class: 'vinfo' }, '<div class="vi-b">点击照片上的编号：看它是什么构件、在剖面里的哪个位置。</div>');
    c.photo.spots.forEach((s, i) => {
      const b = h('button', { class: 'spot', type: 'button', style: `left:${s.x}%;top:${s.y}%`, 'aria-label': s.n }, i + 1);
      b.onclick = () => { ph.querySelectorAll('.spot').forEach(x => x.classList.remove('on')); b.classList.add('on'); spotInfo.innerHTML = `<div class="vi-h">${i + 1}. ${s.n}</div><div class="vi-b">${s.d}</div>${s.part ? '<div class="vi-c">→ 右侧结构图已高亮对应构件</div>' : '<div class="vi-c">（此案例无可靠剖面，不做剖面定位）</div>'}`; if (s.part && caseViewer) { caseViewer.select(s.part); } };
      ph.appendChild(b);
    });
    left.appendChild(h('div', { class: 'photocap' }, c.photo.cap));
    left.appendChild(spotInfo);
    if (c.photo2) left.appendChild(h('div', { class: 'figs', style: 'margin-top:8px' }, `<figure><img src="${c.photo2.src}" alt="${c.n}"><figcaption>${c.photo2.cap}</figcaption></figure>`));
    const right = h('div'); g.appendChild(right);
    if (caseViewer) { caseViewer.destroy(); caseViewer = null; }
    if (c.model === 'shengqi') right.appendChild(shengqiCard());
    else if (c.model) { const vh = h('div'); right.appendChild(vh); caseViewer = new Viewer(vh, MD[c.model], { tools: ['mode', 'bands', 'cats', 'explode', 'exam'] }); if (c.model === 'guanyinge') caseViewer.setBands(true); }
    right.appendChild(h('div', { class: 'ev' }, c.modelNote));
    if (c.figs.length) body.appendChild(h('div', { class: 'card' }, '<h3>教材图（点图放大）</h3><div class="figs">' + c.figs.map(f => `<figure><img src="${f.src}" alt="${f.cap}"><figcaption>${f.cap}；教材图多引自刘敦桢《中国古代建筑史》等，仅供个人复习。</figcaption></figure>`).join('') + '</div>'));
    body.appendChild(h('div', { class: 'card' }, `<div class="grid2"><div><h4>它证明了什么</h4><p>${c.proves}</p><h4>考试最值得画的图</h4><p>${c.draw}</p><h4>真题关联</h4><p>${c.exam}</p></div><div><h4>30–60 秒口述模板</h4><div class="talk">${c.talk}</div><p class="muted" style="font-size:.8rem">约 ${c.talk.length} 字，正常语速约 ${Math.round(c.talk.length / 4.2)} 秒。</p></div></div>`));
  }
  function shengqiCard() {
    const c = h('div', { class: 'card' }, '<h4>"生起"概念演示（七间，竖向放大 20 倍）</h4>');
    const svg = S('svg', { viewBox: '0 0 520 230', style: 'width:100%;height:auto' }, c);
    const bays = [-3, -2, -1, 0, 1, 2, 3]; // 当心间居中；柱位 8 根
    const posts = [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5];
    const rise = x => { const k = Math.abs(x) - 0.5; return k <= 0 ? 0 : k * 2; }; // 寸：次间升二寸，逐间递增
    let on = true;
    const draw = () => {
      svg.innerHTML = ''; const X = x => 260 + x * 62, base = 200, H0 = 110, amp = on ? 3.2 : 0;
      S('line', { x1: 20, y1: base, x2: 500, y2: base, stroke: '#8d8676', 'stroke-width': 2 }, svg);
      const tops = posts.map(x => [X(x), base - H0 - rise(x) * amp]);
      posts.forEach((x, i) => { S('rect', { x: X(x) - 5, y: tops[i][1], width: 10, height: base - tops[i][1], fill: '#ead9c9', stroke: '#8c5a3c' }, svg); S('text', { x: X(x), y: 216, 'text-anchor': 'middle', 'font-size': 11, fill: '#55514a' }, svg).textContent = '+' + rise(x) + '寸'; });
      const eave = tops.map(p => [p[0], p[1] - 28]);
      S('polyline', { points: [[X(-4.1), eave[0][1] - 8]].concat(eave).concat([[X(4.1), eave[7][1] - 8]]).map(p => p.join(',')).join(' '), fill: 'none', stroke: '#9b2f22', 'stroke-width': 3 }, svg);
      S('polyline', { points: tops.map(p => p.join(',')).join(' '), fill: 'none', stroke: '#3f6e8c', 'stroke-width': 2 }, svg);
      S('text', { x: 260, y: 30, 'text-anchor': 'middle', 'font-size': 12, fill: '#9b2f22' }, svg).textContent = on ? '有生起：檐口成缓和曲线（仅当心间为直线段）' : '无生起：檐口为直线';
      void bays;
    };
    draw();
    const b = h('button', { class: 'chip', type: 'button' }, '切换 有/无 生起'); b.onclick = () => { on = !on; draw(); }; c.appendChild(b);
    c.appendChild(h('p', { class: 'muted', style: 'font-size:.82rem' }, '《法式》："当心间柱不升起，次间柱升二寸，以下各间依此递增"，七开间角柱较当心间高 6 寸〔教材p.275〕。另有"侧脚"：外檐柱前后檐向内倾柱高 10/1000、两山 8/1000〔同页〕。本图只示意规律，非圣母殿实测。'));
    return c;
  }

  /* ================= 6 画图训练 ================= */
  const TR = [
    { id: 'tingtang', n: '八架椽屋前后乳栿用四柱', model: 'tingtang', tag: '2026 真题 10分', task: '画出《营造法式》厅堂型"八架椽屋前后乳栿用四柱"横剖面简图，标注主要构件，并写 3 条特点。建议 8 分钟。' },
    { id: 'tailiang', n: '抬梁式', model: 'tailiang', tag: '2025 真题 10分', task: '画抬梁式木构架剖面简图（清式即可），标出柱、梁、瓜柱、檩、枋，并用箭头表示荷载传递。建议 5 分钟。' },
    { id: 'chuandou', n: '穿斗式', model: 'chuandou', tag: '2025 真题 10分', task: '画穿斗式木构架剖面简图，标出柱、檩、穿枋、斗枋，说明与抬梁式的区别。建议 4 分钟。' },
    { id: 'diantang', n: '殿堂型（金箱斗底槽）', model: 'diantang', tag: '2012/2018 相关', task: '画《营造法式》殿堂型剖面简图，分出柱网层、铺作层、屋架层，标出明栿、草栿、天花、铺作。建议 8 分钟。' },
    { id: 'foguang', n: '佛光寺东大殿剖面', model: 'diantang', tag: '教材图5-3 有依据', task: '凭记忆画佛光寺东大殿横剖面关系：内外柱等高、七铺作出跳、明乳栿与四椽明栿、平闇、草栿、叉手。画完对照教材图5-3。', final: { src: 'img/textbook/fig5-3.jpg', cap: '教材图5-3 佛光寺大殿剖面 A-A（p.157）', diff: '与本站殿堂示意的差异：佛光寺天花上是草乳栿＋四椽草栿（不是八/六/四椽栿叠置）；脊槫下无侏儒柱只用叉手；屋面更平缓（约1/4.77）。' } },
  ];
  let trV = null, trCur = null, trTimer = null;
  function initDraw() {
    const tabs = $('#drawTabs');
    TR.forEach(t => { const b = h('button', { class: 'chip', type: 'button', 'data-id': t.id }, t.n); b.onclick = () => showTrain(t.id); tabs.appendChild(b); });
    if (!trCur) showTrain('tingtang');
  }
  pages.draw.sub = id => { if (TR.some(t => t.id === id)) showTrain(id); };
  function showTrain(id) {
    trCur = id; const T = TR.find(t => t.id === id); const M = MD[T.model];
    $('#drawTabs').querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    clearInterval(trTimer); if (trV) { trV.destroy(); trV = null; }
    const body = $('#drawBody'); body.innerHTML = '';
    const top = h('div', { class: 'card' }, `<h3>目标：${T.n} <span class="tag exam">${T.tag}</span></h3><p>${T.task}</p>`);
    const ctl = h('div', { class: 'seg' }); top.appendChild(ctl);
    const tm = h('span', { class: 'timer' }, '00:00'); let sec = 0, run = false;
    const tb = h('button', { class: 'chip', type: 'button' }, '开始计时'); tb.onclick = () => { run = !run; tb.textContent = run ? '暂停' : '继续计时'; if (run) trTimer = setInterval(() => { sec++; tm.textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); }, 1000); else clearInterval(trTimer); };
    ctl.append(tb, tm);
    body.appendChild(top);
    const hints = h('div', { class: 'card' }, '<h4>提示（只给文字，不给图）</h4>'); const hl = h('ol'); hints.appendChild(hl);
    let hi = 0;
    const hb = h('button', { class: 'chip', type: 'button' }, `提示第 1 步应该画什么`); hb.onclick = () => { if (hi >= M.steps.length) return; const s = M.steps[hi++]; hl.appendChild(h('li', null, `<b>${s.title}</b>：${s.hint}`)); hb.textContent = hi < M.steps.length ? `提示第 ${hi + 1} 步` : '提示已全部给出'; hb.disabled = hi >= M.steps.length; };
    hints.appendChild(hb); body.appendChild(hints);
    const stageCard = h('div', { class: 'card' }, '<h4>参考图</h4>'); body.appendChild(stageCard);
    const sc = h('div', { class: 'seg' }); stageCard.appendChild(sc);
    const stage = h('div', { class: 'stage' }); stageCard.appendChild(stage);
    const ph = h('div', { class: 'hint' }, '参考图已隐藏。先自己画，再按需要逐步显示。'); stage.appendChild(ph);
    const vh = h('div', { style: 'display:none' }); stage.appendChild(vh);
    const reveal = () => { ph.style.display = 'none'; vh.style.display = ''; if (!trV) { trV = new Viewer(vh, M, { tools: ['mode', 'exam', 'cats', 'load'] }); } };
    let si = -1;
    const b1 = h('button', { class: 'chip', type: 'button' }, '逐步显示参考（第 1 步）');
    b1.onclick = () => { reveal(); si = Math.min(si + 1, M.steps.length - 1); trV.setStep(si); trV.setHidden(true); b1.textContent = si < M.steps.length - 1 ? `显示第 ${si + 2} 步` : '已到最后一步'; };
    const b2 = h('button', { class: 'chip pri', type: 'button' }, '显示完整标注参考图'); b2.onclick = () => { reveal(); trV.setStep(null); trV.setHidden(false); trV.setExam(false); finalBox.style.display = ''; };
    const b3 = h('button', { class: 'chip', type: 'button' }, '切换：完整图 / 考试简图'); b3.onclick = () => { reveal(); trV.setExam(!trV.state.exam); };
    const b4 = h('button', { class: 'chip', type: 'button' }, '重来'); b4.onclick = () => showTrain(id);
    sc.append(b1, b2, b3, b4);
    const finalBox = h('div', { style: 'display:none' });
    if (T.final) finalBox.innerHTML = `<div class="figs" style="margin-top:10px"><figure><img src="${T.final.src}" alt="${T.final.cap}"><figcaption>${T.final.cap}</figcaption></figure></div><div class="warn">${T.final.diff}</div>`;
    else finalBox.innerHTML = `<div class="ev">${M.evidence}</div>`;
    stageCard.appendChild(finalBox);
    body.appendChild(padCard());
  }
  function padCard() {
    const c = h('div', { class: 'card' }, '<h4>手绘画板（可选；考试仍以纸笔为主）</h4>');
    const box = h('div', { class: 'padbox' }); const cv = h('canvas'); box.appendChild(cv); c.appendChild(box);
    const ctl = h('div', { class: 'seg' }); c.appendChild(ctl);
    const ctx = cv.getContext('2d'); const strokes = []; let cur = null, pen = 2.2, erase = false;
    const fit = () => { const w = box.clientWidth; const r = window.devicePixelRatio || 1; cv.width = w * r; cv.height = Math.round(w * 0.55) * r; cv.style.height = Math.round(w * 0.55) + 'px'; ctx.setTransform(r, 0, 0, r, 0, 0); redraw(); };
    const grid = () => { const w = cv.width / (window.devicePixelRatio || 1), hh = cv.height / (window.devicePixelRatio || 1); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, hh); ctx.strokeStyle = '#eee8dc'; ctx.lineWidth = 1; for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, hh); ctx.stroke(); } for (let y = 0; y < hh; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } };
    const redraw = () => { grid(); strokes.forEach(s => { ctx.strokeStyle = s.e ? '#fff' : '#1d1b18'; ctx.lineWidth = s.e ? 16 : s.w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); s.p.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }); };
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); cur = { p: [pos(e)], w: pen, e: erase }; strokes.push(cur); });
    cv.addEventListener('pointermove', e => { if (!cur) return; cur.p.push(pos(e)); redraw(); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { cur = null; }));
    const mk = (t, f) => { const b = h('button', { class: 'chip', type: 'button' }, t); b.onclick = () => f(b); ctl.appendChild(b); return b; };
    const pb = mk('笔', b => { erase = false; b.classList.add('on'); eb.classList.remove('on'); }); pb.classList.add('on');
    const eb = mk('橡皮', b => { erase = true; b.classList.add('on'); pb.classList.remove('on'); });
    mk('撤销', () => { strokes.pop(); redraw(); });
    mk('清空', () => { strokes.length = 0; redraw(); });
    setTimeout(fit, 0); window.addEventListener('resize', fit);
    return c;
  }

  /* ================= 7 自测 ================= */
  const QKEY = 'mgj.quiz.v1';
  const Q = (() => { try { return JSON.parse(localStorage.getItem(QKEY)) || { log: [], last: {} }; } catch (e) { return { log: [], last: {} }; } })();
  const saveQ = () => { try { localStorage.setItem(QKEY, JSON.stringify(Q)); } catch (e) { /* 隐私模式下不保存 */ } };
  const GN = { ok: '正确', part: '部分正确', bad: '错误' };
  function record(cat, id, q, g) { Q.last[id] = g; Q.log.unshift({ cat, id, q, g, t: new Date().toLocaleString('zh-CN', { hour12: false }) }); Q.log = Q.log.slice(0, 200); saveQ(); renderStats(); }
  const typeModels = ['tailiang', 'chuandou', 'diantang', 'tingtang'];
  const typeName = { tailiang: '抬梁式', chuandou: '穿斗式', diantang: '殿堂型', tingtang: '厅堂型' };
  const partNames = m => [...new Set(MD[m].parts.filter(p => p.lab).map(p => p.name))];
  const universe = () => ({
    A: typeModels.map(m => 'A:type:' + m).concat(D.quiz.figs.map(f => 'A:fig:' + f.id)),
    B: typeModels.flatMap(m => partNames(m).map(n => 'B:' + m + ':' + n)),
    C: (() => { const a = []; for (let i = 0; i < D.eras.length; i++) for (let j = i + 1; j < D.eras.length; j++) a.push('C:' + D.eras[i].id + '-' + D.eras[j].id); return a; })(),
    D: D.exams.map(e => 'D:' + e.id),
  });
  const CATN = { A: 'A 看图识别', B: 'B 构件标注', C: 'C 时间线串讲', D: 'D 论述框架' };
  function renderStats() {
    const U = universe(); const box = $('#qstat'); if (!box) return; box.innerHTML = '';
    Object.keys(U).forEach(k => { const cnt = { ok: 0, part: 0, bad: 0, none: 0 }; U[k].forEach(id => cnt[Q.last[id] || 'none']++);
      box.appendChild(h('div', { class: 's' }, `<small>${CATN[k]}（${U[k].length}项）</small><div><span class="st-ok">正确 ${cnt.ok}</span> · <span class="st-part">部分 ${cnt.part}</span> · <span class="st-bad">错误 ${cnt.bad}</span> · <span class="st-none">未测 ${cnt.none}</span></div>`)); });
    const lg = $('#qlog'); if (lg) lg.innerHTML = Q.log.length ? '<table class="t"><tr><th>类型</th><th>题目</th><th>结果</th><th>时间</th></tr>' + Q.log.slice(0, 30).map(r => `<tr><td>${r.cat}</td><td>${esc(r.q)}</td><td class="st-${r.g}">${GN[r.g]}</td><td>${r.t}</td></tr>`).join('') + '</table><div class="seg"><button class="chip" type="button" id="qclear">清空本机记录</button></div>' : '<p class="muted">尚无记录。</p>';
    const qc = $('#qclear'); if (qc) qc.onclick = () => { if (confirm('确定清空本机自测记录？')) { Q.log = []; Q.last = {}; saveQ(); renderStats(); } };
  }
  function gradeBar(cat, id, q, after) {
    const g = h('div', { class: 'grade' }, '<span class="muted" style="align-self:center">如实自评：</span>');
    Object.keys(GN).forEach(k => { const b = h('button', { class: 'chip', type: 'button', 'data-g': k }, GN[k]); b.onclick = () => { record(cat, id, q, k); g.querySelectorAll('.chip').forEach(x => x.disabled = true); b.classList.add('on'); if (after) after(); }; g.appendChild(b); });
    return g;
  }
  let qV = null;
  function initQuiz() {
    const tabs = $('#quizTabs');
    [['A', 'A 看图识别'], ['B', 'B 构件标注'], ['C', 'C 时间线串讲'], ['D', 'D 论述题框架']].forEach(([k, n]) => { const b = h('button', { class: 'chip', type: 'button', 'data-k': k }, n); b.onclick = () => showQuiz(k); tabs.appendChild(b); });
    renderStats(); showQuiz('A');
  }
  function newQV(host, m) { if (qV) qV.destroy(); const mm = clone(MD[m]); mm.title = '？'; mm.intro = '（作答前不显示名称）'; mm.footnote = ''; qV = new Viewer(host, mm, { tools: [] }); qV.setHidden(true); qV._quizLock = true; if (qV.legend) qV.legend.style.display = 'none'; return qV; }
  function showQuiz(k) {
    $('#quizTabs').querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    const body = $('#quizBody'); body.innerHTML = ''; if (qV) { qV.destroy(); qV = null; }
    const c = h('div', { class: 'card' }); body.appendChild(c);
    const next = h('button', { class: 'chip', type: 'button' }, '换一题 ↻'); next.onclick = () => showQuiz(k);
    if (k === 'A') {
      const pool = typeModels.map(m => ({ t: 'type', m })).concat(D.quiz.figs.map(f => ({ t: 'fig', f })));
      const it = pool[Math.floor(Math.random() * pool.length)];
      if (it.t === 'type') {
        c.innerHTML = '<h3>这是哪种构架？</h3><p class="muted">标注已隐藏。可以点构件观察，但不会显示名称。</p>';
        const vh = h('div'); c.appendChild(vh); newQV(vh, it.m);
        const opts = h('div', { class: 'opts' }); c.appendChild(opts);
        const ans = h('div', { class: 'ans' }); c.appendChild(ans);
        shuffle(typeModels).forEach(m => { const b = h('button', { class: 'chip', type: 'button' }, typeName[m]); b.onclick = () => { const ok = m === it.m; b.classList.add(ok ? 'right' : 'wrong'); opts.querySelectorAll('.chip').forEach(x => { x.disabled = true; if (x.textContent === typeName[it.m]) x.classList.add('right'); }); record('A', 'A:type:' + it.m, '构架识别：' + typeName[it.m], ok ? 'ok' : 'bad'); qV.setHidden(false); qV._quizLock = false; if (qV.legend) qV.legend.style.display = ''; ans.innerHTML = `<b>${ok ? '正确' : '错误'}。</b>这是${typeName[it.m]}。判断依据：${{ tailiang: '檩搁在梁头上，梁上立瓜柱再架梁（层层抬起）。', chuandou: '檩直接落在柱头上，柱密，穿枋横穿各柱。', diantang: '内外柱等高；柱头一圈铺作＋明栿＋天花构成铺作层；天花上为草栿。', tingtang: '内柱高于檐柱，乳栿/劄牵插入内柱，彻上明造，按缝组合。' }[it.m]}`; ans.classList.add('on'); }; opts.appendChild(b); });
      } else {
        const f = it.f; c.innerHTML = `<h3>看图回答</h3><div class="figs" style="max-width:640px"><figure><img src="${f.src}" alt="题图"><figcaption>题图（教材图，图题已遮挡于题干之外；若图中可见图题，请自觉不看）</figcaption></figure></div><p><b>${f.q}</b></p>`;
        const ans = h('div', { class: 'ans' }, f.a); const sb = h('button', { class: 'chip pri', type: 'button' }, '我答完了，显示答案'); sb.onclick = () => { ans.classList.add('on'); sb.remove(); c.appendChild(gradeBar('A', 'A:fig:' + f.id, '看图：' + f.q.slice(0, 18) + '…')); }; c.append(sb, ans);
      }
    } else if (k === 'B') {
      c.innerHTML = '<h3>闪烁的构件叫什么？</h3>';
      const seg = h('div', { class: 'seg' }); c.appendChild(seg);
      const area = h('div'); c.appendChild(area);
      const run = m => { seg.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.m === m)); area.innerHTML = ''; const vh = h('div'); area.appendChild(vh); newQV(vh, m);
        const names = partNames(m); const name = names[Math.floor(Math.random() * names.length)]; const p = MD[m].parts.find(x => x.name === name && x.lab); qV.pulse(p.id);
        const opts = h('div', { class: 'opts' }); area.appendChild(opts); const ans = h('div', { class: 'ans' }); area.appendChild(ans);
        shuffle([name].concat(shuffle(names.filter(n => n !== name)).slice(0, 3))).forEach(n => { const b = h('button', { class: 'chip', type: 'button' }, n); b.onclick = () => { const ok = n === name; b.classList.add(ok ? 'right' : 'wrong'); opts.querySelectorAll('.chip').forEach(x => { x.disabled = true; if (x.textContent === name) x.classList.add('right'); }); record('B', 'B:' + m + ':' + name, typeName[m] + '·' + name, ok ? 'ok' : 'bad'); ans.innerHTML = `<b>${name}</b>${p.alias ? '（' + p.alias + '）' : ''}：${p.desc}`; ans.classList.add('on'); }; opts.appendChild(b); });
        const nb = h('button', { class: 'chip', type: 'button' }, '下一个构件'); nb.onclick = () => run(m); area.appendChild(nb); };
      typeModels.forEach(m => { const b = h('button', { class: 'chip', type: 'button', 'data-m': m }, typeName[m]); b.onclick = () => run(m); seg.appendChild(b); });
      run(typeModels[Math.floor(Math.random() * 4)]);
    } else if (k === 'C') {
      let i = Math.floor(Math.random() * D.eras.length), j; do { j = Math.floor(Math.random() * D.eras.length); } while (j === i); if (i > j) [i, j] = [j, i];
      const a = D.eras[i], b = D.eras[j];
      c.innerHTML = `<h3>口头串讲：${a.n} → ${b.n}</h3><p>闭上资料，用约 60 秒讲清：起点特点 → 发生了哪些结构变化 → 为什么 → 用哪个建筑证明 → 一个例外。</p>`;
      const tm = h('span', { class: 'timer' }, '60'); let t = 60; const iv = setInterval(() => { t--; tm.textContent = t; if (t <= 0) { clearInterval(iv); tm.textContent = '时间到'; } }, 1000); c.appendChild(tm);
      const ans = h('div', { class: 'ans' }); let html = `<p><b>${a.n}：</b>${a.one}</p><ol>`; for (let k2 = i + 1; k2 <= j; k2++) html += `<li><b>${D.eras[k2].n}</b>：${D.eras[k2].one}<br><small>证据：${D.eras[k2].case.n}；例外：${D.eras[k2].ex}</small></li>`; ans.innerHTML = html + '</ol>';
      const sb = h('button', { class: 'chip pri', type: 'button' }, '讲完了，看要点'); sb.onclick = () => { clearInterval(iv); ans.classList.add('on'); sb.remove(); c.appendChild(gradeBar('C', 'C:' + a.id + '-' + b.id, '串讲 ' + a.n + '→' + b.n)); }; c.append(h('div'), sb, ans);
    } else {
      const sel = h('select', { class: 'chip sel' }); D.exams.forEach((e, i) => sel.appendChild(h('option', { value: i }, `${e.y} · ${e.q.slice(0, 26)}…`))); c.appendChild(h('h3', null, '3 分钟论述框架')); c.appendChild(sel);
      const area = h('div'); c.appendChild(area);
      const run = () => { area.innerHTML = ''; const e = D.exams[+sel.value];
        area.innerHTML = `<p><span class="tag ${String(e.y).includes('自拟') ? 'ev-c' : 'exam'}">${String(e.y).includes('自拟') ? '自拟题（非真题）' : '真题 ' + e.y}</span> <span class="tag">${e.id}</span> <span class="tag">${e.s}</span></p><p><b>${e.q}</b></p><p class="muted" style="font-size:.82rem">${e.note}</p><p>按"定位一句 → 3–5 个分论点 → 案例依据 → 收束一句"写提纲：</p>`;
        const tm = h('span', { class: 'timer' }, '3:00'); let t = 180; const iv = setInterval(() => { t--; tm.textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); if (t <= 0) { clearInterval(iv); tm.textContent = '时间到'; } }, 1000);
        const ta = h('textarea', { placeholder: '定位：\n1.\n2.\n3.\n案例：\n收束：' });
        const ans = h('div', { class: 'ans' }, frameHTML(e.frame) + '<p class="muted" style="font-size:.8rem">参考框架由本站整理（教材依据见各条），不是官方答案。</p>');
        const sb = h('button', { class: 'chip pri', type: 'button' }, '写完了，对照参考框架'); sb.onclick = () => { clearInterval(iv); ans.classList.add('on'); sb.remove(); area.appendChild(gradeBar('D', 'D:' + e.id, '论述：' + e.q.slice(0, 20) + '…')); };
        area.append(tm, ta, sb, ans); sel.onchange = () => { clearInterval(iv); run(); }; };
      sel.value = Math.floor(Math.random() * D.exams.length); run();
    }
    c.appendChild(h('div', { style: 'margin-top:10px' })).appendChild(next);
  }

  /* ================= 资料 ================= */
  function initSources() {
    $('#srcBody').innerHTML = `
    <div class="card"><h3>证据分级（全站统一）</h3><table class="t">
      <tr><th>标签</th><th>含义</th><th>例</th></tr>
      <tr><td><span class="tag ev-a">A</span>〔教材p.x〕</td><td>《中国建筑史》第7版原文或原图，页码为印刷页码（按 OCR 文本版〔教材页码M〕核出）</td><td>抬梁/穿斗定义 p.4；佛光寺 p.156–158</td></tr>
      <tr><td><span class="tag exam">真题</span></td><td>本地真题库记录（ID 可检索）。2025、2026 来自补充扫描，<b>非官方</b>；扫描件上的答案标记不作为官方答案</td><td>ZJU-AB-2026-BP-CALC-005（八架椽屋）</td></tr>
      <tr><td><span class="tag ev-b">B</span>示意</td><td>本站绘制的结构示意：构件关系按依据绘制，尺寸与细部简化；非测绘</td><td>殿堂型示意、观音阁概念图</td></tr>
      <tr><td><span class="tag ev-c">C</span>〔AI解释〕〔待核〕</td><td>理解性概括或尚未核实的细节</td><td>"厅堂带柱梁穿插特点"；南禅寺 782 年</td></tr>
    </table></div>
    <div class="card"><h3>主要依据</h3><ul>
      <li>教材：潘谷西主编《中国建筑史》（第7版），仓库 <code>学习资料/01_中国建筑史/中国建筑史第7版_OCR文本版.md</code>。教材图片从本地 OCR 资料提取，仅供个人复习。</li>
      <li>真题：<code>AI输出/00_复习管理/真题库/浙江大学建筑学考研真题_AI检索整合库_2005-2026.md</code>。</li>
      <li>厅堂复原：台北科技大学《营造法式注释》大木作图样建模（tjhsieh.github.io/yingzaofashi，图样四十六，CC BY-NC-SA 4.0）。</li>
      <li>照片：Wikimedia Commons，各图署名与许可见案例页（CC BY-SA 3.0/4.0、CC BY 3.0）。</li>
      <li>《营造法式》举折之制、厅堂侧样名称：据《法式》卷五、卷三十一通行整理本；殿堂"三层"概括据陈明达等学界通行解读——教材无原句。</li>
    </ul></div>
    <div class="card"><h3>尚未核实（请勿当作定论）</h3><ol>
      <li>2026 第57题题面来自补充扫描 OCR（"乳袱"即"乳栿"）；题库将其误归"建筑物理/计算题"。</li>
      <li>2025 中建史画图题在库中无独立 ID；2025 画图题总分 40 vs 60 存在版本分歧。</li>
      <li>2026 第12题（宋清斗栱名称）在两份 docx 中都找不到，来源待核；第14题"唐1/2、宋1/3、明1/4、清1/5"——教材只给出唐佛光寺"约1/2"，其余比例未检出，本站不采用。</li>
      <li>厅堂命名解码器中除"八架椽屋前后乳栿用四柱"外，其余柱位按命名规则推得，待对照《法式》卷三十一原图。</li>
      <li>南禅寺 782 年、晋祠圣母殿创建/重修年份、太和殿 1695 年重建、圣母殿盘龙柱：通行说，教材本次检索未检出。</li>
      <li>教材 p.296"雍正十二年（公元1743年）"与公历换算不符（应为 1734），疑为笔误。</li>
      <li>举高：教材 p.279 称唐南禅寺、佛光寺约 1/6，p.158 称佛光寺约 1/4.77，两处口径不一。</li>
    </ol></div>
    <p>完整清单见站点同级目录的 <code>sources.md</code>；复习提纲见 <code>summary.md</code> 与 <code>notion.md</code>。</p>`;
  }

  route();
})();
