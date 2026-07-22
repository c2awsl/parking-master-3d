import { world, addWallPhys } from './physics.js';
import { scene } from './scene.js';

let trackBodies = [];
let trackGroup = null;

export function clearTrack() {
    trackBodies.forEach(b => world.removeBody(b));
    trackBodies = [];
    if (trackGroup) { scene.remove(trackGroup); trackGroup = null; }
}

function wallVis(x, z, sx, sy, sz, c, op) {
    const THREE = window.THREE;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz),
        new THREE.MeshStandardMaterial({ color: c, transparent: op < 1, opacity: op, roughness: 0.5 }));
    m.position.set(x, sy / 2, z);
    m.castShadow = true;
    return m;
}

function lineVis(x, z, sx, sz, c) {
    const THREE = window.THREE;
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.02, sz),
        new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c).multiplyScalar(0.15) }));
    m.position.set(x, 0.025, z);
    return m;
}

function buildReverseTrack(sub) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const { cx, cz, w, d } = sub;
    const hW = w / 2, hD = d / 2;
    g.add(lineVis(cx - hW, cz, 0.1, d, 0x00cc55));
    g.add(lineVis(cx + hW, cz, 0.1, d, 0x00cc55));
    g.add(lineVis(cx, cz + hD, w + 0.2, 0.1, 0x00cc55));
    g.add(lineVis(cx, cz - hD, w + 0.15, 0.1, 0xffffff));
    for (let z = cz - hD + 0.5; z < cz + hD; z += 1.2) g.add(lineVis(cx, z, w * 0.6, 0.06, 0xffffff));
    g.add(wallVis(cx, cz - hD - 0.5, w + 0.4, 0.04, 0.3, 0x44aa66, 0.4));
    const wh = 1.2, wt = 0.12;
    [{ x: cx - hW - wt / 2, z: cz, hx: wt / 2, hz: d / 2 + wt },
     { x: cx + hW + wt / 2, z: cz, hx: wt / 2, hz: d / 2 + wt },
     { x: cx, z: cz + hD + wt / 2, hx: w / 2 + wt, hz: wt / 2 }]
        .forEach(({ x, z, hx, hz }) => {
            g.add(wallVis(x, z, hx * 2, wh * 2, hz * 2, 0x44aa66, 0.25));
            const b = addWallPhys(x, z, [hx, wh / 2, hz]);
            b.userData = { type: 'parking_wall' };
            trackBodies.push(b);
        });
    return g;
}

function buildSideTrack(sub) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const { cx, cz, w, d } = sub;
    const hW = w / 2, hD = d / 2;
    g.add(lineVis(cx - hW, cz, 0.1, d, 0x00cc55));
    g.add(lineVis(cx + hW, cz, 0.1, d, 0x00cc55));
    g.add(lineVis(cx, cz + hD, w + 0.2, 0.1, 0x00cc55));
    g.add(lineVis(cx, cz - hD, w + 0.2, 0.1, 0x00cc55));
    const wh = 1.0, wt = 0.12;
    [{ x: cx - hW - wt / 2, z: cz, hx: wt / 2, hz: d / 2 + wt },
     { x: cx + hW + wt / 2, z: cz, hx: wt / 2, hz: d / 2 + wt },
     { x: cx, z: cz + hD + wt / 2, hx: w / 2 + wt, hz: wt / 2 }]
        .forEach(({ x, z, hx, hz }) => {
            g.add(wallVis(x, z, hx * 2, wh * 2, hz * 2, 0x44aa66, 0.25));
            const b = addWallPhys(x, z, [hx, wh / 2, hz]);
            b.userData = { type: 'parking_wall' };
            trackBodies.push(b);
        });
    return g;
}

function buildSCurveTrack(sub) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const bx = sub.spawn.x, bz = sub.spawn.z, lw = 3.5, wh = 0.8;
    const segs = [[0, 0], [0, -8], [6, -16], [6, -24], [0, -32], [0, -40]];
    for (let i = 0; i < segs.length - 1; i++) {
        const ax = bx + segs[i][0], az = bz + segs[i][1];
        const bxx = bx + segs[i + 1][0], bzz = bz + segs[i + 1][1];
        const mx = (ax + bxx) / 2, mz = (az + bzz) / 2;
        const dx = bxx - ax, dz = bzz - az;
        const len = Math.sqrt(dx * dx + dz * dz) + lw * 2;
        const ang = Math.atan2(dx, dz);
        [-1, 1].forEach(off => {
            const nx = Math.cos(ang) * off * lw, nz = -Math.sin(ang) * off * lw;
            g.add(lineVis(mx + nx, mz + nz, 0.1, len, 0xffcc00));
            g.add(wallVis(mx + nx, mz + nz, 0.08, wh * 2, len, 0x44aa66, 0.2));
            const b = addWallPhys(mx + nx, mz + nz, [0.04, wh / 2, len / 2]);
            b.userData = { type: 'parking_wall' };
            trackBodies.push(b);
        });
    }
    return g;
}

function buildRightAngleTrack(sub) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const bx = sub.spawn.x, bz = sub.spawn.z, lw = 3.5, wh = 0.8;
    const segs = sub.turn === 'left' ? [[0, 0], [0, -10], [-10, -10]] : [[0, 0], [0, -10], [10, -10]];
    for (let i = 0; i < segs.length - 1; i++) {
        const ax = bx + segs[i][0], az = bz + segs[i][1];
        const bxx = bx + segs[i + 1][0], bzz = bz + segs[i + 1][1];
        const mx = (ax + bxx) / 2, mz = (az + bzz) / 2;
        const dx = bxx - ax, dz = bzz - az;
        const len = Math.sqrt(dx * dx + dz * dz) + lw * 2;
        const ang = Math.atan2(dx, dz);
        [-1, 1].forEach(off => {
            const nx = Math.cos(ang) * off * lw, nz = -Math.sin(ang) * off * lw;
            g.add(lineVis(mx + nx, mz + nz, 0.1, len, 0xffcc00));
            g.add(wallVis(mx + nx, mz + nz, 0.08, wh * 2, len, 0x44aa66, 0.2));
            const b = addWallPhys(mx + nx, mz + nz, [0.04, wh / 2, len / 2]);
            b.userData = { type: 'parking_wall' };
            trackBodies.push(b);
        });
    }
    return g;
}

function buildHillTrack(sub) {
    const THREE = window.THREE;
    const g = new THREE.Group();
    const bx = sub.spawn.x, bz = sub.spawn.z;
    const rampLen = 14, rampW = 3.8, rampH = 2.8, wh = 1.2;
    const rampMat2 = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(rampW, 0.3, rampLen), rampMat2);
    ramp.position.set(bx, rampH / 2, bz + rampLen / 2);
    ramp.rotation.x = -Math.atan2(rampH, rampLen);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    g.add(ramp);
    const CANNON = window.CANNON;
    const rb = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(rampW / 2, 0.15, rampLen / 2)), position: new CANNON.Vec3(bx, rampH / 2, bz + rampLen / 2) });
    rb.quaternion.setFromEuler(-Math.atan2(rampH, rampLen), 0, 0);
    world.addBody(rb); trackBodies.push(rb);
    const top = new THREE.Mesh(new THREE.BoxGeometry(rampW, 0.3, 5), rampMat2);
    top.position.set(bx, rampH + 0.15, bz + rampLen + 2.5);
    top.castShadow = true;
    g.add(top);
    const tb = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(rampW / 2, 0.15, 2.5)), position: new CANNON.Vec3(bx, rampH + 0.15, bz + rampLen + 2.5) });
    world.addBody(tb); trackBodies.push(tb);
    g.add(lineVis(bx, bz + rampLen + 2.5, rampW + 0.5, 0.15, 0xff3333));
    g.add(lineVis(bx, bz + 1, rampW + 0.5, 0.15, 0x33cc55));
    g.add(wallVis(bx - rampW / 2 - 0.08, bz + rampLen / 2, 0.12, wh * 2, rampLen, 0x44aa66, 0.2));
    g.add(wallVis(bx + rampW / 2 + 0.08, bz + rampLen / 2, 0.12, wh * 2, rampLen, 0x44aa66, 0.2));
    const b1 = addWallPhys(bx - rampW / 2 - 0.08, bz + rampLen / 2, [0.06, wh / 2, rampLen / 2]);
    b1.userData = { type: 'parking_wall' }; trackBodies.push(b1);
    const b2 = addWallPhys(bx + rampW / 2 + 0.08, bz + rampLen / 2, [0.06, wh / 2, rampLen / 2]);
    b2.userData = { type: 'parking_wall' }; trackBodies.push(b2);
    return g;
}

export const LEVELS = [
    { id: 'reverse', name: '倒车入库', subs: [
        { label: '第1把', cx: 22, cz: 20, w: 3.6, d: 5.6, angle: 0, spawn: { x: 22, z: 6, ry: 0 } },
        { label: '第2把', cx: -18, cz: 18, w: 3.6, d: 5.6, angle: 0, spawn: { x: -18, z: 4, ry: 0 } },
    ]},
    { id: 'side', name: '侧方停车', subs: [
        { label: '第1把', cx: 0, cz: 22, w: 2.8, d: 6.5, angle: 0, spawn: { x: 0, z: 30, ry: 0 } },
        { label: '第2把', cx: 20, cz: -20, w: 2.8, d: 6.5, angle: 0, spawn: { x: 20, z: -12, ry: 0 } },
    ]},
    { id: 'scurve', name: '曲线行驶', subs: [
        { label: '标准', spawn: { x: 0, z: 45, ry: 0 }, dir: 'south' },
    ]},
    { id: 'rightangle', name: '直角转弯', subs: [
        { label: '左转', spawn: { x: -25, z: 25, ry: 0 }, dir: 'south', turn: 'left' },
        { label: '右转', spawn: { x: 25, z: 25, ry: 0 }, dir: 'south', turn: 'right' },
    ]},
    { id: 'hill', name: '坡道起步', subs: [
        { label: '标准', spawn: { x: 0, z: -5, ry: 0 } },
    ]},
];

export function buildTrack(id, sub) {
    switch (id) {
        case 'reverse': return buildReverseTrack(sub);
        case 'side': return buildSideTrack(sub);
        case 'scurve': return buildSCurveTrack(sub);
        case 'rightangle': return buildRightAngleTrack(sub);
        case 'hill': return buildHillTrack(sub);
    }
}

export function loadLevel(id, idx) {
    clearTrack();
    const THREE = window.THREE;
    const level = LEVELS.find(l => l.id === id);
    const subIdx = idx % level.subs.length;
    trackGroup = buildTrack(id, level.subs[subIdx]);
    scene.add(trackGroup);
    return { level, subIdx, sub: level.subs[subIdx] };
}
