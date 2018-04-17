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
const keybinds = {
  up: 87, //W
  down: 83, //S
  left: 65, //A
  right: 68 //D
};
const keys = {};
const getKey = (key)=>!!keys[keybinds[key]];
const _setKey = (keyCode, val)=>keys[keyCode] = val;
$(window).on("keydown", function(e){
  let keyCodes = Object.keys(keybinds).map((k)=>keybinds[k]);
  if(keyCodes.indexOf(e.keyCode) !== -1) {
    _setKey(e.keyCode, 1);
  }
});
$(window).on("keyup", function(e){
  let keyCodes = Object.keys(keybinds).map((k)=>keybinds[k]);
  if(keyCodes.indexOf(e.keyCode) !== -1) {
    _setKey(e.keyCode, 0);
  }
});

class ChemPlayer extends SimObject(THREE.Mesh, PhysicsPart) {
  constructor(spawnPos) {
    let g = new THREE.CylinderBufferGeometry(1,1.7,1,10);
    let m = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    super(g, m);
    this.position.copy(spawnPos);
    let c = this._camera = new THREE.PerspectiveCamera(playerFOV, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.add(c);
    c.position.set(0,5,-5);
    c.lookAt(this.position);
  }

  onTick() {
    let mov = new THREE.Vector3(0,0,0);
    if(getKey("up")) {
      mov.add(new THREE.Vector3(0,0,1));
    }
    if(getKey("down")) {
      mov.add(new THREE.Vector3(0,0,-1));
    }
    if(getKey("left")) {
      mov.add(new THREE.Vector3(1,0,1));
    }
    if(getKey("right")) {
      mov.add(new THREE.Vector3(-1,0,1));
    }
    if(mov.lengthSq() < 0.01) {
      return;
    }

    mov.normalize();
    mov.multiplyScalar(0.25);
    this.position.add(mov);
    this.dirty();
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

class ChemLevel extends SimObject(THREE.Scene, PhysicsPart) {
  constructor(spawnPos) {
    let g = new THREE.BoxBufferGeometry(100,1,100);
    let m = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    super(g, m);
    this.position.copy(spawnPos);
  }

  getPhysicsParams() {
    return Object.assign(super.getPhysicsParams(), {
      type:"box",
      move: false
    });
  }
}

let grabbedItem;
$(()=>{
  let bi = new BuildInfoWidget();
  $("body").append(bi.$());

  let r = new THREE.WebGLRenderer({
    canvas: $("#game")[0]
  });
  r.setSize( window.innerWidth, window.innerHeight );
  let s = new SimScene();
  let floor = new ChemLevel(new THREE.Vector3(0,-0.5,0));
  s.add(floor);

  let player = new ChemPlayer(new THREE.Vector3(0,0.5,0));
  s.add(player);

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
});