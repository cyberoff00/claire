// 资产加载层：尝试加载 ./assets/<name>.png，失败则渲染"标注了名字+尺寸"的占位块。
// 设计师按 art-collaboration-spec.md 的命名把真 PNG 丢进 assets/，刷新即替换，无需改代码。

const ASSET_DIR = './assets/';
const cache = new Map();

// 全景世界尺寸（对齐参考图的等距插画比例）。设计师出一张这个尺寸的 scene-office.png。
export const WORLD = { w: 1024, h: 560 };

export const SPRITES = {
  'scene-office':  { w: 1024, h: 560, label: '办公室全景底图（等距插画）' },
  'char-player':   { w: 32,   h: 48,  label: '你（可走动）' },
};

// 工位装饰：买了出现在"你的工位"区域（世界左下）
export const DECORATIONS = [
  { id: 'deco-mug',            name: '马克杯',     price: 10, w: 16, h: 16, x: 110, y: 420 },
  { id: 'deco-toy',            name: '摸鱼小物',   price: 12, w: 16, h: 16, x: 140, y: 420 },
  { id: 'deco-plant-pothos',   name: '绿萝',       price: 18, w: 24, h: 32, x: 212, y: 402 },
  { id: 'deco-lamp',           name: '台灯',       price: 25, w: 24, h: 40, x: 50,  y: 396 },
  { id: 'deco-poster',         name: '励志海报',   price: 30, w: 32, h: 48, x: 300, y: 150 },
  { id: 'deco-second-monitor', name: '第二显示器', price: 45, w: 48, h: 40, x: 240, y: 394 },
];

// 热点：点击或走近触发。x,y = 触发中心；box = 可点击区域；line = 台词。
export const HOTSPOTS = [
  { id: 'supervisor', label: '主管',   x: 120, y: 120, box: [40, 40, 170, 120],  line: '你怎么还在？茶水间有强制团建，别迟到。' },
  { id: 'mydesk',     label: '我的工位', x: 150, y: 450, box: [40, 356, 236, 180], line: '你的工位。神秘而重要的工作，就在这儿发生。' },
  { id: 'coworkerA',  label: '老登',   x: 425, y: 230, box: [360, 180, 130, 104], line: '走开五分钟，工位认得你；走开五年，公司也认得你。' },
  { id: 'coworkerB',  label: '卷王',   x: 585, y: 230, box: [520, 180, 130, 104], line: '还没走？那我也再待会儿。（你俩谁也不想先走）' },
  { id: 'printer',    label: '打印机', x: 352, y: 362, box: [320, 338, 64, 48],   line: '打印机又卡纸了。它总是。' },
  { id: 'watercooler',label: '饮水机', x: 892, y: 210, box: [862, 168, 44, 90],   line: '冷水机。喝水，是唯一带薪的呼吸。' },
  { id: 'breakroom',  label: '茶水间', x: 982, y: 380, box: [952, 300, 64, 150],  line: '强制团建进行中。出席是自愿的（并不）。' },
];

function probe(name) {
  if (cache.has(name)) return Promise.resolve(cache.get(name));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { cache.set(name, true); resolve(true); };
    img.onerror = () => { cache.set(name, false); resolve(false); };
    img.src = ASSET_DIR + name + '.png';
  });
}

export function spriteEl(name, spec, extraClass = '') {
  const el = document.createElement('div');
  el.className = 'sprite placeholder ' + extraClass;
  el.style.width = spec.w + 'px';
  el.style.height = spec.h + 'px';
  el.textContent = (spec.label || name) + `\n${name}.png ${spec.w}×${spec.h}`;
  probe(name).then((ok) => {
    if (ok) {
      el.classList.remove('placeholder');
      el.textContent = '';
      el.style.backgroundImage = `url(${ASSET_DIR}${name}.png)`;
    }
  });
  return el;
}

export function fillThumb(el, name) {
  probe(name).then((ok) => {
    if (ok) {
      el.classList.remove('placeholder');
      el.style.backgroundImage = `url(${ASSET_DIR}${name}.png)`;
    } else {
      el.classList.add('placeholder');
      el.textContent = name + '.png';
    }
  });
}
