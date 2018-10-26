import { PromiseProxy } from "../utils";
/// #if NODEJS
const WSWebSocket = eval('require')("ws");
/// #endif
const isServer = typeof window === "undefined";

/**Encapsulates all the networking work needed to keep
 * objects synced between computers
 * @todo If we need UDP and in browser listen servers, consider using
 * https://peerjs.com/, which uses WebRTC data channels for UDP
 */
export class WSScenePart {
    initializer(url){
        this._connectionLoaded = false;
        this._connectionPromise = new PromiseProxy();
        let isServer = this._isServer = !url;
        let ws;

        if(isServer) { //We're connecting to a server
            ws = new WSWebSocket.Server({
                port: 10016,
                clientTracking: true
            });
            ws.on("listening", ()=>{
              this._connectionLoaded = true;
              this._connectionPromise.externalResolve();
            });
            ws.on("error", (err)=>{
              throw err;
            });
        }
        else { //We ARE a server
            ws = new WebSocket(url);
            ws.addEventListener("open", ()=>{
              this._connectionLoaded = true;
              this._connectionPromise.externalResolve();
            });
            ws.addEventListener("error", (err)=>{
              throw err;
            });
        }
        this._ws = ws;
    }

    get isServer() {
        return this._isServer;
    }

    async load() {
        await this._connectionPromise;
    }

    //TODO: RPCs
    /*rpc(rpcName, ...rpcArgs) {
        if(this.isServer) {
            let clientID = rpcArgs[0];
            rpcArgs = rpcArgs.slice(1);
        }
        else {
            ws.send();
        }
    }*/
}