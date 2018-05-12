import * as THREE from "three";
import Stats from "stats.js";
import $ from "jquery";
import { BuildInfoWidget } from "./BuildInfoWidget";
import { MainScene } from "./MainScene";

const getStats = (s=new Stats())=>{
  $(s.dom).css({
    "position": "static",
    "display": "inline-block"
  });
  return s;
}

$(()=>{
  let bi = new BuildInfoWidget();
  $("body").append(bi.$());

  let stats = getStats();
  bi.$body().append(stats.dom);

  let stats2 = getStats();
  let physPanel = stats2.addPanel(new Stats.Panel('OimoFPS', '#80f', '#102'));
  stats2.showPanel(3);
  bi.$body().append(stats2.dom);

  let r = new THREE.WebGLRenderer({
    canvas: $("#game")[0]
  });
  r.setSize( window.innerWidth, window.innerHeight );

  //Create the scene, on load, then begin rending
  const s = window.s = new MainScene(r);
  s._phys.onLoad().then(()=>{
    s._phys.play();

    let l = ()=>{
      stats.begin();
      s.render(r);
      stats.end();
      physPanel.update(s._phys.fps, 100);
      requestAnimationFrame(l);
    };
    requestAnimationFrame(l);
  });
});