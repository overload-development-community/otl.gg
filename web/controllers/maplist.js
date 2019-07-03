const Common = require("../includes/common"),
    Map = require("../../src/models/map"),
    MapListView = require("../../public/views/maplist")

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #   #                #        #            #
//  #   #                #                     #
//  ## ##   ###   # ##   #       ##     ###   ####
//  # # #      #  ##  #  #        #    #       #
//  #   #   ####  ##  #  #        #     ###    #
//  #   #  #   #  # ##   #        #        #   #  #
//  #   #   ####  #      #####   ###   ####     ##
//                #
//                #
/**
 * A class that represents the map list page.
 */
class MapList {
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
        const maplist = await Map.getAllAllowed();

        res.status(200).send(Common.page(
            /* html */`
                <link rel="stylesheet" href="/css/maplist.css" />
            `,
            MapListView.get(maplist),
            req
        ));
    }
}

MapList.route = {
    path: "/maplist"
};

module.exports = MapList;
