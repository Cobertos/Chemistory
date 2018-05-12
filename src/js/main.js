import * as THREE from "three";
import $ from "jquery";
import { BuildInfoWidget } from "./BuildInfoWidget";
import { MainScene } from "./MainScene";

$(()=>{
  let bi = new BuildInfoWidget();
  $("body").append(bi.$());

  let r = new THREE.WebGLRenderer({
    canvas: $("#game")[0]
  });
  r.setSize( window.innerWidth, window.innerHeight );

  //Create the scene, on load, then begin rending
  const s = window.s = new MainScene(r);
  s._phys.onLoad().then(()=>{
    s._phys.play();

    let l = ()=>{
      s.render(r);
      requestAnimationFrame(l);
    };
    requestAnimationFrame(l);
  });
});