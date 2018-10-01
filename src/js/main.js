import * as THREE from "three";
import Stats from "stats.js";
import $ from "jquery";
import moment from "moment";
import { BuildInfoWidget } from "./BuildInfoWidget";
import { ConnectionWidget } from "./ConnectionWidget";
import { MainScene } from "./MainScene";
import buildInfo from "./buildInfo.json";
const inNode = typeof window === "undefined";
const isServer = inNode;

const getStats = (s=new Stats())=>{
  $(s.dom).css({
    "position": "static",
    "display": "inline-block"
  });
  return s;
}

//Connection utilities for client
if(!isServer) {
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
    conn.addListener("connectTo", ()=>{
      startBrowserClient(bi, conn.url);
    });
  });
}
else {
  console.log(`== CHEMISTORY SERVER ==
${buildInfo.branch} - ${buildInfo.commit}
Built ${moment(buildInfo.time).fromNow()}
      
New in this version:
${buildInfo.changelog}
`);
  startNodeServer();
}

function startNodeServer() {
  //Create the server scene
  const s = new MainScene();
  s._phys.onLoad().then(()=>{
    console.log("Loaded Physcis");
    s._net.onLoad().then(()=>{
      console.log("Loaded Networking");

      console.log("Starting Physics Simulation");
      s._phys.play();
    });
  });
}

function startBrowserClient(bi, connectToUrl) {
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
  const s = window.s = new MainScene(connectToUrl, r);
  s._phys.onLoad().then(()=>{
    s._net.onLoad().then(()=>{
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
}