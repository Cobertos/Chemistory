import * as THREE from "three";
import { SimObject, SimScene, PhysicsPart } from "./BaseObject";
import { ChemItem } from "./ChemItem";

export class ChemTable extends SimObject(THREE.Mesh, PhysicsPart) {
  constructor(spawnPos) {
    let g = new THREE.BoxBufferGeometry(1,1,1);
    let m = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    super(g, m);
    this.scale.set(3.5,1,2);

    this._fallTime = 1000;
    this._endTime = Date.now() + this._fallTime;
    this._startPos = spawnPos.clone().add(new THREE.Vector3(0,5,0));
    this._endPos = spawnPos.clone();
  }

  onTick() {
    if(Date.now() > this._endTime) {
      return;
    }
    
    let deltaFrac = 1 - (this._endTime - Date.now()) / this._fallTime;
    let currPos = this._startPos.clone()
                    .add(this._endPos.clone()
                         .sub(this._startPos)
                         .multiplyScalar(deltaFrac));
    this.position.copy(currPos);
    this.dirty();
  }

  onRaycast(hitInfo, scene) {
    let ci = new ChemItem(
        this.position.clone().add(new THREE.Vector3(0,2,0)),
        new THREE.Color(1,0,0));
    scene.add(ci);
  }

  getPhysicsParams() {
    return Object.assign(super.getPhysicsParams(), {
      type: "box",
      move: true,
      isKinematic: true
    });
  }
}