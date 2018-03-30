import * as THREE from "three";
import RSVP from "rsvp";
const {Promise} = RSVP;
import "three-examples/controls/OrbitControls.js";
import {BaseObject} from "./BaseObject.js";
import "./physi.js";

var player;
var camera;
var cameraControls;
export class PlayerCamera extends BaseObject {

  constructor() {
    super();
  }

  onUpdate() {
    console.log('bork bork bork');
    cameraControls.target = ball.position;
    cameraControls.update();
  }

  newPlayer (playerPhysicsObject) {
    player = playerPhysicsObject;
    return playerPhysicsObject;
  }

  newPlayerCamera() {
    camera = new THREE.PerspectiveCamera(75, 800/600, 0.001, 1000);
    console.log('wat2', camera);
    camera.position.set( 25, 20, 25 );
  	// camera.lookAt(new THREE.Vector3( 0, 7, 0 ));

    //
    return camera;
  }

  newPlayerCameraControls() {
    cameraControls = new THREE.OrbitControls( camera );
    cameraControls.keyPanSpeed = 100;
    cameraControls.maxDistance = 40;
    cameraControls.target = player.position;
    cameraControls.update();
    console.log("bork")
    return cameraControls;
  }

}
