// 顶栏 HUD 刷新 + 时间格式化
import { S } from './state.js';

const el = {
  day: document.getElementById('tb-day'),
  date: document.getElementById('tb-date'),
  clock: document.getElementById('tb-clock'),
  total: document.getElementById('tb-total'),
  gongfen: document.getElementById('tb-gongfen'),
  streak: document.getElementById('tb-streak'),
};

export function fmtDuration(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// 累计在岗时长用紧凑写法：12h34m / 34m
export function fmtHM(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h${m}m` : `${m}m`;
}

// 截止目前累计在岗时长 = 已归档的 totalSeconds + 今天进行中的时长
export function totalWorkedSeconds() {
  return (S.totalSeconds || 0) + (S.current ? S.current.secondsWorked : 0);
}

export function refreshHud() {
  el.day.textContent = `出勤第 ${S.dayCount} 天`;
  el.date.textContent = S.current ? S.current.date : '已下班';
  const worked = S.current ? S.current.secondsWorked : 0;
  el.clock.textContent = '⏱ ' + fmtDuration(worked);
  el.total.textContent = 'Σ ' + fmtHM(totalWorkedSeconds());
  el.gongfen.textContent = '◆ ' + S.gongfen;
  el.streak.textContent = '🔥 ' + S.streak;
}
