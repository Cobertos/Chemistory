import * as THREE from "three";
import $ from "jquery";
import { addPhysicsObject, setPhysicsObject, delPhysicsObject } from "./OIMOManager";
import { BuildInfoWidget } from "./BuildInfoWidget";

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

let grabbedItem = undefined;

class ChemTable {
  constructor(spawnPos) {
    const _fallTime = 1000;
    const _endTime = Date.now() + _fallTime;
    let _startPos = spawnPos.clone().add(new THREE.Vector3(0,5,0));
    let _endPos = spawnPos.clone();
    
    let g = new THREE.BoxBufferGeometry(1,1,1);
    let m = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    let o = new THREE.Mesh(g, m);
    o.scale.set(3.5,1,2);
    
    o.onBeforeRender = ()=>{
      if(Date.now() > _endTime) {
        o.position.copy(_endPos);
        setPhysicsObject(o);
        return;
      }
      
      let deltaFrac = 1 - (_endTime - Date.now()) / _fallTime;
      let currPos = _startPos.clone()
                      .add(_endPos.clone()
                           .sub(_startPos)
                           .multiplyScalar(deltaFrac));
      o.position.copy(currPos);
      setPhysicsObject(o);
    };
    
    o.onRaycast = (hitInfo, scene)=>{
      let ci = ChemItem.spawn(scene, 
        _endPos.clone().add(new THREE.Vector3(0,2,0)),
        new THREE.Color(1,0,0));
    };
    
    return o;
  }
  
  static spawn(scene, spawnPos) {
    let t = new ChemTable(spawnPos);
    scene.add(t);
    addPhysicsObject(t, {
        type: "box",
        move: false
      });
    return t;
  }
}

class ChemItem {
  constructor(spawnPos, color) {
    let g = new THREE.CylinderBufferGeometry(1,1,1,10);
    let m = new THREE.MeshLambertMaterial({ color: color });
    let o = new THREE.Mesh(g, m);
    o.position.copy(spawnPos);
    o.scale.set(0.125,0.125,0.125);
    
    o.onRaycast = (hitInfo, scene)=>{
      grabbedItem = o;
      o.material.color.set(new THREE.Color(0,0.5,1));
    };
    
    return o;
  }
  
  static spawn(scene, spawnPos, color) {
    let i = new ChemItem(spawnPos, color);
    scene.add(i);
    addPhysicsObject(i, {
        type:"cylinder",
        move: true
      }); 
    return i;
  }
}

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

class ChemPlayer {
  constructor() {
    let g = new THREE.CylinderBufferGeometry(1,1.7,1,10);
    let m = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    let o = new THREE.Mesh(g, m);
    let c = this._camera = new THREE.PerspectiveCamera(playerFOV, window.innerWidth / window.innerHeight, 0.1, 1000);
    o.camera = c;
    o.add(c);
    c.position.set(0,5,-5);
    c.lookAt(o.position);

    o.onBeforeRender = ()=>{
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
      o.position.add(mov);
      setPhysicsObject(o);
    };

    return o;
  }

  get camera() {
    return this._camera;
  }

  static spawn(scene, spawnPos) {
    let p = new ChemPlayer();
    p.position.copy(spawnPos);
    scene.add(p);
    addPhysicsObject(p, {
      type:"box",
      move: true
    });
    return p;
  }
}

class ChemLevel {
  constructor() {
    let g = new THREE.BoxBufferGeometry(100,1,100);
    let m = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    let o = new THREE.Mesh(g, m);
    return o;
  }

  static spawn(scene, spawnPos) {
    let s = new ChemLevel();
    s.position.copy(spawnPos);
    scene.add(s);
    addPhysicsObject(s, {
      type:"box",
      move: false
    });
    return s;
  }
}

$(()=>{
  let bi = new BuildInfoWidget();
  $("body").append(bi.$());

  let r = new THREE.WebGLRenderer({
    canvas: $("#game")[0]
  });
  r.setSize( window.innerWidth, window.innerHeight );
  let s = new THREE.Scene();
  let floor = ChemLevel.spawn(s, new THREE.Vector3(0,-0.5,0));
  let player = ChemPlayer.spawn(s, new THREE.Vector3(0,10,0));
  let light = new THREE.PointLight( 0xffffdd, 4, 100 );
  light.position.set(0,2,0);
  s.add(light);
  ChemTable.spawn(s, new THREE.Vector3(0,0.5,-2));
  ChemTable.spawn(s, new THREE.Vector3(0,0.5,-10));
  
  let l = ()=>{
    r.render(s, player.camera);
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
    let hit = rc.intersectObjects(s.children);
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
    setPhysicsObject(grabbedItem);
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