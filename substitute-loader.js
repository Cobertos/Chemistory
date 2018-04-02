//Substitute w/ options.substitute
module.exports = function(source) {
  this.cacheable();
  return this.query.substitute;
};