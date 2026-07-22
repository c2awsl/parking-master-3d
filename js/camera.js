import * as THREE from 'three';
import { camera, scene } from './scene.js';

let driverMode = false;
const offset = new THREE.Vector3(0, 12, 16);

export function toggleDriverMode() { driverMode = !driverMode; return driverMode; }
export function isDriverMode() { return driverMode; }

const tempVec = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();

export function updateCamera(bodyPos, bodyQuat) {
    const carPos = new THREE.Vector3().copy(bodyPos);
    carPos.y += 0.35;

    if (!driverMode) {
        const offsetWorld = offset.clone().applyQuaternion(new THREE.Quaternion().copy(bodyQuat));
        const target = carPos.clone().add(offsetWorld);
        camera.position.lerp(target, 0.08);
        tempVec.copy(carPos);
        tempVec.y += 0.5;
        camera.lookAt(tempVec);
    } else {
        tempVec.set(0, 1.1, 1.0);
        tempVec.applyQuaternion(new THREE.Quaternion().copy(bodyQuat));
        tempVec.add(carPos);
        camera.position.lerp(tempVec, 0.12);
        tempVec.set(0, 1.1, -10).applyQuaternion(new THREE.Quaternion().copy(bodyQuat)).add(carPos);
        camera.lookAt(tempVec);
    }
}
