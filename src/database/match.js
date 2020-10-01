/**
 * @typedef {import("../models/challenge")} Challenge
 * @typedef {import("../../types/matchDbTypes").GetConfirmedRecordsets} MatchDbTypes.GetConfirmedRecordsets
 * @typedef {import("../../types/matchDbTypes").GetCurrentRecordsets} MatchDbTypes.GetCurrentRecordsets
 * @typedef {import("../../types/matchDbTypes").GetPendingRecordsets} MatchDbTypes.GetPendingRecordsets
 * @typedef {import("../../types/matchDbTypes").GetSeasonDataFromChallengeRecordsets} MatchDbTypes.GetSeasonDataFromChallengeRecordsets
 * @typedef {import("../../types/matchDbTypes").GetUpcomingRecordsets} MatchDbTypes.GetUpcomingRecordsets
 * @typedef {import("../../types/matchTypes").ConfirmedMatchesData} MatchTypes.ConfirmedMatchesData
 * @typedef {import("../../types/matchTypes").CurrentMatchesData} MatchTypes.CurrentMatchesData
 * @typedef {import("../../types/matchTypes").PendingMatchesData} MatchTypes.PendingMatchesData
 * @typedef {import("../../types/matchTypes").SeasonData} MatchTypes.SeasonData
 * @typedef {import("../../types/matchTypes").UpcomingMatch} MatchTypes.UpcomingMatch
 */

const Db = require("node-database"),

    Cache = require("../cache"),
    db = require("./index"),
    settings = require("../../settings");

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
     * @param {number} [matchesPerPage] The number of matches per page.
     * @returns {Promise<MatchTypes.ConfirmedMatchesData>} A promise that resolves with the season's matches for the specified page.
     */
    static async getConfirmed(season, page, matchesPerPage) {
        if (!matchesPerPage) {
            matchesPerPage = 10;
        }

        const key = `${settings.redisPrefix}:db:match:getConfirmed:${season || "null"}:${page || "null"}:${matchesPerPage}`;

        /** @type {MatchTypes.ConfirmedMatchesData} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {MatchDbTypes.GetConfirmedRecordsets} */
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
                VoD,
                RatingChange,
                ChallengingTeamRating,
                ChallengedTeamRating,
                GameType
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
                s.Deaths,
                s.Captures,
                s.Pickups,
                s.CarrierKills,
                s.Returns,
                ISNULL(SUM(d.Damage), 0) Damage
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
            LEFT OUTER JOIN tblDamage d ON c.ChallengeId = d.ChallengeId AND d.PlayerId = s.PlayerId AND d.TeamId <> d.OpponentTeamId
            WHERE Row >= @page * @matchesPerPage - (@matchesPerPage - 1)
                AND Row <= @page * @matchesPerPage
            GROUP BY
                s.ChallengeId,
                s.TeamId,
                t.Tag,
                t.Name,
                p.PlayerId,
                p.Name,
                s.Kills,
                s.Assists,
                s.Deaths,
                s.Captures,
                s.Pickups,
                s.CarrierKills,
                s.Returns

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
        cache = data && data.recordsets && data.recordsets.length >= 4 && {
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
                vod: row.VoD,
                ratingChange: row.RatingChange,
                challengingTeamRating: row.ChallengingTeamRating,
                challengedTeamRating: row.ChallengedTeamRating,
                gameType: row.GameType
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
                deaths: row.Deaths,
                damage: row.Damage,
                captures: row.Captures,
                pickups: row.Pickups,
                carrierKills: row.CarrierKills,
                returns: row.Returns
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

        Cache.add(key, cache, !season && data && data.recordsets && data.recordsets[3] && data.recordsets[3][0] && data.recordsets[3][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`]);

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
     * @returns {Promise<MatchTypes.CurrentMatchesData>} A promise that resolves with the upcoming matches.
     */
    static async getCurrent() {
        const key = `${settings.redisPrefix}:db:match:getCurrent`;

        /** @type {MatchTypes.CurrentMatchesData} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {MatchDbTypes.GetCurrentRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @currentSeason INT
            SELECT TOP 1
                @currentSeason = Season
            FROM tblSeason
            WHERE DateStart <= GETUTCDATE()
                AND DateEnd > GETUTCDATE()
            ORDER BY Season DESC

            SELECT
                ChallengeId,
                ChallengingTeamId,
                ChallengedTeamId,
                ChallengingTeamScore,
                ChallengedTeamScore,
                MatchTime,
                Postseason,
                Map,
                DateClosed,
                OvertimePeriods,
                GameType
            FROM
            (
                SELECT TOP 5
                    ChallengeId,
                    ChallengingTeamId,
                    ChallengedTeamId,
                    CASE WHEN DateConfirmed IS NULL THEN NULL ELSE ChallengingTeamScore END ChallengingTeamScore,
                    CASE WHEN DateConfirmed IS NULL THEN NULL ELSE ChallengedTeamScore END ChallengedTeamScore,
                    MatchTime,
                    Postseason,
                    Map,
                    DateClosed,
                    OvertimePeriods,
                    GameType
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
                Postseason,
                Map,
                DateClosed,
                OvertimePeriods,
                GameType
            FROM tblChallenge
            WHERE MatchTime IS NOT NULL
                AND MatchTime > GETUTCDATE()
                AND DateVoided IS NULL
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
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @currentSeason
            ) a

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
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason - 1 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason - 1 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason - 1 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @currentSeason - 1
            ) a
        `);
        cache = data && data.recordsets && data.recordsets.length === 3 && {
            matches: data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
                id: row.ChallengeId,
                challengingTeamId: row.ChallengingTeamId,
                challengedTeamId: row.ChallengedTeamId,
                challengingTeamScore: row.ChallengingTeamScore,
                challengedTeamScore: row.ChallengedTeamScore,
                matchTime: row.MatchTime,
                postseason: row.Postseason,
                map: row.Map,
                dateClosed: row.DateClosed,
                overtimePeriods: row.OvertimePeriods,
                gameType: row.GameType
            })) || [],
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
            previousStandings: data.recordsets[2].map((row) => ({
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
        } || {matches: void 0, standings: void 0, previousStandings: void 0};

        Cache.add(key, cache, void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`, `${settings.redisPrefix}:invalidate:challenge:updated`]);

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
     * @returns {Promise<MatchTypes.PendingMatchesData>} A promise that resolves with the season's matches.
     */
    static async getPending(season) {
        const key = `${settings.redisPrefix}:db:match:getPending:${season || "null"}`;

        /** @type {MatchTypes.PendingMatchesData} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {MatchDbTypes.GetPendingRecordsets} */
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

            DECLARE @currentSeason INT
            SELECT TOP 1
                @currentSeason = Season
            FROM tblSeason
            WHERE DateStart <= GETUTCDATE()
                AND DateEnd > GETUTCDATE()
            ORDER BY Season DESC

            SELECT
                c.ChallengeId,
                c.Title,
                c.ChallengingTeamId,
                c.ChallengedTeamId,
                c.MatchTime,
                c.Map,
                c.Postseason,
                p.TwitchName,
                c.GameType
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
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @currentSeason
            ) a

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
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason - 1 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason - 1 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @currentSeason - 1 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @currentSeason - 1
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
                postseason: row.Postseason,
                twitchName: row.TwitchName,
                gameType: row.GameType
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
            previousStandings: data.recordsets[2].map((row) => ({
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
            completed: data.recordsets[3] && data.recordsets[3][0] && data.recordsets[3][0].Completed || 0
        } || {matches: [], standings: [], previousStandings: [], completed: 0};

        Cache.add(key, cache, !season && data && data.recordsets && data.recordsets[4] && data.recordsets[4][0] && data.recordsets[4][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`, `${settings.redisPrefix}:invalidate:challenge:updated`]);

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
     * @returns {Promise<MatchTypes.SeasonData>} A promise that resolves with the season data.
     */
    static async getSeasonDataFromChallenge(challenge) {
        /** @type {MatchDbTypes.GetSeasonDataFromChallengeRecordsets} */
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
                    ChallengeId,
                    Season,
                    ChallengingTeamId,
                    ChallengedTeamId,
                    ChallengingTeamScore,
                    ChallengedTeamScore,
                    GameType
                FROM vwCompletedChallenge
                WHERE Season = @season
                    AND Postseason = 0
                    AND DateClosed IS NOT NULL
                ORDER BY MatchTime, ChallengeId

                SELECT @k K, @seasonAdded SeasonAdded
            END
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        if (data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].SeasonAdded) {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:season:added`]);
        }

        return data && data.recordsets && data.recordsets.length === 2 && {
            matches: data.recordsets[0] && data.recordsets[0].map((row) => ({
                id: row.ChallengeId,
                season: row.Season,
                challengingTeamId: row.ChallengingTeamId,
                challengedTeamId: row.ChallengedTeamId,
                challengingTeamScore: row.ChallengingTeamScore,
                challengedTeamScore: row.ChallengedTeamScore,
                gameType: row.GameType
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
     * @returns {Promise<MatchTypes.UpcomingMatch[]>} A promise that resolves with the upcoming matches.
     */
    static async getUpcoming() {
        /** @type {MatchDbTypes.GetUpcomingRecordsets} */
        const data = await db.query(/* sql */`
            SELECT c.ChallengeId,
                t1.Tag ChallengingTeamTag,
                t1.Name ChallengingTeamName,
                t2.Tag ChallengedTeamTag,
                t2.Name ChallengedTeamName,
                c.MatchTime,
                c.Map,
                p.TwitchName,
                c.GameType
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
            twitchName: row.TwitchName,
            gameType: row.GameType
        })) || [];
    }
}

module.exports = MatchDb;
