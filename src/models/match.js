/**
 * @typedef {import("./match.types").ConfirmedMatch} MatchTypes.ConfirmedMatch
 * @typedef {import("./match.types").ConfirmedMatchStatData} MatchTypes.ConfirmedMatchStatData
 * @typedef {import("./match.types").CurrentMatch} MatchTypes.CurrentMatch
 * @typedef {import("./match.types").PendingMatches} MatchTypes.PendingMatches
 * @typedef {import("./match.types").UpcomingMatch} MatchTypes.UpcomingMatch
 * @typedef {import("./team.types").TeamInfo} TeamTypes.TeamInfo
 */

const Common = require("../../web/includes/common"),
    Db = require("../database/match"),
    Exception = require("../logging/exception"),
    Teams = require("../../web/includes/teams");

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
     * @returns {Promise<MatchTypes.ConfirmedMatch[]>} A promise that resolves with the completed matches.
     */
    static async getBySeason(season, page) {
        let completed;

        /** @type {MatchTypes.ConfirmedMatchStatData[]} */
        let stats;

        /** @type {TeamTypes.TeamInfo[]} */
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
                    captures: stat.captures,
                    pickups: stat.pickups,
                    carrierKills: stat.carrierKills,
                    returns: stat.returns,
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
     * @returns {Promise<MatchTypes.CurrentMatch[]>} A promise that resolves with the upcoming matches.
     */
    static async getCurrent() {
        let matches;

        /** @type {TeamTypes.TeamInfo[]} */
        let standings;

        /** @type {TeamTypes.TeamInfo[]} */
        let previousStandings;

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
     * @returns {Promise<MatchTypes.UpcomingMatch[]>} A promise that resolves with the list of upcoming matches.
     */
    static async getUpcoming() {
        try {
            return await Db.getUpcoming();
        } catch (err) {
            throw new Exception("There was a database error getting the upcoming matches.", err);
        }
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
     * @returns {Promise<MatchTypes.PendingMatches>} A promise that resolves with the season's matches.
     */
    static async getUpcomingAndCompletedCount(season) {
        let matches;

        /** @type {TeamTypes.TeamInfo[]} */
        let standings;

        /** @type {TeamTypes.TeamInfo[]} */
        let previousStandings;

        let completed;

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
