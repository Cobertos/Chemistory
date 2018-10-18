import { _assert } from "./utils.js";

/**Class that handles input
 * @prop {object} bindings Action labels to keys for those actions
 * @prop {object} reverseBindings Keys on the keyboard and what action they're mapped to
 */
export class _Input {
  constructor(bindings){
    _assert(typeof bindings === "object", "Bindings must be an object!");
    this.bindings = bindings;
    this._reverseBindings = undefined;

    this.keyValues = {};
  }

  get reverseBindings() {
    if(!this._reverseBindings) {
      this._reverseBindings = {};
      Object.keys(this.bindings)
        .forEach((k)=>{
          let bind = k;
          let key = this.bindings[k];
          this._reverseBindings[key] = bind;
        });
    }
    return this._reverseBindings;
  }

  /**Given a binding name, returns the current value of that input
   * @param {string} bind The name of the binding to retrieve the value for
   * @returns {any} The value for that binding (key down or up for now)
   */
  getInput(bind){
    return this.keyValues[this.bindings[bind]];
  }

  /**Given a key id, sets the value to the given value
   * @param {string} key The key to set the value for keyCode.key
   * @param {any} val The value to set
   */
  _setInput(key, val){
    this.keyValues[key] = val;
  }
}
const Input = new _Input({
  up: "w", 
  down: "s",
  left: "a",
  right: "d",
  jump: " ",
  //look: "mouse"
});
export default Input;

/// #if BROWSER
window.addEventListener("keydown", (e)=>{
  if(Object.keys(Input.reverseBindings).includes(e.key)) {
    Input._setInput(e.key, true);
  }
});
window.addEventListener("keyup", (e)=>{
  if(Object.keys(Input.reverseBindings).includes(e.key)) {
    Input._setInput(e.key, false);
  }
});

let touchKey;
function touchEventToKey(e){
  console.log(e);
  let t = e.touches[0];
  if(t.screenX < window.innerWidth/2) {
    if(t.screenY < window.innerWidth/2) {
      return "s";
    }
    else {
      return "a";
    }
  }
  else {
    if(t.screenY < window.innerWidth/2) {
      return "d";
    }
    else {
      return "w";
    }
  }
}
window.addEventListener("touchstart", (e)=>{
  let key = touchEventToKey(e);
  let hasKey = Object.keys(Input.reverseBindings).includes(key);
  if(hasKey && touchKey === undefined) {
    Input._setInput(key, true);
    touchKey = key;
  }
  else if(hasKey) {
    Input._setInput(touchKey, false);
    Input._setInput(key, true);
    touchKey = key;
  }
});
window.addEventListener("touchend", (e)=>{
  Input._setInput(touchKey, false);
});
/*window.addEventListener("mousemove", (/*e)=>{
  //TODO: This should work, but I realized I didn't need it rn
  //let pos = conversions.eventToWindowPX(e);
  //TODO: Use the renderer, not window/body
  //(honestly this should all be in it's own class)
  //pos = conversions.viewportPXToviewportNDC($("body"), pos);
  //_setInput("mouse", pos);
});*/
/// #endif