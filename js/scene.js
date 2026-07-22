import * as THREE from 'three';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9d6e0);
scene.fog = new THREE.Fog(0xc9d6e0, 60, 180);

export const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xfff5e6, 1.3);
sun.position.set(30, 40, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { near: 0.5, far: 150, left: -60, right: 60, top: 60, bottom: -60 });
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x87CEEB, 0x4a6741, 0.45));

const roadMat = new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.85 });
function addRoad(x, z, w, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), roadMat);
    m.position.set(x, 0.015, z);
    m.receiveShadow = true;
    scene.add(m);
}
addRoad(0, 0, 80, 120);
addRoad(-25, 0, 12, 80);
addRoad(25, 0, 12, 80);

const fenceMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.7 });
const fencePole = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
[[30, 60], [30, -60], [-30, 60], [-30, -60], [0, 60], [0, -60]].forEach(([x, z]) => {
    const p = new THREE.Mesh(fencePole, fenceMat);
    p.position.set(x, 0.6, z);
    p.castShadow = true;
    scene.add(p);
});

const treeMat = new THREE.MeshStandardMaterial({ color: 0x4a8c3f, roughness: 0.8 });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 });
[[35, 20], [-35, 20], [35, -20], [-35, -20], [35, 50], [-35, 50], [35, -50], [-35, -50]].forEach(([x, z]) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2, 8), trunkMat);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;
    scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), treeMat);
    crown.position.set(x, 2.8, z);
    crown.castShadow = true;
    scene.add(crown);
});

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
