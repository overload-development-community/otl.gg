/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    Challenge = require("../../src/models/challenge"),
    Player = require("../../src/models/player"),
    RecordsView = require("../../public/views/records"),
    Season = require("../../src/models/season"),
    Team = require("../../src/models/team");

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
        const queryGameType = req.query.gameType && req.query.gameType.toString() || void 0,
            queryRecordType = req.query.recordType && req.query.recordType.toString() || void 0,
            querySeason = req.query.season && req.query.season.toString() || void 0,
            queryTeamId = req.query.teamId && req.query.teamId.toString() || void 0,
            seasonList = await Season.getSeasonNumbers(),
            postseason = !!req.query.postseason,
            gameType = !queryGameType || ["TA", "CTF"].indexOf(queryGameType.toUpperCase()) === -1 ? "TA" : queryGameType.toUpperCase(),
            recordType = !queryRecordType || ["team", "player"].indexOf(queryRecordType.toLowerCase()) === -1 ? "team" : queryRecordType.toLowerCase(),
            validSeasonNumbers = await Season.getSeasonNumbers(),
            teamList = await Team.getSeasonStandings(),
            teams = new Teams();

        let season = isNaN(+querySeason) ? void 0 : Number.parseInt(querySeason, 10),
            teamId = isNaN(+queryTeamId) ? void 0 : Number.parseInt(queryTeamId, 10);

        validSeasonNumbers.push(0);
        if (validSeasonNumbers.indexOf(season) === -1) {
            season = void 0;
        }

        for (const teamData of teamList) {
            const team = teams.getTeam(teamData.teamId, teamData.name, teamData.tag);
            teamData.color = team.role && team.role.hexColor || "";
        }

        if (teamId !== void 0) {
            const team = await Team.getById(teamId);
            if (team === void 0) {
                teamId = void 0;
            }
        }

        const records = await Player.getRecords(season, postseason, gameType, recordType, teamId);

        res.status(200).send(await Common.page(
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
                teamId,
                teams,
                teamList
            }),
            req
        ));
    }
}

Records.route = {
    path: "/records"
};

module.exports = Records;
