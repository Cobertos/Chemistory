/**Base class for all parts. NOTE: Currently parts will work even without this base class
 * and this is just for documentation purposes...
 */
export class BasePart {
  /**aggregation() library constructor. Called after child that uses part constructor()
   * but called before the parent class constructor (THREE.js constructor).
   * NOTE: constructor() will never be called b/c of how aggregation() is implemented!
   * @method initializer
   * @todo Confirm the calling order between the different parts in a SimObject and
   * update documentation as necessarty
   */

  /**Called the first frame after the object finishes construction and
   * the super() call chain in constructor() has finished.
   * @method onConstructed
   */

  /**Called every frame
   * @method onTick
   * @todo This is bound to onBeforeRender, but it should be called regardless of whether
   * or not this object will render
   */
}