import * as THREE from "three";
import $ from "jquery";
import { BuildInfoWidget } from "./BuildInfoWidget";
import { SimObject, SimScene, PhysicsPart } from "./BaseObject";
import { ChemTable } from "./ChemTable";


const conversions = {
  eventToWindowPX : (ev)=>{
    return new THREE.Vector2(ev.clientX, ev.clientY);
  },
  windowPXToViewportPX : ($el, v2)=>{
    return v2.sub(new THREE.Vector2($el.offset().left, $el.offset().top));
  },
  viewportPXToviewportNDC : ($el, v2)=>{
    v2.multiply(new THREE.Vector2(1/$el.innerWidth(), 1/$el.innerHeight()));
    v2.multiplyScalar(2);
    v2.sub(new THREE.Vector2(1,1));
    v2.multiply(new THREE.Vector2(1,-1));
    return v2;
  }
};


const playerFOV = 75;
const inputBinds = {
  up: 87, //W
  down: 83, //S
  left: 65, //A
  right: 68, //D
  jump: 32, //space
  look: "mouse"
};
const inputKeyCodes = ()=>Object.keys(inputBinds)
    .map((k)=>inputBinds[k])
    .filter((i)=>typeof i === "number");
const inputVals = {};
const getInput = (bindName)=>inputVals[inputBinds[bindName]];
const _setInput = (id, val)=>inputVals[id] = val;
$(window).on("keydown", function(e){
  if(inputKeyCodes().indexOf(e.keyCode) !== -1) {
    _setInput(e.keyCode, true);
  }
});
$(window).on("keyup", function(e){
  if(inputKeyCodes().indexOf(e.keyCode) !== -1) {
    _setInput(e.keyCode, false);
  }
});
$(window).on("mousemove", function(e){
  //TODO: This should work, but I realized I didn't need it rn
  //let pos = conversions.eventToWindowPX(e);
  //TODO: Use the renderer, not window/body
  //(honestly this should all be in it's own class)
  //pos = conversions.viewportPXToviewportNDC($("body"), pos);
  //_setInput("mouse", pos);
});

class ChemPlayer extends SimObject(THREE.Mesh, PhysicsPart) {
  constructor() {
    let g = new THREE.CylinderBufferGeometry(0.7,1,1,10);
    let m = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    super(g, m);
    this.scale.set(1,1.7,1);
    let c = this._camera = new THREE.PerspectiveCamera(playerFOV, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.add(c);
    c.position.set(0,3,-5);
    c.lookAt(this.position);
  }

  onTick() {
    //Fix the rotation of the player (TODO:honestly this should be a physics
    //engine constraint but Oimo doesnt support that out of the box)
    this.quaternion.copy(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0,0,1), 0));
    this.angularVelocity = new THREE.Vector3(0,0,0);
    this.dirty(false, true, false, true); //Propogate to the physics engine

    //Calculate player movement
    let mov = new THREE.Vector3(0,0,0);
    if(getInput("up")) {
      mov.add(new THREE.Vector3(0,0,1));
    }
    if(getInput("down")) {
      mov.add(new THREE.Vector3(0,0,-1));
    }
    if(getInput("left")) {
      mov.add(new THREE.Vector3(1,0,0));
    }
    if(getInput("right")) {
      mov.add(new THREE.Vector3(-1,0,0));
    }
    mov.normalize();

    if(getInput("jump")) {
      mov.add(new THREE.Vector3(0,3,0));
    }
    if(mov.lengthSq() < 0.01) {
      return;
    }

    console.log(mov);
    this.impulse(mov);
  }

  get camera() {
    return this._camera;
  }

  getPhysicsParams() {
    return Object.assign(super.getPhysicsParams(), {
      type:"box",
      move: true
    });
  }
}

class ChemLevel extends SimObject(THREE.Mesh, PhysicsPart) {
  constructor(spawnPos) {
    let g = new THREE.BoxBufferGeometry(1,1,1);
    let m = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    super(g,m);
    this.scale.set(100,20,100);
  }

  getPhysicsParams() {
    return Object.assign(super.getPhysicsParams(), {
      type:"box",
      move: false
    });
  }
}

const s = new SimScene();
s._phys.onLoad().then(()=>{
  let grabbedItem;
  $(()=>{
    let bi = new BuildInfoWidget();
    $("body").append(bi.$());

    let r = new THREE.WebGLRenderer({
      canvas: $("#game")[0]
    });
    r.setSize( window.innerWidth, window.innerHeight );
    
    let floor = new ChemLevel();
    floor.position.copy(new THREE.Vector3(0,-10,0));
    s.add(floor);

    let player = new ChemPlayer();
    player.position.copy(new THREE.Vector3(0,0.5,0));
    s.add(player);

    // ambient light
    let am_light = new THREE.AmbientLight( 0x444444 );
    s.add( am_light );
    // directional light
    let dir_light = new THREE.DirectionalLight( 0xFFFFFF );
    dir_light.position.set( 20, 30, -5 );
    dir_light.target.position.copy( s._three.position );
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
    s.add( dir_light );

    let light = new THREE.PointLight( 0xffffdd, 4, 100 );
    light.position.set(0,2,0);
    s.add(light);

    let table1 = new ChemTable(new THREE.Vector3(0,0.5,-2));
    s.add(table1);

    let table2 = new ChemTable(new THREE.Vector3(0,0.5,-10));
    s.add(table2);
    
    let l = ()=>{
      r.render(s._three, player.camera);
      requestAnimationFrame(l);
    };
    requestAnimationFrame(l);
    window.s = s;
    
    let lastMP = undefined;
    $(r.domElement).on("mousedown", (e)=>{
      let $canvas = $(e.target);
      let mp = conversions.viewportPXToviewportNDC($canvas, 
        conversions.windowPXToViewportPX($canvas, 
        conversions.eventToWindowPX(e)));

      let rc = new THREE.Raycaster();
      rc.setFromCamera(mp, player.camera);
      let hit = rc.intersectObjects(s._three.children);
      hit.forEach((h)=>{
        if(typeof h.object.onRaycast === "function") {
          h.object.onRaycast(h, s);
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
      let r = rc.ray; //Get internal .origin and .direction
      let rc2 = new THREE.Raycaster();
      rc2.setFromCamera(lastMP, player.camera);
      let r2 = rc2.ray;

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
    $(r.domElement).on("mouseup", (e)=>{
      if(!grabbedItem) {
        return;
      }
      grabbedItem.material.color.set(new THREE.Color(1,0,0));
      lastMP = undefined;
      grabbedItem = undefined;
    });

    s._phys.play();
  });
});