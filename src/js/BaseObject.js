import * as THREE from "three";
import { OIMOScene } from "./OIMOScene.js";
import aggregation from "aggregation";

/**Scene that encapsulates mutiple types of scenes
 */
export class SimScene {
  constructor() {
    this._objects = [];

    this._three = new THREE.Scene();
    this._phys = new OIMOScene();
  }

  /**Add an object to the scene
   * @param {THREE.Object3D|SimObject} obj
   */
  add(obj) {
    this._objects.push(obj);
    this._three.add(obj);
    if(obj.supportsPhysics) {
      obj._physScene = this._phys;
      this._phys.add(obj.getPhysicsParams(), obj);
    }
  }

  remove(obj) {
    let idx = this._objects.indexOf(obj);
    this._objects.splice(idx, 1);
    this._three.remove(obj);
    if(obj.supportsPhysics) {
      this._phys.del(obj.getPhysicsParams());
      obj._physScene = undefined;
    }
  }
}

/**Factory function for creating the base class for SimObjects of different
 * THREE.js classes
 * @param {function} THREE.Object3D constructor (like THREE.Mesh)
 * @param {...function} partClss Vararg for all the other classes to
 * mixin into the new THREE.js class.
 * @returns {function} The new SimObject base class to inherit from. Use like
 * `class XXX extends SimObject(THREE.Mesh, PhysicsPart) {}`
 */
export function SimObject(threeCls, ...partClss) {
  /**THREE.Object3D inherittor + any additionally inheritted parts passed from
   * the called
   * @extends THREE.Object3D
   */
  return class _SimObject extends aggregation(threeCls, DefaultPart, ...partClss) {
    constructor(...args){
      super(...args);
      setTimeout(this.finishConstruction.bind(this)); //The next javascript frame, call this
    }

    /**You must call this after construction finishes to properly setup
     * things
     * @todo Add an assert if this isn't called
     * @todo Is the setTimeout above enough?
     */
    finishConstruction() {
      this._partClss = [DefaultPart, ...partClss];
      if(this._partHasFunction("onConstructed")) {
        this._partApply("onConstructed");
      }
    }

    /**Calls function.apply() for every part that has func
     * @param {string} func The function name to call
     * @param {any[]} args The arguments to call with
     */
    _partApply(func, args) {
      this._partClss.forEach((partCls)=>{
        if(func in partCls.prototype) {
          partCls.prototype[func].apply(this, args);
        }
      });
    }

    /**Does any part on us have the given function name
     * @param {string} func The function name to check for
     * @returns {boolean} Whether the function exists or not to call
     */
    _partHasFunction(func) {
      return typeof this[func] === "function"; //Should get mixed in from aggregation if someone has it
    }
  }

}

/**Base class for all parts. NOTE: Currently parts will work even without this base class
 * and this is just for documentation purposes...
 */
export class BasePart {
  /**aggregation() library constructor. Called after child that uses part constructor()
   * but called before the parent class constructor (THREE.js constructor).
   * NOTE: constructor() will never be called b/c of how aggregation() is implemented!
   * @method initializer
   * @todo Confirm the calling order between the different parts in a SimObject and
   * update documentation as necessarty
   */

  /**Called the first frame after the object finishes construction and
   * the super() call chain in constructor() has finished
   * @method onConstructed
   */
}

/**Part that gets mixed in to every SimObject. Contains very basic functionality.
 * NOTE: Parts have no base class. If you're looking for a base class. It shouldn't
 * inherit from anything. This part is a good start though
 */
export class DefaultPart {
  /**Hook to setup onTick
   */
  onConstructed() {
    //Setup onTick callback
    if(typeof this.onTick === "function") {
      this.onBeforeRender = this.onTick.bind(this);
    }
  }

  /**Called every frame
   * @method onTick
   * @todo This is bound to onBeforeRender, but it should be called regardless of whether
   * or not this object will render
   */
}

/**Part that will add the object to the physics engine.
 * @prop linearVelocity {THREE.Vector3} Current linear velocity
 * @prop angularVelocity {THREE.Vector3} Current angular velocity
 * @todo Objects with multiple layers of Physics object will probably
 * act really weird
 * @todo This will not work if added as a child to another object. It
 * will only work if added to a SimScene (this requires a larger discussion
 * about functionality and how it relates to a Scene...)
 */
export class PhysicsPart {
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
    };
  }
}