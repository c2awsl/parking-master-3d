import { LEVELS } from './levels.js';

const statusEl = document.getElementById('status');
const gearEl = document.getElementById('gear-text');
const speedEl = document.getElementById('speed-value');
const tabContainer = document.getElementById('tabs');
const subTabContainer = document.getElementById('sub-tabs');

let onLevelSelect = null;
let currentTab = 'reverse';
let currentSubIdx = 0;

export function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = type || '';
}

export function setGear(g) {
    gearEl.textContent = g;
    gearEl.className = 'gear ' + (g === 'R' ? 'gear-r' : 'gear-d');
}

export function setSpeed(v) {
    speedEl.textContent = Math.abs(Math.round(v));
}

export function flashRed(on) {
    document.getElementById('cflash').className = on ? 'on' : '';
}

export function buildTabs(callback) {
    onLevelSelect = callback;
    LEVELS.forEach(level => {
        const btn = document.createElement('button');
        btn.className = 'tab' + (level.id === currentTab ? ' active' : '');
        btn.textContent = level.name;
        btn.onclick = () => selectTab(level.id);
        tabContainer.appendChild(btn);
    });
    selectTab(currentTab);
}

function selectTab(id) {
    currentTab = id;
    currentSubIdx = 0;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const tabs = [...document.querySelectorAll('.tab')];
    const level = LEVELS.find(l => l.id === id);
    tabs[LEVELS.indexOf(level)].classList.add('active');
    buildSubTabs(level);
    if (onLevelSelect) onLevelSelect(id, 0);
}

function buildSubTabs(level) {
    subTabContainer.innerHTML = '';
    if (level.subs.length <= 1) {
        subTabContainer.classList.remove('show');
        return;
    }
    subTabContainer.classList.add('show');
    level.subs.forEach((sub, i) => {
        const btn = document.createElement('button');
        btn.className = 'sub-tab' + (i === currentSubIdx ? ' active' : '');
        btn.textContent = sub.label;
        btn.onclick = () => {
            currentSubIdx = i;
            document.querySelectorAll('.sub-tab').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            if (onLevelSelect) onLevelSelect(currentTab, i);
        };
        subTabContainer.appendChild(btn);
    });
}

export function getCurrentTab() { return currentTab; }
export function getCurrentSubIdx() { return currentSubIdx; }
