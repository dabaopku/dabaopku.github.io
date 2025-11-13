const itemsContainer = document.getElementById("items-container");
const itemsCounter = document.getElementById("items-counter");
const totalItemsElement = document.getElementById("total-items");
const successMessage = document.getElementById("success-message");

function initGame() {
  if (typeof correctCount === "undefined") window.correctCount = 0;
  else correctCount = 0;

  if (itemsCounter) itemsCounter.textContent = correctCount;
  if (totalItemsElement && typeof totalItems !== "undefined")
    totalItemsElement.textContent = totalItems;
  if (successMessage) successMessage.style.display = "none";
  if (!itemsContainer) return;

  itemsContainer.innerHTML = "";

  document.querySelectorAll(".basket").forEach((basket) => {
    let basketItemsBox = basket.querySelector(".basket-items");
    if (!basketItemsBox) {
      basketItemsBox = document.createElement("div");
      basketItemsBox.className = "basket-items";
      const title = basket.querySelector(".basket-title");
      if (title && title.nextSibling) {
        basket.insertBefore(basketItemsBox, title.nextSibling);
      } else if (title) {
        basket.appendChild(basketItemsBox);
      } else {
        basket.appendChild(basketItemsBox);
      }
    }
    basketItemsBox.innerHTML = "";
  });

  const shuffledItems = Array.isArray(items)
    ? [...items].sort(() => Math.random() - 0.5)
    : [];
  shuffledItems.forEach((item) => {
    const itemElement = document.createElement("div");
    itemElement.className = "item";
    itemElement.draggable = true;
    itemElement.dataset.type = item.type;
    itemElement.dataset.name = item.name;

    const emojiImg = document.createElement("img");
    emojiImg.className = "item-img";
    emojiImg.alt = item.name || "";
    emojiImg.draggable = false;
    emojiImg.src = item.img || "";

    itemElement.appendChild(emojiImg);
    itemsContainer.appendChild(itemElement);

    // 添加唯一 drag id（跨容器唯一）
    if (typeof window._dragIdCounter === "undefined") window._dragIdCounter = 0;
    window._dragIdCounter++;
    itemElement.dataset.dragId =
      "item-" + Date.now() + "-" + window._dragIdCounter;

    itemElement.addEventListener("dragstart", handleDragStart);
    itemElement.addEventListener("dragend", handleDragEnd);
  });

  document.querySelectorAll(".basket").forEach((basket) => {
    basket.addEventListener("dragover", handleDragOver);
    basket.addEventListener("drop", handleDrop);
  });

  const basketsContainer = document.querySelector(".baskets-container");
  if (basketsContainer) {
    basketsContainer.addEventListener("dragover", (e) => e.preventDefault());
    basketsContainer.addEventListener("drop", (e) => {
      e.preventDefault();
      const isOnBlank =
        e.target === basketsContainer ||
        (e.target &&
          e.target.classList &&
          !e.target.classList.contains("basket"));
      if (!isOnBlank) return;
      const parentBasket = e.target.closest && e.target.closest(".basket");
      if (parentBasket) return;
      // 在空白区域丢弃物品时：不再自动创建新篮子（忽略此行为）
      // 保持只能通过已有篮子放置或通过工具箱创建新篮子
      return;
    });
  }
}

// 拖拽开始
function handleDragStart(e) {
  this.classList.add("dragging");
  if (e.dataTransfer && typeof e.dataTransfer.setData === "function") {
    e.dataTransfer.setData("text/plain", this.dataset.type || "");
    if (this.dataset.name)
      e.dataTransfer.setData("text/name", this.dataset.name);
    // 新增：传递 drag-id，便于模拟 drop 时定位元素
    if (this.dataset.dragId) {
      try {
        e.dataTransfer.setData("text/drag-id", this.dataset.dragId);
      } catch (err) {}
    }
    const imgEl = this.querySelector && this.querySelector("img");
    if (imgEl && imgEl.src) {
      try {
        e.dataTransfer.setData("text/img", imgEl.src);
      } catch (err) {}
    }
  }
}

function handleDragEnd() {
  this.classList.remove("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
}

// 放置物品（核心）
function handleDrop(e) {
  e.preventDefault();
  const draggedItemType =
    e.dataTransfer && e.dataTransfer.getData
      ? e.dataTransfer.getData("text/plain")
      : "";
  const basketType = this.dataset.type;

  // 尝试通过 .item.dragging 找到元素，如没有则使用 drag-id 回退
  let draggedItem = document.querySelector(".item.dragging");
  if (!draggedItem) {
    const dragId =
      e.dataTransfer && e.dataTransfer.getData
        ? e.dataTransfer.getData("text/drag-id")
        : "";
    if (dragId) {
      draggedItem = document.querySelector(`[data-drag-id="${dragId}"]`);
    }
  }

  if (!draggedItem) return;

  if (draggedItemType === basketType) {
    if (typeof correctCount === "undefined") window.correctCount = 1;
    else correctCount++;
    if (itemsCounter) itemsCounter.textContent = correctCount;
    draggedItem.classList.add("correct");

    let basketItemsBox = this.querySelector(".basket-items");
    if (!basketItemsBox) {
      basketItemsBox = document.createElement("div");
      basketItemsBox.className = "basket-items";
      this.appendChild(basketItemsBox);
    }
    const imgEl = draggedItem.querySelector("img");
    const icon = document.createElement("img");
    icon.className = "basket-item-icon";
    icon.alt = draggedItem.dataset.name || draggedItemType || "item";
    icon.src = imgEl ? imgEl.src : "";
    basketItemsBox.appendChild(icon);

    // 移除物品
    setTimeout(() => {
      if (draggedItem && draggedItem.parentNode)
        draggedItem.parentNode.removeChild(draggedItem);
      if (
        typeof totalItems !== "undefined" &&
        correctCount === totalItems &&
        successMessage
      )
        showSuccessMessage();
    }, 500);
  } else {
    draggedItem.classList.add("incorrect");
    // 保持错误状态一段时间以配合更明显的抖动动画
    setTimeout(() => draggedItem.classList.remove("incorrect"), 700);
  }
}

function showSuccessMessage() {
  if (successMessage) {
    successMessage.style.display = "flex";
    const btn = document.getElementById("success-restart");
    if (btn) {
      btn.onclick = () => {
        successMessage.style.display = "none";
        if (typeof correctCount !== "undefined") correctCount = 0;
        if (typeof window.dynamicCorrectCount !== "undefined")
          window.dynamicCorrectCount = 0;
        initGame();
        if (typeof initDynamicTab === "function") initDynamicTab();
      };
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    if (typeof initThreeIcons === "function") initThreeIcons();
  } catch (e) {
    console.warn("initThreeIcons 出错：", e);
  }
  try {
    if (typeof initDynamicTab === "function") initDynamicTab();
  } catch (e) {
    console.warn("initDynamicTab 出错：", e);
  }
  try {
    initGame();
  } catch (e) {
    console.warn("initGame 出错：", e);
  }
  try {
    if (typeof initTabs === "function") initTabs();
  } catch (e) {
    console.warn("initTabs 出错：", e);
  }
});
