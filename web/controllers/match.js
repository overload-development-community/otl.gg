const Common = require("../includes/common"),

    Challenge = require("../../src/models/challenge"),
    MatchView = require("../../public/views/match"),
    NotFoundView = require("../../public/views/404");

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
        const challengeId = isNaN(req.params.id) ? 0 : Number.parseInt(req.params.id, 10),
            challenge = await Challenge.getById(challengeId);

        if (challenge) {
            await challenge.loadDetails();

            if (!challenge.details.dateVoided) {
                const details = await challenge.getTeamDetails();

                res.status(200).send(Common.page(
                    /* html */`
                        <link rel="stylesheet" href="/css/match.css" />
                    `,
                    MatchView.get({challenge, details}),
                    req
                ));

                return;
            }
        }

        res.status(404).send(Common.page(
            /* html */`
                <link rel="stylesheet" href="/css/error.css" />
            `,
            NotFoundView.get({message: "This match does not exist."}),
            req
        ));
    }
}

Match.route = {
    path: "/match/:id/:tag1/:tag2"
};

module.exports = Match;
