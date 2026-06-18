// 存档导出/导入：把 localStorage 存档存成一个文件，换设备或清缓存时再导回来。
import { exportState, importState } from './state.js';
import { showBubble } from './scene.js';

export function initSaveIO() {
  const btn = document.getElementById('btn-saveio');
  if (btn) btn.onclick = openModal;
}

function openModal() {
  if (document.getElementById('saveio-screen')) return;
  const overlay = document.createElement('div');
  overlay.id = 'saveio-screen';
  overlay.className = 'screen';
  overlay.innerHTML = `
    <div class="screen-card">
      <div class="screen-head">人 事 档 案 室</div>
      <h1>存档</h1>
      <p style="font-size:13px;color:var(--ink-soft);max-width:360px;margin:0 auto 14px;">
        你的数据自动存在本浏览器里。换设备或清缓存前，先导出一份带走；要恢复就导入它。
      </p>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button id="saveio-export">导出存档</button>
        <button id="saveio-import">导入存档</button>
        <button id="saveio-close">关闭</button>
      </div>
      <input id="saveio-file" type="file" accept="application/json,.json" style="display:none" />
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#saveio-export').onclick = doExport;
  overlay.querySelector('#saveio-close').onclick = close;
  const fileInput = overlay.querySelector('#saveio-file');
  overlay.querySelector('#saveio-import').onclick = () => fileInput.click();
  fileInput.onchange = (e) => { if (e.target.files[0]) doImport(e.target.files[0]); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function close() {
  const el = document.getElementById('saveio-screen');
  if (el) el.remove();
}

function doExport() {
  const data = exportState();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `the-department-存档.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  close();
  showBubble('存档已导出。收好它——人事档案不补办。');
}

function doImport(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      importState(reader.result);
      alert('导入成功，即将重新载入。');
      location.reload();
    } catch (err) {
      alert('导入失败：' + err.message);
    }
  };
  reader.onerror = () => alert('读取文件失败。');
  reader.readAsText(file);
}
