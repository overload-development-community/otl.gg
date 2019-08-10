const Db = require("node-database"),

    settings = require("../../settings");

module.exports = new Db(settings.database);
