const AboutView = require("../../public/views/about"),
    Common = require("../includes/common");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//    #    #                     #
//   # #   #                     #
//  #   #  # ##    ###   #   #  ####
//  #   #  ##  #  #   #  #   #   #
//  #####  #   #  #   #  #   #   #
//  #   #  ##  #  #   #  #  ##   #  #
//  #   #  # ##    ###    ## #    ##
/**
 * A class that represents the about page.
 */
class About {
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
        res.status(200).send(await Common.page(
            "",
            {css: ["/css/about.css"]},
            AboutView.get(),
            req
        ));
    }
}

About.route = {
    path: "/about"
};

module.exports = About;
