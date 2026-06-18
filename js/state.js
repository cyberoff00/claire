// 全局状态 + localStorage 持久化 + 工分逻辑
const SAVE_KEY = 'tdp.save.v2';

export const RULES = {
  gongfenPerMinute: 1,     // 每在岗 1 分钟 +1 工分
  bonusTodo: 5,            // 完成一条便利贴
  bonusPomodoro: 15,       // 完成一段精炼时段
  idleThresholdSec: 300,   // 心跳间隔超过这个值视为挂机/睡眠，不计时长
  overtimeSec: 8 * 3600,   // 在岗超过 8 小时 → 加班
};

function defaultState() {
  return {
    gongfen: 0,
    dayCount: 0,
    streak: 0,
    totalSeconds: 0,          // 累计在岗秒数（自加入以来）
    joinDate: null,           // 第一次上班的日期 YYYY-MM-DD
    lastClockOutDate: null,
    owned: {},                 // { decoId: true } 拥有
    equipped: {},              // { decoId: true } 摆在工位上（可移除/再摆上）
    stickies: [],              // { id, text, done }
    countdownTargets: {        // 用户可配置
      offwork: '18:30',        // 每日下班时刻 HH:MM
      payday: 15,              // 每月发薪日
    },
    current: null,             // 见 startDay()
    history: [],               // { date, seconds, gongfen, todos, pomodoros }
    pomodoro: {
      records: [],             // { id, label, minutes, ts } 每完成一段记一条
      lastLabel: '',
      lastMinutes: 25,
    },
  };
}

export let S = load();

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const s = Object.assign(defaultState(), JSON.parse(raw));
    // 迁移：老存档只有 owned，没有 equipped → 已拥有的默认都摆着
    for (const id in s.owned) if (s.equipped[id] === undefined) s.equipped[id] = true;
    // 迁移：老存档没有 joinDate → 用最早一条出勤记录补
    if (!s.joinDate) s.joinDate = (s.history[0] && s.history[0].date) || s.lastClockOutDate || null;
    return s;
  } catch (e) {
    console.warn('存档读取失败，重置', e);
    return defaultState();
  }
}

export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }
  catch (e) { console.warn('存档写入失败', e); }
}

// 导出/导入存档（换设备、清缓存时的兜底）
export function exportState() { return JSON.stringify(S, null, 2); }
export function importState(text) {
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== 'object' || !('gongfen' in obj)) {
    throw new Error('这不是一份有效的「部门」存档');
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(obj));
  return true;
}

export function addGongfen(n, isBonus = false) {
  S.gongfen += n;
  if (S.current) S.current.gongfenEarned += n;
  save();
}

export function uid() {
  return Date.now().toString(36) + Math.floor(performance.now() % 1000).toString(36);
}

// 本地日期字符串 YYYY-MM-DD
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function isYesterday(prev, today) {
  if (!prev) return false;
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return localDate(d) === prev;
}
