export const ThreeJSChai = (_chai, utils)=>{
    const Assertion = _chai.Assertion;
    Assertion.overwriteMethod('equal', (_super)=>{
        return function(obj2) {
            var obj = this._obj;
            if(typeof obj !== "object") {
                return _super.apply(this, arguments);
            }
            if(obj.isVector2) {
                new Assertion(obj.x).to.equal(obj2.x);
                new Assertion(obj.y).to.equal(obj2.y);
            }
            else if(obj.isVector3) {
                new Assertion(obj.x).to.equal(obj2.x);
                new Assertion(obj.y).to.equal(obj2.y);
                new Assertion(obj.z).to.equal(obj2.z);
            }
            else if(obj.isVector4) {
                new Assertion(obj.x).to.equal(obj2.x);
                new Assertion(obj.y).to.equal(obj2.y);
                new Assertion(obj.z).to.equal(obj2.z);
                new Assertion(obj.w).to.equal(obj2.w);
            }
            else {
                return _super.apply(this, arguments);
            }
        };
    });
};