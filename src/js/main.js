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
    o.scale.set(3.5,1.7,2);
    
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
  
  let lastMP = undefined;
  $(r.domElement).on("mousedown", (e)=>{
    let $canvas = $(e.target);
    let mp = conversions.viewportPXToviewportNDC($canvas, 
      conversions.windowPXToViewportPX($canvas, 
      conversions.eventToWindowPX(e)));

    let rc = new THREE.Raycaster();
    rc.setFromCamera(mp, c);
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
    let cz = c.getWorldDirection(new THREE.Vector3(0,0,0));
    let cx = cz.clone().cross(cy).normalize();

    //Find the distance of drag in each direction
    let rc = new THREE.Raycaster();
    rc.setFromCamera(mp, c);
    let r = rc.ray; //Get internal .origin and .direction
    let rc2 = new THREE.Raycaster();
    rc2.setFromCamera(lastMP, c);
    let r2 = rc2.ray;

    let mouseDelta = mp.clone().sub(lastMP);
    let dist = grabbedItem.position.clone()
      .sub(c.position);
    let projDist = dist.clone().projectOnVector(cz);
    let fov = c.fov * Math.PI/180;
    let fov_2 = fov/2;
    let yViewportWidthAtDist = Math.tan(fov_2) * projDist.length() * 2;
    let xViewportWidthAtDist = (c.aspect) * yViewportWidthAtDist;
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