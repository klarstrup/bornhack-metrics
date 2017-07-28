require("babel-register");
require("babel-polyfill");
require("dotenv").config({ path: `${__dirname}/../.env` });
require("./api.js");
