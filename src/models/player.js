/**
 * @typedef {import("../../types/playerTypes").CareerData} PlayerTypes.CareerData
 * @typedef {import("../../types/playerTypes").FreeAgent} PlayerTypes.FreeAgent
 * @typedef {import("../../types/playerTypes").GameLogData} PlayerTypes.GameLogData
 * @typedef {import("../../types/playerTypes").GameRecord} PlayerTypes.GameRecord
 * @typedef {import("../../types/playerTypes").PlayerKDAStats} PlayerTypes.PlayerKDAStats
 * @typedef {import("../../types/playerTypes").SeasonStats} PlayerTypes.SeasonStats
 */

const Db = require("../database/player"),
    Exception = require("../logging/exception");

//  ####    ##
//  #   #    #
//  #   #    #     ###   #   #   ###   # ##
//  ####     #        #  #   #  #   #  ##  #
//  #        #     ####  #  ##  #####  #
//  #        #    #   #   ## #  #      #
//  #       ###    ####      #   ###   #
//                       #   #
//                        ###
/**
 * A class that handles player-related functions.
 */
class Player {
    //              #     ##
    //              #    #  #
    //  ###   ##   ###   #      ###  ###    ##    ##   ###
    // #  #  # ##   #    #     #  #  #  #  # ##  # ##  #  #
    //  ##   ##     #    #  #  # ##  #     ##    ##    #
    // #      ##     ##   ##    # #  #      ##    ##   #
    //  ###
    /**
     * Gets a player's career data.
     * @param {number} playerId The player ID to get data for.
     * @param {number} season The season to get the player's career data for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @param {string} gameType The game type to get data for.
     * @returns {Promise<PlayerTypes.CareerData>} A promise that resolves with a player's career data.
     */
    static async getCareer(playerId, season, postseason, gameType) {
        try {
            return await Db.getCareer(playerId, season, postseason, gameType);
        } catch (err) {
            throw new Exception("There was a database error getting a player's career stats.", err);
        }
    }

    //              #    ####                     ##                      #
    //              #    #                       #  #                     #
    //  ###   ##   ###   ###   ###    ##    ##   #  #   ###   ##   ###   ###    ###
    // #  #  # ##   #    #     #  #  # ##  # ##  ####  #  #  # ##  #  #   #    ##
    //  ##   ##     #    #     #     ##    ##    #  #   ##   ##    #  #   #      ##
    // #      ##     ##  #     #      ##    ##   #  #  #      ##   #  #    ##  ###
    //  ###                                             ###
    /**
     * Gets the current list of free agents.
     * @returns {Promise<PlayerTypes.FreeAgent[]>} The list of free agents.
     */
    static async getFreeAgents() {
        try {
            return await Db.getFreeAgents();
        } catch (err) {
            throw new Exception("There was a database error getting free agents.", err);
        }
    }

    //              #     ##                     #
    //              #    #  #                    #
    //  ###   ##   ###   #      ###  # #    ##   #      ##    ###
    // #  #  # ##   #    # ##  #  #  ####  # ##  #     #  #  #  #
    //  ##   ##     #    #  #  # ##  #  #  ##    #     #  #   ##
    // #      ##     ##   ###   # #  #  #   ##   ####   ##   #
    //  ###                                                   ###
    /**
     * Gets a player's game log.
     * @param {number} playerId The player ID to get the game log for.
     * @param {number} season The season to get the player's gamelog for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<PlayerTypes.GameLogData>} A promise that resolves with a player's game log.
     */
    static async getGameLog(playerId, season, postseason) {
        try {
            return await Db.getGameLog(playerId, season, postseason);
        } catch (err) {
            throw new Exception("There was a database error getting a player's game log.", err);
        }
    }

    //              #    ###                              #
    //              #    #  #                             #
    //  ###   ##   ###   #  #   ##    ##    ##   ###    ###   ###
    // #  #  # ##   #    ###   # ##  #     #  #  #  #  #  #  ##
    //  ##   ##     #    # #   ##    #     #  #  #     #  #    ##
    // #      ##     ##  #  #   ##    ##    ##   #      ###  ###
    //  ###
    /**
     * Gets the league records.
     * @param {number} season The season to get the records for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @param {string} gameType The game type to get records for.
     * @param {string} recordType The record type to get records for.
     * @returns {Promise<Object<string, PlayerTypes.GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecords(season, postseason, gameType, recordType) {
        try {
            switch (gameType) {
                case "CTF":
                    switch (recordType) {
                        case "player":
                            return await Db.getRecordsCTFPlayer(season, postseason);
                        case "team":
                        default:
                            return await Db.getRecordsCTFTeam(season, postseason);
                    }
                case "TA":
                default:
                    switch (recordType) {
                        case "player":
                            return await Db.getRecordsTAPlayer(season, postseason);
                        case "team":
                        default:
                            return await Db.getRecordsTATeam(season, postseason);
                    }
            }
        } catch (err) {
            throw new Exception("There was a database error getting league records.", err);
        }
    }

    //              #     ##                                   ##    #           #
    //              #    #  #                                 #  #   #           #
    //  ###   ##   ###    #     ##    ###   ###    ##   ###    #    ###    ###  ###    ###
    // #  #  # ##   #      #   # ##  #  #  ##     #  #  #  #    #    #    #  #   #    ##
    //  ##   ##     #    #  #  ##    # ##    ##   #  #  #  #  #  #   #    # ##   #      ##
    // #      ##     ##   ##    ##    # #  ###     ##   #  #   ##     ##   # #    ##  ###
    //  ###
    /**
     * Gets player stats for the specified season.
     * @param {number | undefined} season The season number, or void for the latest season.
     * @param {boolean} postseason Whether to get stats for the postseason.
     * @param {string} gameType The game type to get season stats for.
     * @param {boolean} all Whether to show all players, or just players over 10% games played.
     * @returns {Promise<PlayerTypes.SeasonStats[]>} A promise that resolves with the stats.
     */
    static async getSeasonStats(season, postseason, gameType, all) {
        try {
            return await Db.getSeasonStats(season, postseason, gameType, all);
        } catch (err) {
            throw new Exception("There was a database error getting season stats for a player.", err);
        }
    }

    //              #    ###               #  #     #
    //              #     #                # #      #
    //  ###   ##   ###    #     ##   ###   ##     ###   ###
    // #  #  # ##   #     #    #  #  #  #  ##    #  #  #  #
    //  ##   ##     #     #    #  #  #  #  # #   #  #  # ##
    // #      ##     ##   #     ##   ###   #  #   ###   # #
    //  ###                          #
    /**
     * Gets all player stats for the season.
     * @returns {Promise<PlayerTypes.PlayerKDAStats[]>} A promise that resolves with the stats.
     */
    static async getTopKda() {
        try {
            return await Db.getTopKda();
        } catch (err) {
            throw new Exception("There was a database error getting the top KDA players.", err);
        }
    }
}

module.exports = Player;
