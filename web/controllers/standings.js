const Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    Map = require("../../src/models/map"),
    Season = require("../../src/models/season"),
    StandingsView = require("../../public/views/standings"),
    Team = require("../../src/models/team");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   ###    #                       #    #
//  #   #   #                       #
//  #      ####    ###   # ##    ## #   ##    # ##    ## #   ###
//   ###    #         #  ##  #  #  ##    #    ##  #  #  #   #
//      #   #      ####  #   #  #   #    #    #   #   ##     ###
//  #   #   #  #  #   #  #   #  #  ##    #    #   #  #          #
//   ###     ##    ####  #   #   ## #   ###   #   #   ###   ####
//                                                   #   #
//                                                    ###
/**
 * A class that represents the standings page.
 */
class Standings {
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
        const queryRecords = req.query.records && req.query.records.toString() || void 0,
            querySeason = req.query.season && req.query.season.toString() || void 0,
            queryMap = req.query.map && req.query.map.toString() || void 0;
        let recordsTitle, records1, records2, records3;

        switch (queryRecords) {
            case "size":
                recordsTitle = "Team Size Records";
                records1 = "2v2";
                records2 = "3v3";
                records3 = "4v4+";
                break;
            case "type":
                recordsTitle = "Game Type Records";
                records1 = "Team Anarchy";
                records2 = "Capture the Flag";
                records3 = "Monsterball";
                break;
            default:
                recordsTitle = "Map Records";
                records1 = "Home";
                records2 = "Away";
                records3 = "Neutral";
                break;
        }

        const seasonList = await Season.getSeasonNumbers(),
            season = Number.parseInt(querySeason, 10) || void 0,
            maps = await Map.getPlayedBySeason(season),
            teams = new Teams();

        let map;
        if (maps.indexOf(queryMap) !== -1) {
            map = queryMap;
        }

        const standings = await Team.getSeasonStandings(isNaN(season) ? void 0 : season, recordsTitle, map);

        res.status(200).send(Common.page(
            "",
            {css: ["/css/standings.css"]},
            StandingsView.get({
                seasonList,
                maps,
                standings,
                season,
                records: queryRecords,
                recordsTitle,
                records1,
                records2,
                records3,
                map,
                teams
            }),
            req
        ));
    }
}

Standings.route = {
    path: "/standings"
};

module.exports = Standings;
