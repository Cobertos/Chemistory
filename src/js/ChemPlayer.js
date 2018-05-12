import * as THREE from "three";
import { SimObject, PhysicsPart } from "./BaseObject";
import { getInput } from "./input";

const playerFOV = 75;

export class ChemPlayer extends SimObject(THREE.Mesh, PhysicsPart) {
  constructor() {
    let g = new THREE.CylinderBufferGeometry(0.7,1,1,10);
    let m = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    super(g, m);
    this.scale.set(1,1.7,1);
    let c = this._camera = new THREE.PerspectiveCamera(playerFOV, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.add(c);
    c.position.set(0,3,-5);
    c.lookAt(this.position);
  }

  onTick() {
    //Fix the rotation of the player (TODO:honestly this should be a physics
    //engine constraint but Oimo doesnt support that out of the box)
    this.quaternion.copy(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0,0,1), 0));
    this.angularVelocity = new THREE.Vector3(0,0,0);
    this.dirty(false, true, false, true); //Propogate to the physics engine

    //Calculate player movement
    let mov = new THREE.Vector3(0,0,0);
    if(getInput("up")) {
      mov.add(new THREE.Vector3(0,0,1));
    }
    if(getInput("down")) {
      mov.add(new THREE.Vector3(0,0,-1));
    }
    if(getInput("left")) {
      mov.add(new THREE.Vector3(1,0,0));
    }
    if(getInput("right")) {
      mov.add(new THREE.Vector3(-1,0,0));
    }
    mov.normalize();

    if(getInput("jump")) {
      mov.add(new THREE.Vector3(0,3,0));
    }
    if(mov.lengthSq() < 0.01) {
      return;
    }

    this.impulse(mov);
  }

  get camera() {
    return this._camera;
  }

  getPhysicsParams() {
    return Object.assign(super.getPhysicsParams(), {
      type:"box",
      move: true
    });
  }
}