import * as THREE from "three";
import $ from "jquery";

import "./physi.js";
import { LevelLoader } from "./levelLoader";
import { PlayerCamera } from "./playerCamera";



Physijs.scripts.worker = 'js/physi_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var initScene, initEventHandling, render, ball, pcCreator, player, playerCamera, playerCameraControls,
	renderer, render_stats, physics_stats, scene, dir_light, am_light, camera, updatePhysics, keysDown = {};

initScene = function() {
	let canvas = $("#game")[0];
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias:true
  });
  renderer.setSize(800,600);
  renderer.setClearColor( new THREE.Color(0xFFFF00), 1);
	scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });
	scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
	scene.addEventListener(
		'update',
		function() {
			updatePhysics();
			scene.simulate( undefined, 1 );
		}
	);

		// scene.add( camera );

	// ambient light
	am_light = new THREE.AmbientLight( 0x444444 );
	scene.add( am_light );
	// directional light
	dir_light = new THREE.DirectionalLight( 0xFFFFFF );
	dir_light.position.set( 20, 30, -5 );
	dir_light.target.position.copy( scene.position );
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
	scene.add( dir_light );

	let loader = new THREE.TextureLoader();
	// Materials
	let table_material = Physijs.createMaterial(
		new THREE.MeshStandardMaterial({ map: loader.load("images/table.png")}),
		.9, // high friction
		.2 // low restitution
	);
	table_material.map.wrapS = table_material.map.wrapT = THREE.RepeatWrapping;
	table_material.map.repeat.set( 5, 5 );

	let ball_material = Physijs.createMaterial(
		new THREE.MeshStandardMaterial({ map: loader.load("images/ball.png")}),
		.4, // medium friction
		.4 // medium restitution
	);

	// Table
	let table = new Physijs.BoxMesh(
		new THREE.BoxGeometry(50, 1, 50),
		table_material,
		0);
	table.position.y = -.5;
	table.receiveShadow = true;
	//scene.add( table );

	// ball = new Physijs.SphereMesh(
	// 	new THREE.SphereGeometry(1,32,32),
	// 	ball_material,
	// 	undefined);
	// ball.position.y = 5;
	// ball.receiveShadow = true;
	// scene.add(ball);

	pcCreator = new PlayerCamera();
	player = pcCreator.newPlayer(
		new Physijs.SphereMesh(
		new THREE.SphereGeometry(1,32,32),
		ball_material,
		undefined)
	);
	player.position.y = 5;
	scene.add(player)

	playerCamera = pcCreator.newPlayerCamera();
	console.log('was?', 'potato', typeof playerCamera);
	scene.add(playerCamera);

	playerCameraControls = pcCreator.newPlayerCameraControls();
	// scene.add(playerCameraControls);

	let ll = new LevelLoader();
	ll.load("res/level-1").then((obj)=>{
		obj.children.slice().forEach((child)=>{ //Make sure to slice as add() will remove from parent
			scene.add(child);
		});
	}).then(()=>{
		requestAnimationFrame( render );
		scene.simulate();
	});
};

render = function() {
	requestAnimationFrame( render );
	playerCameraControls.update();
	renderer.render( scene, playerCamera );
};

updatePhysics = function() {
	let force = getCurrentKeyForce().multiplyScalar(480);
	player.applyForce(force, new THREE.Vector3(0,1,0));
}

$(()=>{
  initScene();
});

function getCurrentKeyForce() {
	let force = new THREE.Vector3(0,0,0);
	if(keysDown[87]) { //w key
		force.z += 1;
	}
	if(keysDown[83]) { //s key
		force.z -= 1;
	}
	if(keysDown[65]) { //a key
		force.x -= 1;
	}
	if(keysDown[68]) { //d key
		force.x += 1;
	}
	force.normalize();
	return force;
}

$(window).on("keydown", (e)=>{
	keysDown[e.which] = true;
});
$(window).on("keyup", (e)=>{
	keysDown[e.which] = false;
});
