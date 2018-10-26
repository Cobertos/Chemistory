import * as THREE from "three";
import "../vendor/LoaderSupport.js"; //Loads to THREE.LoaderSupport
import "../vendor/OBJLoader2.js"; //Loads to THREE.OBJLoader2
import "three-examples/loaders/MTLLoader.js"; //Loads to THREE.MTLLoader
/// #if NODEJS
    const fs = __non_webpack_require__("fs");
/// #endif

/**Loads a .mtl asynchronously
 * @param {string} uri The path or the url to load from (node or browser respectively)
 * without the .mtl
 * @param {function} onProgress The function to call on progress
 * @returns {array} The mtlCreator to use for the obj
 */
THREE.OBJLoader2.prototype.loadMtlAsync = async function(uri, onProgress){
    return new Promise((resolve, reject)=>{
    /// #if NODEJS
        
        let fileContent = fs.readFileSync(uri + ".mtl");
        //url, content, onLoad, onProgress, onError, crossOrigin, materialOption
        this.loadMtl("", fileContent, resolve, onProgress, reject);
    /// #else
        this.loadMtl(uri + ".mtl", undefined, resolve, onProgress, reject);
    /// #endif
    });
};

/**Loads a .obj asynchronously
 * @param {string} uri The path or the url to load from (node or browser respectively)
 * without the .obj
 * @param {function} onProgress The function to call on progress
 * @returns {THREE.OBJLoader2Return} The return from OBJLoader2, get the .obj from
 * `.detail.loaderRootNode`
 */
THREE.OBJLoader2.prototype.loadObjAsync = async function(uri, onProgress){
    return new Promise((resolve, reject)=>{
    /// #if NODEJS
        let fileContent = fs.readFileSync(uri + ".obj");
        //url, content, onLoad, onProgress, onError, crossOrigin, materialOption
        this.parseAsync(fileContent, resolve);
    /// #else
        this.load(uri + ".obj", resolve, onProgress, reject, null, true );
    /// #endif
    });
};