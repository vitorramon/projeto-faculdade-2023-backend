const { create, defaults, router } = require("json-server");
const path = require("path");

const server = create();
const apiEndPoints = router(path.join(__dirname, "..", "data", "db.json"), {foreignKeySuffix: "_id"});

const middlewares = defaults();

server.use(middlewares);
server.use(apiEndPoints);

module.exports = {server, apiEndPoints};