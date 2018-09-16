import * as THREE from "three";
import RSVP from "rsvp";
const {Promise} = RSVP;
import "three-examples/loaders/LoaderSupport.js"; //Loads to THREE.LoaderSupport
import "three-examples/loaders/OBJLoader2.js"; //Loads to THREE.OBJLoader2
import "three-examples/loaders/MTLLoader.js"; //Loads to THREE.MTLLoader
import { SimObject, PhysicsPart } from "./BaseObject";

/**Loads an obj/mtl object asynchronously along with it's partner
 * physics parts
 */
export class SimObjectLoader {
  constructor() {}

  /**Actually loads and parses the .mtl and .obj files
   * from the given URL
   * @param {string} url The url to load from without the trailing
   * extension
   * @returns {Promise} Promise that resolves to SimObject that 
   */
  load(url) {
    let loader = new THREE.OBJLoader2();
    return new Promise((resolve/*, reject*/)=> {
      loader.loadMtl(url + ".mtl", undefined, resolve);
    }).then((mtlCreator)=>{
      return new Promise((resolve, reject)=>{
        loader.setMaterials(mtlCreator);
        //url, onLoad, onProgress, onError, onMeshAlter, useAsync
        loader.load(url + ".obj", resolve, null, reject, null, true );
      });
    }).then((obj)=>{
      obj = obj.detail.loaderRootNode;
      console.log(obj.children[0].children, obj.children[0].children.length);
      this.process(obj);
      return obj;
    }).catch(RSVP.rethrow);
  }

  /**Takes a loaded THREE.js object with special names that determine extra
   * loading operations that need to be done to them.
   * SPECIAL NAMES:
   * PHYSICS_XXX_YYY: PHYSICS_ is the prefix, XXX is BOX or SPHERE which
   * is the type of physics object, and _ONLY suffix determines if the graphics
   * should be kept or only used as size information
   * @param {THREE.Object3D} rootObj The root object to traverse and modify.
   * @todo You can't use the output of this directly because physics objects
   * need to be added to the root of a scene. You'll have to iterate over all .children
   * and add them to the scene yourself
   */
  process(rootObj) {
    //Replaces an obj in the heirarchy with another obj
    const replaceObj = (from, to)=>{
      from.children.slice().forEach((child)=>{
        to.add(child);
      });
      from.parent.add(to);
      from.parent.remove(from);
    };
    //Recurse through the process
    const recurseProcess = (obj)=>{
      obj.children.slice().forEach((child)=>{
        //Depth first into child
        recurseProcess(child);
        let newObj = this._processOne(child);
        if(newObj !== child) {
          replaceObj(child, newObj);
        }
      });
    };
    recurseProcess(rootObj);
  }

  /**Processes a single object and outputs the modified object but
   * none of the children
   * @private
   * @param {THREE.Object3D} obj the object to process
   * @returns {THREE.Object3D|SimObject} The modified object
   * @todo Sphere will fail until supported in OIMOWorker and OIMOScene
   * @todo All objects are static right now...
   * @todo This would be way better with bsp ;_;
   */
  _processOne(obj){
    let physics = !!obj.name.match(/PHYS=/) || (
      obj.material && !!obj.material.name.match(/(CLIP|NODRAW|DEFAULT)/i));
    console.log(obj.material && obj.material.name);

    if(physics) {
      //let moves = obj.name.match(/PHYS=(STATIC)?/);
      //moves = moves ? moves[1] !== "STATIC" : false;
      let shape = obj.name.match(/PHYS_SHAPE=(BOX|SPHERE)/);
      shape = shape ? shape[1] : "BOX";
      let invisible = !!obj.name.match(/INVIS=/) ||
        !!obj.material.name.match(/NODRAW/i);

      //Find all the parameters defined in the level
      let threeCls = invisible ? THREE.Group : Object.getPrototypeOf(obj).constructor;
      let threePos = new THREE.Vector3();
      let threeSize = new THREE.Vector3();
      //Determine object position and size based on type
      if(shape === "BOX") {
        obj.geometry.computeBoundingBox();
        let bb = obj.geometry.boundingBox;
        bb.getSize(threeSize);
        bb.getCenter(threePos);
      }
      else if(shape === "SPHERE") {
        //TODO: UNIMPLEMENTED! This will fail in getPhysicsParams for
        //threeSize bs.radius. Also requires physics engine change
        obj.geometry.computeBoundingSphere();
        let bs = obj.geometry.boundingSphere;
        threeSize = bs.radius;
        threePos.copy(bs.center.clone())
      }
      let cls = class _SimObjectLoaded extends SimObject(threeCls, PhysicsPart) {
        getPhysicsParams() {
          //Completely overwrite with custom stuff
          return {
            id: this.uuid,
            pos: threePos.toArray(),
            size: threeSize.toArray(),
            rot: this.quaternion.toArray(),
            vel: this.linearVelocity.toArray(),
            angVel: this.angularVelocity.toArray(),

            type: shape.toLowerCase(),
            move: false //All loaded objects are static right now
          };
        }
      }
      let newObj = new cls();
      newObj.copy(obj); //Copy all old values into the new one
      console.log(newObj);
      if(newObj.geometry) {
        newObj.geometry.copy(obj.geometry);
        newObj.material = obj.material;
      }
      obj = newObj;
    }
    return obj;
  }
}