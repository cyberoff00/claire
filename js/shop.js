// 工位商店：用工时购买装饰；买了的可以摆上/移除（移除不退工时，仍拥有）
import { S, save, addGongfen } from './state.js';
import { DECORATIONS, fillThumb } from './assets.js';
import { pickQuip } from './quips.js';
import { showBubble, renderScene } from './scene.js';
import { refreshHud } from './hud.js';

const pane = document.getElementById('pane-shop');

export function initShop() { renderShop(); }

function buy(d) {
  if (S.owned[d.id]) return;
  if (S.gongfen < d.price) {
    showBubble(`工时不够，还差 ${d.price - S.gongfen}。再精炼一会儿吧。`);
    return;
  }
  addGongfen(-d.price);
  S.owned[d.id] = true;
  S.equipped[d.id] = true;   // 买了默认摆上
  save();
  renderScene();
  renderShop();
  refreshHud();
  const q = pickQuip('buyDeco');
  if (q) showBubble(q.text);
}

function toggleEquip(d) {
  if (!S.owned[d.id]) return;
  S.equipped[d.id] = !S.equipped[d.id];
  save();
  renderScene();
  renderShop();
  showBubble(S.equipped[d.id] ? `「${d.name}」摆上了。` : `「${d.name}」收进抽屉了。`);
}

export function renderShop() {
  pane.innerHTML = `<h3>工位商店</h3>
    <div class="shop-bal">余额：<b style="color:var(--crt-green)">◆ ${S.gongfen}</b> 工时</div>
    <div class="shop-grid" id="shop-grid"></div>`;
  const grid = pane.querySelector('#shop-grid');
  for (const d of DECORATIONS) {
    const owned = !!S.owned[d.id];
    const equipped = !!S.equipped[d.id];
    const card = document.createElement('div');
    card.className = 'shop-card' + (owned ? ' owned' : '');
    const thumb = document.createElement('div');
    thumb.className = 'shop-thumb placeholder';
    thumb.textContent = d.id + '.png';
    fillThumb(thumb, d.id);
    const title = document.createElement('div');
    title.innerHTML = owned
      ? `${d.name}<br><span class="price">${equipped ? '已摆上' : '已收起'}</span>`
      : `${d.name}<br><span class="price">◆ ${d.price}</span>`;

    const btn = document.createElement('button');
    if (owned) {
      btn.textContent = equipped ? '移除' : '摆上';
      if (equipped) btn.classList.add('btn-remove');
      btn.onclick = () => toggleEquip(d);
    } else {
      const afford = S.gongfen >= d.price;
      btn.textContent = afford ? '购买' : `还差 ${d.price - S.gongfen}`;
      if (!afford) btn.style.opacity = '.6';
      btn.onclick = () => buy(d);
    }
    card.append(thumb, title, btn);
    grid.appendChild(card);
  }
}
