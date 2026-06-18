// 顶栏 HUD 刷新 + 时间格式化
import { S } from './state.js';

const el = {
  day: document.getElementById('tb-day'),
  date: document.getElementById('tb-date'),
  clock: document.getElementById('tb-clock'),
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

export function refreshHud() {
  el.day.textContent = `出勤第 ${S.dayCount} 天`;
  el.date.textContent = S.current ? S.current.date : '已下班';
  const worked = S.current ? S.current.secondsWorked : 0;
  el.clock.textContent = '⏱ ' + fmtDuration(worked);
  el.gongfen.textContent = '◆ ' + S.gongfen;
  el.streak.textContent = '🔥 ' + S.streak;
}
