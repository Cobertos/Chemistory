import chai from "chai";
const { expect }  = chai;
import * as THREE from "three";
import { SimObjectIDLoader } from "../src/js/SimObjectIDLoader";
import { ThreeJSChai } from "./utils";
chai.use(ThreeJSChai);

describe("SimObjectIDLoader", ()=>{
    describe("_processOne()", ()=>{
        it("collects IDs in the class insteance in idMap", ()=>{
            //arrange
            let sol = new SimObjectIDLoader();
            let obj = new THREE.Object3D();
            obj.name = "ID=like-a-big-pizza-pie-thats-amore";

            //act
            sol._processOne(obj);

            //assert
            let items = sol.idMap["like-a-big-pizza-pie-thats-amore"];
            expect(items.length).to.equal(1);
            expect(items[0]).to.equal(obj);
        });
    });
});