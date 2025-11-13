// js/box.js
// 全新实现的长方体模块：一次创建几何，通过 scale 更新尺寸。
// 交互契约（简短）:
// - window.boxModule.createBox(scene) : 在 scene 中创建 box（如果尚未创建）并返回
// - window.boxModule.updateBox() : 将 params 应用到 mesh 并同步 UI 文本
// - window.boxModule.resetBox() : 恢复默认尺寸并同步 UI
// - window.boxModule.setActive(bool) : 启用/禁用交互（显示/隐藏轴并阻止事件）
// - window.boxModule.params : {width,height,depth}

(function () {
  // module-scoped state
  let boxMesh = null;
  const boxParams = { width: 4, height: 7, depth: 6 };

  let axesGroup = null;
  let pickX = null,
    pickY = null,
    pickZ = null;
  let listenersAttached = false;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let active = false; // whether box interaction should respond

  const BOX_MIN = 0.3;
  const SMOOTH = 0.4; // lerp factor when dragging
  let notifiedCube = false; // whether we've already congratulated for cube

  // helpers: DOM sync
  function syncDomValues() {
    const elW = document.getElementById("box-width");
    const elH = document.getElementById("box-height");
    const elD = document.getElementById("box-depth");
    const vW = document.getElementById("box-width-value");
    const vH = document.getElementById("box-height-value");
    const vD = document.getElementById("box-depth-value");
    if (elW) elW.value = boxParams.width;
    if (elH) elH.value = boxParams.height;
    if (elD) elD.value = boxParams.depth;
    if (vW) vW.textContent = boxParams.width.toFixed(1);
    if (vH) vH.textContent = boxParams.height.toFixed(1);
    if (vD) vD.textContent = boxParams.depth.toFixed(1);
  }

  // create box mesh and add to scene (idempotent)
  function createBox(scene) {
    if (!scene) return;
    if (!boxMesh) {
      const geom = new THREE.BoxGeometry(1, 1, 1);
      const mats = [
        new THREE.MeshPhongMaterial({ color: 0xff8a80 }),
        new THREE.MeshPhongMaterial({ color: 0xffd54f }),
        new THREE.MeshPhongMaterial({ color: 0xb2ebf2 }),
        new THREE.MeshPhongMaterial({ color: 0xffccbc }),
        new THREE.MeshPhongMaterial({ color: 0xc8e6c9 }),
        new THREE.MeshPhongMaterial({ color: 0xd1c4e9 }),
      ];
      boxMesh = new THREE.Mesh(geom, mats);
      scene.add(boxMesh);
    } else {
      // if we previously removed the mesh from scene, re-add it
      if (boxMesh.parent !== scene) {
        scene.add(boxMesh);
      }
    }
    // create axes once scene is available
    if (!axesGroup) {
      createAxes(scene);
    } else if (axesGroup.parent !== scene) {
      scene.add(axesGroup);
    }
    updateBox(true);
    attachListenersOnce();
    return boxMesh;
  }

  function updateBox(skipDom) {
    if (!boxMesh) return;
    // clamp params to allowed range
    boxParams.width = Math.min(12, Math.max(BOX_MIN, boxParams.width));
    boxParams.height = Math.min(12, Math.max(BOX_MIN, boxParams.height));
    boxParams.depth = Math.min(12, Math.max(BOX_MIN, boxParams.depth));
    boxMesh.scale.set(boxParams.width, boxParams.height, boxParams.depth);
    // reposition axes relative to new size
    updateAxes();
    if (!skipDom) syncDomValues();
    // check for cube condition
    checkForCube();
  }

  function checkForCube() {
    const w = boxParams.width,
      h = boxParams.height,
      d = boxParams.depth;
    const eps = 0.1;
    const wh = Math.abs(w - h),
      wd = Math.abs(w - d),
      hd = Math.abs(h - d);
    const isCube = wh < eps && wd < eps && hd < eps;
    if (isCube && !notifiedCube) {
      notifiedCube = true;
      showCongratsToast("恭喜你得到了一个正方体");
    } else if (!isCube) {
      // reset so future matches will trigger again
      notifiedCube = false;
    }
  }

  function showCongratsToast(text) {
    // create a lightweight toast in the document body
    // create a modal dialog that stays until closed by the user
    let overlay = document.getElementById("cube-congrats-modal-overlay");
    if (overlay) return; // already showing

    // backdrop
    overlay = document.createElement("div");
    overlay.id = "cube-congrats-modal-overlay";
    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.45)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = 10000;

    // modal box
    const box = document.createElement("div");
    box.id = "cube-congrats-modal";
    box.style.background = "#fff8e1";
    box.style.color = "#111";
    // increase padding and border radius to fit much larger text
    box.style.padding = "100px 110px";
    box.style.borderRadius = "60px";
    box.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
    // allow modal to grow but stay responsive
    box.style.maxWidth = "90%";
    box.style.textAlign = "center";

    const title = document.createElement("div");
    title.textContent = text;
    // enlarge title ~5x for kid-friendly visibility
    title.style.fontSize = "100px";
    title.style.fontWeight = "700";
    title.style.marginBottom = "24px";

    const hint = document.createElement("div");
    // show a cute emoji + short praise instead of instructing to close
    hint.textContent = "🎉😺 真棒！";
    // enlarge hint text as well
    hint.style.fontSize = "70px";
    hint.style.marginBottom = "20px";
    hint.style.opacity = "0.95";

    const btn = document.createElement("button");
    btn.textContent = "关闭";
    // enlarge button so it's easy to tap/click
    btn.style.padding = "40px 70px";
    btn.style.border = "none";
    btn.style.borderRadius = "40px";
    btn.style.background = "#ffd54f";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "70px";

    btn.addEventListener("click", () => {
      try {
        overlay.parentNode.removeChild(overlay);
      } catch (e) {}
    });

    box.appendChild(title);
    box.appendChild(hint);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // focus for accessibility
    btn.focus();
  }

  function resetBox() {
    boxParams.width = 4;
    boxParams.height = 7;
    boxParams.depth = 6;
    updateBox();
  }

  // build axes visuals: rods, arrows, and larger semi-transparent pick spheres
  function createAxes(scene) {
    axesGroup = new THREE.Group();

    // 增加杆粗细、箭头与把手尺寸，并使用不受光照的材质以去除高光
    const rodGeom = new THREE.CylinderGeometry(0.14, 0.14, 1, 12);
    const coneGeom = new THREE.ConeGeometry(0.22, 0.6, 12);
    const pickGeom = new THREE.SphereGeometry(0.44, 16, 16);

    // X (red) - point along +X
    const matX = new THREE.MeshBasicMaterial({ color: 0xff5252 });
    const rodX = new THREE.Mesh(rodGeom, matX);
    rodX.rotation.z = Math.PI / 2; // align cylinder to X
    const arrowX = new THREE.Mesh(coneGeom, matX);
    arrowX.rotation.z = -Math.PI / 2; // point cone along +X
    pickX = new THREE.Mesh(
      pickGeom,
      new THREE.MeshBasicMaterial({
        color: 0xff8a80,
        transparent: true,
        opacity: 0.12,
      })
    );
    pickX.userData.axis = "x";

    // Y (green) - point along +Y (up)
    const matY = new THREE.MeshBasicMaterial({ color: 0x66bb6a });
    const rodY = new THREE.Mesh(rodGeom, matY); // cylinder default along Y
    const arrowY = new THREE.Mesh(coneGeom, matY); // cone default points +Y
    pickY = new THREE.Mesh(
      pickGeom,
      new THREE.MeshBasicMaterial({
        color: 0xc8e6c9,
        transparent: true,
        opacity: 0.12,
      })
    );
    pickY.userData.axis = "y";

    // 禁用 Y 轴相关对象的射线检测，彻底避免 hover/drag 被触发
    try {
      rodY.raycast = function () {};
      arrowY.raycast = function () {};
      pickY.raycast = function () {};
    } catch (e) {}

    // Z (blue) - point along +Z (forward)
    const matZ = new THREE.MeshBasicMaterial({ color: 0x42a5f5 });
    const rodZ = new THREE.Mesh(rodGeom, matZ);
    rodZ.rotation.x = Math.PI / 2; // align cylinder to Z
    const arrowZ = new THREE.Mesh(coneGeom, matZ);
    arrowZ.rotation.x = Math.PI / 2; // point cone along +Z
    pickZ = new THREE.Mesh(
      pickGeom,
      new THREE.MeshBasicMaterial({
        color: 0xb2ebf2,
        transparent: true,
        opacity: 0.12,
      })
    );
    pickZ.userData.axis = "z";

    // 隐藏把手碰撞体，避免显示顶部或外围的半透明光圈
    pickX.visible = false;
    pickY.visible = false;
    pickZ.visible = false;

    // Add in a consistent order for easier indexing
    axesGroup.add(rodX, arrowX, pickX);
    axesGroup.add(rodY, arrowY, pickY);
    axesGroup.add(rodZ, arrowZ, pickZ);

    scene.add(axesGroup);
    updateAxes();
    axesGroup.visible = active;
  }

  function updateAxes() {
    if (!axesGroup || !boxMesh) return;
    const w = boxParams.width,
      h = boxParams.height,
      d = boxParams.depth;
    // children order: rodX, arrowX, pickX, rodY, arrowY, pickY, rodZ, arrowZ, pickZ
    if (axesGroup.children.length < 9) return;
    const rodX = axesGroup.children[0],
      arrowX = axesGroup.children[1],
      pX = axesGroup.children[2];
    const rodY = axesGroup.children[3],
      arrowY = axesGroup.children[4],
      pY = axesGroup.children[5];
    const rodZ = axesGroup.children[6],
      arrowZ = axesGroup.children[7],
      pZ = axesGroup.children[8];

    // compute outward rod length and positions so rods start at box surface
    // 增加轴杆的外延范围，使轴看起来更长
    const outX = Math.max(0.9, Math.min(2.0, w * 0.3 + 0.9));
    rodX.scale.set(1, outX, 1);
    rodX.position.set(w / 2 + outX / 2, 0, 0);
    arrowX.position.set(w / 2 + outX + 0.18, 0, 0);
    pX.position.set(w / 2 + outX + 0.48, 0, 0);

    const outY = Math.max(0.9, Math.min(2.0, h * 0.3 + 0.9));
    rodY.scale.set(1, outY, 1);
    rodY.position.set(0, h / 2 + outY / 2, 0);
    arrowY.position.set(0, h / 2 + outY + 0.18, 0);
    pY.position.set(0, h / 2 + outY + 0.48, 0);

    const outZ = Math.max(0.9, Math.min(2.0, d * 0.3 + 0.9));
    rodZ.scale.set(1, outZ, 1);
    rodZ.position.set(0, 0, d / 2 + outZ / 2);
    arrowZ.position.set(0, 0, d / 2 + outZ + 0.18);
    pZ.position.set(0, 0, d / 2 + outZ + 0.48);

    // (old fixed positions removed; new outward-based positions above are used)
  }

  // pointer helpers
  function computePointerNDC(event) {
    const canvas = document.querySelector("#cylinder-canvas");
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  // hover feedback (only cursor change)
  function handleHover(event) {
    if (!axesGroup) return;
    computePointerNDC(event);
    raycaster.setFromCamera(pointer, window.camera);
    const picks = [pickX, pickY, pickZ].filter(Boolean);
    const ints = raycaster.intersectObjects(picks, true);
    const canvas = document.querySelector("#cylinder-canvas");
    // 移除 hover 时的放大与透明度变化，仅改变光标提示
    if (ints.length > 0) {
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = "auto";
    }
  }
  // 交互已精简：不再包含通过轴拖拽来改变尺寸的逻辑，尺寸由滑块控制

  function attachListenersOnce() {
    if (listenersAttached) return;
    const canvas = document.querySelector("#cylinder-canvas");
    if (!canvas) return;
    // 仅保留 hover 的光标提示
    canvas.addEventListener("pointermove", handleHover);
    listenersAttached = true;
  }

  function setActive(v) {
    active = !!v;
    if (axesGroup) axesGroup.visible = active;
    // no drag state to clean up since dragging was removed
  }

  // Exported module API
  window.boxModule = {
    createBox: createBox,
    updateBox: updateBox,
    resetBox: resetBox,
    setActive: setActive,
    params: boxParams,
    mesh: () => boxMesh,
  };
})();
