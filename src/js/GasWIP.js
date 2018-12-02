import * as THREE from "three";
import { SimObject } from "./BaseObject";
import { _assert } from "./utils";

function generateLineBufferGeometry(pos1, pos2){
	let geo = new THREE.BufferGeometry();
	let verts = new UInt8Array([
		pos1.x, pos1.y, pos1.z,
		pos2.x, pos2.y, pos2.z
	]);
	let attr = new THREE.BufferAttribute(verts, 3);
	geo.addAttribute("position", attr);
	return geo;
};


/**Class that handles gas progression
 */
export class Gas extends SimObject(THREE.Mesh, DebugPart){
	constructor(path){
		this._path = path;
	}

	onDebug() {
		this._path.forEach((pathNode, idx, arr)=>{
			_assert(pathNode instanceof THREE.Vector3);

			//Ball at each node
			let geo = new THREE.SphereBufferGeometry(1,1,1);
			let mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
			let mesh = new THREE.Mesh(geo, mat);
			this.add(mesh);

			//Lines between each ball
			if(idx > 0) {
				let geo = generateLineBufferGeometry(
					arr[idx - 1], arr[idx]) 
				let mat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
				this.add(mesh);
			}
		});
	}
}

/**Class that handles the Gas graphics
 */
export class GasGraphics {

}