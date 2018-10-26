import * as THREE from "three";
import Stats from "stats.js";
import $ from "jquery";
import moment from "moment";

import "./interop/promiseWrappers";

import { BuildInfoWidget } from "./BuildInfoWidget";
import { ConnectionWidget } from "./ConnectionWidget";
import { MainScene } from "./MainScene";
import buildInfo from "./buildInfo.json";

console.log(`== CHEMISTORY ==
${buildInfo.branch} - ${buildInfo.commit}
Built ${moment(buildInfo.time).fromNow()}
      
New in this version:
${buildInfo.changelog}
`);

/// #if BROWSER
console.log("== CLIENT ==");
console.log("You can access the scene on window.s");
const getStats = (s=new Stats())=>{
  $(s.dom).css({
    "position": "static",
    "display": "inline-block"
  });
  return s;
}

$(()=>{
  //Build Information
  let bi = new BuildInfoWidget();
  $("body").append(bi.$());

  let conn = new ConnectionWidget();
  document.body.appendChild(conn.dom);

  conn.addListener("startServer", ()=>{
    console.error("UNIMPLEMENTED IN BROWSER, CANT BE DONE WITHOUT RAW SOCKETS");
    //startGame();
  });
  conn.addListener("connectTo", async()=>{
    const stats = getStats();
    bi.$body().append(stats.dom);

    const stats2 = getStats();
    const physPanel = stats2.addPanel(new Stats.Panel('OimoFPS', '#80f', '#102'));
    stats2.showPanel(3);
    bi.$body().append(stats2.dom);

    const r = new THREE.WebGLRenderer({
      canvas: $("#game")[0]
    });
    r.setSize( window.innerWidth, window.innerHeight );

    //Create the scene, on load, then begin rending
    const s = window.s = new MainScene(conn.url, r);
    await s._phys.onLoad();
    await s._net.onLoad();
    s._phys.play();

    const l = ()=>{
      stats.begin();
      s.render(r);
      stats.end();
      physPanel.update(s._phys.fps, 100);
      requestAnimationFrame(l);
    };
    requestAnimationFrame(l);
  });
});
/// #else
(async ()=>{
  console.log("== SERVER ==");
  const s = new MainScene();
  await s._phys.onLoad();
  console.log("Loaded Physics");
  await s._net.onLoad();
  console.log("Loaded Networking");

  console.log("Starting Physics Simulation");
  s._phys.play();
})();
/// #endif