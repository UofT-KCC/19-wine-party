import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * invitationEngine.js - Optimized 3D engine for Invitation.
 * Features:
 * 1. Visibility-based pausing.
 * 2. Resource management.
 * 3. Throttled/Smooth animations.
 */
export function initInvitationEngine(container) {
  let _disposed = false;
  let _paused = false;
  let _renderer = null;
  let _camera = null;
  let _scene = null;
  let _wine = null;
  let _wine2 = null;
  let _liquid = null;
  let _liquid2 = null;
  let _liquidMat = null;
  let _liquidMat2 = null;
  let _scrollT = 0;
  let _targetScrollT = 0;
  let _rafId = null;

  // --- FINAL TUNED CONSTANTS ---
  const CAMERA_START_POS = { x: 1, y: 1.8, z: 1 };
  const CAMERA_START_LOOKAT = { x: 0, y: 0.3, z: -0.5 };
  const CAMERA_DEST_POS = { x: 1, y: 1.5, z: 1 };
  const CAMERA_DEST_LOOKAT = { x: 0, y: 0.3, z: -0.5 };

  // Perfect alignment found by user
  const LIQUID_OFFSETS = { x: 0.182, z: 0.055 };
  const BOWL_BOTTOM_Y = 0.45; 
  const BOWL_TOP_Y = 0.75; 
  const BOWL_HEIGHT = BOWL_TOP_Y - BOWL_BOTTOM_Y;

  // --- CLINK TUNING VARIABLES ---
  const GLASS2_START_X = 1.5; // Nearer start to prevent sudden pop-in
  const GLASS2_DEST_X = 0.7; // Slightly further for "pre-clink" stop
  const SLIDE_START_T = 0.33; // Start moving Glass 2 as we leave Hero (Section 1)
  const SLIDE_END_T = 0.66;    // Arrive at Story (Section 2) -> Perfect landing at Snap 3
  const CLINK_START_T = 0.66;  // Start clink AFTER reaching snap 3
  const CLINK_END_T = 1.0;    // Clink finishes as we reach QR (Section 3)

  async function init() {
    _scene = new THREE.Scene();

    _camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    _camera.position.set(CAMERA_START_POS.x, CAMERA_START_POS.y, CAMERA_START_POS.z);
    _camera.lookAt(CAMERA_START_LOOKAT.x, CAMERA_START_LOOKAT.y, CAMERA_START_LOOKAT.z);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    _scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 2.5, 10);
    point.position.set(2, 4, 3);
    _scene.add(point);

    _renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    _renderer.setSize(container.clientWidth, container.clientHeight);
    _renderer.toneMapping = THREE.ACESFilmicToneMapping;
    _renderer.toneMappingExposure = 1.6;
    _renderer.localClippingEnabled = true;
    _renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(_renderer.domElement);

    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('/wine_glass.glb');
      _wine = gltf.scene;
      _wine.scale.setScalar(1.6); // Slightly larger
      _wine.position.set(0, -0.6, 0); // Fixed horizontal center
      _scene.add(_wine);
      
      // Setup Glass Material
      _wine.traverse(child => {
        if (child.isMesh && child.material) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0.05,
            transmission: 1,
            thickness: 0.5,
            transparent: true,
            opacity: 0.2,
            ior: 1.45
          });
          child.renderOrder = 20;
        }
      });

      // Setup Liquid
      const points = [];
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const radius = Math.sin(t * Math.PI * 0.5) * 0.17; // Further reduced radius (was 0.18)
        const y = BOWL_BOTTOM_Y + (1 - Math.cos(t * Math.PI * 0.5)) * 0.4; // Tighter y curve
        points.push(new THREE.Vector2(radius, y));
      }
      // Top point far up for clipping
      points.push(new THREE.Vector2(0.15, BOWL_TOP_Y + 0.5));

      const liquidGeom = new THREE.LatheGeometry(points, 64);
      _liquidMat = new THREE.MeshPhysicalMaterial({
        color: 0x722f37,
        roughness: 0.12,
        transmission: 0.08,
        thickness: 0.8,
        transparent: true,
        opacity: 0.98,
        attenuationColor: new THREE.Color(0x420208),
        attenuationDistance: 0.4,
        side: THREE.DoubleSide
      });

      // Custom shader for clipping
      _liquidMat.onBeforeCompile = (shader) => {
        shader.uniforms.uFillY = { value: BOWL_BOTTOM_Y };
        _liquidMat.userData.shader = shader;

        shader.vertexShader = `
          varying vec3 vLocalPos;
          ${shader.vertexShader}
        `.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vLocalPos = position;`
        );

        shader.fragmentShader = `
          varying vec3 vLocalPos;
          uniform float uFillY;
          ${shader.fragmentShader}
        `.replace(
          '#include <dithering_fragment>',
          `if (vLocalPos.y > uFillY) discard;
           #include <dithering_fragment>`
        );
      };

      // --- Setup Second Glass (Clink Partner) ---
      // Clone the whole glass hierarchy AFTER material setup but BEFORE adding liquid 1
      _wine2 = _wine.clone();

      _liquid = new THREE.Mesh(liquidGeom, _liquidMat);
      _liquid.position.set(LIQUID_OFFSETS.x, 0, LIQUID_OFFSETS.z);
      _liquid.renderOrder = 10;
      _wine.add(_liquid);

      // Liquid 2 (Pre-filled)
      _liquidMat2 = new THREE.MeshPhysicalMaterial({
        color: 0x722f37,
        roughness: 0.12,
        transmission: 0.08,
        thickness: 0.8,
        transparent: true,
        opacity: 0.98,
        attenuationColor: new THREE.Color(0x420208),
        attenuationDistance: 0.4,
        side: THREE.DoubleSide
      });
      _liquidMat2.onBeforeCompile = (shader) => {
        // Match Glass 1's max fill height (70% of bowl height)
        shader.uniforms.uFillY = { value: BOWL_BOTTOM_Y + BOWL_HEIGHT * 0.7 };
        _liquidMat2.userData.shader = shader;
        
        shader.vertexShader = `
          varying vec3 vLocalPos;
          ${shader.vertexShader}
        `.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vLocalPos = position;`
        );

        shader.fragmentShader = `
          varying vec3 vLocalPos;
          uniform float uFillY;
          ${shader.fragmentShader}
        `.replace(
          '#include <dithering_fragment>',
          `if (vLocalPos.y > uFillY) discard;
           #include <dithering_fragment>`
        );
      };
      
      _liquid2 = new THREE.Mesh(liquidGeom, _liquidMat2);
      _liquid2.position.copy(_liquid.position);
      _liquid2.renderOrder = 10;
      _wine2.add(_liquid2);
      _scene.add(_wine2);

      // Initial alignment
      const scale = _wine.scale.x;
      const bowlOffsetX = LIQUID_OFFSETS.x * scale;
      const bowlOffsetZ = LIQUID_OFFSETS.z * scale;
      
      // Fix glass 1 bowl at horizontal center (roughly)
      _wine.position.set(-bowlOffsetX - 0.1, -0.6, -bowlOffsetZ); 
      _wine2.position.set(3, -0.6, 0); 

      animate();
    } catch (err) {
      console.error('Invitation Engine Model Load Error:', err);
    }
  }

  function animate() {
    if (_disposed || _paused) return;
    _rafId = requestAnimationFrame(animate);

    if (_wine && _wine2) {
      // Smooth lerp for scroll position to handle abrupt snapping
      _scrollT = THREE.MathUtils.lerp(_scrollT, _targetScrollT, 0.08);

      const floatY = Math.sin(Date.now() * 0.001) * 0.03;
      const scale = _wine.scale.x;
      const bX = LIQUID_OFFSETS.x * scale;
      const bZ = LIQUID_OFFSETS.z * scale;

      // --- Camera Animation (0-33% scroll) ---
      // Transition from start angled POV to center focused POV
      const zoomProgress = THREE.MathUtils.clamp(_scrollT / 0.33, 0, 1);
      _camera.position.x = THREE.MathUtils.lerp(CAMERA_START_POS.x, CAMERA_DEST_POS.x, zoomProgress);
      _camera.position.y = THREE.MathUtils.lerp(CAMERA_START_POS.y, CAMERA_DEST_POS.y, zoomProgress);
      _camera.position.z = THREE.MathUtils.lerp(CAMERA_START_POS.z, CAMERA_DEST_POS.z, zoomProgress);
      
      const lookAtX = THREE.MathUtils.lerp(CAMERA_START_LOOKAT.x, CAMERA_DEST_LOOKAT.x, zoomProgress);
      const lookAtY = THREE.MathUtils.lerp(CAMERA_START_LOOKAT.y, CAMERA_DEST_LOOKAT.y, zoomProgress);
      const lookAtZ = THREE.MathUtils.lerp(CAMERA_START_LOOKAT.z, CAMERA_DEST_LOOKAT.z, zoomProgress);
      _camera.lookAt(lookAtX, lookAtY, lookAtZ);

      // Glass 1: Static bowl center (roughly)
      _wine.position.set(-bX - 0.2, -0.6 + floatY, -bZ);
      _wine.rotation.set(0, 0.2, 0);
      _wine.rotation.z = 0; // No shake for first one

      // Glass 2: Slides in from side TILTED
      const slideProgress = THREE.MathUtils.clamp(
        (_scrollT - SLIDE_START_T) / (SLIDE_END_T - SLIDE_START_T), 
        0, 1
      );
      
      // Hide until it starts moving 
      _wine2.visible = slideProgress > 0;
      
      const targetX2 = THREE.MathUtils.lerp(GLASS2_START_X, GLASS2_DEST_X, slideProgress);
      _wine2.position.set(targetX2, -0.6 + floatY, -bZ + 0.1);
      
      // Tilted inward during entry
      _wine2.rotation.set(0, -0.2, 0.15); 

      // Clink animation (Both glasses tilt to clink)
      const clinkProgress = THREE.MathUtils.clamp(
        (_scrollT - CLINK_START_T) / (CLINK_END_T - CLINK_START_T), 
        0, 1
      );
      if (clinkProgress > 0) {
        // Glass 1 tilts towards Glass 2 and bounces back
        const glass1Tilt = Math.sin(clinkProgress * Math.PI) * 0.1;
        _wine.rotation.z = -glass1Tilt;
        _wine.position.x = -bX - 0.2 + (Math.sin(clinkProgress * Math.PI) * 0.02); // slight move towards

        // Subtle impact tilt for Glass 2
        const impact = Math.sin(clinkProgress * Math.PI) * 0.12;
        _wine2.rotation.z = 0.15 + impact;
        // Move slightly closer for the "clink"
        const bounce = Math.sin(clinkProgress * Math.PI) * 0.05;
        _wine2.position.x -= bounce;
      }

      // Fill Glass 1 (0-33%) - Fills during Logo -> Hero transition
      if (_liquidMat && _liquidMat.userData.shader) {
        const fillProgress = THREE.MathUtils.clamp(_scrollT / 0.33, 0, 1);
        const fillTarget = BOWL_BOTTOM_Y + fillProgress * BOWL_HEIGHT * 0.7;
        _liquidMat.userData.shader.uniforms.uFillY.value = fillTarget; 
      }
      
      if (_liquidMat2 && _liquidMat2.userData.shader) {
        _liquidMat2.userData.shader.uniforms.uFillY.value = BOWL_BOTTOM_Y + BOWL_HEIGHT * 0.7;
      }
    }

    _renderer.render(_scene, _camera);
  }

  function setScrollProgress(t) {
    _targetScrollT = t;
  }

  function onResize() {
    if (!_renderer || !_camera) return;
    _camera.aspect = container.clientWidth / container.clientHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function pause() {
    _paused = true;
    if (_rafId) cancelAnimationFrame(_rafId);
  }

  function resume() {
    if (!_paused) return;
    _paused = false;
    animate();
  }

  function dispose() {
    _disposed = true;
    pause();
    if (_renderer) {
      _renderer.dispose();
      if (_renderer.domElement && _renderer.domElement.parentNode) {
        _renderer.domElement.parentNode.removeChild(_renderer.domElement);
      }
    }
  }

  init();

  return { setScrollProgress, onResize, pause, resume, dispose };
}
