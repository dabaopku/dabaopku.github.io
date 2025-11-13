let scene, camera, renderer, cylinder, arrows, controls;
// 正交相机的视锥大小（可以根据需要调整）
let frustumSize = 20;
let cylinderParams = {
  radius: 2,
  height: 4,
  radialSegments: 32,
};

// 射线与鼠标对象（用于 hover 检测）
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
// 可调参数：灵敏度（越小越不敏感），和平滑系数（0-1，越小越平滑）
const RADIUS_SENSITIVITY = 0.55;
const SMOOTHING = 0.25;
const RADIUS_MIN = 0.3;

function init() {
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // 将 scene 暴露到 window，供其他模块（如 ui.js / box.js）使用
  window.scene = scene;

  // 创建正交相机（替代原来的透视相机）
  // 计算当前画布宽高比
  const aspect =
    document.getElementById("canvas-container").clientWidth /
    document.getElementById("canvas-container").clientHeight;
  camera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    1000
  );
  // 初始镜头：稍微俯视（约 60 度）并向后拉远一点，给小学生一个更直观的俯瞰视角
  const radius = 10;
  const phi = THREE.Math.degToRad(60); // 60 度俯视
  const theta = THREE.Math.degToRad(45); // 45 度 侧向偏转，稍微倾斜
  camera.position.set(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // expose camera for other modules
  window.camera = camera;

  // 创建渲染器
  const canvas = document.getElementById("cylinder-canvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(
    document.getElementById("canvas-container").clientWidth,
    document.getElementById("canvas-container").clientHeight
  );

  // 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  // 创建圆柱体
  createCylinder();

  // 添加箭头
  createArrows();

  // 添加轨道控制器
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // expose controls for external modules (so they can disable during interaction)
  window.controls = controls;

  // 添加事件监听
  setupEventListeners();

  // 开始动画循环
  animate();
}

function createCylinder() {
  // 优化：只创建一次几何体，之后通过 scale 更新尺寸，避免频繁重建带来的卡顿
  if (!cylinder) {
    const geometry = new THREE.CylinderGeometry(
      1,
      1,
      1,
      cylinderParams.radialSegments
    );
    const material = new THREE.MeshPhongMaterial({
      color: 0x4caf50,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    });
    cylinder = new THREE.Mesh(geometry, material);
    scene.add(cylinder);
    // 暴露 cylinder 到 window 以便 ui 模块能控制可见性
    window.cylinder = cylinder;
  }

  // 将模型缩放到目标半径/高度（圆柱以中心为原点，Y 轴为高度）
  cylinder.scale.set(
    cylinderParams.radius,
    cylinderParams.height,
    cylinderParams.radius
  );
}

function createArrows() {
  // 如果已有 arrows，则更新子对象的位置和尺寸以避免重建导致的性能问题
  if (!arrows) {
    arrows = new THREE.Group();

    // 横向箭头（调整半径） — 更大一些，使用 MeshBasicMaterial 避免受光照产生高光
    const horizontalArrowGeometry = new THREE.ConeGeometry(0.38, 0.9, 12);
    const horizontalArrowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5722,
    });
    const horizontalArrow = new THREE.Mesh(
      horizontalArrowGeometry,
      horizontalArrowMaterial
    );
    // 指向 +X 方向（朝外），使用 -PI/2；之前为 +PI/2 导致指向 -X（朝内）
    horizontalArrow.rotation.z = -Math.PI / 2;
    horizontalArrow.userData.type = "radius";

    // 横向箭头的杆
    // 增加杆的粗细和长度
    const horizontalLineGeometry = new THREE.CylinderGeometry(
      0.12,
      0.12,
      2.4,
      10
    );
    const horizontalLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5722,
    });
    const horizontalLine = new THREE.Mesh(
      horizontalLineGeometry,
      horizontalLineMaterial
    );
    horizontalLine.rotation.z = Math.PI / 2;
    horizontalLine.userData.type = "radius";

    // 径向箭头（调整高度）
    // 垂直箭头也放大并使用 MeshBasicMaterial
    const verticalArrowGeometry = new THREE.ConeGeometry(0.38, 0.9, 12);
    const verticalArrowMaterial = new THREE.MeshBasicMaterial({
      color: 0x2196f3,
    });
    const verticalArrow = new THREE.Mesh(
      verticalArrowGeometry,
      verticalArrowMaterial
    );
    verticalArrow.userData.type = "height";

    // 径向箭头的杆
    const verticalLineGeometry = new THREE.CylinderGeometry(
      0.12,
      0.12,
      2.4,
      10
    );
    const verticalLineMaterial = new THREE.MeshBasicMaterial({
      color: 0x2196f3,
    });
    const verticalLine = new THREE.Mesh(
      verticalLineGeometry,
      verticalLineMaterial
    );
    verticalLine.userData.type = "height";

    // 半透明可见的碰撞把手
    // 把手球体略大但更不显眼，使用 MeshBasicMaterial（无光照高光）
    const pickRadiusGeom = new THREE.SphereGeometry(0.7, 12, 12);
    const pickHeightGeom = new THREE.SphereGeometry(0.7, 12, 12);
    const pickRadiusMat = new THREE.MeshBasicMaterial({
      color: 0xffccbb,
      transparent: true,
      opacity: 0.12,
    });
    const pickHeightMat = new THREE.MeshBasicMaterial({
      color: 0xbde0ff,
      transparent: true,
      opacity: 0.12,
    });
    const pickRadius = new THREE.Mesh(pickRadiusGeom, pickRadiusMat);
    const pickHeight = new THREE.Mesh(pickHeightGeom, pickHeightMat);
    pickRadius.userData.type = "radius";
    pickHeight.userData.type = "height";

    // 隐藏 pick 球（用于点击/拾取的可见碰撞体），避免显示顶部的半透明光圈
    pickRadius.visible = false;
    pickHeight.visible = false;

    // 禁用 height 轴（上方向轴）的射线检测，确保不会被 hover 或 pointer 交互触发
    // 覆盖对象的 raycast 方法使其不可被 Raycaster 检测到
    try {
      verticalArrow.raycast = function () {};
      verticalLine.raycast = function () {};
      pickHeight.raycast = function () {};
    } catch (e) {}

    // 将对象保存到 userData 以便后续更新
    arrows.userData.horizontalArrow = horizontalArrow;
    arrows.userData.horizontalLine = horizontalLine;
    arrows.userData.verticalArrow = verticalArrow;
    arrows.userData.verticalLine = verticalLine;
    arrows.userData.pickRadius = pickRadius;
    arrows.userData.pickHeight = pickHeight;

    arrows.add(
      horizontalArrow,
      horizontalLine,
      verticalArrow,
      verticalLine,
      pickRadius,
      pickHeight
    );
    scene.add(arrows);
    // expose arrows group so UI can show/hide cylinder handles when switching tabs
    window.arrows = arrows;
  }

  // 更新把手的位置/大小（当参数改变时调用）
  const hArrow = arrows.userData.horizontalArrow;
  const hLine = arrows.userData.horizontalLine;
  const vArrow = arrows.userData.verticalArrow;
  const vLine = arrows.userData.verticalLine;
  const pRadius = arrows.userData.pickRadius;
  const pHeight = arrows.userData.pickHeight;

  // 横向位置基于半径
  const hrX = cylinderParams.radius + 1.0;
  hArrow.position.set(hrX, 0, 0);
  hLine.scale.set(1, Math.max(1, cylinderParams.radius + 0.6) / 1.8, 1);
  hLine.position.set((cylinderParams.radius + 0.4) / 2 + 0.1, 0, 0);
  pRadius.position.set(hrX, 0, 0);

  // 纵向位置基于高度
  const vhY = cylinderParams.height / 2 + 1.0;
  vArrow.position.set(0, vhY, 0);
  vLine.scale.set(1, Math.max(1, cylinderParams.height / 2 + 0.6) / 1.8, 1);
  vLine.position.set(0, (cylinderParams.height / 2 + 0.4) / 2 + 0.1, 0);
  pHeight.position.set(0, vhY, 0);
}

function setupEventListeners() {
  const canvas = renderer.domElement;
  // 帮助函数：根据事件计算 canvas 上的 NDC 坐标
  function getMouseNDC(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }

  // 使用 pointermove 进行悬停检测（仅改变光标提示）
  canvas.addEventListener("pointermove", (event) => {
    if (!arrows) return;

    const ndc = getMouseNDC(event);
    mouse.x = ndc.x;
    mouse.y = ndc.y;
    raycaster.setFromCamera(mouse, camera);

    const pickObjects = [];
    if (arrows.userData && arrows.userData.pickRadius)
      pickObjects.push(arrows.userData.pickRadius);
    if (arrows.userData && arrows.userData.pickHeight)
      pickObjects.push(arrows.userData.pickHeight);

    const intersects = raycaster.intersectObjects(pickObjects, true);
    renderer.domElement.style.cursor =
      intersects.length > 0 ? "pointer" : "auto";
  });

  // 不再监听 pointerdown 来启动把手拖拽——拖拽逻辑已被移除，OrbitControls 负责空白区域交互

  // 拖拽逻辑已移除：不再监听 pointermove 来改变圆柱尺寸，尺寸仅由界面滑块控制

  // 已不再需要 pointerup/pointercancel/pointerleave 清理拖拽状态

  // 窗口大小调整
  window.addEventListener("resize", onWindowResize);

  // 滑块控制
  document.getElementById("radius").addEventListener("input", updateCylinder);
  document.getElementById("height").addEventListener("input", updateCylinder);

  // 重置按钮
  document.getElementById("reset-btn").addEventListener("click", resetCylinder);
}

function updateCylinder() {
  cylinderParams.radius = parseFloat(document.getElementById("radius").value);
  cylinderParams.height = parseFloat(document.getElementById("height").value);

  document.getElementById("radius-value").textContent =
    cylinderParams.radius.toFixed(1);
  document.getElementById("height-value").textContent =
    cylinderParams.height.toFixed(1);

  createCylinder();
  createArrows();
}

function resetCylinder() {
  document.getElementById("radius").value = 2;
  document.getElementById("height").value = 4;
  updateCylinder();
}

function onWindowResize() {
  const width = document.getElementById("canvas-container").clientWidth;
  const height = document.getElementById("canvas-container").clientHeight;
  const aspect = width / height;
  // 重新计算正交相机的左右上下平面
  camera.left = (-frustumSize * aspect) / 2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(
    document.getElementById("canvas-container").clientWidth,
    document.getElementById("canvas-container").clientHeight
  );
}

function animate() {
  requestAnimationFrame(animate);

  // 更新控制器
  controls.update();

  // 渲染场景
  renderer.render(scene, camera);
}

// 初始化应用
window.addEventListener("DOMContentLoaded", init);
