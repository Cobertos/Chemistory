import * as THREE from "three";
import { SimObjectLoader } from "./engine/SimObjectLoader";
/**
 * @prop {object} idMap Object of names to arrays of objects that had
 * `/ID=([a-z0-9A-Z-]+)/` in their name
 */
export class ChemistoryLoader extends SimObjectLoader {
    constructor() {
        super();
        this.idMap = {};
        this.spawns = [];
        this._matCache = {};
    }

    _processOne(obj) {
        //Collect objects with a given ID name
        if(obj.name) {
            let id = obj.name.match(/ID=([a-z0-9A-Z-]+)/);
            if(id) {
                id = id[1];
                let handled = this._handleID(id, obj);

                if(!this.idMap[id]) {
                    this.idMap[id] = [];
                }

                this.idMap[id].push(obj);
                if(handled !== undefined) {
                    return obj;
                }
            }
        }

        obj = super._processOne(obj);

        if(obj && obj.material && obj.material.__proto__.constructor.name === "MeshPhongMaterial") {
            //Gotta keep it low rez cause my surface cant handle this shit
            obj.material = new THREE.MeshLambertMaterial({
                color: obj.material.color
            });
        }
        return obj;
    }

    //Returns undefined for default processing, otherwise it will
    //return the same object returned in the parent function too
    _handleID(id, obj) {
        let match;
        if(id === "SPAWN") {
            obj.geometry.computeBoundingBox();
            let bbc = obj.geometry.boundingBox.getCenter(new THREE.Vector3());
            this.spawns.push(bbc);
            return null; //Delete this object
        }
        else if(match = id.match(/SUBWAY(\d)/)) {
            //Handle the minimap representations of the subway
            let idx = parseInt(match[1])-1;
            let color = [0xFF0000, 0xFFFF00][idx];
            let mat = this._matCache[idx] = this._matCache[idx] || new THREE.MeshBasicMaterial({ color });
            obj.geometry.computeBoundingBox();
            let center = new THREE.Vector3();
            obj.geometry.boundingBox.getCenter(center);
            let c2 = center.clone().negate();
            obj.geometry.translate(c2.x, c2.y, c2.z);
            obj.material = mat;
            obj.position.copy(center);
            obj.position.setY(0); //Flatten
            return obj; //Return the object as is, don't process anything else about it
        }

        //Handle gas
        //TODO: Actually create the indicator on the minimap
        //TODO: Actually create interactable behavior
        //TODO: Nail down the specifics of the timing related to
        //the gas (go back to story to nail down how all this
        //ties in)
        //levelLoader.idMap["GAS1"];
    }
}

    