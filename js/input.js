const keys = {};
export const touchState = { forward: false, backward: false, left: false, right: false };

window.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.code] = false; e.preventDefault(); });

export function isForward() { return keys['KeyW'] || keys['ArrowUp'] || touchState.forward; }
export function isBackward() { return keys['KeyS'] || keys['ArrowDown'] || touchState.backward; }
export function isLeft() { return keys['KeyA'] || keys['ArrowLeft'] || touchState.left; }
export function isRight() { return keys['KeyD'] || keys['ArrowRight'] || touchState.right; }
export function isBrake() { return keys['Space']; }
export function isReset() { return keys['KeyR']; }
export function isCamera() { if (keys['KeyC']) { keys['KeyC'] = false; return true; } return false; }

// Steering wheel
let swCanvas, swCtx, swActive = false, swAngle = 0, swCenter = { x: 0, y: 0 };
const SW_RADIUS = 55;

export function initSteeringWheel() {
    swCanvas = document.getElementById('sw-canvas');
    if (!swCanvas) return;
    swCtx = swCanvas.getContext('2d');
    drawWheel(0);

    const wrap = document.getElementById('sw-wrap');

    wrap.addEventListener('pointerdown', e => {
        e.preventDefault();
        swActive = true;
        const rect = swCanvas.getBoundingClientRect();
        swCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        wrap.setPointerCapture(e.pointerId);
    });

    wrap.addEventListener('pointermove', e => {
        if (!swActive) return;
        e.preventDefault();
        const dx = e.clientX - swCenter.x;
        const dy = e.clientY - swCenter.y;
        swAngle = Math.max(-1, Math.min(1, dx / SW_RADIUS));
        drawWheel(swAngle);
    });

    wrap.addEventListener('pointerup', () => { swActive = false; swAngle = 0; drawWheel(0); });
    wrap.addEventListener('pointercancel', () => { swActive = false; swAngle = 0; drawWheel(0); });
}

export function getSteerAngle() { return swAngle; }

function drawWheel(angle) {
    if (!swCtx) return;
    const w = 120, h = 120, cx = w / 2, cy = h / 2;
    const ctx = swCtx;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle * 0.6);

    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // 3 spokes
    for (let i = 0; i < 3; i++) {
        const a = (i * 120 - 90) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
        ctx.lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 5;
        ctx.stroke();
    }

    // Center
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#555';
    ctx.fill();

    ctx.restore();
}

// Mobile touch controls
let touchBtns = {};
export function initTouchButtons() {
    touchBtns = {
        forward: document.getElementById('tb-fwd'),
        backward: document.getElementById('tb-bwd'),
        left: document.getElementById('tb-left'),
        right: document.getElementById('tb-right'),
    };

    Object.entries(touchBtns).forEach(([key, el]) => {
        if (!el) return;
        el.addEventListener('pointerdown', e => { e.preventDefault(); touchState[key] = true; el.setPointerCapture(e.pointerId); });
        el.addEventListener('pointerup', () => touchState[key] = false);
        el.addEventListener('pointercancel', () => touchState[key] = false);
    });
}
