import * as THREE from "three";
import $ from "jquery";
import { SimScene } from "./BaseObject";
import { ChemTable } from "./ChemTable";
import { ChemPlayer } from "./ChemPlayer";
import { SubwayMinimapCommon, SubwayMinimap3D, SubwayMinimap2D } from "./SubwayMinimap";
import "three-examples/loaders/SVGLoader.js"; //Loads to THREE.SVGLoader
import { conversions } from "./utils";
import { SimObjectLoader } from "./BaseObjectLoader.js";

export class MainScene extends SimScene {
  constructor(r){
    super();

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

    //SVG
    SubwayMinimapCommon.loadSVG()
      .then((svgGroup)=>{
        let mm3D = new SubwayMinimap3D(player, svgGroup);
        this.add(mm3D);
        let mm2D = new SubwayMinimap2D(player, svgGroup);
        mm2D.scale.set(0.03,0.03,0.03);
        mm2D.position.set(1,4,-4);
        player.add(mm2D);
      });

    //Level
    let levelLoader = new SimObjectLoader();
    levelLoader.load("res/chemistory-level")
      .then((lvl)=>{
        console.log(lvl);
        //Must add manually because physics won't register unless
        //added directly to the scene
        lvl.children.slice().forEach((o)=>{
          this.add(o);
        });
        let spawns = levelLoader._idMap["SPAWN"];
        console.log(spawns[0].getWorldPosition(new THREE.Vector3()));
        spawns[0].geometry.computeBoundingBox();
        let bbc = spawns[0].geometry.boundingBox.getCenter(new THREE.Vector3());
        console.log(bbc);
        player.position.copy(bbc);
        console.log(player.position);
        player.dirty(true, false, false, false);
        console.log(player.getPhysicsParams());
        spawns.forEach((o)=>{
          o.parent.remove(o);
        });
      })
      .catch((err)=>{
        console.error(err);
      });


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