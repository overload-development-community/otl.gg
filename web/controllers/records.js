const Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    Challenge = require("../../src/models/challenge"),
    Player = require("../../src/models/player"),
    RecordsView = require("../../public/views/records"),
    Season = require("../../src/models/season");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  ####                                   #
//  #   #                                  #
//  #   #   ###    ###    ###   # ##    ## #   ###
//  ####   #   #  #   #  #   #  ##  #  #  ##  #
//  # #    #####  #      #   #  #      #   #   ###
//  #  #   #      #   #  #   #  #      #  ##      #
//  #   #   ###    ###    ###   #       ## #  ####
/**
 * A class that represents the records page.
 */
class Records {
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
        const seasonList = await Season.getSeasonNumbers(),
            season = isNaN(req.query.season) ? void 0 : Number.parseInt(req.query.season, 10),
            postseason = !!req.query.postseason,
            gameType = !req.query.gameType || ["TA", "CTF"].indexOf(req.query.gameType.toUpperCase()) === -1 ? "TA" : req.query.gameType.toUpperCase(),
            recordType = !req.query.recordType || ["team", "player"].indexOf(req.query.recordType.toLowerCase()) === -1 ? "team" : req.query.recordType.toLowerCase(),
            records = await Player.getRecords(season, postseason, gameType, recordType),
            teams = new Teams();

        res.status(200).send(Common.page(
            /* html */`
                <link rel="stylesheet" href="/css/records.css" />
            `,
            RecordsView.get({
                seasonList,
                records,
                season,
                postseason,
                gameType,
                gameTypeName: Challenge.getGameTypeName(gameType),
                recordType,
                teams
            }),
            req
        ));
    }
}

Records.route = {
    path: "/records"
};

module.exports = Records;
