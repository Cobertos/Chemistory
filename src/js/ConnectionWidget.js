import EventEmitter from "wolfy87-eventemitter";
import { parseHTML } from "./utils.js";

export class ConnectionWidget extends EventEmitter {
    constructor(){
        super();
        //TODO: create a wrapper for this
        //that will throw on invalid HTML
        let dom = this._dom = parseHTML(`
            <input id="connectTo" type="text"></input>
            <button id="connect">Connect to Server</button>
            <button id="startServer">Start Server</button>
        `);
        let ids = this._ids = {};
        dom.querySelectorAll("*[id]").forEach((el)=>{
            ids[el.id] = el;
        });
        ids.connect.addEventListener("click",
            this.emit.bind(this, "connectTo", this.url));
        ids.connectTo.addEventListener("click",
            this.emit.bind(this, "startServer"));
    }

    get url(){
        return this._ids.connectTo.value;
    }

    get dom(){
        return this._dom;
    }
}