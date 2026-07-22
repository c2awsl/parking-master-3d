import * as THREE from 'three';
import { scene, renderer } from './scene.js';
import { chassisBody } from './vehicle.js';

const MARGIN = 12;
const PANEL_W = 220;
const PANEL_H = 160;
const LABEL_H = 22;
const PANEL_TOTAL = PANEL_H + LABEL_H;
const GAP = 10;

function createCam(fov, near, far) {
    const c = new THREE.PerspectiveCamera(fov, PANEL_W / PANEL_H, near, far);
    c.updateProjectionMatrix();
    return c;
}

const views = [
    {
        label: '车内',
        cam: createCam(75, 0.05, 100),
        update(carPos, carQuat) {
            this.cam.position.copy(carPos).add(new THREE.Vector3(0, 1.1, -0.5).applyQuaternion(new THREE.Quaternion().copy(carQuat)));
            const look = new THREE.Vector3(0, 1.0, -20);
            look.applyQuaternion(new THREE.Quaternion().copy(carQuat));
            look.add(carPos);
            this.cam.lookAt(look);
        },
    },
    {
        label: '后视镜',
        cam: createCam(55, 0.05, 50),
        update(carPos, carQuat) {
            const leftMirror = new THREE.Vector3(-1.2, 0.7, -0.5);
            leftMirror.applyQuaternion(new THREE.Quaternion().copy(carQuat));
            leftMirror.add(carPos);
            this.cam.position.copy(leftMirror);
            const lookGround = new THREE.Vector3(-1.5, 0.1, 1.0);
            lookGround.applyQuaternion(new THREE.Quaternion().copy(carQuat));
            lookGround.add(carPos);
            this.cam.lookAt(lookGround);
        },
    },
    {
        label: '俯视',
        cam: createCam(45, 0.1, 200),
        update(carPos) {
            this.cam.position.set(carPos.x, carPos.y + 18, carPos.z + 2);
            this.cam.lookAt(carPos.x, 0, carPos.z);
        },
    },
];

const panelStyle = `
  position:fixed;right:${MARGIN}px;z-index:12;
  border-radius:12px;overflow:hidden;
  border:1px solid rgba(255,255,255,.35);
  box-shadow:0 4px 20px rgba(0,0,0,.12);
  backdrop-filter:blur(4px);
`;

export function initMiniViews() {
    views.forEach((v, i) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = panelStyle + `top:${MARGIN + i * (PANEL_TOTAL + GAP)}px;width:${PANEL_W}px;height:${PANEL_TOTAL}px;background:rgba(0,0,0,.45);`;
        const lbl = document.createElement('div');
        lbl.style.cssText = 'position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:11px;color:rgba(255,255,255,.85);padding:3px 0;font-family:inherit;letter-spacing:.5px;';
        lbl.textContent = v.label;
        wrap.appendChild(lbl);
        document.body.appendChild(wrap);
        v.wrap = wrap;
    });
}

export function renderMiniViews() {
    const canvasW = renderer.domElement.width;
    const canvasH = renderer.domElement.height;
    const cssW = canvasW / (window.devicePixelRatio || 1);
    const cssH = canvasH / (window.devicePixelRatio || 1);

    const carPos = new THREE.Vector3().copy(chassisBody.position);
    const carQuat = new THREE.Quaternion(
        chassisBody.quaternion.x, chassisBody.quaternion.y,
        chassisBody.quaternion.z, chassisBody.quaternion.w
    );

    const dpr = window.devicePixelRatio || 1;

    const prevScissorTest = renderer._scissorTest;
    const prevScissor = renderer.getScissor(new THREE.Vector4());
    const prevViewport = renderer.getViewport(new THREE.Vector4());

    renderer.setScissorTest(true);

    views.forEach((v, i) => {
        v.update(carPos, carQuat);

        const px = Math.round(cssW - MARGIN - PANEL_W);
        const py = Math.round(cssH - MARGIN - i * (PANEL_TOTAL + GAP) - PANEL_H);
        const sx = Math.round(px * dpr);
        const sy = Math.round(py * dpr);
        const sw = Math.round(PANEL_W * dpr);
        const sh = Math.round(PANEL_H * dpr);

        renderer.setViewport(sx, sy, sw, sh);
        renderer.setScissor(sx, sy, sw, sh);
        renderer.render(scene, v.cam);
    });

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, canvasW, canvasH);
    renderer.setScissor(0, 0, canvasW, canvasH);
}
