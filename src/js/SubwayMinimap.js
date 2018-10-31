import * as THREE from "three";
import { SimObject, DebugPart } from "./engine";

/**Common functionality between the 2D and 3D subway minimaps.
 * By default it will mirror the XZ axis of all tracked objects to
 * it's own internal XZ axis, which can then be positioned as desired
 */
export class SubwayMinimapCommon extends SimObject(THREE.Group, DebugPart) {

  constructor(player, minimap) {
    super();
    this._player = player;
    //Seems like most objects require this transform...
    this._root = new THREE.Group()
    this.add(this._root);

    //Define parameters of the minimap
    this.mmPosition = new THREE.Vector3(0,0,0);
    this.mmSize = new THREE.Vector3(20,0,20); //Size in world units

    //Create the map
    this._minimap = minimap.clone();
    this._root.add(this._minimap);

    //Create the player indicator
    let geo = new THREE.CircleBufferGeometry(0.5,16);
    let mat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      //depthWrite: false
    });
    this._playerCircle = new THREE.Mesh(geo, mat);
    this._playerCircle.applyMatrix(
      new THREE.Matrix4().makeRotationFromQuaternion(
        new THREE.Quaternion().setFromAxisAngle(
          //Rotate by 90 in the X
          new THREE.Vector3(1,0,0), Math.PI/2)));
    this._playerCircle.onBeforeRender = this.onTick.bind(this);
    this._root.add(this._playerCircle);

    this.quaternion.setFromAxisAngle(
          //Rotate by -90 in the X
          new THREE.Vector3(1,0,0), -Math.PI/2);
  }

  get viewport() {
    return new THREE.Box3(
      this.mmPosition.clone()
        .sub(this.size.clone().multiplyScalar(0.5)),
      this.mmPosition.clone()
        .add(this.size.clone().multiplyScalar(0.5))
    );
  }

  onTick() {
    //Update to new viewport
    let newPos = this.mmPosition.clone().negate();
    this._minimap.position.copy(newPos);

    //Update the indicators to trackable positions
    [{
      object : this._player,
      indicator : this._playerCircle
    }].forEach((spec)=>{
      spec.indicator.position.copy(
        spec.object.position.clone()
          .sub(this.position)
          .setY(0));
    });
  }

  onDebug() {
    //Add something to visualize the center
    this.add(new THREE.Mesh(
      new THREE.BoxBufferGeometry(1,1,1),
      new THREE.MeshBasicMaterial({ color: 0x00FF00 })));
  }
}

export class SubwayMinimap2D extends SubwayMinimapCommon {

}

export class SubwayMinimap3D extends SubwayMinimapCommon {

}