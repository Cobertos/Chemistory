import * as THREE from "three";
import { SimObject } from "./SimObject.js";
import { WSScenePart } from "./WSScenePart.js";
import { OIMOScenePart } from "./OIMOScenePart.js";
import RSVP from "rsvp";
const {Promise} = RSVP;

/**Scene that encapsulates mutiple types of scenes
 */
export class SimScene extends SimObject(THREE.Scene, WSScenePart, OIMOScenePart) {
  constructor(url) {
    super(url);
  }

  async load() {
    let promises = this.partClss.map((partCls)=>{
      if(typeof partCls.load === "function") {
        return partCls.load();
      }}).filter((o)=>!!o); //Remove undefineds
    return Promise.all(promises);
  }

  get scene() {
    return this;
  }

  /**SimObjects added to us will call the register function
   * @param {THREE.Object3D|SimObject} obj The object to register
   * with the subsystems. Should already be in the THREE scene
   */
  register(obj) {
    this._partApply("onRegister", [obj]);
  }

  /**SimObjects added to us will call the register function
   * @param {THREE.Object3D|SimObject} obj The object to unregister
   * with the subsystems. Should still be in the THREE scene
   */
  unregister(obj) {
    this._partApply("onUnregister", [obj]);
  }
}