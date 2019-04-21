const Common = require("../web/includes/common"),
    Teams = require("../web/includes/teams"),

    Log = require("./log"),
    Db = require("./database/match");

/** @typedef {{teamId: number, name: string, tag: string, color: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}} Team */

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
    //              #    #  #         #          #                  ###          ##
    //              #    ####         #          #                  #  #        #  #
    //  ###   ##   ###   ####   ###  ###    ##   ###    ##    ###   ###   #  #   #     ##    ###   ###    ##   ###
    // #  #  # ##   #    #  #  #  #   #    #     #  #  # ##  ##     #  #  #  #    #   # ##  #  #  ##     #  #  #  #
    //  ##   ##     #    #  #  # ##   #    #     #  #  ##      ##   #  #   # #  #  #  ##    # ##    ##   #  #  #  #
    // #      ##     ##  #  #   # #    ##   ##   #  #   ##   ###    ###     #    ##    ##    # #  ###     ##   #  #
    //  ###                                                                #
    /**
     * Gets paginated matches for a season.
     * @param {number} [season] The season number.
     * @param {number} [page] The page to get.
     * @returns {Promise<{match: {challengeId: number, title: string, challengingTeam: Team, challengedTeam: Team, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number}, stats: {teamId: number, tag: string, playerId: number, name: string, kda: number, kills: number, deaths: number, assists: number}[]}[]>} A promise that resolves with the completed matches.
     */
    static async getMatchesBySeason(season, page) {
        let completed, stats, standings;
        try {
            ({completed, stats, standings} = await Db.getConfirmed(isNaN(season) ? void 0 : season, isNaN(page) ? 1 : page));
        } catch (err) {
            Log.exception("There was a database error retrieving matches by page.", err);
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
                    overtimePeriods: match.overtimePeriods
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

    //              #    ###                  #   #                #  #         #          #
    //              #    #  #                 #                    ####         #          #
    //  ###   ##   ###   #  #   ##   ###    ###  ##    ###    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  # ##   #    ###   # ##  #  #  #  #   #    #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    //  ##   ##     #    #     ##    #  #  #  #   #    #  #   ##   #  #  # ##   #    #     #  #  ##      ##
    // #      ##     ##  #      ##   #  #   ###  ###   #  #  #     #  #   # #    ##   ##   #  #   ##   ###
    //  ###                                                   ###
    /**
     * Gets the pending matches.
     * @param {number} [season] The season number.
     * @returns {Promise<{matches: {challengeId: number, title: string, challengingTeam: Team, challengedTeam: Team, matchTime: Date, map: string, twitchName: string, timeRemaining: number}[], completed: number}>} A promise that resolves with the season's matches.
     */
    static async getPendingMatches(season) {
        let matches, standings, completed;
        try {
            ({matches, standings, completed} = await Db.getPending(isNaN(season) ? void 0 : season));
        } catch (err) {
            Log.exception("There was a database error retrieving pending matches.", err);
            throw err;
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

module.exports = Match;
