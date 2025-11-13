// ui.js
// 简单的页签控制与长方体滑块联动
(function () {
  function $(s) {
    return document.querySelector(s);
  }
  function $all(s) {
    return document.querySelectorAll(s);
  }

  function showTab(tab) {
    const infoP = document.querySelector("#info p");
    const legend = document.querySelector("#info .legend");
    const tabs = $all(".tab");
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));

    const cylControls = $("#cylinder-controls");
    const boxControls = $("#box-controls");

    if (tab === "cylinder") {
      if (infoP)
        infoP.textContent = "拖拽箭头调整圆柱体尺寸 | 在空白区域拖拽旋转视角";
      if (legend) {
        // cylinder handles: radius (橙色), height (蓝色)
        legend.innerHTML =
          "" +
          '<div class="item"><span class="dot radius-dot"></span> 拖拽橙色把手：调整半径</div>' +
          '<div class="item"><span class="dot cyl-height-dot"></span> 拖拽蓝色把手：调整高度</div>';
      }
      if (cylControls) cylControls.style.display = "";
      if (boxControls) boxControls.style.display = "none";
      // ensure cylinder (script.js) remains active; remove box if exists
      // 显示圆柱体（如果已创建），并移除长方体
      if (window.cylinder) window.cylinder.visible = true;
      if (
        window.boxModule &&
        typeof window.boxModule.setActive === "function"
      ) {
        window.boxModule.setActive(false);
        // remove mesh from scene to avoid occlusion
        if (
          window.boxModule.mesh &&
          typeof window.boxModule.mesh === "function"
        ) {
          const m = window.boxModule.mesh();
          if (m && m.parent) m.parent.remove(m);
        }
      }
      // show cylinder's arrows/handles if present
      if (window.arrows) window.arrows.visible = true;
      // ensure cylinder UI visible handled by existing script
    } else if (tab === "box") {
      if (infoP)
        infoP.textContent = "拖拽箭头调整长方体尺寸 | 在空白区域拖拽旋转视角";
      if (legend) {
        // box handles: width (红), height (绿), depth (蓝)
        legend.innerHTML =
          "" +
          '<div class="item"><span class="dot width-dot"></span> 拖拽红色把手：调整宽度</div>' +
          '<div class="item"><span class="dot height-dot"></span> 拖拽绿色把手：调整高度</div>' +
          '<div class="item"><span class="dot depth-dot"></span> 拖拽蓝色把手：调整深度</div>';
      }
      if (cylControls) cylControls.style.display = "none";
      if (boxControls) boxControls.style.display = "";
      // create box in scene
      // 隐藏圆柱体（如果存在）
      if (window.cylinder) window.cylinder.visible = false;
      // hide cylinder's arrows/handles while editing box
      if (window.arrows) window.arrows.visible = false;
      if (
        window.boxModule &&
        typeof window.boxModule.createBox === "function"
      ) {
        window.boxModule.createBox(window.scene);
        if (typeof window.boxModule.setActive === "function")
          window.boxModule.setActive(true);
        // sync sliders with params and visible text values
        const bw = document.getElementById("box-width");
        const bh = document.getElementById("box-height");
        const bd = document.getElementById("box-depth");
        if (bw) bw.value = window.boxModule.params.width;
        if (bh) bh.value = window.boxModule.params.height;
        if (bd) bd.value = window.boxModule.params.depth;
        const vW = document.getElementById("box-width-value");
        const vH = document.getElementById("box-height-value");
        const vD = document.getElementById("box-depth-value");
        if (vW) vW.textContent = window.boxModule.params.width.toFixed(1);
        if (vH) vH.textContent = window.boxModule.params.height.toFixed(1);
        if (vD) vD.textContent = window.boxModule.params.depth.toFixed(1);
      }
    }
  }

  function init() {
    // attach tab click handlers
    const tabs = $all(".tab");
    tabs.forEach((t) =>
      t.addEventListener("click", () => showTab(t.dataset.tab))
    );

    // bind box sliders if present
    const bw = $("#box-width");
    const bh = $("#box-height");
    const bd = $("#box-depth");
    if (bw) {
      bw.addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        if (window.boxModule) {
          window.boxModule.params.width = v;
          window.boxModule.updateBox();
        }
        const el = $("#box-width-value");
        if (el) el.textContent = v.toFixed(1);
      });
    }
    if (bh) {
      bh.addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        if (window.boxModule) {
          window.boxModule.params.height = v;
          window.boxModule.updateBox();
        }
        const el = $("#box-height-value");
        if (el) el.textContent = v.toFixed(1);
      });
    }
    if (bd) {
      bd.addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        if (window.boxModule) {
          window.boxModule.params.depth = v;
          window.boxModule.updateBox();
        }
        const el = $("#box-depth-value");
        if (el) el.textContent = v.toFixed(1);
      });
    }

    // reset button should reset both modules
    const reset = $("#reset-btn");
    if (reset) {
      reset.addEventListener("click", () => {
        // cylinder reset handled by existing handler bound in script.js
        if (window.boxModule && typeof window.boxModule.resetBox === "function")
          window.boxModule.resetBox();
      });
    }

    // default show cylinder tab
    showTab("cylinder");
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
