/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    Challenge = require("../../src/models/challenge"),
    Discord = require("../../src/discord"),
    Player = require("../../src/models/player"),
    PlayersView = require("../../public/views/players"),
    Season = require("../../src/models/season");

//  ####    ##
//  #   #    #
//  #   #    #     ###   #   #   ###   # ##    ###
//  ####     #        #  #   #  #   #  ##  #  #
//  #        #     ####  #  ##  #####  #       ###
//  #        #    #   #   ## #  #      #          #
//  #       ###    ####      #   ###   #      ####
//                       #   #
//                        ###
/**
 * A class that represents the players page.
 */
class Players {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Processes the request.
     * @param {Express.Request} req The request.
     * @param {Express.Response} res The response.
     * @returns {Promise} A promise that resolves when the request is complete.
     */
    static async get(req, res) {
        const querySeason = req.query.season && req.query.season.toString() || void 0,
            queryGameType = req.query.gameType && req.query.gameType.toString() || void 0,
            freeAgents = (await Player.getFreeAgents()).filter((f) => Discord.findGuildMemberById(f.discordId)),
            seasonList = await Season.getSeasonNumbers(),
            season = isNaN(+querySeason) ? void 0 : Number.parseInt(querySeason, 10),
            gameType = !queryGameType || ["TA", "CTF"].indexOf(queryGameType.toUpperCase()) === -1 ? "TA" : queryGameType.toString().toUpperCase(),
            postseason = !!req.query.postseason,
            all = !!req.query.all,
            stats = await Player.getSeasonStats(season, postseason, gameType, postseason || all),
            averages = {
                captures: stats.reduce((acc, cur) => acc + cur.avgCaptures, 0) / stats.length,
                pickups: stats.reduce((acc, cur) => acc + cur.avgPickups, 0) / stats.length,
                carrierKills: stats.reduce((acc, cur) => acc + cur.avgCarrierKills, 0) / stats.length,
                returns: stats.reduce((acc, cur) => acc + cur.avgReturns, 0) / stats.length,
                kda: stats.reduce((acc, cur) => acc + cur.kda, 0) / stats.length,
                kills: stats.reduce((acc, cur) => acc + cur.avgKills, 0) / stats.length,
                assists: stats.reduce((acc, cur) => acc + cur.avgAssists, 0) / stats.length,
                deaths: stats.reduce((acc, cur) => acc + cur.avgDeaths, 0) / stats.length,
                damagePerGame: stats.reduce((acc, cur) => acc + cur.avgDamagePerGame, 0) / stats.length,
                damagePerDeath: stats.reduce((acc, cur) => acc + cur.avgDamagePerDeath, 0) / stats.length
            },
            teams = new Teams();

        res.status(200).send(await Common.page(
            "",
            {css: ["/css/players.css"]},
            PlayersView.get({
                freeAgents,
                seasonList,
                stats,
                averages,
                season,
                postseason,
                gameType,
                gameTypeName: Challenge.getGameTypeName(gameType),
                all,
                teams
            }),
            req
        ));
    }
}

Players.route = {
    path: "/players"
};

module.exports = Players;
