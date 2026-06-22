// 养成宠物：办公室「摸鱼搭子」（一条鱼）
// 轻度养成——按真实时间掉饱食度（含离线）、喂食花工分、每日红包反哺工分、永远养不死
import { S, save, addGongfen, localDate } from './state.js';
import { showBubble } from './scene.js';
import { refreshHud } from './hud.js';

const FEED_COST = 20;                 // 喂一次花多少工分
const FEED_GAIN = 40;                 // 喂一次回多少饱食度
const FEED_EXP = 10;
const PLAY_EXP = 6;
const PLAY_COOLDOWN = 8 * 60 * 1000;  // 逗玩冷却 8 分钟
const DRAIN_PER_HOUR = 6;             // 饱食度每小时下降（~16 小时饿完，约一天喂一次）
const DAILY_GIFT_BASE = 12;           // 每日红包基数

// 进化阶段（按等级）
const STAGES = [
  { min: 1,  name: '鱼苗',     emoji: '🐟' },
  { min: 3,  name: '上班鱼',   emoji: '🐠' },
  { min: 6,  name: '摸鱼能手', emoji: '🐡' },
  { min: 10, name: '带薪锦鲤', emoji: '🎏' },
  { min: 15, name: '咸鱼成精', emoji: '🐉' },
];
function stageOf(level) {
  let st = STAGES[0];
  for (const s of STAGES) if (level >= s.min) st = s;
  return st;
}
function expToNext(level) { return 40 + (level - 1) * 25; }

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}
function daysAlive(p) {
  if (!p.bornDate) return 1;
  const a = new Date(p.bornDate + 'T00:00:00'), b = new Date(localDate() + 'T00:00:00');
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

// 饱食度随真实时间流逝（含离线）；返回这段掉了多少
function settleFullness() {
  const p = S.pet;
  const now = Date.now();
  if (!p.lastUpdateTs) { p.lastUpdateTs = now; return 0; }
  const hours = (now - p.lastUpdateTs) / 3600000;
  if (hours <= 0) { p.lastUpdateTs = now; return 0; }
  const before = p.fullness;
  p.fullness = Math.max(0, p.fullness - hours * DRAIN_PER_HOUR);
  p.lastUpdateTs = now;
  return before - p.fullness;
}

function moodOf(p) {
  if (p.fullness < 15) return { key: 'hungry', label: '饿瘪了', face: '🥺' };
  if (p.fullness < 40) return { key: 'meh', label: '有点饿', face: '😐' };
  if (Date.now() - (p.lastPlayTs || 0) < 60 * 60 * 1000) return { key: 'happy', label: '美滋滋', face: '😆' };
  return { key: 'ok', label: '摸鱼中', face: '🙂' };
}

// 加经验（可能连升级 + 进化提示）
function gainExp(n) {
  const p = S.pet;
  const oldStage = stageOf(p.level).name;
  p.exp += n;
  while (p.exp >= expToNext(p.level)) { p.exp -= expToNext(p.level); p.level += 1; }
  const newStage = stageOf(p.level);
  if (newStage.name !== oldStage) {
    showBubble(`「${p.name}」进化成了【${newStage.name}】${newStage.emoji}`);
  }
}

// 每日红包：每天第一次见面发一次
function tryDailyGift() {
  const p = S.pet;
  const today = localDate();
  if (p.lastGiftDate === today) return 0;
  p.lastGiftDate = today;
  const stageIdx = STAGES.indexOf(stageOf(p.level));
  const gift = DAILY_GIFT_BASE + stageIdx * 10 + p.level;
  addGongfen(gift, true);
  gainExp(8);
  return gift;
}

function petTip(p) {
  if (p.fullness < 15) return `${p.name} 饿瘪了，喂一口立刻回血。`;
  if (p.level < 3) return `多喂食、多逗玩攒经验，Lv.3 就会进化。`;
  const next = STAGES.find((s) => s.min > p.level);
  if (next) return `下一次进化：Lv.${next.min} →【${next.name}】，已养 ${daysAlive(p)} 天。`;
  return `${p.name} 已修炼圆满，带薪摸鱼之神。已养 ${daysAlive(p)} 天。`;
}

let pane = null;
function petTabActive() { return pane && pane.classList.contains('active'); }

export function renderPet() {
  if (!pane) return;
  const p = S.pet;
  const st = stageOf(p.level);
  const mood = moodOf(p);
  const need = expToNext(p.level);
  const expPct = Math.min(100, Math.round((p.exp / need) * 100));
  const fullPct = Math.round(p.fullness);
  const canPlay = Date.now() - (p.lastPlayTs || 0) >= PLAY_COOLDOWN;
  const todayGift = p.lastGiftDate === localDate();

  pane.innerHTML = `
    <h3>摸鱼搭子</h3>
    <div class="pet-card">
      <div class="pet-face mood-${mood.key}">${st.emoji}</div>
      <div class="pet-name">
        <b>${escapeHtml(p.name)}</b>
        <button class="pet-rename" title="改名">✎</button>
      </div>
      <div class="pet-stage">${st.name} · Lv.${p.level}</div>
      <div class="pet-mood">${mood.face} ${mood.label}</div>

      <div class="pet-bar-label">经验 ${p.exp}/${need}</div>
      <div class="pet-bar"><i style="width:${expPct}%;background:var(--crt-green)"></i></div>

      <div class="pet-bar-label">饱食度 ${fullPct}%</div>
      <div class="pet-bar"><i style="width:${fullPct}%;background:${fullPct < 25 ? 'var(--rust)' : 'var(--amber)'}"></i></div>

      <div class="pet-btns">
        <button class="pet-feed">🍚 喂食 (${FEED_COST}工分)</button>
        <button class="pet-play" ${canPlay ? '' : 'disabled'}>${canPlay ? '🎲 逗它玩' : '歇会儿…'}</button>
      </div>
      ${todayGift ? '' : '<p class="pet-gift">🧧 今天还没领红包，喂它一下就来～</p>'}
      <p class="pet-tip">${petTip(p)}</p>
    </div>`;

  pane.querySelector('.pet-feed').onclick = feed;
  pane.querySelector('.pet-play').onclick = play;
  pane.querySelector('.pet-rename').onclick = rename;
}

function feed() {
  const p = S.pet;
  if (S.gongfen < FEED_COST) { showBubble('工分不够，先去工位在岗攒点'); return; }
  if (p.fullness >= 100) { showBubble(`「${p.name}」吃撑了，待会儿再喂`); return; }
  S.gongfen -= FEED_COST;
  p.fullness = Math.min(100, p.fullness + FEED_GAIN);
  p.totalFed = (p.totalFed || 0) + 1;
  gainExp(FEED_EXP);
  save(); renderPet(); refreshHud();
}

const PLAY_LINES = [
  '绕着鱼缸转了三圈', '对你吐了个泡泡', '假装在看 KPI 报表',
  '翻了个身继续摸鱼', '冲你摆了摆尾巴', '顶了顶水面的食物渣',
];
function play() {
  const p = S.pet;
  if (Date.now() - (p.lastPlayTs || 0) < PLAY_COOLDOWN) return;
  p.lastPlayTs = Date.now();
  p.fullness = Math.max(0, p.fullness - 2);
  gainExp(PLAY_EXP);
  save(); renderPet(); refreshHud();
  showBubble(`「${p.name}」${PLAY_LINES[Math.floor(Math.random() * PLAY_LINES.length)]}`);
}

function rename() {
  const name = prompt('给你的摸鱼搭子起个名字：', S.pet.name);
  if (name && name.trim()) { S.pet.name = name.trim().slice(0, 12); save(); renderPet(); }
}

export function initPet() {
  pane = document.getElementById('pane-pet');
  if (!S.pet.bornDate) S.pet.bornDate = localDate();
  settleFullness();

  // 每日红包 + 离线问候（只在没有早安屏挡着时弹气泡）
  const gift = tryDailyGift();
  save();
  const morningUp = !document.getElementById('screen-morning').classList.contains('hidden');
  if (!morningUp) {
    if (gift) showBubble(`「${S.pet.name}」给你发了今日红包 +${gift} 工分 🧧`);
    else if (S.pet.fullness < 25) showBubble(`「${S.pet.name}」饿瘪了，喂喂它吧`);
  }

  renderPet();
  refreshHud();

  // 自走时钟：饱食度持续下降，激活时刷新面板
  setInterval(() => {
    settleFullness();
    save();
    if (petTabActive()) renderPet();
  }, 15000);
}
