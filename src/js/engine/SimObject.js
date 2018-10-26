import * as THREE from "three";
import aggregation from "aggregation";
import { BasePart } from "./BasePart";
import { _assert } from "../utils";

/**Factory function for creating the base class for SimObjects of different
 * THREE.js classes
 * @param {function} THREE.Object3D constructor (like THREE.Mesh)
 * @param {...function} partClss Vararg for all the other classes to
 * mixin into the new THREE.js class.
 * @returns {function} The new SimObject base class to inherit from. Use like
 * `class XXX extends SimObject(THREE.Mesh, PhysicsPart) {}`
 */
export function SimObject(threeCls, ...partClss) {
  _assert(threeCls.prototype instanceof THREE.Object3D ||
          threeCls.prototype === THREE.Object3D.prototype, "Must inherit from THREE.Object3D or descendant");
  partClss = [DefaultPart, ...partClss];

  /**THREE.Object3D inherittor + any additionally inheritted parts passed from
   * the called
   * @extends THREE.Object3D
   */
  const cls = class _SimObject extends aggregation(threeCls, ...partClss) {
    constructor(...args){
      super(...args);
      setTimeout(this.finishConstruction.bind(this)); //The next javascript frame, call this
    }

    /**You must call this after the class is defined if one of your
     * mixed in parts has a onDefined callback (like the NetworkPart)
     */
    static finishDefinition() {
      this._partApplyStatic("onDefined");
    }

    /**You must call this after construction finishes to properly setup
     * things.
     * @todo Add an assert if this isn't called
     * @todo Is the setTimeout above enough?
     * @todo Remove duplication of _partClss functionality
     * and call finishDefinition on event SimObject (refactor)
     */
    finishConstruction() {
      this._partApply("onConstructed");
    }

    /**Calls function.apply() for every part that has func.
     * Only necessary when multiple parts define the same
     * function where they would otherwise overwrite each other
     * in the aggregation() process
     * @param {string} func The function name to call
     * @param {any[]} args The arguments to call with
     */
    static _partApplyStatic(func, args) {
      partClss.forEach((partCls)=>{
        if(partCls[func]) {
          partCls[func].apply(this, args);
        }
      });
    }
    _partApply(func, args) {
      //Fail fast if we don't have it mixed in b/c it should be in here from aggregation
      if(typeof this[func] !== "function") {
        return;
      }
      partClss.forEach((partCls)=>{
        if(func in partCls.prototype) {
          partCls.prototype[func].apply(this, args);
        }
      });
    }

    /**Override for add.
     * @param {THREE.Object3D|SimObject} ...objs Objects
     * @returns {undefined} Nothing
     */
    add(...objs) {
      objs.forEach((obj)=>{
        //Don't call with ...objs as it will call .add() for each one again
        super.add(obj);
        if(this.scene && typeof this.scene.register === "function") {
          obj.traverse((obj)=>{
            //Depth first by default, will
            //include self
            this.scene.register(obj);
          });
        }
      });
    }

    /**Override for remove
     * @param {THREE.Object3D|SimObject} ...objs Objects
     * @returns {undefined} Nothing
     * @todo You might have issues removing things added in add()
     * if you are removing them in the same order (see comment in code)
     */
    remove(...objs) {
      objs.forEach((obj)=>{
        if(this.scene && typeof this.scene.unregister === "function") {
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
        }
        //Don't call with ...objs as it will call .remove() for each one again
        super.remove(obj);
      });
    }

    /**Gets the scene
     * @prop scene
     */
    get scene() {
      return this.parent && this.parent.scene;
    }
  }

  return cls;
}

/**Do not inherit from this. Use BasePart instead
 */
export class DefaultPart extends BasePart {
  onConstructed(){
    //Setup onTick callback
    if(typeof this.onTick === "function") {
      this.onBeforeRender = this.onTick.bind(this);
    }
  }
}