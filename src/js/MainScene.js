import * as THREE from "three";
import $ from "jquery";
import { SimScene } from "./engine";
import { ChemistoryLoader } from "./ChemistoryLoader";
import { ChemPlayer } from "./ChemPlayer";
import { SubwayMinimapCommon, SubwayMinimap3D, SubwayMinimap2D } from "./SubwayMinimap";
import { conversions } from "./utils";
const playerFOV = 75;

export class MainScene extends SimScene {
  constructor(url, r){
    super(url);

    /// #if BROWSER
      const aspect = window.innerWidth / window.innerHeight;
    /// #else
      const aspect = 16/9;
    /// #endif
    let cam = new THREE.PerspectiveCamera(playerFOV, aspect, 0.1, 1000);
    let player = this.player = new ChemPlayer(cam);
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

    //Level
    let levelLoader = new ChemistoryLoader();
    let uri;
    /// #if BROWSER
      uri = "res/chemistory-level-2";
    /// #else
      uri = "./dist/res/chemistory-level-2";
    /// #endif

    levelLoader.load(uri)
      .then((lvl)=>{
        this.add(lvl);
        //Choose a spawn for the player, dirty it to get it to teleport
        player.position.copy(levelLoader.spawns[0]);
        player.dirty(true, false, false, false);

        //Handle the Minimap
        let mmGroup = new THREE.Group();
        let m3Box = new THREE.Box3().setFromPoints(Array.apply(null, {length: 2})
          .map((_,idx)=>"SUBWAY"+(idx+1)) //Generates SUBWAY1-SUBWAY2
          .map((key)=>levelLoader.idMap[key])
          .reduce((item,acc)=>acc.concat(item), [])
          .map((obj)=>{
            //Add to mmGroup (why did I do it in this huge chain? cause Im dumb)
            mmGroup.add(obj);
            return obj;
          })
          .map((obj)=>obj.position));
        let mm3D = new SubwayMinimap3D(player, mmGroup);
        levelLoader.idMap["3DMM"][0].geometry.computeBoundingBox();
        mm3D.position.copy(levelLoader.idMap["3DMM"][0].geometry.boundingBox.getCenter(new THREE.Vector3())
          .add(new THREE.Vector3(0, m3Box.getSize(new THREE.Vector3()).z/2*0.02 + 1, 0)));
        console.log(mm3D.position);
        mm3D.scale.set(0.04,0.04,0.04);
        this.add(mm3D);
        let mm2D = new SubwayMinimap2D(player, mmGroup);
        mmGroup.children.forEach((obj)=>{
          obj.parent.remove(obj);
        });
        mm2D.scale.set(0.03,0.03,0.03);
        mm2D.position.set(1,4,-4);
        player.add(mm2D);
      })
      .catch((err)=>{
        console.error(err);
      });
  }

  get camera(){
    return this.player.camera;
  }

  render(renderer){
    renderer.render(this, this.camera);
  }
}