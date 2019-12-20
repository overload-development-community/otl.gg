/**
 * @typedef {import("../models/challenge")} Challenge
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
     * @param {number} matchesPerPage The number of matches per page.
     * @returns {Promise<{completed: {challengeId: number, title: string, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number, vod: string, ratingChange: number, challengingTeamRating: number, challengedTeamRating: number, gameType: string}[], stats: {challengeId: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, kills: number, assists: number, deaths: number, damage: number}[], standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[]}>} A promise that resolves with the season's matches for the specified page.
     */
    static async getConfirmed(season, page, matchesPerPage) {
        const key = `${settings.redisPrefix}:db:match:getConfirmed:${season || "null"}:${page || "null"}:${matchesPerPage}`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{ChallengeId: number, Title: string, ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, MatchTime: Date, Map: string, DateClosed: Date, OvertimePeriods: number, VoD: string, RatingChange: number, ChallengingTeamRating: number, ChallengedTeamRating: number, GameType: string}[], {ChallengeId: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, Kills: number, Assists: number, Deaths: number, Damage: number}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[], {DateEnd: Date}[]]}}
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
                SUM(d.Damage) Damage
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
                s.Deaths

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
                damage: row.Damage
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
     * @returns {Promise<{matches: {id: number, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, postseason: boolean, map: string, dateClosed: Date, overtimePeriods: number, gameType: string}[], standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[], previousStandings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[]}>} A promise that resolves with the upcoming matches.
     */
    static async getCurrent() {
        const key = `${settings.redisPrefix}:db:match:getCurrent`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, MatchTime: Date, Postseason: boolean, Map: string, DateClosed: Date, OvertimePeriods: number, GameType: string}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[]]}}
         */
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
     * @returns {Promise<{matches: {challengeId: number, title: string, challengingTeamId: number, challengedTeamId: number, matchTime: Date, map: string, postseason: boolean, twitchName: string, gameType: string}[], standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[], previousStandings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[], completed: number}>} A promise that resolves with the season's matches.
     */
    static async getPending(season) {
        const key = `${settings.redisPrefix}:db:match:getPending:${season || "null"}`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{ChallengeId: number, Title: string, ChallengingTeamId: number, ChallengedTeamId: number, MatchTime: Date, Map: string, Postseason: boolean, TwitchName: string, GameType: string}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[], {Completed: number}[], {DateEnd: Date}[]]}}
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
        } || {matches: [], standings: [], completed: 0};

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
     * @returns {Promise<{matches: {id: number, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, gameType: string}[], k: number}>} A promise that resolves with the season data.
     */
    static async getSeasonDataFromChallenge(challenge) {
        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, GameType: string}[], {K: number, SeasonAdded: boolean}[]]}}
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
                    ChallengeId,
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
     * @returns {Promise<{challengeId: number, challengingTeamTag: string, challengingTeamName: string, challengedTeamTag: string, challengedTeamName: string, matchTime: Date, map: string, twitchName: string, gameType: string}[]>} A promise that resolves with the upcoming matches.
     */
    static async getUpcoming() {
        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamTag: string, ChallengingTeamName: string, ChallengedTeamTag: string, ChallengedTeamName: string, MatchTime: Date, Map: string, TwitchName: string, GameType: string}[]]}}
         */
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
