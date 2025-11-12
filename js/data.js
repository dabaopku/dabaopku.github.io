// 物品数据与基础计数（暴露到 window 以兼容现有脚本）
(function () {
  const items = [
    { name: "冰块", type: "cube", img: "img/1.png" },
    { name: "篮球", type: "sphere", img: "img/2.png" },
    { name: "盒子", type: "cube", img: "img/3.png" },
    { name: "水杯", type: "cylinder", img: "img/4.png" },
    { name: "地球仪", type: "sphere", img: "img/5.png" },
    { name: "麻将", type: "cuboid", img: "img/6.png" },
    { name: "电池", type: "cylinder", img: "img/7.png" },
    { name: "文件箱", type: "cuboid", img: "img/8.png" },
  ];

  window.items = items;
  window.totalItems = items.length;
  window.correctCount = 0;

  window.dynamicCorrectCount = 0;
  window.totalItemsDynamic = items.length;
})();
