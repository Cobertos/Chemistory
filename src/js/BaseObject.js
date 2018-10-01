import * as THREE from "three";
import { OIMOScene } from "./OIMOScene.js";
import { WSScene } from "./WSScene.js";
import aggregation from "aggregation";

/**Factory function for creating the base class for SimObjects of different
 * THREE.js classes
 * @param {function} THREE.Object3D constructor (like THREE.Mesh)
 * @param {...function} partClss Vararg for all the other classes to
 * mixin into the new THREE.js class.
 * @returns {function} The new SimObject base class to inherit from. Use like
 * `class XXX extends SimObject(THREE.Mesh, PhysicsPart) {}`
 */
export function SimObject(threeCls, ...partClss) {
  partClss = [DefaultPart, ...partClss];

  /**THREE.Object3D inherittor + any additionally inheritted parts passed from
   * the called
   * @extends THREE.Object3D
   */
  return class _SimObject extends aggregation(threeCls, DefaultPart, ...partClss) {
    constructor(...args){
      super(...args);
      setTimeout(this.finishConstruction.bind(this)); //The next javascript frame, call this
    }

    /**You must call this after the class is defined if one of your
     * mixed in parts has a onDefined callback (like the NetworkPart)
     */
    static finishDefinition() {
      if(this._partHasFunction(this, "onDefined")) {
        this._partApply(this, "onDefined");
      }
    }

    /**You must call this after construction finishes to properly setup
     * things
     * @todo Add an assert if this isn't called
     * @todo Is the setTimeout above enough?
     * @todo Remove duplication of _partClss functionality
     * and call finishDefinition on event SimObject (refactor)
     */
    finishConstruction() {
      if(this._partHasFunction("onConstructed")) {
        this._partApply("onConstructed");
      }
    }

    /**Calls function.apply() for every part that has func.
     * Only necessary when multiple parts define the same
     * function where they would otherwise overwrite each other
     * in the aggregation() process
     * @param {object} _this The object to use as _this
     * (as it could be on the class instance, not
     * the actual class that we want to call this on)
     * @param {string} func The function name to call
     * @param {any[]} args The arguments to call with
     */
    static _partApply(_this, func, args) {
      partClss.forEach((partCls)=>{
        if(func in partCls.prototype) {
          partCls.prototype[func].apply(_this, args);
        }
      });
    }
    _partApply(func, args) {
      _SimObject._partApply(this, func, args);
    }

    /**Does any part on us have the given function name
     * @param {string} func The function name to check for
     * @returns {boolean} Whether the function exists or not to call
     */
    static _partHasFunction(func) {
      return typeof this.prototype[func] === "function"; //Should get mixed in from aggregation if someone has it
    }
    _partHasFunction(func, args) {
      _SimObject._partApply(this, func, args);
    }

    /**Override for add
     * @param {THREE.Object3D|SimObject} ...objs Objects
     * @returns {undefined} Nothing
     */
    add(...objs) {
      super.add(...objs);
      if(this.scene) {
        objs.forEach((obj)=>{
          obj.traverse((obj)=>{
            //Depth first by default, will
            //include self
            this.scene.register(obj);
          });
        });
      }
    }

    /**Override for remove
     * @param {THREE.Object3D|SimObject} ...objs Objects
     * @returns {undefined} Nothing
     */
    remove(...objs) {
      if(this.scene) {
        objs.forEach((obj)=>{
          obj.traverse((obj)=>{
            //Depth first by default, will
            //include self
            //TODO: This is a ticking time bomb, unregistration
            //happens in the same order as registration where we
            //will unregister the root removed object first. This
            //might cause some issue, it needs to unregister from
            //the deepest child to the shallowest (breadth-first?))
            this.scene.unregister(obj);
          });
        });
      }
      super.remove(...objs);
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

  /**Gets the scene
   * @prop scene
   */
  get scene() {
    return this.parent && this.parent.scene;
  }
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

/**Collects together debug portions of an object
 */
const isDebugBuild = true;
export class DebugPart {
  initializer() {

  }

  onConstructed() {
    if(isDebugBuild && typeof this.onDebug === "function") {
      this.onDebug();
    }
  }
}

export class NetworkPart {
  getNetworkParams() {
    return {};
  }

  static onDefined(){
    //TODO: RPCs
    //Post-Process all the functions that need to send
    //RPCs instead of actually functioning
    /*Object.keys(this.prototype).forEach((name)=>{
      let val = this.prototype[name];
      if(typeof val !== "function") {
        return false; //Continue
      }

      let match = name.match("^(cl|sv)_(.+)");
      if(!match) {
        return false;
      }

      let isServerFunc = match[1] === "sv";
      let rpcName = match[2];
      let _func = val;
      let func;
      if(isServerFunc){
        func = (...args)=>{
          if(this._wsScene.isServer) {
            _func(...args);
          }
          else {
            //Send it as an RPC to the server
            this._wsScene.rpc(rpcName, ...args);
          }
        }
      }
      else {
        func = (...args)=>{
          if(this._wsScene.isServer) {
            //Send an RPC to the client identified by the ID
            //let clientID = args[0];
            this._wsScene.rpc(rpcName, ...args);
          }
          else {
            _func(...args);
          }
        };
      }
      this.prototype[name] = func;
    });*/
  }
}


/**Scene that encapsulates mutiple types of scenes
 */
export class SimScene extends SimObject(THREE.Scene) {
  constructor(url) {
    super();
    this._phys = new OIMOScene();
    this._net = new WSScene(this, url);
  }

  get scene() {
    return this;
  }

  /**SimObjects added to us will call the register function
   * @param {THREE.Object3D|SimObject} obj The object to register
   * with the subsystems. Should already be in the THREE scene
   */
  register(obj) {
    if(obj.supportsNetworking) {
      obj._netScene = this._net;
    }
    if(obj.supportsPhysics) {
      obj._physScene = this._phys;
      this._phys.add(obj.getPhysicsParams(), obj);
    }
  }

  /**SimObjects added to us will call the register function
   * @param {THREE.Object3D|SimObject} obj The object to unregister
   * with the subsystems. Should still be in the THREE scene
   */
  unregister(obj) {
    if(obj.supportsNetworking) {
      this._netScene = undefined
    }
    if(obj.supportsPhysics) {
      this._phys.del(obj.getPhysicsParams());
      obj._physScene = undefined;
    }
  }
}