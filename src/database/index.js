const Db = require("@roncli/node-database"),

    settings = require("../../settings");

module.exports = new Db(settings.database);
