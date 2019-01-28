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
    //                                #                #  #         #          #
    //                                                 ####         #          #
    // #  #  ###    ##    ##   # #   ##    ###    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  #  #  #     #  #  ####   #    #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    // #  #  #  #  #     #  #  #  #   #    #  #   ##   #  #  # ##   #    #     #  #  ##      ##
    //  ###  ###    ##    ##   #  #  ###   #  #  #     #  #   # #    ##   ##   #  #   ##   ###
    //       #                                    ###
    /**
     * Gets the list of pending matches.
     * @returns {Promise<{challengeId: number, challengingTeamTag: string, challengingTeamName: string, challengedTeamTag: string, challengedTeamName: string, matchTime: Date, map: string}[]>} A promise that resolves with the list of upcoming matches.
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
     * @returns {Promise<string>} The validated map.
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
