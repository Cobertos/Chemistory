import { World, Vec3 } from "oimo";
const _self = typeof self !== "undefined" ? self : eval('require("worker_threads")').parentPort;

//Feature TODO:
//* Listen for contacts
//* Switching modes between static, dynamic, kinematic, etc?

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
const bodyData = new Float32Array( maxBodies * 14 );

let simulationInterval = undefined;

_self.onmessage = function(e) {
    let msg = e.data || e; //Browser || NodeJS event
    if(msg.command === "add") {
        //world.add({size:[200, 20, 200], pos:[0,-10,0]}); //Ground plan
        //world.add({type:'sphere', size:[0.25], pos:[x,(0.5*i)+0.5,z], move:true});
        //world.add({type:'box', size:[0.5,0.5,0.5], pos:[x,((0.5*i)+0.5),z], move:true});
        bodies[msg.id] = world.add(msg.data);
    }
    else if(msg.command === "set") {
        let obj = msg.obj;
        let b = bodies[obj.id];
        if(b.isStatic && !b.isKinematic) {
            throw new Error("Use o.move=true and o.kinematic=true for static movables!");
        }

        //Set position and optionally quaternion, don't use setPosition or setQuaternion
        //because it sets linear and angular velocity to really bizarre values and
        //will also cause any applyImpulses to fail due to it zeroing out these values first
        if(msg.setPos) {
            b.position.fromArray(obj.pos);
        }
        if(msg.setRot) {
            b.orientation.fromArray(obj.rot);
        }
        if(msg.setVel) {
            b.linearVelocity.fromArray(obj.vel);
        }
        if(msg.setAngVel) {
            b.angularVelocity.fromArray(obj.angVel);
        }
    }
    else if(msg.command === "del") {
        bodies[msg.id].remove();
        delete bodies[msg.id];
    }
    else if(msg.command === "impulse") {
        bodies[msg.id].applyImpulse(
            new Vec3().fromArray(msg.pos),
            new Vec3().fromArray(msg.force));
    }
    else if(msg.command === "loadbeat") {
        _self.postMessage({ loadbeat: true });
    }
    else if(msg.command === "play" && simulationInterval === undefined) {
        simulationInterval = setInterval( step, dt*1000 );
    }
    else if(msg.command === "pause" && simulationInterval !== undefined) {
        clearInterval(simulationInterval);
        simulationInterval = undefined;
    }
};

let lastStepTime = 0;
function step() {
    // Step the world
    world.step();

    //Copy all new body data into buffer
    Object.keys(bodies).forEach((key, i)=>{
        let b = bodies[key];
        let offset = i * 14;
        bodyData[offset] = +(!!b.sleeping || b.isStatic);
        if(!bodyData[offset]) {
            b.getPosition().toArray( bodyData, offset + 1 );
            b.getQuaternion().toArray( bodyData, offset + 4 );
            b.linearVelocity.toArray( bodyData, offset + 8 );
            b.angularVelocity.toArray( bodyData, offset + 11 );
        }
    });

    //FPS - Need to calculate in here so the FPS is calculated on
    //the right thread
    //TODO: Is this the right way to do this? Or is it better to use the
    //1000ms counter approach? Stats.js seems to use the counter approac
    //as well
    let now = Date.now();
    let fps = 1000 / (now - lastStepTime);
    lastStepTime = now;

    //Post message with data back
    _self.postMessage({
        fps,
        simData:bodyData
    });
}