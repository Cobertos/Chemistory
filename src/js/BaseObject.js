import * as THREE from "three";

export class BaseObject extends THREE.Object3D {
	constructor() {
    super();
    BaseObject.objects.push(this)
		if(this.onUpdate === "function") {
			(this.onUpdate.bind(this), 33);
		}
	}

	onUpdate() {

	}
}

BaseObject.objects = [];
