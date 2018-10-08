/**Class that handles input
 * @prop {object} bindings Action labels to keys for those actions
 * @prop {object} reverseBindings Keys on the keyboard and what action they're mapped to
 */
class _Input {
  constructor(){
    this.bindings = {
      up: "w", 
      down: "s",
      left: "a",
      right: "d",
      jump: " ",
      //look: "mouse"
    };
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
const Input = new _Input();
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
/*window.addEventListener("mousemove", (/*e)=>{
  //TODO: This should work, but I realized I didn't need it rn
  //let pos = conversions.eventToWindowPX(e);
  //TODO: Use the renderer, not window/body
  //(honestly this should all be in it's own class)
  //pos = conversions.viewportPXToviewportNDC($("body"), pos);
  //_setInput("mouse", pos);
});*/
/// #endif