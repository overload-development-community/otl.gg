/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Common = require("../includes/common"),

    math = require("mathjs"),
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

            /** @type {number[]} */
            const pctDiff = [];

            matches.forEach((match) => {
                pctDiff.push((match.challengingTeamScore <= match.challengedTeamScore && match.challengingTeamId === team1.id || match.challengingTeamScore > match.challengedTeamScore && match.challengingTeamId === team2.id ? -1 : 1) * (1 - (match.challengingTeamScore <= match.challengedTeamScore ? match.challengingTeamScore / match.challengedTeamScore : match.challengedTeamScore / match.challengingTeamScore)));
            });

            const mean = pctDiff.length === 0 ? 0 : math.mean(pctDiff);

            const stdDev = pctDiff.length === 0 ? 0 : /** @type {number} */(/** @type {unknown} */(math.std(pctDiff))); // eslint-disable-line no-extra-parens

            const zScore = 1.95996398454005, // A 5% confidence level
                ebm = pctDiff.length === 0 ? 0 : zScore * stdDev / Math.sqrt(pctDiff.length),
                statistics = {
                    team1Score: mean >= 0 ? 100 : 100 + mean * 100,
                    team2Score: mean <= 0 ? 100 : 100 - mean * 100,
                    marginOfError: ebm * 100,
                    chance: pctDiff.length === 0 ? 0.5 : 1 - 0.5 * (1 - math.erf(mean / stdDev / Math.sqrt(2)))
                };

            res.status(200).send(await Common.page(
                `<meta name="description" content="Head to head stats between ${team1.name} and ${team2.name}${season ? ` for season ${season}` : ""}${postseason ? " in the postseason" : ""}." />`,
                {css: ["/css/opponent.css"]},
                OpponentView.get({team1, team2, seasonList, season, postseason, records, stats, matches, statistics}),
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
