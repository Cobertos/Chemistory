import * as THREE from "three";
import { SimObject, PhysicsPart } from "./BaseObject";

export class ChemLevel extends SimObject(THREE.Mesh, PhysicsPart) {
  constructor() {
    let g = new THREE.BoxBufferGeometry(1,1,1);
    let m = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    super(g,m);
    this.scale.set(100,20,100);
  }

  getPhysicsParams() {
    return Object.assign(super.getPhysicsParams(), {
      type:"box",
      move: false
    });
  }
}