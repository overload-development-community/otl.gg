const Common = require("../includes/common"),

    Match = require("../../src/models/match"),
    MatchesView = require("../../public/views/matches"),
    Season = require("../../src/models/season");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #   #          #            #
//  #   #          #            #
//  ## ##   ###   ####    ###   # ##    ###    ###
//  # # #      #   #     #   #  ##  #  #   #  #
//  #   #   ####   #     #      #   #  #####   ###
//  #   #  #   #   #  #  #   #  #   #  #          #
//  #   #   ####    ##    ###   #   #   ###   ####
/**
 * A class that represents the matches page.
 */
class Matches {
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
            season = Number.parseInt(querySeason, 10) || void 0,
            seasonList = await Season.getSeasonNumbers(),
            {matches: pending, completed: totalCompleted} = await Match.getUpcomingAndCompletedCount(isNaN(season) ? void 0 : season),
            completed = await Match.getBySeason(isNaN(season) ? void 0 : season);

        res.status(200).send(await Common.page(
            "",
            {css: ["/css/matches.css"], js: ["/views/matches/match.js", "/js/countdown.js", "/js/matches.js"]},
            MatchesView.get({
                season,
                seasonList,
                pending,
                totalCompleted,
                completed,
                matchesPerPage: Match.matchesPerPage
            }),
            req
        ));
    }
}

Matches.route = {
    path: "/matches"
};

module.exports = Matches;
