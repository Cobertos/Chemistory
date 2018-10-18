import { expect } from "chai";
import { _Input as Input } from "../src/js/input.js";

describe("input", ()=>{
    //TODO: This should eventually be able to provide bindings to the
    //class instead of it just testing that they exist b/c of the defaults
    it("has bindings that map actions to keys", ()=>{
        //arrange/act
        let input = new Input();

        //assert
        expect(input.bindings).to.be.ok;
    });
    it("has reversed bindings map keys to actions", ()=>{
        //arrange/act
        let input = new Input();

        //assert
        expect(input.reverseBindings).to.be.ok;
    });
    it("has the ability to retrieve input", ()=>{
        //arrange
        let input = new Input();

        //act
        let v = input.getInput("up");

        //assert
        expect(v).to.equal(undefined);
    });
    it("has the ability to set input", ()=>{
        //arrange
        let input = new Input();

        //act
        input._setInput("w", true);
        let v = input.getInput("up");

        //assert
        expect(v).to.equal(true);
    });
});