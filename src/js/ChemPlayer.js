import * as THREE from "three";
import { SimObject, PhysicsPart } from "./BaseObject";
import { getInput } from "./input";

export class ChemPlayer extends SimObject(THREE.Mesh, PhysicsPart) {
  constructor(cam) {
    let g = new THREE.CylinderBufferGeometry(0.7,1,1,10);
    let m = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    super(g, m);
    this.castShadow = true;
    this.scale.set(1,1.7,1);
    this._camera = cam;
    this.add(cam);
    cam.position.set(0,5,-8.3);
    cam.lookAt(this.position);
  }

  onPhysicsTick() {
    //Fix the rotation of the player (TODO:honestly this should be a physics
    //engine constraint but Oimo doesnt support that out of the box)
    this.quaternion.copy(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0,0,1), 0));
    this.angularVelocity = new THREE.Vector3(0,0,0);

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
    mov.multiplyScalar(10);

    if(getInput("jump")) {
      mov.add(new THREE.Vector3(0,5,0));
    }
    if(mov.lengthSq() < 0.01 && this.linearVelocity.lengthSq() < 0.01) {
      return;
    }
    else if(mov.lengthSq() < 0.01) {
      //Apply "negative movement" to provide quicker stopping
      mov = this.linearVelocity.clone()
        .negate()
        .multiplyScalar(0.5);
    }

    this.impulse(mov);

    //Enforce a max velocity
    let dirtyVel = false;
    const maxVel = 6;
    let maxVelPow2 = Math.pow(maxVel, 2);
    if(this.linearVelocity.lengthSq() > maxVelPow2) {
      dirtyVel = true;
      this.linearVelocity.multiplyScalar(
        maxVelPow2 / this.linearVelocity.lengthSq());
    }
    this.dirty(false, true, dirtyVel, true); //Propogate to the physics engine
  }

  get camera() {
    return this._camera;
  }

  getPhysicsParams() {
    return Object.assign(super.getPhysicsParams(), {
      type:"box",
      move: true,
      friction: 2,
      restitution: 0,
      neverSleep: true //Used to force onPhysicsTick to always run
    });
  }
}