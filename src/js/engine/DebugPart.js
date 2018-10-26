import { BasePart } from "./BasePart";

/**Collects together debug portions of an object
 */
const isDebugBuild = true;
export class DebugPart extends BasePart {
  initializer() {

  }

  onConstructed() {
    if(isDebugBuild && typeof this.onDebug === "function") {
      this.onDebug();
    }
  }
}