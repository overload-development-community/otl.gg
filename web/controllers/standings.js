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
        let recordsTitle, records1, records2, records3;

        switch (req.query.records) {
            case "server":
                recordsTitle = "Server Records";
                records1 = "Home";
                records2 = "Away";
                records3 = "Neutral";
                break;
            case "size":
                recordsTitle = "Team Size Records";
                records1 = "2v2";
                records2 = "3v3";
                records3 = "4v4";
                break;
            default:
                recordsTitle = "Map Records";
                records1 = "Home";
                records2 = "Away";
                records3 = "Neutral";
                break;
        }

        const seasonList = await Season.getSeasonNumbers(),
            season = Number.parseInt(req.query.season, 10) || void 0,
            maps = await Map.getPlayedBySeason(season),
            teams = new Teams();

        let map;
        if (maps.indexOf(req.query.map) !== -1) {
            map = req.query.map;
        }

        const standings = await Team.getSeasonStandings(isNaN(season) ? void 0 : season, recordsTitle, map);

        res.status(200).send(Common.page(
            /* html */`
                <link rel="stylesheet" href="/css/standings.css" />
            `,
            StandingsView.get({
                seasonList,
                maps,
                standings,
                season,
                records: req.query.records,
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
