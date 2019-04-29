const Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    NotFoundView = require("../../public/views/404"),
    Season = require("../../src/models/season"),
    Team = require("../../src/models/team"),
    TeamView = require("../../public/views/team");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #####                       ####
//    #                         #   #
//    #     ###    ###   ## #   #   #   ###    ## #   ###
//    #    #   #      #  # # #  ####       #  #  #   #   #
//    #    #####   ####  # # #  #       ####   ##    #####
//    #    #      #   #  # # #  #      #   #  #      #
//    #     ###    ####  #   #  #       ####   ###    ###
//                                            #   #
//                                             ###
/**
 * A class that represents the team page.
 */
class TeamPage {
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
            const teamInfo = await pageTeam.getInfo(),
                seasonList = await Season.getSeasonNumbers(),
                season = isNaN(req.query.season) ? void 0 : Number.parseInt(req.query.season, 10),
                postseason = !!req.query.postseason,
                teamData = await Team.getData(pageTeam, season, postseason),
                teams = new Teams();

            teamInfo.members.sort((a, b) => {
                if (a.role !== b.role) {
                    return ["Founder", "Captain", void 0].indexOf(a.role) - ["Founder", "Captain", void 0].indexOf(b.role);
                }
                return Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag));
            });

            teamData.stats.sort((a, b) => Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag)));

            const timezone = await pageTeam.getTimezone();

            res.status(200).send(Common.page(
                /* html */`
                    <link rel="stylesheet" href="/css/team.css" />
                `,
                TeamView.get({pageTeam, teamInfo, timezone, seasonList, teamData, tag, season, postseason, teams}),
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

TeamPage.route = {
    path: "/team/:tag"
};

module.exports = TeamPage;
