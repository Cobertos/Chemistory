import chai from "chai";
const { expect }  = chai;
import { spy } from "sinon";
import * as THREE from "three";
import { SimObjectLoader } from "../src/js/engine/SimObjectLoader";
import { ThreeJSChai } from "./utils";
chai.use(ThreeJSChai);

describe("SimObjectLoader", ()=>{
    describe("_processOne()", ()=>{
        it("returns the same object passed", ()=>{
            //arrange
            let obj = new THREE.Object3D();

            //act
            let tmp = SimObjectLoader.prototype._processOne(obj);

            //assert
            expect(obj).to.equal(tmp);
        });
        it("uses name to make physics objects", ()=>{
            //arrange
            let geo = new THREE.BoxBufferGeometry(2,2,2);
            let mat = new THREE.MeshBasicMaterial();
            let obj = new THREE.Mesh(geo, mat);
            obj.position.set(1,2,3);
            obj.name = "PHYS=TRUE;PHYS_SHAPE=BOX";

            //act
            obj = SimObjectLoader.prototype._processOne(obj);

            //assert
            expect(obj.supportsPhysics).to.be.ok;
            let params = obj.getPhysicsParams();
            expect(params.size).to.deep.equal(new THREE.Vector3(2,2,2).toArray());
            expect(params.pos).to.deep.equal(new THREE.Vector3(1,2,3).toArray());
            expect(params.type).to.equal("box");
        });
    });
});