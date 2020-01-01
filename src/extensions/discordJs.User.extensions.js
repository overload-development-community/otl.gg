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
/**
 * Gets the current season stats for the pilot.
 * @returns {Promise<{ta: {games: number, kills: number, assists: number, deaths: number, damage: number, deathsInGamesWithDamage: number}, ctf: {games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number}, damage: Object<string, number>, playerId: number, name: string, tag: string, season: number}>} A promise that resolves with the pilot's stats.
 */
DiscordJs.User.prototype.getStats = async function() {
    try {
        return await Db.getStats(this);
    } catch (err) {
        throw new Exception("There was a database error getting the stats for a pilot.", err);
    }
};
