/**
 * @typedef {import("./challenge")} Challenge
 */

const Db = require("./database"),
    Elo = require("./elo"),
    Exception = require("./exception");

//   ###    #      ##
//  #   #   #       #
//  #   #  ####     #
//  #   #   #       #
//  #   #   #       #
//  #   #   #  #    #
//   ###     ##    ###
/**
 * A class that handles league-related functions.
 */
class Otl {
    //          #     #  ####                     #
    //          #     #  #                        #
    //  ###   ###   ###  ###   # #    ##   ###   ###
    // #  #  #  #  #  #  #     # #   # ##  #  #   #
    // # ##  #  #  #  #  #     # #   ##    #  #   #
    //  # #   ###   ###  ####   #     ##   #  #    ##
    /**
     * Adds an event to the database.
     * @param {string} title The title of the event.
     * @param {Date} dateStart The start of the event.
     * @param {Date} dateEnd The end of the event.
     * @returns {Promise} A promise that resolves then the event has been added.
     */
    static async addEvent(title, dateStart, dateEnd) {
        try {
            await Db.addEvent(title, dateStart, dateEnd);
        } catch (err) {
            throw new Exception("There was a database error adding an event.", err);
        }
    }

    //          #     #  #  #
    //          #     #  ####
    //  ###   ###   ###  ####   ###  ###
    // #  #  #  #  #  #  #  #  #  #  #  #
    // # ##  #  #  #  #  #  #  # ##  #  #
    //  # #   ###   ###  #  #   # #  ###
    //                               #
    /**
     * Adds a map to the OTL.
     * @param {string} map The map to add.
     * @returns {Promise} A promise that resolves when the map has been added.
     */
    static async addMap(map) {
        try {
            await Db.addMap(map);
        } catch (err) {
            throw new Exception("There was a database error adding a map.", err);
        }
    }

    //                                     ####                     #
    //                                     #                        #
    // ###    ##   # #    ##   # #    ##   ###   # #    ##   ###   ###
    // #  #  # ##  ####  #  #  # #   # ##  #     # #   # ##  #  #   #
    // #     ##    #  #  #  #  # #   ##    #     # #   ##    #  #   #
    // #      ##   #  #   ##    #     ##   ####   #     ##   #  #    ##
    /**
     * Removes an event from the database.
     * @param {string} title The title of the event.
     * @returns {Promise} A promise that resolves then the event has been removed.
     */
    static async removeEvent(title) {
        try {
            await Db.removeEvent(title);
        } catch (err) {
            throw new Exception("There was a database error removing an event.", err);
        }
    }

    //                                     #  #
    //                                     ####
    // ###    ##   # #    ##   # #    ##   ####   ###  ###
    // #  #  # ##  ####  #  #  # #   # ##  #  #  #  #  #  #
    // #     ##    #  #  #  #  # #   ##    #  #  # ##  #  #
    // #      ##   #  #   ##    #     ##   #  #   # #  ###
    //                                                 #
    /**
     * Removes a map from the OTL.
     * @param {string} map The map to remove.
     * @returns {Promise} A promise that resolves when the map has been removed.
     */
    static async removeMap(map) {
        try {
            await Db.removeMap(map);
        } catch (err) {
            throw new Exception("There was a database error removing a map.", err);
        }
    }

    //                                #                ####                     #
    //                                                 #                        #
    // #  #  ###    ##    ##   # #   ##    ###    ###  ###   # #    ##   ###   ###    ###
    // #  #  #  #  #     #  #  ####   #    #  #  #  #  #     # #   # ##  #  #   #    ##
    // #  #  #  #  #     #  #  #  #   #    #  #   ##   #     # #   ##    #  #   #      ##
    //  ###  ###    ##    ##   #  #  ###   #  #  #     ####   #     ##   #  #    ##  ###
    //       #                                    ###
    /**
     * Gets the list of upcoming events.
     * @returns {Promise<{title: string, dateStart: Date, dateEnd: Date}[]>} A promise that resolves with the upcoming events.
     */
    static async upcomingEvents() {
        let events;
        try {
            events = await Db.getUpcomingEvents();
        } catch (err) {
            throw new Exception("There was a database error getting the upcoming events.", err);
        }

        return events;
    }

    //                                #                #  #         #          #
    //                                                 ####         #          #
    // #  #  ###    ##    ##   # #   ##    ###    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  #  #  #     #  #  ####   #    #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    // #  #  #  #  #     #  #  #  #   #    #  #   ##   #  #  # ##   #    #     #  #  ##      ##
    //  ###  ###    ##    ##   #  #  ###   #  #  #     #  #   # #    ##   ##   #  #   ##   ###
    //       #                                    ###
    /**
     * Gets the list of pending matches.
     * @returns {Promise<{challengeId: number, challengingTeamTag: string, challengingTeamName: string, challengedTeamTag: string, challengedTeamName: string, matchTime: Date, map: string, twitchName: string}[]>} A promise that resolves with the list of upcoming matches.
     */
    static async upcomingMatches() {
        let matches;
        try {
            matches = await Db.getUpcomingMatches();
        } catch (err) {
            throw new Exception("There was a database error getting the upcoming matches.", err);
        }

        return matches;
    }

    //                #         #          ###          #     #                       ####               ##                                  ####                     ##   #           ##    ##
    //                #         #          #  #         #                             #                 #  #                                 #                       #  #  #            #     #
    // #  #  ###    ###   ###  ###    ##   #  #   ###  ###   ##    ###    ###   ###   ###    ##   ###    #     ##    ###   ###    ##   ###   ###   ###    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #  #  #  #  #   #    # ##  ###   #  #   #     #    #  #  #  #  ##     #     #  #  #  #    #   # ##  #  #  ##     #  #  #  #  #     #  #  #  #  ####  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #  #  #  #  #  # ##   #    ##    # #   # ##   #     #    #  #   ##     ##   #     #  #  #     #  #  ##    # ##    ##   #  #  #  #  #     #     #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ###  ###    ###   # #    ##   ##   #  #   # #    ##  ###   #  #  #     ###    #      ##   #      ##    ##    # #  ###     ##   #  #  #     #      ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //       #                                                            ###                                                                                                                                   ###
    /**
     * Updates ratings for a season from a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the ratings are updated.
     */
    static async updateRatingsForSeasonFromChallenge(challenge) {
        let data;
        try {
            data = await Db.getSeasonDataFromChallenge(challenge);
        } catch (err) {
            throw new Exception("There was a database error getting the season's matches.", err);
        }

        if (!data) {
            return;
        }

        const ratings = Elo.calculateRatings(data.matches, data.k);

        try {
            await Db.updateRatingsForSeasonFromChallenge(challenge, ratings);
        } catch (err) {
            throw new Exception("There was a database error updating season ratings.", err);
        }
    }

    //             ##     #       #         #          #  #
    //              #             #         #          ####
    // # #    ###   #    ##     ###   ###  ###    ##   ####   ###  ###
    // # #   #  #   #     #    #  #  #  #   #    # ##  #  #  #  #  #  #
    // # #   # ##   #     #    #  #  # ##   #    ##    #  #  # ##  #  #
    //  #     # #  ###   ###    ###   # #    ##   ##   #  #   # #  ###
    //                                                             #
    /**
     * Validates a map with the database.
     * @param {string} map The map to validate.
     * @returns {Promise<{map: string, stock: boolean}>} The validated map.
     */
    static async validateMap(map) {
        try {
            return await Db.validateMap(map);
        } catch (err) {
            throw new Exception("There was a database error validating a map.", err);
        }
    }
}

module.exports = Otl;