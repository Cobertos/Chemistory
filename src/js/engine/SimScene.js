import * as THREE from "three";
import { OIMOScene } from "./OIMOScene.js";
import { WSScene } from "./WSScene.js";
import { SimObject } from "./SimObject.js";

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