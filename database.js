const Db = require("node-database"),
    settings = require("./settings"),
    db = new Db(settings.database);

//  ####           #            #
//   #  #          #            #
//   #  #   ###   ####    ###   # ##    ###    ###    ###
//   #  #      #   #         #  ##  #      #  #      #   #
//   #  #   ####   #      ####  #   #   ####   ###   #####
//   #  #  #   #   #  #  #   #  ##  #  #   #      #  #
//  ####    ####    ##    ####  # ##    ####  ####    ###
/**
* Defines the database class.
*/
class Database {
    static getHomesForDiscordId(discordId) {
        return db.query("SELECT Home FROM tblHome WHERE DiscordID = @discordId", {discordId: {type: Db.VARCHAR(50), value: discordId}}).then((data) => data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Home));
    }
}

module.exports = Database;
