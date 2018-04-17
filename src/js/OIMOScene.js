import OIMOWorkerCls from "./OIMOWorker";
import { PromiseProxy } from "./utils";

/**Encapsulates an OIMOWorker and all the object communications with it
 * @todo The getInfo() doesn't actually work Im pretty sure
 */
export class OIMOScene {
    constructor() {
        this._objects = {};

        this._worker = new OIMOWorkerCls();
        this._worker.postMessage = this._worker.webkitPostMessage || this._worker.postMessage;
        this._worker.onmessage = this.onMessage.bind(this);

        this._fps;
        this._time_prev = 0;
        this._fpsint = 0;

        this._workerLoaded = false;
        this._workerPromise = new PromiseProxy();

        this._loadInterval = setInterval(()=>{
            this._worker.postMessage({ command: "loadbeat" });
        }, 100);
    }

    onMessage(e) {
        if(e.data.loadbeat) {
            this._workerLoaded = true;
            this._workerPromise.externalResolve();
            clearInterval(this._loadInterval);
            return;
        }

        // stat
        this._fps = e.data.fps;
        // Get fresh data from the worker
        let bodyData = e.data.data;
        Object.keys(this._objects).forEach((key,i)=>{
            let o = this._objects[key];
            let offset = i*8;
            if(bodyData[offset] !== 1){ //not asleep || static
                o.position.fromArray( bodyData, offset+1);
                o.quaternion.fromArray( bodyData, offset+4 );
                if(typeof o.onPhysicsTick === "function") {
                    o.onPhysicsTick();
                }
            }
        });
    }

    onLoad() {
        return this._workerPromise;
    }

    /**Adds a physics object with the given params, optionally taking
     * a THREE.js object to update with the created rigidbody
     * @param {object} physObj Object with physics parametets
     * @param {THREE.Object3D} [threeObj=undefined] THREE.js update to update
     */
    add(physObj, threeObj=undefined) {
        this._objects[physObj.id] = threeObj;

        this._worker.postMessage({
            command: "add",
            id: physObj.id,
            //pos, array of vec3
            //size, array of vec3
            //rot, array of vec4 (its a quat)
            data: physObj
        });
    }

    /**Given a physics object, will set a new position
     * and optionally rotation
     * @param {object} physObj The physics object with id
     * @param {Number[3]} pos The position to set to
     * @param {Number[4]} [rot=undefined] The rotation to set to
     */
    set(physObj, pos, rot=undefined) {
        this._worker.postMessage({
            command: "set",
            id: physObj.id,
            pos, rot
        });
    }

    /**Deletes the given physics object from the simulation
     * @param {object} physObj The physics object to delete
     */
    del(physObj) {
        this._worker.postMessage({
            command: "del",
            id: physObj.id
        });
        delete this._objects[physObj.id];
    }

    /**Applies impulse
     * @param {object} physObj The physics object to apply to
     * @param {Number[3]} pos The position to apply to
     * @param {Number[3]} force The force to apply, will be scaled by 1/m
     */
    impulse(physObj, pos, force) {
        this._worker.postMessage({
            command: "impulse",
            id: physObj.id,
            pos,
            force
        });
    }

    /**Gets performance info and other statistics for this OIMO simulation
     * @returns {string} HTML string of performance information
     */
    getInfo() {
        let time = Date.now();
        if (time - 1000 > this._time_prev) {
            this._time_prev = time;
            this._fpsint = this._fps;
            this._fps = 0;
        } fps++;
        var info =[
            "Oimo.js DEV.1.1.1a<br><br>",
            "Physics: " + oimoInfo +" fps<br>",
            "Render: " + this._fpsint +" fps<br>"
        ].join("\n");
    }
}