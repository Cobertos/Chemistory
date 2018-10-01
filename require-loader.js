//For every key in query.require, it will assign a variable of the same name
//to require the given value. If the value was an array, the first item is
//the module to require, and the rest of the items are properties
module.exports = function(source) {
  //this.cacheable();
  var requireStr = "";
  Object.keys(this.query.requires).forEach((name)=>{
    var str = "var " + name + " = eval('require(\"";

    var requireName = this.query.requires[name];
    var requireProps = [];
    if(Array.isArray(requireName)) {
      requireProps = requireName.slice(1);
      requireName = requireName[0];
    }

    str += requireName + "\")";
    requireProps.forEach((prop)=>{
      str += "." + prop;
    });
    str += "');\n";
    requireStr += str;
  });
  return requireStr + source;
};