// 入口：装配场景、工具、日循环、定时器与交互
import { renderScene, initScene } from './scene.js';
import { refreshHud } from './hud.js';
import { boot, startDay, clockOut, closeSummary } from './dayCycle.js';
import { initSticky, initPomodoro, initCountdown, initBossKey, updateCountdown } from './tools.js';
import { initShop, renderShop } from './shop.js';
import { initSaveIO } from './save-io.js';
import { initPet, renderPet } from './pet.js';

// --- 场景 + 摄像机 ---
renderScene();
initScene();

// --- 工具面板 ---
initSticky();
initPomodoro();
initCountdown();
initBossKey();
initShop();
initSaveIO();

// --- 标签页切换 ---
const tabs = document.querySelectorAll('.tab');
const panes = document.querySelectorAll('.pane');
tabs.forEach((tab) => {
  tab.onclick = () => {
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    const key = tab.dataset.tab;
    panes.forEach((p) => p.classList.toggle('active', p.dataset.pane === key));
    if (key === 'shop') renderShop();   // 进商店刷新余额
    if (key === 'pet') renderPet();     // 进宠物页刷新状态
  };
});

// --- 早安/下班/结算 按钮 ---
document.getElementById('btn-start-day').onclick = startDay;
document.getElementById('btn-clockout').onclick = clockOut;
document.getElementById('btn-close-summary').onclick = closeSummary;

// --- 启动日循环（决定继续/补班/新的一天）---
boot();

// --- 养成宠物（放在 boot 之后：新的一天有早安屏时不抢气泡）---
initPet();

refreshHud();

// --- 秒级 UI 刷新：倒计时 ---
setInterval(updateCountdown, 1000);

// 暴露一个调试用的重置（控制台 tdpReset() 清档）
window.tdpReset = () => { localStorage.removeItem('tdp.save.v2'); location.reload(); };
