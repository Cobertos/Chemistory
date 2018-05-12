import * as THREE from "three";
import $ from "jquery";
import { SimScene } from "./BaseObject";
import { ChemTable } from "./ChemTable";
import { ChemLevel } from "./ChemLevel";
import { ChemPlayer } from "./ChemPlayer";
import { conversions } from "./utils";

export class MainScene extends SimScene {
  constructor(r){
    super();
    let floor = new ChemLevel();
    floor.position.copy(new THREE.Vector3(0,-10,0));
    this.add(floor);

    let player = this.player = new ChemPlayer();
    player.position.copy(new THREE.Vector3(0,0.5,0));
    this.add(player);

    // ambient light
    let am_light = new THREE.AmbientLight( 0x444444 );
    this.add( am_light );
    // directional light
    let dir_light = new THREE.DirectionalLight( 0xFFFFFF );
    dir_light.position.set( 20, 30, -5 );
    dir_light.target.position.set(0,0,0);
    dir_light.castShadow = true;
    dir_light.shadowCameraLeft = -30;
    dir_light.shadowCameraTop = -30;
    dir_light.shadowCameraRight = 30;
    dir_light.shadowCameraBottom = 30;
    dir_light.shadowCameraNear = 20;
    dir_light.shadowCameraFar = 200;
    dir_light.shadowBias = -.001
    dir_light.shadowMapWidth = dir_light.shadowMapHeight = 2048;
    dir_light.shadowDarkness = .5;
    this.add( dir_light );

    let light = new THREE.PointLight( 0xffffdd, 4, 100 );
    light.position.set(0,2,0);
    this.add(light);

    let table1 = new ChemTable(new THREE.Vector3(0,0.5,-2));
    this.add(table1);

    let table2 = new ChemTable(new THREE.Vector3(0,0.5,-10));
    this.add(table2);

    let grabbedItem;
    let lastMP = undefined;
    $(r.domElement).on("mousedown", (e)=>{
      let $canvas = $(e.target);
      let mp = conversions.viewportPXToviewportNDC($canvas, 
        conversions.windowPXToViewportPX($canvas, 
        conversions.eventToWindowPX(e)));

      let rc = new THREE.Raycaster();
      rc.setFromCamera(mp, player.camera);
      let hit = rc.intersectObjects(this._three.children);
      hit.forEach((h)=>{
        if(typeof h.object.onRaycast === "function") {
          h.object.onRaycast(h, this);
        }
      });
      lastMP = mp;
    });
    $(r.domElement).on("mousemove", (e)=>{
      if(!grabbedItem) {
        return;
      }

      let $canvas = $(e.target);
      let mp = conversions.viewportPXToviewportNDC($canvas, 
        conversions.windowPXToViewportPX($canvas, 
        conversions.eventToWindowPX(e)));

      //Get drag coordinate system
      let cy = THREE.Object3D.DefaultUp.clone(); //Maybe make camera up?
      let cz = player.camera.getWorldDirection(new THREE.Vector3(0,0,0));
      let cx = cz.clone().cross(cy).normalize();

      //Find the distance of drag in each direction
      let rc = new THREE.Raycaster();
      rc.setFromCamera(mp, player.camera);
      //let r = rc.ray; //Get internal .origin and .direction
      let rc2 = new THREE.Raycaster();
      rc2.setFromCamera(lastMP, player.camera);
      //let r2 = rc2.ray;

      let mouseDelta = mp.clone().sub(lastMP);
      let dist = grabbedItem.position.clone()
        .sub(player.camera.position);
      let projDist = dist.clone().projectOnVector(cz);
      let fov = player.camera.fov * Math.PI/180;
      let fov_2 = fov/2;
      let yViewportWidthAtDist = Math.tan(fov_2) * projDist.length() * 2;
      let xViewportWidthAtDist = (player.camera.aspect) * yViewportWidthAtDist;
      //NDC to scaled NDC
      mouseDelta.multiply(new THREE.Vector2(xViewportWidthAtDist/2,yViewportWidthAtDist/2));
      let itemDelta = cx.clone().multiplyScalar(mouseDelta.x)
        .add(cy.clone().multiplyScalar(mouseDelta.y));

      grabbedItem.position.add(itemDelta);
      grabbedItem.dirty();
      lastMP = mp.clone();
    });
    $(r.domElement).on("mouseup", ()=>{
      if(!grabbedItem) {
        return;
      }
      grabbedItem.material.color.set(new THREE.Color(1,0,0));
      lastMP = undefined;
      grabbedItem = undefined;
    });
  }

  get camera(){
    return this.player.camera;
  }

  render(renderer){
    renderer.render(this._three, this.camera);
  }
}