import $ from "jquery";
const inNode = typeof window === "undefined";
const isServer = inNode;

const inputBinds = {
  up: 87, //W
  down: 83, //S
  left: 65, //A
  right: 68, //D
  jump: 32, //space
  look: "mouse"
};
const inputKeyCodes = ()=>Object.keys(inputBinds)
    .map((k)=>inputBinds[k])
    .filter((i)=>typeof i === "number");
const inputVals = {};
export const getInput = (bindName)=>inputVals[inputBinds[bindName]];
const _setInput = (id, val)=>inputVals[id] = val;
if(!isServer) {
  $(window).on("keydown", function(e){
    if(inputKeyCodes().indexOf(e.keyCode) !== -1) {
      _setInput(e.keyCode, true);
    }
  });
  $(window).on("keyup", function(e){
    if(inputKeyCodes().indexOf(e.keyCode) !== -1) {
      _setInput(e.keyCode, false);
    }
  });
  $(window).on("mousemove", function(/*e*/){
    //TODO: This should work, but I realized I didn't need it rn
    //let pos = conversions.eventToWindowPX(e);
    //TODO: Use the renderer, not window/body
    //(honestly this should all be in it's own class)
    //pos = conversions.viewportPXToviewportNDC($("body"), pos);
    //_setInput("mouse", pos);
  });
}