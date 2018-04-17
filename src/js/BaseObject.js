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

/*Example usage
export class ChemTable extends SimObject(THREE.Mesh, PhysicsPart) {

}*/
/**Object that encapsulates multiple types of objects
 * through the addition of parts but at its core is a THREE.js object
 */
export function SimObject(threeCls, ...partClss) {
  //Create the wrapper class
  return class _SimObject extends aggregation(threeCls, DefaultPart, ...partClss) {
    constructor(...args){
      super(...args);
      setTimeout(this.finishConstruction.bind(this)); //The next javascript frame, call this
    }

    /**You must call this after construction finishes to properly setup
     * things
     * @todo Add an assert if this doesn't work
     */
    finishConstruction() {
      this._partClss = [DefaultPart, ...partClss];
      if(this._partHasFunction("onConstructed")) {
        this._partApply("onConstructed");
      }
    }

    _partApply(func, args) {
      this._partClss.forEach((partCls)=>{
        if(func in partCls.prototype) {
          partCls.prototype[func].apply(this, args);
        }
      });
    }

    _partHasFunction(func) {
      return typeof this[func] === "function"; //Should get mixed in from aggregation if someone has it
    }
  }

}

export class DefaultPart {
  onConstructed() {
    //Setup onTick callback
    if(typeof this.onTick === "function") {
      this.onBeforeRender = this.onTick.bind(this);
    }
  }
}

export class PhysicsPart {
  get supportsPhysics() { return true; }

  constructor() {
    //Extra parameters from physics simulation
    this.linearVelocity = undefined;
    this.angularVelocity = undefined;

    this._physScene = undefined;
  }

  dirty(dirtyRot=false) {
    if(!this._physScene) {
      throw new Error("No physics scene");
    }
    let params = this.getPhysicsParams();
    this._physScene.set(params, params.pos, dirtyRot ? params.rot : undefined);
  }

  /**Get the physics parameters from the three.js/SimObject
   * @returns {object} physic parameters object
   */
  getPhysicsParams() {
    return {
      id: this.uuid,
      pos: this.position.toArray(),
      size: this.scale.toArray(),
      rot: this.quaternion.toArray()
    };
  }
}