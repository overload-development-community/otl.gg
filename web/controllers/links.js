/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Common = require("../includes/common"),
    LinksView = require("../../public/views/links");

//  #        #           #
//  #                    #
//  #       ##    # ##   #   #   ###
//  #        #    ##  #  #  #   #
//  #        #    #   #  ###     ###
//  #        #    #   #  #  #       #
//  #####   ###   #   #  #   #  ####
/**
 * A class that represents the links page.
 */
class Links {
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
            {css: ["/css/links.css"]},
            LinksView.get(),
            req
        ));
    }
}

Links.route = {
    path: "/links"
};

module.exports = Links;
