import * as THREE from "three";
import { SimObject, SimScene, PhysicsPart } from "./BaseObject";

export class ChemItem extends SimObject(THREE.Mesh, PhysicsPart){
  constructor(spawnPos, color) {
    let g = new THREE.CylinderBufferGeometry(1,1,1,10);
    let m = new THREE.MeshLambertMaterial({ color: color });
    super(g, m);
    this.position.copy(spawnPos);
    this.scale.set(0.125,0.125,0.125);
  }

  onRaycast(hitInfo, scene) {
    o.material.color.set(new THREE.Color(0,0.5,1));
  }

  getPhysicsParams() {
    return Object.assign(super.getPhysicsParams(), {
      type:"cylinder",
      move: true
    });
  }
}