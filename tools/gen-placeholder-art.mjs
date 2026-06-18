// 自制占位像素素材生成器（程序员美术）。零依赖，仅用 Node 内置 zlib。
// 跑法：node tools/gen-placeholder-art.mjs
// 产物：assets/*.png（设计师后续按同名替换为真美术）
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// ---------- 极简 PNG 编码器 (RGBA) ----------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(c) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0); ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((c.w * 4 + 1) * c.h);
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w * 4 + 1)] = 0; // filter none
    c.data.copy(raw, y * (c.w * 4 + 1) + 1, y * c.w * 4, (y + 1) * c.w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 画布与画笔 ----------
function canvas(w, h) { return { w, h, data: Buffer.alloc(w * h * 4, 0) }; }
function hx(s, a = 255) {
  const r = parseInt(s.slice(1, 3), 16), g = parseInt(s.slice(3, 5), 16), b = parseInt(s.slice(5, 7), 16);
  return [r, g, b, a];
}
function px(c, x, y, col) {
  x = x | 0; y = y | 0;
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.data[i] = col[0]; c.data[i + 1] = col[1]; c.data[i + 2] = col[2]; c.data[i + 3] = col[3] ?? 255;
}
function rect(c, x, y, w, h, col) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(c, xx, yy, col);
}
function outline(c, x, y, w, h, col) {
  for (let xx = x; xx < x + w; xx++) { px(c, xx, y, col); px(c, xx, y + h - 1, col); }
  for (let yy = y; yy < y + h; yy++) { px(c, x, yy, col); px(c, x + w - 1, yy, col); }
}

// ---------- 色板 ----------
const C = {
  ink: hx('#2a261c'), wallA: hx('#cfc4a8'), wallB: hx('#b9ae90'),
  floor: hx('#7d7860'), floorDk: hx('#5e5a48'), base: hx('#4a4636'),
  deskTop: hx('#a3814f'), deskBody: hx('#7a5c34'), deskDk: hx('#5e4626'),
  teal: hx('#2f6b6b'), tealLt: hx('#3d8585'), door: hx('#5e5648'), doorDk: hx('#43402f'),
  skin: hx('#e0b48c'), suit: hx('#3a3a44'), shirt: hx('#d8d2c0'), tie: hx('#a8472a'),
  cardigan: hx('#7a6f52'), grinderTop: hx('#b7c2cc'), grayHair: hx('#c2bca8'), brownHair: hx('#4a3320'),
  monBody: hx('#c9c1a8'), monDk: hx('#9a927a'), screen: hx('#15240f'), green: hx('#3fa34d'),
  amber: hx('#d99a2e'), mugTeal: hx('#2f6b6b'), pot: hx('#a8472a'), leaf: hx('#3fa34d'), leafDk: hx('#2f6b6b'),
  paper: hx('#e7e0cc'), rust: hx('#a8472a'), yellow: hx('#e3c64a'), white: hx('#efe7cf'), blue: hx('#3a6ea5'),
  playerTop: hx('#2f9e9e'),
};

// ---------- 场景部件 ----------
function partition(c, x, w) {
  rect(c, x, 70, w, 88, C.teal);
  rect(c, x, 70, w, 5, C.tealLt);
  outline(c, x, 70, w, 88, C.ink);
}
function desk(c, x, w) {
  rect(c, x, 150, w, 14, C.deskTop);
  rect(c, x, 164, w, 44, C.deskBody);
  rect(c, x, 150, w, 2, C.amber);
  outline(c, x, 150, w, 58, C.deskDk);
}
function cooler(c, x, y) {
  rect(c, x + 2, y, 14, 18, C.blue); outline(c, x + 2, y, 14, 18, C.ink); // 水桶
  rect(c, x, y + 18, 18, 22, C.white); outline(c, x, y + 18, 18, 22, C.ink); // 机身
  rect(c, x + 4, y + 24, 10, 3, C.blue); // 出水口面板
}
function smallScreen(c, x, y) {
  rect(c, x, y, 40, 28, C.monBody); outline(c, x, y, 40, 28, C.ink);
  rect(c, x + 4, y + 4, 32, 20, C.screen); outline(c, x + 4, y + 4, 32, 20, C.ink);
  for (let i = 0; i < 3; i++) rect(c, x + 7, y + 8 + i * 5, 10 + i * 6, 2, C.green);
}

// ---------- 大世界底图 960×270 ----------
function sceneBase() {
  const W = 960, H = 270, c = canvas(W, H);
  rect(c, 0, 0, W, 172, C.wallA);
  for (let x = 0; x < W; x += 32) rect(c, x, 0, 1, 172, C.wallB);
  rect(c, 0, 170, W, 100, C.floor);
  rect(c, 0, 166, W, 5, C.base);
  for (let x = 0; x < W; x += 40) rect(c, x, 170, 1, 100, C.floorDk);
  // 你的工位（左）
  partition(c, 48, 384);
  desk(c, 28, 384);
  // 饮水机（走廊）
  cooler(c, 462, 120);
  // 第二个工位（右）
  partition(c, 520, 360);
  desk(c, 540, 340);
  smallScreen(c, 690, 120); // 第二桌上的小显示器
  // 经理办公室门（最右）
  rect(c, 905, 36, 50, 134, C.door); outline(c, 905, 36, 50, 134, C.doorDk);
  rect(c, 946, 96, 4, 10, C.amber);
  return c;
}

function monitor() {
  const c = canvas(86, 66);
  rect(c, 30, 54, 26, 8, C.monDk);
  rect(c, 4, 2, 78, 50, C.monBody); outline(c, 4, 2, 78, 50, C.ink);
  rect(c, 10, 8, 66, 38, C.screen); outline(c, 10, 8, 66, 38, C.ink);
  for (let i = 0; i < 5; i++) rect(c, 14, 13 + i * 6, 20 + (i % 3) * 18, 2, C.green);
  return c;
}

function person({ hair, top, tie = false, manager = false }) {
  const c = canvas(32, 48);
  rect(c, 9, 44, 6, 4, C.ink); rect(c, 17, 44, 6, 4, C.ink);     // 脚（贴底）
  rect(c, 9, 34, 6, 11, C.suit); rect(c, 17, 34, 6, 11, C.suit); // 腿
  rect(c, 6, 20, 20, 16, top); outline(c, 6, 20, 20, 16, C.ink); // 上身
  if (manager) rect(c, 13, 20, 6, 4, C.shirt);                   // 衬衫领
  if (manager || tie) rect(c, 15, 21, 2, 13, C.tie);             // 领带
  rect(c, 10, 8, 12, 12, C.skin); outline(c, 10, 8, 12, 12, C.ink); // 头
  rect(c, 9, 6, 14, 4, hair); rect(c, 9, 8, 2, 6, hair); rect(c, 21, 8, 2, 6, hair); // 头发
  return c;
}

function lamp() {
  const c = canvas(24, 40);
  rect(c, 4, 36, 16, 4, C.ink);
  rect(c, 10, 14, 3, 24, C.monDk); rect(c, 10, 14, 12, 3, C.monDk);
  rect(c, 6, 4, 16, 10, C.amber); outline(c, 6, 4, 16, 10, C.ink);
  rect(c, 9, 12, 10, 2, C.yellow);
  return c;
}
function secondMonitor() {
  const c = canvas(48, 40);
  rect(c, 18, 32, 12, 6, C.monDk);
  rect(c, 2, 2, 44, 30, C.monBody); outline(c, 2, 2, 44, 30, C.ink);
  rect(c, 6, 6, 36, 22, C.screen); outline(c, 6, 6, 36, 22, C.ink);
  for (let i = 0; i < 3; i++) rect(c, 9, 10 + i * 6, 12 + i * 8, 2, C.green);
  return c;
}
function mug() {
  const c = canvas(16, 16);
  rect(c, 3, 4, 9, 10, C.mugTeal); outline(c, 3, 4, 9, 10, C.ink);
  rect(c, 12, 6, 3, 5, C.mugTeal); px(c, 14, 7, C.ink); px(c, 14, 9, C.ink);
  rect(c, 4, 4, 7, 2, C.white);
  return c;
}
function toy() {
  const c = canvas(16, 16);
  rect(c, 4, 5, 8, 8, C.rust); outline(c, 4, 5, 8, 8, C.ink);
  px(c, 6, 8, C.white); px(c, 9, 8, C.white);
  rect(c, 6, 11, 4, 1, C.ink);
  rect(c, 6, 3, 4, 2, C.yellow);
  return c;
}
function plant() {
  const c = canvas(24, 32);
  rect(c, 6, 22, 12, 9, C.pot); outline(c, 6, 22, 12, 9, C.ink);
  rect(c, 6, 22, 12, 2, C.amber);
  const leaves = [[11, 4], [7, 8], [15, 8], [5, 14], [17, 14], [11, 12]];
  for (const [x, y] of leaves) { rect(c, x - 2, y, 5, 7, C.leaf); px(c, x, y - 1, C.leafDk); }
  rect(c, 11, 10, 2, 12, C.leafDk);
  return c;
}
function poster() {
  const c = canvas(32, 48);
  rect(c, 0, 0, 32, 48, C.paper); outline(c, 0, 0, 32, 48, C.ink);
  rect(c, 3, 4, 26, 18, C.teal);
  rect(c, 8, 9, 16, 8, C.amber);
  for (let i = 0; i < 3; i++) rect(c, 5, 28 + i * 5, 22 - i * 4, 2, C.ink);
  rect(c, 5, 42, 14, 2, C.rust);
  return c;
}

// ---------- 全景占位图（1024×560）：设计师用一张等距插画 scene-office.png 替换 ----------
function seated(c, x, y, top, hair) {
  rect(c, x, y + 8, 14, 13, top); outline(c, x, y + 8, 14, 13, C.ink);
  rect(c, x + 3, y, 8, 8, C.skin); outline(c, x + 3, y, 8, 8, C.ink);
  rect(c, x + 2, y - 1, 10, 3, hair);
}
function cubicle(c, x, y, w, h) {
  rect(c, x, y, w, h, C.teal); outline(c, x, y, w, h, C.ink);
  rect(c, x, y, w, 4, C.tealLt);
}
function panorama() {
  const W = 1024, H = 560, c = canvas(W, H);
  rect(c, 0, 0, W, 150, C.wallA);
  for (let x = 0; x < W; x += 40) rect(c, x, 0, 1, 150, C.wallB);
  rect(c, 0, 148, W, 8, C.base);
  rect(c, 0, 156, W, H - 156, C.floor);
  for (let x = 0; x < W; x += 48) rect(c, x, 156, 1, H - 156, C.floorDk);
  for (let y = 156; y < H; y += 48) rect(c, 0, y, W, 1, C.floorDk);
  // 主管讲台（左上）
  rect(c, 150, 40, 150, 90, C.paper); outline(c, 150, 40, 150, 90, C.ink);
  rect(c, 162, 96, 116, 6, C.rust);
  for (let i = 0; i < 7; i++) px(c, 165 + i * 16, 96 - i * 6, C.rust);
  rect(c, 70, 86, 6, 18, C.suit); rect(c, 82, 86, 6, 18, C.suit);
  rect(c, 66, 64, 26, 24, C.suit); outline(c, 66, 64, 26, 24, C.ink);
  rect(c, 76, 64, 6, 5, C.shirt); rect(c, 78, 66, 2, 16, C.tie);
  rect(c, 72, 46, 14, 16, C.skin); outline(c, 72, 46, 14, 16, C.ink);
  rect(c, 71, 44, 16, 4, C.brownHair);
  // 你的工位（左下）
  rect(c, 40, 440, 236, 100, C.deskBody); rect(c, 40, 432, 236, 10, C.deskTop); outline(c, 40, 432, 236, 108, C.deskDk);
  rect(c, 150, 360, 86, 70, C.monBody); outline(c, 150, 360, 86, 70, C.ink);
  rect(c, 158, 368, 70, 50, C.screen); outline(c, 158, 368, 70, 50, C.ink);
  for (let i = 0; i < 4; i++) rect(c, 163, 374 + i * 9, 28 + i * 9, 3, C.green);
  rect(c, 150, 430, 86, 6, C.monDk);
  // 同事隔间（中区）
  for (const [x, y] of [[360, 180], [520, 180], [680, 180], [440, 310], [620, 310]]) cubicle(c, x, y, 128, 96);
  seated(c, 408, 210, C.cardigan, C.grayHair);
  seated(c, 568, 210, C.grinderTop, C.brownHair);
  seated(c, 728, 210, C.shirt, C.brownHair);
  seated(c, 488, 340, C.suit, C.brownHair);
  seated(c, 668, 340, C.cardigan, C.grayHair);
  // 打印机
  rect(c, 322, 344, 60, 40, C.monBody); outline(c, 322, 344, 60, 40, C.ink);
  rect(c, 330, 338, 44, 8, C.monDk); rect(c, 336, 360, 32, 16, C.white);
  // 饮水机
  cooler(c, 884, 190);
  // 茶水间门
  rect(c, 956, 300, 58, 150, C.door); outline(c, 956, 300, 58, 150, C.doorDk);
  rect(c, 1004, 376, 5, 12, C.amber);
  return c;
}
function player() {
  const c = canvas(32, 48);
  rect(c, 9, 44, 6, 4, C.ink); rect(c, 17, 44, 6, 4, C.ink);
  rect(c, 9, 34, 6, 11, C.suit); rect(c, 17, 34, 6, 11, C.suit);
  rect(c, 6, 20, 20, 16, C.playerTop); outline(c, 6, 20, 20, 16, C.ink);
  rect(c, 13, 20, 6, 4, C.white);
  rect(c, 10, 8, 12, 12, C.skin); outline(c, 10, 8, 12, 12, C.ink);
  rect(c, 9, 6, 14, 4, C.brownHair); rect(c, 9, 8, 2, 6, C.brownHair); rect(c, 21, 8, 2, 6, C.brownHair);
  return c;
}

// ---------- 输出 ----------
mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
const out = {
  'scene-office': panorama(),
  'char-player': player(),
  'deco-lamp': lamp(),
  'deco-second-monitor': secondMonitor(),
  'deco-mug': mug(),
  'deco-toy': toy(),
  'deco-plant-pothos': plant(),
  'deco-poster': poster(),
};
for (const [name, c] of Object.entries(out)) {
  writeFileSync(new URL(`../assets/${name}.png`, import.meta.url), encodePNG(c));
  console.log(`✓ ${name}.png (${c.w}×${c.h})`);
}
console.log('done.');
