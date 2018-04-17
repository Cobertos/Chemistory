import RSVP from "rsvp";
const Promise = RSVP.Promise;

export class PromiseProxy {
	constructor(initialPromise) {
		let externalResolve, externalReject;
		let p = new Promise((res, rej)=>{
			externalResolve = res;
			externalReject = rej;
		});
		p.externalResolve = externalResolve;
		p.externalReject = externalReject;

		p.proxy = function(externalPromise){
			externalPromise
				.then(externalResolve)
				.catch(externalReject);
		};

		if(initialPromise) {
			p.proxy(initialPromise);
		}

		return p;
	}
}