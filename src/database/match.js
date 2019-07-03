/**
 * @typedef {import("../models/challenge")} Challenge
 */

const Cache = require("../cache"),
    Db = require("node-database"),
    db = require("./index");

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
     * @param {number} matchesPerPage The number of matches per page.
     * @returns {Promise<{completed: {challengeId: number, title: string, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number, vod: string}[], stats: {challengeId: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, kills: number, assists: number, deaths: number}[], standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[]}>} A promise that resolves with the season's matches for the specified page.
     */
    static async getConfirmed(season, page, matchesPerPage) {
        const key = `otl.gg:db:match:getConfirmed:${season || "null"}:${page || "null"}:${matchesPerPage}`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{ChallengeId: number, Title: string, ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, MatchTime: Date, Map: string, DateClosed: Date, OvertimePeriods: number, VoD: string}[], {ChallengeId: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, Kills: number, Assists: number, Deaths: number}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[], {DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season) FROM vwCompletedChallenge
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
                OvertimePeriods,
                VoD
            FROM (
                SELECT *, ROW_NUMBER() OVER (ORDER BY MatchTime DESC) Row
                FROM vwCompletedChallenge
                WHERE MatchTime IS NOT NULL
                    AND Season = @season
                    AND DateVoided IS NULL
                    AND DateConfirmed IS NOT NULL
            ) c
            WHERE Row >= @page * @matchesPerPage - (@matchesPerPage - 1)
                AND Row <= @page * @matchesPerPage
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
            WHERE Row >= @page * @matchesPerPage - (@matchesPerPage - 1)
                AND Row <= @page * @matchesPerPage

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

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            season: {type: Db.INT, value: season},
            page: {type: Db.INT, value: page},
            matchesPerPage: {type: Db.INT, value: matchesPerPage}
        });
        cache = data && data.recordsets && data.recordsets.length >= 3 && {
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
                overtimePeriods: row.OvertimePeriods,
                vod: row.VoD
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

        Cache.add(key, cache, !season && data && data.recordsets && data.recordsets[3] && data.recordsets[3][0] && data.recordsets[3][0].DateEnd || void 0, ["otl.gg:invalidate:challenge:closed"]);

        return cache;
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
     * @returns {Promise<{id: number, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number}[]>} A promise that resolves with the upcoming matches.
     */
    static async getCurrent() {
        const key = "otl.gg:db:match:getCurrent";
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, MatchTime: Date, Map: string, DateClosed: Date, OvertimePeriods: number}[], {DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT
                ChallengeId,
                ChallengingTeamId,
                ChallengedTeamId,
                ChallengingTeamScore,
                ChallengedTeamScore,
                MatchTime,
                Map,
                DateClosed,
                OvertimePeriods
            FROM
            (
                SELECT TOP 5
                    ChallengeId,
                    ChallengingTeamId,
                    ChallengedTeamId,
                    CASE WHEN DateConfirmed IS NULL THEN NULL ELSE ChallengingTeamScore END ChallengingTeamScore,
                    CASE WHEN DateConfirmed IS NULL THEN NULL ELSE ChallengedTeamScore END ChallengedTeamScore,
                    MatchTime,
                    Map,
                    DateClosed,
                    OvertimePeriods
                FROM tblChallenge
                WHERE MatchTime IS NOT NULL
                    AND MatchTime <= GETUTCDATE()
                    AND DateVoided IS NULL
                ORDER BY MatchTime DESC
            ) a
            UNION SELECT
                ChallengeId,
                ChallengingTeamId,
                ChallengedTeamId,
                CASE WHEN DateConfirmed IS NULL THEN NULL ELSE ChallengingTeamScore END ChallengingTeamScore,
                CASE WHEN DateConfirmed IS NULL THEN NULL ELSE ChallengedTeamScore END ChallengedTeamScore,
                MatchTime,
                Map,
                DateClosed,
                OvertimePeriods
            FROM tblChallenge
            WHERE MatchTime IS NOT NULL
                AND MatchTime > GETUTCDATE()
                AND DateVoided IS NULL
            ORDER BY MatchTime
        `);
        cache = data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            id: row.ChallengeId,
            challengingTeamId: row.ChallengingTeamId,
            challengedTeamId: row.ChallengedTeamId,
            challengingTeamScore: row.ChallengingTeamScore,
            challengedTeamScore: row.ChallengedTeamScore,
            matchTime: row.MatchTime,
            map: row.Map,
            dateClosed: row.DateClosed,
            overtimePeriods: row.OvertimePeriods
        })) || [];

        Cache.add(key, cache, void 0, ["otl.gg:invalidate:challenge:closed", "otl.gg:invalidate:challenge:updated"]);

        return cache;
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
        const key = `otl.gg:db:match:getPending:${season || "null"}`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{ChallengeId: number, Title: string, ChallengingTeamId: number, ChallengedTeamId: number, MatchTime: Date, Map: string, TwitchName: string}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[], {Completed: number}[], {DateEnd: Date}[]]}}
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

        cache = data && data.recordsets && data.recordsets.length >= 3 && {
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

        Cache.add(key, cache, !season && data && data.recordsets && data.recordsets[3] && data.recordsets[3][0] && data.recordsets[3][0].DateEnd || void 0, ["otl.gg:invalidate:challenge:closed", "otl.gg:invalidate:challenge:updated"]);

        return cache;
    }

    //              #     ##                                  ###          #          ####                     ##   #           ##    ##
    //              #    #  #                                 #  #         #          #                       #  #  #            #     #
    //  ###   ##   ###    #     ##    ###   ###    ##   ###   #  #   ###  ###    ###  ###   ###    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  # ##   #      #   # ##  #  #  ##     #  #  #  #  #  #  #  #   #    #  #  #     #  #  #  #  ####  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //  ##   ##     #    #  #  ##    # ##    ##   #  #  #  #  #  #  # ##   #    # ##  #     #     #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #      ##     ##   ##    ##    # #  ###     ##   #  #  ###    # #    ##   # #  #     #      ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //  ###                                                                                                                                              ###
    /**
     * Gets the season data from a challenge that is in the desired season.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<{matches: {challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number}[], k: number}>} A promise that resolves with the season data.
     */
    static async getSeasonDataFromChallenge(challenge) {
        /**
         * @type {{recordsets: [{ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number}[], {K: number, SeasonAdded: boolean}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @matchTime DATETIME
            DECLARE @k FLOAT
            DECLARE @season INT
            DECLARE @seasonAdded BIT = 0

            SELECT @matchTime = MatchTime FROM tblChallenge WHERE ChallengeId = @challengeId

            IF @matchTime IS NOT NULL
            BEGIN
                IF @matchTime < (SELECT TOP 1 DateStart FROM tblSeason ORDER BY Season)
                BEGIN
                    SELECT TOP 1 @matchTime = DateStart FROM tblSeason ORDER BY Season
                END

                WHILE NOT EXISTS(SELECT TOP 1 1 FROM tblSeason WHERE DateStart <= @matchTime And DateEnd > @matchTime)
                BEGIN
                    INSERT INTO tblSeason
                    (Season, K, DateStart, DateEnd)
                    SELECT TOP 1
                        Season + 1, K, DATEADD(MONTH, 6, DateStart), DATEADD(MONTH, 6, DateEnd)
                    FROM tblSeason
                    ORDER BY Season DESC

                    SET @seasonAdded = 1
                END

                SELECT @k = K, @season = Season FROM tblSeason WHERE DateStart <= @matchTime And DateEnd >= @matchTime

                SELECT
                    ChallengingTeamId,
                    ChallengedTeamId,
                    ChallengingTeamScore,
                    ChallengedTeamScore
                FROM vwCompletedChallenge
                WHERE Season = @season
                    AND Postseason = 0
                ORDER BY MatchTime, ChallengeId

                SELECT @k K, @seasonAdded SeasonAdded
            END
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        if (data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].SeasonAdded) {
            await Cache.invalidate(["otl.gg:invalidate:season:added"]);
        }

        return data && data.recordsets && data.recordsets.length === 2 && {
            matches: data.recordsets[0] && data.recordsets[0].map((row) => ({
                challengingTeamId: row.ChallengingTeamId,
                challengedTeamId: row.ChallengedTeamId,
                challengingTeamScore: row.ChallengingTeamScore,
                challengedTeamScore: row.ChallengedTeamScore
            })) || [],
            k: data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].K || 32
        } || void 0;
    }

    //              #    #  #                           #
    //              #    #  #
    //  ###   ##   ###   #  #  ###    ##    ##   # #   ##    ###    ###
    // #  #  # ##   #    #  #  #  #  #     #  #  ####   #    #  #  #  #
    //  ##   ##     #    #  #  #  #  #     #  #  #  #   #    #  #   ##
    // #      ##     ##   ##   ###    ##    ##   #  #  ###   #  #  #
    //  ###                    #                                    ###
    /**
     * Gets the upcoming scheduled matches.
     * @returns {Promise<{challengeId: number, challengingTeamTag: string, challengingTeamName: string, challengedTeamTag: string, challengedTeamName: string, matchTime: Date, map: string, twitchName: string}[]>} A promise that resolves with the upcoming matches.
     */
    static async getUpcoming() {
        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamTag: string, ChallengingTeamName: string, ChallengedTeamTag: string, ChallengedTeamName: string, MatchTime: Date, Map: string, TwitchName: string}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT c.ChallengeId,
                t1.Tag ChallengingTeamTag,
                t1.Name ChallengingTeamName,
                t2.Tag ChallengedTeamTag,
                t2.Name ChallengedTeamName,
                c.MatchTime,
                c.Map,
                p.TwitchName
            FROM tblChallenge c
            INNER JOIN tblTeam t1 ON c.ChallengingTeamId = t1.TeamId
            INNER JOIN tblTeam t2 ON c.ChallengedTeamId = t2.TeamId
            LEFT OUTER JOIN tblPlayer p ON c.CasterPlayerId = p.PlayerId
            WHERE c.MatchTime IS NOT NULL
                AND c.DateConfirmed IS NULL
                AND c.DateClosed IS NULL
                AND c.DateVoided IS NULL
            ORDER BY c.MatchTime
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            challengeId: row.ChallengeId,
            challengingTeamTag: row.ChallengingTeamTag,
            challengingTeamName: row.ChallengingTeamName,
            challengedTeamTag: row.ChallengedTeamTag,
            challengedTeamName: row.ChallengedTeamName,
            matchTime: row.MatchTime,
            map: row.Map,
            twitchName: row.TwitchName
        })) || [];
    }
}

module.exports = MatchDb;
