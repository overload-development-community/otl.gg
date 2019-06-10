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
     * @returns {Promise<{match: {challengeId: number, title: string, challengingTeam: TeamRecord, challengedTeam: TeamRecord, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number, vod: string}, stats: {teamId: number, tag: string, playerId: number, name: string, kda: number, kills: number, deaths: number, assists: number}[]}[]>} A promise that resolves with the completed matches.
     */
    static async getBySeason(season, page) {
        let completed, stats, standings;
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
                    vod: match.vod
                },
                stats: stats.filter((stat) => stat.challengeId === match.challengeId).map((stat) => ({
                    teamId: stat.teamId,
                    tag: stat.tag,
                    playerId: stat.playerId,
                    name: Common.normalizeName(stat.name, stat.tag),
                    kda: (stat.kills + stat.assists) / Math.max(stat.deaths, 1),
                    kills: stat.kills,
                    assists: stat.assists,
                    deaths: stat.deaths
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
     * @param {Standing[]} standings The standings.
     * @returns {Promise<{id: number, challengingTeam: Standing, challengedTeam: Standing, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number}[]>} A promise that resolves with the upcoming matches.
     */
    static async getCurrent(standings) {
        let matches;
        try {
            matches = await Db.getCurrent();
        } catch (err) {
            throw new Exception("There was a database error getting current matches.", err);
        }

        return matches.map((match) => ({
            id: match.id,
            challengingTeam: standings.find((s) => s.teamId === match.challengingTeamId),
            challengedTeam: standings.find((s) => s.teamId === match.challengedTeamId),
            challengingTeamScore: match.challengingTeamScore,
            challengedTeamScore: match.challengedTeamScore,
            matchTime: match.matchTime,
            map: match.map,
            dateClosed: match.dateClosed,
            overtimePeriods: match.overtimePeriods
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
     * @returns {Promise<{challengeId: number, challengingTeamTag: string, challengingTeamName: string, challengedTeamTag: string, challengedTeamName: string, matchTime: Date, map: string, twitchName: string}[]>} A promise that resolves with the list of upcoming matches.
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
     * @returns {Promise<{matches: {challengeId: number, title: string, challengingTeam: TeamRecord, challengedTeam: TeamRecord, matchTime: Date, map: string, twitchName: string, timeRemaining: number}[], completed: number}>} A promise that resolves with the season's matches.
     */
    static async getUpcomingAndCompletedCount(season) {
        let matches, standings, completed;
        try {
            ({matches, standings, completed} = await Db.getPending(isNaN(season) ? void 0 : season));
        } catch (err) {
            throw new Exception("There was a database error retrieving pending matches.", err);
        }

        const teams = new Teams();

        return {
            matches: matches.map((match) => {
                const challengingTeamStandings = standings.find((standing) => standing.teamId === match.challengingTeamId),
                    challengedTeamStandings = standings.find((standing) => standing.teamId === match.challengedTeamId),
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
                    matchTime: match.matchTime,
                    map: match.map,
                    twitchName: match.twitchName,
                    timeRemaining: match.matchTime.getTime() - new Date().getTime()
                };
            }),
            completed
        };
    }
}

Match.matchesPerPage = 10;

module.exports = Match;
