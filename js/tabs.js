(function () {
  function clearAllData() {
    // 隐藏成功弹窗
    const success = document.getElementById("success-message");
    if (success) success.style.display = "none";

    // 重置全局计数
    if (typeof window.correctCount !== "undefined") window.correctCount = 0;
    if (typeof window.dynamicCorrectCount !== "undefined")
      window.dynamicCorrectCount = 0;

    // 清空每个固定篮子的已放物品
    document
      .querySelectorAll(".basket .basket-items")
      .forEach((el) => (el.innerHTML = ""));

    // 移除动态区的所有动态篮子
    const area = document.getElementById("dynamic-area");
    if (area) {
      area
        .querySelectorAll(".dynamic-basket")
        .forEach((b) => b.parentNode && b.parentNode.removeChild(b));
    }

    // 清空物品容器（两个独立容器）
    const ic = document.getElementById("items-container");
    if (ic) ic.innerHTML = "";
    const icd = document.getElementById("items-container-dynamic");
    if (icd) icd.innerHTML = "";

    // 重置计数显示与总数显示
    const counter = document.getElementById("items-counter");
    if (counter) counter.textContent = 0;
    const total = document.getElementById("total-items");
    if (total && typeof window.totalItems !== "undefined")
      total.textContent = window.totalItems;

    const counterd = document.getElementById("items-counter-dynamic");
    if (counterd) counterd.textContent = 0;
    const totald = document.getElementById("total-items-dynamic");
    if (totald && typeof window.totalItemsDynamic !== "undefined")
      totald.textContent = window.totalItemsDynamic;
  }

  function initTabs() {
    function bindTabEvents(container) {
      const tabs = container.querySelectorAll(".tabs .tab-btn");
      tabs.forEach((btn) => {
        btn.onclick = () => {
          // 切换前清空所有数据
          try {
            clearAllData();
          } catch (e) {
            console.warn("clearAllData 出错：", e);
          }

          document
            .querySelectorAll(".tab-panel")
            .forEach((p) => p.classList.remove("active"));
          const targetPanel = document.getElementById("tab-" + btn.dataset.tab);
          if (targetPanel) targetPanel.classList.add("active");

          document
            .querySelectorAll(".tabs .tab-btn")
            .forEach((b) => b.classList.remove("active"));
          document
            .querySelectorAll(
              '.tabs .tab-btn[data-tab="' + btn.dataset.tab + '"]'
            )
            .forEach((b) => b.classList.add("active"));

          // 切换后重新初始化对应面板（确保为全新状态）
          if (btn.dataset.tab === "dynamic") {
            if (typeof initDynamicTab === "function") {
              try {
                initDynamicTab();
              } catch (e) {
                console.warn("initDynamicTab 出错：", e);
              }
            }
          } else if (btn.dataset.tab === "original") {
            if (typeof initGame === "function") {
              try {
                initGame();
              } catch (e) {
                console.warn("initGame 出错：", e);
              }
            }
          }
        };
      });
    }
    document.querySelectorAll(".game-container").forEach(bindTabEvents);
  }

  window.initTabs = initTabs;
})();
