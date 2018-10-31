import * as THREE from "three";
import { PhysicsPart } from "./PhysicsPart";
import { SimObject } from "./SimObject";

/**Loads an obj/mtl object asynchronously along with it's partner
 * physics parts
 */
export class SimObjectLoader {
  /**Actually loads and parses the .mtl and .obj files
   * from the given URL
   * @param {string} uri The url or path to load from
   * @returns {THREE.Object3D} A THREE.Object3D with SimObjects
   * depending on the names
   */
  async load(uri) {
    let loader = new THREE.OBJLoader2();
    let mtlCreator = await loader.loadMtlAsync(uri);
    loader.setMaterials(mtlCreator);
    let obj = await loader.loadObjAsync(uri);
    obj = obj.detail.loaderRootNode;
    this.process(obj);
    return obj;
  }

  /**Takes a loaded THREE.js object with special names that determine extra
   * loading operations that need to be done to them.
   * SPECIAL NAMES:
   * PHYSICS_XXX_YYY: PHYSICS_ is the prefix, XXX is BOX or SPHERE which
   * is the type of physics object, and _ONLY suffix determines if the graphics
   * should be kept or only used as size information
   * @param {THREE.Object3D} rootObj The root object to traverse and modify.
   */
  process(rootObj) {
    //Replaces an obj in the heirarchy with another obj
    //Passing to as null will remove from
    const replaceObj = (from, to)=>{
      if(to === null) {
        from.parent.remove(from);
        return;
      }
      from.children.slice().forEach((child)=>{
        to.add(child);
      });
      if(from.parent) {
        from.parent.add(to);
        from.parent.remove(from);
      }
    };
    //Recurse through the process
    const recurseProcess = (obj)=>{
      obj.children.slice().forEach((child)=>{
        //Depth first into child
        recurseProcess(child);
      });
      let newObj = this._processOne(obj);
      if(newObj !== obj) {
        replaceObj(obj, newObj);
      }
    };
    recurseProcess(rootObj);
  }

  /**Processes a single object and outputs the modified object but
   * none of the children
   * @private
   * @param {THREE.Object3D} obj the object to process
   * @returns {THREE.Object3D|SimObject|null} The modified object or null to remove
   * @todo Sphere will fail until supported in OIMOWorker and OIMOScene
   * @todo All objects are static right now...
   * @todo This would be way better with bsp ;_;
   */
  _processOne(obj){
    let name = obj.name;
    let matName = obj.material && obj.material.name;

    let physics = !!name.match(/PHYS=/) || 
      !!(matName && matName.match(/(CLIP|NODRAW|DEFAULT)/i));

    if(physics) {
      //let moves = obj.name.match(/PHYS=(STATIC)?/);
      //moves = moves ? moves[1] !== "STATIC" : false;
      let shape = name.match(/PHYS_SHAPE=(BOX|SPHERE)/);
      shape = shape ? shape[1] : "BOX";
      let invisible = !!name.match(/INVIS=/) || !!matName.match(/NODRAW/i);

      //Find all the parameters defined in the level
      let threeCls = invisible ? THREE.Group : Object.getPrototypeOf(obj).constructor;
      let threePos = new THREE.Vector3();
      let threeSize = new THREE.Vector3();
      //Determine object position and size based on type
      if(shape === "BOX") {
        obj.geometry.computeBoundingBox();
        let bb = obj.geometry.boundingBox;
        bb.getSize(threeSize);
        bb.getCenter(threePos)
        threePos.add(obj.position);
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
      if(newObj.geometry) {
        newObj.geometry.copy(obj.geometry);
        newObj.material = obj.material;
      }
      obj = newObj;
    }
    return obj;
  }
}