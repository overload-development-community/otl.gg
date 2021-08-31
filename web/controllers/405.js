const Common = require("../includes/common"),
    MethodNotAllowedView = require("../../public/views/405");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #   #          #     #                 #  #   #          #       #     ##     ##                             #
//  #   #          #     #                 #  #   #          #      # #     #      #                             #
//  ## ##   ###   ####   # ##    ###    ## #  ##  #   ###   ####   #   #    #      #     ###   #   #   ###    ## #
//  # # #  #   #   #     ##  #  #   #  #  ##  # # #  #   #   #     #   #    #      #    #   #  #   #  #   #  #  ##
//  #   #  #####   #     #   #  #   #  #   #  #  ##  #   #   #     #####    #      #    #   #  # # #  #####  #   #
//  #   #  #       #  #  #   #  #   #  #  ##  #   #  #   #   #  #  #   #    #      #    #   #  # # #  #      #  ##
//  #   #   ###     ##   #   #   ###    ## #  #   #   ###     ##   #   #   ###    ###    ###    # #    ###    ## #
/**
 * A class that represents the 405 page.
 */
class MethodNotAllowed {
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
        res.status(405).send(await Common.page(
            "",
            {css: ["/css/error.css"]},
            MethodNotAllowedView.get({message: "This method not allowed."}),
            req
        ));
    }
}

MethodNotAllowed.route = {};

module.exports = MethodNotAllowed;
