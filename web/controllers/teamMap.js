/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Common = require("../includes/common"),
    Map = require("../../src/models/map"),
    NotFoundView = require("../../public/views/404"),
    Season = require("../../src/models/season"),
    Team = require("../../src/models/team"),
    Teams = require("../includes/teams"),
    TeamCTFMapView = require("../../public/views/teamCTFMap"),
    TeamTAMapView = require("../../public/views/teamTAMap");

//  #####                       #   #                ####
//    #                         #   #                #   #
//    #     ###    ###   ## #   ## ##   ###   # ##   #   #   ###    ## #   ###
//    #    #   #      #  # # #  # # #      #  ##  #  ####       #  #  #   #   #
//    #    #####   ####  # # #  #   #   ####  ##  #  #       ####   ##    #####
//    #    #      #   #  # # #  #   #  #   #  # ##   #      #   #  #      #
//    #     ###    ####  #   #  #   #   ####  #      #       ####   ###    ###
//                                            #                    #   #
//                                            #                     ###
/**
 * A class that represents the team map page.
 */
class TeamMapPage {
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
            pageTeam = await Team.getByNameOrTag(tag),
            gameType = req.params.gameType.toUpperCase(),
            checkMap = req.params.map;

        const map = await Map.validate(checkMap, gameType);

        if (map && ["TA", "CTF"].indexOf(gameType) !== -1 && pageTeam) {
            const seasonList = await Season.getSeasonNumbers(),
                postseason = !!req.query.postseason,
                teams = new Teams();

            let season = isNaN(+querySeason) ? void 0 : Number.parseInt(querySeason, 10);

            seasonList.push(0);
            if (seasonList.indexOf(season) === -1) {
                season = void 0;
            }
            seasonList.pop();

            switch (gameType) {
                case "TA": {
                    const teamData = await Team.getDataForTAMap(pageTeam, map.map, season, postseason);

                    teamData.stats.sort((a, b) => Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag)));

                    res.status(200).send(await Common.page(
                        `<meta name="description" content="Team stats for ${pageTeam.name}${season ? ` for season ${season}` : ""}${postseason ? " in the postseason" : ""}." />`,
                        {css: ["/css/team.css"]},
                        TeamTAMapView.get({pageTeam, map: map.map, seasonList, teamData, season, postseason, teams}),
                        req
                    ));

                    break;
                }
                case "CTF": {
                    const teamData = await Team.getDataForCTFMap(pageTeam, map.map, season, postseason);

                    teamData.stats.sort((a, b) => Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag)));

                    res.status(200).send(await Common.page(
                        `<meta name="description" content="Team stats for ${pageTeam.name}${season ? ` for season ${season}` : ""}${postseason ? " in the postseason" : ""}." />`,
                        {css: ["/css/team.css"]},
                        TeamCTFMapView.get({pageTeam, map: map.map, seasonList, teamData, season, postseason, teams}),
                        req
                    ));

                    break;
                }
            }
        } else {
            res.status(404).send(await Common.page(
                "",
                {css: ["/css/error.css"]},
                NotFoundView.get({message: "This page does not exist."}),
                req
            ));
        }
    }
}

TeamMapPage.route = {
    path: "/team/:tag/map/:gameType-:map"
};

module.exports = TeamMapPage;
