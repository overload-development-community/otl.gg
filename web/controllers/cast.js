const HtmlMinifier = require("html-minifier"),

    Common = require("../includes/common"),

    CastView = require("../../public/views/cast"),
    Challenge = require("../../src/models/challenge"),
    NotFoundView = require("../../public/views/404"),
    settings = require("../../settings");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   ###                  #
//  #   #                 #
//  #       ###    ###   ####
//  #          #  #       #
//  #       ####   ###    #
//  #   #  #   #      #   #  #
//   ###    ####  ####     ##
/**
 * A class that represents the cast page.
 */
class Cast {
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
        const challengeId = Number.parseInt(req.params.challengeId, 10) || void 0,
            challenge = await Challenge.getById(challengeId);

        if (challenge) {
            await challenge.loadDetails();
        }

        if (challenge) {
            const data = await challenge.getCastData();

            res.status(200).send(HtmlMinifier.minify(CastView.get({
                challenge,
                challengingTeamRoster: data.challengingTeamRoster.sort((a, b) => Common.normalizeName(a.name, challenge.challengingTeam.tag).localeCompare(Common.normalizeName(b.name, challenge.challengingTeam.tag))),
                challengedTeamRoster: data.challengedTeamRoster.sort((a, b) => Common.normalizeName(a.name, challenge.challengedTeam.tag).localeCompare(Common.normalizeName(b.name, challenge.challengedTeam.tag))),
                castData: data.data
            }), settings.htmlMinifier));
        } else {
            res.status(404).send(Common.page(
                "",
                {css: ["/css/error.css"]},
                NotFoundView.get({message: "There is no scheduled match with this Match ID."}),
                req
            ));
        }
    }
}

Cast.route = {
    path: "/cast/:challengeId"
};

module.exports = Cast;
