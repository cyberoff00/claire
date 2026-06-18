# THE DEPARTMENT / 部门

一个开着摸鱼的复古办公室窗口。工具为主 + 轻叙事：上班打卡日循环 + 便利贴 + 精炼时段(番茄钟) + 倒计时 + 老板键 + 工位装修。90 年代 CRT 像素风，黑色幽默，神似《人生切割术》但全原创。

## 跑起来
本项目是零依赖的原生 ES Module，需要一个静态服务器（不能直接 file:// 打开，浏览器会拦 module）。

```bash
cd the-department
python3 -m http.server 5173
# 然后浏览器打开 http://localhost:5173
```

或用 node：`npx serve -l 5173`

## 玩法
- 打开页面 = 上班打卡，弹"早安屏"，点"开始上班"进入工位。
- 在岗时长持续累计，每分钟 +1 绩效点(◆)。
- **便利贴**：记待办，首次勾掉 +5 ◆。
- **精炼时段**：番茄钟，完成 +15 ◆。
- **倒计时**：距离下班/周末/发薪日（可配置）。
- **老板键**（顶栏按钮或按 B）：一键切成假报表，点一下/按任意键恢复。
- **工位商店**：用 ◆ 买装饰，立刻出现在工位上。
- **下班打卡**：弹当日结算屏（时长/工分/完成数/连续出勤）。直接关窗也会在下次开窗补结算。

调试：浏览器控制台执行 `tdpReset()` 可清空存档。

## 美术替换
见 [assets/README.md](assets/README.md) 与 `art-collaboration-spec.md`。把符合命名和尺寸的 PNG 丢进 `assets/`，刷新即替换，无需改代码。

## 结构
```
index.html        布局 + CRT 外壳
css/styles.css    90s CRT 主题
js/
  state.js        状态 + localStorage + 工分规则
  assets.js       资产加载层(占位/真图自动切换) + 装饰数据
  quips.js        金句库(轻叙事，往数组加条目即可更新)
  scene.js        工位场景渲染 + 缩放 + 对话气泡
  hud.js          顶栏刷新 + 时间格式化
  dayCycle.js     上班打卡日循环(脊椎)
  tools.js        便利贴/番茄钟/倒计时/老板键
  shop.js         工位商店
  main.js         装配入口
```
