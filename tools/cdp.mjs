// 极简 CDP 驱动：node tools/cdp.mjs <script.json>
// script: { url, shots:[{name, w, h, mobile, hash, eval:[js...], wait, full}] }
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const cfg = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const port = 9333 + Math.floor(Math.random() * 500);
const prof = mkdtempSync(join(tmpdir(), 'cdp-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--hide-scrollbars', '--font-render-hinting=none', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50; i++) { try { const r = await fetch(`http://127.0.0.1:${port}/json/list`); const j = await r.json(); const p = j.find(t => t.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch (e) { } await sleep(200); }
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; const errors = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } else if (d.method === 'Runtime.exceptionThrown') errors.push('EXC ' + JSON.stringify(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text)); else if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errors.push('CONSOLE ' + d.params.args.map(a => a.value || a.description).join(' ')); else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errors.push('LOG ' + d.params.entry.text + ' ' + (d.params.entry.url || '')); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
for (const s of cfg.shots) {
  await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: s.dpr || 1, mobile: !!s.mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: !!s.mobile });
  await send('Page.navigate', { url: cfg.url + (s.hash || '') });
  await sleep(s.load || 1200);
  if (s.hash) { await send('Runtime.evaluate', { expression: `location.hash=${JSON.stringify(s.hash)}` }); await sleep(400); }
  for (const e of s.eval || []) { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) errors.push('EVAL ' + e.slice(0, 60) + ' => ' + r.result.exceptionDetails.exception?.description); else if (r.result?.result?.value !== undefined && s.print) console.log(s.name, '=>', JSON.stringify(r.result.result.value)); await sleep(s.step || 350); }
  await sleep(s.wait || 300);
  let clip;
  if (s.full) { const m = await send('Page.getLayoutMetrics'); const H = Math.min(m.result.cssContentSize.height, s.maxH || 6000); await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: Math.ceil(H), deviceScaleFactor: s.dpr || 1, mobile: !!s.mobile }); await sleep(400); }
  const r = await send('Page.captureScreenshot', { format: 'png', clip });
  if (s.name) { writeFileSync(s.name, Buffer.from(r.result.data, 'base64')); console.log('shot', s.name); }
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
ws.close(); chrome.kill();
process.exit(0);
