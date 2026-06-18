// 上班打卡日循环（脊椎）：上班/在岗心跳/下班结算/出勤历史/加班彩蛋
import { S, save, addGongfen, RULES, localDate, isYesterday } from './state.js';
import { pickQuip } from './quips.js';
import { showBubble } from './scene.js';
import { refreshHud } from './hud.js';

let heartbeat = null;
let beatCount = 0;

// ---- 时长统计辅助 ----
function fmtHM(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`;
}
function daysSince(dateStr) {
  const a = new Date(dateStr + 'T00:00:00'), b = new Date(localDate() + 'T00:00:00');
  return Math.max(0, Math.round((b - a) / 86400000));
}
// 本周（周一为界）在岗秒数；history 已含今天（clockOut 先 finalize 再结算）
function weekSeconds() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  let s = 0;
  for (const rec of S.history) {
    if (new Date(rec.date + 'T00:00:00') >= monday) s += rec.seconds;
  }
  return s;
}

// ---- 屏元素 ----
const morning = document.getElementById('screen-morning');
const summary = document.getElementById('screen-summary');

function newCurrentDay(date) {
  return {
    date,
    clockInTs: Date.now(),
    lastBeatTs: Date.now(),
    secondsWorked: 0,
    creditedMinutes: 0,
    gongfenEarned: 0,
    todosDone: 0,
    pomodorosDone: 0,
    overtimeNotified: false,
  };
}

// 结算并归档某一天（用于正常下班 / 跨天自动补班）
function finalizeDay(cur) {
  S.totalSeconds += cur.secondsWorked;
  S.history.push({
    date: cur.date,
    seconds: cur.secondsWorked,
    gongfen: cur.gongfenEarned,
    todos: cur.todosDone,
    pomodoros: cur.pomodorosDone,
  });
  // 连续出勤
  if (S.lastClockOutDate !== cur.date) {
    if (isYesterday(S.lastClockOutDate, cur.date)) S.streak += 1;
    else S.streak = 1;
    S.lastClockOutDate = cur.date;
  }
  save();
}

// 入口：决定今天是"继续"、"补班+开新的一天"还是"全新的一天"
export function boot() {
  const today = localDate();
  if (S.current) {
    if (S.current.date === today) {
      // 同一天重开窗口 → 继续在岗，欢迎回来
      S.current.lastBeatTs = Date.now();
      startHeartbeat();
      refreshHud();
      const q = pickQuip('welcomeBack');
      if (q) showBubble(q.text);
      return;
    } else {
      // 上次没点下班就关了 → 用最后心跳把那天补结算
      finalizeDay(S.current);
      S.current = null;
    }
  }
  // 开新的一天
  showMorning(today);
}

function showMorning(today) {
  S.dayCount += 1;
  if (!S.joinDate) S.joinDate = today;   // 第一天 = 入职日
  S.current = newCurrentDay(today);
  save();
  document.getElementById('morning-day').textContent = `出勤第 ${S.dayCount} 天`;
  document.getElementById('morning-date').textContent = today;
  const q = pickQuip('clockIn');
  document.getElementById('morning-quip').textContent = q ? q.text : '';
  morning.classList.remove('hidden');
  refreshHud();
}

export function startDay() {
  morning.classList.add('hidden');
  S.current.lastBeatTs = Date.now();
  startHeartbeat();
  refreshHud();
}

// ---- 心跳：累计在岗时长 + 产出工分 + 加班检测 ----
function tick() {
  const cur = S.current;
  if (!cur) return;
  const now = Date.now();
  const elapsed = (now - cur.lastBeatTs) / 1000;
  cur.lastBeatTs = now;
  // 挂机/睡眠：间隔过大不计入
  if (elapsed > 0 && elapsed <= RULES.idleThresholdSec) {
    cur.secondsWorked += elapsed;
  }
  // 按整分钟结算工分
  const minutes = Math.floor(cur.secondsWorked / 60);
  const delta = minutes - cur.creditedMinutes;
  if (delta > 0) {
    cur.creditedMinutes = minutes;
    addGongfen(delta * RULES.gongfenPerMinute);
  }
  // 加班彩蛋
  if (!cur.overtimeNotified && cur.secondsWorked >= RULES.overtimeSec) {
    cur.overtimeNotified = true;
    const q = pickQuip('overtime');
    if (q) showBubble(q.text);
  }
  // 存档节流：每 5 秒落盘一次（工分变动时即时落盘已在 addGongfen 处理）
  if (++beatCount % 5 === 0) save();
  refreshHud();
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeat = setInterval(tick, 1000); // 1 秒一跳，时钟平滑
}
function stopHeartbeat() { if (heartbeat) clearInterval(heartbeat); heartbeat = null; }

// ---- 下班 ----
export function clockOut() {
  const cur = S.current;
  if (!cur) return;
  stopHeartbeat();
  tick(); // 补最后一段
  finalizeDay(cur);
  // 结算屏
  const stats = document.getElementById('summary-stats');
  const h = Math.floor(cur.secondsWorked / 3600);
  const m = Math.floor((cur.secondsWorked % 3600) / 60);
  const weekSec = weekSeconds();
  const joinDays = S.joinDate ? daysSince(S.joinDate) + 1 : 1;
  stats.innerHTML = `
    <li>今日在岗：<b>${h} 小时 ${m} 分</b></li>
    <li>今日工时：<b>${cur.gongfenEarned}</b></li>
    <li>完成便利贴：<b>${cur.todosDone}</b></li>
    <li>精炼时段：<b>${cur.pomodorosDone}</b></li>
    <li>连续出勤：<b>${S.streak} 天</b></li>
    <li class="sum-div">本周你的工作时长为：<b>${fmtHM(weekSec)}</b></li>
    <li>自你加入本公司，已使用：<b>${fmtHM(S.totalSeconds)}</b>（入职第 ${joinDays} 天）</li>`;
  const q = pickQuip('clockOut');
  document.getElementById('summary-quip').textContent = q ? q.text : '';
  S.current = null;
  save();
  refreshHud();
  summary.classList.remove('hidden');
}

export function closeSummary() {
  summary.classList.add('hidden');
}

// 直接关窗：保存最后心跳时间（下次开窗按跨天逻辑补结算）
window.addEventListener('beforeunload', () => {
  if (S.current) { S.current.lastBeatTs = Date.now(); save(); }
});

// 标签页重新可见时，纠正一次（防止后台节流导致漂移）
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && S.current) { S.current.lastBeatTs = Date.now(); }
});
