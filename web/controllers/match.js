const Common = require("../includes/common"),

    Challenge = require("../../src/models/challenge"),
    MatchView = require("../../public/views/match"),
    NotFoundView = require("../../public/views/404"),
    Weapon = require("../../src/models/weapon");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */


//  #   #          #            #
//  #   #          #            #
//  ## ##   ###   ####    ###   # ##
//  # # #      #   #     #   #  ##  #
//  #   #   ####   #     #      #   #
//  #   #  #   #   #  #  #   #  #   #
//  #   #   ####    ##    ###   #   #
/**
 * A class that represents the match page.
 */
class Match {
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
        const challengeId = isNaN(Number.parseInt(req.params.id, 10)) ? 0 : Number.parseInt(req.params.id, 10),
            challenge = await Challenge.getById(challengeId);

        if (challenge) {
            await challenge.loadDetails();

            if (!challenge.details.dateVoided) {
                const details = await challenge.getTeamDetails();

                let weapons = [];
                if (details.damage) {
                    weapons = details.damage.map((d) => d.weapon).filter((w, index, arr) => arr.indexOf(w) === index).sort((a, b) => Weapon.orderedWeapons.indexOf(a) - Weapon.orderedWeapons.indexOf(b));
                }

                res.status(200).send(await Common.page(
                    "",
                    {css: ["/css/match.css"], js: ["/js/match.js"]},
                    MatchView.get({
                        challenge,
                        details,
                        weapons,
                        gameTypeName: Challenge.getGameTypeName(challenge.details.gameType)
                    }),
                    req
                ));

                return;
            }
        }

        res.status(404).send(await Common.page(
            "",
            {css: ["/css/error.css"]},
            NotFoundView.get({message: "This match does not exist."}),
            req
        ));
    }
}

Match.route = {
    path: "/match/:id/:tag1/:tag2"
};

module.exports = Match;
