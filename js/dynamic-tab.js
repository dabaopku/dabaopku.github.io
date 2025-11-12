(function () {
  let dynamicBasketCounter = 0;

  // 新增：根据类型为动态篮子应用颜色样式
  function applyBasketStyle(basket, type) {
    // 默认样式
    let bg = "linear-gradient(135deg,#fffef9,#ffe6b3)";
    let iconBg = "linear-gradient(135deg,#fff8e6,#ffe0a8)";
    let titleColor = "#444";

    if (type === "cube") {
      bg = "linear-gradient(135deg,#fff1ec,#ffd1b8)";
      iconBg = "linear-gradient(135deg,#ffc9b3,#ffb199)";
      titleColor = "#5b2c0d";
    } else if (type === "cuboid") {
      bg = "linear-gradient(135deg,#f5eefc,#e7d8fb)";
      iconBg = "linear-gradient(135deg,#eadcff,#dcc5ff)";
      titleColor = "#3b0f4a";
    } else if (type === "cylinder") {
      bg = "linear-gradient(135deg,#e9f8f6,#c8f0ec)";
      iconBg = "linear-gradient(135deg,#d6f3ee,#bdebe3)";
      titleColor = "#083b36";
    } else if (type === "sphere") {
      bg = "linear-gradient(135deg,#fff9e6,#fff0b8)";
      iconBg = "linear-gradient(135deg,#fff5c2,#ffea8a)";
      titleColor = "#5a4a00";
    }

    // 应用到 basket 容器与内部 icon/title
    try {
      basket.style.background = bg;
      const iconEl = basket.querySelector(".basket-icon");
      if (iconEl) iconEl.style.background = iconBg;
      const titleEl = basket.querySelector(".basket-title");
      if (titleEl) titleEl.style.color = titleColor;
    } catch (e) {
      // 安全回退：忽略样式应用错误
    }
  }

  function initDynamicTab() {
    window.dynamicCorrectCount = 0;
    const counterEl = document.getElementById("items-counter-dynamic");
    const totalEl = document.getElementById("total-items-dynamic");
    if (counterEl) counterEl.textContent = 0;
    if (totalEl) totalEl.textContent = window.totalItemsDynamic;

    const container = document.getElementById("items-container-dynamic");
    if (!container) return;
    container.innerHTML = "";

    const shuffled = Array.isArray(window.items)
      ? [...window.items].sort(() => Math.random() - 0.5)
      : [];
    shuffled.forEach((item) => {
      const el = document.createElement("div");
      el.className = "item";
      el.draggable = true;
      el.dataset.type = item.type;
      el.dataset.name = item.name;

      // 分配唯一 drag id
      if (typeof window._dragIdCounter === "undefined")
        window._dragIdCounter = 0;
      window._dragIdCounter++;
      el.dataset.dragId = "item-" + Date.now() + "-" + window._dragIdCounter;

      const img = document.createElement("img");
      img.className = "item-img";
      img.alt = item.name;
      img.draggable = false;
      img.src = item.img || "";

      el.appendChild(img);
      container.appendChild(el);

      el.addEventListener("dragstart", (e) => {
        el.classList.add("dragging");
        if (e.dataTransfer && e.dataTransfer.setData) {
          e.dataTransfer.setData("text/plain", el.dataset.type || "");
          e.dataTransfer.setData("text/name", el.dataset.name || "");
          try {
            e.dataTransfer.setData("text/drag-id", el.dataset.dragId);
          } catch (err) {}
          try {
            e.dataTransfer.setData("text/img", img.src);
          } catch (err) {}
        }
      });
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
    });

    const tool = document.getElementById("tool-basket");
    if (tool) {
      tool.addEventListener("dragstart", (e) => {
        if (e.dataTransfer && e.dataTransfer.setData)
          e.dataTransfer.setData("text/plain", "create-basket");
      });
    }

    const area = document.getElementById("dynamic-area");
    if (!area) return;
    area.addEventListener("dragover", (e) => e.preventDefault());
    area.addEventListener("drop", (e) => {
      e.preventDefault();
      const dt =
        e.dataTransfer && e.dataTransfer.getData
          ? e.dataTransfer.getData("text/plain")
          : "";

      // 如果 drop 发生在已有的动态篮子内部（或其子元素上），且不是移动篮子，让该篮子处理
      const targetBasket =
        e.target && e.target.closest
          ? e.target.closest(".dynamic-basket")
          : null;
      if (targetBasket && dt !== "move-basket") return;

      const rect = area.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (dt === "create-basket") {
        const b = createDynamicBasket(x, y);
        // createDynamicBasket 已有默认样式，无需额外设置
      } else if (dt === "move-basket") {
        const id =
          e.dataTransfer && e.dataTransfer.getData
            ? e.dataTransfer.getData("text/basket-id")
            : "";
        const basket = document.querySelector(
          `.dynamic-basket[data-id='${id}']`
        );
        if (basket) {
          basket.style.left = x + "px";
          basket.style.top = y + "px";
        }
      } else {
        // 物品在空白处的 drop 操作：不再自动创建新篮子（忽略该操作）
        // 保留通过工具箱创建篮子（create-basket）和移动篮子（move-basket）的行为。
        // 这样可以避免意外在空白处生成大量篮子或错误放置物品。
        return;
      }
    });
  }

  function createDynamicBasket(x, y) {
    const area = document.getElementById("dynamic-area");
    if (!area) return null;

    // 防止短时间内重复创建（例如浏览器可能触发两次 drop 事件）
    // 如果附近已有一个动态篮子（距离小于阈值），则认为是重复创建并忽略。
    const threshold = 24; // px
    const existing = area.querySelectorAll(".dynamic-basket");
    for (let i = 0; i < existing.length; i++) {
      const b = existing[i];
      const bx = parseFloat(b.style.left) || 0;
      const by = parseFloat(b.style.top) || 0;
      if (Math.hypot(bx - x, by - y) < threshold) return null;
    }

    dynamicBasketCounter++;
    const id = "db-" + Date.now() + "-" + dynamicBasketCounter;
    const basket = document.createElement("div");
    basket.className = "dynamic-basket";
    basket.dataset.id = id;
    basket.style.left = x + "px";
    basket.style.top = y + "px";
    basket.draggable = true;
    basket.innerHTML = `
      <div class="basket-icon"><img src="img/basket.jpg" alt="篮子" class="basket-img" draggable="false"></div>
      <div class="basket-title">新分类</div>
      <div class="basket-items"></div>
    `;
    area.appendChild(basket);

    // 应用默认样式（如果后续设置了类型会再次被 applyBasketStyle 覆盖）
    applyBasketStyle(basket, basket.dataset.type || null);

    basket.addEventListener("dragstart", (e) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", "move-basket");
        e.dataTransfer.setData("text/basket-id", id);
      }
    });

    basket.addEventListener("dblclick", () => {
      const current =
        basket.querySelector(".basket-title").textContent || "分类";
      basket.querySelector(".basket-title").textContent =
        current === "新分类" ? "分类" : "新分类";
    });

    basket.addEventListener("dragover", (e) => e.preventDefault());
    basket.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedType =
        e.dataTransfer && e.dataTransfer.getData
          ? e.dataTransfer.getData("text/plain")
          : "";
      if (draggedType === "create-basket" || draggedType === "move-basket")
        return;

      const draggedName =
        e.dataTransfer && e.dataTransfer.getData
          ? e.dataTransfer.getData("text/name")
          : "";
      const draggedImgSrc =
        e.dataTransfer && e.dataTransfer.getData
          ? e.dataTransfer.getData("text/img")
          : "";
      const dragId =
        e.dataTransfer && e.dataTransfer.getData
          ? e.dataTransfer.getData("text/drag-id")
          : "";

      // 优先通过 .item.dragging，否则通过 drag-id 回退查找
      let draggedItem =
        document.querySelector("#items-container-dynamic .item.dragging") ||
        document.querySelector("#items-container .item.dragging");
      if (!draggedItem && dragId)
        draggedItem = document.querySelector(`[data-drag-id="${dragId}"]`);

      const acceptType = basket.dataset.accept || "any";
      const isCorrect = acceptType === "any" || acceptType === draggedType;

      if (isCorrect) {
        if (draggedItem) {
          draggedItem.classList.add("correct");
          setTimeout(() => {
            if (draggedItem && draggedItem.parentNode)
              draggedItem.parentNode.removeChild(draggedItem);
          }, 300);
        }

        const itemsBox = basket.querySelector(".basket-items");
        const icon = document.createElement("img");
        icon.className = "basket-item-icon";
        icon.alt = draggedName || draggedType || "item";
        icon.src =
          draggedImgSrc ||
          (draggedItem &&
            draggedItem.querySelector("img") &&
            draggedItem.querySelector("img").src) ||
          "";
        itemsBox.appendChild(icon);

        window.dynamicCorrectCount = (window.dynamicCorrectCount || 0) + 1;
        const counterEl = document.getElementById("items-counter-dynamic");
        if (counterEl) counterEl.textContent = window.dynamicCorrectCount;
      } else {
        if (draggedItem) {
          draggedItem.classList.add("incorrect");
          // 配合更明显的抖动动画，延长错误类保留时间
          setTimeout(() => draggedItem.classList.remove("incorrect"), 700);
        }
      }
    });

    return basket;
  }

  window.initDynamicTab = initDynamicTab;
  window.createDynamicBasket = createDynamicBasket;
})();
