(function () {
  let draggedElement = null;
  let startX = 0,
    startY = 0;

  function handleTouchStart(e) {
    const targetItem = e.target.closest && e.target.closest(".item");
    if (!targetItem) return;
    draggedElement = targetItem;
    const rect = draggedElement.getBoundingClientRect();
    startX = e.touches[0].clientX - rect.left;
    startY = e.touches[0].clientY - rect.top;
    draggedElement.classList.add("dragging");
    e.preventDefault();
  }

  function handleTouchMove(e) {
    if (!draggedElement) return;
    const x = e.touches[0].clientX - startX;
    const y = e.touches[0].clientY - startY;
    draggedElement.style.position = "absolute";
    draggedElement.style.left = x + "px";
    draggedElement.style.top = y + "px";
    e.preventDefault();
  }

  function handleTouchEnd(e) {
    if (!draggedElement) return;
    const baskets = document.querySelectorAll(".basket, .dynamic-basket");
    let dropped = false;
    baskets.forEach((basket) => {
      const rect = basket.getBoundingClientRect();
      const itemRect = draggedElement.getBoundingClientRect();
      if (
        !(
          itemRect.right < rect.left ||
          itemRect.left > rect.right ||
          itemRect.bottom < rect.top ||
          itemRect.top > rect.bottom
        )
      ) {
        const event = new Event("drop");
        event.dataTransfer = {
          getData: (type) => {
            if (type === "text/plain") return draggedElement.dataset.type;
            if (type === "text/drag-id")
              return draggedElement.dataset.dragId || "";
            if (type === "text/name") return draggedElement.dataset.name || "";
            if (type === "text/img") {
              const img =
                draggedElement.querySelector &&
                draggedElement.querySelector("img");
              return img && img.src ? img.src : "";
            }
            return "";
          },
        };
        basket.dispatchEvent(event);
        dropped = true;
      }
    });

    if (!dropped) {
      draggedElement.style.position = "";
      draggedElement.style.left = "";
      draggedElement.style.top = "";
    }
    draggedElement.classList.remove("dragging");
    draggedElement = null;
  }

  document.addEventListener("touchstart", handleTouchStart, { passive: false });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd, { passive: false });
})();
