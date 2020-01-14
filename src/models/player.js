/**
 * @typedef {import("../..").GameRecord} GameRecord
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
     * @returns {Promise<{player: {name: string, twitchName: string, timezone: string, teamId: number, tag: string, teamName: string}, career: {season: number, postseason: boolean, teamId: number, tag: string, teamName: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, gamesWithDamage: number, deathsInGamesWithDamage: number, overtimePeriods: number}[], careerTeams: {teamId: number, tag: string, teamName: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, gamesWithDamage: number, deathsInGamesWithDamage: number, overtimePeriods: number}[], opponents: {teamId: number, tag: string, teamName: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestMatchTime: Date, bestMap: string, bestCaptures: number, bestPickups: number, bestCarrierKills: number, bestReturns: number, bestKills: number, bestAssists: number, bestDeaths: number, bestDamage: number}[], maps: {map: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestOpponentTeamId: number, bestOpponentTag: string, bestOpponentTeamName: string, bestMatchTime: Date, bestCaptures: number, bestPickups: number, bestCarrierKills: number, bestReturns: number, bestKills: number, bestAssists: number, bestDeaths: number, bestDamage: number}[], damage: Object<string, number>}>} A promise that resolves with a player's career data.
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
     * @returns {Promise<{playerId: number, name: string, discordId: string, timezone: string}[]>} The list of free agents.
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
     * @returns {Promise<{player: {name: string, teamId: number, tag: string, teamName: string}, matches: {challengeId: number, challengingTeamTag: string, challengedTeamTag: string, teamId: number, tag: string, name: string, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number, opponentTeamId: number, opponentTag: string, opponentName: string, teamScore: number, opponentScore: number, ratingChange: number, teamSize: number, matchTime: Date, map: string, gameType: string}[], seasons: number[]}>} A promise that resolves with a player's game log.
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
     * @returns {Promise<Object<string, GameRecord[]>>} A promise that resolves with the league records.
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
     * @param {number} [season] The season number, or void for the latest season.
     * @param {boolean} postseason Whether to get stats for the postseason.
     * @param {string} gameType The game type to get season stats for.
     * @param {boolean} [all] Whether to show all players, or just players over 10% games played.
     * @returns {Promise<{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, avgCaptures: number, avgPickups: number, avgCarrierKills: number, avgReturns: number, avgKills: number, avgAssists: number, avgDeaths: number, avgDamagePerGame: number, avgDamagePerDeath: number, kda: number}[]>} A promise that resolves with the stats.
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
     * @returns {Promise<{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, kda: number}[]>} A promise that resolves with the stats.
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
