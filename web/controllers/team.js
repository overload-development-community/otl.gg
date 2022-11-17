/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    NotFoundView = require("../../public/views/404"),
    Season = require("../../src/models/season"),
    Team = require("../../src/models/team"),
    TeamView = require("../../public/views/team");

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
        const querySeason = req.query.season && req.query.season.toString() || void 0,
            tag = req.params.tag.toUpperCase(),
            pageTeam = await Team.getByNameOrTag(tag);

        if (pageTeam) {
            const teamInfo = await pageTeam.getInfo(),
                seasonList = await Season.getSeasonNumbers(),
                postseason = !!req.query.postseason,
                teams = new Teams();

            let season = isNaN(+querySeason) ? void 0 : Number.parseInt(querySeason, 10);

            seasonList.push(0);
            if (seasonList.indexOf(season) === -1) {
                season = void 0;
            }
            seasonList.pop();

            const teamData = await Team.getData(pageTeam, season, postseason);

            teamInfo.members.sort((a, b) => {
                if (a.role !== b.role) {
                    return ["Founder", "Captain", void 0].indexOf(a.role) - ["Founder", "Captain", void 0].indexOf(b.role);
                }
                return Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag));
            });

            teamData.statsTA.sort((a, b) => Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag)));
            teamData.statsCTF.sort((a, b) => Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag)));

            const timezone = await pageTeam.getTimezone();

            res.status(200).send(await Common.page(
                `<meta name="description" content="Team stats for ${pageTeam.name}${season ? ` for season ${season}` : ""}${postseason ? " in the postseason" : ""}." />`,
                {css: ["/css/team.css"]},
                TeamView.get({pageTeam, teamInfo, timezone, seasonList, teamData, season, postseason, teams}),
                req
            ));
        } else {
            res.status(404).send(await Common.page(
                "",
                {css: ["/css/error.css"]},
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
