/**
 * @typedef {import("../models/challenge")} Challenge
 * @typedef {{id?: number, challengingTeamId: number, challengedTeamId: number}} ChallengeData
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("../models/team")} Team
 */

const Cache = require("../cache"),
    Db = require("node-database"),
    db = require("./index");

//   ###   #              ##     ##                                ####   #
//  #   #  #               #      #                                 #  #  #
//  #      # ##    ###     #      #     ###   # ##    ## #   ###    #  #  # ##
//  #      ##  #      #    #      #    #   #  ##  #  #  #   #   #   #  #  ##  #
//  #      #   #   ####    #      #    #####  #   #   ##    #####   #  #  #   #
//  #   #  #   #  #   #    #      #    #      #   #  #      #       #  #  ##  #
//   ###   #   #   ####   ###    ###    ###   #   #   ###    ###   ####   # ##
//                                                   #   #
//                                                    ###
/**
 * A class that handles calls to the database for challenges.
 */
class ChallengeDb {
    //          #     #   ##    #           #
    //          #     #  #  #   #           #
    //  ###   ###   ###   #    ###    ###  ###
    // #  #  #  #  #  #    #    #    #  #   #
    // # ##  #  #  #  #  #  #   #    # ##   #
    //  # #   ###   ###   ##     ##   # #    ##
    /**
     * Adds a stat to a challenge.
     * @param {Challenge} challenge The challenge to add the stat to.
     * @param {Team} team The team to add the stat to.
     * @param {DiscordJs.GuildMember} pilot The pilot to add a stat for.
     * @param {number} kills The number of kills the pilot had.
     * @param {number} assists The number of assists the pilot had.
     * @param {number} deaths The number of deaths the pilot had.
     * @returns {Promise} A promise that resolves when the stat is added to the database.
     */
    static async addStat(challenge, team, pilot, kills, assists, deaths) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            MERGE tblStat s
                USING (VALUES (@challengeId, @teamId, @kills, @assists, @deaths, @playerId)) AS v (ChallengeId, TeamId, Kills, Assists, Deaths, PlayerId)
                ON s.ChallengeId = v.ChallengeId AND s.TeamId = v.TeamId AND s.Kills = v.Kills AND s.Assists = v.Assists AND s.Deaths = v.Deaths AND s.PlayerId = v.PlayerId
            WHEN MATCHED THEN
                UPDATE SET
                    TeamId = v.TeamId,
                    Kills = v.Kills,
                    Assists = v.Assists,
                    Deaths = v.Deaths
            WHEN NOT MATCHED THEN
                INSERT (ChallengeId, TeamId, PlayerId, Kills, Assists, Deaths) VALUES (v.ChallengeId, v.TeamId, v.PlayerId, v.Kills, v.Assists, v.Deaths);
        `, {
            discordId: {type: Db.VARCHAR(24), value: pilot.id},
            challengeId: {type: Db.INT, value: challenge.id},
            teamId: {type: Db.INT, value: team.id},
            kills: {type: Db.INT, value: kills},
            assists: {type: Db.INT, value: assists},
            deaths: {type: Db.INT, value: deaths}
        });
    }

    //          #     #   ##    #
    //          #     #  #  #   #
    //  ###   ###   ###   #    ###   ###    ##    ###  # #    ##   ###
    // #  #  #  #  #  #    #    #    #  #  # ##  #  #  ####  # ##  #  #
    // # ##  #  #  #  #  #  #   #    #     ##    # ##  #  #  ##    #
    //  # #   ###   ###   ##     ##  #      ##    # #  #  #   ##   #
    /**
     * Adds a streamer to a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The streamer to add.
     * @returns {Promise} A promise that resolves when a streamer is added to a challenge.
     */
    static async addStreamer(challenge, member) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            MERGE tblChallengeStreamer cs
                USING (VALUES (@challengeId, @playerId)) AS v (ChallengeId, PlayerId)
                ON cs.ChallengeId = v.ChallengeId AND cs.PlayerId = v.PlayerId
            WHEN NOT MATCHED THEN
                INSERT (ChallengeId, PlayerId) VALUES (v.ChallengeId, v.PlayerId);
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //       ##                #
    //        #                #
    //  ##    #     ##    ##   # #
    // #      #    #  #  #     ##
    // #      #    #  #  #     # #
    //  ##   ###    ##    ##   #  #
    /**
     * Puts a challenge on the clock.
     * @param {Team} team The team clocking the challenge.
     * @param {Challenge} challenge The challenge to clock.
     * @returns {Promise<{clocked: Date, clockDeadline: Date}>} A promise that resolves with the clocked date and the clock deadline date.
     */
    static async clock(team, challenge) {
        /**
         * @type {{recordsets: [{DateClocked: Date, DateClockDeadline: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET DateClocked = GETUTCDATE(), DateClockDeadline = DATEADD(DAY, 28, GETUTCDATE()), ClockTeamId = @teamId, DateClockDeadlineNotified = NULL WHERE ChallengeId = @challengeId

            SELECT DateClocked, DateClockDeadline FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {clocked: data.recordsets[0][0].DateClocked, clockDeadline: data.recordsets[0][0].DateClockDeadline} || void 0;
    }

    //       ##
    //        #
    //  ##    #     ##    ###    ##
    // #      #    #  #  ##     # ##
    // #      #    #  #    ##   ##
    //  ##   ###    ##   ###     ##
    /**
     * Closes a challenge.
     * @param {Challenge} challenge The challenge to close.
     * @returns {Promise} A promise that resolves when the challenge is closed.
     */
    static async close(challenge) {
        /**
         * @type {{recordsets: [{PlayerId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @challengingTeamId INT
            DECLARE @challengedTeamId INT

            SELECT @challengingTeamId = ChallengingTeamId FROM tblChallenge WHERE ChallengeId = @challengeId
            SELECT @challengedTeamId = ChallengedTeamId FROM tblChallenge WHERE ChallengeId = @challengeId

            UPDATE tblChallenge SET DateClosed = GETUTCDATE() WHERE ChallengeId = @challengeId

            IF EXISTS(SELECT TOP 1 1 FROM tblTeamPenalty WHERE TeamId = @challengingTeamId)
            BEGIN
                IF (
                    SELECT COUNT(ChallengeId)
                    FROM tblChallenge
                    WHERE (ChallengingTeamId = @challengingTeamId or ChallengedTeamId = @challengingTeamId)
                        AND DateClosed IS NOT NULL
                        AND DateConfirmed IS NOT NULL
                        AND DateVoided IS NULL
                        AND MatchTime > (SELECT DatePenalized FROM tblTeamPenalty WHERE TeamId = @challengingTeamId)
                        AND DateConfirmed > (SELECT DatePenalized FROM tblTeamPenalty WHERE TeamId = @challengingTeamId)
                        AND ChallengeId <> @challengeId
                ) >= 10
                BEGIN
                    DELETE FROM tblTeamPenalty WHERE TeamId = @challengingTeamId
                END
            END

            IF EXISTS(SELECT TOP 1 1 FROM tblTeamPenalty WHERE TeamId = @challengedTeamId)
            BEGIN
                IF (
                    SELECT COUNT(ChallengeId)
                    FROM tblChallenge
                    WHERE (ChallengingTeamId = @challengedTeamId or ChallengedTeamId = @challengedTeamId)
                        AND DateClosed IS NOT NULL
                        AND DateConfirmed IS NOT NULL
                        AND DateVoided IS NULL
                        AND MatchTime > (SELECT DatePenalized FROM tblTeamPenalty WHERE TeamId = @challengedTeamId)
                        AND DateConfirmed > (SELECT DatePenalized FROM tblTeamPenalty WHERE TeamId = @challengedTeamId)
                        AND ChallengeId <> @challengeId
                ) >= 10
                BEGIN
                    DELETE FROM tblTeamPenalty WHERE TeamId = @challengedTeamId
                END
            END

            SELECT PlayerId FROM tblStat WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0].length > 0) {
            Cache.invalidate(data.recordsets[0].map((row) => `otl.gg:invalidate:player:${row.PlayerId}:updated`).concat("otl.gg:invalidate:challenge:closed"));
        }
    }

    //                     #    #                #  #
    //                    # #                    ####
    //  ##    ##   ###    #    ##    ###   # #   ####   ###  ###
    // #     #  #  #  #  ###    #    #  #  ####  #  #  #  #  #  #
    // #     #  #  #  #   #     #    #     #  #  #  #  # ##  #  #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   # #  ###
    //                                                       #
    /**
     * Confirms a suggested neutral map for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the suggested neutral map has been confirmed.
     */
    static async confirmMap(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET Map = SuggestedMap, UsingHomeMapTeam = 0 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);
    }

    //                     #    #                ###                      ##    #
    //                    # #                     #                      #  #
    //  ##    ##   ###    #    ##    ###   # #    #     ##    ###  # #    #    ##    ####   ##
    // #     #  #  #  #  ###    #    #  #  ####   #    # ##  #  #  ####    #    #      #   # ##
    // #     #  #  #  #   #     #    #     #  #   #    ##    # ##  #  #  #  #   #     #    ##
    //  ##    ##   #  #   #    ###   #     #  #   #     ##    # #  #  #   ##   ###   ####   ##
    /**
     * Confirms a suggested team size for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the suggested team size has been confirmed.
     */
    static async confirmTeamSize(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET TeamSize = SuggestedTeamSize, SuggestedTeamSize = NULL, SuggestedTeamSizeTeamId = NULL WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                     #    #                ###    #
    //                    # #                     #
    //  ##    ##   ###    #    ##    ###   # #    #    ##    # #    ##
    // #     #  #  #  #  ###    #    #  #  ####   #     #    ####  # ##
    // #     #  #  #  #   #     #    #     #  #   #     #    #  #  ##
    //  ##    ##   #  #   #    ###   #     #  #   #    ###   #  #   ##
    /**
     * Confirms a suggested time for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the suggested time has been confirmed.
     */
    static async confirmTime(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET MatchTime = SuggestedTime, SuggestedTime = NULL, SuggestedTimeTeamId = NULL, DateMatchTimeNotified = NULL, DateMatchTimePassedNotified = NULL WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);
    }

    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Creates a challenge between two teams.
     * @param {Team} team1 The first team.
     * @param {Team} team2 The second team.
     * @param {boolean} adminCreated Whether the challenge is admin-created.
     * @param {Team} [homeMapTeam] The home map team.
     * @param {Team} [homeServerTeam] The home server team.
     * @param {number} [teamSize] The team size.
     * @param {boolean} [startNow] Whether to start the match now.
     * @returns {Promise<{id: number, orangeTeam: Team, blueTeam: Team, homeMapTeam: Team, homeServerTeam: Team, team1Penalized: boolean, team2Penalized: boolean}>} A promise that resolves with the challenge ID.
     */
    static async create(team1, team2, adminCreated, homeMapTeam, homeServerTeam, teamSize, startNow) {
        let date;

        /**
         * @type {{recordsets: [{ChallengeId: number, OrangeTeamId: number, BlueTeamId: number, HomeMapTeamId: number, HomeServerTeamId: number, Team1Penalized: boolean, Team2Penalized: boolean}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @orangeTeamId INT
            DECLARE @blueTeamId INT
            DECLARE @homeMapTeamId INT
            DECLARE @homeServerTeamId INT
            DECLARE @team1Penalized BIT
            DECLARE @team2Penalized BIT
            DECLARE @challengeId INT

            SELECT
                @orangeTeamId = CASE WHEN Team1Orange < Team2Orange THEN @team1Id WHEN Team1Orange > Team2Orange THEN @team2Id WHEN @colorSeed < 0.5 THEN @team1Id ELSE @team2Id END,
                @blueTeamId = CASE WHEN Team1Orange > Team2Orange THEN @team1Id WHEN Team1Orange < Team2Orange THEN @team2Id WHEN @colorSeed >= 0.5 THEN @team1Id ELSE @team2Id END,
                @homeMapTeamId = CASE WHEN @requestedHomeMapTeamId IS NOT NULL THEN @requestedHomeMapTeamId WHEN Team1Penalties = 0 AND Team2Penalties > 0 THEN @team1Id WHEN Team1Penalties > 0 AND Team2Penalties = 0 THEN @team2Id WHEN Team1HomeMap < Team2HomeMap THEN @team1Id WHEN Team1HomeMap > Team2HomeMap THEN @team2Id WHEN @mapSeed < 0.5 THEN @team1Id ELSE @team2Id END,
                @homeServerTeamId = CASE WHEN @requestedHomeServerTeamId IS NOT NULL THEN @requestedHomeServerTeamId WHEN Team1Penalties = 0 AND Team2Penalties > 0 THEN @team1Id WHEN Team1Penalties > 0 AND Team2Penalties = 0 THEN @team2Id WHEN Team1HomeServer < Team2HomeServer THEN @team1Id WHEN Team1HomeServer > Team2HomeServer THEN @team2Id WHEN @serverSeed < 0.5 THEN @team1Id ELSE @team2Id END,
                @team1Penalized = CASE WHEN @adminCreated = 0 AND Team1Penalties > 0 THEN 1 ELSE 0 END,
                @team2Penalized = CASE WHEN @adminCreated = 0 AND Team2Penalties > 0 THEN 1 ELSE 0 END
            FROM (
                SELECT ISNULL(SUM(CASE WHEN OrangeTeamId = @team1Id THEN 1 ELSE 0 END), 0) Team1Orange,
                    ISNULL(SUM(CASE WHEN OrangeTeamId = @team2Id THEN 1 ELSE 0 END), 0) Team2Orange,
                    ISNULL(SUM(CASE WHEN UsingHomeMapTeam = 1 AND ChallengingTeamPenalized = ChallengedTeamPenalized AND HomeMapTeamId = @team1Id THEN 1 ELSE 0 END), 0) Team1HomeMap,
                    ISNULL(SUM(CASE WHEN UsingHomeMapTeam = 1 AND ChallengingTeamPenalized = ChallengedTeamPenalized AND HomeMapTeamId = @team2Id THEN 1 ELSE 0 END), 0) Team2HomeMap,
                    ISNULL(SUM(CASE WHEN UsingHomeServerTeam = 1 AND ChallengingTeamPenalized = ChallengedTeamPenalized AND HomeServerTeamId = @team1Id THEN 1 ELSE 0 END), 0) Team1HomeServer,
                    ISNULL(SUM(CASE WHEN UsingHomeServerTeam = 1 AND ChallengingTeamPenalized = ChallengedTeamPenalized AND HomeServerTeamId = @team2Id THEN 1 ELSE 0 END), 0) Team2HomeServer,
                    ISNULL((SELECT PenaltiesRemaining FROM tblTeamPenalty WHERE TeamId = @team1Id), 0) Team1Penalties,
                    ISNULL((SELECT PenaltiesRemaining FROM tblTeamPenalty WHERE TeamId = @team2Id), 0) Team2Penalties
                FROM tblChallenge
                WHERE ((ChallengingTeamId = @team1Id AND ChallengedTeamId = @team2Id) OR (ChallengingTeamId = @team2Id AND ChallengedTeamId = @team1Id))
                    AND DateVoided IS NULL
            ) a

            EXEC sp_getapplock @Resource = 'tblChallenge', @LockMode = 'Update', @LockOwner = 'Session', @LockTimeout = 10000

            SELECT @challengeId = COUNT(ChallengeId) + 1 FROM tblChallenge

            INSERT INTO tblChallenge (
                ChallengeId,
                ChallengingTeamId,
                ChallengedTeamId,
                OrangeTeamId,
                BlueTeamId,
                HomeMapTeamId,
                HomeServerTeamId,
                ChallengingTeamPenalized,
                ChallengedTeamPenalized,
                AdminCreated
            ) VALUES (
                @challengeId,
                @team1Id,
                @team2Id,
                @orangeTeamId,
                @blueTeamId,
                @homeMapTeamId,
                @homeServerTeamId,
                @team1Penalized,
                @team2Penalized,
                @adminCreated
            )

            EXEC sp_releaseapplock @Resource = 'tblChallenge', @LockOwner = 'Session'

            IF @adminCreated = 0
            BEGIN
                UPDATE tblTeamPenalty
                SET PenaltiesRemaining = PenaltiesRemaining - 1
                WHERE (TeamId = @team1Id OR TeamId = @team2Id)
                    AND PenaltiesRemaining > 0
            END

            IF @teamSize IS NOT NULL
            BEGIN
                UPDATE tblChallenge SET TeamSize = @teamSize WHERE ChallengeId = @challengeId
            END

            IF @matchTime IS NOT NULL
            BEGIN
                UPDATE tblChallenge SET MatchTime = @matchTime WHERE ChallengeId = @challengeId
            END

            INSERT INTO tblChallengeHome (ChallengeId, Number, Map)
            SELECT @challengeId, Number, Map
            FROM tblTeamHome
            WHERE TeamId = @homeMapTeamId

            SELECT
                @challengeId ChallengeId,
                @orangeTeamId OrangeTeamId,
                @blueTeamId BlueTeamId,
                @homeMapTeamId HomeMapTeamId,
                @homeServerTeamId HomeServerTeamId,
                @team1Penalized Team1Penalized,
                @team2Penalized Team2Penalized
        `, {
            team1Id: {type: Db.INT, value: team1.id},
            team2Id: {type: Db.INT, value: team2.id},
            colorSeed: {type: Db.FLOAT, value: Math.random()},
            mapSeed: {type: Db.FLOAT, value: Math.random()},
            serverSeed: {type: Db.FLOAT, value: Math.random()},
            adminCreated: {type: Db.BIT, value: adminCreated},
            requestedHomeMapTeamId: {type: Db.INT, value: homeMapTeam ? homeMapTeam.id : void 0},
            requestedHomeServerTeamId: {type: Db.INT, value: homeServerTeam ? homeServerTeam.id : void 0},
            requestedNeutralServer: {type: Db.BIT, value: homeServerTeam === null},
            teamSize: {type: Db.INT, value: teamSize},
            matchTime: {type: Db.DATETIME, value: startNow ? new Date((date = new Date()).getTime() + 300000 - date.getTime() % 300000) : void 0}
        });

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {
            id: data.recordsets[0][0].ChallengeId,
            orangeTeam: data.recordsets[0][0].OrangeTeamId === team1.id ? team1 : team2,
            blueTeam: data.recordsets[0][0].BlueTeamId === team1.id ? team1 : team2,
            homeMapTeam: data.recordsets[0][0].HomeMapTeamId === team1.id ? team1 : team2,
            homeServerTeam: data.recordsets[0][0].HomeServerTeamId === team1.id ? team1 : team2,
            team1Penalized: data.recordsets[0][0].Team1Penalized,
            team2Penalized: data.recordsets[0][0].Team2Penalized
        } || void 0;
    }

    //              #                   #
    //              #                   #
    //  ##   #  #  ###    ##   ###    ###
    // # ##   ##    #    # ##  #  #  #  #
    // ##     ##    #    ##    #  #  #  #
    //  ##   #  #    ##   ##   #  #   ###
    /**
     * Extends a challenge.
     * @param {Challenge} challenge The challenge to extend.
     * @returns {Promise<Date>} A promise that resolves with the extended clock deadline.
     */
    static async extend(challenge) {
        /**
         * @type {{recordsets: [{DateClockDeadline: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET
                DateClockDeadline = CASE WHEN DateClockDeadline IS NULL THEN NULL ELSE DATEADD(DAY, 14, GETUTCDATE()) END,
                MatchTime = NULL,
                SuggestedTime = NULL,
                SuggestedTimeTeamId = NULL,
                DateMatchTimeNotified = NULL,
                DateMatchTimePassedNotified = NULL,
                DateClockDeadlineNotified = NULL
            WHERE ChallengeId = @challengeId

            SELECT DateClockDeadline FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateClockDeadline || void 0;
    }

    //              #     ##   ##    ##    ###         ###
    //              #    #  #   #     #    #  #         #
    //  ###   ##   ###   #  #   #     #    ###   #  #   #     ##    ###  # #
    // #  #  # ##   #    ####   #     #    #  #  #  #   #    # ##  #  #  ####
    //  ##   ##     #    #  #   #     #    #  #   # #   #    ##    # ##  #  #
    // #      ##     ##  #  #  ###   ###   ###     #    #     ##    # #  #  #
    //  ###                                       #
    /**
     * Gets all challenges for a team.
     * @param {Team} team The team.
     * @returns {Promise<ChallengeData[]>} A promise that resolves with an array of challenge data.
     */
    static async getAllByTeam(team) {
        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT ChallengeId, ChallengingTeamId, ChallengedTeamId
            FROM tblChallenge
            WHERE (ChallengingTeamId = @teamId OR ChallengedTeamId = @teamId)
                AND DateConfirmed IS NULL
                AND DateClosed IS NULL
                AND DateVoided IS NULL
        `, {
            teamId: {type: Db.INT, value: team.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({id: row.ChallengeId, challengingTeamId: row.ChallengingTeamId, challengedTeamId: row.ChallengedTeamId})) || [];
    }

    //              #     ##   ##    ##    ###         ###
    //              #    #  #   #     #    #  #         #
    //  ###   ##   ###   #  #   #     #    ###   #  #   #     ##    ###  # #    ###
    // #  #  # ##   #    ####   #     #    #  #  #  #   #    # ##  #  #  ####  ##
    //  ##   ##     #    #  #   #     #    #  #   # #   #    ##    # ##  #  #    ##
    // #      ##     ##  #  #  ###   ###   ###     #    #     ##    # #  #  #  ###
    //  ###                                       #
    /**
     * Gets all challenges for two teams.
     * @param {Team} team1 The first team.
     * @param {Team} team2 The second team.
     * @returns {Promise<ChallengeData[]>} A promise that resolves with an array of challenge data.
     */
    static async getAllByTeams(team1, team2) {
        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT ChallengeId, ChallengingTeamId, ChallengedTeamId
            FROM tblChallenge
            WHERE (ChallengingTeamId = @team1Id OR ChallengedTeamId = @team1Id)
                AND (ChallengingTeamId = @team2Id OR ChallengedTeamId = @team2Id)
                AND DateVoided IS NULL
        `, {
            team1Id: {type: Db.INT, value: team1.id},
            team2Id: {type: Db.INT, value: team2.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({id: row.ChallengeId, challengingTeamId: row.ChallengingTeamId, challengedTeamId: row.ChallengedTeamId})) || [];
    }

    //              #    ###         ###      #
    //              #    #  #         #       #
    //  ###   ##   ###   ###   #  #   #     ###
    // #  #  # ##   #    #  #  #  #   #    #  #
    //  ##   ##     #    #  #   # #   #    #  #
    // #      ##     ##  ###     #   ###    ###
    //  ###                     #
    /**
     * Gets a challenge by its ID.
     * @param {number} id The ID number of the challenge.
     * @returns {Promise<ChallengeData>} A promise that resolves with the challenge data.
     */
    static async getById(id) {
        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT ChallengeId, ChallengingTeamId, ChallengedTeamId FROM tblChallenge WHERE ChallengeId = @id
        `, {id: {type: Db.INT, value: id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].ChallengeId, challengingTeamId: data.recordsets[0][0].ChallengingTeamId, challengedTeamId: data.recordsets[0][0].ChallengedTeamId} || void 0;
    }

    //              #    ###         ###
    //              #    #  #         #
    //  ###   ##   ###   ###   #  #   #     ##    ###  # #    ###
    // #  #  # ##   #    #  #  #  #   #    # ##  #  #  ####  ##
    //  ##   ##     #    #  #   # #   #    ##    # ##  #  #    ##
    // #      ##     ##  ###     #    #     ##    # #  #  #  ###
    //  ###                     #
    /**
     * Gets a challenge between two teams.
     * @param {Team} team1 The first team.
     * @param {Team} team2 The second team.
     * @returns {Promise<ChallengeData>} A promise that resolves with the challenge data.
     */
    static async getByTeams(team1, team2) {
        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT TOP 1 ChallengeId, ChallengingTeamId, ChallengedTeamId
            FROM tblChallenge
            WHERE ((ChallengingTeamId = @team1Id AND ChallengedTeamId = @team2Id) OR (ChallengingTeamId = @team2Id AND ChallengedTeamId = @team1Id))
                AND DateConfirmed IS NULL
                AND DateClosed IS NULL
                AND DateVoided IS NULL
            ORDER BY ChallengeId
        `, {
            team1Id: {type: Db.INT, value: team1.id},
            team2Id: {type: Db.INT, value: team2.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].ChallengeId, challengingTeamId: data.recordsets[0][0].ChallengingTeamId, challengedTeamId: data.recordsets[0][0].ChallengedTeamId} || void 0;
    }

    //              #     ##                 #    ###          #
    //              #    #  #                #    #  #         #
    //  ###   ##   ###   #      ###   ###   ###   #  #   ###  ###    ###
    // #  #  # ##   #    #     #  #  ##      #    #  #  #  #   #    #  #
    //  ##   ##     #    #  #  # ##    ##    #    #  #  # ##   #    # ##
    // #      ##     ##   ##    # #  ###      ##  ###    # #    ##   # #
    //  ###
    /**
     * Gets challenge data for use in casting.
     * @param {Challenge} challenge The challenge being cast.
     * @returns {Promise<{data: {challengingTeamWins: number, challengingTeamLosses: number, challengingTeamTies: number, challengingTeamRating: number, challengedTeamWins: number, challengedTeamLosses: number, challengedTeamTies: number, challengedTeamRating: number, challengingTeamHeadToHeadWins: number, challengedTeamHeadToHeadWins: number, headToHeadTies: number, challengingTeamId: number, challengingTeamScore: number, challengedTeamId: number, challengedTeamScore: number, map: string, matchTime: Date, name: string, teamId: number, kills: number, assists: number, deaths: number}, challengingTeamRoster: {name: string, games: number, kills: number, assists: number, deaths: number, twitchName: string}[], challengedTeamRoster: {name: string, games: number, kills: number, assists: number, deaths: number, twitchName: string}[]}>} A promise that resolves with the challenge data.
     */
    static async getCastData(challenge) {
        /**
         * @type {{recordsets: [{ChallengingTeamWins: number, ChallengingTeamLosses: number, ChallengingTeamTies: number, ChallengingTeamRating: number, ChallengedTeamWins: number, ChallengedTeamLosses: number, ChallengedTeamTies: number, ChallengedTeamRating: number, ChallengingTeamHeadToHeadWins: number, ChallengedTeamHeadToHeadWins: number, HeadToHeadTies: number, ChallengingTeamId: number, ChallengingTeamScore: number, ChallengedTeamId: number, ChallengedTeamScore: number, Map: string, MatchTime: Date, Name: string, TeamId: number, Kills: number, Assists: number, Deaths: number}[], {Name: string, Games: number, Kills: number, Assists: number, Deaths: number, TwitchName: string}[], {Name: string, Games: number, Kills: number, Assists: number, Deaths: number, TwitchName: string}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @season INT

            SELECT TOP 1
                @season = Season
            FROM tblSeason
            WHERE DateStart <= GETUTCDATE()
                AND DateEnd > GETUTCDATE()
            ORDER BY Season DESC

            IF EXISTS(SELECT TOP 1 1 FROM tblChallenge WHERE ChallengeId = @challengeId AND Postseason = 1)
            BEGIN
                SET @season = @season - 1
            END

            SELECT
                ChallengingTeamWins, ChallengingTeamLosses, ChallengingTeamTies,
                CASE WHEN ChallengingTeamWins + ChallengingTeamLosses + ChallengingTeamTies < 10 THEN (ChallengingTeamWins + ChallengingTeamLosses + ChallengingTeamTies) * ChallengingTeamRating / 10 ELSE ChallengingTeamRating END ChallengingTeamRating,
                ChallengedTeamWins, ChallengedTeamLosses, ChallengedTeamTies,
                CASE WHEN ChallengedTeamWins + ChallengedTeamLosses + ChallengedTeamTies < 10 THEN (ChallengedTeamWins + ChallengedTeamLosses + ChallengedTeamTies) * ChallengedTeamRating / 10 ELSE ChallengedTeamRating END ChallengedTeamRating,
                ChallengingTeamHeadToHeadWins, ChallengedTeamHeadToHeadWins, HeadToHeadTies, ChallengingTeamId, ChallengingTeamScore, ChallengedTeamId, ChallengedTeamScore, Map, MatchTime, Name, TeamId, Kills, Assists, Deaths
            FROM (
                SELECT
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND ((cc.ChallengingTeamId = c.ChallengingTeamId AND cc.ChallengingTeamScore > cc.ChallengedTeamScore) OR (cc.ChallengedTeamId = c.ChallengingTeamId AND cc.ChallengedTeamScore > cc.ChallengingTeamScore))) ChallengingTeamWins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND ((cc.ChallengingTeamId = c.ChallengingTeamId AND cc.ChallengingTeamScore < cc.ChallengedTeamScore) OR (cc.ChallengedTeamId = c.ChallengingTeamId AND cc.ChallengedTeamScore < cc.ChallengingTeamScore))) ChallengingTeamLosses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND (cc.ChallengingTeamId = c.ChallengingTeamId OR cc.ChallengedTeamId = c.ChallengingTeamId) AND cc.ChallengedTeamScore = cc.ChallengingTeamScore) ChallengingTeamTies,
                    tr1.Rating ChallengingTeamRating,
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND ((cc.ChallengingTeamId = c.ChallengedTeamId AND cc.ChallengingTeamScore > cc.ChallengedTeamScore) OR (cc.ChallengedTeamId = c.ChallengedTeamId AND cc.ChallengedTeamScore > cc.ChallengingTeamScore))) ChallengedTeamWins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND ((cc.ChallengingTeamId = c.ChallengedTeamId AND cc.ChallengingTeamScore < cc.ChallengedTeamScore) OR (cc.ChallengedTeamId = c.ChallengedTeamId AND cc.ChallengedTeamScore < cc.ChallengingTeamScore))) ChallengedTeamLosses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND (cc.ChallengingTeamId = c.ChallengedTeamId OR cc.ChallengedTeamId = c.ChallengedTeamId) AND cc.ChallengedTeamScore = cc.ChallengingTeamScore) ChallengedTeamTies,
                    tr2.Rating ChallengedTeamRating,
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND ((cc.ChallengingTeamId = c.ChallengingTeamId AND cc.ChallengedTeamId = c.ChallengedTeamId AND cc.ChallengingTeamScore > cc.ChallengedTeamScore) OR (cc.ChallengedTeamId = c.ChallengingTeamId AND cc.ChallengingTeamId = c.ChallengedTeamId AND cc.ChallengedTeamScore > cc.ChallengingTeamScore))) ChallengingTeamHeadToHeadWins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND ((cc.ChallengingTeamId = c.ChallengingTeamId AND cc.ChallengedTeamId = c.ChallengedTeamId AND cc.ChallengingTeamScore < cc.ChallengedTeamScore) OR (cc.ChallengedTeamId = c.ChallengingTeamId AND cc.ChallengingTeamId = c.ChallengedTeamId AND cc.ChallengedTeamScore < cc.ChallengingTeamScore))) ChallengedTeamHeadToHeadWins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge cc WHERE Season = @season AND (cc.ChallengingTeamId = c.ChallengingTeamId OR cc.ChallengedTeamId = c.ChallengingTeamId) AND (cc.ChallengingTeamId = c.ChallengedTeamId OR cc.ChallengedTeamId = c.ChallengedTeamId) AND cc.ChallengedTeamScore = cc.ChallengingTeamScore) HeadToHeadTies,
                    s.ChallengingTeamId,
                    s.ChallengingTeamScore,
                    s.ChallengedTeamId,
                    s.ChallengedTeamScore,
                    s.Map,
                    s.MatchTime,
                    s.Name,
                    s.TeamId,
                    s.Kills,
                    s.Assists,
                    s.Deaths
                FROM tblChallenge c
                LEFT OUTER JOIN tblTeamRating tr1 ON c.ChallengingTeamId = tr1.TeamId AND tr1.Season = @season
                LEFT OUTER JOIN tblTeamRating tr2 ON c.ChallengedTeamId = tr2.TeamId AND tr2.Season = @season
                LEFT OUTER JOIN (
                    SELECT
                        ROW_NUMBER() OVER (PARTITION BY CASE WHEN c.ChallengingTeamId < c.ChallengedTeamId THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END, CASE WHEN c.ChallengingTeamId > c.ChallengedTeamId THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END ORDER BY c.MatchTime DESC) Row,
                        c.ChallengeId,
                        c.ChallengingTeamId,
                        c.ChallengingTeamScore,
                        c.ChallengedTeamId,
                        c.ChallengedTeamScore,
                        c.Map,
                        c.MatchTime,
                        p.Name,
                        s.TeamId,
                        s.Kills,
                        s.Assists,
                        s.Deaths
                    FROM vwCompletedChallenge c
                    INNER JOIN (
                        SELECT
                            ROW_NUMBER() OVER (PARTITION BY ChallengeId ORDER BY CAST(Kills + Assists AS FLOAT) / CASE WHEN Deaths < 1 THEN 1 ELSE Deaths END DESC) Row,
                            ChallengeId,
                            PlayerId,
                            TeamId,
                            Kills,
                            Assists,
                            Deaths
                        FROM tblStat
                    ) s ON c.ChallengeId = s.ChallengeId AND s.Row = 1
                    INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
                ) s ON ((c.ChallengingTeamId = s.ChallengingTeamId AND c.ChallengedTeamId = s.ChallengedTeamId) OR (c.ChallengingTeamId = s.ChallengedTeamId AND c.ChallengedTeamId = s.ChallengingTeamId)) AND s.Row = 1
                WHERE c.ChallengeId = @challengeId
            ) a

            SELECT p.Name, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, CASE WHEN cs.StreamerId IS NULL THEN NULL ELSE p.TwitchName END TwitchName
            FROM tblRoster r
            INNER JOIN tblPlayer p ON r.PlayerId = p.PlayerId
            INNER JOIN tblChallenge c ON c.ChallengingTeamId = r.TeamId
            LEFT JOIN tblChallengeStreamer cs ON c.ChallengeId = cs.ChallengeId AND p.PlayerId = cs.PlayerId
            LEFT JOIN (
                tblStat s
                INNER JOIN vwCompletedChallenge cc ON s.ChallengeId = cc.ChallengeId
            ) ON r.PlayerId = s.PlayerId
            WHERE c.ChallengeId = @challengeId
            GROUP BY s.PlayerId, p.Name, CASE WHEN cs.StreamerId IS NULL THEN NULL ELSE p.TwitchName END
            ORDER BY p.Name

            SELECT p.Name, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, CASE WHEN cs.StreamerId IS NULL THEN NULL ELSE p.TwitchName END TwitchName
            FROM tblRoster r
            INNER JOIN tblPlayer p ON r.PlayerId = p.PlayerId
            INNER JOIN tblChallenge c ON c.ChallengedTeamId = r.TeamId
            LEFT JOIN tblChallengeStreamer cs ON c.ChallengeId = cs.ChallengeId AND p.PlayerId = cs.PlayerId
            LEFT JOIN (
                tblStat s
                INNER JOIN vwCompletedChallenge cc ON s.ChallengeId = cc.ChallengeId
            ) ON r.PlayerId = s.PlayerId
            WHERE c.ChallengeId = @challengeId
            GROUP BY s.PlayerId, p.Name, CASE WHEN cs.StreamerId IS NULL THEN NULL ELSE p.TwitchName END
            ORDER BY p.Name
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets.length === 3 && {
            data: data.recordsets[0][0] && {
                challengingTeamWins: data.recordsets[0][0].ChallengingTeamWins,
                challengingTeamLosses: data.recordsets[0][0].ChallengingTeamLosses,
                challengingTeamTies: data.recordsets[0][0].ChallengingTeamTies,
                challengingTeamRating: data.recordsets[0][0].ChallengingTeamRating,
                challengedTeamWins: data.recordsets[0][0].ChallengedTeamWins,
                challengedTeamLosses: data.recordsets[0][0].ChallengedTeamLosses,
                challengedTeamTies: data.recordsets[0][0].ChallengedTeamTies,
                challengedTeamRating: data.recordsets[0][0].ChallengedTeamRating,
                challengingTeamHeadToHeadWins: data.recordsets[0][0].ChallengingTeamHeadToHeadWins,
                challengedTeamHeadToHeadWins: data.recordsets[0][0].ChallengedTeamHeadToHeadWins,
                headToHeadTies: data.recordsets[0][0].HeadToHeadTies,
                challengingTeamId: data.recordsets[0][0].ChallengingTeamId,
                challengingTeamScore: data.recordsets[0][0].ChallengingTeamScore,
                challengedTeamId: data.recordsets[0][0].ChallengedTeamId,
                challengedTeamScore: data.recordsets[0][0].ChallengedTeamScore,
                map: data.recordsets[0][0].Map,
                matchTime: data.recordsets[0][0].MatchTime,
                name: data.recordsets[0][0].Name,
                teamId: data.recordsets[0][0].TeamId,
                kills: data.recordsets[0][0].Kills,
                assists: data.recordsets[0][0].Assists,
                deaths: data.recordsets[0][0].Deaths
            } || void 0,
            challengingTeamRoster: data.recordsets[1].map((row) => ({
                name: row.Name,
                games: row.Games,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                twitchName: row.TwitchName
            })),
            challengedTeamRoster: data.recordsets[2].map((row) => ({
                name: row.Name,
                games: row.Games,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                twitchName: row.TwitchName
            }))
        } || {data: void 0, challengingTeamRoster: void 0, challengedTeamRoster: void 0};
    }

    //              #    ###          #           #    ##
    //              #    #  #         #                 #
    //  ###   ##   ###   #  #   ##   ###    ###  ##     #     ###
    // #  #  # ##   #    #  #  # ##   #    #  #   #     #    ##
    //  ##   ##     #    #  #  ##     #    # ##   #     #      ##
    // #      ##     ##  ###    ##     ##   # #  ###   ###   ###
    //  ###
    /**
     * Gets the details of a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<{title: string, orangeTeamId: number, blueTeamId: number, map: string, teamSize: number, matchTime: Date, postseason: boolean, homeMapTeamId: number, homeServerTeamId: number, adminCreated: boolean, homesLocked: boolean, usingHomeMapTeam: boolean, usingHomeServerTeam: boolean, challengingTeamPenalized: boolean, challengedTeamPenalized: boolean, suggestedMap: string, suggestedMapTeamId: number, suggestedNeutralServerTeamId: number, suggestedTeamSize: number, suggestedTeamSizeTeamId: number, suggestedTime: Date, suggestedTimeTeamId: number, reportingTeamId: number, challengingTeamScore: number, challengedTeamScore: number, casterDiscordId: string, dateAdded: Date, dateClocked: Date, clockTeamId: number, dateClockDeadline: Date, dateClockDeadlineNotified: Date, dateReported: Date, dateConfirmed: Date, dateClosed: Date, dateRematchRequested: Date, rematchTeamId: number, dateRematched: Date, dateVoided: Date, overtimePeriods: number, vod: string, homeMaps: string[]}>} A promise that resolves with the challenge details.
     */
    static async getDetails(challenge) {
        /**
         * @type {{recordsets: [{Title: string, OrangeTeamId: number, BlueTeamId: number, Map: string, TeamSize: number, MatchTime: Date, Postseason: boolean, HomeMapTeamId: number, HomeServerTeamId: number, AdminCreated: boolean, HomesLocked: boolean, UsingHomeMapTeam: boolean, UsingHomeServerTeam: boolean, ChallengingTeamPenalized: boolean, ChallengedTeamPenalized: boolean, SuggestedMap: string, SuggestedMapTeamId: number, SuggestedNeutralServerTeamId: number, SuggestedTeamSize: number, SuggestedTeamSizeTeamId: number, SuggestedTime: Date, SuggestedTimeTeamId: number, ReportingTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, DateAdded: Date, DateClocked: Date, ClockTeamId: number, DiscordId: string, DateClockDeadline: Date, DateClockDeadlineNotified: Date, DateReported: Date, DateConfirmed: Date, DateClosed: Date, DateRematchRequested: Date, RematchTeamId: number, DateRematched: Date, OvertimePeriods: number, DateVoided: Date, VoD: string}[], {Map: string}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT
                c.Title,
                c.OrangeTeamId,
                c.BlueTeamId,
                c.Map,
                c.TeamSize,
                c.MatchTime,
                c.Postseason,
                c.HomeMapTeamId,
                c.HomeServerTeamId,
                c.AdminCreated,
                c.HomesLocked,
                c.UsingHomeMapTeam,
                c.UsingHomeServerTeam,
                c.ChallengingTeamPenalized,
                c.ChallengedTeamPenalized,
                c.SuggestedMap,
                c.SuggestedMapTeamId,
                c.SuggestedNeutralServerTeamId,
                c.SuggestedTeamSize,
                c.SuggestedTeamSizeTeamId,
                c.SuggestedTime,
                c.SuggestedTimeTeamId,
                c.ReportingTeamId,
                c.ChallengingTeamScore,
                c.ChallengedTeamScore,
                c.DateAdded,
                c.ClockTeamId,
                p.DiscordId,
                c.DateClocked,
                c.DateClockDeadline,
                c.DateClockDeadlineNotified,
                c.DateReported,
                c.DateConfirmed,
                c.DateClosed,
                c.DateRematchRequested,
                c.RematchTeamId,
                c.DateRematched,
                c.DateVoided,
                c.OvertimePeriods,
                c.VoD
            FROM tblChallenge c
            LEFT OUTER JOIN tblPlayer p ON c.CasterPlayerId = p.PlayerId
            WHERE c.ChallengeId = @challengeId

            SELECT Map FROM tblChallengeHome WHERE ChallengeId = @challengeId ORDER BY Number
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {
            title: data.recordsets[0][0].Title,
            orangeTeamId: data.recordsets[0][0].OrangeTeamId,
            blueTeamId: data.recordsets[0][0].BlueTeamId,
            map: data.recordsets[0][0].Map,
            teamSize: data.recordsets[0][0].TeamSize,
            matchTime: data.recordsets[0][0].MatchTime,
            postseason: data.recordsets[0][0].Postseason,
            homeMapTeamId: data.recordsets[0][0].HomeMapTeamId,
            homeServerTeamId: data.recordsets[0][0].HomeServerTeamId,
            adminCreated: data.recordsets[0][0].AdminCreated,
            homesLocked: data.recordsets[0][0].HomesLocked,
            usingHomeMapTeam: data.recordsets[0][0].UsingHomeMapTeam,
            usingHomeServerTeam: data.recordsets[0][0].UsingHomeServerTeam,
            challengingTeamPenalized: data.recordsets[0][0].ChallengingTeamPenalized,
            challengedTeamPenalized: data.recordsets[0][0].ChallengedTeamPenalized,
            suggestedMap: data.recordsets[0][0].SuggestedMap,
            suggestedMapTeamId: data.recordsets[0][0].SuggestedMapTeamId,
            suggestedNeutralServerTeamId: data.recordsets[0][0].SuggestedNeutralServerTeamId,
            suggestedTeamSize: data.recordsets[0][0].SuggestedTeamSize,
            suggestedTeamSizeTeamId: data.recordsets[0][0].SuggestedTeamSizeTeamId,
            suggestedTime: data.recordsets[0][0].SuggestedTime,
            suggestedTimeTeamId: data.recordsets[0][0].SuggestedTimeTeamId,
            reportingTeamId: data.recordsets[0][0].ReportingTeamId,
            challengingTeamScore: data.recordsets[0][0].ChallengingTeamScore,
            challengedTeamScore: data.recordsets[0][0].ChallengedTeamScore,
            dateAdded: data.recordsets[0][0].DateAdded,
            dateClocked: data.recordsets[0][0].DateClocked,
            clockTeamId: data.recordsets[0][0].ClockTeamId,
            casterDiscordId: data.recordsets[0][0].DiscordId,
            dateClockDeadline: data.recordsets[0][0].DateClockDeadline,
            dateClockDeadlineNotified: data.recordsets[0][0].DateClockDeadlineNotified,
            dateReported: data.recordsets[0][0].DateReported,
            dateConfirmed: data.recordsets[0][0].DateConfirmed,
            dateClosed: data.recordsets[0][0].DateClosed,
            dateVoided: data.recordsets[0][0].DateVoided,
            dateRematchRequested: data.recordsets[0][0].DateRematchRequested,
            rematchTeamId: data.recordsets[0][0].RematchTeamId,
            dateRematched: data.recordsets[0][0].DateRematched,
            overtimePeriods: data.recordsets[0][0].OvertimePeriods,
            vod: data.recordsets[0][0].VoD,
            homeMaps: data.recordsets[1] && data.recordsets[1].map((row) => row.Map) || void 0
        } || void 0;
    }

    //              #    #  #         #     #      #    #                 #     #
    //              #    ## #         #           # #                     #
    //  ###   ##   ###   ## #   ##   ###   ##     #    ##     ##    ###  ###   ##     ##   ###    ###
    // #  #  # ##   #    # ##  #  #   #     #    ###    #    #     #  #   #     #    #  #  #  #  ##
    //  ##   ##     #    # ##  #  #   #     #     #     #    #     # ##   #     #    #  #  #  #    ##
    // #      ##     ##  #  #   ##     ##  ###    #    ###    ##    # #    ##  ###    ##   #  #  ###
    //  ###
    /**
     * Gets the notifications to send out.
     * @returns {Promise<{expiredClocks: {challengeId: number, dateClockDeadline: Date}[], startingMatches: {challengeId: number, matchTime: Date}[], missedMatches: {challengeId: number, matchTime: Date}[]}>} A promise that resolves with the notifications to send out.
     */
    static async getNotifications() {
        /**
         * @type {{recordsets: [{ChallengeId: number, DateClockDeadline: Date}[], {ChallengeId: number, MatchTime: Date}[], {ChallengeId: number, MatchTime: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT ChallengeId, DateClockDeadline
            FROM tblChallenge
            WHERE DateClockDeadlineNotified IS NULL
                AND DateClosed IS NULL

            SELECT ChallengeId, MatchTime
            FROM tblChallenge
            WHERE DateMatchTimeNotified IS NULL
                AND DateConfirmed IS NULL
                AND DateVoided IS NULL
                AND DateClosed IS NULL

            SELECT ChallengeId, MatchTime
            FROM tblChallenge
            WHERE DateMatchTimePassedNotified IS NULL
                AND DateConfirmed IS NULL
                AND DateVoided IS NULL
                AND DateClosed IS NULL
        `);
        return data && data.recordsets && data.recordsets.length === 3 && {
            expiredClocks: data.recordsets[0].map((row) => ({
                challengeId: row.ChallengeId,
                dateClockDeadline: row.DateClockDeadline
            })),
            startingMatches: data.recordsets[1].map((row) => ({
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime
            })),
            missedMatches: data.recordsets[2].map((row) => ({
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime
            }))
        } || {expiredClocks: [], startingMatches: [], missedMatches: []};
    }

    //              #     ##    #           #           ####              ###
    //              #    #  #   #           #           #                  #
    //  ###   ##   ###    #    ###    ###  ###    ###   ###    ##   ###    #     ##    ###  # #
    // #  #  # ##   #      #    #    #  #   #    ##     #     #  #  #  #   #    # ##  #  #  ####
    //  ##   ##     #    #  #   #    # ##   #      ##   #     #  #  #      #    ##    # ##  #  #
    // #      ##     ##   ##     ##   # #    ##  ###    #      ##   #      #     ##    # #  #  #
    //  ###
    /**
     * Gets the team stats for a challenge.
     * @param {Challenge} challenge The challenge to get stats for.
     * @param {Team} team The team to get stats for.
     * @returns {Promise<{discordId: string, kills: number, assists: number, deaths: number}[]>} A promise that resolves with the team's stats for the challenge.
     */
    static async getStatsForTeam(challenge, team) {
        /**
         * @type {{recordsets: [{DiscordId: string, Kills: number, Assists: number, Deaths: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT p.DiscordId, s.Kills, s.Assists, s.Deaths
            FROM tblStat s
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE s.ChallengeId = @challengeId
                AND s.TeamId = @teamId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            teamId: {type: Db.INT, value: team.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({discordId: row.DiscordId, kills: row.Kills, assists: row.Assists, deaths: row.Deaths})) || [];
    }

    //              #     ##    #
    //              #    #  #   #
    //  ###   ##   ###    #    ###   ###    ##    ###  # #    ##   ###    ###
    // #  #  # ##   #      #    #    #  #  # ##  #  #  ####  # ##  #  #  ##
    //  ##   ##     #    #  #   #    #     ##    # ##  #  #  ##    #       ##
    // #      ##     ##   ##     ##  #      ##    # #  #  #   ##   #     ###
    //  ###
    /**
     * Gets the pilots who will be streaming the challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<{discordId: string, twitchName: string}[]>} A promise that resolves with the list of streamers for the challenge.
     */
    static async getStreamers(challenge) {
        /**
         * @type {{recordsets: [{DiscordId: string, TwitchName: string}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT p.DiscordId, p.TwitchName
            FROM tblPlayer p
            INNER JOIN tblChallengeStreamer cs ON p.PlayerId = cs.PlayerId
            WHERE cs.ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({discordId: row.DiscordId, twitchName: row.TwitchName})) || [];
    }

    //              #    ###                     ###          #           #    ##
    //              #     #                      #  #         #                 #
    //  ###   ##   ###    #     ##    ###  # #   #  #   ##   ###    ###  ##     #     ###
    // #  #  # ##   #     #    # ##  #  #  ####  #  #  # ##   #    #  #   #     #    ##
    //  ##   ##     #     #    ##    # ##  #  #  #  #  ##     #    # ##   #     #      ##
    // #      ##     ##   #     ##    # #  #  #  ###    ##     ##   # #  ###   ###   ###
    //  ###
    /**
     * Gets the team details for a challenge.
     * @param {Challenge} challenge The challenge.
     * @return {Promise<{teams: {teamId: number, name: string, tag: string, rating: number, wins: number, losses: number, ties: number}[], stats: {playerId: number, name: string, teamId: number, kills: number, assists: number, deaths: number, twitchName: string}[], season: {season: number, postseason: boolean}}>} A promise that resolves with the team details for the challenge.
     */
    static async getTeamDetails(challenge) {
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Rating: number, Wins: number, Losses: number, Ties: number}[], {PlayerId: number, Name: string, TeamId: number, Kills: number, Assists: number, Deaths: number, TwitchName: string}[], {Season: number, Postseason: boolean}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @season INT
            DECLARE @postseason BIT
            DECLARE @challengingTeamId INT
            DECLARE @challengedTeamId INT

            SELECT @season = Season,
                @postseason = Postseason,
                @challengingTeamId = ChallengingTeamId,
                @challengedTeamId = ChallengedTeamId
            FROM vwCompletedChallenge
            WHERE ChallengeId = @challengeId

            IF @season IS NULL
            BEGIN
                DECLARE @matchTime DATETIME

                SELECT @matchTime = MatchTime,
                    @postseason = Postseason,
                    @challengingTeamId = ChallengingTeamId,
                    @challengedTeamId = ChallengedTeamId
                FROM tblChallenge
                WHERE ChallengeId = @challengeId

                SELECT @season = MAX(Season)
                FROM tblSeason
                WHERE @matchTime IS NULL OR (@matchTime >= DateStart AND @matchTime < DateEnd)
            END

            SELECT
                TeamId, Name, Tag,
                CASE WHEN Wins + Losses + Ties >= 10 THEN Rating WHEN Wins + Losses + Ties = 0 THEN NULL ELSE (Wins + Losses + Ties) * Rating / 10 END Rating,
                Wins, Losses, Ties
            FROM
            (
                SELECT
                    t.TeamId,
                    t.Name,
                    t.Tag,
                    tr.Rating,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @season
                WHERE t.TeamId IN (@challengingTeamId, @challengedTeamId)
            ) a

            SELECT s.PlayerId, p.Name, s.TeamId, s.Kills, s.Assists, s.Deaths, CASE WHEN cs.StreamerId IS NULL THEN NULL ELSE p.TwitchName END TwitchName
            FROM tblStat s
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN tblChallengeStreamer cs ON s.ChallengeID = cs.ChallengeID AND p.PlayerID = cs.PlayerID
            WHERE s.ChallengeId = @challengeId

            SELECT @Season Season, @Postseason Postseason
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets.length === 3 && {
            teams: data.recordsets[0].map((row) => ({
                teamId: row.TeamId,
                name: row.Name,
                tag: row.Tag,
                rating: row.Rating,
                wins: row.Wins,
                losses: row.Losses,
                ties: row.Ties
            })),
            stats: data.recordsets[1].map((row) => ({
                playerId: row.PlayerId,
                name: row.Name,
                teamId: row.TeamId,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                twitchName: row.TwitchName
            })),
            season: data.recordsets[2] && data.recordsets[2][0] && {season: data.recordsets[2][0].Season, postseason: data.recordsets[2][0].Postseason} || void 0
        } || {teams: void 0, stats: void 0, season: void 0};
    }

    //        #          #     #  #
    //                   #     ####
    // ###   ##     ##   # #   ####   ###  ###
    // #  #   #    #     ##    #  #  #  #  #  #
    // #  #   #    #     # #   #  #  # ##  #  #
    // ###   ###    ##   #  #  #  #   # #  ###
    // #                                   #
    /**
     * Picks the map for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {number} number The number of the map, 1, 2, or 3.
     * @returns {Promise<string>} A promise that resolves with the name of the map that was picked.
     */
    static async pickMap(challenge, number) {
        /**
         * @type {{recordsets: [{Map: string}[]]}}
         */
        const data = await db.query(/* sql */`
            UPDATE c
            SET Map = ch.Map,
                UsingHomeMapTeam = 1
            FROM tblChallenge c
            INNER JOIN tblChallengeHome ch ON c.ChallengeId = ch.ChallengeId
            WHERE c.ChallengeId = @challengeId
                AND ch.Number = @number

            SELECT Map FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            number: {type: Db.INT, value: number}
        });

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Map || void 0;
    }

    //                                      ##    #           #
    //                                     #  #   #           #
    // ###    ##   # #    ##   # #    ##    #    ###    ###  ###
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #   #
    // #     ##    #  #  #  #  # #   ##    #  #   #    # ##   #
    // #      ##   #  #   ##    #     ##    ##     ##   # #    ##
    /**
     * Removes a stat from a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @returns {Promise} A promise that resolves when the stat has been removed.
     */
    static async removeStat(challenge, pilot) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            DELETE FROM tblStat WHERE ChallengeId = @challengeId AND PlayerId = @playerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: pilot.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                      ##    #
    //                                     #  #   #
    // ###    ##   # #    ##   # #    ##    #    ###   ###    ##    ###  # #    ##   ###
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #  # ##  #  #  ####  # ##  #  #
    // #     ##    #  #  #  #  # #   ##    #  #   #    #     ##    # ##  #  #  ##    #
    // #      ##   #  #   ##    #     ##    ##     ##  #      ##    # #  #  #   ##   #
    /**
     * Removes a streamer from a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The streamer to remove.
     * @returns {Promise} A promise that resolves when a streamer is removed from a challenge.
     */
    static async removeStreamer(challenge, member) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            DELETE FROM tblChallengeStreamer
            WHERE ChallengeId = @challengeId
                AND PlayerId = @playerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                #
    //                                #
    // ###    ##   ###    ##   ###   ###
    // #  #  # ##  #  #  #  #  #  #   #
    // #     ##    #  #  #  #  #      #
    // #      ##   ###    ##   #       ##
    //             #
    /**
     * Reports a match.
     * @param {Challenge} challenge The challenge.
     * @param {Team} reportingTeam The reporting team.
     * @param {number} challengingTeamScore The challenging team's score.
     * @param {number} challengedTeamScore The challenged team's score.
     * @returns {Promise<Date>} A promise that resolves with the date the match was reported.
     */
    static async report(challenge, reportingTeam, challengingTeamScore, challengedTeamScore) {
        /**
         * @type {{recordsets: [{DateReported: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET
                ReportingTeamId = @reportingTeamId,
                ChallengingTeamScore = @challengingTeamScore,
                ChallengedTeamScore = @challengedTeamScore,
                DateReported = GETUTCDATE()
            WHERE ChallengeId = @challengeId

            SELECT DateReported FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {
            reportingTeamId: {type: Db.INT, value: reportingTeam.id},
            challengingTeamScore: {type: Db.INT, value: challengingTeamScore},
            challengedTeamScore: {type: Db.INT, value: challengedTeamScore},
            challengeId: {type: Db.INT, value: challenge.id}
        });

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateReported || void 0;
    }

    //                                       #    ###                      #          #
    //                                       #    #  #                     #          #
    // ###    ##    ###  #  #   ##    ###   ###   #  #   ##   # #    ###  ###    ##   ###
    // #  #  # ##  #  #  #  #  # ##  ##      #    ###   # ##  ####  #  #   #    #     #  #
    // #     ##    #  #  #  #  ##      ##    #    # #   ##    #  #  # ##   #    #     #  #
    // #      ##    ###   ###   ##   ###      ##  #  #   ##   #  #   # #    ##   ##   #  #
    //                #
    /**
     * Logs a request for a rematch for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team requesting the rematch.
     * @returns {Promise} A promise that resolves when the rematch has been requested.
     */
    static async requestRematch(challenge, team) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET RematchTeamId = @teamId, DateRematchRequested = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //               #     ##                 #
    //               #    #  #                #
    //  ###    ##   ###   #      ###   ###   ###    ##   ###
    // ##     # ##   #    #     #  #  ##      #    # ##  #  #
    //   ##   ##     #    #  #  # ##    ##    #    ##    #
    // ###     ##     ##   ##    # #  ###      ##   ##   #
    /**
     * Sets a caster for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} [member] The caster.
     * @returns {Promise} A promise that resolves when a caster is added to a challenge.
     */
    static async setCaster(challenge, member) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblChallenge SET CasterPlayerId = @playerId WHERE ChallengeId = @challengeId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //               #     ##                 #    #                         #
    //               #    #  #               # #                             #
    //  ###    ##   ###   #      ##   ###    #    ##    ###   # #    ##    ###
    // ##     # ##   #    #     #  #  #  #  ###    #    #  #  ####  # ##  #  #
    //   ##   ##     #    #  #  #  #  #  #   #     #    #     #  #  ##    #  #
    // ###     ##     ##   ##    ##   #  #   #    ###   #     #  #   ##    ###
    /**
     * Confirms a reported match.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<Date>} A promise that resolves with the date the match was confirmed.
     */
    static async setConfirmed(challenge) {
        /**
         * @type {{recordsets: [{DateConfirmed: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET DateConfirmed = GETUTCDATE() WHERE ChallengeId = @challengeId

            SELECT DateConfirmed FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateConfirmed || void 0;
    }

    //               #    #  #                    #  #              ###
    //               #    #  #                    ####               #
    //  ###    ##   ###   ####   ##   # #    ##   ####   ###  ###    #     ##    ###  # #
    // ##     # ##   #    #  #  #  #  ####  # ##  #  #  #  #  #  #   #    # ##  #  #  ####
    //   ##   ##     #    #  #  #  #  #  #  ##    #  #  # ##  #  #   #    ##    # ##  #  #
    // ###     ##     ##  #  #   ##   #  #   ##   #  #   # #  ###    #     ##    # #  #  #
    //                                                        #
    /**
     * Sets the home map team for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The new home map team.
     * @returns {Promise<string[]>} A promise that resolves with the new home map team's home maps.
     */
    static async setHomeMapTeam(challenge, team) {
        /**
         * @type {{recordsets: [{Map: string}[]]}}
         */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET HomeMapTeamId = @teamId, UsingHomeMapTeam = 1, Map = NULL WHERE ChallengeId = @challengeId

            DELETE FROM tblChallengeHome WHERE ChallengeId = @challengeId

            INSERT INTO tblChallengeHome (ChallengeId, Number, Map)
            SELECT @challengeId, Number, Map
            FROM tblTeamHome
            WHERE TeamId = @teamId

            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Number
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [];
    }

    //               #    #  #                     ##                                 ###
    //               #    #  #                    #  #                                 #
    //  ###    ##   ###   ####   ##   # #    ##    #     ##   ###   # #    ##   ###    #     ##    ###  # #
    // ##     # ##   #    #  #  #  #  ####  # ##    #   # ##  #  #  # #   # ##  #  #   #    # ##  #  #  ####
    //   ##   ##     #    #  #  #  #  #  #  ##    #  #  ##    #     # #   ##    #      #    ##    # ##  #  #
    // ###     ##     ##  #  #   ##   #  #   ##    ##    ##   #      #     ##   #      #     ##    # #  #  #
    /**
     * Sets the home server team for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The new home server team.
     * @returns {Promise} A promise that resolves when the home server team has been set.
     */
    static async setHomeServerTeam(challenge, team) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET HomeServerTeamId = @teamId, UsingHomeServerTeam = 1 WHERE ChallengeId = @challengeId
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //               #    #                 #
    //               #    #                 #
    //  ###    ##   ###   #      ##    ##   # #
    // ##     # ##   #    #     #  #  #     ##
    //   ##   ##     #    #     #  #  #     # #
    // ###     ##     ##  ####   ##    ##   #  #
    /**
     * Sets the lock status of a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {boolean} locked Whether the challenge is locked
     * @returns {Promise} A promise that resolves when the challenge lock status is set.
     */
    static async setLock(challenge, locked) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET AdminCreated = @locked WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            locked: {type: Db.BIT, value: locked}
        });
    }

    //               #    #  #
    //               #    ####
    //  ###    ##   ###   ####   ###  ###
    // ##     # ##   #    #  #  #  #  #  #
    //   ##   ##     #    #  #  # ##  #  #
    // ###     ##     ##  #  #   # #  ###
    //                                #
    /**
     * Sets the map for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the map has been set.
     */
    static async setMap(challenge, map) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET Map = @map, UsingHomeMapTeam = 0 FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            map: {type: Db.VARCHAR(100), value: map}
        });

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);
    }

    //               #    #  #               #                ##     ##
    //               #    ## #               #                 #    #  #
    //  ###    ##   ###   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###
    // ##     # ##   #    # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #
    //   ##   ##     #    # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #
    // ###     ##     ##  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #
    /**
     * Confirms a suggested neutral server for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the suggested neutral map has been confirmed.
     */
    static async setNeutralServer(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET UsingHomeServerTeam = 0 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #    #  #         #     #      #          ##   ##                #     ####               #                   #
    //               #    ## #         #           # #        #  #   #                #     #                                      #
    //  ###    ##   ###   ## #   ##   ###   ##     #    #  #  #      #     ##    ##   # #   ###   #  #  ###   ##    ###    ##    ###
    // ##     # ##   #    # ##  #  #   #     #    ###   #  #  #      #    #  #  #     ##    #      ##   #  #   #    #  #  # ##  #  #
    //   ##   ##     #    # ##  #  #   #     #     #     # #  #  #   #    #  #  #     # #   #      ##   #  #   #    #     ##    #  #
    // ###     ##     ##  #  #   ##     ##  ###    #      #    ##   ###    ##    ##   #  #  ####  #  #  ###   ###   #      ##    ###
    //                                                   #                                              #
    /**
     * Records the notification for a clock deadline expiration.
     * @param {Challenge} challenge The challenge with the expired clock deadline.
     * @returns {Promise} A promise that resolves when the notification has been recorded.
     */
    static async setNotifyClockExpired(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateClockDeadlineNotified = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #    #  #         #     #      #         #  #         #          #     #  #   #                           #
    //               #    ## #         #           # #        ####         #          #     ####                               #
    //  ###    ##   ###   ## #   ##   ###   ##     #    #  #  ####   ###  ###    ##   ###   ####  ##     ###    ###    ##    ###
    // ##     # ##   #    # ##  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #  #  #   #    ##     ##     # ##  #  #
    //   ##   ##     #    # ##  #  #   #     #     #     # #  #  #  # ##   #    #     #  #  #  #   #      ##     ##   ##    #  #
    // ###     ##     ##  #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #  #  #  ###   ###    ###     ##    ###
    //                                                   #
    /**
     * Records the notification for a missed match.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the notification has been recorded.
     */
    static async setNotifyMatchMissed(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateMatchTimePassedNotified = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #    #  #         #     #      #         #  #         #          #      ##    #                 #     #
    //               #    ## #         #           # #        ####         #          #     #  #   #                 #
    //  ###    ##   ###   ## #   ##   ###   ##     #    #  #  ####   ###  ###    ##   ###    #    ###    ###  ###   ###   ##    ###    ###
    // ##     # ##   #    # ##  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #    #    #    #  #  #  #   #     #    #  #  #  #
    //   ##   ##     #    # ##  #  #   #     #     #     # #  #  #  # ##   #    #     #  #  #  #   #    # ##  #      #     #    #  #   ##
    // ###     ##     ##  #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #   ##     ##   # #  #       ##  ###   #  #  #
    //                                                   #                                                                             ###
    /**
     * Records the notification for a match starting soon.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the notification has been recorded.
     */
    static async setNotifyMatchStarting(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateMatchTimeNotified = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #     ##                      #     #                ###                #             #
    //               #    #  #                     #                      #  #                             #
    //  ###    ##   ###   #  #  # #    ##   ###   ###   ##    # #    ##   #  #   ##   ###   ##     ##    ###   ###
    // ##     # ##   #    #  #  # #   # ##  #  #   #     #    ####  # ##  ###   # ##  #  #   #    #  #  #  #  ##
    //   ##   ##     #    #  #  # #   ##    #      #     #    #  #  ##    #     ##    #      #    #  #  #  #    ##
    // ###     ##     ##   ##    #     ##   #       ##  ###   #  #   ##   #      ##   #     ###    ##    ###  ###
    /**
     * Sets the number of overtime periods for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {number} overtimePeriods The number of overtime periods played.
     * @returns {Promise} A promise that resolves when the number of overtime periods has been set.
     */
    static async setOvertimePeriods(challenge, overtimePeriods) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET OvertimePeriods = @overtimePeriods WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            overtimePeriods: {type: Db.INT, value: overtimePeriods}
        });
    }

    //               #    ###                 #
    //               #    #  #                #
    //  ###    ##   ###   #  #   ##    ###   ###    ###    ##    ###   ###    ##   ###
    // ##     # ##   #    ###   #  #  ##      #    ##     # ##  #  #  ##     #  #  #  #
    //   ##   ##     #    #     #  #    ##    #      ##   ##    # ##    ##   #  #  #  #
    // ###     ##     ##  #      ##   ###      ##  ###     ##    # #  ###     ##   #  #
    /**
     * Sets a match to be a postseason match.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the match is set as a postseason match.
     */
    static async setPostseason(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET Postseason = 1 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #    ###                     ##                 ##
    //               #    #  #                     #                #  #
    //  ###    ##   ###   #  #   ##    ###  #  #   #     ###  ###    #     ##    ###   ###    ##   ###
    // ##     # ##   #    ###   # ##  #  #  #  #   #    #  #  #  #    #   # ##  #  #  ##     #  #  #  #
    //   ##   ##     #    # #   ##     ##   #  #   #    # ##  #     #  #  ##    # ##    ##   #  #  #  #
    // ###     ##     ##  #  #   ##   #      ###  ###    # #  #      ##    ##    # #  ###     ##   #  #
    //                                 ###
    /**
     * Sets a match to be a regular season match.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the match is set as a postseason match.
     */
    static async setRegularSeason(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET Postseason = 0 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #    ###                      #          #              #
    //               #    #  #                     #          #              #
    //  ###    ##   ###   #  #   ##   # #    ###  ###    ##   ###    ##    ###
    // ##     # ##   #    ###   # ##  ####  #  #   #    #     #  #  # ##  #  #
    //   ##   ##     #    # #   ##    #  #  # ##   #    #     #  #  ##    #  #
    // ###     ##     ##  #  #   ##   #  #   # #    ##   ##   #  #   ##    ###
    /**
     * Sets a challenge as having been rematched.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the challenge has been set as having been rematched.
     */
    static async setRematched(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateRematched = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #     ##
    //               #    #  #
    //  ###    ##   ###    #     ##    ##   ###    ##
    // ##     # ##   #      #   #     #  #  #  #  # ##
    //   ##   ##     #    #  #  #     #  #  #     ##
    // ###     ##     ##   ##    ##    ##   #      ##
    /**
     * Sets the score of a match.
     * @param {Challenge} challenge The challenge.
     * @param {number} challengingTeamScore The challenging team's score.
     * @param {number} challengedTeamScore The challenged team's score.
     * @returns {Promise} A promise that resolves when the score is set.
     */
    static async setScore(challenge, challengingTeamScore, challengedTeamScore) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET
                ReportingTeamId = NULL,
                ChallengingTeamScore = @challengingTeamScore,
                ChallengedTeamScore = @challengedTeamScore,
                DateConfirmed = GETUTCDATE()
            WHERE ChallengeId = @challengeId
        `, {
            challengingTeamScore: {type: Db.INT, value: challengingTeamScore},
            challengedTeamScore: {type: Db.INT, value: challengedTeamScore},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //               #    ###                      ##    #
    //               #     #                      #  #
    //  ###    ##   ###    #     ##    ###  # #    #    ##    ####   ##
    // ##     # ##   #     #    # ##  #  #  ####    #    #      #   # ##
    //   ##   ##     #     #    ##    # ##  #  #  #  #   #     #    ##
    // ###     ##     ##   #     ##    # #  #  #   ##   ###   ####   ##
    /**
     * Sets a team size for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {number} size The team size.
     * @returns {Promise} A promise that resolves when the team size has been set.
     */
    static async setTeamSize(challenge, size) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET TeamSize = @size, SuggestedTeamSize = NULL, SuggestedTeamSizeTeamId = NULL WHERE ChallengeId = @challengeId
        `, {
            size: {type: Db.INT, value: size},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //               #    ###    #
    //               #     #
    //  ###    ##   ###    #    ##    # #    ##
    // ##     # ##   #     #     #    ####  # ##
    //   ##   ##     #     #     #    #  #  ##
    // ###     ##     ##   #    ###   #  #   ##
    /**
     * Sets the time for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Date} [date] The time of the challenge.
     * @returns {Promise} A promise that resolves when the time has been set.
     */
    static async setTime(challenge, date) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET MatchTime = @date, SuggestedTime = NULL, SuggestedTimeTeamId = NULL, DateMatchTimeNotified = NULL, DateMatchTimePassedNotified = NULL WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            date: {type: Db.DATETIME, value: date}
        });

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);
    }

    //               #    ###    #     #    ##
    //               #     #           #     #
    //  ###    ##   ###    #    ##    ###    #     ##
    // ##     # ##   #     #     #     #     #    # ##
    //   ##   ##     #     #     #     #     #    ##
    // ###     ##     ##   #    ###     ##  ###    ##
    /**
     * Sets a title for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {string} title The title.
     * @returns {Promise} A promise that resolves when the title is set.
     */
    static async setTitle(challenge, title) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET Title = CASE WHEN ISNULL(@title, '') = '' THEN NULL ELSE @title END WHERE ChallengeId = @challengeId
        `, {
            title: {type: Db.VARCHAR(100), value: title},
            challengeId: {type: Db.INT, value: challenge.id}
        });

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);
    }

    //               #    #  #        ###
    //               #    #  #        #  #
    //  ###    ##   ###   #  #   ##   #  #
    // ##     # ##   #    #  #  #  #  #  #
    //   ##   ##     #     ##   #  #  #  #
    // ###     ##     ##   ##    ##   ###
    /**
     * Sets a VoD for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {string} vod The URL of the VoD.
     * @returns {Promise} A promise that resolves when the VoD is set.
     */
    static async setVoD(challenge, vod) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET VoD = CASE WHEN ISNULL(@vod, '') = '' THEN NULL ELSE @vod END WHERE ChallengeId = @challengeId
        `, {
            vod: {type: Db.VARCHAR(100), value: vod},
            challengeId: {type: Db.INT, value: challenge.id}
        });

        Cache.invalidate(["otl.gg:invalidate:challenge:updated"]);
    }

    //                                        #    #  #
    //                                        #    ####
    //  ###   #  #   ###   ###   ##    ###   ###   ####   ###  ###
    // ##     #  #  #  #  #  #  # ##  ##      #    #  #  #  #  #  #
    //   ##   #  #   ##    ##   ##      ##    #    #  #  # ##  #  #
    // ###     ###  #     #      ##   ###      ##  #  #   # #  ###
    //               ###   ###                                 #
    /**
     * Suggests a map for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @param {string} map The suggested map.
     * @returns {Promise} A promise that resolves when the map has been suggested.
     */
    static async suggestMap(challenge, team, map) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedMap = @map, SuggestedMapTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
            map: {type: Db.VARCHAR(100), value: map},
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                        #    #  #               #                ##     ##
    //                                        #    ## #               #                 #    #  #
    //  ###   #  #   ###   ###   ##    ###   ###   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###
    // ##     #  #  #  #  #  #  # ##  ##      #    # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #
    //   ##   #  #   ##    ##   ##      ##    #    # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #
    // ###     ###  #     #      ##   ###      ##  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #
    //               ###   ###
    /**
     * Suggests a neutral server for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @returns {Promise} A promise that resolves when the neutral server has been suggested.
     */
    static async suggestNeutralServer(challenge, team) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedNeutralServerTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                        #    ###                      ##    #
    //                                        #     #                      #  #
    //  ###   #  #   ###   ###   ##    ###   ###    #     ##    ###  # #    #    ##    ####   ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #    # ##  #  #  ####    #    #      #   # ##
    //   ##   #  #   ##    ##   ##      ##    #     #    ##    # ##  #  #  #  #   #     #    ##
    // ###     ###  #     #      ##   ###      ##   #     ##    # #  #  #   ##   ###   ####   ##
    //               ###   ###
    /**
     * Suggests a team size for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @param {number} size The team size.
     * @returns {Promise} A promise that resolves when the team size has been suggested.
     */
    static async suggestTeamSize(challenge, team, size) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedTeamSize = @size, SuggestedTeamSizeTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
            size: {type: Db.INT, value: size},
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                        #    ###    #
    //                                        #     #
    //  ###   #  #   ###   ###   ##    ###   ###    #    ##    # #    ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #     #    ####  # ##
    //   ##   #  #   ##    ##   ##      ##    #     #     #    #  #  ##
    // ###     ###  #     #      ##   ###      ##   #    ###   #  #   ##
    //               ###   ###
    /**
     * Suggests a time for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @param {Date} date The time.
     * @returns {Promise} A promise that resolves when the time has been suggested.
     */
    static async suggestTime(challenge, team, date) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedTime = @date, SuggestedTimeTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
            date: {type: Db.DATETIME, value: date},
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                          #       #
    //                                  #
    // #  #  ###   # #    ##   ##     ###
    // #  #  #  #  # #   #  #   #    #  #
    // #  #  #  #  # #   #  #   #    #  #
    //  ###  #  #   #     ##   ###    ###
    /**
     * Unvoids a challenge.
     * @param {Challenge} challenge The challenge to unvoid.
     * @returns {Promise} A promise that resolves when the challenge is unvoided.
     */
    static async unvoid(challenge) {
        /**
         * @type {{recordsets: [{PlayerId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET DateVoided = NULL WHERE ChallengeId = @challengeId

            SELECT PlayerId FROM tblStat WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0].length > 0) {
            Cache.invalidate(data.recordsets[0].map((row) => `otl.gg:invalidate:player:${row.PlayerId}:updated`).concat("otl.gg:invalidate:challenge:closed"));
        }
    }

    //              #       #
    //                      #
    // # #    ##   ##     ###
    // # #   #  #   #    #  #
    // # #   #  #   #    #  #
    //  #     ##   ###    ###
    /**
     * Voids a challenge.
     * @param {Challenge} challenge The challenge to void.
     * @returns {Promise} A promise that resolves when the challenge is voided.
     */
    static async void(challenge) {
        /**
         * @type {{recordsets: [{PlayerId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET DateVoided = GETUTCDATE() WHERE ChallengeId = @challengeId

            IF EXISTS(SELECT TOP 1 1 FROM tblChallenge WHERE ChallengeId = @challengeId AND ChallengingTeamPenalized = 1)
            BEGIN
                UPDATE tblTeamPenalty SET PenaltiesRemaining = PenaltiesRemaining + 1 WHERE TeamId = (SELECT ChallengingTeamId FROM tblChallenge WHERE ChallengeId = @challengeId)
                UPDATE tblChallenge SET ChallengingTeamPenalized = 0 WHERE ChallengeId = @challengeId
            END

            IF EXISTS(SELECT TOP 1 1 FROM tblChallenge WHERE ChallengeId = @challengeId AND ChallengedTeamPenalized = 1)
            BEGIN
                UPDATE tblTeamPenalty SET PenaltiesRemaining = PenaltiesRemaining + 1 WHERE TeamId = (SELECT ChallengedTeamId FROM tblChallenge WHERE ChallengeId = @challengeId)
                UPDATE tblChallenge SET ChallengedTeamPenalized = 0 WHERE ChallengeId = @challengeId
            END

            SELECT PlayerId FROM tblStat WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0].length > 0) {
            Cache.invalidate(data.recordsets[0].map((row) => `otl.gg:invalidate:player:${row.PlayerId}:updated`).concat("otl.gg:invalidate:challenge:closed"));
        }
    }

    //              #       #  #  #   #     #    #     ###                     ##     #     #
    //                      #  #  #         #    #     #  #                     #     #
    // # #    ##   ##     ###  #  #  ##    ###   ###   #  #   ##   ###    ###   #    ###   ##     ##    ###
    // # #   #  #   #    #  #  ####   #     #    #  #  ###   # ##  #  #  #  #   #     #     #    # ##  ##
    // # #   #  #   #    #  #  ####   #     #    #  #  #     ##    #  #  # ##   #     #     #    ##      ##
    //  #     ##   ###    ###  #  #  ###     ##  #  #  #      ##   #  #   # #  ###     ##  ###    ##   ###
    /**
     * Voids a challenge and assesses penalties.
     * @param {Challenge} challenge The challenge to void.
     * @param {Team[]} teams The teams to assess penalties to.
     * @returns {Promise<{teamId: number, first: boolean}[]>} A promise that resolves with a list of teams that were penalized along with whether it was their first penalty.
     */
    static async voidWithPenalties(challenge, teams) {
        const params = {challengeId: {type: Db.INT, value: challenge.id}};
        let sql = /* sql */`
            UPDATE tblChallenge SET DateVoided = GETUTCDATE() WHERE ChallengeId = @challengeId

            IF EXISTS(SELECT TOP 1 1 FROM tblChallenge WHERE ChallengeId = @challengeId AND ChallengingTeamPenalized = 1)
            BEGIN
                UPDATE tblTeamPenalty SET PenaltiesRemaining = PenaltiesRemaining + 1 WHERE TeamId = (SELECT ChallengingTeamId FROM tblChallenge WHERE ChallengeId = @challengeId)
                UPDATE tblChallenge SET ChallengingTeamPenalized = 0 WHERE ChallengeId = @challengeId
            END

            IF EXISTS(SELECT TOP 1 1 FROM tblChallenge WHERE ChallengeId = @challengeId AND ChallengedTeamPenalized = 1)
            BEGIN
                UPDATE tblTeamPenalty SET PenaltiesRemaining = PenaltiesRemaining + 1 WHERE TeamId = (SELECT ChallengedTeamId FROM tblChallenge WHERE ChallengeId = @challengeId)
                UPDATE tblChallenge SET ChallengedTeamPenalized = 0 WHERE ChallengeId = @challengeId
            END

            SELECT t.TeamId, CAST(CASE WHEN EXISTS(SELECT TOP 1 1 FROM tblTeamPenalty tp WHERE tp.TeamId = t.TeamId) THEN 0 ELSE 1 END AS BIT) First
            FROM tblTeam t
            WHERE t.TeamId IN (${teams.map((t, index) => `@team${index}Id`).join(", ")})

            SELECT PlayerId FROM tblStat WHERE ChallengeId = @challengeId
        `;

        teams.forEach((team, index) => {
            params[`team${index}Id`] = {type: Db.INT, value: team.id};

            sql = /* sql */`
                ${sql}

                IF EXISTS(SELECT TOP 1 1 FROM tblTeamPenalty WHERE TeamId = @team${index}Id)
                BEGIN
                    UPDATE tblTeamPenalty
                    SET PenaltiesRemaining = PenaltiesRemaining + 3,
                        DatePenalized = GETUTCDATE()
                    WHERE TeamId = @team${index}Id

                    INSERT INTO tblLeadershipPenalty
                    (PlayerId, DatePenalized)
                    SELECT PlayerId, GETUTCDATE()
                    FROM tblRoster
                    WHERE TeamId = @team${index}Id
                        AND (Founder = 1 OR Captain = 1)
                END
                ELSE
                BEGIN
                    INSERT INTO tblTeamPenalty
                    (TeamId, PenaltiesRemaining, DatePenalized)
                    VALUES (@team${index}Id, 3, GETUTCDATE())
                END
            `;
        });

        /**
         * @type {{recordsets: [{TeamId: number, First: boolean}[], {PlayerId: number}[]]}}
         */
        const data = await db.query(sql, params);

        if (data && data.recordsets && data.recordsets[1] && data.recordsets[1].length > 0) {
            Cache.invalidate(data.recordsets[1].map((row) => `otl.gg:invalidate:player:${row.PlayerId}:updated`).concat("otl.gg:invalidate:challenge:closed"));
        }

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({teamId: row.TeamId, first: row.First})) || [];
    }
}

module.exports = ChallengeDb;
