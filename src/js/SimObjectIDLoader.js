import { SimObjectLoader } from "./engine/SimObjectLoader";
/**
 * @prop {object} idMap Object of names to arrays of objects that had
 * `/ID=([a-z0-9A-Z-]+)/` in their name
 */
export class SimObjectIDLoader extends SimObjectLoader {
    constructor() {
        super();
        this.idMap = {};
    }

    _processOne(obj) {
        //Collect objects with a given ID name
        if(obj.name) {
            let id = obj.name.match(/ID=([a-z0-9A-Z-]+)/);
            if(id) {
                id = id[1];
                if(!this.idMap[id]) {
                    this.idMap[id] = [];
                }

                this.idMap[id].push(obj);
            }
        }

        return super._processOne(obj);
    }
}

    