/**
 * @typedef {import("../models/challenge")} Challenge
 * @typedef {import("../../types/challengeDbTypes").ClockRecordsets} ChallengeDbTypes.ClockRecordsets
 * @typedef {import("../../types/challengeDbTypes").CloseRecordsets} ChallengeDbTypes.CloseRecordsets
 * @typedef {import("../../types/challengeDbTypes").ConfirmGameTypeRecordsets} ChallengeDbTypes.ConfirmGameTypeRecordsets
 * @typedef {import("../../types/challengeDbTypes").CreateRecordsets} ChallengeDbTypes.CreateRecordsets
 * @typedef {import("../../types/challengeDbTypes").ExtendRecordsets} ChallengeDbTypes.ExtendRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetAllByTeamRecordsets} ChallengeDbTypes.GetAllByTeamRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetAllByTeamsRecordsets} ChallengeDbTypes.GetAllByTeamsRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetByIdRecordsets} ChallengeDbTypes.GetByIdRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetByTeamsRecordsets} ChallengeDbTypes.GetByTeamsRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetCastDataRecordsets} ChallengeDbTypes.GetCastDataRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetDamageRecordsets} ChallengeDbTypes.GetDamageRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetDetailsRecordsets} ChallengeDbTypes.GetDetailsRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetNotificationsRecordsets} ChallengeDbTypes.GetNotificationsRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetRandomMapRecordsets} ChallengeDbTypes.GetRandomMapRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetStatsForTeamRecordsets} ChallengeDbTypes.GetStatsForTeamRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetStreamersRecordsets} ChallengeDbTypes.GetStreamersRecordsets
 * @typedef {import("../../types/challengeDbTypes").GetTeamDetailsRecordsets} ChallengeDbTypes.GetTeamDetailsRecordsets
 * @typedef {import("../../types/challengeDbTypes").PickMapRecordsets} ChallengeDbTypes.PickMapRecordsets
 * @typedef {import("../../types/challengeDbTypes").ReportRecordsets} ChallengeDbTypes.ReportRecordsets
 * @typedef {import("../../types/challengeDbTypes").SetConfirmedRecordsets} ChallengeDbTypes.SetConfirmedRecordsets
 * @typedef {import("../../types/challengeDbTypes").SetHomeMapTeamRecordsets} ChallengeDbTypes.SetHomeMapTeamRecordsets
 * @typedef {import("../../types/challengeDbTypes").SetScoreRecordsets} ChallengeDbTypes.SetScoreRecordsets
 * @typedef {import("../../types/challengeDbTypes").UnvoidRecordsets} ChallengeDbTypes.UnvoidRecordsets
 * @typedef {import("../../types/challengeDbTypes").VoidRecordsets} ChallengeDbTypes.VoidRecordsets
 * @typedef {import("../../types/challengeDbTypes").VoidWithPenaltiesRecordsets} ChallengeDbTypes.VoidWithPenaltiesRecordsets
 * @typedef {import("../../types/challengeTypes").CastData} ChallengeTypes.CastData
 * @typedef {import("../../types/challengeTypes").ChallengeData} ChallengeTypes.ChallengeData
 * @typedef {import("../../types/challengeTypes").ClockedData} ChallengeTypes.ClockedData
 * @typedef {import("../../types/challengeTypes").CreateData} ChallengeTypes.CreateData
 * @typedef {import("../../types/challengeTypes").DamageData} ChallengeTypes.DamageData
 * @typedef {import("../../types/challengeTypes").DetailsData} ChallengeTypes.DetailsData
 * @typedef {import("../../types/challengeTypes").NotificationsData} ChallengeTypes.NotificationsData
 * @typedef {import("../../types/challengeTypes").SetDamageData} ChallengeTypes.SetDamageData
 * @typedef {import("../../types/challengeTypes").StreamerData} ChallengeTypes.StreamerData
 * @typedef {import("../../types/challengeTypes").TeamDetailsData} ChallengeTypes.TeamDetailsData
 * @typedef {import("../../types/challengeTypes").TeamPenaltyData} ChallengeTypes.TeamPenaltyData
 * @typedef {import("../../types/challengeTypes").TeamStatsData} ChallengeTypes.TeamStatsData
 * @typedef {import("../../types/dbTypes").Parameters} DbTypes.Parameters
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").User} DiscordJs.User
 * @typedef {import("../models/team")} Team
 */

const Db = require("node-database"),

    Cache = require("../cache"),
    db = require("./index"),
    settings = require("../../settings");

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
    //          #     #   ##    #           #     ##   ###   ####
    //          #     #  #  #   #           #    #  #   #    #
    //  ###   ###   ###   #    ###    ###  ###   #      #    ###
    // #  #  #  #  #  #    #    #    #  #   #    #      #    #
    // # ##  #  #  #  #  #  #   #    # ##   #    #  #   #    #
    //  # #   ###   ###   ##     ##   # #    ##   ##    #    #
    /**
     * Adds a stat to a challenge for capture the flag.
     * @param {Challenge} challenge The challenge to add the stat to.
     * @param {Team} team The team to add the stat to.
     * @param {DiscordJs.GuildMember|DiscordJs.User} pilot The pilot to add a stat for.
     * @param {number} captures The number of flag captures the pilot had.
     * @param {number} pickups The number of flag pickups the pilot had.
     * @param {number} carrierKills The number of flag carrier kills the pilot had.
     * @param {number} returns The number of flag returns the pilot had.
     * @param {number} kills The number of kills the pilot had.
     * @param {number} assists The number of assists the pilot had.
     * @param {number} deaths The number of deaths the pilot had.
     * @returns {Promise} A promise that resolves when the stat is added to the database.
     */
    static async addStatCTF(challenge, team, pilot, captures, pickups, carrierKills, returns, kills, assists, deaths) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            MERGE tblStat s
                USING (VALUES (@challengeId, @teamId, @captures, @pickups, @carrierKills, @returns, @kills, @assists, @deaths, @playerId)) AS v (ChallengeId, TeamId, Captures, Pickups, CarrierKills, Returns, Kills, Assists, Deaths, PlayerId)
                ON s.ChallengeId = v.ChallengeId AND s.TeamId = v.TeamId AND s.PlayerId = v.PlayerId
            WHEN MATCHED THEN
                UPDATE SET
                    TeamId = v.TeamId,
                    Captures = v.Captures,
                    Pickups = v.Pickups,
                    CarrierKills = v.CarrierKills,
                    Returns = v.Returns,
                    Kills = v.Kills,
                    Assists = v.Assists,
                    Deaths = v.Deaths
            WHEN NOT MATCHED THEN
                INSERT (ChallengeId, TeamId, PlayerId, Captures, Pickups, CarrierKills, Returns, Kills, Assists, Deaths) VALUES (v.ChallengeId, v.TeamId, v.PlayerId, v.Captures, v.Pickups, v.CarrierKills, v.Returns, v.Kills, v.Assists, v.Deaths);
        `, {
            discordId: {type: Db.VARCHAR(24), value: pilot.id},
            challengeId: {type: Db.INT, value: challenge.id},
            teamId: {type: Db.INT, value: team.id},
            captures: {type: Db.INT, value: captures},
            pickups: {type: Db.INT, value: pickups},
            carrierKills: {type: Db.INT, value: carrierKills},
            returns: {type: Db.INT, value: returns},
            kills: {type: Db.INT, value: kills},
            assists: {type: Db.INT, value: assists},
            deaths: {type: Db.INT, value: deaths}
        });
    }

    //          #     #   ##    #           #    ###    ##
    //          #     #  #  #   #           #     #    #  #
    //  ###   ###   ###   #    ###    ###  ###    #    #  #
    // #  #  #  #  #  #    #    #    #  #   #     #    ####
    // # ##  #  #  #  #  #  #   #    # ##   #     #    #  #
    //  # #   ###   ###   ##     ##   # #    ##   #    #  #
    /**
     * Adds a stat to a challenge for team anarchy.
     * @param {Challenge} challenge The challenge to add the stat to.
     * @param {Team} team The team to add the stat to.
     * @param {DiscordJs.GuildMember|DiscordJs.User} pilot The pilot to add a stat for.
     * @param {number} kills The number of kills the pilot had.
     * @param {number} assists The number of assists the pilot had.
     * @param {number} deaths The number of deaths the pilot had.
     * @returns {Promise} A promise that resolves when the stat is added to the database.
     */
    static async addStatTA(challenge, team, pilot, kills, assists, deaths) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            MERGE tblStat s
                USING (VALUES (@challengeId, @teamId, @kills, @assists, @deaths, @playerId)) AS v (ChallengeId, TeamId, Kills, Assists, Deaths, PlayerId)
                ON s.ChallengeId = v.ChallengeId AND s.TeamId = v.TeamId AND s.PlayerId = v.PlayerId
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

    //       ##                       ##    #           #
    //        #                      #  #   #           #
    //  ##    #     ##    ###  ###    #    ###    ###  ###    ###
    // #      #    # ##  #  #  #  #    #    #    #  #   #    ##
    // #      #    ##    # ##  #     #  #   #    # ##   #      ##
    //  ##   ###    ##    # #  #      ##     ##   # #    ##  ###
    /**
     * Clears all stats from a challenge.
     * @param {Challenge} challenge The challenge to clear stats for.
     * @returns {Promise} A promise that resolves when the stats are clear.
     */
    static async clearStats(challenge) {
        await db.query(/* sql */`
            DELETE FROM tblStat WHERE ChallengeId = @id
            DELETE FROM tblDamage WHERE ChallengeId = @id
        `, {id: {type: Db.INT, value: challenge.id}});
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
     * @returns {Promise<ChallengeTypes.ClockedData>} A promise that resolves with the clocked date and the clock deadline date.
     */
    static async clock(team, challenge) {
        /** @type {ChallengeDbTypes.ClockRecordsets} */
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
        /** @type {ChallengeDbTypes.CloseRecordsets} */
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
            await Cache.invalidate(data.recordsets[0].map((row) => `${settings.redisPrefix}:invalidate:player:${row.PlayerId}:updated`).concat(`${settings.redisPrefix}:invalidate:challenge:closed`));
        } else {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:closed`]);
        }
    }

    //                     #    #                 ##                     ###
    //                    # #                    #  #                     #
    //  ##    ##   ###    #    ##    ###   # #   #      ###  # #    ##    #    #  #  ###    ##
    // #     #  #  #  #  ###    #    #  #  ####  # ##  #  #  ####  # ##   #    #  #  #  #  # ##
    // #     #  #  #  #   #     #    #     #  #  #  #  # ##  #  #  ##     #     # #  #  #  ##
    //  ##    ##   #  #   #    ###   #     #  #   ###   # #  #  #   ##    #      #   ###    ##
    //                                                                          #    #
    /**
     * Confirms a suggested game type for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<string[]>} A promise that resolves with the home map team's home maps for the new game type.
     */
    static async confirmGameType(challenge) {
        /** @type {ChallengeDbTypes.ConfirmGameTypeRecordsets} */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET GameType = SuggestedGameType, SuggestedGameType = NULL, SuggestedGameTypeTeamId = NULL WHERE ChallengeId = @challengeId

            SELECT ch.Map
            FROM tblChallengeHome ch
            INNER JOIN tblChallenge c ON ch.ChallengeId = c.ChallengeId AND ch.GameType = c.GameType
            WHERE ch.ChallengeId = @challengeId
            ORDER BY ch.Number
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [];
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
            UPDATE tblChallenge SET Map = SuggestedMap, SuggestedMap = NULL, SuggestedMapTeamId = NULL, UsingHomeMapTeam = 0 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);
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

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);
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
     * @param {string} gameType The game type.
     * @param {boolean} adminCreated Whether the challenge is admin-created.
     * @param {Team} [homeMapTeam] The home map team.
     * @param {number} [teamSize] The team size.
     * @param {boolean} [startNow] Whether to start the match now.
     * @param {Team} [blueTeam] The blue team.
     * @returns {Promise<ChallengeTypes.CreateData>} A promise that resolves with the challenge ID.
     */
    static async create(team1, team2, gameType, adminCreated, homeMapTeam, teamSize, startNow, blueTeam) {
        /** @type {Date} */
        let date;

        /** @type {ChallengeDbTypes.CreateRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @orangeTeamId INT
            DECLARE @blueTeamId INT
            DECLARE @homeMapTeamId INT
            DECLARE @team1Penalized BIT
            DECLARE @team2Penalized BIT
            DECLARE @challengeId INT

            SELECT
                @orangeTeamId = CASE WHEN Team1Orange < Team2Orange THEN @team1Id WHEN Team1Orange > Team2Orange THEN @team2Id WHEN @colorSeed < 0.5 THEN @team1Id ELSE @team2Id END,
                @blueTeamId = CASE WHEN Team1Orange > Team2Orange THEN @team1Id WHEN Team1Orange < Team2Orange THEN @team2Id WHEN @colorSeed >= 0.5 THEN @team1Id ELSE @team2Id END,
                @homeMapTeamId = CASE WHEN @requestedHomeMapTeamId IS NOT NULL THEN @requestedHomeMapTeamId WHEN Team1Penalties = 0 AND Team2Penalties > 0 THEN @team1Id WHEN Team1Penalties > 0 AND Team2Penalties = 0 THEN @team2Id WHEN Team1HomeMap < Team2HomeMap THEN @team1Id WHEN Team1HomeMap > Team2HomeMap THEN @team2Id WHEN @mapSeed < 0.5 THEN @team1Id ELSE @team2Id END,
                @team1Penalized = CASE WHEN @adminCreated = 0 AND Team1Penalties > 0 THEN 1 ELSE 0 END,
                @team2Penalized = CASE WHEN @adminCreated = 0 AND Team2Penalties > 0 THEN 1 ELSE 0 END
            FROM (
                SELECT ISNULL(SUM(CASE WHEN OrangeTeamId = @team1Id THEN 1 ELSE 0 END), 0) Team1Orange,
                    ISNULL(SUM(CASE WHEN OrangeTeamId = @team2Id THEN 1 ELSE 0 END), 0) Team2Orange,
                    ISNULL(SUM(CASE WHEN UsingHomeMapTeam = 1 AND Postseason = 0 AND ChallengingTeamPenalized = ChallengedTeamPenalized AND HomeMapTeamId = @team1Id THEN 1 ELSE 0 END), 0) Team1HomeMap,
                    ISNULL(SUM(CASE WHEN UsingHomeMapTeam = 1 AND Postseason = 0 AND ChallengingTeamPenalized = ChallengedTeamPenalized AND HomeMapTeamId = @team2Id THEN 1 ELSE 0 END), 0) Team2HomeMap,
                    ISNULL((SELECT PenaltiesRemaining FROM tblTeamPenalty WHERE TeamId = @team1Id), 0) Team1Penalties,
                    ISNULL((SELECT PenaltiesRemaining FROM tblTeamPenalty WHERE TeamId = @team2Id), 0) Team2Penalties
                FROM tblChallenge
                WHERE ((ChallengingTeamId = @team1Id AND ChallengedTeamId = @team2Id) OR (ChallengingTeamId = @team2Id AND ChallengedTeamId = @team1Id))
                    AND DateVoided IS NULL
            ) a

            IF @setBlueTeamId IS NOT NULL
            BEGIN
                SET @blueTeamId = @setBlueTeamId
                SET @orangeTeamId = CASE WHEN @team1Id = @setBlueTeamId THEN @team2Id ELSE @team1Id END
            END

            EXEC sp_getapplock @Resource = 'tblChallenge', @LockMode = 'Update', @LockOwner = 'Session', @LockTimeout = 10000

            SELECT @challengeId = COUNT(ChallengeId) + 1 FROM tblChallenge

            INSERT INTO tblChallenge (
                ChallengeId,
                ChallengingTeamId,
                ChallengedTeamId,
                OrangeTeamId,
                BlueTeamId,
                HomeMapTeamId,
                ChallengingTeamPenalized,
                ChallengedTeamPenalized,
                AdminCreated,
                GameType
            ) VALUES (
                @challengeId,
                @team1Id,
                @team2Id,
                @orangeTeamId,
                @blueTeamId,
                @homeMapTeamId,
                @team1Penalized,
                @team2Penalized,
                @adminCreated,
                @gameType
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

            INSERT INTO tblChallengeHome (ChallengeId, Number, Map, GameType)
            SELECT @challengeId, Number, Map, GameType
            FROM tblTeamHome
            WHERE TeamId = @homeMapTeamId

            SELECT
                @challengeId ChallengeId,
                @orangeTeamId OrangeTeamId,
                @blueTeamId BlueTeamId,
                @homeMapTeamId HomeMapTeamId,
                @team1Penalized Team1Penalized,
                @team2Penalized Team2Penalized
        `, {
            team1Id: {type: Db.INT, value: team1.id},
            team2Id: {type: Db.INT, value: team2.id},
            gameType: {type: Db.VARCHAR(3), value: gameType},
            colorSeed: {type: Db.FLOAT, value: Math.random()},
            mapSeed: {type: Db.FLOAT, value: Math.random()},
            adminCreated: {type: Db.BIT, value: adminCreated},
            requestedHomeMapTeamId: {type: Db.INT, value: homeMapTeam ? homeMapTeam.id : void 0},
            teamSize: {type: Db.INT, value: teamSize},
            matchTime: {type: Db.DATETIME, value: startNow ? new Date((date = new Date()).getTime() + 300000 - date.getTime() % 300000) : void 0},
            setBlueTeamId: {type: Db.INT, value: blueTeam ? blueTeam.id : void 0}
        });

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {
            id: data.recordsets[0][0].ChallengeId,
            orangeTeam: data.recordsets[0][0].OrangeTeamId === team1.id ? team1 : team2,
            blueTeam: data.recordsets[0][0].BlueTeamId === team1.id ? team1 : team2,
            homeMapTeam: data.recordsets[0][0].HomeMapTeamId === team1.id ? team1 : team2,
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
        /** @type {ChallengeDbTypes.ExtendRecordsets} */
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

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);

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
     * @returns {Promise<ChallengeTypes.ChallengeData[]>} A promise that resolves with an array of challenge data.
     */
    static async getAllByTeam(team) {
        /** @type {ChallengeDbTypes.GetAllByTeamRecordsets} */
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
     * @returns {Promise<ChallengeTypes.ChallengeData[]>} A promise that resolves with an array of challenge data.
     */
    static async getAllByTeams(team1, team2) {
        /** @type {ChallengeDbTypes.GetAllByTeamsRecordsets} */
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
     * @returns {Promise<ChallengeTypes.ChallengeData>} A promise that resolves with the challenge data.
     */
    static async getById(id) {
        /** @type {ChallengeDbTypes.GetByIdRecordsets} */
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
     * @returns {Promise<ChallengeTypes.ChallengeData>} A promise that resolves with the challenge data.
     */
    static async getByTeams(team1, team2) {
        /** @type {ChallengeDbTypes.GetByTeamsRecordsets} */
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
     * @returns {Promise<ChallengeTypes.CastData>} A promise that resolves with the challenge data.
     */
    static async getCastData(challenge) {
        /** @type {ChallengeDbTypes.GetCastDataRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @season INT
            DECLARE @gameType VARCHAR(3)
            DECLARE @postseason BIT

            SELECT @season = Season FROM vwCompletedChallenge WHERE ChallengeId = @challengeId

            IF @season IS NULL
            BEGIN
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
            END

            SELECT @gameType = GameType, @postseason = Postseason FROM tblChallenge WHERE ChallengeId = @challengeId

            SELECT
                ChallengingTeamWins, ChallengingTeamLosses, ChallengingTeamTies,
                CASE WHEN ChallengingTeamWins + ChallengingTeamLosses + ChallengingTeamTies < 10 THEN (ChallengingTeamWins + ChallengingTeamLosses + ChallengingTeamTies) * ChallengingTeamRating / 10 ELSE ChallengingTeamRating END ChallengingTeamRating,
                ChallengedTeamWins, ChallengedTeamLosses, ChallengedTeamTies,
                CASE WHEN ChallengedTeamWins + ChallengedTeamLosses + ChallengedTeamTies < 10 THEN (ChallengedTeamWins + ChallengedTeamLosses + ChallengedTeamTies) * ChallengedTeamRating / 10 ELSE ChallengedTeamRating END ChallengedTeamRating,
                ChallengingTeamHeadToHeadWins, ChallengedTeamHeadToHeadWins, HeadToHeadTies, ChallengingTeamId, ChallengingTeamScore, ChallengedTeamId, ChallengedTeamScore, Map, GameType, MatchTime, OvertimePeriods, Name, TeamId, Captures, Pickups, CarrierKills, Returns, Kills, Assists, Deaths, Damage
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
                    s.GameType,
                    s.MatchTime,
                    s.OvertimePeriods,
                    s.Name,
                    s.TeamId,
                    s.Captures,
                    s.Pickups,
                    s.CarrierKills,
                    s.Returns,
                    s.Kills,
                    s.Assists,
                    s.Deaths,
                    s.Damage
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
                        c.GameType,
                        c.MatchTime,
                        c.OvertimePeriods,
                        p.Name,
                        s.TeamId,
                        s.Captures,
                        s.Pickups,
                        s.CarrierKills,
                        s.Returns,
                        s.Kills,
                        s.Assists,
                        s.Deaths,
                        s.Damage
                    FROM vwCompletedChallenge c
                    LEFT OUTER JOIN (
                        (
                            SELECT
                                ROW_NUMBER() OVER (PARTITION BY s2.ChallengeId ORDER BY CASE c2.GameType WHEN 'CTF' THEN s2.Captures ELSE 0 END DESC, CASE c2.GameType WHEN 'CTF' THEN s2.CarrierKills ELSE 0 END DESC, CAST(s2.Kills + s2.Assists AS FLOAT) / CASE WHEN s2.Deaths < 1 THEN 1 ELSE s2.Deaths END DESC) Row,
                                s2.ChallengeId,
                                s2.PlayerId,
                                s2.TeamId,
                                s2.Captures,
                                s2.Pickups,
                                s2.CarrierKills,
                                s2.Returns,
                                s2.Kills,
                                s2.Assists,
                                s2.Deaths,
                                SUM(d.Damage) Damage
                            FROM tblStat s2
                            INNER JOIN tblChallenge c2 ON s2.ChallengeId = c2.ChallengeId
                            LEFT OUTER JOIN tblDamage d ON c2.ChallengeId = d.ChallengeId AND s2.PlayerId = d.PlayerId
                            WHERE d.TeamId <> d.OpponentTeamId
                            GROUP BY
                                s2.ChallengeId,
                                s2.PlayerId,
                                s2.TeamId,
                                s2.Captures,
                                s2.Pickups,
                                s2.CarrierKills,
                                s2.Returns,
                                s2.Kills,
                                s2.Assists,
                                s2.Deaths,
                                c2.GameType
                        ) s
                        INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
                    ) ON c.ChallengeId = s.ChallengeId AND s.Row = 1
                ) s ON ((c.ChallengingTeamId = s.ChallengingTeamId AND c.ChallengedTeamId = s.ChallengedTeamId) OR (c.ChallengingTeamId = s.ChallengedTeamId AND c.ChallengedTeamId = s.ChallengingTeamId)) AND s.Row = 1
                WHERE c.ChallengeId = @challengeId
            ) a

            SELECT p.Name, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, d.Damage, d.Games GamesWithDamage, d.Deaths DeathsInGamesWithDamage, CASE WHEN cs.StreamerId IS NULL THEN NULL ELSE p.TwitchName END TwitchName
            FROM tblRoster r
            INNER JOIN tblPlayer p ON r.PlayerId = p.PlayerId
            INNER JOIN tblChallenge c ON c.ChallengingTeamId = r.TeamId
            LEFT OUTER JOIN tblChallengeStreamer cs ON c.ChallengeId = cs.ChallengeId AND p.PlayerId = cs.PlayerId
            LEFT OUTER JOIN (
                tblStat s
                INNER JOIN vwCompletedChallenge cc ON s.ChallengeId = cc.ChallengeId AND cc.Season = @season AND cc.GameType = @gameType
            ) ON r.PlayerId = s.PlayerId
            LEFT OUTER JOIN (
                SELECT c2.GameType, c2.Season, s2.TeamId, s2.PlayerId, COUNT(DISTINCT c2.ChallengeId) Games, SUM(d.Damage) Damage, SUM(s2.Deaths) Deaths
                FROM vwCompletedChallenge c2
                INNER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON d.ChallengeId = c2.ChallengeId
                INNER JOIN (
                    SELECT TeamId, PlayerId, ChallengeId, SUM(Deaths) Deaths
                    FROM tblStat
                    GROUP BY TeamId, PlayerId, ChallengeId
                ) s2 ON d.PlayerId = s2.PlayerId AND s2.ChallengeId = c2.ChallengeId
                WHERE c2.Season = @season
                    AND c2.Postseason = @postseason
                GROUP BY c2.GameType, c2.Season, s2.TeamId, s2.PlayerId
            ) d ON p.PlayerId = d.PlayerId AND c.GameType = d.GameType AND s.TeamId = d.TeamId
            WHERE c.ChallengeId = @challengeId
            GROUP BY s.PlayerId, p.Name, d.Damage, d.Games, d.Deaths, cs.StreamerId, p.TwitchName
            ORDER BY p.Name

            SELECT p.Name, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, d.Damage, d.Games GamesWithDamage, d.Deaths DeathsInGamesWithDamage, CASE WHEN cs.StreamerId IS NULL THEN NULL ELSE p.TwitchName END TwitchName
            FROM tblRoster r
            INNER JOIN tblPlayer p ON r.PlayerId = p.PlayerId
            INNER JOIN tblChallenge c ON c.ChallengedTeamId = r.TeamId
            LEFT OUTER JOIN tblChallengeStreamer cs ON c.ChallengeId = cs.ChallengeId AND p.PlayerId = cs.PlayerId
            LEFT OUTER JOIN (
                tblStat s
                INNER JOIN vwCompletedChallenge cc ON s.ChallengeId = cc.ChallengeId AND cc.Season = @season AND cc.GameType = @gameType
            ) ON r.PlayerId = s.PlayerId
            LEFT OUTER JOIN (
                SELECT c2.GameType, c2.Season, s2.TeamId, s2.PlayerId, COUNT(DISTINCT c2.ChallengeId) Games, SUM(d.Damage) Damage, SUM(s2.Deaths) Deaths
                FROM vwCompletedChallenge c2
                INNER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON d.ChallengeId = c2.ChallengeId
                INNER JOIN (
                    SELECT TeamId, PlayerId, ChallengeId, SUM(Deaths) Deaths
                    FROM tblStat
                    GROUP BY TeamId, PlayerId, ChallengeId
                ) s2 ON d.PlayerId = s2.PlayerId AND s2.ChallengeId = c2.ChallengeId
                WHERE c2.Season = @season
                    AND c2.Postseason = @postseason
                GROUP BY c2.GameType, c2.Season, s2.TeamId, s2.PlayerId
            ) d ON p.PlayerId = d.PlayerId AND c.GameType = d.GameType AND s.TeamId = d.TeamId
            WHERE c.ChallengeId = @challengeId
            GROUP BY s.PlayerId, p.Name, d.Damage, d.Games, d.Deaths, cs.StreamerId, p.TwitchName
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
                gameType: data.recordsets[0][0].GameType,
                matchTime: data.recordsets[0][0].MatchTime,
                overtimePeriods: data.recordsets[0][0].OvertimePeriods,
                name: data.recordsets[0][0].Name,
                teamId: data.recordsets[0][0].TeamId,
                captures: data.recordsets[0][0].Captures,
                pickups: data.recordsets[0][0].Pickups,
                carrierKills: data.recordsets[0][0].CarrierKills,
                returns: data.recordsets[0][0].Returns,
                kills: data.recordsets[0][0].Kills,
                assists: data.recordsets[0][0].Assists,
                deaths: data.recordsets[0][0].Deaths,
                damage: data.recordsets[0][0].Damage
            } || void 0,
            challengingTeamRoster: data.recordsets[1].map((row) => ({
                name: row.Name,
                games: row.Games,
                captures: row.Captures,
                pickups: row.Pickups,
                carrierKills: row.CarrierKills,
                returns: row.Returns,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                damage: row.Damage,
                gamesWithDamage: row.GamesWithDamage,
                deathsInGamesWithDamage: row.DeathsInGamesWithDamage,
                twitchName: row.TwitchName
            })),
            challengedTeamRoster: data.recordsets[2].map((row) => ({
                name: row.Name,
                games: row.Games,
                captures: row.Captures,
                pickups: row.Pickups,
                carrierKills: row.CarrierKills,
                returns: row.Returns,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                damage: row.Damage,
                gamesWithDamage: row.GamesWithDamage,
                deathsInGamesWithDamage: row.DeathsInGamesWithDamage,
                twitchName: row.TwitchName
            }))
        } || {data: void 0, challengingTeamRoster: void 0, challengedTeamRoster: void 0};
    }

    //              #    ###
    //              #    #  #
    //  ###   ##   ###   #  #   ###  # #    ###   ###   ##
    // #  #  # ##   #    #  #  #  #  ####  #  #  #  #  # ##
    //  ##   ##     #    #  #  # ##  #  #  # ##   ##   ##
    // #      ##     ##  ###    # #  #  #   # #  #      ##
    //  ###                                       ###
    /**
     * Gets the damage done for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<ChallengeTypes.DamageData[]>} A promise that resolves with the damage done for the challenge.
     */
    static async getDamage(challenge) {
        /** @type {ChallengeDbTypes.GetDamageRecordsets} */
        const data = await db.query(/* sql */`
            SELECT
                p.DiscordId,
                p.Name,
                d.TeamId,
                op.DiscordId OpponentDiscordId,
                op.Name OpponentName,
                d.Weapon,
                d.Damage
            FROM
                tblDamage d
                INNER JOIN tblPlayer p ON d.PlayerId = p.PlayerId
                INNER JOIN tblPlayer op ON d.OpponentPlayerId = op.PlayerId
            WHERE d.ChallengeId = @id
                AND (d.PlayerId = d.OpponentPlayerId OR d.TeamId <> d.OpponentTeamId)
        `, {id: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            discordId: row.DiscordId,
            name: row.Name,
            teamId: row.TeamId,
            opponentDiscordId: row.OpponentDiscordId,
            opponentName: row.OpponentName,
            weapon: row.Weapon,
            damage: row.Damage
        })) || [];
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
     * @returns {Promise<ChallengeTypes.DetailsData>} A promise that resolves with the challenge details.
     */
    static async getDetails(challenge) {
        /** @type {ChallengeDbTypes.GetDetailsRecordsets} */
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
                c.AdminCreated,
                c.HomesLocked,
                c.UsingHomeMapTeam,
                c.ChallengingTeamPenalized,
                c.ChallengedTeamPenalized,
                c.SuggestedMap,
                c.SuggestedMapTeamId,
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
                c.VoD,
                c.RatingChange,
                c.ChallengingTeamRating,
                c.ChallengedTeamRating,
                c.GameType,
                c.SuggestedGameType,
                c.SuggestedGameTypeTeamId
            FROM tblChallenge c
            LEFT OUTER JOIN tblPlayer p ON c.CasterPlayerId = p.PlayerId
            WHERE c.ChallengeId = @challengeId

            SELECT ch.Map
            FROM tblChallengeHome ch
            INNER JOIN tblChallenge c ON ch.ChallengeId = c.ChallengeId AND ch.GameType = c.GameType
            WHERE ch.ChallengeId = @challengeId
            ORDER BY ch.Number
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
            adminCreated: data.recordsets[0][0].AdminCreated,
            homesLocked: data.recordsets[0][0].HomesLocked,
            usingHomeMapTeam: data.recordsets[0][0].UsingHomeMapTeam,
            challengingTeamPenalized: data.recordsets[0][0].ChallengingTeamPenalized,
            challengedTeamPenalized: data.recordsets[0][0].ChallengedTeamPenalized,
            suggestedMap: data.recordsets[0][0].SuggestedMap,
            suggestedMapTeamId: data.recordsets[0][0].SuggestedMapTeamId,
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
            ratingChange: data.recordsets[0][0].RatingChange,
            challengingTeamRating: data.recordsets[0][0].ChallengingTeamRating,
            challengedTeamRating: data.recordsets[0][0].ChallengedTeamRating,
            gameType: data.recordsets[0][0].GameType,
            suggestedGameType: data.recordsets[0][0].SuggestedGameType,
            suggestedGameTypeTeamId: data.recordsets[0][0].SuggestedGameTypeTeamId,
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
     * @returns {Promise<ChallengeTypes.NotificationsData>} A promise that resolves with the notifications to send out.
     */
    static async getNotifications() {
        /** @type {ChallengeDbTypes.GetNotificationsRecordsets} */
        const data = await db.query(/* sql */`
            SELECT ChallengeId, DateClockDeadline
            FROM tblChallenge
            WHERE DateClockDeadline IS NOT NULL
                AND DateClockDeadlineNotified IS NULL
                AND DateClosed IS NULL

            SELECT ChallengeId, MatchTime
            FROM tblChallenge
            WHERE MatchTime IS NOT NULL
                AND DateMatchTimeNotified IS NULL
                AND DateConfirmed IS NULL
                AND DateVoided IS NULL
                AND DateClosed IS NULL

            SELECT ChallengeId, MatchTime
            FROM tblChallenge
            WHERE MatchTime IS NOT NULL
                AND DateMatchTimePassedNotified IS NULL
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

    //              #    ###                  #              #  #
    //              #    #  #                 #              ####
    //  ###   ##   ###   #  #   ###  ###    ###   ##   # #   ####   ###  ###
    // #  #  # ##   #    ###   #  #  #  #  #  #  #  #  ####  #  #  #  #  #  #
    //  ##   ##     #    # #   # ##  #  #  #  #  #  #  #  #  #  #  # ##  #  #
    // #      ##     ##  #  #   # #  #  #   ###   ##   #  #  #  #   # #  ###
    //  ###                                                              #
    /**
     * Gets a random map for a challenge.
     * @param {Challenge} challenge The challenge to get a random map for.
     * @param {string} direction The order to sort on, "top" or "bottom".
     * @param {number} count The number of maps to choose from.
     * @returns {Promise<string>} A promise that resolves with the randomly chosen map.
     */
    static async getRandomMap(challenge, direction, count) {
        /** @type {ChallengeDbTypes.GetRandomMapRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Map
            FROM (
                SELECT ${["top", "bottom"].indexOf(direction) !== -1 && !isNaN(count) ? `TOP ${count} ` : ""}Map, COUNT(ChallengeId) Games, NEWID() Id
                FROM vwCompletedChallenge
                WHERE GameType = @type
                    AND Map NOT IN (SELECT Map FROM tblChallengeHome WHERE ChallengeID = 1 AND GameType = @type)
                GROUP BY Map
                ${["top", "bottom"].indexOf(direction) !== -1 && !isNaN(count) ? `ORDER BY COUNT(ChallengeId) ${direction === "top" ? "DESC" : "ASC"} ` : ""}
            ) a
            ORDER BY Id
        `, {
            id: {type: Db.INT, value: challenge.id},
            type: {type: Db.VARCHAR(5), value: challenge.details.gameType}
        });

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Map || void 0;
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
     * @returns {Promise<ChallengeTypes.TeamStatsData[]>} A promise that resolves with the team's stats for the challenge.
     */
    static async getStatsForTeam(challenge, team) {
        /** @type {ChallengeDbTypes.GetStatsForTeamRecordsets} */
        const data = await db.query(/* sql */`
            SELECT p.DiscordId, p.Name, s.Captures, s.Pickups, s.CarrierKills, s.Returns, s.Kills, s.Assists, s.Deaths, SUM(d.Damage) Damage
            FROM tblStat s
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN tblDamage d ON s.PlayerId = d.PlayerId AND s.ChallengeId = d.ChallengeId
            WHERE s.ChallengeId = @challengeId
                AND s.TeamId = @teamId
                AND d.TeamId <> d.OpponentTeamId
            GROUP BY p.DiscordId, p.Name, s.Captures, s.Pickups, s.CarrierKills, s.Returns, s.Kills, s.Assists, s.Deaths
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            teamId: {type: Db.INT, value: team.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            discordId: row.DiscordId,
            name: row.Name,
            captures: row.Captures,
            pickups: row.Pickups,
            carrierKills: row.CarrierKills,
            returns: row.Returns,
            kills: row.Kills,
            assists: row.Assists,
            deaths: row.Deaths,
            damage: row.Damage
        })) || [];
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
     * @returns {Promise<ChallengeTypes.StreamerData[]>} A promise that resolves with the list of streamers for the challenge.
     */
    static async getStreamers(challenge) {
        /** @type {ChallengeDbTypes.GetStreamersRecordsets} */
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
     * @return {Promise<ChallengeTypes.TeamDetailsData>} A promise that resolves with the team details for the challenge.
     */
    static async getTeamDetails(challenge) {
        /** @type {ChallengeDbTypes.GetTeamDetailsRecordsets} */
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

                SELECT @season = MAX(Season) - CAST(@postseason AS INT)
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

            SELECT s.PlayerId, p.Name, s.TeamId, s.Captures, s.Pickups, s.CarrierKills, s.Returns, s.Kills, s.Assists, s.Deaths, CASE WHEN cs.StreamerId IS NULL THEN NULL ELSE p.TwitchName END TwitchName
            FROM tblStat s
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN tblChallengeStreamer cs ON s.ChallengeID = cs.ChallengeID AND p.PlayerID = cs.PlayerID
            WHERE s.ChallengeId = @challengeId

            SELECT d.PlayerId, p.Name, d.TeamId, op.Name OpponentName, d.OpponentTeamId, d.Weapon, d.Damage
            FROM tblDamage d
            INNER JOIN tblPlayer p ON d.PlayerId = p.PlayerId
            INNER JOIN tblPlayer op ON d.OpponentPlayerId = op.PlayerId
            WHERE d.ChallengeId = @challengeId
                AND (d.PlayerId = d.OpponentPlayerId OR d.TeamId <> d.OpponentTeamId)

            SELECT @Season Season, @Postseason Postseason
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets.length === 4 && {
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
                captures: row.Captures,
                pickups: row.Pickups,
                carrierKills: row.CarrierKills,
                returns: row.Returns,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                twitchName: row.TwitchName
            })),
            damage: data.recordsets[2].map((row) => ({
                playerId: row.PlayerId,
                name: row.Name,
                teamId: row.TeamId,
                opponentName: row.OpponentName,
                opponentTeamId: row.OpponentTeamId,
                weapon: row.Weapon,
                damage: row.Damage
            })),
            season: data.recordsets[3] && data.recordsets[3][0] && {season: data.recordsets[3][0].Season, postseason: data.recordsets[3][0].Postseason} || void 0
        } || {teams: void 0, stats: void 0, damage: void 0, season: void 0};
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
     * @param {number} number The number of the map, 1 through 5.
     * @returns {Promise<string>} A promise that resolves with the name of the map that was picked.
     */
    static async pickMap(challenge, number) {
        /** @type {ChallengeDbTypes.PickMapRecordsets} */
        const data = await db.query(/* sql */`
            UPDATE c
            SET Map = ch.Map,
                UsingHomeMapTeam = 1
            FROM tblChallenge c
            INNER JOIN tblChallengeHome ch ON c.ChallengeId = ch.ChallengeId AND c.GameType = ch.GameType
            WHERE c.ChallengeId = @challengeId
                AND ch.Number = @number

            SELECT Map FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            number: {type: Db.INT, value: number}
        });

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);

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
     * @param {DiscordJs.GuildMember|DiscordJs.User} pilot The pilot.
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
        /** @type {ChallengeDbTypes.ReportRecordsets} */
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
            discordId: {type: Db.VARCHAR(24), value: member ? member.id : void 0},
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
        /** @type {ChallengeDbTypes.SetConfirmedRecordsets} */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET DateConfirmed = GETUTCDATE() WHERE ChallengeId = @challengeId

            SELECT DateConfirmed FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:closed`]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateConfirmed || void 0;
    }

    //               #    ###
    //               #    #  #
    //  ###    ##   ###   #  #   ###  # #    ###   ###   ##
    // ##     # ##   #    #  #  #  #  ####  #  #  #  #  # ##
    //   ##   ##     #    #  #  # ##  #  #  # ##   ##   ##
    // ###     ##     ##  ###    # #  #  #   # #  #      ##
    //                                             ###
    /**
     * Sets the damage for a challenge.
     * @param {Challenge} challenge The challenge to set damage for.
     * @param {ChallengeTypes.SetDamageData[]} damage The damage stats.
     * @returns {Promise} A promise that resolves when the damage stats have been set.
     */
    static async setDamage(challenge, damage) {
        let sql = /* sql */`
            DELETE FROM tblDamage WHERE ChallengeId = @id
        `;

        /** @type {DbTypes.Parameters} */
        let params = {
            id: {type: Db.INT, value: challenge.id}
        };

        for (const stat of damage) {
            const index = damage.indexOf(stat);

            sql = /* sql */`
                ${sql}
                INSERT INTO tblDamage (ChallengeId, TeamId, PlayerId, OpponentTeamId, OpponentPlayerId, Weapon, Damage)
                SELECT @id, @team${index}Id, p.PlayerId, @opponentTeam${index}Id, op.PlayerId, @weapon${index}, @damage${index}
                FROM tblPlayer p
                CROSS JOIN tblPlayer op
                WHERE p.DiscordId = @discord${index}Id
                    AND op.DiscordId = @opponentDiscord${index}Id
            `;

            params[`team${index}Id`] = {type: Db.INT, value: stat.team.id};
            params[`discord${index}Id`] = {type: Db.VARCHAR(24), value: stat.discordId};
            params[`opponentTeam${index}Id`] = {type: Db.INT, value: stat.opponentTeam.id};
            params[`opponentDiscord${index}Id`] = {type: Db.VARCHAR(24), value: stat.opponentDiscordId};
            params[`weapon${index}`] = {type: Db.VARCHAR(50), value: stat.weapon};
            params[`damage${index}`] = {type: Db.FLOAT, value: stat.damage};

            if (Object.keys(params).length > 2000) {
                await db.query(sql, params);
                sql = "";
                params = {
                    id: {type: Db.INT, value: challenge.id}
                };
            }
        }

        await db.query(sql, params);
    }

    //               #     ##                     ###
    //               #    #  #                     #
    //  ###    ##   ###   #      ###  # #    ##    #    #  #  ###    ##
    // ##     # ##   #    # ##  #  #  ####  # ##   #    #  #  #  #  # ##
    //   ##   ##     #    #  #  # ##  #  #  ##     #     # #  #  #  ##
    // ###     ##     ##   ###   # #  #  #   ##    #      #   ###    ##
    //                                                   #    #
    /**
     * Sets the game type for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {string} gameType The game type.
     * @returns {Promise} A promise that resolves when the game type has been set.
     */
    static async setGameType(challenge, gameType) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET GameType = @gameType, SuggestedGameType = NULL, SuggestedGameTypeTeamId = NULL WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            gameType: {type: Db.VARCHAR(3), value: gameType}
        });

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);
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
        /** @type {ChallengeDbTypes.SetHomeMapTeamRecordsets} */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET HomeMapTeamId = @teamId, UsingHomeMapTeam = 1, Map = NULL WHERE ChallengeId = @challengeId

            DELETE FROM tblChallengeHome WHERE ChallengeId = @challengeId

            INSERT INTO tblChallengeHome (ChallengeId, Number, Map, GameType)
            SELECT @challengeId, Number, Map, GameType
            FROM tblTeamHome
            WHERE TeamId = @teamId

            SELECT ch.Map
            FROM tblChallengeHome ch
            INNER JOIN tblChallenge c ON ch.ChallengeId = c.ChallengeId AND ch.GameType = c.GameType
            WHERE ch.ChallengeId = @challengeId
            ORDER BY ch.Number
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [];
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
            UPDATE tblChallenge SET Map = @map, UsingHomeMapTeam = 0, SuggestedMap = NULL, SuggestedMapTeamId = NULL WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            map: {type: Db.VARCHAR(100), value: map}
        });

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);
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
     * @returns {Promise<Date>} A promise that resolves when the score is set.
     */
    static async setScore(challenge, challengingTeamScore, challengedTeamScore) {
        /** @type {ChallengeDbTypes.SetScoreRecordsets} */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET
                ReportingTeamId = NULL,
                ChallengingTeamScore = @challengingTeamScore,
                ChallengedTeamScore = @challengedTeamScore,
                DateConfirmed = GETUTCDATE()
            WHERE ChallengeId = @challengeId

            SELECT DateConfirmed FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {
            challengingTeamScore: {type: Db.INT, value: challengingTeamScore},
            challengedTeamScore: {type: Db.INT, value: challengedTeamScore},
            challengeId: {type: Db.INT, value: challenge.id}
        });

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:closed`]);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateConfirmed || void 0;
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

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);
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

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);
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

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);
    }

    //                                        #     ##                     ###
    //                                        #    #  #                     #
    //  ###   #  #   ###   ###   ##    ###   ###   #      ###  # #    ##    #    #  #  ###    ##
    // ##     #  #  #  #  #  #  # ##  ##      #    # ##  #  #  ####  # ##   #    #  #  #  #  # ##
    //   ##   #  #   ##    ##   ##      ##    #    #  #  # ##  #  #  ##     #     # #  #  #  ##
    // ###     ###  #     #      ##   ###      ##   ###   # #  #  #   ##    #      #   ###    ##
    //               ###   ###                                                    #    #
    /**
     * Suggests a game type for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @param {string} gameType The suggested game type.
     * @returns {Promise} A promise that resolves when the game type has been suggested.
     */
    static async suggestGameType(challenge, team, gameType) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedGameType = @gameType, SuggestedGameTypeTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
            gameType: {type: Db.VARCHAR(3), value: gameType},
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
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

    //                           ##         ##
    //                          #  #         #
    //  ###   #  #   ###  ###   #      ##    #     ##   ###    ###
    // ##     #  #  #  #  #  #  #     #  #   #    #  #  #  #  ##
    //   ##   ####  # ##  #  #  #  #  #  #   #    #  #  #       ##
    // ###    ####   # #  ###    ##    ##   ###    ##   #     ###
    //                    #
    /**
     * Swaps the colors of a challenge.
     * @param {Challenge} challenge The challenge to swap colors for.
     * @returns {Promise} A promise that resolves when the teams' colors have been swapped.
     */
    static async swapColors(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET
                BlueTeamId = OrangeTeamId,
                OrangeTeamId = BlueTeamId
            WHERE ChallengeId = @id
        `, {id: {type: Db.INT, value: challenge.id}});

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:updated`]);
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
        /** @type {ChallengeDbTypes.UnvoidRecordsets} */
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET DateVoided = NULL WHERE ChallengeId = @challengeId

            SELECT PlayerId FROM tblStat WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0].length > 0) {
            await Cache.invalidate(data.recordsets[0].map((row) => `${settings.redisPrefix}:invalidate:player:${row.PlayerId}:updated`).concat(`${settings.redisPrefix}:invalidate:challenge:closed`));
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
        /** @type {ChallengeDbTypes.VoidRecordsets} */
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
            await Cache.invalidate(data.recordsets[0].map((row) => `${settings.redisPrefix}:invalidate:player:${row.PlayerId}:updated`).concat(`${settings.redisPrefix}:invalidate:challenge:closed`));
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
     * @returns {Promise<ChallengeTypes.TeamPenaltyData[]>} A promise that resolves with a list of teams that were penalized along with whether it was their first penalty.
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

        /** @type {ChallengeDbTypes.VoidWithPenaltiesRecordsets} */
        const data = await db.query(sql, params);

        if (data && data.recordsets && data.recordsets[1] && data.recordsets[1].length > 0) {
            await Cache.invalidate(data.recordsets[1].map((row) => `${settings.redisPrefix}:invalidate:player:${row.PlayerId}:updated`).concat(`${settings.redisPrefix}:invalidate:challenge:closed`));
        }

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({teamId: row.TeamId, first: row.First})) || [];
    }
}

module.exports = ChallengeDb;
