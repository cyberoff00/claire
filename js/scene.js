// 场景：等距全景办公室 + 可点击热点（看细节）+ 你的小人（方向键走动）+ 全景/聚焦摄像机
import { S } from './state.js';
import { SPRITES, DECORATIONS, HOTSPOTS, WORLD, spriteEl } from './assets.js';

const stage = document.getElementById('stage');
const wrap = document.getElementById('stage-wrap');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');
let bubbleTimer = null;

// 玩家可走动的地面范围（世界坐标）
const WALK = { x0: 60, y0: 396, x1: 968, y1: 544 };
const PLAYER_SPEED = 150; // px/秒

let cam = { x: 0, y: 0, zoom: 1, mode: 'overview' };
let player = null;
const keys = new Set();

// ---------- 渲染 ----------
function place(name, spec, x, y, cls = '') {
  const el = spriteEl(name, spec, cls);
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  stage.appendChild(el);
  return el;
}

export function renderScene() {
  stage.style.width = WORLD.w + 'px';
  stage.style.height = WORLD.h + 'px';
  stage.innerHTML = '';

  place('scene-office', SPRITES['scene-office'], 0, 0);

  // 已摆上的装饰（落在你的工位区；移除后不显示，但仍拥有）
  for (const d of DECORATIONS) {
    if (S.equipped[d.id]) place(d.id, { w: d.w, h: d.h, label: d.name }, d.x, d.y);
  }

  // 热点：可点击区域 + 中心标记
  for (const h of HOTSPOTS) {
    const [bx, by, bw, bh] = h.box;
    const hp = document.createElement('div');
    hp.className = 'hotspot';
    hp.id = 'hs-' + h.id;
    hp.style.cssText = `left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;`;
    const dot = document.createElement('div');
    dot.className = 'hotspot-dot';
    dot.style.cssText = `left:${h.x - bx - 6}px;top:${h.y - by - 6}px;`;
    const lab = document.createElement('div');
    lab.className = 'hotspot-label';
    lab.textContent = h.label;
    hp.append(dot, lab);
    hp.onclick = (e) => { e.stopPropagation(); focusOn(h); showBubble(h.line); };
    h._inside = false;
    stage.appendChild(hp);
  }

  // 你的小人
  player = {
    el: spriteEl('char-player', SPRITES['char-player'], 'mover player'),
    x: 330, y: 470, dir: 1, moving: false,
  };
  stage.appendChild(player.el);
  syncPlayer(0);
}

function syncPlayer(t) {
  player.el.style.left = player.x + 'px';
  const bob = player.moving ? Math.abs(Math.sin(t / 110)) * 1.6 : 0;
  player.el.style.top = (player.y - bob) + 'px';
  player.el.style.transform = `scaleX(${player.dir < 0 ? -1 : 1})`;
}

// ---------- 摄像机 ----------
function applyCam() { stage.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`; }
function clampCam() {
  const vw = wrap.clientWidth, vh = wrap.clientHeight;
  const sw = WORLD.w * cam.zoom, sh = WORLD.h * cam.zoom;
  cam.x = sw <= vw ? (vw - sw) / 2 : Math.min(0, Math.max(vw - sw, cam.x));
  cam.y = sh <= vh ? (vh - sh) / 2 : Math.min(0, Math.max(vh - sh, cam.y));
}
function overviewZoom() {
  return Math.min(wrap.clientWidth / WORLD.w, wrap.clientHeight / WORLD.h);
}
export function setOverview() {
  cam.mode = 'overview';
  cam.zoom = overviewZoom();
  clampCam(); applyCam();
}
export function focusOn(h) {
  cam.mode = 'focus';
  cam.zoom = Math.min(overviewZoom() * 2.4, 2.5);
  cam.x = wrap.clientWidth / 2 - h.x * cam.zoom;
  cam.y = wrap.clientHeight / 2 - h.y * cam.zoom;
  clampCam(); applyCam();
}

// ---------- 生命循环：玩家移动 + 走近热点触发 ----------
let lastT = 0;
function loop(t) {
  const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
  lastT = t;
  if (player) {
    let dx = 0, dy = 0;
    if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('d')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('w')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('s')) dy += 1;
    player.moving = !!(dx || dy);
    if (player.moving) {
      const len = Math.hypot(dx, dy) || 1;
      player.x += (dx / len) * PLAYER_SPEED * dt;
      player.y += (dy / len) * PLAYER_SPEED * dt;
      player.x = Math.max(WALK.x0, Math.min(WALK.x1 - 32, player.x));
      player.y = Math.max(WALK.y0, Math.min(WALK.y1 - 48, player.y));
      if (dx) player.dir = dx < 0 ? -1 : 1;
    }
    syncPlayer(t);
    // 走近热点 → 抛台词（带迟滞，离开再进才会再触发）
    const px = player.x + 16, py = player.y + 24;
    for (const h of HOTSPOTS) {
      const dist = Math.hypot(px - h.x, py - h.y);
      if (!h._inside && dist < 110) { h._inside = true; showBubble(h.line); }
      else if (h._inside && dist > 150) { h._inside = false; }
    }
  }
  requestAnimationFrame(loop);
}

// ---------- 初始化 ----------
export function initScene() {
  setOverview();
  buildCamButtons();

  window.addEventListener('keydown', (e) => {
    const t = document.activeElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'Escape') { setOverview(); return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(k)) {
      e.preventDefault(); keys.add(k);
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys.delete(k);
  });
  // 失焦时清空按键，避免"卡住一直走"
  window.addEventListener('blur', () => keys.clear());

  window.addEventListener('resize', () => {
    if (cam.mode === 'overview') setOverview(); else { clampCam(); applyCam(); }
  });

  requestAnimationFrame(loop);
}

function buildCamButtons() {
  const bar = document.createElement('div');
  bar.id = 'cam-btns';
  const overview = document.createElement('button');
  overview.textContent = '🔭 全景';
  overview.onclick = () => setOverview();
  const desk = document.createElement('button');
  desk.textContent = '🪑 我的工位';
  desk.onclick = () => focusOn(HOTSPOTS.find((h) => h.id === 'mydesk'));
  const hint = document.createElement('span');
  hint.className = 'cam-hint';
  hint.textContent = '方向键/WASD 走动 · 点热点看细节 · Esc 回全景';
  bar.append(overview, desk, hint);
  wrap.appendChild(bar);
}

// ---------- 对话气泡 ----------
export function showBubble(text) {
  if (!text) return;
  bubbleText.textContent = text;
  bubble.classList.remove('hidden');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), 6500);
}
