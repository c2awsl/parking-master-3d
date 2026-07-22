import * as CANNON from 'cannon-es';

export const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

const defMat = new CANNON.Material('def');
world.defaultContactMaterial = new CANNON.ContactMaterial(defMat, defMat, {
    friction: 0.3, restitution: 0.1, contactEquationStiffness: 1e8, contactEquationRelaxation: 3
});

export const gndMat = new CANNON.Material('gnd');
export const whlMat = new CANNON.Material('whl');
const wheelGroundContact = new CANNON.ContactMaterial(whlMat, gndMat, {
    friction: 0.7, restitution: 0.0, contactEquationStiffness: 1e8, contactEquationRelaxation: 3
});
world.addContactMaterial(wheelGroundContact);

export const wallMat = new CANNON.Material('wall');
world.addContactMaterial(new CANNON.ContactMaterial(wallMat, whlMat, {
    friction: 0.3, restitution: 0.1, contactEquationStiffness: 1e8, contactEquationRelaxation: 3
}));

export const gndBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: gndMat });
gndBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(gndBody);

export function addWallPhys(x, z, he, userData) {
    const b = new CANNON.Body({
        mass: 0, material: wallMat,
        shape: new CANNON.Box(new CANNON.Vec3(he[0], he[1], he[2])),
        position: new CANNON.Vec3(x, he[1], z)
    });
    if (userData) b.userData = userData;
    world.addBody(b);
    return b;
}
