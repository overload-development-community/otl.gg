const Match = require("../../src/match");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #   #          #            #        #             #
//  #   #          #            #       # #
//  ## ##   ###   ####    ###   # ##   #   #  # ##    ##
//  # # #      #   #     #   #  ##  #  #   #  ##  #    #
//  #   #   ####   #     #      #   #  #####  ##  #    #
//  #   #  #   #   #  #  #   #  #   #  #   #  # ##     #
//  #   #   ####    ##    ###   #   #  #   #  #       ###
//                                            #
//                                            #
/**
 * A class that represents the Match API.
 */
class MatchApi {
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
        return res.json(await Match.getMatchesBySeason(req.query.season, req.query.page));
    }
}

MatchApi.route = {
    path: "/api/match"
};

module.exports = MatchApi;
