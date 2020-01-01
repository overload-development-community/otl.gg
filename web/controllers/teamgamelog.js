const Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    NotFoundView = require("../../public/views/404"),
    Season = require("../../src/models/season"),
    Team = require("../../src/models/team"),
    TeamGameLogView = require("../../public/views/teamgamelog");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #####                        ###                        #                    ####
//    #                         #   #                       #                    #   #
//    #     ###    ###   ## #   #       ###   ## #    ###   #       ###    ## #  #   #   ###    ## #   ###
//    #    #   #      #  # # #  #          #  # # #  #   #  #      #   #  #  #   ####       #  #  #   #   #
//    #    #####   ####  # # #  #  ##   ####  # # #  #####  #      #   #   ##    #       ####   ##    #####
//    #    #      #   #  # # #  #   #  #   #  # # #  #      #      #   #  #      #      #   #  #      #
//    #     ###    ####  #   #   ###    ####  #   #   ###   #####   ###    ###   #       ####   ###    ###
//                                                                        #   #                #   #
//                                                                         ###                  ###
/**
 * A class that represents the team page.
 */
class TeamGameLogPage {
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
        const tag = req.params.tag.toUpperCase(),
            pageTeam = await Team.getByNameOrTag(tag);

        if (pageTeam) {
            const seasonList = await Season.getSeasonNumbers(),
                season = isNaN(req.query.season) ? void 0 : Number.parseInt(req.query.season, 10),
                postseason = !!req.query.postseason,
                matches = await Team.getGameLog(pageTeam, season, postseason),
                teams = new Teams();

            res.status(200).send(Common.page(
                /* html */`
                    <link rel="stylesheet" href="/css/team.css" />
                `,
                TeamGameLogView.get({pageTeam, seasonList, matches, season, postseason, teams}),
                req
            ));
        } else {
            res.status(404).send(Common.page(
                /* html */`
                    <link rel="stylesheet" href="/css/error.css" />
                `,
                NotFoundView.get({message: "This team does not exist."}),
                req
            ));
        }
    }
}

TeamGameLogPage.route = {
    path: "/team/:tag/gamelog"
};

module.exports = TeamGameLogPage;
