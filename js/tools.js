// 实用小工具：便利贴 / 精炼时段(番茄钟) / 倒计时 / 老板键
import { S, save, addGongfen, uid, RULES, localDate } from './state.js';
import { pickQuip } from './quips.js';
import { showBubble } from './scene.js';
import { refreshHud } from './hud.js';

// ============ 便利贴 ============
const stickyPane = document.getElementById('pane-sticky');

export function initSticky() {
  stickyPane.innerHTML = `
    <h3>便利贴 · 今日待办</h3>
    <div class="sticky-add">
      <input id="sticky-input" maxlength="80" placeholder="写点要做的（哪怕是假装要做的）" />
      <button id="sticky-add-btn">贴上</button>
    </div>
    <ul class="sticky-list" id="sticky-list"></ul>`;
  document.getElementById('sticky-add-btn').onclick = addSticky;
  document.getElementById('sticky-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSticky();
  });
  renderStickies();
}

function addSticky() {
  const input = document.getElementById('sticky-input');
  const text = input.value.trim();
  if (!text) return;
  S.stickies.unshift({ id: uid(), text, done: false, awarded: false });
  input.value = '';
  save();
  renderStickies();
}

function toggleSticky(id) {
  const s = S.stickies.find((x) => x.id === id);
  if (!s) return;
  s.done = !s.done;
  // 首次完成才给奖励，防止反复勾选刷工分
  if (s.done && !s.awarded) {
    s.awarded = true;
    addGongfen(RULES.bonusTodo);
    if (S.current) S.current.todosDone += 1;
    const q = pickQuip('todoDone');
    if (q) showBubble(q.text);
    refreshHud();
  }
  save();
  renderStickies();
}

function delSticky(id) {
  S.stickies = S.stickies.filter((x) => x.id !== id);
  save();
  renderStickies();
}

function renderStickies() {
  const list = document.getElementById('sticky-list');
  if (!list) return;
  if (!S.stickies.length) {
    list.innerHTML = `<li style="opacity:.6;font-size:12px;transform:none;background:none;border:none;box-shadow:none;">空空如也。部门欣赏你的留白。</li>`;
    return;
  }
  list.innerHTML = '';
  for (const s of S.stickies) {
    const li = document.createElement('li');
    li.className = 'sticky-item' + (s.done ? ' done' : '');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = s.done;
    cb.onchange = () => toggleSticky(s.id);
    const span = document.createElement('span');
    span.textContent = s.text;
    const del = document.createElement('button');
    del.className = 'del'; del.textContent = '✕'; del.title = '撕掉';
    del.onclick = () => delSticky(s.id);
    li.append(cb, span, del);
    list.appendChild(li);
  }
}

// ============ 精炼时段（番茄钟 Pro：自定时长 / 时间标签 / 统计 / 删除） ============
const pomoPane = document.getElementById('pane-pomodoro');
let pomo = { total: 1500, left: 1500, running: false, timer: null, label: '', minutes: 25 };

function clampMin(m) { return Math.max(1, Math.min(180, m || 25)); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

export function initPomodoro() {
  pomo.minutes = clampMin(S.pomodoro.lastMinutes);
  pomo.total = pomo.minutes * 60; pomo.left = pomo.total;
  pomo.label = S.pomodoro.lastLabel || '';
  pomoPane.innerHTML = `
    <h3>精炼时段</h3>
    <input id="pomo-label" class="tool-input" maxlength="24" placeholder="这段时间在精炼什么？（标签）" value="${esc(pomo.label)}" />
    <div class="pomo-row">
      <input id="pomo-min" type="number" min="1" max="180" value="${pomo.minutes}" /><span>分钟</span>
      <div class="pomo-presets">
        <button data-min="25">25</button><button data-min="45">45</button>
        <button data-min="5">5</button><button data-min="90">90</button>
      </div>
    </div>
    <div class="pomo-time" id="pomo-time">25:00</div>
    <div class="pomo-state" id="pomo-state">把一段时间献给神秘而重要的工作</div>
    <div class="pomo-btns">
      <button id="pomo-toggle">开始精炼</button>
      <button id="pomo-reset">重置</button>
    </div>
    <div id="pomo-stats"></div>
    <div id="pomo-history"></div>`;
  const labelEl = pomoPane.querySelector('#pomo-label');
  labelEl.oninput = () => { pomo.label = labelEl.value; S.pomodoro.lastLabel = pomo.label; save(); };
  const minEl = pomoPane.querySelector('#pomo-min');
  minEl.onchange = () => { minEl.value = clampMin(parseInt(minEl.value, 10)); setPomo(parseInt(minEl.value, 10) * 60); };
  pomoPane.querySelector('#pomo-toggle').onclick = togglePomo;
  pomoPane.querySelector('#pomo-reset').onclick = resetPomo;
  pomoPane.querySelectorAll('.pomo-presets button').forEach((b) => {
    b.onclick = () => { minEl.value = b.dataset.min; setPomo(parseInt(b.dataset.min, 10) * 60); };
  });
  renderPomo();
  renderPomoStats();
}

function renderPomo() {
  const t = pomoPane.querySelector('#pomo-time');
  if (!t) return;
  const m = String(Math.floor(pomo.left / 60)).padStart(2, '0');
  const s = String(pomo.left % 60).padStart(2, '0');
  t.textContent = `${m}:${s}`;
  pomoPane.querySelector('#pomo-toggle').textContent = pomo.running ? '暂停' : '开始精炼';
}

function setPomo(sec) {
  stopPomo();
  pomo.minutes = Math.round(sec / 60); pomo.total = sec; pomo.left = sec; pomo.running = false;
  S.pomodoro.lastMinutes = pomo.minutes; save();
  const st = pomoPane.querySelector('#pomo-state'); if (st) st.textContent = '把一段时间献给神秘而重要的工作';
  renderPomo();
}
function resetPomo() { setPomo(pomo.total); }

function togglePomo() {
  if (pomo.running) { stopPomo(); }
  else {
    pomo.running = true;
    pomo.timer = setInterval(() => { pomo.left -= 1; if (pomo.left <= 0) finishPomo(); renderPomo(); }, 1000);
  }
  renderPomo();
}
function stopPomo() { pomo.running = false; if (pomo.timer) clearInterval(pomo.timer); pomo.timer = null; }

function finishPomo() {
  stopPomo();
  pomo.left = 0;
  const rec = { id: uid(), label: (pomo.label || '').trim() || '未命名精炼', minutes: pomo.minutes, ts: Date.now() };
  S.pomodoro.records.unshift(rec);
  save();
  addGongfen(RULES.bonusPomodoro);
  if (S.current) S.current.pomodorosDone += 1;
  const st = pomoPane.querySelector('#pomo-state'); if (st) st.textContent = `「${rec.label}」完成。数据更纯净了。`;
  const q = pickQuip('pomodoroDone'); if (q) showBubble(q.text);
  refreshHud();
  renderPomoStats();
}

function delPomoRecord(id) {
  S.pomodoro.records = S.pomodoro.records.filter((r) => r.id !== id);
  save();
  renderPomoStats();
}

function renderPomoStats() {
  const statsEl = pomoPane.querySelector('#pomo-stats');
  const histEl = pomoPane.querySelector('#pomo-history');
  if (!statsEl) return;
  const recs = S.pomodoro.records;
  const today = localDate();
  let todayCount = 0, todayMin = 0, totMin = 0;
  const byLabel = new Map();
  for (const r of recs) {
    totMin += r.minutes;
    if (localDate(new Date(r.ts)) === today) { todayCount++; todayMin += r.minutes; }
    const e = byLabel.get(r.label) || { count: 0, min: 0 };
    e.count++; e.min += r.minutes; byLabel.set(r.label, e);
  }
  const tags = [...byLabel.entries()].sort((a, b) => b[1].min - a[1].min).slice(0, 5)
    .map(([l, e]) => `<div class="pomo-tag"><span>${esc(l)}</span><span>${e.count} 段 / ${e.min} 分</span></div>`).join('');
  statsEl.innerHTML = `
    <h3 class="pomo-sec">统计</h3>
    <div class="pomo-sum">今日 <b>${todayCount}</b> 段 · <b>${todayMin}</b> 分　｜　累计 <b>${recs.length}</b> 段 · <b>${totMin}</b> 分</div>
    ${tags || '<div class="pomo-empty">还没有精炼记录。</div>'}`;

  if (!recs.length) { histEl.innerHTML = ''; return; }
  histEl.innerHTML = `<h3 class="pomo-sec">历史（可删除）</h3>` + recs.slice(0, 12).map((r) => {
    const d = new Date(r.ts);
    const hm = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `<div class="pomo-hist"><span class="ph-label">${esc(r.label)}</span><span class="ph-min">${r.minutes}分</span><span class="ph-time">${hm}</span><button class="ph-del" data-id="${r.id}" title="删除">✕</button></div>`;
  }).join('') + (recs.length > 12 ? `<div class="pomo-empty">仅显示最近 12 条，共 ${recs.length} 条</div>` : '');
  histEl.querySelectorAll('.ph-del').forEach((b) => { b.onclick = () => delPomoRecord(b.dataset.id); });
}

// ============ 倒计时（下班 / 周末 / 发薪日） ============
const cdPane = document.getElementById('pane-countdown');

export function initCountdown() {
  cdPane.innerHTML = `
    <h3>倒计时</h3>
    <div class="cd-item"><div class="cd-label">距离下班</div><div class="cd-val" id="cd-offwork">—</div></div>
    <div class="cd-item"><div class="cd-label">距离周末</div><div class="cd-val" id="cd-weekend">—</div></div>
    <div class="cd-item"><div class="cd-label">距离发薪日</div><div class="cd-val" id="cd-payday">—</div></div>
    <div class="cd-config">
      下班时刻 <input id="cd-offwork-cfg" type="time" value="${S.countdownTargets.offwork}" />
      发薪日 <input id="cd-payday-cfg" type="number" min="1" max="28" value="${S.countdownTargets.payday}" />号
    </div>`;
  document.getElementById('cd-offwork-cfg').onchange = (e) => {
    S.countdownTargets.offwork = e.target.value || '18:30'; save(); updateCountdown();
  };
  document.getElementById('cd-payday-cfg').onchange = (e) => {
    S.countdownTargets.payday = Math.min(28, Math.max(1, parseInt(e.target.value, 10) || 15)); save(); updateCountdown();
  };
  updateCountdown();
}

function fmtGap(ms) {
  if (ms <= 0) return '到点了！';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d} 天 ${h} 小时`;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

export function updateCountdown() {
  const off = document.getElementById('cd-offwork');
  if (!off) return;
  const now = new Date();
  // 下班
  const [oh, om] = (S.countdownTargets.offwork || '18:30').split(':').map(Number);
  const offTarget = new Date(now); offTarget.setHours(oh, om, 0, 0);
  off.textContent = fmtGap(offTarget - now);
  // 周末（本周六 00:00；周六/周日则显示"就是现在"）
  const dow = now.getDay(); // 0 日 ... 6 六
  const wk = document.getElementById('cd-weekend');
  if (dow === 0 || dow === 6) { wk.textContent = '已在周末，去玩。'; }
  else {
    const daysToSat = 6 - dow;
    const sat = new Date(now); sat.setDate(now.getDate() + daysToSat); sat.setHours(0,0,0,0);
    wk.textContent = fmtGap(sat - now);
  }
  // 发薪日
  const pd = S.countdownTargets.payday;
  let pay = new Date(now.getFullYear(), now.getMonth(), pd, 0,0,0,0);
  if (pay <= now) pay = new Date(now.getFullYear(), now.getMonth()+1, pd, 0,0,0,0);
  document.getElementById('cd-payday').textContent = fmtGap(pay - now);
}

// ============ 老板键 ============
const bosskey = document.getElementById('bosskey');
const bossFake = document.getElementById('bosskey-fake');
let bossOn = false;

// 老板键快捷键：B 或 ` (Esc 之外的任意键也能恢复)
const BOSS_KEYS = ['b', '`'];
export function initBossKey() {
  const btn = document.getElementById('btn-bosskey');
  btn.onclick = activateBoss;
  document.addEventListener('keydown', (e) => {
    if (bossOn) { e.preventDefault(); deactivateBoss(); return; } // 屏蔽时按任意键恢复
    if (isTyping()) return;
    if (BOSS_KEYS.includes(e.key.toLowerCase())) { e.preventDefault(); activateBoss(); }
  }, true); // 捕获阶段，优先于场景的移动按键
  bosskey.addEventListener('click', deactivateBoss);
}

function isTyping() {
  const t = document.activeElement;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
}

function activateBoss() {
  if (bossFake.childElementCount === 0) bossFake.appendChild(buildFakeSheet());
  bosskey.classList.remove('hidden');
  bossOn = true;
  const q = pickQuip('bossKey');
  if (q) showBubble(q.text);
}
function deactivateBoss() { bosskey.classList.add('hidden'); bossOn = false; }

// 一张以假乱真的"季度数据精炼汇总表"。设计师可用 assets/ui-bosskey-fakescreen.png 整张替换。
function buildFakeSheet() {
  const probe = new Image();
  probe.onload = () => { bossFake.style.background = `#fff url(./assets/ui-bosskey-fakescreen.png) center/contain no-repeat`; bossFake.innerHTML=''; };
  probe.src = './assets/ui-bosskey-fakescreen.png';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'padding:16px;font-size:13px;color:#222;';
  let rows = '';
  const cols = ['部门','宏数据批次','精炼度 %','偏差','负责人','状态'];
  const names = ['M. Heller','I. Eagan','H. Eagan','D. Graner','B. Cobel','S. Milchick'];
  for (let i = 1; i <= 42; i++) {
    rows += `<tr>
      <td>地下三层-${(i%9)+1}区</td>
      <td>BATCH-${String(2200+i)}</td>
      <td>${(70 + (i*7)%30).toFixed(1)}</td>
      <td>${((i*13)%9 - 4)}</td>
      <td>${names[i%names.length]}</td>
      <td>${i%5===0?'复核中':'已归档'}</td></tr>`;
  }
  wrap.innerHTML = `
    <div style="font-weight:bold;font-size:15px;margin-bottom:4px;">Q3 宏数据精炼汇总（机密 · 内部）</div>
    <div style="color:#666;margin-bottom:10px;">最后更新：${new Date().toLocaleString()} · 共 42 条 · 自动保存已开启</div>
    <table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%;font-family:Arial,Microsoft YaHei,sans-serif;">
      <thead style="background:#1f4e79;color:#fff;"><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  return wrap;
}
