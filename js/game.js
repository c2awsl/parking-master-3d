import * as THREE from 'three';
import { scene, camera, renderer } from './scene.js';
import { world } from './physics.js';
import { chassisBody, CHASSIS_Y, syncCarVisuals } from './vehicle.js';
import { loadLevel, clearTrack, LEVELS } from './levels.js';
import { updateCamera, toggleDriverMode } from './camera.js';
import { isForward, isBackward, isLeft, isRight, isBrake, isReset, isCamera, initSteeringWheel, getSteerAngle, initTouchButtons } from './input.js';
import { setStatus, setGear, setSpeed, flashRed, buildTabs, getCurrentTab, getCurrentSubIdx } from './ui.js';
import { initMiniViews, renderMiniViews } from './miniviews.js';

import * as CANNON from 'cannon-es';
window.THREE = THREE;
window.CANNON = CANNON;

let currentLevelId = 'reverse';
let currentSubIdx = 0;
let speed = 0;
let lastTime = performance.now();
let lastContactTime = 0;
let checkTimer = 0;
let stateTimer = 0;
let gameState = 'running';
let lastReset = 0;

const ACCEL = 10;
const MAX_SPEED = 12;
const BRAKE_DECEL = 20;
const NATURAL_DECEL = 0.99;
const IDLE_STOP = 0.05;
const TURN_SPEED = 2.2;

function resetCar() {
    const level = LEVELS.find(l => l.id === currentLevelId);
    const sub = level.subs[currentSubIdx % level.subs.length];
    const sp = sub.spawn;
    chassisBody.position.set(sp.x, CHASSIS_Y + 0.5, sp.z);
    chassisBody.quaternion.set(0, 0, 0, 1);
    chassisBody.velocity.set(0, -1, 0);
    chassisBody.angularVelocity.set(0, 0, 0);
    gameState = 'running';
    setStatus('', '');
}

function checkLevelComplete() {
    const level = LEVELS.find(l => l.id === currentLevelId);
    const sub = level.subs[currentSubIdx % level.subs.length];
    const p = chassisBody.position;
    const q = chassisBody.quaternion;
    const yRot = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w), 'YXZ').y;

    switch (currentLevelId) {
        case 'reverse': {
            const dx = Math.abs(p.x - sub.cx), dz = Math.abs(p.z - sub.cz);
            const angleOk = Math.abs(yRot) < 0.25 || Math.abs(Math.abs(yRot) - Math.PI) < 0.25;
            if (dx < 1.3 && dz < 2.3 && angleOk) return 'pass';
            break;
        }
        case 'side': {
            const dx = Math.abs(p.x - sub.cx), dz = Math.abs(p.z - sub.cz);
            const angleOk = Math.abs(yRot) < 0.25;
            if (dx < 1.1 && dz < 2.8 && angleOk) return 'pass';
            break;
        }
        case 'scurve': {
            const dist = Math.sqrt(p.x * p.x + (p.z - sub.spawn.z) * (p.z - sub.spawn.z));
            if (dist > 38) return 'pass';
            break;
        }
        case 'rightangle': {
            const dir = sub.turn === 'left' ? -1 : 1;
            const targetX = sub.spawn.x + dir * 10;
            const targetZ = sub.spawn.z - 10;
            const dx = Math.abs(p.x - targetX), dz = Math.abs(p.z - targetZ);
            const targetAngle = dir * Math.PI / 2;
            const angleOk = Math.abs(yRot - targetAngle) < 0.3;
            if (dx < 2.5 && dz < 2.5 && angleOk) return 'pass';
            break;
        }
        case 'hill': {
            const rampEnd = sub.spawn.z + 16.5;
            const top = sub.spawn.z + 14 + 5;
            if (p.z > rampEnd && p.z < top && Math.abs(speed) < 0.3) return 'pass';
            break;
        }
    }
    return null;
}

function onContact(eq) {
    const bA = eq.bi.userData, bB = eq.bj.userData;
    if ((bA && bA.type === 'parking_wall') || (bB && bB.type === 'parking_wall')) {
        lastContactTime = performance.now();
        flashRed(true);
    }
}

chassisBody.addEventListener('collide', onContact);

function loadLevelAndReset(id, subIdx) {
    currentLevelId = id;
    currentSubIdx = subIdx;
    loadLevel(id, subIdx);
    resetCar();
}

function onTabSelect(id, idx) {
    loadLevelAndReset(id, idx);
}

buildTabs(onTabSelect);
initSteeringWheel();
initTouchButtons();
initMiniViews();
resetCar();

const _fwd = new THREE.Vector3();
const _quat = new THREE.Quaternion();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (isCamera()) toggleDriverMode();

    if (isReset() && now - lastReset > 500) {
        lastReset = now;
        resetCar();
    }

    _quat.set(chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w);
    _fwd.set(0, 0, 1).applyQuaternion(_quat);

    const vx = chassisBody.velocity.x;
    const vz = chassisBody.velocity.z;
    const spd = Math.sqrt(vx * vx + vz * vz);

    if (isForward()) {
        chassisBody.velocity.x += _fwd.x * ACCEL * dt;
        chassisBody.velocity.z += _fwd.z * ACCEL * dt;
    } else if (isBackward()) {
        chassisBody.velocity.x -= _fwd.x * ACCEL * 0.6 * dt;
        chassisBody.velocity.z -= _fwd.z * ACCEL * 0.6 * dt;
    } else {
        if (spd > IDLE_STOP) {
            chassisBody.velocity.x *= NATURAL_DECEL;
            chassisBody.velocity.z *= NATURAL_DECEL;
        } else if (spd > 0) {
            chassisBody.velocity.x = 0;
            chassisBody.velocity.z = 0;
        }
    }

    if (isBrake() && spd > 0.05) {
        const factor = Math.max(0, 1 - BRAKE_DECEL * dt / spd);
        chassisBody.velocity.x *= factor;
        chassisBody.velocity.z *= factor;
    }

    const newSpd = Math.sqrt(chassisBody.velocity.x ** 2 + chassisBody.velocity.z ** 2);
    if (newSpd > MAX_SPEED) {
        const scale = MAX_SPEED / newSpd;
        chassisBody.velocity.x *= scale;
        chassisBody.velocity.z *= scale;
    }

    speed = Math.sqrt(
        chassisBody.velocity.x ** 2 +
        chassisBody.velocity.y ** 2 +
        chassisBody.velocity.z ** 2
    );

    let steerInput = 0;
    if (isLeft()) steerInput = 1;
    if (isRight()) steerInput = -1;
    const swAngle = getSteerAngle();
    if (Math.abs(swAngle) > 0.05) steerInput = -swAngle;

    if (spd > 0.5) {
        chassisBody.angularVelocity.y = steerInput * TURN_SPEED;
    } else {
        chassisBody.angularVelocity.y *= 0.8;
    }

    chassisBody.angularVelocity.x = 0;
    chassisBody.angularVelocity.z = 0;

    setSpeed(spd);
    setGear(isBackward() ? 'R' : (isForward() ? 'D' : 'P'));

    if (now - lastContactTime > 200) flashRed(false);

    checkTimer += dt;
    if (gameState === 'running' && checkTimer > 0.3) {
        checkTimer = 0;
        const result = checkLevelComplete();
        if (result === 'pass') {
            gameState = 'pass';
            stateTimer = 2;
            setStatus('完成！通过！', 'ok');
        }
    }

    if (gameState !== 'running') {
        stateTimer -= dt;
        if (stateTimer <= 0) {
            setStatus('', '');
            if (gameState === 'pass') {
                const level = LEVELS.find(l => l.id === currentLevelId);
                const nextIdx = (currentSubIdx + 1) % level.subs.length;
                loadLevelAndReset(currentLevelId, nextIdx);
            }
        }
    }

    world.step(1 / 60, dt, 3);

    // Lock pitch and roll - only keep Y rotation
    const yAngle = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion(chassisBody.quaternion.x, chassisBody.quaternion.y, chassisBody.quaternion.z, chassisBody.quaternion.w),
        'YXZ'
    ).y;
    const yQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yAngle);
    chassisBody.quaternion.set(yQuat.x, yQuat.y, yQuat.z, yQuat.w);
    chassisBody.angularVelocity.x = 0;
    chassisBody.angularVelocity.z = 0;

    // Keep car on ground
    if (chassisBody.position.y < CHASSIS_Y) {
        chassisBody.position.y = CHASSIS_Y;
        if (chassisBody.velocity.y < 0) chassisBody.velocity.y = 0;
    }

    syncCarVisuals();
    updateCamera(chassisBody.position, chassisBody.quaternion);

    if (chassisBody.position.y < -5 || Math.abs(chassisBody.position.x) > 60 || Math.abs(chassisBody.position.z) > 60) {
        resetCar();
    }

    renderer.render(scene, camera);
    renderMiniViews();
}

animate();
