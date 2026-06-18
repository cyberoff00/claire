// 金句库：数据驱动的轻叙事。往数组里加条目即可"更新内容"，无需改代码。
// 角色：manager(管理层/塑料黑话) · elder(老登/办公室预言家) · grinder(卷王)
// 事件键：clockIn / welcomeBack / clockOut / overtime / todoDone / pomodoroDone / bossKey / idle / buyDeco

export const QUIPS = {
  clockIn: [
    { who: 'manager', text: '早。请记住：你今天的精炼，神秘而重要。' },
    { who: 'manager', text: '欢迎回到部门。请将个人情绪寄存在前台。' },
    { who: 'elder',   text: '又来了。地下三层的灯，从不为谁亮，也从不为谁灭。' },
    { who: 'manager', text: '新的一天，新的可量化的忠诚。' },
  ],
  welcomeBack: [
    { who: 'manager', text: '你回来了。我们一直都在看着进度条。' },
    { who: 'elder',   text: '走开五分钟，工位认得你；走开五年，公司也认得你。' },
  ],
  clockOut: [
    { who: 'manager', text: '今日表现已归档。归档不代表认可，但也不代表不认可。' },
    { who: 'elder',   text: '能走出这扇门，本身就是一种 KPI。' },
    { who: 'manager', text: '下班愉快。记得，门外的你和门内的你，最好别打照面。' },
  ],
  overtime: [
    { who: 'manager', text: '检测到加班。这份热忱已被记录，并将永远找不到。' },
    { who: 'elder',   text: '加班的人最懂时间——它不属于你。' },
    { who: 'grinder', text: '还没走？那我也再待会儿。（你俩谁也不想先走）' },
  ],
  todoDone: [
    { who: 'manager', text: '一项任务完成。部门为你感到一种程序性的骄傲。' },
    { who: 'grinder', text: '勾掉一条了？我清单还有四十七条。' },
    { who: 'manager', text: '很好。这种势头请保持到你退休或被优化为止。' },
  ],
  pomodoroDone: [
    { who: 'manager', text: '一段精炼时段达标。数据更纯净了，虽然没人知道是什么数据。' },
    { who: 'elder',   text: '专注是逃不掉的，但至少这次是你自己选的。' },
  ],
  bossKey: [
    { who: 'elder', text: '（嘘——抬头，他过来了。）' },
  ],
  idle: [
    { who: 'elder',   text: '盯着屏幕发呆，也是一种古老的部门传统。' },
    { who: 'grinder', text: '你在摸鱼吗？……教教我。' },
    { who: 'manager', text: '系统检测到你已静止片刻。这很正常，请勿恐慌。' },
  ],
  buyDeco: [
    { who: 'manager', text: '工位个性化已批准。个性请控制在 30 厘米见方以内。' },
    { who: 'elder',   text: '一盆绿萝，是这地方唯一会为你长高的东西。' },
  ],
};

export function pickQuip(event) {
  const arr = QUIPS[event];
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
