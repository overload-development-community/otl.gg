/**
 * @typedef {import("../models/challenge")} Challenge
 * @typedef {import("../../types/challengeTypes").GamesByChallengeId} ChallengeTypes.GamesByChallengeId
 * @typedef {import("../../types/dbTypes").EmptyRecordsets} DbTypes.EmptyRecordsets
 * @typedef {import("../../types/dbTypes").Parameters} DbTypes.Parameters
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("../../types/mapTypes").MapGameType} MapTypes.MapGameType
 * @typedef {import("../models/newTeam")} NewTeam
 * @typedef {import("../models/team")} Team
 * @typedef {import("../../types/teamDbTypes").AddPilotRecordsets} TeamDbTypes.AddPilotRecordsets
 * @typedef {import("../../types/teamDbTypes").CreateRecordsets} TeamDbTypes.CreateRecordsets
 * @typedef {import("../../types/teamDbTypes").DisbandRecordsets} TeamDbTypes.DisbandRecordsets
 * @typedef {import("../../types/teamDbTypes").GetByIdRecordsets} TeamDbTypes.GetByIdRecordsets
 * @typedef {import("../../types/teamDbTypes").GetByNameOrTagRecordsets} TeamDbTypes.GetByNameOrTagRecordsets
 * @typedef {import("../../types/teamDbTypes").GetByPilotRecordsets} TeamDbTypes.GetByPilotRecordsets
 * @typedef {import("../../types/teamDbTypes").GetClockedChallengeCountRecordsets} TeamDbTypes.GetClockedChallengeCountRecordsets
 * @typedef {import("../../types/teamDbTypes").GetDataRecordsets} TeamDbTypes.GetDataRecordsets
 * @typedef {import("../../types/teamDbTypes").GetGameLogRecordsets} TeamDbTypes.GetGameLogRecordsets
 * @typedef {import("../../types/teamDbTypes").GetHomeMapsRecordsets} TeamDbTypes.GetHomeMapsRecordsets
 * @typedef {import("../../types/teamDbTypes").GetHomeMapsByTypeRecordsets} TeamDbTypes.GetHomeMapsByTypeRecordsets
 * @typedef {import("../../types/teamDbTypes").GetInfoRecordsets} TeamDbTypes.GetInfoRecordsets
 * @typedef {import("../../types/teamDbTypes").GetNeutralMapsRecordsets} TeamDbTypes.GetNeutralMapsRecordsets
 * @typedef {import("../../types/teamDbTypes").GetNeutralMapsByTypeRecordsets} TeamDbTypes.GetNeutralMapsByTypeRecordsets
 * @typedef {import("../../types/teamDbTypes").GetNextClockDateRecordsets} TeamDbTypes.GetNextClockDateRecordsets
 * @typedef {import("../../types/teamDbTypes").GetPilotAndInvitedCountRecordsets} TeamDbTypes.GetPilotAndInvitedCountRecordsets
 * @typedef {import("../../types/teamDbTypes").GetPilotCountRecordsets} TeamDbTypes.GetPilotCountRecordsets
 * @typedef {import("../../types/teamDbTypes").GetSeasonStandingsRecordsets} TeamDbTypes.GetSeasonStandingsRecordsets
 * @typedef {import("../../types/teamDbTypes").GetTimezoneRecordsets} TeamDbTypes.GetTimezoneRecordsets
 * @typedef {import("../../types/teamDbTypes").HasClockedTeamThisSeasonRecordsets} TeamDbTypes.HasClockedTeamThisSeasonRecordsets
 * @typedef {import("../../types/teamDbTypes").ReinstateRecordsets} TeamDbTypes.ReinstateRecordsets
 * @typedef {import("../../types/teamDbTypes").RemovePilotRecordsets} TeamDbTypes.RemovePilotRecordsets
 * @typedef {import("../../types/teamTypes").GameLog} TeamTypes.GameLog
 * @typedef {import("../../types/teamTypes").Standing} TeamTypes.Standing
 * @typedef {import("../../types/teamTypes").TeamData} TeamTypes.TeamData
 * @typedef {import("../../types/teamTypes").TeamInfo} TeamTypes.TeamInfo
 * @typedef {import("../../types/teamTypes").TeamStats} TeamTypes.TeamStats
 */

const Cache = require("@roncli/node-redis").Cache,
    Db = require("@roncli/node-database"),

    db = require("./index"),
    settings = require("../../settings");

//  #####                       ####   #
//    #                          #  #  #
//    #     ###    ###   ## #    #  #  # ##
//    #    #   #      #  # # #   #  #  ##  #
//    #    #####   ####  # # #   #  #  #   #
//    #    #      #   #  # # #   #  #  ##  #
//    #     ###    ####  #   #  ####   # ##
/**
 * A class that handles calls to the database for teams.
 */
class TeamDb {
    //          #     #   ##                #           #
    //          #     #  #  #               #
    //  ###   ###   ###  #      ###  ###   ###    ###  ##    ###
    // #  #  #  #  #  #  #     #  #  #  #   #    #  #   #    #  #
    // # ##  #  #  #  #  #  #  # ##  #  #   #    # ##   #    #  #
    //  # #   ###   ###   ##    # #  ###     ##   # #  ###   #  #
    //                               #
    /**
     * Adds a captain to a team.
     * @param {Team} team The team to add the captain to.
     * @param {DiscordJs.GuildMember} member The captain to add.
     * @returns {Promise} A promise that resolves when the captain has been added.
     */
    static async addCaptain(team, member) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblRoster SET Captain = 1 WHERE PlayerId = @playerId AND TeamId = @teamId

            MERGE tblCaptainHistory ch
                USING (VALUES (@teamId, @playerId)) AS v (TeamId, PlayerId)
                ON ch.TeamId = v.TeamId AND ch.PlayerId = v.PlayerId
            WHEN NOT MATCHED THEN
                INSERT (TeamId, PlayerId) VALUES (v.TeamId, v.PlayerId);
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //          #     #  #  #                    #  #
    //          #     #  #  #                    ####
    //  ###   ###   ###  ####   ##   # #    ##   ####   ###  ###
    // #  #  #  #  #  #  #  #  #  #  ####  # ##  #  #  #  #  #  #
    // # ##  #  #  #  #  #  #  #  #  #  #  ##    #  #  # ##  #  #
    //  # #   ###   ###  #  #   ##   #  #   ##   #  #   # #  ###
    //                                                       #
    /**
     * Adds a home map for a team.
     * @param {Team} team The team adding the home map.
     * @param {string} gameType The game type.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the home map has been added.
     */
    static async addHomeMap(team, gameType, map) {
        await db.query(/* sql */`
            INSERT INTO tblTeamHome (TeamId, Map, GameType)
            VALUES (@teamId, @map, @gameType)
        `, {
            teamId: {type: Db.INT, value: team.id},
            map: {type: Db.VARCHAR(100), value: map},
            gameType: {type: Db.VARCHAR(5), value: gameType}
        });
    }

    //          #     #  #  #               #                ##    #  #
    //          #     #  ## #               #                 #    ####
    //  ###   ###   ###  ## #   ##   #  #  ###   ###    ###   #    ####   ###  ###
    // #  #  #  #  #  #  # ##  # ##  #  #   #    #  #  #  #   #    #  #  #  #  #  #
    // # ##  #  #  #  #  # ##  ##    #  #   #    #     # ##   #    #  #  # ##  #  #
    //  # #   ###   ###  #  #   ##    ###    ##  #      # #  ###   #  #   # #  ###
    //                                                                         #
    /**
     * Adds a neutral map for a team.
     * @param {Team} team The team adding the neutral map.
     * @param {string} gameType The game type.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the neutral map has been added.
     */
    static async addNeutralMap(team, gameType, map) {
        await db.query(/* sql */`
            INSERT INTO tblTeamNeutral (TeamId, Map, GameType)
            VALUES (@teamId, @map, @gameType)
        `, {
            teamId: {type: Db.INT, value: team.id},
            map: {type: Db.VARCHAR(100), value: map},
            gameType: {type: Db.VARCHAR(5), value: gameType}
        });
    }

    //          #     #  ###    #    ##           #
    //          #     #  #  #         #           #
    //  ###   ###   ###  #  #  ##     #     ##   ###
    // #  #  #  #  #  #  ###    #     #    #  #   #
    // # ##  #  #  #  #  #      #     #    #  #   #
    //  # #   ###   ###  #     ###   ###    ##     ##
    /**
     * Adds a pilot to a team.  Also removes any outstanding requests or invites for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot to add.
     * @param {Team} team The team to add the pilot to.
     * @returns {Promise} A promise that resolves when the pilot has been added to the team.
     */
    static async addPilot(member, team) {
        /** @type {TeamDbTypes.AddPilotRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF @playerId IS NULL
            BEGIN
                INSERT INTO tblPlayer (DiscordId, Name)
                VALUES (@discordId, @name)

                SET @playerId = SCOPE_IDENTITY()
            END

            INSERT INTO tblRoster (TeamId, PlayerId) VALUES (@teamId, @playerId)
            DELETE FROM tblRequest WHERE PlayerId = @playerId
            DELETE FROM tblInvite WHERE PlayerId = @playerId
            DELETE FROM tblJoinBan WHERE PlayerId = @playerId
            INSERT INTO tblJoinBan (PlayerId) VALUES (@playerId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND PlayerId = @playerId

            SELECT @playerId PlayerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(64), value: member.displayName},
            teamId: {type: Db.INT, value: team.id}
        });

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].PlayerId) {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:player:updated`, `${settings.redisPrefix}:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:player:updated`]);
        }
    }

    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Creates a team with the specified pilot as the founder.
     * @param {NewTeam} newTeam The new team.
     * @returns {Promise<TeamTypes.TeamData>} A promise that resolves with the created team.
     */
    static async create(newTeam) {
        /** @type {TeamDbTypes.CreateRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT
            DECLARE @teamId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            INSERT INTO tblTeam (Name, Tag) VALUES (@name, @tag)

            SET @teamId = SCOPE_IDENTITY()

            INSERT INTO tblRoster (TeamId, PlayerId, Founder) VALUES (@teamId, @playerId, 1)

            MERGE tblCaptainHistory ch
                USING (VALUES (@teamId, @playerId)) AS v (TeamId, PlayerId)
                ON ch.TeamId = v.TeamId AND ch.PlayerId = v.PlayerId
            WHEN NOT MATCHED THEN
                INSERT (TeamId, PlayerId) VALUES (v.TeamId, v.PlayerId);

            DELETE FROM tblJoinBan WHERE PlayerId = @playerId
            INSERT INTO tblJoinBan (PlayerId) VALUES (@playerId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND PlayerId = @playerId
            DELETE FROM tblNewTeam WHERE NewTeamId = @newTeamId

            SELECT @teamId TeamId, @playerId PlayerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: newTeam.member.id},
            name: {type: Db.VARCHAR(25), value: newTeam.name},
            tag: {type: Db.VARCHAR(5), value: newTeam.tag},
            newTeamId: {type: Db.INT, value: newTeam.id}
        });

        const teamId = data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].TeamId || void 0;

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].PlayerId) {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:team:status`, `${settings.redisPrefix}:invalidate:player:updated`, `${settings.redisPrefix}:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:team:status`, `${settings.redisPrefix}:invalidate:player:updated`]);
        }

        return teamId ? {member: newTeam.member, id: teamId, name: newTeam.name, tag: newTeam.tag, isFounder: true, disbanded: false, locked: false} : void 0;
    }

    //    #   #           #                    #
    //    #               #                    #
    //  ###  ##     ###   ###    ###  ###    ###
    // #  #   #    ##     #  #  #  #  #  #  #  #
    // #  #   #      ##   #  #  # ##  #  #  #  #
    //  ###  ###   ###    ###    # #  #  #   ###
    /**
     * Disbands a team.
     * @param {Team} team The team to disband.
     * @returns {Promise<number[]>} A promise that resolves with the list of challenge IDs that need to be voided due to the team being disbanded.
     */
    static async disband(team) {
        /** @type {TeamDbTypes.DisbandRecordsets} */
        const data = await db.query(/* sql */`
            UPDATE tblTeam SET Disbanded = 1 WHERE TeamId = @teamId

            DELETE FROM cs
            FROM tblChallengeStreamer cs
            INNER JOIN tblChallenge c ON cs.ChallengeId = c.ChallengeId
            WHERE c.DateConfirmed IS NULL
                AND c.DateVoided IS NULL
                AND cs.PlayerId IN (SELECT PlayerId FROM tblRoster WHERE TeamId = @teamId)

            DELETE FROM tb
            FROM tblTeamBan tb
            INNER JOIN tblRoster r
                ON tb.TeamId = r.TeamId
                AND tb.PlayerId = r.PlayerId
            WHERE r.TeamId = @teamId
                AND Founder = 1

            INSERT INTO tblTeamBan (TeamId, PlayerId)
            SELECT @teamId, PlayerId
            FROM tblRoster
            WHERE TeamId = @teamId
                AND Founder = 1

            SELECT PlayerId FROM tblRoster WHERE TeamId = @teamId

            DELETE FROM tblRoster WHERE TeamId = @teamId
            DELETE FROM tblRequest WHERE TeamId = @teamId
            DELETE FROM tblInvite WHERE TeamId = @teamId

            SELECT ChallengeId
            FROM tblChallenge
            WHERE (ChallengingTeamId = @teamId OR ChallengedTeamId = @teamId)
                AND DateConfirmed IS NULL
                AND DateClosed IS NULL
                AND DateVoided IS NULL
        `, {teamId: {type: Db.INT, value: team.id}});

        if (data && data.recordsets && data.recordsets[1]) {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:team:status`, `${settings.redisPrefix}:invalidate:player:updated`].concat(data.recordsets[1].map((row) => `${settings.redisPrefix}:invalidate:player:${row.PlayerId}:updated`)));
        } else {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:team:status`, `${settings.redisPrefix}:invalidate:player:updated`]);
        }

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.ChallengeId) || [];
    }

    //              #    ###         ###      #
    //              #    #  #         #       #
    //  ###   ##   ###   ###   #  #   #     ###
    // #  #  # ##   #    #  #  #  #   #    #  #
    //  ##   ##     #    #  #   # #   #    #  #
    // #      ##     ##  ###     #   ###    ###
    //  ###                     #
    /**
     * Gets the team by the team ID.
     * @param {number} id The Team ID.
     * @returns {Promise<TeamTypes.TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getById(id) {
        /** @type {TeamDbTypes.GetByIdRecordsets} */
        const data = await db.query(/* sql */`
            SELECT TeamId, Name, Tag, Locked
            FROM tblTeam
            WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, locked: !!data.recordsets[0][0].Locked} || void 0;
    }

    //              #    ###         #  #                     ##         ###
    //              #    #  #        ## #                    #  #         #
    //  ###   ##   ###   ###   #  #  ## #   ###  # #    ##   #  #  ###    #     ###   ###
    // #  #  # ##   #    #  #  #  #  # ##  #  #  ####  # ##  #  #  #  #   #    #  #  #  #
    //  ##   ##     #    #  #   # #  # ##  # ##  #  #  ##    #  #  #      #    # ##   ##
    // #      ##     ##  ###     #   #  #   # #  #  #   ##    ##   #      #     # #  #
    //  ###                     #                                                     ###
    /**
     * Gets a team by name or tag.
     * @param {string} text The name or tag of the team.
     * @returns {Promise<TeamTypes.TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getByNameOrTag(text) {
        /** @type {TeamDbTypes.GetByNameOrTagRecordsets} */
        const data = await db.query(/* sql */`
            SELECT TeamId, Name, Tag, Disbanded, Locked FROM tblTeam WHERE Name = @text OR Tag = @text
        `, {text: {type: Db.VARCHAR(25), value: text}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, disbanded: !!data.recordsets[0][0].Disbanded, locked: !!data.recordsets[0][0].Locked} || void 0;
    }

    //              #    ###         ###    #    ##           #
    //              #    #  #        #  #         #           #
    //  ###   ##   ###   ###   #  #  #  #  ##     #     ##   ###
    // #  #  # ##   #    #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #    #  #   # #  #      #     #    #  #   #
    // #      ##     ##  ###     #   #     ###   ###    ##     ##
    //  ###                     #
    /**
     * Gets the team for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot to get the team for.
     * @returns {Promise<TeamTypes.TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getByPilot(member) {
        /** @type {TeamDbTypes.GetByPilotRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            SELECT TeamId, Name, Tag, CASE WHEN EXISTS(SELECT TOP 1 1 FROM tblRoster WHERE Founder = 1 AND PlayerId = @playerId) THEN 1 ELSE 0 END IsFounder, Locked
            FROM tblTeam
            WHERE TeamId IN (SELECT TeamId FROM tblRoster WHERE PlayerId = @playerId)
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {member, id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, isFounder: !!data.recordsets[0][0].IsFounder, locked: !!data.recordsets[0][0].Locked} || void 0;
    }

    //              #     ##   ##                #              #   ##   #           ##    ##                             ##                      #
    //              #    #  #   #                #              #  #  #  #            #     #                            #  #                     #
    //  ###   ##   ###   #      #     ##    ##   # #    ##    ###  #     ###    ###   #     #     ##   ###    ###   ##   #      ##   #  #  ###   ###
    // #  #  # ##   #    #      #    #  #  #     ##    # ##  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #     #  #  #  #  #  #   #
    //  ##   ##     #    #  #   #    #  #  #     # #   ##    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #
    // #      ##     ##   ##   ###    ##    ##   #  #   ##    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##    ##    ###  #  #    ##
    //  ###                                                                                                   ###
    /**
     * Gets the number of clocked challenges for a team.
     * @param {Team} team The team to check.
     * @returns {Promise<number>} A promise that resolves with the number of clocked challenges for this team.
     */
    static async getClockedChallengeCount(team) {
        /** @type {TeamDbTypes.GetClockedChallengeCountRecordsets} */
        const data = await db.query(/* sql */`
            SELECT COUNT(ChallengeId) ClockedChallenges
            FROM tblChallenge
            WHERE (ChallengingTeamId = @teamId OR ChallengedTeamId = @teamId)
                AND DateClocked IS NOT NULL
                AND DateConfirmed IS NULL
                AND DateClosed IS NULL
                AND DateVoided IS NULL
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].ClockedChallenges || 0;
    }

    //              #    ###          #
    //              #    #  #         #
    //  ###   ##   ###   #  #   ###  ###    ###
    // #  #  # ##   #    #  #  #  #   #    #  #
    //  ##   ##     #    #  #  # ##   #    # ##
    // #      ##     ##  ###    # #    ##   # #
    //  ###
    /**
     * Gets data for the team.
     * @param {Team} team The team to get the data for.
     * @param {number} season The season to get the team's data for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<TeamTypes.TeamStats>} The team data.
     */
    static async getData(team, season, postseason) {
        const key = `${settings.redisPrefix}:db:team:getData:${team.tag}:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {TeamTypes.TeamStats} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {TeamDbTypes.GetDataRecordsets} */
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
                TeamId, Name, Tag, Disbanded, Locked,
                Rating,
                Wins, Losses, Ties, WinsTA, LossesTA, TiesTA, WinsCTF, LossesCTF, TiesCTF, WinsHomeTA, LossesHomeTA, TiesHomeTA, WinsAwayTA, LossesAwayTA, TiesAwayTA, WinsNeutralTA, LossesNeutralTA, TiesNeutralTA, WinsHomeCTF, LossesHomeCTF, TiesHomeCTF, WinsAwayCTF, LossesAwayCTF, TiesAwayCTF, WinsNeutralCTF, LossesNeutralCTF, TiesNeutralCTF, Wins2v2TA, Losses2v2TA, Ties2v2TA, Wins3v3TA, Losses3v3TA, Ties3v3TA, Wins4v4TA, Losses4v4TA, Ties4v4TA, Wins2v2CTF, Losses2v2CTF, Ties2v2CTF, Wins3v3CTF, Losses3v3CTF, Ties3v3CTF, Wins4v4CTF, Losses4v4CTF, Ties4v4CTF
            FROM
            (
                SELECT
                    t.TeamId,
                    t.Name,
                    t.Tag,
                    t.Disbanded,
                    t.Locked,
                    tr.Rating,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsHomeTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesHomeTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesHomeTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsAwayTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesAwayTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesAwayTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsNeutralTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesNeutralTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.UsingHomeMapTeam = 0 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesNeutralTA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsHomeCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesHomeCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesHomeCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsAwayCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesAwayCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesAwayCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsNeutralCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesNeutralCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.UsingHomeMapTeam = 0 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesNeutralCTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins2v2TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses2v2TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize = 2 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties2v2TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins3v3TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses3v3TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize = 3 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties3v3TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize >= 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins4v4TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize >= 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses4v4TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'TA' AND c.TeamSize >= 4 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties4v4TA,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins2v2CTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses2v2CTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize = 2 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties2v2CTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins3v3CTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses3v3CTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize = 3 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties3v3CTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize >= 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins4v4CTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize >= 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses4v4CTF,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.GameType = 'CTF' AND c.TeamSize >= 4 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties4v4CTF
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @season
                WHERE t.TeamId = @teamId
            ) a

            SELECT
                CASE WHEN c.ChallengingTeamId = @teamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END TeamId,
                t.Name,
                t.Tag,
                SUM(CASE WHEN ((c.ChallengingTeamId = @teamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = @teamId AND c.ChallengedTeamScore > c.ChallengingTeamScore)) THEN 1 ELSE 0 END) Wins,
                SUM(CASE WHEN ((c.ChallengingTeamId = @teamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = @teamId AND c.ChallengedTeamScore < c.ChallengingTeamScore)) THEN 1 ELSE 0 END) Losses,
                SUM(CASE WHEN c.ChallengingTeamScore = c.ChallengedTeamScore THEN 1 ELSE 0 END) Ties,
                c.GameType
            FROM vwCompletedChallenge c
            INNER JOIN tblTeam t ON CASE WHEN c.ChallengingTeamId = @teamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = t.TeamId
            WHERE (c.ChallengingTeamId = @teamId OR c.ChallengedTeamId = @teamId)
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            GROUP BY CASE WHEN ChallengingTeamId = @teamId THEN ChallengedTeamId ELSE ChallengingTeamId END, t.Name, t.Tag, c.GameType
            ORDER BY t.Name

            SELECT
                CASE WHEN c.ChallengingTeamId = @teamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END TeamId,
                t.Name,
                t.Tag,
                CASE WHEN COUNT(c.ChallengeId) > 3 THEN 3 ELSE COUNT(c.ChallengeId) END * (1000 + 1000 * ((1.0 * SUM(CASE WHEN ((c.ChallengingTeamId = @teamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = @teamId AND c.ChallengedTeamScore > c.ChallengingTeamScore)) THEN 1 ELSE 0 END) + 0.5 * SUM(CASE WHEN c.ChallengingTeamScore = c.ChallengedTeamScore THEN 1 ELSE 0 END)) / COUNT(c.ChallengeId))) / 3.0 Rating
            FROM vwCompletedChallenge c
            INNER JOIN tblTeam t ON CASE WHEN c.ChallengingTeamId = @teamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = t.TeamId
            WHERE (c.ChallengingTeamId = @teamId OR c.ChallengedTeamId = @teamId)
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            GROUP BY CASE WHEN ChallengingTeamId = @teamId THEN ChallengedTeamId ELSE ChallengingTeamId END, t.Name, t.Tag
            ORDER BY t.Name

            SELECT
                Map,
                SUM(CASE WHEN ((ChallengingTeamId = @teamId AND ChallengingTeamScore > ChallengedTeamScore) OR (ChallengedTeamId = @teamId AND ChallengedTeamScore > ChallengingTeamScore)) THEN 1 ELSE 0 END) Wins,
                SUM(CASE WHEN ((ChallengingTeamId = @teamId AND ChallengingTeamScore < ChallengedTeamScore) OR (ChallengedTeamId = @teamId AND ChallengedTeamScore < ChallengingTeamScore)) THEN 1 ELSE 0 END) Losses,
                SUM(CASE WHEN ChallengingTeamScore = ChallengedTeamScore THEN 1 ELSE 0 END) Ties,
                GameType
            FROM vwCompletedChallenge
            WHERE (ChallengingTeamId = @teamId OR ChallengedTeamId = @teamId)
                AND (@season = 0 OR Season = @season)
                AND Postseason = @postseason
            GROUP BY Map, GameType
            ORDER BY Map

            SELECT s.PlayerId, p.Name, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, d.Damage Damage, d.Games GamesWithDamage, d.Deaths DeathsInGamesWithDamage, SUM(c.OvertimePeriods) OvertimePeriods, t.TeamId, t.Name TeamName, t.Tag TeamTag, bc.ChallengeId, t1.Tag ChallengingTeamTag, t2.Tag ChallengedTeamTag, bc.Map, bc.MatchTime, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths, sb.Damage BestDamage
            FROM tblStat s
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY s.PlayerId, s.TeamId ORDER BY CAST(s.Kills + s.Assists AS FLOAT) / CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END DESC) Row,
                    s.ChallengeId,
                    s.PlayerId,
                    s.TeamId,
                    s.Kills,
                    s.Assists,
                    s.Deaths,
                    d.Damage
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c2 ON s.ChallengeId = c2.ChallengeId
                LEFT OUTER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON c2.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
                WHERE (@season = 0 OR c2.Season = @season)
                    AND c2.Postseason = @postseason
                    AND c2.GameType = 'TA'
            ) sb ON s.PlayerId = sb.PlayerId AND sb.TeamId = @teamId AND sb.Row = 1
            INNER JOIN tblChallenge bc ON sb.ChallengeId = bc.ChallengeId
            INNER JOIN tblTeam t ON (CASE WHEN bc.ChallengingTeamId = @teamId THEN bc.ChallengedTeamId ELSE bc.ChallengingTeamId END) = t.TeamId
            INNER JOIN tblTeam t1 ON bc.ChallengingTeamId = t1.TeamId
            INNER JOIN tblTeam t2 ON bc.ChallengedTeamId = t2.TeamId
            LEFT OUTER JOIN (
                SELECT s2.TeamId, s2.PlayerId, COUNT(DISTINCT c2.ChallengeId) Games, SUM(d.Damage) Damage, SUM(s2.Deaths) Deaths
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
                WHERE (@season = 0 OR c2.Season = @season)
                    AND c2.Postseason = @postseason
                    AND c2.GameType = 'TA'
                    AND s2.TeamId = @teamId
                GROUP BY s2.TeamId, s2.PlayerId
            ) d ON p.PlayerId = d.PlayerId AND s.TeamId = d.TeamId
            WHERE s.TeamId = @teamId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
                AND c.GameType = 'TA'
            GROUP BY s.PlayerId, p.Name, d.Games, d.Damage, d.Deaths, t.TeamId, t.Tag, t.Name, bc.ChallengeId, t1.Tag, t2.Tag, bc.Map, bc.MatchTime, sb.Kills, sb.Assists, sb.Deaths, sb.Damage
            ORDER BY p.Name

            SELECT s.PlayerId, p.Name, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(d.Damage) Damage, SUM(c.OvertimePeriods) OvertimePeriods, t.TeamId, t.Name TeamName, t.Tag TeamTag, bc.ChallengeId, t1.Tag ChallengingTeamTag, t2.Tag ChallengedTeamTag, bc.Map, bc.MatchTime, sb.Captures BestCaptures, sb.Pickups BestPickups, sb.CarrierKills BestCarrierKills, sb.Returns BestReturns, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths, sb.Damage BestDamage
            FROM tblStat s
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY s.PlayerId, s.TeamId ORDER BY s.Captures DESC, s.CarrierKills DESC, CAST(s.Kills + s.Assists AS FLOAT) / CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END DESC) Row,
                    s.ChallengeId,
                    s.PlayerId,
                    s.TeamId,
                    s.Captures,
                    s.Pickups,
                    s.CarrierKills,
                    s.Returns,
                    s.Kills,
                    s.Assists,
                    s.Deaths,
                    d.Damage
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c2 ON s.ChallengeId = c2.ChallengeId
                LEFT OUTER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON c2.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
                WHERE (@season = 0 OR c2.Season = @season)
                    AND c2.Postseason = @postseason
                    AND c2.GameType = 'CTF'
            ) sb ON s.PlayerId = sb.PlayerId AND sb.TeamId = @teamId AND sb.Row = 1
            INNER JOIN tblChallenge bc ON sb.ChallengeId = bc.ChallengeId
            INNER JOIN tblTeam t ON (CASE WHEN bc.ChallengingTeamId = @teamId THEN bc.ChallengedTeamId ELSE bc.ChallengingTeamId END) = t.TeamId
            INNER JOIN tblTeam t1 ON bc.ChallengingTeamId = t1.TeamId
            INNER JOIN tblTeam t2 ON bc.ChallengedTeamId = t2.TeamId
            LEFT OUTER JOIN (
                SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                FROM tblDamage
                WHERE TeamId <> OpponentTeamId
                GROUP BY PlayerId, ChallengeId
            ) d ON c.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
            WHERE s.TeamId = @teamId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
                AND c.GameType = 'CTF'
            GROUP BY s.PlayerId, p.Name, t.TeamId, t.Tag, t.Name, bc.ChallengeId, t1.Tag, t2.Tag, bc.Map, bc.MatchTime, sb.Captures, sb.Pickups, sb.CarrierKills, sb.Returns, sb.Kills, sb.Assists, sb.Deaths, sb.Damage
            ORDER BY p.Name

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            teamId: {type: Db.INT, value: team.id},
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        cache = data && data.recordsets && data.recordsets.length >= 6 && {
            records: data.recordsets[0][0] && {
                teamId: data.recordsets[0][0].TeamId,
                name: data.recordsets[0][0].Name,
                tag: data.recordsets[0][0].Tag,
                disbanded: data.recordsets[0][0].Disbanded,
                locked: data.recordsets[0][0].Locked,
                rating: data.recordsets[0][0].Rating,
                wins: data.recordsets[0][0].Wins,
                losses: data.recordsets[0][0].Losses,
                ties: data.recordsets[0][0].Ties,
                winsTA: data.recordsets[0][0].WinsTA,
                lossesTA: data.recordsets[0][0].LossesTA,
                tiesTA: data.recordsets[0][0].TiesTA,
                winsCTF: data.recordsets[0][0].WinsCTF,
                lossesCTF: data.recordsets[0][0].LossesCTF,
                tiesCTF: data.recordsets[0][0].TiesCTF,
                winsHomeTA: data.recordsets[0][0].WinsHomeTA,
                lossesHomeTA: data.recordsets[0][0].LossesHomeTA,
                tiesHomeTA: data.recordsets[0][0].TiesHomeTA,
                winsAwayTA: data.recordsets[0][0].WinsAwayTA,
                lossesAwayTA: data.recordsets[0][0].LossesAwayTA,
                tiesAwayTA: data.recordsets[0][0].TiesAwayTA,
                winsNeutralTA: data.recordsets[0][0].WinsNeutralTA,
                lossesNeutralTA: data.recordsets[0][0].LossesNeutralTA,
                tiesNeutralTA: data.recordsets[0][0].TiesNeutralTA,
                winsHomeCTF: data.recordsets[0][0].WinsHomeCTF,
                lossesHomeCTF: data.recordsets[0][0].LossesHomeCTF,
                tiesHomeCTF: data.recordsets[0][0].TiesHomeCTF,
                winsAwayCTF: data.recordsets[0][0].WinsAwayCTF,
                lossesAwayCTF: data.recordsets[0][0].LossesAwayCTF,
                tiesAwayCTF: data.recordsets[0][0].TiesAwayCTF,
                winsNeutralCTF: data.recordsets[0][0].WinsNeutralCTF,
                lossesNeutralCTF: data.recordsets[0][0].LossesNeutralCTF,
                tiesNeutralCTF: data.recordsets[0][0].TiesNeutralCTF,
                wins2v2TA: data.recordsets[0][0].Wins2v2TA,
                losses2v2TA: data.recordsets[0][0].Losses2v2TA,
                ties2v2TA: data.recordsets[0][0].Ties2v2TA,
                wins3v3TA: data.recordsets[0][0].Wins3v3TA,
                losses3v3TA: data.recordsets[0][0].Losses3v3TA,
                ties3v3TA: data.recordsets[0][0].Ties3v3TA,
                wins4v4TA: data.recordsets[0][0].Wins4v4TA,
                losses4v4TA: data.recordsets[0][0].Losses4v4TA,
                ties4v4TA: data.recordsets[0][0].Ties4v4TA,
                wins2v2CTF: data.recordsets[0][0].Wins2v2CTF,
                losses2v2CTF: data.recordsets[0][0].Losses2v2CTF,
                ties2v2CTF: data.recordsets[0][0].Ties2v2CTF,
                wins3v3CTF: data.recordsets[0][0].Wins3v3CTF,
                losses3v3CTF: data.recordsets[0][0].Losses3v3CTF,
                ties3v3CTF: data.recordsets[0][0].Ties3v3CTF,
                wins4v4CTF: data.recordsets[0][0].Wins4v4CTF,
                losses4v4CTF: data.recordsets[0][0].Losses4v4CTF,
                ties4v4CTF: data.recordsets[0][0].Ties4v4CTF
            } || void 0,
            opponents: data.recordsets[1].map((row) => ({
                teamId: row.TeamId,
                name: row.Name,
                tag: row.Tag,
                wins: row.Wins,
                losses: row.Losses,
                ties: row.Ties,
                gameType: row.GameType
            })),
            ratings: data.recordsets[2].map((row) => ({
                teamId: row.TeamId,
                name: row.Name,
                tag: row.Tag,
                rating: row.Rating
            })),
            maps: data.recordsets[3].map((row) => ({
                map: row.Map,
                wins: row.Wins,
                losses: row.Losses,
                ties: row.Ties,
                gameType: row.GameType
            })),
            statsTA: data.recordsets[4].map((row) => ({
                playerId: row.PlayerId,
                name: row.Name,
                games: row.Games,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                damage: row.Damage,
                gamesWithDamage: row.GamesWithDamage,
                deathsInGamesWithDamage: row.DeathsInGamesWithDamage,
                overtimePeriods: row.OvertimePeriods,
                teamId: row.TeamId,
                teamName: row.TeamName,
                teamTag: row.TeamTag,
                challengeId: row.ChallengeId,
                challengingTeamTag: row.ChallengingTeamTag,
                challengedTeamTag: row.ChallengedTeamTag,
                map: row.Map,
                matchTime: row.MatchTime,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths,
                bestDamage: row.BestDamage
            })),
            statsCTF: data.recordsets[5].map((row) => ({
                playerId: row.PlayerId,
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
                overtimePeriods: row.OvertimePeriods,
                teamId: row.TeamId,
                teamName: row.TeamName,
                teamTag: row.TeamTag,
                challengeId: row.ChallengeId,
                challengingTeamTag: row.ChallengingTeamTag,
                challengedTeamTag: row.ChallengedTeamTag,
                map: row.Map,
                matchTime: row.MatchTime,
                bestCaptures: row.BestCaptures,
                bestPickups: row.BestPickups,
                bestCarrierKills: row.BestCarrierKills,
                bestReturns: row.BestReturns,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths,
                bestDamage: row.BestDamage
            }))
        } || {records: void 0, opponents: void 0, ratings: void 0, maps: void 0, statsTA: void 0, statsCTF: void 0};

        await Cache.add(key, cache, season === void 0 && data && data.recordsets && data.recordsets[6] && data.recordsets[6][0] && data.recordsets[6][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`]);

        return cache;
    }

    //              #     ##                     #
    //              #    #  #                    #
    //  ###   ##   ###   #      ###  # #    ##   #      ##    ###
    // #  #  # ##   #    # ##  #  #  ####  # ##  #     #  #  #  #
    //  ##   ##     #    #  #  # ##  #  #  ##    #     #  #   ##
    // #      ##     ##   ###   # #  #  #   ##   ####   ##   #
    //  ###                                                   ###
    /**
     * Gets the game log for the team.
     * @param {Team} team The team to get the game log for.
     * @param {number} season The season to get the team's game log for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<TeamTypes.GameLog[]>} The team's game log.
     */
    static async getGameLog(team, season, postseason) {
        const key = `${settings.redisPrefix}:db:team:getGameLog:${team.tag}:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {TeamTypes.GameLog[]} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {TeamDbTypes.GetGameLogRecordsets} */
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
                c.ChallengingTeamId,
                tc1.Name ChallengingTeamName,
                tc1.Tag ChallengingTeamTag,
                c.ChallengingTeamScore,
                c.ChallengedTeamId,
                tc2.Name ChallengedTeamName,
                tc2.Tag ChallengedTeamTag,
                c.ChallengedTeamScore,
                CASE WHEN c.RatingChange IS NULL THEN NULL ELSE CASE WHEN c.ChallengingTeamId = @teamId THEN c.RatingChange ELSE 0 - c.RatingChange END END RatingChange,
                c.Map,
                c.MatchTime,
                c.GameType,
                s.TeamId StatTeamId,
                tc3.Name StatTeamName,
                tc3.Tag StatTeamTag,
                s.PlayerId,
                p.Name,
                s.Captures,
                s.Pickups,
                s.CarrierKills,
                s.Returns,
                s.Kills,
                s.Assists,
                s.Deaths,
                s.Damage
            FROM vwCompletedChallenge c
            INNER JOIN tblTeam tc1 ON c.ChallengingTeamId = tc1.TeamId
            INNER JOIN tblTeam tc2 ON c.ChallengedTeamId = tc2.TeamId
            LEFT OUTER JOIN (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY s.ChallengeId ORDER BY CASE c2.GameType WHEN 'CTF' THEN s.Captures ELSE 0 END DESC, CASE c2.GameType WHEN 'CTF' THEN s.CarrierKills ELSE 0 END DESC, CAST(s.Kills + s.Assists AS FLOAT) / CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END DESC) Row,
                    s.ChallengeId,
                    s.PlayerId,
                    s.TeamId,
                    s.Captures,
                    s.Pickups,
                    s.CarrierKills,
                    s.Returns,
                    s.Kills,
                    s.Assists,
                    s.Deaths,
                    d.Damage
                FROM tblStat s
                INNER JOIN tblChallenge c2 ON s.ChallengeId = c2.ChallengeId
                LEFT OUTER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON c2.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
            ) s ON c.ChallengeId = s.ChallengeId AND s.Row = 1
            LEFT OUTER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN tblTeam tc3 ON s.TeamId = tc3.TeamId
            WHERE (c.ChallengingTeamId = @teamId OR c.ChallengedTeamId = @teamId)
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            ORDER BY c.MatchTime

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            teamId: {type: Db.INT, value: team.id},
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        cache = data && data.recordsets && data.recordsets.length >= 2 && data.recordsets[0].map((row) => ({
            challengeId: row.ChallengeId,
            challengingTeamId: row.ChallengingTeamId,
            challengingTeamName: row.ChallengingTeamName,
            challengingTeamTag: row.ChallengingTeamTag,
            challengingTeamScore: row.ChallengingTeamScore,
            challengedTeamId: row.ChallengedTeamId,
            challengedTeamName: row.ChallengedTeamName,
            challengedTeamTag: row.ChallengedTeamTag,
            challengedTeamScore: row.ChallengedTeamScore,
            ratingChange: row.RatingChange,
            map: row.Map,
            matchTime: row.MatchTime,
            gameType: row.GameType,
            statTeamId: row.StatTeamId,
            statTeamName: row.StatTeamName,
            statTeamTag: row.StatTeamTag,
            playerId: row.PlayerId,
            name: row.Name,
            captures: row.Captures,
            pickups: row.Pickups,
            carrierKills: row.Pickups,
            returns: row.Returns,
            kills: row.Kills,
            assists: row.Assists,
            deaths: row.Deaths,
            damage: row.Damage
        })) || [];

        await Cache.add(key, cache, season === void 0 && data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`]);

        return cache;
    }

    //              #    #  #                    #  #
    //              #    #  #                    ####
    //  ###   ##   ###   ####   ##   # #    ##   ####   ###  ###    ###
    // #  #  # ##   #    #  #  #  #  ####  # ##  #  #  #  #  #  #  ##
    //  ##   ##     #    #  #  #  #  #  #  ##    #  #  # ##  #  #    ##
    // #      ##     ##  #  #   ##   #  #   ##   #  #   # #  ###   ###
    //  ###                                                  #
    /**
     * Gets all of the team's home maps.
     * @param {Team} team The team to get maps for.
     * @param {string} gameType The game type to get home maps for.
     * @returns {Promise<string[]>} A promise that resolves with a list of the team's home maps.
     */
    static async getHomeMaps(team, gameType) {
        /** @type {TeamDbTypes.GetHomeMapsRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId AND GameType = @gameType ORDER BY Map
        `, {
            teamId: {type: Db.INT, value: team.id},
            gameType: {type: Db.VARCHAR(5), value: gameType}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [];
    }

    //              #    #  #                    #  #                     ###         ###
    //              #    #  #                    ####                     #  #         #
    //  ###   ##   ###   ####   ##   # #    ##   ####   ###  ###    ###   ###   #  #   #    #  #  ###    ##
    // #  #  # ##   #    #  #  #  #  ####  # ##  #  #  #  #  #  #  ##     #  #  #  #   #    #  #  #  #  # ##
    //  ##   ##     #    #  #  #  #  #  #  ##    #  #  # ##  #  #    ##   #  #   # #   #     # #  #  #  ##
    // #      ##     ##  #  #   ##   #  #   ##   #  #   # #  ###   ###    ###     #    #      #   ###    ##
    //  ###                                                  #                   #           #    #
    /**
     * Gets the list of home maps for the team, divided by type.
     * @param {Team} team The team to get maps for.
     * @returns {Promise<MapTypes.MapGameType[]>} A promise that resolves with a list of the team's home maps, divided by type.
     */
    static async getHomeMapsByType(team) {
        /** @type {TeamDbTypes.GetHomeMapsByTypeRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Map, GameType FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Map, GameType
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            map: row.Map,
            gameType: row.GameType
        }));
    }

    //              #    ###           #
    //              #     #           # #
    //  ###   ##   ###    #    ###    #     ##
    // #  #  # ##   #     #    #  #  ###   #  #
    //  ##   ##     #     #    #  #   #    #  #
    // #      ##     ##  ###   #  #   #     ##
    //  ###
    /**
     * Gets a team's info.
     * @param {Team} team The team to get the info for.
     * @returns {Promise<TeamTypes.TeamInfo>} A promise that resolves with the team's info.
     */
    static async getInfo(team) {
        /** @type {TeamDbTypes.GetInfoRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Map, GameType FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Map

            SELECT p.PlayerId, p.Name, r.Captain, r.Founder
            FROM tblRoster r
            INNER JOIN tblPlayer p ON r.PlayerId = p.PlayerId
            WHERE r.TeamId = @teamId
            ORDER BY CASE WHEN r.Founder = 1 THEN 0 WHEN r.Captain = 1 THEN 1 ELSE 2 END,
                p.Name

            SELECT p.Name, r.DateRequested
            FROM tblRequest r
            INNER JOIN tblPlayer p ON r.PlayerId = p.PlayerId
            WHERE r.TeamId = @teamId
            ORDER BY r.DateRequested

            SELECT p.Name, i.DateInvited
            FROM tblInvite i
            INNER JOIN tblPlayer p ON i.PlayerId = p.PlayerId
            WHERE i.TeamId = @teamId
            ORDER BY i.DateInvited

            SELECT PenaltiesRemaining FROM tblTeamPenalty WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: team.id}});
        return {
            homes: data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
                map: row.Map,
                gameType: row.GameType
            })) || [],
            members: data && data.recordsets && data.recordsets[1] && data.recordsets[1].map((row) => ({
                playerId: row.PlayerId,
                name: row.Name,
                role: row.Captain ? "Captain" : row.Founder ? "Founder" : void 0
            })) || [],
            requests: data && data.recordsets && data.recordsets[2] && data.recordsets[2].map((row) => ({
                name: row.Name,
                date: row.DateRequested
            })) || [],
            invites: data && data.recordsets && data.recordsets[3] && data.recordsets[3].map((row) => ({
                name: row.Name,
                date: row.DateInvited
            })) || [],
            penaltiesRemaining: data && data.recordsets && data.recordsets[4] && data.recordsets[4][0] && data.recordsets[4][0].PenaltiesRemaining || void 0
        };
    }

    //              #    #  #               #                ##    #  #
    //              #    ## #               #                 #    ####
    //  ###   ##   ###   ## #   ##   #  #  ###   ###    ###   #    ####   ###  ###    ###
    // #  #  # ##   #    # ##  # ##  #  #   #    #  #  #  #   #    #  #  #  #  #  #  ##
    //  ##   ##     #    # ##  ##    #  #   #    #     # ##   #    #  #  # ##  #  #    ##
    // #      ##     ##  #  #   ##    ###    ##  #      # #  ###   #  #   # #  ###   ###
    //  ###                                                                    #
    /**
     * Gets all of the team's neutral maps.
     * @param {Team} team The team to get maps for.
     * @param {string} gameType The game type to get neutral maps for.
     * @returns {Promise<string[]>} A promise that resolves with a list of the team's neutral maps.
     */
    static async getNeutralMaps(team, gameType) {
        /** @type {TeamDbTypes.GetNeutralMapsRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Map FROM tblTeamNeutral WHERE TeamId = @teamId AND GameType = @gameType ORDER BY Map
        `, {
            teamId: {type: Db.INT, value: team.id},
            gameType: {type: Db.VARCHAR(5), value: gameType}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [];
    }

    //              #    #  #               #                ##    #  #                     ###         ###
    //              #    ## #               #                 #    ####                     #  #         #
    //  ###   ##   ###   ## #   ##   #  #  ###   ###    ###   #    ####   ###  ###    ###   ###   #  #   #    #  #  ###    ##
    // #  #  # ##   #    # ##  # ##  #  #   #    #  #  #  #   #    #  #  #  #  #  #  ##     #  #  #  #   #    #  #  #  #  # ##
    //  ##   ##     #    # ##  ##    #  #   #    #     # ##   #    #  #  # ##  #  #    ##   #  #   # #   #     # #  #  #  ##
    // #      ##     ##  #  #   ##    ###    ##  #      # #  ###   #  #   # #  ###   ###    ###     #    #      #   ###    ##
    //  ###                                                                    #                   #           #    #
    /**
     * Gets the list of neutral maps for the team, divided by type.
     * @param {Team} team The team to get maps for.
     * @returns {Promise<MapTypes.MapGameType[]>} A promise that resolves with a list of the team's neutral maps, divided by type.
     */
    static async getNeutralMapsByType(team) {
        /** @type {TeamDbTypes.GetNeutralMapsByTypeRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Map, GameType FROM tblTeamNeutral WHERE TeamId = @teamId ORDER BY Map, GameType
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            map: row.Map,
            gameType: row.GameType
        }));
    }

    //              #    #  #               #     ##   ##                #     ###          #
    //              #    ## #               #    #  #   #                #     #  #         #
    //  ###   ##   ###   ## #   ##   #  #  ###   #      #     ##    ##   # #   #  #   ###  ###    ##
    // #  #  # ##   #    # ##  # ##   ##    #    #      #    #  #  #     ##    #  #  #  #   #    # ##
    //  ##   ##     #    # ##  ##     ##    #    #  #   #    #  #  #     # #   #  #  # ##   #    ##
    // #      ##     ##  #  #   ##   #  #    ##   ##   ###    ##    ##   #  #  ###    # #    ##   ##
    //  ###
    /**
     * Gets the next date this team can put a challenge on the clock.
     * @param {Team} team The team to check.
     * @returns {Promise<Date>} A promise that resolves with the next date this team can put a challenge on the clock.
     */
    static async getNextClockDate(team) {
        /** @type {TeamDbTypes.GetNextClockDateRecordsets} */
        const data = await db.query(/* sql */`
            SELECT DATEADD(DAY, 28, MAX(DateClocked)) NextDate FROM tblChallenge WHERE ClockTeamId = @teamId AND DateVoided IS NULL
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].NextDate || void 0;
    }

    //              #    ###    #    ##           #     ##            #  ###                #     #             #   ##                      #
    //              #    #  #         #           #    #  #           #   #                       #             #  #  #                     #
    //  ###   ##   ###   #  #  ##     #     ##   ###   #  #  ###    ###   #    ###   # #   ##    ###    ##    ###  #      ##   #  #  ###   ###
    // #  #  # ##   #    ###    #     #    #  #   #    ####  #  #  #  #   #    #  #  # #    #     #    # ##  #  #  #     #  #  #  #  #  #   #
    //  ##   ##     #    #      #     #    #  #   #    #  #  #  #  #  #   #    #  #  # #    #     #    ##    #  #  #  #  #  #  #  #  #  #   #
    // #      ##     ##  #     ###   ###    ##     ##  #  #  #  #   ###  ###   #  #   #    ###     ##   ##    ###   ##    ##    ###  #  #    ##
    //  ###
    /**
     * Gets the number of pilots on and invited pilots for a team.
     * @param {Team} team The team to check.
     * @returns {Promise<number>} A promise that resolves with the number of pilots on and invited pilots for a team.
     */
    static async getPilotAndInvitedCount(team) {
        /** @type {TeamDbTypes.GetPilotAndInvitedCountRecordsets} */
        const data = await db.query(/* sql */`
            SELECT
                (SELECT COUNT(*) FROM tblRoster WHERE TeamId = @teamId) +
                (SELECT COUNT(*) FROM tblInvite WHERE TeamId = @teamId) Members
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Members || 0;
    }

    //              #    ###    #    ##           #     ##                      #
    //              #    #  #         #           #    #  #                     #
    //  ###   ##   ###   #  #  ##     #     ##   ###   #      ##   #  #  ###   ###
    // #  #  # ##   #    ###    #     #    #  #   #    #     #  #  #  #  #  #   #
    //  ##   ##     #    #      #     #    #  #   #    #  #  #  #  #  #  #  #   #
    // #      ##     ##  #     ###   ###    ##     ##   ##    ##    ###  #  #    ##
    //  ###
    /**
     * Gets the number of pilots on a team.
     * @param {Team} team The team to check.
     * @returns {Promise<number>} A promise that resolves with the number of pilots on a team.
     */
    static async getPilotCount(team) {
        /** @type {TeamDbTypes.GetPilotCountRecordsets} */
        const data = await db.query(/* sql */`
            SELECT COUNT(*) Members FROM tblRoster WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Members || 0;
    }

    //              #     ##                                   ##    #                   #   #
    //              #    #  #                                 #  #   #                   #
    //  ###   ##   ###    #     ##    ###   ###    ##   ###    #    ###    ###  ###    ###  ##    ###    ###   ###
    // #  #  # ##   #      #   # ##  #  #  ##     #  #  #  #    #    #    #  #  #  #  #  #   #    #  #  #  #  ##
    //  ##   ##     #    #  #  ##    # ##    ##   #  #  #  #  #  #   #    # ##  #  #  #  #   #    #  #   ##     ##
    // #      ##     ##   ##    ##    # #  ###     ##   #  #   ##     ##   # #  #  #   ###  ###   #  #  #     ###
    //  ###                                                                                              ###
    /**
     * Gets the season standings for the specified season.
     * @param {number} [season] The season number, or void for the latest season.
     * @param {string} [records] The type of record split to retrieve.
     * @param {string} [map] The map record to retrieve.
     * @returns {Promise<TeamTypes.Standing[]>} A promise that resolves with the season standings.
     */
    static async getSeasonStandings(season, records, map) {
        const key = `${settings.redisPrefix}:db:team:getSeasonStandings:${season || "null"}:${records}:${map || "null"}`;

        /** @type {TeamTypes.Standing[]} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {TeamDbTypes.GetSeasonStandingsRecordsets} */
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

            IF @season IS NULL
            BEGIN
                SET @season = (SELECT MAX(Season) FROM tblSeason)
            END

            DECLARE @maxSeason BIT = 0
            IF @season = (SELECT MAX(Season) FROM tblSeason)
            BEGIN
                SET @maxSeason = 1
            END

            SELECT
                TeamId, Name, Tag, Disbanded, Locked,
                Rating,
                Wins, Losses, Ties, Wins1, Losses1, Ties1, Wins2, Losses2, Ties2, Wins3, Losses3, Ties3${map ? ", WinsMap, LossesMap, TiesMap" : ""}
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
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties,
                    ${records === "Team Size Records" ? /* sql */`
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 2 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 3 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize >= 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize >= 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize >= 4 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties3
                    ` : records === "Game Type Records" ? /* sql */`
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'TA' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'TA' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'TA' AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'CTF' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'CTF' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'CTF' AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'MB' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'MB' AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.GameType = 'MB' AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties3
                    ` : /* sql */`
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeMapTeam = 0 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties3
                    `}
                    ${map ? /* sql */`,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.Map = @map AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsMap,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.Map = @map AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesMap,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.Map = @map AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesMap
                    ` : ""}
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @season
            ) a
            WHERE @maxSeason = 1 OR Wins + Losses + Ties > 0
            ORDER BY Rating DESC, Wins DESC, Losses ASC, Name ASC

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            season: {type: Db.INT, value: season},
            map: {type: Db.VARCHAR(100), value: map}
        });
        cache = data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({teamId: row.TeamId, name: row.Name, tag: row.Tag, disbanded: row.Disbanded, locked: row.Locked, rating: row.Rating, wins: row.Wins, losses: row.Losses, ties: row.Ties, wins1: row.Wins1, losses1: row.Losses1, ties1: row.Ties1, wins2: row.Wins2, losses2: row.Losses2, ties2: row.Ties2, wins3: row.Wins3, losses3: row.Losses3, ties3: row.Ties3, winsMap: row.WinsMap || 0, lossesMap: row.LossesMap || 0, tiesMap: row.TiesMap || 0})) || [];

        await Cache.add(key, cache, !season && data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`, `${settings.redisPrefix}:invalidate:team:status`]);

        return cache;
    }

    //              #    ###    #
    //              #     #
    //  ###   ##   ###    #    ##    # #    ##   ####   ##   ###    ##
    // #  #  # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##
    //  ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##
    // #      ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##
    //  ###
    /**
     * Gets a team's time zone.
     * @param {Team} team The team to get the time zone for.
     * @returns {Promise<string>} The team's time zone.
     */
    static async getTimezone(team) {
        /** @type {TeamDbTypes.GetTimezoneRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Timezone FROM tblTeam WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Timezone || void 0;
    }

    // #                   ##   ##                #              #  ###                     ###   #      #            ##
    // #                  #  #   #                #              #   #                       #    #                  #  #
    // ###    ###   ###   #      #     ##    ##   # #    ##    ###   #     ##    ###  # #    #    ###   ##     ###    #     ##    ###   ###    ##   ###
    // #  #  #  #  ##     #      #    #  #  #     ##    # ##  #  #   #    # ##  #  #  ####   #    #  #   #    ##       #   # ##  #  #  ##     #  #  #  #
    // #  #  # ##    ##   #  #   #    #  #  #     # #   ##    #  #   #    ##    # ##  #  #   #    #  #   #      ##   #  #  ##    # ##    ##   #  #  #  #
    // #  #   # #  ###     ##   ###    ##    ##   #  #   ##    ###   #     ##    # #  #  #   #    #  #  ###   ###     ##    ##    # #  ###     ##   #  #
    /**
     * Checks if one team has clocked another this season.
     * @param {Team} team1 The team to check for clocking.
     * @param {Team} team2 The team to check for being clocked.
     * @returns {Promise<boolean>} A promise that resolves with whether a team has clocked another this season.
     */
    static async hasClockedTeamThisSeason(team1, team2) {
        /** @type {TeamDbTypes.HasClockedTeamThisSeasonRecordsets} */
        const data = await db.query(/* sql */`
            SELECT CAST(CASE WHEN COUNT(ChallengeId) > 0 THEN 1 ELSE 0 END AS BIT) HasClocked
            FROM tblChallenge
            WHERE ClockTeamId = @team1Id
                AND (ChallengingTeamId = @team2Id OR ChallengedTeamId = @team2Id)
                AND DateVoided IS NULL
                AND DateClocked IS NOT NULL
                AND DateClocked >= CAST(CAST(((MONTH(GETUTCDATE()) - 1) / 6) * 6 + 1 AS VARCHAR) + '/1/' + CAST(YEAR(GETUTCDATE()) AS VARCHAR) AS DATETIME)
        `, {
            team1Id: {type: Db.INT, value: team1.id},
            team2Id: {type: Db.INT, value: team2.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].HasClocked || false;
    }

    //  #                 #     #          ###    #    ##           #
    //                          #          #  #         #           #
    // ##    ###   # #   ##    ###    ##   #  #  ##     #     ##   ###
    //  #    #  #  # #    #     #    # ##  ###    #     #    #  #   #
    //  #    #  #  # #    #     #    ##    #      #     #    #  #   #
    // ###   #  #   #    ###     ##   ##   #     ###   ###    ##     ##
    /**
     * Invites a pilot to the pilot's team.
     * @param {Team} team The pilot whos team to invite the pilot to.
     * @param {DiscordJs.GuildMember} member The pilot to invite to the team.
     * @returns {Promise} A promise that resolves when the pilot is invited to the pilot's team.
     */
    static async invitePilot(team, member) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF @playerId IS NULL
            BEGIN
                INSERT INTO tblPlayer (DiscordId, Name)
                VALUES (@discordId, @name)

                SET @playerId = SCOPE_IDENTITY()
            END

            DELETE FROM tblRequest WHERE TeamId = @teamId AND PlayerId = @playerId
            INSERT INTO tblInvite (TeamId, PlayerId) VALUES (@teamId, @playerId)
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(64), value: member.displayName},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //             #           ####                       #
    //             #           #                          #
    // # #    ###  # #    ##   ###    ##   #  #  ###    ###   ##   ###
    // ####  #  #  ##    # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  # ##  # #   ##    #     #  #  #  #  #  #  #  #  ##    #
    // #  #   # #  #  #   ##   #      ##    ###  #  #   ###   ##   #
    /**
     * Transfers ownership of a team from one pilot to another.
     * @param {Team} team The team to transfer ownership for.
     * @param {DiscordJs.GuildMember} member The pilot to transfer ownership to.
     * @returns {Promise} A promise that resolves when ownership has been transferred.
     */
    static async makeFounder(team, member) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblRoster SET Founder = 0, Captain = 1 WHERE TeamId = @teamId AND Founder = 1
            UPDATE tblRoster SET Founder = 1, Captain = 0 WHERE TeamId = @teamId AND PlayerId = @playerId

            MERGE tblCaptainHistory ch
                USING (VALUES (@teamId, @playerId)) AS v (TeamId, PlayerId)
                ON ch.TeamId = v.TeamId AND ch.PlayerId = v.PlayerId
            WHEN NOT MATCHED THEN
                INSERT (TeamId, PlayerId) VALUES (v.TeamId, v.PlayerId);
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //                   ##     #      #
    //                    #           # #
    //  ###  #  #   ###   #    ##     #    #  #
    // #  #  #  #  #  #   #     #    ###   #  #
    // #  #  #  #  # ##   #     #     #     # #
    //  ###   ###   # #  ###   ###    #      #
    //    #                                 #
    /**
     * Sets a team's qualification status for a season.
     * @param {Team} team The team.
     * @param {number} season The season.
     * @param {boolean} qualified Whether they are qualified.
     * @returns {Promise} A promise that resolves when the team's qualification has been set.
     */
    static async qualify(team, season, qualified) {
        await db.query(/* sql */`
            MERGE tblTeamRating tr
                USING (VALUES (@teamId, @season)) AS v (TeamId, Season)
                ON tr.TeamId = v.TeamId AND tr.Season = v.Season
            WHEN MATCHED then
                UPDATE SET Rating = 0, Qualified = @qualified
            WHEN NOT MATCHED THEN
                INSERT (Season, TeamId, Rating, Qualified) VALUES (@season, @teamId, 0, @qualified);
        `, {
            teamId: {type: Db.INT, value: team.id},
            season: {type: Db.INT, value: season},
            qualified: {type: Db.BIT, value: qualified}
        });
    }

    //              #                  #           #
    //                                 #           #
    // ###    ##   ##    ###    ###   ###    ###  ###    ##
    // #  #  # ##   #    #  #  ##      #    #  #   #    # ##
    // #     ##     #    #  #    ##    #    # ##   #    ##
    // #      ##   ###   #  #  ###      ##   # #    ##   ##
    /**
     * Reinstates a team with the pilot as its founder.
     * @param {DiscordJs.GuildMember} member The pilot reinstating the team.
     * @param {Team} team The team to reinstate.
     * @returns {Promise} A promise that resolves when the team is reinstated.
     */
    static async reinstate(member, team) {
        /** @type {TeamDbTypes.ReinstateRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblTeam SET Disbanded = 0 WHERE TeamId = @teamId

            INSERT INTO tblRoster (TeamId, PlayerId, Founder) VALUES (@teamId, @playerId, 1)

            DELETE FROM tblJoinBan WHERE PlayerId = @playerId
            INSERT INTO tblJoinBan (PlayerId) VALUES (@playerId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND PlayerId = @playerId

            SELECT @playerId PlayerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].PlayerId) {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:team:status`, `${settings.redisPrefix}:invalidate:player:updated`, `${settings.redisPrefix}:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:team:status`, `${settings.redisPrefix}:invalidate:player:updated`]);
        }
    }

    //                                      ##                #           #
    //                                     #  #               #
    // ###    ##   # #    ##   # #    ##   #      ###  ###   ###    ###  ##    ###
    // #  #  # ##  ####  #  #  # #   # ##  #     #  #  #  #   #    #  #   #    #  #
    // #     ##    #  #  #  #  # #   ##    #  #  # ##  #  #   #    # ##   #    #  #
    // #      ##   #  #   ##    #     ##    ##    # #  ###     ##   # #  ###   #  #
    //                                                 #
    /**
     * Removes a pilot as captain from the pilot's team.
     * @param {Team} team The team the captain is on.
     * @param {DiscordJs.GuildMember} member The captain to remove.
     * @returns {Promise} A promise that resolves when the captain has been removed.
     */
    static async removeCaptain(team, member) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblRoster SET Captain = 0 WHERE PlayerId = @playerId AND TeamId = @teamId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //                                     #  #                    #  #
    //                                     #  #                    ####
    // ###    ##   # #    ##   # #    ##   ####   ##   # #    ##   ####   ###  ###
    // #  #  # ##  ####  #  #  # #   # ##  #  #  #  #  ####  # ##  #  #  #  #  #  #
    // #     ##    #  #  #  #  # #   ##    #  #  #  #  #  #  ##    #  #  # ##  #  #
    // #      ##   #  #   ##    #     ##   #  #   ##   #  #   ##   #  #   # #  ###
    //                                                                         #
    /**
     * Removes a home map for a team.
     * @param {Team} team The team removing the home map.
     * @param {string} gameType The game type.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the home map has been removed.
     */
    static async removeHomeMap(team, gameType, map) {
        await db.query(/* sql */`
            DELETE FROM tblTeamHome WHERE TeamId = @teamId AND Map = @map AND GameType = @gameType
        `, {
            teamId: {type: Db.INT, value: team.id},
            map: {type: Db.VARCHAR(100), value: map},
            gameType: {type: Db.VARCHAR(5), value: gameType}
        });
    }

    //                                     #  #               #                ##    #  #
    //                                     ## #               #                 #    ####
    // ###    ##   # #    ##   # #    ##   ## #   ##   #  #  ###   ###    ###   #    ####   ###  ###
    // #  #  # ##  ####  #  #  # #   # ##  # ##  # ##  #  #   #    #  #  #  #   #    #  #  #  #  #  #
    // #     ##    #  #  #  #  # #   ##    # ##  ##    #  #   #    #     # ##   #    #  #  # ##  #  #
    // #      ##   #  #   ##    #     ##   #  #   ##    ###    ##  #      # #  ###   #  #   # #  ###
    //                                                                                           #
    /**
     * Removes a neutral map for a team.
     * @param {Team} team The team removing the neutral map.
     * @param {string} gameType The game type.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the neutral map has been removed.
     */
    static async removeNeutralMap(team, gameType, map) {
        await db.query(/* sql */`
            DELETE FROM tblTeamNeutral WHERE TeamId = @teamId AND Map = @map AND GameType = @gameType
        `, {
            teamId: {type: Db.INT, value: team.id},
            map: {type: Db.VARCHAR(100), value: map},
            gameType: {type: Db.VARCHAR(5), value: gameType}
        });
    }

    //                                     ###    #    ##           #
    //                                     #  #         #           #
    // ###    ##   # #    ##   # #    ##   #  #  ##     #     ##   ###
    // #  #  # ##  ####  #  #  # #   # ##  ###    #     #    #  #   #
    // #     ##    #  #  #  #  # #   ##    #      #     #    #  #   #
    // #      ##   #  #   ##    #     ##   #     ###   ###    ##     ##
    /**
     * Removes a pilot from a team, whether they are on the roster, requested, or invited.
     * @param {DiscordJs.GuildMember} member The pilot to remove.
     * @param {Team} team The team to remove the pilot from.
     * @returns {Promise} A promise that resolves when the pilot has been removed.
     */
    static async removePilot(member, team) {
        /** @type {TeamDbTypes.RemovePilotRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF EXISTS(SELECT TOP 1 1 FROM tblRoster WHERE TeamId = @teamId AND PlayerId = @playerId)
            BEGIN
                DELETE FROM cs
                FROM tblChallengeStreamer cs
                INNER JOIN tblChallenge c ON cs.ChallengeId = c.ChallengeId
                WHERE c.DateConfirmed IS NULL
                    AND c.DateVoided IS NULL
                    AND cs.PlayerId = @playerId

                IF EXISTS (
                    SELECT TOP 1 1
                    FROM tblStat s
                    INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
                    INNER JOIN tblRoster r ON s.PlayerId = r.PlayerId
                    WHERE s.PlayerId = @playerId
                        AND CAST(c.MatchTime AS DATE) >= CAST(r.DateAdded AS DATE)
                )
                BEGIN
                    DELETE FROM tblRoster WHERE TeamId = @teamId AND PlayerId = @playerId

                    DELETE FROM tblTeamBan WHERE TeamId = @teamId AND PlayerId = @playerId
                    INSERT INTO tblTeamBan (TeamId, PlayerId) VALUES (@teamId, @playerId)
                END
                ELSE
                BEGIN
                    DELETE FROM tblRoster WHERE TeamId = @teamId AND PlayerId = @playerId

                    DELETE FROM tblTeamBan WHERE TeamId = @teamId AND PlayerId = @playerId
                    DELETE FROM tblJoinBan WHERE PlayerId = @playerId
                END
            END

            DELETE FROM tblChallengeStreamer WHERE PlayerId = @playerId
            DELETE FROM tblRequest WHERE TeamId = @teamId AND PlayerId = @playerId
            DELETE FROM tblInvite WHERE TeamId = @teamId AND PlayerId = @playerId

            SELECT @playerId PlayerId
        `, {
            teamId: {type: Db.INT, value: team.id},
            discordId: {type: Db.VARCHAR(24), value: member.id}
        });

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].PlayerId) {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:player:updated`, `${settings.redisPrefix}:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:player:updated`]);
        }
    }

    //               #    #                 #              #
    //               #    #                 #              #
    //  ###    ##   ###   #      ##    ##   # #    ##    ###
    // ##     # ##   #    #     #  #  #     ##    # ##  #  #
    //   ##   ##     #    #     #  #  #     # #   ##    #  #
    // ###     ##     ##  ####   ##    ##   #  #   ##    ###
    /**
     * Sets a team's roster lock state.
     * @param {Team} team The team to set the roster lock state for.
     * @param {boolean} locked Whether the team's roster should be locked.
     * @returns {Promise} A promise that resolves when the lock state has been set.
     */
    static async setLocked(team, locked) {
        await db.query(/* sql */`
            UPDATE tblTeam SET Locked = @locked WHERE TeamId = @teamId

            IF (@locked = 1)
            BEGIN
                UPDATE tblRoster SET Authorized = 1 WHERE TeamId = @teamId
            END
        `, {
            teamId: {type: Db.INT, value: team.id},
            locked: {type: Db.BIT, value: locked}
        });
    }

    //               #    #  #
    //               #    ## #
    //  ###    ##   ###   ## #   ###  # #    ##
    // ##     # ##   #    # ##  #  #  ####  # ##
    //   ##   ##     #    # ##  # ##  #  #  ##
    // ###     ##     ##  #  #   # #  #  #   ##
    /**
     * Renames a team.
     * @param {Team} team The team to rename.
     * @param {string} name The name to rename the team to.
     * @returns {Promise} A promise that resolves when the team has been renamed.
     */
    static async setName(team, name) {
        await db.query(/* sql */`
            UPDATE tblTeam SET Name = @name WHERE TeamId = @teamId
        `, {
            name: {type: Db.VARCHAR(25), value: name},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //               #    ###
    //               #     #
    //  ###    ##   ###    #     ###   ###
    // ##     # ##   #     #    #  #  #  #
    //   ##   ##     #     #    # ##   ##
    // ###     ##     ##   #     # #  #
    //                                 ###
    /**
     * Renames a team tag.
     * @param {Team} team The team to rename the tag of.
     * @param {string} tag The tag to rename the team tag to.
     * @returns {Promise} A promise that resolves when the team tag has been renamed.
     */
    static async setTag(team, tag) {
        await db.query(/* sql */`
            UPDATE tblTeam SET Tag = @tag WHERE TeamId = @teamId
        `, {
            tag: {type: Db.VARCHAR(5), value: tag},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //               #    ###    #
    //               #     #
    //  ###    ##   ###    #    ##    # #    ##   ####   ##   ###    ##
    // ##     # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##
    //   ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##
    // ###     ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##
    /**
     * Sets a team's time zone.
     * @param {Team} team The team to set the time zone for.
     * @param {string} timezone The time zone to set.
     * @returns {Promise} A promise that resolves when the time zone is set.
     */
    static async setTimezone(team, timezone) {
        await db.query(/* sql */`
            UPDATE tblTeam SET Timezone = @timezone WHERE TeamId = @teamId
        `, {
            teamId: {type: Db.INT, value: team.id},
            timezone: {type: Db.VARCHAR(50), value: timezone}
        });
    }

    //                #         #          ###          #     #                       ####               ##                                  ####                     ##   #           ##    ##
    //                #         #          #  #         #                             #                 #  #                                 #                       #  #  #            #     #
    // #  #  ###    ###   ###  ###    ##   #  #   ###  ###   ##    ###    ###   ###   ###    ##   ###    #     ##    ###   ###    ##   ###   ###   ###    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #  #  #  #  #   #    # ##  ###   #  #   #     #    #  #  #  #  ##     #     #  #  #  #    #   # ##  #  #  ##     #  #  #  #  #     #  #  #  #  ####  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #  #  #  #  #  # ##   #    ##    # #   # ##   #     #    #  #   ##     ##   #     #  #  #     #  #  ##    # ##    ##   #  #  #  #  #     #     #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ###  ###    ###   # #    ##   ##   #  #   # #    ##  ###   #  #  #     ###    #      ##   #      ##    ##    # #  ###     ##   #  #  #     #      ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //       #                                                            ###                                                                                                                                   ###
    /**
     * Updates the ratins for the season.
     * @param {number} season The season to update ratings for.
     * @param {Object<string, number>} ratings The ratings.
     * @param {ChallengeTypes.GamesByChallengeId} challengeRatings The ratings after a challenge.
     * @returns {Promise} A promise that resolves when the ratings are updated.
     */
    static async updateRatingsForSeason(season, ratings, challengeRatings) {
        let sql = /* sql */`
            DELETE FROM tblTeamRating WHERE Season = @season
        `;

        /** @type {DbTypes.Parameters} */
        let params = {
            season: {type: Db.INT, value: season}
        };

        for (const {teamId, rating, index} of Object.keys(ratings).map((r, i) => ({teamId: +r, rating: ratings[r], index: i}))) {
            sql = /* sql */`
                ${sql}

                INSERT INTO tblTeamRating
                (Season, TeamId, Rating)
                VALUES
                (@season, @team${index}Id, @rating${index})
            `;

            params[`team${index}id`] = {type: Db.INT, value: teamId};
            params[`rating${index}`] = {type: Db.FLOAT, value: rating};
        }

        let hasData = false;

        for (const {challengeId, challengeRating, index} of Object.keys(challengeRatings).map((r, i) => ({challengeId: +r, challengeRating: challengeRatings[+r], index: i}))) {
            sql = /* sql */`
                ${sql}

                UPDATE tblChallenge SET
                    ChallengingTeamRating = @challengingTeamRating${index},
                    ChallengedTeamRating = @challengedTeamRating${index},
                    RatingChange = @ratingChange${index}
                WHERE ChallengeId = @challenge${index}Id
            `;

            params[`challengingTeamRating${index}`] = {type: Db.FLOAT, value: challengeRating.challengingTeamRating};
            params[`challengedTeamRating${index}`] = {type: Db.FLOAT, value: challengeRating.challengedTeamRating};
            params[`ratingChange${index}`] = {type: Db.FLOAT, value: challengeRating.change};
            params[`challenge${index}Id`] = {type: Db.INT, value: challengeId};
            hasData = true;

            if (Object.keys(params).length > 2000) {
                await db.query(sql, params);
                sql = "";
                params = {};
                hasData = false;
            }
        }

        if (hasData) {
            await db.query(sql, params);
        }

        await Cache.invalidate([`${settings.redisPrefix}:invalidate:challenge:closed`]);
    }
}

module.exports = TeamDb;
