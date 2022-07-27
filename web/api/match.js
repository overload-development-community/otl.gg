const Match = require("../../src/models/match");

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
        const querySeason = req.query.season && req.query.season.toString() || void 0,
            queryPage = req.query.page && req.query.page.toString() || void 0,
            season = isNaN(+querySeason) ? void 0 : Number.parseInt(querySeason, 10),
            page = isNaN(+queryPage) ? void 0 : Number.parseInt(queryPage, 10);

        return res.json(await Match.getBySeason(season, page));
    }
}

MatchApi.route = {
    path: "/api/match"
};

module.exports = MatchApi;
