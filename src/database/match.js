const Db = require("node-database"),

    settings = require("../../settings"),

    db = new Db(settings.database);

//  #   #          #            #      ####   #
//  #   #          #            #       #  #  #
//  ## ##   ###   ####    ###   # ##    #  #  # ##
//  # # #      #   #     #   #  ##  #   #  #  ##  #
//  #   #   ####   #     #      #   #   #  #  #   #
//  #   #  #   #   #  #  #   #  #   #   #  #  ##  #
//  #   #   ####    ##    ###   #   #  ####   # ##
/**
 * A class that handles calls to the database for matches.
 */
class MatchDb {
    //              #     ##                 #    #                         #
    //              #    #  #               # #                             #
    //  ###   ##   ###   #      ##   ###    #    ##    ###   # #    ##    ###
    // #  #  # ##   #    #     #  #  #  #  ###    #    #  #  ####  # ##  #  #
    //  ##   ##     #    #  #  #  #  #  #   #     #    #     #  #  ##    #  #
    // #      ##     ##   ##    ##   #  #   #    ###   #     #  #   ##    ###
    //  ###
    /**
     * Gets the confirmed matches for the specified season by page number.
     * @param {number} [season] The season number, or void for the latest season.
     * @param {number} [page] The page number, or void for the first page.
     * @returns {Promise<{completed: {challengeId: number, title: string, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number}[], stats: {challengeId: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, kills: number, assists: number, deaths: number}[], standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[]}>} A promise that resolves with the season's matches for the specified page.
     */
    static async getConfirmed(season, page) {
        /**
         * @type {{recordsets: [{ChallengeId: number, Title: string, ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, MatchTime: Date, Map: string, DateClosed: Date, OvertimePeriods: number}[], {ChallengeId: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, Kills: number, Assists: number, Deaths: number}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[]]}}
         */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT TOP 1
                    @season = Season
                FROM tblSeason
                WHERE DateStart <= GETUTCDATE()
                    AND DateEnd > GETUTCDATE()
                ORDER BY Season DESC
            END

            SELECT
                ChallengeId,
                Title,
                ChallengingTeamId,
                ChallengedTeamId,
                ChallengingTeamScore,
                ChallengedTeamScore,
                MatchTime,
                Map,
                DateClosed,
                OvertimePeriods
            FROM (
                SELECT *, ROW_NUMBER() OVER (ORDER BY MatchTime DESC) Row
                FROM vwCompletedChallenge
                WHERE MatchTime IS NOT NULL
                    AND Season = @season
                    AND DateVoided IS NULL
                    AND DateConfirmed IS NOT NULL
            ) c
            WHERE Row >= @page * 10 - 9
                AND Row <= @page * 10
            ORDER BY MatchTime DESC

            SELECT
                s.ChallengeId,
                s.TeamId,
                t.Tag,
                t.Name TeamName,
                p.PlayerId,
                p.Name,
                s.Kills,
                s.Assists,
                s.Deaths
            FROM tblStat s
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN (
                SELECT *, ROW_NUMBER() OVER (ORDER BY MatchTime DESC) Row
                FROM vwCompletedChallenge
                WHERE MatchTime IS NOT NULL
                    AND Season = @season
                    AND DateVoided IS NULL
                    AND DateConfirmed IS NOT NULL
            ) c ON s.ChallengeId = c.ChallengeId
            WHERE Row >= @page * 10 - 9
                AND Row <= @page * 10

            SELECT
                TeamId, Name, Tag, Disbanded, Locked,
                CASE WHEN Wins + Losses + Ties >= 10 THEN Rating WHEN Wins + Losses + Ties = 0 THEN NULL ELSE (Wins + Losses + Ties) * Rating / 10 END Rating,
                Wins, Losses, Ties
            FROM
            (
                SELECT
                    t.TeamId,
                    t.Name,
                    t.Tag,
                    t.Disbanded,
                    t.Locked,
                    tr.Rating,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @season
            ) a
        `, {
            season: {type: Db.INT, value: season},
            page: {type: Db.INT, value: page}
        });
        return data && data.recordsets && data.recordsets.length === 3 && {
            completed: data.recordsets[0].map((row) => ({
                challengeId: row.ChallengeId,
                title: row.Title,
                challengingTeamId: row.ChallengingTeamId,
                challengedTeamId: row.ChallengedTeamId,
                challengingTeamScore: row.ChallengingTeamScore,
                challengedTeamScore: row.ChallengedTeamScore,
                matchTime: row.MatchTime,
                map: row.Map,
                dateClosed: row.DateClosed,
                overtimePeriods: row.OvertimePeriods
            })),
            stats: data.recordsets[1].map((row) => ({
                challengeId: row.ChallengeId,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths
            })),
            standings: data.recordsets[2].map((row) => ({
                teamId: row.TeamId,
                name: row.Name,
                tag: row.Tag,
                disbanded: row.Disbanded,
                locked: row.Locked,
                rating: row.Rating,
                wins: row.Wins,
                losses: row.Losses,
                ties: row.Ties
            }))
        } || {completed: [], stats: [], standings: []};
    }

    //              #    ###                  #   #
    //              #    #  #                 #
    //  ###   ##   ###   #  #   ##   ###    ###  ##    ###    ###
    // #  #  # ##   #    ###   # ##  #  #  #  #   #    #  #  #  #
    //  ##   ##     #    #     ##    #  #  #  #   #    #  #   ##
    // #      ##     ##  #      ##   #  #   ###  ###   #  #  #
    //  ###                                                   ###
    /**
     * Gets the pending matches.  Includes the number of completed matches for the season.
     * @param {number} [season] The season number, or void for the latest season.
     * @returns {Promise<{matches: {challengeId: number, title: string, challengingTeamId: number, challengedTeamId: number, matchTime: Date, map: string, twitchName: string}[], standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[], completed: number}>} A promise that resolves with the season's matches.
     */
    static async getPending(season) {
        /**
         * @type {{recordsets: [{ChallengeId: number, Title: string, ChallengingTeamId: number, ChallengedTeamId: number, MatchTime: Date, Map: string, TwitchName: string}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[], {Completed: number}[]]}}
         */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT TOP 1
                    @season = Season
                FROM tblSeason
                WHERE DateStart <= GETUTCDATE()
                    AND DateEnd > GETUTCDATE()
                ORDER BY Season DESC
            END

            SELECT
                c.ChallengeId,
                c.Title,
                c.ChallengingTeamId,
                c.ChallengedTeamId,
                c.MatchTime,
                c.Map,
                p.TwitchName
            FROM tblChallenge c
            LEFT OUTER JOIN tblPlayer p ON c.CasterPlayerId = p.PlayerId
            WHERE MatchTime IS NOT NULL
                AND DateVoided IS NULL
                AND DateConfirmed IS NULL
                AND DateClosed IS NULL
            ORDER BY MatchTime

            SELECT
                TeamId, Name, Tag, Disbanded, Locked,
                CASE WHEN Wins + Losses + Ties >= 10 THEN Rating WHEN Wins + Losses + Ties = 0 THEN NULL ELSE (Wins + Losses + Ties) * Rating / 10 END Rating,
                Wins, Losses, Ties
            FROM
            (
                SELECT
                    t.TeamId,
                    t.Name,
                    t.Tag,
                    t.Disbanded,
                    t.Locked,
                    tr.Rating,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @season
            ) a

            SELECT COUNT(ChallengeId) Completed
            FROM vwCompletedChallenge
            WHERE MatchTime IS NOT NULL
                AND Season = @season
                AND DateVoided IS NULL
                AND DateConfirmed IS NOT NULL
        `, {season: {type: Db.INT, value: season}});

        return data && data.recordsets && data.recordsets.length === 3 && {
            matches: data.recordsets[0].map((row) => ({
                challengeId: row.ChallengeId,
                title: row.Title,
                challengingTeamId: row.ChallengingTeamId,
                challengedTeamId: row.ChallengedTeamId,
                matchTime: row.MatchTime,
                map: row.Map,
                twitchName: row.TwitchName
            })),
            standings: data.recordsets[1].map((row) => ({
                teamId: row.TeamId,
                name: row.Name,
                tag: row.Tag,
                disbanded: row.Disbanded,
                locked: row.Locked,
                rating: row.Rating,
                wins: row.Wins,
                losses: row.Losses,
                ties: row.Ties
            })),
            completed: data.recordsets[2] && data.recordsets[2][0] && data.recordsets[2][0].Completed || 0
        } || {matches: [], standings: [], completed: 0};
    }
}

module.exports = MatchDb;
