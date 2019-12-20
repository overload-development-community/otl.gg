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
     * @returns {Promise<{player: {name: string, twitchName: string, timezone: string, teamId: number, tag: string, teamName: string}, career: {season: number, postseason: boolean, teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number}[], careerTeams: {teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number}[], opponents: {teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestMatchTime: Date, bestMap: string, bestKills: number, bestAssists: number, bestDeaths: number}[], maps: {map: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestOpponentTeamId: number, bestOpponentTag: string, bestOpponentTeamName: string, bestMatchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number}[], matches: {challengeId: number, challengingTeamTag: string, challengedTeamTag: string, teamId: number, tag: string, name: string, kills: number, assists: number, deaths: number, overtimePeriods: number, opponentTeamId: number, opponentTag: string, opponentName: string, teamScore: number, opponentScore: number, ratingChange: number, teamSize: number, matchTime: Date, map: string, gameType: string}[]}>} A promise that resolves with a player's career data.
     */
    static async getCareer(playerId, season, postseason) {
        try {
            return await Db.getCareer(playerId, season, postseason);
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
     * @returns {Promise<{teamKda: {teamSize: number, teamKda: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], teamScore: {teamSize: number, score: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], teamAssists: {teamSize: number, assists: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], teamDeaths: {teamSize: number, deaths: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], kda: {teamSize: number, kda: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], kills: {teamSize: number, kills: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], assists: {teamSize: number, assists: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], deaths: {teamSize: number, deaths: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[]}>} A promise that resolves with the league records.
     */
    static async getRecords(season, postseason) {
        try {
            return await Db.getRecords(season, postseason);
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
     * @param {boolean} [all] Whether to show all players, or just players over 10% games played.
     * @returns {Promise<{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, avgKills: number, avgAssists: number, avgDeaths: number, kda: number}[]>} A promise that resolves with the stats.
     */
    static async getSeasonStats(season, postseason, all) {
        try {
            return await Db.getSeasonStats(season, postseason, all);
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
