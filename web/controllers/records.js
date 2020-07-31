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
            postseason = !!req.query.postseason,
            gameType = !req.query.gameType || ["TA", "CTF"].indexOf(req.query.gameType.toString().toUpperCase()) === -1 ? "TA" : req.query.gameType.toString().toUpperCase(),
            recordType = !req.query.recordType || ["team", "player"].indexOf(req.query.recordType.toString().toLowerCase()) === -1 ? "team" : req.query.recordType.toString().toLowerCase(),
            validSeasonNumbers = await Season.getSeasonNumbers(),
            teams = new Teams();

        let season = isNaN(+req.query.season.toString()) ? void 0 : Number.parseInt(req.query.season.toString(), 10);

        validSeasonNumbers.push(0);
        if (validSeasonNumbers.indexOf(season) === -1) {
            season = void 0;
        }

        const records = await Player.getRecords(season, postseason, gameType, recordType);

        res.status(200).send(Common.page(
            "",
            {css: ["/css/records.css"]},
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
