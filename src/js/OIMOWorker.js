import * as THREE from "three";
import { World } from "oimo";

//Feature TODO:
//* Get velocities
//* Listen for contacts
//* Switching modes between static, dynamic, kinematic, etc?
//* Making set actually work for dynamic

const maxBodies = 1024;
const dt = 1/30;
const world = new World({
    timestep: dt,
    iterations: 8,
    broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
    worldscale: 1, // scale full world 
    random: true,  // randomize sample
    info: false,   // calculate statistic or not
});
const bodies = {}; //Holds all the Physics bodies tied to their THREEjs UUID
const bodyData = new Float32Array( maxBodies * 8 );

let fps = 0;
let fTime = [0,0,0];

let simulating = false;

let passVec3 = new THREE.Vector3(0,0,0);
let passVec3_2 = new THREE.Vector3(0,0,0);
let passQuat = new THREE.Quaternion(0,0,0,1);

self.onmessage = function(e) {
    if(e.data.command === "add") {
        //world.add({size:[200, 20, 200], pos:[0,-10,0]}); //Ground plan
        //world.add({type:'sphere', size:[0.25], pos:[x,(0.5*i)+0.5,z], move:true});
        //world.add({type:'box', size:[0.5,0.5,0.5], pos:[x,((0.5*i)+0.5),z], move:true});
        bodies[e.data.id] = world.add(e.data.data);
    }
    else if(e.data.command === "set") {
        let b = bodies[e.data.id];
        if(b.isStatic) {
            throw new Error("Use o.move=true and o.isKinematic=true for static movables!");
        }

        //Set position and optionally quaternion
        b.setPosition(passVec3.fromArray(e.data.pos));
        if(e.data.rot) {
            b.setQuaternion(passQuat.fromArray(e.data.rot));
        }
    }
    else if(e.data.command === "del") {
        bodies[e.data.id].remove();
        delete bodies[e.data.id];
    }
    else if(e.data.command === "impulse") {
        bodies[e.data.id].applyImpulse(
            passVec3.fromArray(e.data.pos),
            passVec3_2.fromArray(e.data.force));
    }
    else if(e.data.command === "loadbeat") {
        self.postMessage({ loadbeat: true });
    }

    if(!simulating) {
        setInterval( step, dt*1000 );
        simulating = true;
    }
};
function step() {
    // Step the world
    world.step();

    //Copy all new body data into buffer
    Object.keys(bodies).forEach((key, i)=>{
        let b = bodies[key];
        let offset = i * 8;
        bodyData[offset] = +(!!b.sleeping || b.isStatic);
        if(!bodyData[offset]) {
            b.getPosition().toArray( bodyData, offset + 1 );
            b.getQuaternion().toArray( bodyData, offset + 4 );
        }
    });

    //Calculate FPS
    fTime[1] = Date.now();
    if (fTime[1]-1000 > fTime[0]){
        fTime[0] = fTime[1];
        fps = fTime[2];
        fTime[2] = 0;
    }
    fTime[2]++;

    //Post message with data back
    self.postMessage({
        fps:fps,
        data:bodyData
    });
}