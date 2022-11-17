/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Common = require("../includes/common"),

    NotFoundView = require("../../public/views/404"),
    OpponentView = require("../../public/views/opponent"),
    Season = require("../../src/models/season"),
    Team = require("../../src/models/team");

//   ###                                              #
//  #   #                                             #
//  #   #  # ##   # ##    ###   # ##    ###   # ##   ####
//  #   #  ##  #  ##  #  #   #  ##  #  #   #  ##  #   #
//  #   #  ##  #  ##  #  #   #  #   #  #####  #   #   #
//  #   #  # ##   # ##   #   #  #   #  #      #   #   #  #
//   ###   #      #       ###   #   #   ###   #   #    ##
//         #      #
//         #      #
/**
 * A class that represents the opponent page.
 */
class Opponent {
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
            tag1 = req.params.tag1.toUpperCase(),
            tag2 = req.params.tag2.toUpperCase(),
            team1 = await Team.getByNameOrTag(tag1),
            team2 = await Team.getByNameOrTag(tag2);

        if (team1 && team2) {
            const seasonList = await Season.getSeasonNumbers(),
                postseason = !!req.query.postseason;

            let season = isNaN(+querySeason) ? void 0 : Number.parseInt(querySeason, 10);

            seasonList.push(0);
            if (seasonList.indexOf(season) === -1) {
                season = void 0;
            }
            seasonList.pop();

            const {records, stats, matches} = await Team.getHeadToHeadStats(team1, team2, season, postseason);

            res.status(200).send(await Common.page(
                `<meta name="description" content="Head to head stats between ${team1.name} and ${team2.name}${season ? ` for season ${season}` : ""}${postseason ? " in the postseason" : ""}." />`,
                {css: ["/css/opponent.css"]},
                OpponentView.get({team1, team2, seasonList, season, postseason, records, stats, matches}),
                req
            ));
        } else {
            res.status(404).send(await Common.page(
                "",
                {css: ["/css/error.css"]},
                NotFoundView.get({message: "This matchup does not exist."}),
                req
            ));
        }
    }
}

Opponent.route = {
    path: "/team/:tag1/opponent/:tag2"
};

module.exports = Opponent;
