import { expect } from "chai";
import { _Input as Input } from "../src/js/input";

describe("input", ()=>{
    it("has bindings that map actions to keys", ()=>{
        //arrange/act
        let input = new Input({
            up: "w"
        });

        //assert
        expect(input.bindings.up).to.equal("w");
    });
    it("has reversed bindings map keys to actions", ()=>{
        //arrange/act
        let input = new Input({
            up: "w"
        });

        //assert
        expect(input.reverseBindings.w).to.equal("up");
    });
    it("has the ability to retrieve input", ()=>{
        //arrange
        let input = new Input({
            up: "w"
        });

        //act
        let v = input.getInput("up");
        let v2 = input.getInput("down");

        //assert
        expect(v).to.equal(undefined);
        expect(v2).to.equal(undefined);
    });
    it("has the ability to set input", ()=>{
        //arrange
        let input = new Input({
            up: "w"
        });

        //act
        input._setInput("w", true);
        let v = input.getInput("up");

        //assert
        expect(v).to.equal(true);
    });
});