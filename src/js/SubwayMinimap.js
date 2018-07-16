import * as THREE from "three";
import { SimObject } from "./BaseObject";

/**Common functionality between the 2D and 3D subway minimaps.
 * By default it will mirror the XZ axis of all tracked objects to
 * it's own internal XZ axis, which can then be positioned as desired
 */
export class SubwayMinimapCommon extends SimObject(THREE.Group) {
  static loadSVG(fileName="res/milano_subway_map.svg") {
    return new Promise((resolve, reject)=>{
      let svg = new THREE.SVGLoader();
      svg.load(fileName, (paths)=>{
        //Hack to "fix" inkscape SVG
        paths = paths.map((shapep)=>{
          let path;
          shapep.subPaths.forEach((subp)=>{
            if(!path) {
              path = new THREE.Path();
              path.moveTo(subp.currentPoint.x, subp.currentPoint.y);
              return; //contineu
            }
            else {
              path.lineTo(subp.currentPoint.x, subp.currentPoint.y);
            }
            subp.curves.forEach((c)=>{
              path.lineTo(c.v2.x, c.v2.y);
            });
          });
          shapep.currentPath = path;
          shapep.subPaths = [path];
          return shapep;
        });

        //ShapePaths => THREE.Group
        let group = new THREE.Group();
        group.scale.set(0.1,-0.1,0.1);
        paths.forEach((path)=>{
          let mat = new THREE.MeshBasicMaterial( {
            color: path.color,
            side: THREE.DoubleSide,
            depthWrite: false
          } );
          path.toShapes()
            .forEach((shape)=>{
              let geo = new THREE.ShapeBufferGeometry(shape);
              let mesh = new THREE.Mesh(geo, mat);
              group.add(mesh);
            });
        });
        resolve(group);
      }, undefined, reject);
    });
  }

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
    this._minimap.quaternion.setFromAxisAngle(
          //Rotate by 90 in the X
          new THREE.Vector3(1,0,0), Math.PI/2);
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
}

export class SubwayMinimap2D extends SubwayMinimapCommon {

}

export class SubwayMinimap3D extends SubwayMinimapCommon {

}