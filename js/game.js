import * as THREE from 'three';
import { scene, camera, renderer } from './scene.js';
import { world } from './physics.js';
import { chassisBody, veh, VC, syncCarVisuals, setCarVisible } from './vehicle.js';
import { loadLevel, clearTrack, LEVELS } from './levels.js';
import { updateCamera, toggleDriverMode } from './camera.js';
import { isForward, isBackward, isLeft, isRight, isBrake, isReset, isCamera, initSteeringWheel, getSteerAngle, initTouchButtons } from './input.js';
import { setStatus, setGear, setSpeed, flashRed, buildTabs, getCurrentTab, getCurrentSubIdx } from './ui.js';

// Make THREE and CANNON available for levels.js dynamic use
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
let gameState = 'running'; // running | pass | fail
let lastReset = 0;

function resetCar() {
    const level = LEVELS.find(l => l.id === currentLevelId);
    const sub = level.subs[currentSubIdx % level.subs.length];
    const sp = sub.spawn;
    chassisBody.position.set(sp.x, VC.wR + VC.sRest + 0.35, sp.z);
    chassisBody.quaternion.set(0, 0, 0, 1);
    chassisBody.velocity.set(0, 0, 0);
    chassisBody.angularVelocity.set(0, 0, 0);
    for (let i = 0; i < 4; i++) {
        veh.wheelInfos[i].engineForce = 0;
        veh.wheelInfos[i].brake = VC.brakeF;
        veh.wheelInfos[i].steeringValue = 0;
    }
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
resetCar();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Camera toggle
    if (isCamera()) {
        toggleDriverMode();
    }

    // Reset
    if (isReset() && now - lastReset > 500) {
        lastReset = now;
        resetCar();
    }

    // Steering
    let steer = 0;
    if (isLeft()) steer = 1;
    if (isRight()) steer = -1;
    const swAngle = getSteerAngle();
    if (Math.abs(swAngle) > 0.05) steer = -swAngle;
    const steerTarget = steer * VC.maxSteer;
    const steerSpeed = 2.5;
    for (let i = 0; i < 4; i++) {
        const curr = veh.wheelInfos[i].steeringValue;
        let next = curr + Math.sign(steerTarget - curr) * Math.min(Math.abs(steerTarget - curr), steerSpeed * dt);
        if (Math.abs(next) < 0.01 && steerTarget === 0) next = 0;
        veh.wheelInfos[i].steeringValue = next;
    }

    // Engine / brake
    let engineForce = 0;
    let brakeForce = 0;
    if (isForward()) engineForce = VC.engineF;
    if (isBackward()) engineForce = -VC.engineF * 0.6;
    if (isBrake()) brakeForce = VC.brakeF * 2;

    for (let i = 0; i < 4; i++) {
        veh.wheelInfos[i].engineForce = engineForce;
        veh.wheelInfos[i].brake = brakeForce;
    }

    // Speed
    speed = Math.sqrt(
        chassisBody.velocity.x ** 2 +
        chassisBody.velocity.y ** 2 +
        chassisBody.velocity.z ** 2
    );
    if (engineForce === 0 && brakeForce === 0 && speed < 0.1) {
        chassisBody.velocity.x *= 0.95;
        chassisBody.velocity.z *= 0.95;
    }

    setSpeed(speed);
    setGear(engineForce < 0 ? 'R' : 'D');

    // Collision flash
    if (now - lastContactTime > 200) flashRed(false);

    // Check
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

    // State timer
    if (gameState !== 'running') {
        stateTimer -= dt;
        if (stateTimer <= 0) {
            setStatus('', '');
            if (gameState === 'pass') {
                // Auto advance to next sub level
                const level = LEVELS.find(l => l.id === currentLevelId);
                const nextIdx = (currentSubIdx + 1) % level.subs.length;
                loadLevelAndReset(currentLevelId, nextIdx);
            }
        }
    }

    // Physics
    world.step(1 / 60, dt, 3);

    // Visuals
    syncCarVisuals();
    updateCamera(chassisBody.position, chassisBody.quaternion);

    // Out of bounds
    if (chassisBody.position.y < -5 || Math.abs(chassisBody.position.x) > 60 || Math.abs(chassisBody.position.z) > 60) {
        resetCar();
    }

    renderer.render(scene, camera);
}

animate();
