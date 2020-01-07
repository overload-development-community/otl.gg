const DiscordJs = require("discord.js"),

    Db = require("../database/player"),
    Exception = require("../logging/exception");

//              #     ##    #           #
//              #    #  #   #           #
//  ###   ##   ###    #    ###    ###  ###    ###
// #  #  # ##   #      #    #    #  #   #    ##
//  ##   ##     #    #  #   #    # ##   #      ##
// #      ##     ##   ##     ##   # #    ##  ###
//  ###
DiscordJs.User.prototype.getStats = async function() {
    try {
        return await Db.getStats(this);
    } catch (err) {
        throw new Exception("There was a database error getting the stats for a pilot.", err);
    }
};
