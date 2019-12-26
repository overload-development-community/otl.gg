/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("../..").GameRecord} GameRecord
 * @typedef {import("../models/team")} Team
 * @typedef {{member?: DiscordJs.GuildMember, id: number, name: string, tag: string, isFounder?: boolean, disbanded?: boolean, locked?: boolean}} TeamData
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
        /**
         * @type {{recordsets: [{DateExpires: Date}[]]}}
         */
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
        /**
         * @type {{recordsets: [{}[]]}}
         */
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
        /**
         * @type {{recordsets: [{}[]]}}
         */
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
        /**
         * @type {{recordsets: [{PlayerId: number}[]]}}
         */
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
     * @returns {Promise<{player: {name: string, twitchName: string, timezone: string, teamId: number, tag: string, teamName: string}, career: {season: number, postseason: boolean, teamId: number, tag: string, teamName: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number}[], careerTeams: {teamId: number, tag: string, teamName: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number}[], opponents: {teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestMatchTime: Date, bestMap: string, bestKills: number, bestAssists: number, bestDeaths: number, bestDamage: number}[], maps: {map: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestOpponentTeamId: number, bestOpponentTag: string, bestOpponentTeamName: string, bestMatchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number, bestDamage: number}[], damage: Object<string, number>}>} A promise that resolves with a player's career data.
     */
    static async getCareer(playerId, season, postseason, gameType) {
        const key = `${settings.redisPrefix}:db:player:getCareer:${playerId}:${season === void 0 ? "null" : season}:${!!postseason}:${gameType}`;

        /**
         * @type {{player: {name: string, twitchName: string, timezone: string, teamId: number, tag: string, teamName: string}, career: {season: number, postseason: boolean, teamId: number, tag: string, teamName: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number}[], careerTeams: {teamId: number, tag: string, teamName: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number}[], opponents: {teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestMatchTime: Date, bestMap: string, bestKills: number, bestAssists: number, bestDeaths: number, bestDamage: number}[], maps: {map: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestOpponentTeamId: number, bestOpponentTag: string, bestOpponentTeamName: string, bestMatchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number, bestDamage: number}[], damage: Object<string, number>}}
         */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{Name: string, TwitchName: string, Timezone: string, TeamId: number, Tag: string, TeamName: string}[], {Season: number, Postseason: boolean, TeamId: number, Tag: string, TeamName: string, Games: number, Captures: number, Pickups: number, CarrierKills: number, Returns: number, Kills: number, Assists: number, Deaths: number, Damage: number, OvertimePeriods: number}[], {TeamId: number, Tag: string, TeamName: string, Games: number, Captures: number, Pickups: number, CarrierKills: number, Returns: number, Kills: number, Assists: number, Deaths: number, Damage: number, OvertimePeriods: number}[], {TeamId: number, Tag: string, TeamName: string, Games: number, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number, ChallengeId: number, ChallengingTeamTag: string, ChallengedTeamTag: string, BestMatchTime: Date, BestMap: string, BestKills: number, BestAssists: number, BestDeaths: number, BestDamage: number}[], {Map: string, Games: number, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number, ChallengeId: number, ChallengingTeamTag: string, ChallengedTeamTag: string, BestOpponentTeamId: number, BestOpponentTag: string, BestOpponentTeamName: string, BestMatchTime: Date, BestKills: number, BestAssists: number, BestDeaths: number, BestDamage: number}[], {Weapon: string, Damage: string}[], {DateEnd: Date}[]]}}
         */
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

            SELECT c.Season, c.Postseason, s.TeamId, t.Tag, t.Name TeamName, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, ISNULL(SUM(d.Damage), 0) Damage, SUM(c.OvertimePeriods) OvertimePeriods
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN (
                SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                FROM tblDamage
                WHERE PlayerId = @playerId
                    AND TeamId <> OpponentTeamId
                GROUP BY PlayerId, ChallengeId
            ) d ON c.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
            WHERE s.PlayerId = @playerId
                AND c.GameType = @gameType
            GROUP BY c.Season, c.Postseason, s.TeamId, t.Tag, t.Name
            ORDER BY c.Season, c.Postseason, MIN(c.MatchTime)

            SELECT s.TeamId, t.Tag, t.Name TeamName, COUNT(s.StatId) Games, SUM(s.Captures) Captures, SUM(s.Pickups) Pickups, SUM(s.CarrierKills) CarrierKills, SUM(s.Returns) Returns, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, ISNULL(SUM(d.Damage), 0) Damage, SUM(c.OvertimePeriods) OvertimePeriods
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN (
                SELECT PlayerId, ChallengeId, SUM(Damage) Damage
                FROM tblDamage
                WHERE PlayerId = @playerId
                    AND TeamId <> OpponentTeamId
                GROUP BY PlayerId, ChallengeId
            ) d ON c.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
            WHERE s.PlayerId = @playerId
                AND c.GameType = @gameType
            GROUP BY s.TeamId, t.Tag, t.Name
            ORDER BY t.Name

            SELECT o.TeamId, o.Tag, o.Name TeamName, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods, sb.ChallengeId, sb.ChallengingTeamTag, sb.ChallengedTeamTag, sb.MatchTime BestMatchTime, sb.Map BestMap, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths, sb.Damage BestDamage
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY s.PlayerId, CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END ORDER BY CAST(s.Kills + s.Assists AS FLOAT) / CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END DESC) Row,
                    s.ChallengeId,
                    s.PlayerId,
                    s.TeamId,
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
            GROUP BY o.TeamId, o.Tag, o.Name, sb.ChallengeId, sb.ChallengingTeamTag, sb.ChallengedTeamTag, sb.MatchTime, sb.Map, sb.Kills, sb.Assists, sb.Deaths, sb.Damage
            ORDER BY o.Name

            SELECT c.Map, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods, sb.ChallengeId, sb.ChallengingTeamTag, sb.ChallengedTeamTag, o.TeamId BestOpponentTeamId, o.Tag BestOpponentTag, o.Name BestOpponentTeamName, sb.MatchTime BestMatchTime, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths, sb.Damage BestDamage
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY s.PlayerId, c.Map ORDER BY CAST(s.Kills + s.Assists AS FLOAT) / CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END DESC) Row,
                    s.ChallengeId,
                    s.PlayerId,
                    s.TeamId,
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
            GROUP BY c.Map, o.TeamId, o.Tag, o.Name, sb.ChallengeId, sb.ChallengingTeamTag, sb.ChallengedTeamTag, sb.MatchTime, sb.Kills, sb.Assists, sb.Deaths, sb.Damage
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
            gameType: {type: Db.VARCHAR(3), value: gameType}
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
                overtimePeriods: row.OvertimePeriods
            })),
            opponents: data.recordsets[3].map((row) => ({
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                games: row.Games,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                overtimePeriods: row.OvertimePeriods,
                challengeId: row.ChallengeId,
                challengingTeamTag: row.ChallengingTeamTag,
                challengedTeamTag: row.ChallengedTeamTag,
                bestMatchTime: row.BestMatchTime,
                bestMap: row.BestMap,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths,
                bestDamage: row.BestDamage
            })),
            maps: data.recordsets[4].map((row) => ({
                map: row.Map,
                games: row.Games,
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
        /**
         * @type {{recordsets: [{ChallengeId: number}[]]}}
         */
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
     * @returns {Promise<{playerId: number, name: string, discordId: string, timezone: string}[]>} The list of free agents.
     */
    static async getFreeAgents() {
        const key = `${settings.redisPrefix}:db:player:getFreeAgents`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{PlayerId: number, Name: string, DiscordId: string, Timezone: string}[]]}}
         */
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
     * @returns {Promise<{player: {name: string, teamId: number, tag: string, teamName: string}, matches: {challengeId: number, challengingTeamTag: string, challengedTeamTag: string, teamId: number, tag: string, name: string, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number, opponentTeamId: number, opponentTag: string, opponentName: string, teamScore: number, opponentScore: number, ratingChange: number, teamSize: number, matchTime: Date, map: string, gameType: string}[], seasons: number[]}>} A promise that resolves with a player's game log.
     */
    static async getGameLog(playerId, season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getGameLog:${playerId}:${season === void 0 ? "null" : season}:${!!postseason}`;

        /**
         * @type {{player: {name: string, teamId: number, tag: string, teamName: string}, matches: {challengeId: number, challengingTeamTag: string, challengedTeamTag: string, teamId: number, tag: string, name: string, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number, opponentTeamId: number, opponentTag: string, opponentName: string, teamScore: number, opponentScore: number, ratingChange: number, teamSize: number, matchTime: Date, map: string, gameType: string}[], seasons: number[]}}
         */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{Name: string, TeamId: number, Tag: string, TeamName: string}[], {ChallengeId: number, ChallengingTeamTag: string, ChallengedTeamTag: string, TeamId: number, Tag: string, Name: string, Captures: number, Pickups: number, CarrierKills: number, Returns: number, Kills: number, Assists: number, Deaths: number, Damage: number, OvertimePeriods: number, OpponentTeamId: number, OpponentTag: string, OpponentName: string, TeamScore: number, OpponentScore: number, RatingChange: number, TeamSize: number, MatchTime: Date, Map: string, GameType: string}[], {Season: number}[], {DateEnd: Date}[]]}}
         */
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
            LEFT OUTER JOIN tblDamage d ON c.ChallengeId = d.ChallengeId AND s.PlayerId = d.PlayerId
            WHERE s.PlayerId = @playerId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
                AND (d.TeamId IS NULL OR d.TeamId <> d.OpponentTeamId)
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
     * @returns {Promise<Object<string, GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecordsCTFPlayer(season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getRecords:CTF:player:${season === void 0 ? "null" : season}:${!!postseason}`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{TeamSize: number, Captures: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Pickups: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, CarrierKills: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Returns: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Damage: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, KDA: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
        IF @season IS NULL
        BEGIN
            SELECT @season = MAX(Season) FROM vwCompletedChallenge
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
     * @returns {Promise<Object<string, GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecordsCTFTeam(season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getRecords:CTF:team:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {Object<string, GameRecord[]>} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{TeamSize: number, Score: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Pickups: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, CarrierKills: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Returns: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Damage: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, TeamKDA: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season) FROM vwCompletedChallenge
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
     * @returns {Promise<Object<string, GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecordsTAPlayer(season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getRecords:TA:player:${season === void 0 ? "null" : season}:${!!postseason}`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{TeamSize: number, KDA: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Kills: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Assists: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Deaths: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Damage: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, DamagePerDeath: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season) FROM vwCompletedChallenge
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
     * @returns {Promise<Object<string, GameRecord[]>>} A promise that resolves with the league records.
     */
    static async getRecordsTATeam(season, postseason) {
        const key = `${settings.redisPrefix}:db:player:getRecords:TA:team:${season === void 0 ? "null" : season}:${!!postseason}`;

        /** @type {Object<string, GameRecord[]>} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{TeamSize: number, TeamKDA: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Score: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Assists: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Deaths: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Damage: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, DamagePerDeath: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, ChallengeId: number, MatchTime: Date, Map: string, OvertimePeriods: number}[], {DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season) FROM vwCompletedChallenge
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
     * @returns {Promise<TeamData[]>} A promise that resolves with the list of teams the pilot has requested or is invited to.
     */
    static async getRequestedOrInvitedTeams(member) {
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string}[]]}}
         */
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
     * @param {boolean} [all] Whether to show all players, or just players over 10% games played.
     * @returns {Promise<{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, avgCaptures: number, avgPickups: number, avgCarrierKills: number, avgReturns: number, avgKills: number, avgAssists: number, avgDeaths: number, avgDamagePerGame: number, avgDamagePerDeath: number, kda: number}[]>} A promise that resolves with the stats.
     */
    static async getSeasonStats(season, postseason, gameType, all) {
        const key = `${settings.redisPrefix}:db:player:getSeasonStats:${season === void 0 ? "null" : season}:${gameType}:${!!postseason}:${all ? "all" : "active"}`;
        /**
         * @type {{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, avgCaptures: number, avgPickups: number, avgCarrierKills: number, avgReturns: number, avgKills: number, avgAssists: number, avgDeaths: number, avgDamagePerGame: number, avgDamagePerDeath: number, kda: number}[]}
         */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{PlayerId: number, Name: string, TeamId: number, TeamName: string, Tag: string, Disbanded: boolean, Locked: boolean, AvgCaptures: number, AvgPickups: number, AvgCarrierKills: number, AvgReturns: number, AvgKills: number, AvgAssists: number, AvgDeaths: number, AvgDamagePerGame: number, AvgDamagePerDeath: number, KDA: number}[], {DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT @season = MAX(Season) FROM vwCompletedChallenge
            END

            SELECT
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
                ISNULL(SUM(d.Damage), 0) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgDamagePerGame,
                ISNULL(SUM(d.Damage), 0) / CASE WHEN SUM(s.Deaths) = 0 THEN 1 ELSE SUM(s.Deaths) END AvgDamagePerDeath,
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
                SELECT ChallengeId, PlayerId, SUM(Damage) Damage
                FROM tblDamage
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
            GROUP BY p.PlayerId, p.Name, ls.TeamId, t.Name, t.Tag, t.Disbanded, t.Locked

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason},
            gameType: {type: Db.VARCHAR(3), value: gameType}
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
     * @param {DiscordJs.GuildMember} pilot The pilot to get stats for.
     * @returns {Promise<{playerId: number, name: string, tag: string, games: number, kills: number, assists: number, deaths: number}>} A promise that resolves with the player's stats.
     */
    static async getStats(pilot) {
        /**
         * @type {{recordsets: [{PlayerId: number, Name: string, Tag: string, Games: number, Kills: number, Assists: number, Deaths: number}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @season INT

            SELECT TOP 1
                @season = Season
            FROM tblSeason
            ORDER BY Season DESC

            SELECT p.PlayerId, p.Name, t.Tag, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT OUTER JOIN (
                tblRoster r
                INNER JOIN tblTeam t ON r.TeamId = t.TeamId
            ) ON p.PlayerId = r.PlayerId
            WHERE p.DiscordId = @discordId
                AND c.Season = @season
            GROUP BY p.PlayerId, p.Name, t.Tag
        `, {discordId: {type: Db.VARCHAR(24), value: pilot.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {
            playerId: data.recordsets[0][0].PlayerId,
            name: data.recordsets[0][0].Name,
            tag: data.recordsets[0][0].Tag,
            games: data.recordsets[0][0].Games,
            kills: data.recordsets[0][0].Kills,
            assists: data.recordsets[0][0].Assists,
            deaths: data.recordsets[0][0].Deaths
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
        /**
         * @type {{recordsets: [{Timezone: string}[]]}}
         */
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
     * @returns {Promise<{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, kda: number}[]>} A promise that resolves with the stats.
     */
    static async getTopKda() {
        const key = `${settings.redisPrefix}:db:player:getTopKda`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{PlayerId: number, Name: string, TeamId: number, TeamName: string, Tag: string, Disbanded: boolean, Locked: boolean, KDA: number}[], {DateEnd: Date}[]]}}
         */
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
            LEFT JOIN (
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
                ) r2 ON s2.PlayerId = r2.PlayerId AND r2.Row = 1
                INNER JOIN (
                    SELECT COUNT(DISTINCT s3.ChallengeId) Games, s3.TeamId
                    FROM tblStat s3
                    INNER JOIN vwCompletedChallenge c3 ON s3.ChallengeId = c3.ChallengeId
                    WHERE c3.Season = @season
                    GROUP BY s3.TeamId
                ) g2 ON r2.TeamId = g2.TeamId
                WHERE c2.Season = @season
                GROUP BY s2.PlayerId, g2.Games
            ) g ON p.PlayerId = g.PlayerId
            WHERE c.MatchTime IS NOT NULL
                AND c.Season = @season
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

        Cache.add(key, cache, data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`].concat(cache.map((player) => `${settings.redisPrefix}:invalidate:player:${player.id}:updated`)));

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
        /**
         * @type {{recordsets: [{TwitchName: string}[]]}}
         */
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
        /**
         * @type {{recordsets: [{}[]]}}
         */
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
        /**
         * @type {{recordsets: [{}[]]}}
         */
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
        /**
         * @type {{recordsets: [{DateExpires: Date}[]]}}
         */
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
        /**
         * @type {{recordsets: [{PlayerId: number}[]]}}
         */
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
        /**
         * @type {{recordsets: [{}[]]}}
         */
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
