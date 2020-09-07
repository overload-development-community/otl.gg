/**
 * @typedef {import("../../types/dbTypes").EmptyRecordsets} DbTypes.EmptyRecordsets
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").User} DiscordJs.User
 * @typedef {import("../../types/playerDbTypes").BannedFromTeamUntilRecordsets} PlayerDbTypes.BannedFromTeamUntilRecordsets
 * @typedef {import("../../types/playerDbTypes").ClearTimezoneRecordsets} PlayerDbTypes.ClearTimezoneRecordsets
 * @typedef {import("../../types/playerDbTypes").GetCareerRecordsets} PlayerDbTypes.GetCareerRecordsets
 * @typedef {import("../../types/playerDbTypes").GetCastedChallengesRecordsets} PlayerDbTypes.GetCastedChallengesRecordsets
 * @typedef {import("../../types/playerDbTypes").GetFreeAgentsRecordsets} PlayerDbTypes.GetFreeAgentsRecordsets
 * @typedef {import("../../types/playerDbTypes").GetGameLogRecordsets} PlayerDbTypes.GetGameLogRecordsets
 * @typedef {import("../../types/playerDbTypes").GetRecordsCTFPlayerRecordsets} PlayerDbTypes.GetRecordsCTFPlayerRecordsets
 * @typedef {import("../../types/playerDbTypes").GetRecordsCTFTeamRecordsets} PlayerDbTypes.GetRecordsCTFTeamRecordsets
 * @typedef {import("../../types/playerDbTypes").GetRecordsTAPlayerRecordsets} PlayerDbTypes.GetRecordsTAPlayerRecordsets
 * @typedef {import("../../types/playerDbTypes").GetRecordsTATeamRecordsets} PlayerDbTypes.GetRecordsTATeamRecordsets
 * @typedef {import("../../types/playerDbTypes").GetRequestedOrInvitedTeamsRecordsets} PlayerDbTypes.GetRequestedOrInvitedTeamsRecordsets
 * @typedef {import("../../types/playerDbTypes").GetSeasonStatsRecordsets} PlayerDbTypes.GetSeasonStatsRecordsets
 * @typedef {import("../../types/playerDbTypes").GetStatsRecordsets} PlayerDbTypes.GetStatsRecordsets
 * @typedef {import("../../types/playerDbTypes").GetTimezoneRecordsets} PlayerDbTypes.GetTimezoneRecordsets
 * @typedef {import("../../types/playerDbTypes").GetTopKdaRecordsets} PlayerDbTypes.GetTopKdaRecordsets
 * @typedef {import("../../types/playerDbTypes").GetTwitchNameRecordsets} PlayerDbTypes.GetTwitchNameRecordsets
 * @typedef {import("../../types/playerDbTypes").JoinTeamDeniedUntilRecordsets} PlayerDbTypes.JoinTeamDeniedUntilRecordsets
 * @typedef {import("../../types/playerDbTypes").SetTimezoneRecordsets} PlayerDbTypes.SetTimezoneRecordsets
 * @typedef {import("../../types/playerTypes").CareerData} PlayerTypes.CareerData
 * @typedef {import("../../types/playerTypes").FreeAgent} PlayerTypes.FreeAgent
 * @typedef {import("../../types/playerTypes").GameLogData} PlayerTypes.GameLogData
 * @typedef {import("../../types/playerTypes").GameRecord} PlayerTypes.GameRecord
 * @typedef {import("../../types/playerTypes").PlayerKDAStats} PlayerTypes.PlayerKDAStats
 * @typedef {import("../../types/playerTypes").PlayerStats} PlayerTypes.PlayerStats
 * @typedef {import("../../types/playerTypes").SeasonStats} PlayerTypes.SeasonStats
 * @typedef {import("../models/team")} Team
 * @typedef {import("../../types/teamTypes").TeamData} TeamTypes.TeamData
 */

const Db = require("node-database"),

    Cache = require("../cache"),
    db = require("./index"),
    settings = require("../../settings");

//  ####    ##                                ####   #
//  #   #    #                                 #  #  #
//  #   #    #     ###   #   #   ###   # ##    #  #  # ##
//  ####     #        #  #   #  #   #  ##  #   #  #  ##  #
//  #        #     ####  #  ##  #####  #       #  #  #   #
//  #        #    #   #   ## #  #      #       #  #  ##  #
//  #       ###    ####      #   ###   #      ####   # ##
//                       #   #
//                        ###
/**
 * A class that handles calls to the database for players.
 */
class PlayerDb {
    // #                                #  ####                    ###                     #  #         #     #    ##
    // #                                #  #                        #                      #  #         #           #
    // ###    ###  ###   ###    ##    ###  ###   ###    ##   # #    #     ##    ###  # #   #  #  ###   ###   ##     #
    // #  #  #  #  #  #  #  #  # ##  #  #  #     #  #  #  #  ####   #    # ##  #  #  ####  #  #  #  #   #     #     #
    // #  #  # ##  #  #  #  #  ##    #  #  #     #     #  #  #  #   #    ##    # ##  #  #  #  #  #  #   #     #     #
    // ###    # #  #  #  #  #   ##    ###  #     #      ##   #  #   #     ##    # #  #  #   ##   #  #    ##  ###   ###
    /**
     * Returns the date and time which the pilot is banned from a team until.
     * @param {DiscordJs.GuildMember} member The pilot to check.
     * @param {Team} team The team to check.
     * @returns {Promise<Date>} A promise that resolves with the date and time which the pilot is banned from the team until.  Returns nothing if the pilot is not banned.
     */
    static async bannedFromTeamUntil(member, team) {
        /** @type {PlayerDbTypes.BannedFromTeamUntilRecordsets} */
        const data = await db.query(/* sql */`
            SELECT tb.DateExpires
            FROM tblTeamBan tb
            INNER JOIN tblPlayer p ON tb.PlayerId = p.PlayerId
            WHERE tb.TeamId = @teamId
                AND p.DiscordId = @discordId
        `, {
            teamId: {type: Db.INT, value: team.id},
            discordId: {type: Db.VARCHAR(24), value: member.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateExpires && data.recordsets[0][0].DateExpires > new Date() && data.recordsets[0][0].DateExpires || void 0;
    }

    //                   ###          ##                #           #
    //                   #  #        #  #               #
    //  ##    ###  ###   ###    ##   #      ###  ###   ###    ###  ##    ###
    // #     #  #  #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #
    // #     # ##  #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #
    //  ##    # #  #  #  ###    ##    ##    # #  ###     ##   # #  ###   #  #
    //                                           #
    /**
     * Returns whether the pilot can be a captain.
     * @param {DiscordJs.GuildMember} member The pilot to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the pilot can be a captain.
     */
    static async canBeCaptain(member) {
        /** @type {DbTypes.EmptyRecordsets} */
        const data = await db.query(/* sql */`
            SELECT TOP 1 1
            FROM tblLeadershipPenalty lp
            INNER JOIN tblPlayer p ON lp.PlayerId = p.PlayerId
            WHERE p.DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return !(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    //                   ###                                 ###    #    ##           #
    //                   #  #                                #  #         #           #
    //  ##    ###  ###   #  #   ##   # #    ##   # #    ##   #  #  ##     #     ##   ###
    // #     #  #  #  #  ###   # ##  ####  #  #  # #   # ##  ###    #     #    #  #   #
    // #     # ##  #  #  # #   ##    #  #  #  #  # #   ##    #      #     #    #  #   #
    //  ##    # #  #  #  #  #   ##   #  #   ##    #     ##   #     ###   ###    ##     ##
    /**
     * Returns whether the pilot can remove another pilot.
     * @param {DiscordJs.GuildMember} member The pilot to check.
     * @param {DiscordJs.GuildMember} pilot The pilot to be removed.
     * @returns {Promise<boolean>} A promise that resolves with whether the pilot can remove the pilot.
     */
    static async canRemovePilot(member, pilot) {
        /** @type {DbTypes.EmptyRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT
            DECLARE @pilotPlayerId INT
            DECLARE @teamId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            SELECT @pilotPlayerId = PlayerId FROM tblPlayer WHERE DiscordId = @pilotId

            SELECT @teamId = TeamId FROM tblRoster WHERE PlayerId = @playerId

            SELECT TOP 1 1
            FROM (
                SELECT RosterId FROM tblRoster WHERE TeamId = @teamId AND PlayerId = @pilotPlayerId
                UNION SELECT RequestId FROM tblRequest WHERE TeamId = @teamId AND PlayerId = @pilotPlayerId
                UNION SELECT InviteId FROM tblInvite WHERE TeamId = @teamId AND PlayerId = @pilotPlayerId
            ) a
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            pilotId: {type: Db.VARCHAR(24), value: pilot.id}
        });
        return !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    //       ##                      ###    #
    //        #                       #
    //  ##    #     ##    ###  ###    #    ##    # #    ##   ####   ##   ###    ##
    // #      #    # ##  #  #  #  #   #     #    ####  # ##    #   #  #  #  #  # ##
    // #      #    ##    # ##  #      #     #    #  #  ##     #    #  #  #  #  ##
    //  ##   ###    ##    # #  #      #    ###   #  #   ##   ####   ##   #  #   ##
    /**
     * Clears a pilot's timezone.
     * @param {DiscordJs.GuildMember} member The pilot to clear the timezone for.
     * @returns {Promise<void>} A promise that resolves when the timezone is clear.
     */
    static async clearTimezone(member) {
        /** @type {PlayerDbTypes.ClearTimezoneRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF @playerId IS NULL
            BEGIN
                INSERT INTO tblPlayer (DiscordId, Name)
                VALUES (@discordId, @name)

                SET @playerId = SCOPE_IDENTITY()
            END

            UPDATE tblPlayer SET Timezone = null WHERE PlayerId = @playerId

            SELECT @playerId PlayerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(24), value: member.displayName}
        });

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].PlayerId) {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`]);
        }
    }

    //              #     ##
    //              #    #  #
    //  ###   ##   ###   #      ###  ###    ##    ##   ###
    // #  #  # ##   #    #     #  #  #  #  # ##  # ##  #  #
    //  ##   ##     #    #  #  # ##  #     ##    ##    #
    // #      ##     ##   ##    # #  #      ##    ##   #
    //  ###
    /**
     * Gets a player's career data.
     * @param {number} playerId The player ID to get data for.
     * @param {number} season The season to get the player's career data for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @param {string} gameType The game type to get data for.
     * @returns {Promise<PlayerTypes.CareerData>} A promise that resolves with a player's career data.
     */
    static async getCareer(playerId, season, postseason, gameType) {
        const key = `${settings.redisPrefix}:db:player:getCareer:${playerId}:${season === void 0 ? "null" : season}:${!!postseason}:${gameType}`;

        /** @type {PlayerTypes.CareerData} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetCareerRecordsets} */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(c.Season)
                FROM vwCompletedChallenge c
                INNER JOIN tblStat s ON c.ChallengeId = s.ChallengeId
                WHERE s.PlayerId = @playerId
            END

            SELECT p.Name, p.TwitchName, p.Timezone, t.TeamId, t.Tag, t.Name TeamName
            FROM tblPlayer p
            LEFT OUTER JOIN (
                tblRoster r
                INNER JOIN tblTeam t ON r.TeamId = t.TeamId
            ) ON r.PlayerId = p.PlayerId
            WHERE p.PlayerId = @playerId

            SELECT c.Season, c.Postseason, s.TeamId, t.Tag, t.Name TeamName, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, ISNULL(d.Damage, 0) Damage, ISNULL(d.Games, 0) GamesWithDamage, ISNULL(d.Deaths, 0) DeathsInGamesWithDamage, SUM(c.OvertimePeriods) OvertimePeriods
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN (
                SELECT c2.Season, c2.Postseason, s2.PlayerId, s2.TeamId, COUNT(DISTINCT c2.ChallengeId) Games, SUM(d.Damage) Damage, SUM(s2.Deaths) Deaths
                FROM vwCompletedChallenge c2
                INNER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON d.ChallengeId = c2.ChallengeId
                INNER JOIN (
                    SELECT PlayerId, TeamId, ChallengeId, SUM(Deaths) Deaths
                    FROM tblStat
                    GROUP BY PlayerId, TeamId, ChallengeId
                ) s2 ON d.PlayerId = s2.PlayerId AND s2.ChallengeId = c2.ChallengeId
                WHERE c2.GameType = @gameType
                    AND d.PlayerId = @playerId
                GROUP BY c2.Season, c2.Postseason, s2.PlayerId, s2.TeamId
            ) d ON p.PlayerId = d.PlayerId AND t.TeamID = d.TeamID AND c.Season = d.Season AND c.Postseason = d.Postseason
            WHERE s.PlayerId = @playerId
                AND c.GameType = @gameType
            GROUP BY c.Season, c.Postseason, s.TeamId, t.Tag, t.Name, d.Damage, d.Games, d.Deaths
            ORDER BY c.Season, c.Postseason, MIN(c.MatchTime)

            SELECT s.TeamId, t.Tag, t.Name TeamName, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, ISNULL(d.Damage, 0) Damage, ISNULL(d.Games, 0) GamesWithDamage, ISNULL(d.Deaths, 0) DeathsInGamesWithDamage, SUM(c.OvertimePeriods) OvertimePeriods
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
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
                WHERE c2.GameType = @gameType
                GROUP BY s2.TeamId, s2.PlayerId
            ) d ON p.PlayerId = d.PlayerId AND s.TeamId = d.TeamId
            WHERE s.PlayerId = @playerId
                AND c.GameType = @gameType
            GROUP BY s.TeamId, t.Tag, t.Name, d.Damage, d.Games, d.Deaths
            ORDER BY t.Name

            SELECT o.TeamId, o.Tag, o.Name TeamName, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods, sb.ChallengeId, sb.ChallengingTeamTag, sb.ChallengedTeamTag, sb.MatchTime BestMatchTime, sb.Map BestMap, sb.Captures BestCaptures, sb.Pickups BestPickups, sb.CarrierKills BestCarrierKills, sb.Returns BestReturns, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths, sb.Damage BestDamage
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY s.PlayerId, CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END ORDER BY CASE @gameType WHEN 'CTF' THEN s.Captures ELSE 0 END DESC, CASE @gameType WHEN 'CTF' THEN s.CarrierKills ELSE 0 END DESC, CAST(s.Kills + s.Assists AS FLOAT) / CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END DESC) Row,
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
                    c.Map,
                    c.MatchTime,
                    ISNULL(SUM(d.Damage), 0) Damage,
                    CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END OpponentTeamId,
                    t1.Tag ChallengingTeamTag,
                    t2.Tag ChallengedTeamTag
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                INNER JOIN tblTeam t1 ON c.ChallengingTeamId = t1.TeamId
                INNER JOIN tblTeam t2 ON c.ChallengedTeamId = t2.TeamId
                LEFT OUTER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE PlayerId = @playerId
                        AND TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON c.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = @gameType
                GROUP BY s.ChallengeId,
                    s.PlayerId,
                    s.TeamId,
                    s.Captures,
                    s.Pickups,
                    s.CarrierKills,
                    s.Returns,
                    s.Kills,
                    s.Assists,
                    s.Deaths,
                    c.Map,
                    c.MatchTime,
                    c.ChallengingTeamId,
                    c.ChallengedTeamId,
                    t1.Tag,
                    t2.Tag
            ) sb ON s.PlayerId = sb.PlayerId AND o.TeamId = sb.OpponentTeamId AND sb.Row = 1
            WHERE s.PlayerId = @playerId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
                AND c.GameType = @gameType
            GROUP BY o.TeamId, o.Tag, o.Name, sb.ChallengeId, sb.ChallengingTeamTag, sb.ChallengedTeamTag, sb.MatchTime, sb.Map, sb.Captures, sb.Pickups, sb.CarrierKills, sb.Returns, sb.Kills, sb.Assists, sb.Deaths, sb.Damage
            ORDER BY o.Name

            SELECT c.Map, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods, sb.ChallengeId, sb.ChallengingTeamTag, sb.ChallengedTeamTag, o.TeamId BestOpponentTeamId, o.Tag BestOpponentTag, o.Name BestOpponentTeamName, sb.MatchTime BestMatchTime, sb.Captures BestCaptures, sb.Pickups BestPickups, sb.CarrierKills BestCarrierKills, sb.Returns BestReturns, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths, sb.Damage BestDamage
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY s.PlayerId, c.Map ORDER BY CASE @gameType WHEN 'CTF' THEN s.Captures ELSE 0 END DESC, CASE @gameType WHEN 'CTF' THEN s.CarrierKills ELSE 0 END DESC, CAST(s.Kills + s.Assists AS FLOAT) / CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END DESC) Row,
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
                    c.Map,
                    c.MatchTime,
                    ISNULL(SUM(d.Damage), 0) Damage,
                    CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END OpponentTeamId,
                    t1.Tag ChallengingTeamTag,
                    t2.Tag ChallengedTeamTag
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                INNER JOIN tblTeam t1 ON c.ChallengingTeamId = t1.TeamId
                INNER JOIN tblTeam t2 ON c.ChallengedTeamId = t2.TeamId
                LEFT OUTER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE PlayerId = @playerId
                        AND TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON c.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = @gameType
                GROUP BY s.ChallengeId,
                    s.PlayerId,
                    s.TeamId,
                    s.Captures,
                    s.Pickups,
                    s.CarrierKills,
                    s.Returns,
                    s.Kills,
                    s.Assists,
                    s.Deaths,
                    c.Map,
                    c.MatchTime,
                    c.ChallengingTeamId,
                    c.ChallengedTeamId,
                    t1.Tag,
                    t2.Tag
            ) sb ON s.PlayerId = sb.PlayerId AND c.Map = sb.Map AND sb.Row = 1
            INNER JOIN tblTeam o ON sb.OpponentTeamId = o.TeamId
            WHERE s.PlayerId = @playerId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
                AND c.GameType = @gameType
            GROUP BY c.Map, o.TeamId, o.Tag, o.Name, sb.ChallengeId, sb.ChallengingTeamTag, sb.ChallengedTeamTag, sb.MatchTime, sb.Captures, sb.Pickups, sb.CarrierKills, sb.Returns, sb.Kills, sb.Assists, sb.Deaths, sb.Damage
            ORDER BY c.Map

            SELECT d.Weapon, SUM(Damage) Damage
            FROM tblDamage d
            INNER JOIN vwCompletedChallenge c ON d.ChallengeId = c.ChallengeId
            WHERE (@season IS NULL OR c.Season = @season)
                AND d.TeamId <> d.OpponentTeamId
                AND d.PlayerId = @playerId
            GROUP BY d.Weapon

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            playerId: {type: Db.INT, value: playerId},
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason},
            gameType: {type: Db.VARCHAR(5), value: gameType}
        });
        cache = data && data.recordsets && data.recordsets.length === 7 && data.recordsets[0].length > 0 && {
            player: {
                name: data.recordsets[0][0].Name,
                twitchName: data.recordsets[0][0].TwitchName,
                timezone: data.recordsets[0][0].Timezone,
                teamId: data.recordsets[0][0].TeamId,
                tag: data.recordsets[0][0].Tag,
                teamName: data.recordsets[0][0].TeamName
            },
            career: data.recordsets[1].map((row) => ({
                season: row.Season,
                postseason: row.Postseason,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
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
                overtimePeriods: row.OvertimePeriods
            })),
            careerTeams: data.recordsets[2].map((row) => ({
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
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
                overtimePeriods: row.OvertimePeriods
            })),
            opponents: data.recordsets[3].map((row) => ({
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                games: row.Games,
                captures: row.Captures,
                pickups: row.Pickups,
                carrierKills: row.CarrierKills,
                returns: row.Returns,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                overtimePeriods: row.OvertimePeriods,
                challengeId: row.ChallengeId,
                challengingTeamTag: row.ChallengingTeamTag,
                challengedTeamTag: row.ChallengedTeamTag,
                bestMatchTime: row.BestMatchTime,
                bestMap: row.BestMap,
                bestCaptures: row.BestCaptures,
                bestPickups: row.BestPickups,
                bestCarrierKills: row.BestCarrierKills,
                bestReturns: row.BestReturns,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths,
                bestDamage: row.BestDamage
            })),
            maps: data.recordsets[4].map((row) => ({
                map: row.Map,
                games: row.Games,
                captures: row.Captures,
                pickups: row.Pickups,
                carrierKills: row.CarrierKills,
                returns: row.Returns,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                overtimePeriods: row.OvertimePeriods,
                challengeId: row.ChallengeId,
                challengingTeamTag: row.ChallengingTeamTag,
                challengedTeamTag: row.ChallengedTeamTag,
                bestMatchTime: row.BestMatchTime,
                bestOpponentTeamId: row.BestOpponentTeamId,
                bestOpponentTag: row.BestOpponentTag,
                bestOpponentTeamName: row.BestOpponentTeamName,
                bestCaptures: row.BestCaptures,
                bestPickups: row.BestPickups,
                bestCarrierKills: row.BestCarrierKills,
                bestReturns: row.BestReturns,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths,
                bestDamage: row.BestDamage
            })),
            damage: data.recordsets[5].reduce((prev, cur) => {
                prev[cur.Weapon] = cur.Damage;
                return prev;
            }, {})
        } || void 0;

        Cache.add(key, cache, season === void 0 && data && data.recordsets && data.recordsets[6] && data.recordsets[6][0] && data.recordsets[6][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:player:${playerId}:updated`]);

        return cache;
    }

    //              #     ##                 #             #   ##   #           ##    ##
    //              #    #  #                #             #  #  #  #            #     #
    //  ###   ##   ###   #      ###   ###   ###    ##    ###  #     ###    ###   #     #     ##   ###    ###   ##    ###
    // #  #  # ##   #    #     #  #  ##      #    # ##  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  ##
    //  ##   ##     #    #  #  # ##    ##    #    ##    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##      ##
    // #      ##     ##   ##    # #  ###      ##   ##    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###
    //  ###                                                                                              ###
    /**
     * Gets the challenge IDs for the matches the pilot is casting.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @returns {Promise<number[]>} A promise that resolves with the list of challenge IDs they are casting.
     */
    static async getCastedChallenges(pilot) {
        /** @type {PlayerDbTypes.GetCastedChallengesRecordsets} */
        const data = await db.query(/* sql */`
            SELECT c.ChallengeId
            FROM tblChallenge c
            INNER JOIN tblPlayer p ON c.CasterPlayerId = p.PlayerId
            WHERE p.DiscordId = @discordId
                AND c.DateClosed IS NULL
        `, {discordId: {type: Db.VARCHAR(24), value: pilot.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.ChallengeId) || [];
    }

    //              #    ####                     ##                      #
    //              #    #                       #  #                     #
    //  ###   ##   ###   ###   ###    ##    ##   #  #   ###   ##   ###   ###    ###
    // #  #  # ##   #    #     #  #  # ##  # ##  ####  #  #  # ##  #  #   #    ##
    //  ##   ##     #    #     #     ##    ##    #  #   ##   ##    #  #   #      ##
    // #      ##     ##  #     #      ##    ##   #  #  #      ##   #  #    ##  ###
    //  ###                                             ###
    /**
     * Gets the current list of free agents.
     * @returns {Promise<PlayerTypes.FreeAgent[]>} The list of free agents.
     */
    static async getFreeAgents() {
        const key = `${settings.redisPrefix}:db:player:getFreeAgents`;

        /** @type {PlayerTypes.FreeAgent[]} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetFreeAgentsRecordsets} */
        const data = await db.query(/* sql */`
            SELECT PlayerId, Name, DiscordId, Timezone
            FROM tblPlayer
            WHERE PlayerId NOT IN (SELECT PlayerId FROM tblRoster)
                AND PlayerId NOT IN (SELECT PlayerId FROM tblJoinBan WHERE DateExpires > GETUTCDATE())
                AND Timezone IS NOT NULL
            ORDER BY Name
        `);
        cache = data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({playerId: row.PlayerId, name: row.Name, discordId: row.DiscordId, timezone: row.Timezone})) || [];

        Cache.add(key, cache, void 0, [`${settings.redisPrefix}:invalidate:player:freeagents`]);

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
     * Gets a player's game log.
     * @param {number} playerId The player ID to get the game log for.
     * @param {number} season The season to get the player's game log for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<PlayerTypes.GameLogData>} A promise that resolves with a player's game log.
     */
    static async getGameLog(playerId, season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getGameLog:${playerId}:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {PlayerTypes.GameLogData} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetGameLogRecordsets} */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(c.Season)
                FROM vwCompletedChallenge c
                INNER JOIN tblStat s ON c.ChallengeId = s.ChallengeId
                WHERE s.PlayerId = @playerId
            END

            SELECT p.Name, t.TeamId, t.Tag, t.Name TeamName
            FROM tblPlayer p
            LEFT OUTER JOIN (
                tblRoster r
                INNER JOIN tblTeam t ON r.TeamId = t.TeamId
            ) ON r.PlayerId = p.PlayerId
            WHERE p.PlayerId = @playerId

            SELECT c.ChallengeId, t1.Tag ChallengingTeamTag, t2.Tag ChallengedTeamTag, t.TeamId, t.Tag, t.Name, s.Captures, s.Pickups, s.CarrierKills, s.Returns, s.Kills, s.Assists, s.Deaths, ISNULL(SUM(d.Damage), 0) Damage, c.OvertimePeriods, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentName, CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END TeamScore, CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamScore ELSE c.ChallengingTeamScore END OpponentScore, CASE WHEN c.RatingChange IS NULL THEN NULL ELSE CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.RatingChange ELSE 0 - c.RatingChange END END RatingChange, c.TeamSize, c.MatchTime, c.Map, c.GameType
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblTeam t1 ON c.ChallengingTeamId = t1.TeamId
            INNER JOIN tblTeam t2 ON c.ChallengedTeamId = t2.TeamId
            LEFT OUTER JOIN tblDamage d ON c.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId AND d.TeamId <> d.OpponentTeamId
            WHERE s.PlayerId = @playerId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            GROUP BY c.ChallengeId, t1.Tag, t2.Tag, t.TeamId, t.Tag, t.Name, s.Captures, s.Pickups, s.CarrierKills, s.Returns, s.Kills, s.Assists, s.Deaths, c.OvertimePeriods, o.TeamId, o.Tag, o.Name, CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END, CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamScore ELSE c.ChallengingTeamScore END, CASE WHEN c.RatingChange IS NULL THEN NULL ELSE CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.RatingChange ELSE 0 - c.RatingChange END END, c.TeamSize, c.MatchTime, c.Map, c.GameType
            ORDER BY c.MatchTime

            SELECT DISTINCT c.Season
            FROM vwCompletedChallenge c
            INNER JOIN tblStat s ON c.ChallengeId = s.ChallengeId
            WHERE PlayerId = @playerId
            ORDER BY c.Season

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            playerId: {type: Db.INT, value: playerId},
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });

        cache = data && data.recordsets && data.recordsets.length === 4 && data.recordsets[0].length > 0 && {
            player: {
                name: data.recordsets[0][0].Name,
                teamId: data.recordsets[0][0].TeamId,
                tag: data.recordsets[0][0].Tag,
                teamName: data.recordsets[0][0].TeamName
            },
            matches: data.recordsets[1].map((row) => ({
                challengeId: row.ChallengeId,
                challengingTeamTag: row.ChallengingTeamTag,
                challengedTeamTag: row.ChallengedTeamTag,
                teamId: row.TeamId,
                tag: row.Tag,
                name: row.Name,
                captures: row.Captures,
                pickups: row.Pickups,
                carrierKills: row.CarrierKills,
                returns: row.Returns,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                damage: row.Damage,
                overtimePeriods: row.OvertimePeriods,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentName: row.OpponentName,
                teamScore: row.TeamScore,
                opponentScore: row.OpponentScore,
                ratingChange: row.RatingChange,
                teamSize: row.TeamSize,
                matchTime: row.MatchTime,
                map: row.Map,
                gameType: row.GameType
            })),
            seasons: data.recordsets[2].map((row) => row.Season)
        };

        Cache.add(key, cache, season === void 0 && data && data.recordsets && data.recordsets[3] && data.recordsets[3][0] && data.recordsets[3][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:player:${playerId}:updated`]);

        return cache;
    }

    //              #    ###                              #          ##   ###   ####  ###   ##
    //              #    #  #                             #         #  #   #    #     #  #   #
    //  ###   ##   ###   #  #   ##    ##    ##   ###    ###   ###   #      #    ###   #  #   #     ###  #  #   ##   ###
    // #  #  # ##   #    ###   # ##  #     #  #  #  #  #  #  ##     #      #    #     ###    #    #  #  #  #  # ##  #  #
    //  ##   ##     #    # #   ##    #     #  #  #     #  #    ##   #  #   #    #     #      #    # ##   # #  ##    #
    // #      ##     ##  #  #   ##    ##    ##   #      ###  ###     ##    #    #     #     ###    # #    #    ##   #
    //  ###                                                                                              #
    /**
     * Gets the league player records for team anarchy.
     * @param {number} season The season to get the records for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<Object<string, PlayerTypes.GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecordsCTFPlayer(season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getRecords:CTF:player:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {Object<string, PlayerTypes.GameRecord[]>} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetRecordsCTFPlayerRecordsets} */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season)
                FROM tblSeason
                WHERE DateStart < GETUTCDATE()
            END

            SELECT s.TeamSize, s.Captures, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY s.Captures DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    s.Captures
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Pickups, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY s.Pickups DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    s.Pickups
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.CarrierKills, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY s.CarrierKills DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    s.CarrierKills
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Returns, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY s.Returns DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    s.Returns
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Damage, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(d.Damage) DESC) Rank,
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    d.PlayerId,
                    SUM(d.Damage) Damage
                FROM tblDamage d
                INNER JOIN vwCompletedChallenge c ON d.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
                    AND d.TeamId <> d.OpponentTeamId
                GROUP BY
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    d.PlayerId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.KDA, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY (s.Kills + s.Assists) / CAST(CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END AS FLOAT) DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    (s.Kills + s.Assists) / CAST(CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END AS FLOAT) KDA
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        cache = data && data.recordsets && data.recordsets.length === 7 && {
            captures: data.recordsets[0].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Captures,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            pickups: data.recordsets[1].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Pickups,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            carrierKills: data.recordsets[2].map((row) => ({
                teamSize: row.TeamSize,
                record: row.CarrierKills,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            returns: data.recordsets[3].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Returns,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            damage: data.recordsets[4].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Damage,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            kda: data.recordsets[5].map((row) => ({
                teamSize: row.TeamSize,
                record: row.KDA,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            }))
        } || void 0;

        Cache.add(key, cache, season === void 0 && data && data.recordsets && data.recordsets[6] && data.recordsets[6][0] && data.recordsets[6][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`, `${settings.redisPrefix}:invalidate:player:updated`]);

        return cache;
    }

    //              #    ###                              #          ##   ###   ####  ###
    //              #    #  #                             #         #  #   #    #      #
    //  ###   ##   ###   #  #   ##    ##    ##   ###    ###   ###   #      #    ###    #     ##    ###  # #
    // #  #  # ##   #    ###   # ##  #     #  #  #  #  #  #  ##     #      #    #      #    # ##  #  #  ####
    //  ##   ##     #    # #   ##    #     #  #  #     #  #    ##   #  #   #    #      #    ##    # ##  #  #
    // #      ##     ##  #  #   ##    ##    ##   #      ###  ###     ##    #    #      #     ##    # #  #  #
    //  ###
    /**
     * Gets the league team records for team anarchy.
     * @param {number} season The season to get the records for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<Object<string, PlayerTypes.GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecordsCTFTeam(season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getRecords:CTF:team:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {Object<string, PlayerTypes.GameRecord[]>} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetRecordsCTFTeamRecordsets} */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season)
                FROM tblSeason
                WHERE DateStart < GETUTCDATE()
            END

            SELECT s.TeamSize, s.Score, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER (PARTITION BY c.TeamSize ORDER BY CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END DESC) Rank,
                    c.TeamSize,
                    c.ChallengeId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END TeamId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END Score
                FROM vwCompletedChallenge c
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
                GROUP BY c.TeamSize, c.ChallengeId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Pickups, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(s.Pickups) DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    SUM(s.Pickups) Pickups
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
                GROUP BY s.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.CarrierKills, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(s.CarrierKills) DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    SUM(s.CarrierKills) CarrierKills
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
                GROUP BY s.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Returns, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(s.Returns) DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    SUM(s.Returns) Returns
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
                GROUP BY s.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Damage, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(d.Damage) DESC) Rank,
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    SUM(d.Damage) Damage
                FROM tblDamage d
                INNER JOIN vwCompletedChallenge c ON d.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
                    AND d.TeamId <> d.OpponentTeamId
                GROUP BY d.ChallengeId, c.TeamSize, d.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.TeamKDA, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY (SUM(s.Kills) + SUM(s.Assists)) / CAST(CASE WHEN SUM(s.Deaths) < 1 THEN 1 ELSE SUM(s.Deaths) END AS FLOAT) DESC) Rank,
                    c.ChallengeId,
                    c.TeamSize,
                    s.TeamId,
                    (SUM(s.Kills) + SUM(s.Assists)) / CAST(CASE WHEN SUM(s.Deaths) < 1 THEN 1 ELSE SUM(s.Deaths) END AS FLOAT) TeamKDA
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'CTF'
                GROUP BY c.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE s.Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        cache = data && data.recordsets && data.recordsets.length === 7 && {
            teamScore: data.recordsets[0].map((row) => ({
                teamSize: row.TeamSize,
                teamId: row.TeamId,
                record: row.Score,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamPickups: data.recordsets[1].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Pickups,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamCarrierKills: data.recordsets[2].map((row) => ({
                teamSize: row.TeamSize,
                record: row.CarrierKills,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamReturns: data.recordsets[3].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Returns,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamDamage: data.recordsets[4].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Damage,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamKda: data.recordsets[5].map((row) => ({
                teamSize: row.TeamSize,
                record: row.TeamKDA,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            }))
        } || void 0;

        Cache.add(key, cache, season === void 0 && data && data.recordsets && data.recordsets[6] && data.recordsets[6][0] && data.recordsets[6][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`, `${settings.redisPrefix}:invalidate:player:updated`]);

        return cache;
    }

    //              #    ###                              #         ###    ##   ###   ##
    //              #    #  #                             #          #    #  #  #  #   #
    //  ###   ##   ###   #  #   ##    ##    ##   ###    ###   ###    #    #  #  #  #   #     ###  #  #   ##   ###
    // #  #  # ##   #    ###   # ##  #     #  #  #  #  #  #  ##      #    ####  ###    #    #  #  #  #  # ##  #  #
    //  ##   ##     #    # #   ##    #     #  #  #     #  #    ##    #    #  #  #      #    # ##   # #  ##    #
    // #      ##     ##  #  #   ##    ##    ##   #      ###  ###     #    #  #  #     ###    # #    #    ##   #
    //  ###                                                                                        #
    /**
     * Gets the league player records for team anarchy.
     * @param {number} season The season to get the records for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<Object<string, PlayerTypes.GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecordsTAPlayer(season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getRecords:TA:player:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {Object<string, PlayerTypes.GameRecord[]>} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetRecordsTAPlayerRecordsets} */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season)
                FROM tblSeason
                WHERE DateStart < GETUTCDATE()
            END

            SELECT s.TeamSize, s.KDA, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY (s.Kills + s.Assists) / CAST(CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END AS FLOAT) DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    (s.Kills + s.Assists) / CAST(CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END AS FLOAT) KDA
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Kills, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY s.Kills DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    s.Kills
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Assists, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY s.Assists DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    s.Assists
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Deaths, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY s.Deaths) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    s.PlayerId,
                    s.Deaths
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Damage, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(d.Damage) DESC) Rank,
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    d.PlayerId,
                    SUM(d.Damage) Damage
                FROM tblDamage d
                INNER JOIN vwCompletedChallenge c ON d.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
                    AND d.TeamId <> d.OpponentTeamId
                GROUP BY
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    d.PlayerId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.DamagePerDeath, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(d.Damage) / s.Deaths DESC) Rank,
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    d.PlayerId,
                    SUM(d.Damage) / s.Deaths DamagePerDeath
                FROM tblDamage d
                INNER JOIN vwCompletedChallenge c ON d.ChallengeId = c.ChallengeId
                INNER JOIN tblStat s ON c.ChallengeId = s.ChallengeId AND d.PlayerId = s.PlayerId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
                    AND d.TeamId <> d.OpponentTeamId
                GROUP BY
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    d.PlayerId,
                    s.Deaths
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        cache = data && data.recordsets && data.recordsets.length === 7 && {
            kda: data.recordsets[0].map((row) => ({
                teamSize: row.TeamSize,
                record: row.KDA,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            kills: data.recordsets[1].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Kills,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            assists: data.recordsets[2].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Assists,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            deaths: data.recordsets[3].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Deaths,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            damage: data.recordsets[4].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Damage,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            damagePerDeath: data.recordsets[5].map((row) => ({
                teamSize: row.TeamSize,
                record: row.DamagePerDeath,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            }))
        } || void 0;

        Cache.add(key, cache, season === void 0 && data && data.recordsets && data.recordsets[6] && data.recordsets[6][0] && data.recordsets[6][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`, `${settings.redisPrefix}:invalidate:player:updated`]);

        return cache;
    }

    //              #    ###                              #         ###    ##   ###
    //              #    #  #                             #          #    #  #   #
    //  ###   ##   ###   #  #   ##    ##    ##   ###    ###   ###    #    #  #   #     ##    ###  # #
    // #  #  # ##   #    ###   # ##  #     #  #  #  #  #  #  ##      #    ####   #    # ##  #  #  ####
    //  ##   ##     #    # #   ##    #     #  #  #     #  #    ##    #    #  #   #    ##    # ##  #  #
    // #      ##     ##  #  #   ##    ##    ##   #      ###  ###     #    #  #   #     ##    # #  #  #
    //  ###
    /**
     * Gets the league team records for team anarchy.
     * @param {number} season The season to get the records for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<Object<string, PlayerTypes.GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecordsTATeam(season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getRecords:TA:team:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {Object<string, PlayerTypes.GameRecord[]>} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetRecordsTATeamRecordsets} */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season)
                FROM tblSeason
                WHERE DateStart < GETUTCDATE()
            END

            SELECT s.TeamSize, s.TeamKDA, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY (SUM(s.Kills) + SUM(s.Assists)) / CAST(CASE WHEN SUM(s.Deaths) < 1 THEN 1 ELSE SUM(s.Deaths) END AS FLOAT) DESC) Rank,
                    c.ChallengeId,
                    c.TeamSize,
                    s.TeamId,
                    (SUM(s.Kills) + SUM(s.Assists)) / CAST(CASE WHEN SUM(s.Deaths) < 1 THEN 1 ELSE SUM(s.Deaths) END AS FLOAT) TeamKDA
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
                GROUP BY c.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE s.Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Score, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER (PARTITION BY c.TeamSize ORDER BY CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END DESC) Rank,
                    c.TeamSize,
                    c.ChallengeId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END TeamId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END Score
                FROM vwCompletedChallenge c
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
                GROUP BY c.TeamSize, c.ChallengeId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Assists, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(s.Assists) DESC) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    SUM(s.Assists) Assists
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
                GROUP BY s.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Deaths, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(s.Deaths)) Rank,
                    c.TeamSize,
                    s.ChallengeId,
                    s.TeamId,
                    SUM(s.Deaths) Deaths
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
                GROUP BY s.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Damage, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(d.Damage) DESC) Rank,
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    SUM(d.Damage) Damage
                FROM tblDamage d
                INNER JOIN vwCompletedChallenge c ON d.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
                    AND d.TeamId <> d.OpponentTeamId
                GROUP BY d.ChallengeId, c.TeamSize, d.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.DamagePerDeath, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.ChallengeId, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER(PARTITION BY c.TeamSize ORDER BY SUM(d.Damage) / s.Deaths DESC) Rank,
                    c.TeamSize,
                    d.ChallengeId,
                    d.TeamId,
                    SUM(d.Damage) / s.Deaths DamagePerDeath
                FROM tblDamage d
                INNER JOIN vwCompletedChallenge c ON d.ChallengeId = c.ChallengeId
                INNER JOIN (
                    SELECT ChallengeId, TeamId, SUM(Deaths) Deaths
                    FROM tblStat s
                    GROUP BY ChallengeId, TeamId
                ) s ON c.ChallengeId = s.ChallengeId AND s.TeamId = d.TeamId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Season >= 3
                    AND c.Postseason = @postseason
                    AND c.GameType = 'TA'
                    AND d.TeamId <> d.OpponentTeamId
                GROUP BY d.ChallengeId, c.TeamSize, d.TeamId, s.Deaths
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        cache = data && data.recordsets && data.recordsets.length === 7 && {
            teamKda: data.recordsets[0].map((row) => ({
                teamSize: row.TeamSize,
                teamId: row.TeamId,
                record: row.TeamKDA,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamScore: data.recordsets[1].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Score,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamAssists: data.recordsets[2].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Assists,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamDeaths: data.recordsets[3].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Deaths,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamDamage: data.recordsets[4].map((row) => ({
                teamSize: row.TeamSize,
                record: row.Damage,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamDamagePerDeath: data.recordsets[5].map((row) => ({
                teamSize: row.TeamSize,
                record: row.DamagePerDeath,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                challengeId: row.ChallengeId,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            }))
        } || void 0;

        Cache.add(key, cache, season === void 0 && data && data.recordsets && data.recordsets[6] && data.recordsets[6][0] && data.recordsets[6][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`, `${settings.redisPrefix}:invalidate:player:updated`]);

        return cache;
    }

    //              #    ###                                   #             #   ##         ###                #     #             #  ###
    //              #    #  #                                  #             #  #  #         #                       #             #   #
    //  ###   ##   ###   #  #   ##    ###  #  #   ##    ###   ###    ##    ###  #  #  ###    #    ###   # #   ##    ###    ##    ###   #     ##    ###  # #    ###
    // #  #  # ##   #    ###   # ##  #  #  #  #  # ##  ##      #    # ##  #  #  #  #  #  #   #    #  #  # #    #     #    # ##  #  #   #    # ##  #  #  ####  ##
    //  ##   ##     #    # #   ##    #  #  #  #  ##      ##    #    ##    #  #  #  #  #      #    #  #  # #    #     #    ##    #  #   #    ##    # ##  #  #    ##
    // #      ##     ##  #  #   ##    ###   ###   ##   ###      ##   ##    ###   ##   #     ###   #  #   #    ###     ##   ##    ###   #     ##    # #  #  #  ###
    //  ###                             #
    /**
     * Gets the list of requested or invited teams for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot to check.
     * @returns {Promise<TeamTypes.TeamData[]>} A promise that resolves with the list of teams the pilot has requested or is invited to.
     */
    static async getRequestedOrInvitedTeams(member) {
        /** @type {PlayerDbTypes.GetRequestedOrInvitedTeamsRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            SELECT TeamId, Name, Tag
            FROM tblTeam
            WHERE Disbanded = 0
                AND (
                    TeamId IN (SELECT TeamId FROM tblRequest WHERE PlayerId = @playerId)
                    OR TeamId IN (SELECT TeamId FROM tblInvite WHERE PlayerId = @playerId)
                )
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({id: row.TeamId, name: row.Name, tag: row.Tag})) || void 0;
    }

    //              #     ##                                   ##    #           #
    //              #    #  #                                 #  #   #           #
    //  ###   ##   ###    #     ##    ###   ###    ##   ###    #    ###    ###  ###    ###
    // #  #  # ##   #      #   # ##  #  #  ##     #  #  #  #    #    #    #  #   #    ##
    //  ##   ##     #    #  #  ##    # ##    ##   #  #  #  #  #  #   #    # ##   #      ##
    // #      ##     ##   ##    ##    # #  ###     ##   #  #   ##     ##   # #    ##  ###
    //  ###
    /**
     * Gets player stats for the specified season.
     * @param {number} [season] The season number, or void for the latest season.
     * @param {boolean} postseason Whether to get stats for the postseason.
     * @param {string} gameType The game type to get season stats for.
     * @param {boolean} all Whether to show all players, or just players over 10% games played.
     * @returns {Promise<PlayerTypes.SeasonStats[]>} A promise that resolves with the stats.
     */
    static async getSeasonStats(season, postseason, gameType, all) {
        const key = `${settings.redisPrefix}:db:player:getSeasonStats:${season === void 0 ? "null" : season}:${gameType}:${!!postseason}:${all ? "all" : "active"}`;
        /** @type {PlayerTypes.SeasonStats[]} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetSeasonStatsRecordsets} */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season)
                FROM tblSeason
                WHERE DateStart < GETUTCDATE()
            END

            SELECT DISTINCT
                p.PlayerId,
                p.Name,
                ls.TeamId,
                t.Name TeamName,
                t.Tag,
                t.Disbanded,
                t.Locked,
                SUM(s.Captures) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgCaptures,
                SUM(s.Pickups) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgPickups,
                SUM(s.CarrierKills) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgCarrierKills,
                SUM(s.Returns) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgReturns,
                SUM(s.Kills) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgKills,
                SUM(s.Assists) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgAssists,
                SUM(s.Deaths) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgDeaths,
                ISNULL(s3.Damage, 0) / (s3.Games + 0.15 * s3.OvertimePeriods) AvgDamagePerGame,
                ISNULL(s3.Damage, 0) / CASE WHEN s3.Deaths = 0 THEN 1 ELSE s3.Deaths END AvgDamagePerDeath,
                CAST(SUM(s.Kills) + SUM(s.Assists) AS FLOAT) / CASE WHEN SUM(s.Deaths) = 0 THEN 1 ELSE SUM(s.Deaths) END KDA
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN (
                SELECT ls.PlayerId, ls.TeamId, RANK() OVER(PARTITION BY ls.PlayerId ORDER BY lc.MatchTime DESC) Row
                FROM vwCompletedChallenge lc
                INNER JOIN tblStat ls ON lc.ChallengeId = ls.ChallengeId
                WHERE lc.MatchTime IS NOT NULL
                    AND (@season = 0 OR lc.Season = @season)
                    AND lc.Postseason = @postseason
            ) ls ON p.PlayerId = ls.PlayerId
            ${all ? "" : /* sql */`
                INNER JOIN (
                    SELECT s2.PlayerId, CAST(COUNT(s2.StatId) AS FLOAT) / g2.Games PctPlayed
                    FROM tblStat s2
                    INNER JOIN vwCompletedChallenge c2 ON s2.ChallengeId = c2.ChallengeId
                    INNER JOIN (
                        SELECT ROW_NUMBER() OVER(PARTITION BY s3.PlayerId ORDER BY c3.MatchTime) Row, s3.PlayerId, s3.TeamId
                        FROM tblStat s3
                        INNER JOIN vwCompletedChallenge c3 ON s3.ChallengeId = c3.ChallengeId
                        WHERE (@season = 0 OR c3.Season = @season)
                            AND c3.Postseason = @postseason
                            AND c3.GameType = @gameType
                    ) r2 ON s2.PlayerId = r2.PlayerId AND r2.Row = 1
                    INNER JOIN (
                        SELECT COUNT(DISTINCT s3.ChallengeId) Games, s3.TeamId
                        FROM tblStat s3
                        INNER JOIN vwCompletedChallenge c3 ON s3.ChallengeId = c3.ChallengeId
                        WHERE (@season = 0 OR c3.Season = @season)
                            AND c3.Postseason = @postseason
                            AND c3.GameType = @gameType
                        GROUP BY s3.TeamId
                    ) g2 ON r2.TeamId = g2.TeamId
                    WHERE (@season = 0 OR c2.Season = @season)
                        AND c2.Postseason = @postseason
                        AND c2.GameType = @gameType
                    GROUP BY s2.PlayerId, g2.Games
                ) g on p.PlayerId = g.PlayerId
            `}
            INNER JOIN tblTeam t ON ls.TeamId = t.TeamId
            LEFT OUTER JOIN (
                SELECT s2.PlayerId, COUNT(DISTINCT c2.ChallengeId) Games, SUM(c2.OvertimePeriods) OvertimePeriods, SUM(d.Damage) Damage, SUM(s2.Deaths) Deaths
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
                GROUP BY s2.PlayerId
            ) s3 ON s.PlayerId = s3.PlayerId
            LEFT OUTER JOIN (
                SELECT ChallengeId, PlayerId, SUM(Damage) Damage
                FROM tblDamage
                WHERE TeamId <> OpponentTeamId
                GROUP BY ChallengeId, PlayerId
            ) d ON c.ChallengeId = d.ChallengeId AND p.PlayerId = d.PlayerId
            WHERE c.MatchTime IS NOT NULL
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
                AND c.GameType = @gameType
                AND ls.Row = 1
                ${all ? "" : /* sql */`
                    AND g.PctPlayed >= 0.1
                `}
            GROUP BY p.PlayerId, p.Name, ls.TeamId, t.Name, t.Tag, t.Disbanded, t.Locked, s3.Games, s3.OvertimePeriods, s3.Damage, s3.Deaths

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason},
            gameType: {type: Db.VARCHAR(5), value: gameType}
        });
        cache = data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            playerId: row.PlayerId,
            name: row.Name,
            teamId: row.TeamId,
            teamName: row.TeamName,
            tag: row.Tag,
            disbanded: row.Disbanded,
            locked: row.Locked,
            avgCaptures: row.AvgCaptures,
            avgPickups: row.AvgPickups,
            avgCarrierKills: row.AvgCarrierKills,
            avgReturns: row.AvgReturns,
            avgKills: row.AvgKills,
            avgAssists: row.AvgAssists,
            avgDeaths: row.AvgDeaths,
            avgDamagePerGame: row.AvgDamagePerGame,
            avgDamagePerDeath: row.AvgDamagePerDeath,
            kda: row.KDA
        }));

        Cache.add(key, cache, !season && data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`, `${settings.redisPrefix}:invalidate:player:updated`]);

        return cache;
    }

    //              #     ##    #           #
    //              #    #  #   #           #
    //  ###   ##   ###    #    ###    ###  ###    ###
    // #  #  # ##   #      #    #    #  #   #    ##
    //  ##   ##     #    #  #   #    # ##   #      ##
    // #      ##     ##   ##     ##   # #    ##  ###
    //  ###
    /**
     * Gets the season stats for the specified pilot.
     * @param {DiscordJs.GuildMember | DiscordJs.User} pilot The pilot to get stats for.
     * @returns {Promise<PlayerTypes.PlayerStats>} A promise that resolves with the player's stats.
     */
    static async getStats(pilot) {
        /** @type {PlayerDbTypes.GetStatsRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @season INT

            SELECT TOP 1
                @season = Season
            FROM tblSeason
            ORDER BY Season DESC

            SELECT COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, d.Damage, d.Deaths DeathsInGamesWithDamage, @season Season
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN (
                SELECT s2.PlayerId, SUM(d.Damage) Damage, SUM(s2.Deaths) Deaths
                FROM vwCompletedChallenge c2
                INNER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON d.ChallengeId = c2.ChallengeId
                INNER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Deaths) Deaths
                    FROM tblStat
                    GROUP BY PlayerId, ChallengeId
                ) s2 ON d.PlayerId = s2.PlayerId AND s2.ChallengeId = c2.ChallengeId
                WHERE c2.Season = @season
                    AND c2.Postseason = 0
                    AND c2.GameType = 'TA'
                GROUP BY s2.PlayerId
            ) d ON p.PlayerId = d.PlayerId
            WHERE p.DiscordId = @discordId
                AND c.Season = @season
                AND c.GameType = 'TA'
            GROUP BY d.Damage, d.Deaths

            SELECT COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, d.Damage, @season Season
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN (
                SELECT d.PlayerId, SUM(d.Damage) Damage
                FROM vwCompletedChallenge c2
                INNER JOIN (
                    SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                    FROM tblDamage
                    WHERE TeamId <> OpponentTeamId
                    GROUP BY PlayerId, ChallengeId
                ) d ON d.ChallengeId = c2.ChallengeId
                WHERE c2.Season = @season
                    AND c2.Postseason = 0
                    AND c2.GameType = 'CTF'
                GROUP BY d.PlayerId
            ) d ON p.PlayerId = d.PlayerId
            WHERE p.DiscordId = @discordId
                AND c.Season = @season
                AND c.GameType = 'CTF'
            GROUP BY d.Damage

            SELECT d.Weapon, SUM(Damage) Damage
            FROM tblDamage d
            INNER JOIN vwCompletedChallenge c ON d.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p on d.PlayerId = p.PlayerId
            WHERE (@season IS NULL OR c.Season = @season)
                AND d.TeamId <> d.OpponentTeamId
                AND p.DiscordId = @discordId
            GROUP BY d.Weapon

            SELECT p.PlayerId, p.Name, t.Tag, @season Season
            FROM tblPlayer p
            LEFT OUTER JOIN (
                tblRoster r
                INNER JOIN tblTeam t ON r.TeamId = t.TeamId
            ) ON p.PlayerId = r.PlayerId
            WHERE p.DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: pilot.id}});
        return data && data.recordsets && data.recordsets.length === 4 && {
            ta: data.recordsets[0].length === 0 ? void 0 : {
                games: data.recordsets[0][0].Games,
                kills: data.recordsets[0][0].Kills,
                assists: data.recordsets[0][0].Assists,
                deaths: data.recordsets[0][0].Deaths,
                damage: data.recordsets[0][0].Damage,
                deathsInGamesWithDamage: data.recordsets[0][0].DeathsInGamesWithDamage
            },
            ctf: data.recordsets[1].length === 0 ? void 0 : {
                games: data.recordsets[1][0].Games,
                captures: data.recordsets[1][0].Captures,
                pickups: data.recordsets[1][0].Pickups,
                carrierKills: data.recordsets[1][0].CarrierKills,
                returns: data.recordsets[1][0].Returns,
                kills: data.recordsets[1][0].Kills,
                assists: data.recordsets[1][0].Assists,
                deaths: data.recordsets[1][0].Deaths,
                damage: data.recordsets[1][0].Damage
            },
            damage: data.recordsets[2].reduce((prev, cur) => {
                prev[cur.Weapon] = cur.Damage;
                return prev;
            }, {}),
            playerId: data.recordsets[3][0].PlayerId,
            name: data.recordsets[3][0].Name,
            tag: data.recordsets[3][0].Tag,
            season: data.recordsets[3][0].Season
        } || void 0;
    }

    //              #    ###    #
    //              #     #
    //  ###   ##   ###    #    ##    # #    ##   ####   ##   ###    ##
    // #  #  # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##
    //  ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##
    // #      ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##
    //  ###
    /**
     * Gets a pilot's time zone.
     * @param {DiscordJs.GuildMember} member The pilot to get the time zone for.
     * @returns {Promise<string>} The pilot's time zone.
     */
    static async getTimezone(member) {
        /** @type {PlayerDbTypes.GetTimezoneRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Timezone FROM tblPlayer WHERE DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Timezone || void 0;
    }

    //              #    ###               #  #     #
    //              #     #                # #      #
    //  ###   ##   ###    #     ##   ###   ##     ###   ###
    // #  #  # ##   #     #    #  #  #  #  ##    #  #  #  #
    //  ##   ##     #     #    #  #  #  #  # #   #  #  # ##
    // #      ##     ##   #     ##   ###   #  #   ###   # #
    //  ###                          #
    /**
     * Gets player stats for the current season.
     * @returns {Promise<PlayerTypes.PlayerKDAStats[]>} A promise that resolves with the stats.
     */
    static async getTopKda() {
        const key = `${settings.redisPrefix}:db:player:getTopKda`;

        /** @type {PlayerTypes.PlayerKDAStats[]} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {PlayerDbTypes.GetTopKdaRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @season INT

            SELECT TOP 1
                @season = Season
            FROM tblSeason
            ORDER BY Season DESC

            SELECT TOP 5
                p.PlayerId,
                p.Name,
                r.TeamId,
                t.Name TeamName,
                t.Tag,
                t.Disbanded,
                t.Locked,
                CAST(SUM(s.Kills) + SUM(s.Assists) AS FLOAT) / CASE WHEN SUM(s.Deaths) = 0 THEN 1 ELSE SUM(s.Deaths) END KDA
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN (
                tblRoster r
                INNER JOIN tblTeam t ON r.TeamId = t.TeamId
            ) ON p.PlayerId = r.PlayerId
            INNER JOIN (
                SELECT s2.PlayerId, CAST(COUNT(s2.StatId) AS FLOAT) / g2.Games PctPlayed
                FROM tblStat s2
                INNER JOIN vwCompletedChallenge c2 ON s2.ChallengeId = c2.ChallengeId
                INNER JOIN (
                    SELECT ROW_NUMBER() OVER(PARTITION BY s3.PlayerId ORDER BY c3.MatchTime) Row, s3.PlayerId, s3.TeamId
                    FROM tblStat s3
                    INNER JOIN vwCompletedChallenge c3 ON s3.ChallengeId = c3.ChallengeId
                    WHERE c3.Season = @season
                        AND c3.Postseason = 0
                        AND c3.GameType = 'TA'
                ) r2 ON s2.PlayerId = r2.PlayerId AND r2.Row = 1
                INNER JOIN (
                    SELECT COUNT(DISTINCT s3.ChallengeId) Games, s3.TeamId
                    FROM tblStat s3
                    INNER JOIN vwCompletedChallenge c3 ON s3.ChallengeId = c3.ChallengeId
                    WHERE c3.Season = @season
                        AND c3.Postseason = 0
                        AND c3.GameType = 'TA'
                    GROUP BY s3.TeamId
                ) g2 ON r2.TeamId = g2.TeamId
                WHERE c2.Season = @season
                GROUP BY s2.PlayerId, g2.Games
            ) g ON p.PlayerId = g.PlayerId
            WHERE c.MatchTime IS NOT NULL
                AND c.Season = @season
                AND c.Postseason = 0
                AND c.GameType = 'TA'
                AND g.PctPlayed >= 0.1
            GROUP BY p.PlayerId, p.Name, r.TeamId, t.Name, t.Tag, t.Disbanded, t.Locked
            ORDER BY CAST(SUM(s.Kills) + SUM(s.Assists) AS FLOAT) / CASE WHEN SUM(s.Deaths) = 0 THEN 1 ELSE SUM(s.Deaths) END DESC

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `);
        cache = data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            playerId: row.PlayerId,
            name: row.Name,
            teamId: row.TeamId,
            teamName: row.TeamName,
            tag: row.Tag,
            disbanded: row.Disbanded,
            locked: row.Locked,
            kda: row.KDA
        })) || [];

        Cache.add(key, cache, data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`].concat(cache.map((player) => `${settings.redisPrefix}:invalidate:player:${player.playerId}:updated`)));

        return cache;
    }

    //              #    ###          #     #          #     #  #
    //              #     #                 #          #     ## #
    //  ###   ##   ###    #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
    // #  #  # ##   #     #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
    //  ##   ##     #     #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
    // #      ##     ##   #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
    //  ###
    /**
     * Gets a pilot's Twitch name.
     * @param {DiscordJs.GuildMember} member The pilot.
     * @returns {Promise<string>} A promise that resolves with the pilot's Twitch name.
     */
    static async getTwitchName(member) {
        /** @type {PlayerDbTypes.GetTwitchNameRecordsets} */
        const data = await db.query(/* sql */`
            SELECT TwitchName FROM tblPlayer WHERE DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].TwitchName || void 0;
    }

    // #                  ###                     ###                #     #             #  ###         ###
    // #                  #  #                     #                       #             #   #           #
    // ###    ###   ###   ###    ##    ##   ###    #    ###   # #   ##    ###    ##    ###   #     ##    #     ##    ###  # #
    // #  #  #  #  ##     #  #  # ##  # ##  #  #   #    #  #  # #    #     #    # ##  #  #   #    #  #   #    # ##  #  #  ####
    // #  #  # ##    ##   #  #  ##    ##    #  #   #    #  #  # #    #     #    ##    #  #   #    #  #   #    ##    # ##  #  #
    // #  #   # #  ###    ###    ##    ##   #  #  ###   #  #   #    ###     ##   ##    ###   #     ##    #     ##    # #  #  #
    /**
     * Checks if a pilot has been invited to a team.
     * @param {DiscordJs.GuildMember} member The pilot to check.
     * @param {Team} team The team to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the pilot has been invited to a team.
     */
    static async hasBeenInvitedToTeam(member, team) {
        /** @type {DbTypes.EmptyRecordsets} */
        const data = await db.query(/* sql */`
            SELECT TOP 1 1
            FROM tblInvite i
            INNER JOIN tblPlayer p ON i.PlayerId = p.PlayerId
            WHERE p.DiscordId = @discordId
                AND i.TeamId = @teamId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });
        return !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    // #                  ###                                   #             #  ###
    // #                  #  #                                  #             #   #
    // ###    ###   ###   #  #   ##    ###  #  #   ##    ###   ###    ##    ###   #     ##    ###  # #
    // #  #  #  #  ##     ###   # ##  #  #  #  #  # ##  ##      #    # ##  #  #   #    # ##  #  #  ####
    // #  #  # ##    ##   # #   ##    #  #  #  #  ##      ##    #    ##    #  #   #    ##    # ##  #  #
    // #  #   # #  ###    #  #   ##    ###   ###   ##   ###      ##   ##    ###   #     ##    # #  #  #
    //                                   #
    /**
     * Checks if a pilot has requested a team.
     * @param {DiscordJs.GuildMember} member The pilot to check.
     * @param {Team} team The team to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the pilot has requested a team.
     */
    static async hasRequestedTeam(member, team) {
        /** @type {DbTypes.EmptyRecordsets} */
        const data = await db.query(/* sql */`
            SELECT TOP 1 1
            FROM tblRequest r
            INNER JOIN tblPlayer p ON r.PlayerId = p.PlayerId
            WHERE p.DiscordId = @discordId
                AND r.TeamId = @teamId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });
        return !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    //   #          #          ###                     ###                #             #  #  #         #     #    ##
    //                          #                      #  #                             #  #  #         #           #
    //   #    ##   ##    ###    #     ##    ###  # #   #  #   ##   ###   ##     ##    ###  #  #  ###   ###   ##     #
    //   #   #  #   #    #  #   #    # ##  #  #  ####  #  #  # ##  #  #   #    # ##  #  #  #  #  #  #   #     #     #
    //   #   #  #   #    #  #   #    ##    # ##  #  #  #  #  ##    #  #   #    ##    #  #  #  #  #  #   #     #     #
    // # #    ##   ###   #  #   #     ##    # #  #  #  ###    ##   #  #  ###    ##    ###   ##   #  #    ##  ###   ###
    //  #
    /**
     * Returns the date and time which the pilot is banned from joining a team.
     * @param {DiscordJs.GuildMember} member The pilot to check.
     * @returns {Promise<Date>} A promise that resolves with the date and time which the pilot is banned from joining a team.  Returns nothing if the pilot is not banned.
     */
    static async joinTeamDeniedUntil(member) {
        /** @type {PlayerDbTypes.JoinTeamDeniedUntilRecordsets} */
        const data = await db.query(/* sql */`
            SELECT jb.DateExpires
            FROM tblJoinBan jb
            INNER JOIN tblPlayer p ON jb.PlayerId = p.PlayerId
            WHERE p.DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateExpires && data.recordsets[0][0].DateExpires > new Date() && data.recordsets[0][0].DateExpires || void 0;
    }

    //                                       #    ###
    //                                       #     #
    // ###    ##    ###  #  #   ##    ###   ###    #     ##    ###  # #
    // #  #  # ##  #  #  #  #  # ##  ##      #     #    # ##  #  #  ####
    // #     ##    #  #  #  #  ##      ##    #     #    ##    # ##  #  #
    // #      ##    ###   ###   ##   ###      ##   #     ##    # #  #  #
    //                #
    /**
     * Submits a request for the pilot to join a team.
     * @param {DiscordJs.GuildMember} member The pilot making the request.
     * @param {Team} team The team to send the request to.
     * @returns {Promise} A promise that resolves when the request has been made.
     */
    static async requestTeam(member, team) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF @playerId IS NULL
            BEGIN
                INSERT INTO tblPlayer (DiscordId, Name)
                VALUES (@discordId, @name)

                SET @playerId = SCOPE_IDENTITY()
            END

            INSERT INTO tblRequest (TeamId, PlayerId)
            VALUES (@teamId, @playerId)
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(64), value: member.displayName},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //               #    #  #
    //               #    ## #
    //  ###    ##   ###   ## #   ###  # #    ##
    // ##     # ##   #    # ##  #  #  ####  # ##
    //   ##   ##     #    # ##  # ##  #  #  ##
    // ###     ##     ##  #  #   # #  #  #   ##
    /**
     * Updates a pilot's name.
     * @param {DiscordJs.GuildMember} member The guild member with their updated name.
     * @returns {Promise} A promise that resolves when the name has been updated.
     */
    static async setName(member) {
        await db.query(/* sql */`
            UPDATE tblPlayer SET Name = @name WHERE DiscordId = @discordId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(64), value: member.displayName}
        });
    }

    //               #     ##    #
    //               #    #  #   #
    //  ###    ##   ###    #    ###   ###    ##    ###  # #    ##   ###
    // ##     # ##   #      #    #    #  #  # ##  #  #  ####  # ##  #  #
    //   ##   ##     #    #  #   #    #     ##    # ##  #  #  ##    #
    // ###     ##     ##   ##     ##  #      ##    # #  #  #   ##   #
    /**
     * Sets the user as a streamer for any of their team's open challenges within a half hour of the challenge start time.
     * @param {DiscordJs.GuildMember} member The guild member to set as a streamer.
     * @returns {Promise} A promise that resolves when the user has been set as a streamer in the appropriate challenges.
     */
    static async setStreamer(member) {
        await db.query(/* sql */`
            MERGE INTO tblChallengeStreamer cs
            USING (
                SELECT c.ChallengeId, p.PlayerId
                FROM tblPlayer p
                INNER JOIN tblRoster r ON p.PlayerId = r.PlayerId
                INNER JOIN tblChallenge c ON c.ChallengingTeamId = r.TeamId OR c.ChallengedTeamId = r.TeamId
                WHERE p.DiscordId = @discordId
                    AND c.DateReported IS NULL
                    AND c.DateConfirmed IS NULL
                    AND c.DateClosed IS NULL
                    AND c.DateVoided IS NULL
                    AND c.MatchTime < DATEADD(minute, 30, GETUTCDATE())
            ) s ON cs.ChallengeId = s.ChallengeId AND cs.PlayerId = s.PlayerId
            WHEN NOT MATCHED THEN
            INSERT (ChallengeId, PlayerId) VALUES (s.ChallengeId, s.PlayerId);
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
    }

    //               #    ###    #
    //               #     #
    //  ###    ##   ###    #    ##    # #    ##   ####   ##   ###    ##
    // ##     # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##
    //   ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##
    // ###     ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##
    /**
     * Sets a pilot's time zone.
     * @param {DiscordJs.GuildMember} member The pilot to set the time zone for.
     * @param {string} timezone The time zone to set.
     * @returns {Promise} A promise that resolves when the time zone is set.
     */
    static async setTimezone(member, timezone) {
        /** @type {PlayerDbTypes.SetTimezoneRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF @playerId IS NULL
            BEGIN
                INSERT INTO tblPlayer (DiscordId, Name)
                VALUES (@discordId, @name)

                SET @playerId = SCOPE_IDENTITY()
            END

            UPDATE tblPlayer SET Timezone = @timezone WHERE PlayerId = @playerId

            SELECT @playerId PlayerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(24), value: member.displayName},
            timezone: {type: Db.VARCHAR(50), value: timezone}
        });

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].PlayerId) {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`, `${settings.redisPrefix}:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate([`${settings.redisPrefix}:invalidate:player:freeagents`]);
        }
    }

    //               #    ###          #     #          #     #  #
    //               #     #                 #          #     ## #
    //  ###    ##   ###    #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
    // ##     # ##   #     #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
    //   ##   ##     #     #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
    // ###     ##     ##   #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
    /**
     * Adds a pilot's Twitch name to their profile.
     * @param {DiscordJs.GuildMember} member The pilot to update.
     * @param {string} name The name of the Twitch channel.
     * @returns {Promise} A promise that resolves when the Twitch name has been added to the profile.
     */
    static async setTwitchName(member, name) {
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF @playerId IS NULL
            BEGIN
                INSERT INTO tblPlayer (DiscordId, Name)
                VALUES (@discordId, @name)

                SET @playerId = SCOPE_IDENTITY()
            END

            UPDATE tblPlayer SET TwitchName = @name WHERE PlayerId = @playerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(64), value: name}
        });
    }

    //                           #    ###          #     #          #     #  #
    //                           #     #                 #          #     ## #
    // #  #  ###    ###    ##   ###    #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
    // #  #  #  #  ##     # ##   #     #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
    // #  #  #  #    ##   ##     #     #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
    //  ###  #  #  ###     ##     ##   #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
    /**
     * Removes a pilot's Twitch name from their profile.
     * @param {DiscordJs.GuildMember} member The pilot to update.
     * @returns {Promise} A promise that resolves when the Twitch name has been removed from the profile.
     */
    static async unsetTwitchName(member) {
        await db.query(/* sql */`
            UPDATE tblPlayer SET TwitchName = NULL WHERE DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
    }

    //                    ###                      #                        ##                #           #           ##         ####                       #               ##     #   ###
    //                    #  #                                             #  #               #                      #  #        #                          #              #  #   # #   #
    // #  #   ###   ###   #  #  ###    ##   # #   ##     ##   #  #   ###   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###   #  #   #     #     ##    ###  # #
    // #  #  #  #  ##     ###   #  #  # ##  # #    #    #  #  #  #  ##     #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #  #  #  ###    #    # ##  #  #  ####
    // ####  # ##    ##   #     #     ##    # #    #    #  #  #  #    ##   #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #     #  #   #     #    ##    # ##  #  #
    // ####   # #  ###    #     #      ##    #    ###    ##    ###  ###     ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #      ##    #     #     ##    # #  #  #
    //                                                                                 #
    /**
     * Gets whether the pilot was a previous captain or founder of a team.
     * @param {DiscordJs.GuildMember} member The pilot to check.
     * @param {Team} team The team to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the pliot was a previous captain or founder of a team.
     */
    static async wasPreviousCaptainOrFounderOfTeam(member, team) {
        /** @type {DbTypes.EmptyRecordsets} */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            SELECT TOP 1 1
            FROM tblCaptainHistory
            WHERE PlayerId = @playerId
                AND TeamId = @teamId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}, teamId: {type: Db.INT, value: team.id}});
        return !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }
}

module.exports = PlayerDb;
