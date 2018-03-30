import OIMOWorkerCls from "./OIMOWorker";

const OIMOWorker = new OIMOWorkerCls();
const objects = {};

let fps;
let time_prev = 0;
let fpsint = 0;

OIMOWorker.postMessage = OIMOWorker.webkitPostMessage || OIMOWorker.postMessage;
OIMOWorker.onmessage = function(e) {
    // stat
    fps = e.data.fps;
    // Get fresh data from the worker
    let data = e.data.bodyData;
    Object.keys(objects).forEach((key,i)=>{
        let o = objects[key];
        let offset = i*8;
        if(bodyData[n] !== 1){ //not asleep
            o.position.fromArray( data, i+1);
            o.quaternion.fromArray( data, i+4 );
        }
    });
};

export function addObject(obj, physObj) {
    objects[obj.uuid] = obj;
    OIMOWorker.postMessage({
        command: "create",
        id: obj.uuid,
        data: physObj
    });
}

export function getInfo(){
    let time = Date.now();
    if (time - 1000 > time_prev) {
        time_prev = time;
        fpsint = fps;
        fps = 0;
    } fps++;
    var info =[
        "Oimo.js DEV.1.1.1a<br><br>",
        "Physics: " + oimoInfo +" fps<br>",
        "Render: " + fpsint +" fps<br>"
    ].join("\n");
}