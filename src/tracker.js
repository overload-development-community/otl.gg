/**
 * @typedef {import("../types/trackerTypes").BrowserAPIResponse} TrackerTypes.BrowserAPIResponse
 * @typedef {import("../types/trackerTypes").GameAPIResponse} TrackerTypes.GameAPIResponse
 * @typedef {import("../types/trackerTypes").GameListAPIResponse} TrackerTypes.GameListAPIResponse
 */

const config = require("../settings").tracker,
    request = require("@root/request");

//  #####                       #
//    #                         #
//    #    # ##    ###    ###   #   #   ###   # ##
//    #    ##  #      #  #   #  #  #   #   #  ##  #
//    #    #       ####  #      ###    #####  #
//    #    #      #   #  #   #  #  #   #      #
//    #    #       ####   ###   #   #   ###   #
/**
 * A class that handles calls to the tracker.
 */
class Tracker {
    //              #    ###
    //              #    #  #
    //  ###   ##   ###   ###   ###    ##   #  #   ###    ##   ###
    // #  #  # ##   #    #  #  #  #  #  #  #  #  ##     # ##  #  #
    //  ##   ##     #    #  #  #     #  #  ####    ##   ##    #
    // #      ##     ##  ###   #      ##   ####  ###     ##   #
    //  ###
    /**
     * Gets the game browser data.
     * @returns {Promise<TrackerTypes.BrowserAPIResponse>} A promise that resolves with the game browser data.
     */
    static getBrowser() {
        return request.get({
            uri: `${config.baseUrl}/api/browser`,
            json: true
        });
    }

    //              #     ##                     #      #            #
    //              #    #  #                    #                   #
    //  ###   ##   ###   #      ###  # #    ##   #     ##     ###   ###
    // #  #  # ##   #    # ##  #  #  ####  # ##  #      #    ##      #
    //  ##   ##     #    #  #  # ##  #  #  ##    #      #      ##    #
    // #      ##     ##   ###   # #  #  #   ##   ####  ###   ###      ##
    //  ###
    /**
     * Gets the game list data.
     * @returns {Promise<TrackerTypes.GameListAPIResponse>} A promise that resolves with the game list data.
     */
    static getGameList() {
        return request.get({
            uri: `${config.baseUrl}/api/gamelist?page=1`,
            json: true
        });
    }

    //              #    #  #         #          #
    //              #    ####         #          #
    //  ###   ##   ###   ####   ###  ###    ##   ###
    // #  #  # ##   #    #  #  #  #   #    #     #  #
    //  ##   ##     #    #  #  # ##   #    #     #  #
    // #      ##     ##  #  #   # #    ##   ##   #  #
    //  ###
    /**
     * Gets the data for a match by ID.
     * @param {number} id The match ID to retrieve.
     * @returns {Promise<TrackerTypes.GameAPIResponse>} A promise that resolves with the match data.
     */
    static getMatch(id) {
        return request.get({
            uri: `${config.baseUrl}/api/game/${id}`,
            json: true
        });
    }
}

module.exports = Tracker;
