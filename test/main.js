//Import all the .js files in this directory
const contextRequire = require.context('.', true, /\.js$/);
contextRequire.keys().forEach(contextRequire);