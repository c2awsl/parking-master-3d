import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { world } from './physics.js';
import { scene } from './scene.js';

export const CHASSIS_HALF_H = 0.35;
export const CHASSIS_Y = CHASSIS_HALF_H;
export const WHEEL_R = 0.3;
export const CHASSIS_W = 1.0;
export const CHASSIS_L = 2.0;

export const VC = {
    wR: WHEEL_R, maxSteer: 0.6, mass: 150,
};

export const chassisBody = new CANNON.Body({
    mass: VC.mass,
    shape: new CANNON.Box(new CANNON.Vec3(CHASSIS_W, CHASSIS_HALF_H, CHASSIS_L)),
    position: new CANNON.Vec3(0, CHASSIS_Y, 0),
    linearDamping: 0.3,
    angularDamping: 0.4,
});
world.addBody(chassisBody);

const carG = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.2, metalness: 0.5 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.05, metalness: 0.95 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.5 });
const tailMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, emissive: 0xcc0000, emissiveIntensity: 0.35, roughness: 0.3 });
const headMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffcc, emissiveIntensity: 0.5, roughness: 0.15 });
const turnMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.3 });
const sideTrimMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });

function addBox(parent, geo, mat, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    parent.add(m);
    return m;
}

addBox(carG, new THREE.BoxGeometry(1.85, 0.4, 4.2), bodyMat, 0, 0.0, 0);
addBox(carG, new THREE.BoxGeometry(1.75, 0.18, 1.3), bodyMat, 0, 0.28, 1.15);
addBox(carG, new THREE.BoxGeometry(1.65, 0.16, 1.0), bodyMat, 0, 0.3, -1.3);
addBox(carG, new THREE.BoxGeometry(1.55, 0.5, 1.9), bodyMat, 0, 0.62, -0.15);
addBox(carG, new THREE.BoxGeometry(1.45, 0.05, 1.5), bodyMat, 0, 0.9, -0.15);
addBox(carG, new THREE.BoxGeometry(1.48, 0.48, 0.04), glassMat, 0, 0.7, 0.75, -0.3);
addBox(carG, new THREE.BoxGeometry(1.42, 0.42, 0.04), glassMat, 0, 0.68, -0.95, 0.22);
addBox(carG, new THREE.BoxGeometry(0.04, 0.35, 1.4), glassMat, -0.78, 0.68, -0.15);
addBox(carG, new THREE.BoxGeometry(0.04, 0.35, 1.4), glassMat, 0.78, 0.68, -0.15);
addBox(carG, new THREE.BoxGeometry(1.9, 0.24, 0.12), darkMat, 0, 0.04, 2.08);
addBox(carG, new THREE.BoxGeometry(1.1, 0.16, 0.05), darkMat, 0, 0.14, 2.1);
for (let i = 0; i < 4; i++) addBox(carG, new THREE.BoxGeometry(1.0, 0.012, 0.06), chromeMat, 0, 0.08 + i * 0.04, 2.11);
[-0.65, 0.65].forEach(x => addBox(carG, new THREE.BoxGeometry(0.32, 0.12, 0.06), headMat, x, 0.2, 2.08));
[-0.9, 0.9].forEach(x => addBox(carG, new THREE.BoxGeometry(0.1, 0.08, 0.05), turnMat, x, 0.2, 2.08));
addBox(carG, new THREE.BoxGeometry(1.9, 0.26, 0.1), darkMat, 0, 0.04, -2.08);
[-0.68, 0.68].forEach(x => addBox(carG, new THREE.BoxGeometry(0.32, 0.14, 0.05), tailMat, x, 0.2, -2.09));
[-0.92, 0.92].forEach(x => addBox(carG, new THREE.BoxGeometry(0.08, 0.06, 0.04), turnMat, x, 0.2, -2.09));
addBox(carG, new THREE.BoxGeometry(0.35, 0.1, 0.01), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), 0, 0.05, 2.12);
addBox(carG, new THREE.BoxGeometry(0.3, 0.07, 0.01), new THREE.MeshStandardMaterial({ color: 0xffffff }), 0, 0.05, 2.13);
addBox(carG, new THREE.BoxGeometry(0.35, 0.1, 0.01), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), 0, 0.05, -2.11);
addBox(carG, new THREE.BoxGeometry(0.3, 0.07, 0.01), new THREE.MeshStandardMaterial({ color: 0xffffff }), 0, 0.05, -2.12);
[-0.55, 0.55].forEach(x => {
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.1, 8), chromeMat);
    e.rotation.x = Math.PI / 2;
    e.position.set(x, -0.16, -2.12);
    carG.add(e);
});
[-1, 1].forEach(s => {
    addBox(carG, new THREE.BoxGeometry(0.04, 0.03, 0.12), bodyMat, s * 0.98, 0.5, 0.7);
    addBox(carG, new THREE.BoxGeometry(0.14, 0.08, 0.06), bodyMat, s * 1.06, 0.5, 0.7);
    addBox(carG, new THREE.BoxGeometry(0.02, 0.06, 0.05), chromeMat, s * 1.14, 0.5, 0.7);
});
[-0.94, 0.94].forEach(x => {
    addBox(carG, new THREE.BoxGeometry(0.03, 0.44, 0.06), darkMat, x, 0.62, -0.1);
    addBox(carG, new THREE.BoxGeometry(0.02, 0.02, 0.08), chromeMat, x * 1.01, 0.38, -0.1);
});
addBox(carG, new THREE.BoxGeometry(1.88, 0.02, 3.8), sideTrimMat, -0.94, 0.18, 0);
addBox(carG, new THREE.BoxGeometry(1.88, 0.02, 3.8), sideTrimMat, 0.94, 0.18, 0);
scene.add(carG);

const whMeshes = [];
const wheelLocalPos = [
    new THREE.Vector3(-0.85, -CHASSIS_HALF_H, 1.4),
    new THREE.Vector3(0.85, -CHASSIS_HALF_H, 1.4),
    new THREE.Vector3(-0.85, -CHASSIS_HALF_H, -1.4),
    new THREE.Vector3(0.85, -CHASSIS_HALF_H, -1.4),
];
const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.85 });
const hubMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.9 });
for (let i = 0; i < 4; i++) {
    const wg = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(VC.wR, VC.wR, 0.22, 20), tireMat);
    t.rotation.z = Math.PI / 2;
    t.castShadow = true;
    wg.add(t);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.23, 12), hubMat);
    h.rotation.z = Math.PI / 2;
    wg.add(h);
    scene.add(wg);
    whMeshes.push(wg);
}

const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();

export function syncCarVisuals() {
    carG.position.set(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z);
    carG.quaternion.set(chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w);
    _q.set(chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w);
    for (let i = 0; i < 4; i++) {
        _v.copy(wheelLocalPos[i]).applyQuaternion(_q);
        whMeshes[i].position.set(
            _v.x + chassisBody.position.x,
            _v.y + chassisBody.position.y,
            _v.z + chassisBody.position.z
        );
        whMeshes[i].quaternion.copy(_q);
    }
}

export function setCarVisible(v) { carG.visible = v; }
