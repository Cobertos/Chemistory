import * as THREE from "three";
import { BasePart } from "./BasePart";

/**Part that will add the object to the physics engine.
 * @prop linearVelocity {THREE.Vector3} Current linear velocity
 * @prop angularVelocity {THREE.Vector3} Current angular velocity
 * @todo Objects with multiple layers of Physics object will probably
 * act really weird
 * @todo This will not work if added as a child to another object. It
 * will only work if added to a SimScene (this requires a larger discussion
 * about functionality and how it relates to a Scene...)
 */
export class PhysicsPart extends BasePart {
  get supportsPhysics() { return true; }

  initializer() { //aggregation constructor
    //Extra parameters from physics simulation
    this.linearVelocity = new THREE.Vector3(0,0,0);
    this.angularVelocity = new THREE.Vector3(0,0,0);

    this._physScene = undefined;

    //gets sent to the physics engine on added to scene
  }

  /**Dirties this physics object
   * @param {boolean} [dirtyPos=true] Dirty the position
   * @param {boolean} [dirtyRot=true] Dirty the rotation
   * @param {boolean} [dirtyVel=true] Dirty the linear velocity
   * @param {boolean} [dirtyAngVel=true] Dirty the angular velocity
   */
  dirty(dirtyPos=true, dirtyRot=false, dirtyVel=false, dirtyAngVel=false) {
    if(!this._physScene) {
      throw new Error("No physics scene");
    }
    let params = this.getPhysicsParams();
    this._physScene.set(params, dirtyPos, dirtyRot, dirtyVel, dirtyAngVel);
  }

  /**Adds a force to the object in the next physics frame
   * @param {THREE.Vector3} force The force to apply, mass dependant
   * @param {THREE.Vector3} [pos=undefined] The position to apply it from in
   * world coordinates. Will use the current position if undefined
   */
  impulse(force, pos=undefined) {
    this._physScene.impulse(this.getPhysicsParams(), 
      pos ? pos.toArray() : this.getPhysicsParams().pos,
      force.toArray());
  }

  /**Get the physics parameters from the three.js/SimObject. Takes properties
   * that get passed to the physics object constructor. Inherit this and
   * Object.assign({}) your new properties to set the `type` (shape) and
   * `kinematic`, `neverSleep`, `move`, and any other OIMO parameters.
   * See OIMOjsInternals.md for more info...
   * @returns {object} physic parameters object. Can have any SIMPLE js properties
   * b/c is has to cross a webworker barrier (no custom classes or functions, only plain
   * objects). THREE.Vector2,3,4 will be converted if pos, rot, vel, and angVel to arrays
   * and then back to OIMO vectors in the worker.
   */
  getPhysicsParams() {
    let geo = this.geometry;
    if(!geo.boundingBox) {
      geo.computeBoundingBox();
    }
    let size = new THREE.Vector3();
    let tmp = new THREE.Vector3();
    geo.boundingBox.getSize(size)
      .multiply(this.getWorldScale(tmp));

    return {
      id: this.uuid,
      pos: this.position.toArray(),
      size: size.toArray(),
      rot: this.quaternion.toArray(),
      vel: this.linearVelocity.toArray(),
      angVel: this.angularVelocity.toArray()

      //See OIMOjsInternals.md for more info
    };
  }
}