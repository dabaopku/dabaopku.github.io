(function () {
  if (typeof THREE === "undefined") {
    // THREE 不存在时静默跳过
    window.initThreeIcons = function () {};
    return;
  }

  let threeIcons = [];
  let threeAnimId = null;

  function initThreeIcons() {
    // 清理旧渲染器与动画
    try {
      if (threeAnimId) {
        cancelAnimationFrame(threeAnimId);
        threeAnimId = null;
      }
      threeIcons.forEach((obj) => {
        try {
          if (
            obj.renderer &&
            obj.renderer.domElement &&
            obj.renderer.domElement.parentNode
          ) {
            obj.renderer.domElement.parentNode.removeChild(
              obj.renderer.domElement
            );
          }
          if (obj.renderer && obj.renderer.forceContextLoss)
            obj.renderer.forceContextLoss();
        } catch (e) {}
      });
      threeIcons = [];
    } catch (e) {}

    document.querySelectorAll(".three-icon").forEach((el) => {
      el.innerHTML = "";
      const width = el.clientWidth || 72;
      const height = el.clientHeight || 72;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 3);

      const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
      scene.add(hemi);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(5, 5, 5);
      scene.add(dir);

      const shape = el.dataset.shape;
      let geom;
      if (shape === "cube") geom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      else if (shape === "cuboid") geom = new THREE.BoxGeometry(1.5, 1.0, 0.6);
      else if (shape === "cylinder") geom = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 32);
      else if (shape === "sphere") geom = new THREE.SphereGeometry(0.9, 32, 32);
      else geom = new THREE.BoxGeometry(1, 1, 1);

      let mat = new THREE.MeshStandardMaterial({ color: 0x5b6be6, metalness: 0.2, roughness: 0.4 });
      if (shape === "cube") mat = new THREE.MeshStandardMaterial({ color: 0xff8a65, metalness: 0.25, roughness: 0.35 });
      else if (shape === "cuboid") mat = new THREE.MeshStandardMaterial({ color: 0x8e44ad, metalness: 0.12, roughness: 0.45 });
      else if (shape === "cylinder") mat = new THREE.MeshStandardMaterial({ color: 0x4db6ac, metalness: 0.1, roughness: 0.4 });
      else if (shape === "sphere") mat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.05, roughness: 0.25 });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.set(0.35, -0.6, 0);
      scene.add(mesh);

      threeIcons.push({ el, renderer, scene, camera, mesh });
    });

    animate();
  }

  function animate() {
    if (threeAnimId) cancelAnimationFrame(threeAnimId);
    function loop() {
      threeIcons.forEach((obj) => {
        obj.mesh.rotation.y += 0.01;
        obj.mesh.rotation.x += 0.003;
        obj.renderer.render(obj.scene, obj.camera);
      });
      threeAnimId = requestAnimationFrame(loop);
    }
    loop();
  }

  window.initThreeIcons = initThreeIcons;

  window.addEventListener("resize", () => {
    threeIcons.forEach((obj) => {
      const w = obj.el.clientWidth || 72;
      const h = obj.el.clientHeight || 72;
      obj.renderer.setSize(w, h);
      obj.camera.aspect = w / h;
      obj.camera.updateProjectionMatrix();
    });
  });
})();
