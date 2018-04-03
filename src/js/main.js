import * as THREE from "three";
import $ from "jquery";
import { addPhysicsObject, setPhysicsObject, delPhysicsObject } from "./OIMOManager";
import { BuildInfoWidget } from "./BuildInfoWidget";

class ChemTable {
  constructor(spawnPos) {
    const _fallTime = 1000;
    const _endTime = Date.now() + _fallTime;
    let _startPos = spawnPos.clone().add(new THREE.Vector3(0,5,0));
    let _endPos = spawnPos.clone();
    
    let g = new THREE.BoxBufferGeometry(1,1,1);
    let m = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    let o = new THREE.Mesh(g, m);
    o.scale.set(3.5,1.7,2);
    
    o.onBeforeRender = ()=>{
      if(Date.now() > _endTime) {
        o.position.copy(_endPos);
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
    console.log(o);
    
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

$(()=>{
  let bi = new BuildInfoWidget();
  $("body").append(bi.$());

  let r = new THREE.WebGLRenderer({
    canvas: $("#game")[0]
  });
  let s = new THREE.Scene();
  let c = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  r.setSize( window.innerWidth, window.innerHeight );
  let light = new THREE.PointLight( 0xffffdd, 1, 100 );
  light.position.set(0,2,0);
  s.add(light);
  s.add(ChemTable.spawn(s, new THREE.Vector3(0,-2,-2)));
  s.add(ChemTable.spawn(s, new THREE.Vector3(0,-2,-10)));
  
  let l = ()=>{
    r.render(s, c);
    requestAnimationFrame(l);
  };
  requestAnimationFrame(l);
  window.s = s;
  
  $(r.domElement).on("click", (e)=>{
    let mp = new THREE.Vector2(e.clientX, e.clientY);
    mp.sub(new THREE.Vector2($(e.target).offset().left, $(e.target).offset().top));
    mp.multiply(new THREE.Vector2(1/$(e.target).innerWidth(), 1/$(e.target).innerHeight()));
    mp.multiplyScalar(2);
    mp.sub(new THREE.Vector2(1,1));
    mp.multiply(new THREE.Vector2(1,-1));
    console.log(mp);
    
    let rc = new THREE.Raycaster();
    rc.setFromCamera(mp, c);
    let hit = rc.intersectObjects(s.children);
    hit.forEach((h)=>{
      if(typeof h.object.onRaycast === "function") {
        h.object.onRaycast(h, s);
      }
    });
  });
});