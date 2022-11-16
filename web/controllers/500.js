/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Common = require("../includes/common"),
    ServerErrorView = require("../../public/views/500");

//   ###                                      #####
//  #   #                                     #
//  #       ###   # ##   #   #   ###   # ##   #      # ##   # ##    ###   # ##
//   ###   #   #  ##  #  #   #  #   #  ##  #  ####   ##  #  ##  #  #   #  ##  #
//      #  #####  #       # #   #####  #      #      #      #      #   #  #
//  #   #  #      #       # #   #      #      #      #      #      #   #  #
//   ###    ###   #        #     ###   #      #####  #      #       ###   #
/**
 * A class that represents the 500 page.
 */
class ServerError {
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
     * @returns {Promise} A promise that resolves when the request is processed.
     */
    static async get(req, res) {
        res.status(500).send(await Common.page(
            "",
            {css: ["/css/error.css"]},
            ServerErrorView.get(),
            req
        ));
    }
}

ServerError.route = {
    path: "/500"
};

module.exports = ServerError;
