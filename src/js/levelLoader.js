import * as THREE from "three";
import RSVP from "rsvp";
const {Promise} = RSVP;
import "three-examples/loaders/LoaderSupport.js"; //Loads to THREE.LoaderSupport
import "three-examples/loaders/OBJLoader2.js"; //Loads to THREE.OBJLoader2
import "three-examples/loaders/MTLLoader.js"; //Loads to THREE.MTLLoader
import "./physi.js"; /* global Physijs */

let loader = new THREE.TextureLoader();
let defaultMaterial = Physijs.createMaterial(
  new THREE.MeshStandardMaterial({ map: loader.load("images/table.png")}),
  .9, // high friction
  .2 // low restitution
);
defaultMaterial.map.wrapS = defaultMaterial.map.wrapT = THREE.RepeatWrapping;
defaultMaterial.map.repeat.set( 5, 5 );

export class LevelLoader {
  constructor() {}
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
      this.process(obj);
      return obj;
    }).catch(RSVP.rethrow);
  }

  process(rootObj) {
    //Replaces an obj in the heirarchy with another obj
    const replaceObj = (from, to)=>{
      from.children.slice().forEach((child)=>{
        to.add(child);
      });
      from.parent.add(to);
      from.parent.remove(from);
    };

    //Processes the given obj and either adds or replaces it
    //with a physics object of the same size depending on the
    //name
    const _process = (obj)=>{
      let match = obj.name.match(/PHYSICS_(BOX|SPHERE)(_ONLY)?/);
      //Requires physics object
      if(match) {
        let type = match[1];
        let physOnly = true;//!!match[2];
        let physObj;
        //Create physics object from type
        if(type === "BOX") {
          //Get untransformed bounding box of object
          obj.geometry.computeBoundingBox();
          let bb = obj.geometry.boundingBox;
          let size = bb.getSize();

          physObj = new Physijs.BoxMesh(
            new THREE.BoxGeometry(size.x, size.y, size.z),
            Physijs.createMaterial(obj.material.clone(), 0.9,0.2),
            0);
          physObj.position.copy(bb.getCenter())
          physObj.__dirtyPosition = true;
        }
        else if(type === "SPHERE") {
          //Get untransformed bounding sphere of object
          obj.geometry.computeBoundingSphere();
          let bs = obj.geometry.boundingSphere;

          physObj = new Physijs.SphereMesh(
            new THREE.SphereGeometry(bs.radius,32,32),
            Physijs.createMaterial(obj.material.clone(), 0.9,0.2),
            0);
          physObj.position.copy(bs.center.clone())
          physObj.__dirtyPosition = true;
        }

        //How to add physics obj...
        if(physOnly) {
          //If physics only, replace the loaded object with physics one
          physObj.quaternion.copy(obj.quaternion);
          physObj.__dirtyRotation = true;
          physObj.position.add(obj.position);
          physObj.__dirtyPosition = true;
          //physObj.scale.copy(obj.scale);
          replaceObj(obj, physObj);
        }
        else {
          obj.add(physObj); //Add Phys obj to the graphical object
        }
      }
    };

    const recurseProcess = (obj)=>{
      obj.children.slice().forEach((child)=>{
        //Depth first into child
        recurseProcess(child);
        _process(child);
      });
    };
    recurseProcess(rootObj);
  }
}