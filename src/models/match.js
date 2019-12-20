const Common = require("../../web/includes/common"),
    Db = require("../database/match"),
    Exception = require("../logging/exception"),
    Teams = require("../../web/includes/teams");

/**
 * @typedef {{teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, wins1: number, losses1: number, ties1: number, wins2: number, losses2: number, ties2: number, wins3: number, losses3: number, ties3: number, winsMap: number, lossesMap: number, tiesMap: number}} Standing
 * @typedef {{teamId: number, name: string, tag: string, color: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}} TeamRecord
 */

//  #   #          #            #
//  #   #          #            #
//  ## ##   ###   ####    ###   # ##
//  # # #      #   #     #   #  ##  #
//  #   #   ####   #     #      #   #
//  #   #  #   #   #  #  #   #  #   #
//  #   #   ####    ##    ###   #   #
/**
 * A class that handles match-related functions.
 */
class Match {
    //              #    ###          ##
    //              #    #  #        #  #
    //  ###   ##   ###   ###   #  #   #     ##    ###   ###    ##   ###
    // #  #  # ##   #    #  #  #  #    #   # ##  #  #  ##     #  #  #  #
    //  ##   ##     #    #  #   # #  #  #  ##    # ##    ##   #  #  #  #
    // #      ##     ##  ###     #    ##    ##    # #  ###     ##   #  #
    //  ###                     #
    /**
     * Gets paginated matches for a season.
     * @param {number} [season] The season number.
     * @param {number} [page] The page to get.
     * @returns {Promise<{match: {challengeId: number, title: string, challengingTeam: TeamRecord, challengedTeam: TeamRecord, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number, vod: string, ratingChange: number, challengingTeamRating: number, challengedTeamRating: number, gameType: string}, stats: {teamId: number, tag: string, playerId: number, name: string, kda: number, kills: number, assists: number, deaths: number, damage: number}[]}[]>} A promise that resolves with the completed matches.
     */
    static async getBySeason(season, page) {
        /** @type {{challengeId: number, title: string, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number, vod: string, ratingChange: number, challengingTeamRating: number, challengedTeamRating: number, gameType: string}[]} */
        let completed;

        /** @type {{challengeId: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, kills: number, assists: number, deaths: number, damage: number}[]} */
        let stats;

        /** @type {{teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[]} */
        let standings;
        try {
            ({completed, stats, standings} = await Db.getConfirmed(isNaN(season) ? void 0 : season, isNaN(page) ? 1 : page, Match.matchesPerPage));
        } catch (err) {
            throw new Exception("There was a database error retrieving matches by page.", err);
        }

        const teams = new Teams();

        return completed.map((match) => {
            const challengingTeamStandings = standings.find((standing) => standing.teamId === match.challengingTeamId),
                challengedTeamStandings = standings.find((standing) => standing.teamId === match.challengedTeamId),
                challengingTeam = teams.getTeam(match.challengingTeamId, challengingTeamStandings.name, challengingTeamStandings.tag, challengingTeamStandings.disbanded, challengingTeamStandings.locked),
                challengedTeam = teams.getTeam(match.challengedTeamId, challengedTeamStandings.name, challengedTeamStandings.tag, challengedTeamStandings.disbanded, challengedTeamStandings.locked);

            return {
                match: {
                    challengeId: match.challengeId,
                    title: match.title,
                    challengingTeam: {
                        teamId: challengingTeamStandings.teamId,
                        name: challengingTeamStandings.name,
                        tag: challengingTeamStandings.tag,
                        color: challengingTeam.role ? challengingTeam.role.hexColor : void 0,
                        disbanded: challengingTeamStandings.disbanded,
                        locked: challengingTeamStandings.locked,
                        rating: challengingTeamStandings.rating,
                        wins: challengingTeamStandings.wins,
                        losses: challengingTeamStandings.losses,
                        ties: challengingTeamStandings.ties
                    },
                    challengedTeam: {
                        teamId: challengedTeamStandings.teamId,
                        name: challengedTeamStandings.name,
                        tag: challengedTeamStandings.tag,
                        color: challengedTeam.role ? challengedTeam.role.hexColor : void 0,
                        disbanded: challengedTeamStandings.disbanded,
                        locked: challengedTeamStandings.locked,
                        rating: challengedTeamStandings.rating,
                        wins: challengedTeamStandings.wins,
                        losses: challengedTeamStandings.losses,
                        ties: challengedTeamStandings.ties
                    },
                    challengingTeamScore: match.challengingTeamScore,
                    challengedTeamScore: match.challengedTeamScore,
                    matchTime: match.matchTime,
                    map: match.map,
                    dateClosed: match.dateClosed,
                    overtimePeriods: match.overtimePeriods,
                    vod: match.vod,
                    ratingChange: match.ratingChange,
                    challengingTeamRating: match.challengingTeamRating,
                    challengedTeamRating: match.challengedTeamRating,
                    gameType: match.gameType
                },
                stats: stats.filter((stat) => stat.challengeId === match.challengeId).map((stat) => ({
                    teamId: stat.teamId,
                    tag: stat.tag,
                    playerId: stat.playerId,
                    name: Common.normalizeName(stat.name, stat.tag),
                    kda: (stat.kills + stat.assists) / Math.max(stat.deaths, 1),
                    kills: stat.kills,
                    assists: stat.assists,
                    deaths: stat.deaths,
                    damage: stat.damage
                }))
            };
        });
    }

    //              #     ##                                  #
    //              #    #  #                                 #
    //  ###   ##   ###   #     #  #  ###   ###    ##   ###   ###
    // #  #  # ##   #    #     #  #  #  #  #  #  # ##  #  #   #
    //  ##   ##     #    #  #  #  #  #     #     ##    #  #   #
    // #      ##     ##   ##    ###  #     #      ##   #  #    ##
    //  ###
    /**
     * Gets the current matches.
     * @returns {Promise<{id: number, challengingTeam: Standing, challengedTeam: Standing, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number, gameType: string}[]>} A promise that resolves with the upcoming matches.
     */
    static async getCurrent() {
        let matches, standings, previousStandings;
        try {
            ({matches, standings, previousStandings} = await Db.getCurrent());
        } catch (err) {
            throw new Exception("There was a database error getting current matches.", err);
        }

        return matches.map((match) => ({
            id: match.id,
            challengingTeam: (match.postseason ? previousStandings : standings).find((s) => s.teamId === match.challengingTeamId),
            challengedTeam: (match.postseason ? previousStandings : standings).find((s) => s.teamId === match.challengedTeamId),
            challengingTeamScore: match.challengingTeamScore,
            challengedTeamScore: match.challengedTeamScore,
            matchTime: match.matchTime,
            map: match.map,
            dateClosed: match.dateClosed,
            overtimePeriods: match.overtimePeriods,
            gameType: match.gameType
        }));
    }

    //              #    #  #                           #
    //              #    #  #
    //  ###   ##   ###   #  #  ###    ##    ##   # #   ##    ###    ###
    // #  #  # ##   #    #  #  #  #  #     #  #  ####   #    #  #  #  #
    //  ##   ##     #    #  #  #  #  #     #  #  #  #   #    #  #   ##
    // #      ##     ##   ##   ###    ##    ##   #  #  ###   #  #  #
    //  ###                    #                                    ###
    /**
     * Gets the list of pending matches.
     * @returns {Promise<{challengeId: number, challengingTeamTag: string, challengingTeamName: string, challengedTeamTag: string, challengedTeamName: string, matchTime: Date, map: string, twitchName: string, gameType: string}[]>} A promise that resolves with the list of upcoming matches.
     */
    static async getUpcoming() {
        let matches;
        try {
            matches = await Db.getUpcoming();
        } catch (err) {
            throw new Exception("There was a database error getting the upcoming matches.", err);
        }

        return matches;
    }

    //              #    #  #                           #                 ##            #   ##                     ##           #             #   ##                      #
    //              #    #  #                                            #  #           #  #  #                     #           #             #  #  #                     #
    //  ###   ##   ###   #  #  ###    ##    ##   # #   ##    ###    ###  #  #  ###    ###  #      ##   # #   ###    #     ##   ###    ##    ###  #      ##   #  #  ###   ###
    // #  #  # ##   #    #  #  #  #  #     #  #  ####   #    #  #  #  #  ####  #  #  #  #  #     #  #  ####  #  #   #    # ##   #    # ##  #  #  #     #  #  #  #  #  #   #
    //  ##   ##     #    #  #  #  #  #     #  #  #  #   #    #  #   ##   #  #  #  #  #  #  #  #  #  #  #  #  #  #   #    ##     #    ##    #  #  #  #  #  #  #  #  #  #   #
    // #      ##     ##   ##   ###    ##    ##   #  #  ###   #  #  #     #  #  #  #   ###   ##    ##   #  #  ###   ###    ##     ##   ##    ###   ##    ##    ###  #  #    ##
    //  ###                    #                                    ###                                      #
    /**
     * Gets the pending matches, along with the number of completed matches for the season.
     * @param {number} [season] The season number.
     * @returns {Promise<{matches: {challengeId: number, title: string, challengingTeam: TeamRecord, challengedTeam: TeamRecord, matchTime: Date, map: string, twitchName: string, timeRemaining: number, gameType: string}[], completed: number}>} A promise that resolves with the season's matches.
     */
    static async getUpcomingAndCompletedCount(season) {
        let matches, standings, previousStandings, completed;
        try {
            ({matches, standings, previousStandings, completed} = await Db.getPending(isNaN(season) ? void 0 : season));
        } catch (err) {
            throw new Exception("There was a database error retrieving pending matches.", err);
        }

        const teams = new Teams();

        return {
            matches: matches.map((match) => {
                const challengingTeamStandings = standings.find((standing) => standing.teamId === match.challengingTeamId),
                    challengedTeamStandings = standings.find((standing) => standing.teamId === match.challengedTeamId),
                    challengingTeamPreviousStandings = previousStandings.find((standing) => standing.teamId === match.challengingTeamId),
                    challengedTeamPreviousStandings = previousStandings.find((standing) => standing.teamId === match.challengedTeamId),
                    challengingTeam = teams.getTeam(match.challengingTeamId, challengingTeamStandings.name, challengingTeamStandings.tag, challengingTeamStandings.disbanded, challengingTeamStandings.locked),
                    challengedTeam = teams.getTeam(match.challengedTeamId, challengedTeamStandings.name, challengedTeamStandings.tag, challengedTeamStandings.disbanded, challengedTeamStandings.locked);

                return {
                    challengeId: match.challengeId,
                    title: match.title,
                    challengingTeam: {
                        teamId: challengingTeamStandings.teamId,
                        name: challengingTeamStandings.name,
                        tag: challengingTeamStandings.tag,
                        color: challengingTeam.role ? challengingTeam.role.hexColor : void 0,
                        disbanded: challengingTeamStandings.disbanded,
                        locked: challengingTeamStandings.locked,
                        rating: match.postseason ? challengingTeamPreviousStandings.rating : challengingTeamStandings.rating,
                        wins: match.postseason ? challengingTeamPreviousStandings.wins : challengingTeamStandings.wins,
                        losses: match.postseason ? challengingTeamPreviousStandings.losses : challengingTeamStandings.losses,
                        ties: match.postseason ? challengingTeamPreviousStandings.ties : challengingTeamStandings.ties
                    },
                    challengedTeam: {
                        teamId: challengedTeamStandings.teamId,
                        name: challengedTeamStandings.name,
                        tag: challengedTeamStandings.tag,
                        color: challengedTeam.role ? challengedTeam.role.hexColor : void 0,
                        disbanded: challengedTeamStandings.disbanded,
                        locked: challengedTeamStandings.locked,
                        rating: match.postseason ? challengedTeamPreviousStandings.rating : challengedTeamStandings.rating,
                        wins: match.postseason ? challengedTeamPreviousStandings.wins : challengedTeamStandings.wins,
                        losses: match.postseason ? challengedTeamPreviousStandings.losses : challengedTeamStandings.losses,
                        ties: match.postseason ? challengedTeamPreviousStandings.ties : challengedTeamStandings.ties
                    },
                    matchTime: match.matchTime,
                    map: match.map,
                    twitchName: match.twitchName,
                    timeRemaining: match.matchTime ? match.matchTime.getTime() - new Date().getTime() : void 0,
                    gameType: match.gameType
                };
            }),
            completed
        };
    }
}

Match.matchesPerPage = 10;

module.exports = Match;
