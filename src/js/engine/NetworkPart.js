import { BasePart } from "./BasePart";

export class NetworkPart extends BasePart {
  getNetworkParams() {
    return {};
  }

  static onDefined(){
    //TODO: RPCs
    //Post-Process all the functions that need to send
    //RPCs instead of actually functioning
    /*Object.keys(this.prototype).forEach((name)=>{
      let val = this.prototype[name];
      if(typeof val !== "function") {
        return false; //Continue
      }

      let match = name.match("^(cl|sv)_(.+)");
      if(!match) {
        return false;
      }

      let isServerFunc = match[1] === "sv";
      let rpcName = match[2];
      let _func = val;
      let func;
      if(isServerFunc){
        func = (...args)=>{
          if(this._wsScene.isServer) {
            _func(...args);
          }
          else {
            //Send it as an RPC to the server
            this._wsScene.rpc(rpcName, ...args);
          }
        }
      }
      else {
        func = (...args)=>{
          if(this._wsScene.isServer) {
            //Send an RPC to the client identified by the ID
            //let clientID = args[0];
            this._wsScene.rpc(rpcName, ...args);
          }
          else {
            _func(...args);
          }
        };
      }
      this.prototype[name] = func;
    });*/
  }
}