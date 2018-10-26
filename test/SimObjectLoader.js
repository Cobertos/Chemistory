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
        it("uses .name, geometry, and material to make physics objects", ()=>{
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
        it("calls _processOne() for every process object() depth first", ()=>{
            //arrange
            let sol = new SimObjectLoader();
            spy(sol, "_processOne");
            let obj2 = new THREE.Object3D();
            let obj = new THREE.Object3D();
            obj.add(obj2);

            //act
            sol.process(obj);

            //assert
            expect(sol._processOne.callCount).to.equal(2);
            expect(sol._processOne.getCall(0).args[0]).to.equal(obj2);
            expect(sol._processOne.getCall(1).args[0]).to.equal(obj);
        });
        it("will replace objects in process() if _processOne() returns a different value", ()=>{
            //arrange
            const testObj = new THREE.Object3D();
            let obj2 = new THREE.Object3D();
            let obj = new THREE.Object3D();
            obj.add(obj2);
            class TestSimObjectLoader extends SimObjectLoader {
                _processOne(o) {
                    if(o === obj2) {
                        return testObj;
                    }
                    return o;
                }
            }
            let sol = new TestSimObjectLoader();

            //act
            sol.process(obj);

            //assert
            expect(obj.children.length).to.equal(1);
            expect(obj.children[0]).to.equal(testObj);
        });
    });
});