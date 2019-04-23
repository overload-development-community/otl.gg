/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("../models/team")} Team
 * @typedef {{member?: DiscordJs.GuildMember, id: number, name: string, tag: string, isFounder?: boolean, disbanded?: boolean, locked?: boolean}} TeamData
 */

const Db = require("node-database"),

    settings = require("../../settings"),

    db = new Db(settings.database);

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
     * @returns {Promise<{player: {name: string, twitchName: string, timezone: string, teamId: number, tag: string, teamName: string}, career: {season: number, postseason: boolean, teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number}[], careerTeams: {teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number}[], opponents: {teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, bestMatchTime: Date, bestMap: string, bestKills: number, bestAssists: number, bestDeaths: number}[], maps: {map: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, bestOpponentTeamId: number, bestOpponentTag: string, bestOpponentTeamName: string, bestMatchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number}[], matches: {teamId: number, tag: string, name: string, kills: number, assists: number, deaths: number, overtimePeriods: number, opponentTeamId: number, opponentTag: string, opponentName: string, teamScore: number, opponentScore: number, teamSize: number, matchTime: Date, map: string}[]}>} A promise that resolves with a player's career data.
     */
    static async getCareer(playerId, season, postseason) {
        /**
         * @type {{recordsets: [{Name: string, TwitchName: string, Timezone: string, TeamId: number, Tag: string, TeamName: string}[], {Season: number, Postseason: boolean, TeamId: number, Tag: string, TeamName: string, Games: number, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number}[], {TeamId: number, Tag: string, TeamName: string, Games: number, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number}[], {TeamId: number, Tag: string, TeamName: string, Games: number, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number, BestMatchTime: Date, BestMap: string, BestKills: number, BestAssists: number, BestDeaths: number}[], {Map: string, Games: number, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number, BestOpponentTeamId: number, BestOpponentTag: string, BestOpponentTeamName: string, BestMatchTime: Date, BestKills: number, BestAssists: number, BestDeaths: number}[], {TeamId: number, Tag: string, Name: string, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number, OpponentTeamId: number, OpponentTag: string, OpponentName: string, TeamScore: number, OpponentScore: number, TeamSize: number, MatchTime: Date, Map: string}[]]}}
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

            SELECT c.Season, c.Postseason, s.TeamId, t.Tag, t.Name TeamName, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE s.PlayerId = @playerId
            GROUP BY c.Season, c.Postseason, s.TeamId, t.Tag, t.Name
            ORDER BY c.Season, c.Postseason, MIN(c.MatchTime)

            SELECT s.TeamId, t.Tag, t.Name TeamName, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE s.PlayerId = @playerId
            GROUP BY s.TeamId, t.Tag, t.Name
            ORDER BY t.Name

            SELECT o.TeamId, o.Tag, o.Name TeamName, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods, sb.MatchTime BestMatchTime, sb.Map BestMap, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths
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
                    CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END OpponentTeamId
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
            ) sb ON s.PlayerId = sb.PlayerId AND o.TeamId = sb.OpponentTeamId AND sb.Row = 1
            WHERE s.PlayerId = @playerId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            GROUP BY o.TeamId, o.Tag, o.Name, sb.MatchTime, sb.Map, sb.Kills, sb.Assists, sb.Deaths
            ORDER BY o.Name

            SELECT c.Map, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods, o.TeamId BestOpponentTeamId, o.Tag BestOpponentTag, o.Name BestOpponentTeamName, sb.MatchTime BestMatchTime, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths
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
                    CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END OpponentTeamId
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
            ) sb ON s.PlayerId = sb.PlayerId AND c.Map = sb.Map AND sb.Row = 1
            INNER JOIN tblTeam o ON sb.OpponentTeamId = o.TeamId
            WHERE s.PlayerId = @playerId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            GROUP BY c.Map, o.TeamId, o.Tag, o.Name, sb.MatchTime, sb.Kills, sb.Assists, sb.Deaths
            ORDER BY c.Map

            SELECT t.TeamId, t.Tag, t.Name, s.Kills, s.Assists, s.Deaths, c.OvertimePeriods, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentName, CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END TeamScore, CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamScore ELSE c.ChallengingTeamScore END OpponentScore, c.TeamSize, c.MatchTime, c.Map
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE PlayerId = @playerId
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            ORDER BY c.MatchTime
        `, {
            playerId: {type: Db.INT, value: playerId},
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        return data && data.recordsets && data.recordsets.length === 6 && data.recordsets[0].length > 0 && {
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
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                overtimePeriods: row.OvertimePeriods
            })),
            careerTeams: data.recordsets[2].map((row) => ({
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                games: row.Games,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
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
                bestMatchTime: row.BestMatchTime,
                bestMap: row.BestMap,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths
            })),
            maps: data.recordsets[4].map((row) => ({
                map: row.Map,
                games: row.Games,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                overtimePeriods: row.OvertimePeriods,
                bestMatchTime: row.BestMatchTime,
                bestOpponentTeamId: row.BestOpponentTeamId,
                bestOpponentTag: row.BestOpponentTag,
                bestOpponentTeamName: row.BestOpponentTeamName,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths
            })),
            matches: data.recordsets[5].map((row) => ({
                teamId: row.TeamId,
                tag: row.Tag,
                name: row.Name,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                overtimePeriods: row.OvertimePeriods,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentName: row.OpponentName,
                teamScore: row.TeamScore,
                opponentScore: row.OpponentScore,
                teamSize: row.TeamSize,
                matchTime: row.MatchTime,
                map: row.Map
            }))
        } || void 0;
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
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({playerId: row.PlayerId, name: row.Name, discordId: row.DiscordId, timezone: row.Timezone})) || [];
    }

    //              #    ###                              #
    //              #    #  #                             #
    //  ###   ##   ###   #  #   ##    ##    ##   ###    ###   ###
    // #  #  # ##   #    ###   # ##  #     #  #  #  #  #  #  ##
    //  ##   ##     #    # #   ##    #     #  #  #     #  #    ##
    // #      ##     ##  #  #   ##    ##    ##   #      ###  ###
    //  ###
    /**
     * Gets the league records.
     * @param {number} season The season to get the records for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<{teamKda: {teamSize: number, teamKda: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, matchTime: Date, map: string, overtimePeriods: number}[], teamScore: {teamSize: number, score: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, matchTime: Date, map: string, overtimePeriods: number}[], teamAssists: {teamSize: number, assists: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, matchTime: Date, map: string, overtimePeriods: number}[], teamDeaths: {teamSize: number, deaths: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, matchTime: Date, map: string, overtimePeriods: number}[], kda: {teamSize: number, kda: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, matchTime: Date, map: string, overtimePeriods: number}[], kills: {teamSize: number, kills: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, matchTime: Date, map: string, overtimePeriods: number}[], assists: {teamSize: number, assists: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, matchTime: Date, map: string, overtimePeriods: number}[], deaths: {teamSize: number, deaths: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, matchTime: Date, map: string, overtimePeriods: number}[]}>} A promise that resolves with the league records.
     */
    static async getRecords(season, postseason) {
        /**
         * @type {{recordsets: [{TeamSize: number, TeamKDA: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Score: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Assists: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Deaths: number, TeamId: number, Tag: string, TeamName: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, KDA: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Kills: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Assists: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, MatchTime: Date, Map: string, OvertimePeriods: number}[], {TeamSize: number, Deaths: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, OpponentTeamId: number, OpponentTag: string, OpponentTeamName: string, MatchTime: Date, Map: string, OvertimePeriods: number}[]]}}
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

            SELECT s.TeamSize, s.TeamKDA, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.MatchTime, c.Map, c.OvertimePeriods
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
                GROUP BY c.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE s.Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Score, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.MatchTime, c.Map, c.OvertimePeriods
            FROM (
                SELECT RANK() OVER (PARTITION BY c.TeamSize ORDER BY CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END DESC) Rank,
                    c.TeamSize,
                    c.ChallengeId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END TeamId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END Score
                FROM vwCompletedChallenge c
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
                GROUP BY c.TeamSize, c.ChallengeId,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamId ELSE c.ChallengedTeamId END,
                    CASE WHEN c.ChallengingTeamScore > c.ChallengedTeamScore THEN c.ChallengingTeamScore ELSE c.ChallengedTeamScore END
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Assists, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.MatchTime, c.Map, c.OvertimePeriods
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
                GROUP BY s.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Deaths, t.TeamId, t.Tag, t.Name TeamName, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.MatchTime, c.Map, c.OvertimePeriods
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
                GROUP BY s.ChallengeId, c.TeamSize, s.TeamId
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.KDA, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.MatchTime, c.Map, c.OvertimePeriods
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
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Kills, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.MatchTime, c.Map, c.OvertimePeriods
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
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Assists, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.MatchTime, c.Map, c.OvertimePeriods
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
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime

            SELECT s.TeamSize, s.Deaths, t.TeamId, t.Tag, t.Name TeamName, p.PlayerId, p.Name, o.TeamId OpponentTeamId, o.Tag OpponentTag, o.Name OpponentTeamName, c.MatchTime, c.Map, c.OvertimePeriods
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
            ) s
            INNER JOIN tblChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON s.TeamId = t.TeamId
            INNER JOIN tblTeam o ON CASE WHEN c.ChallengingTeamId = s.TeamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END = o.TeamId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE Rank = 1
            ORDER BY c.TeamSize, c.MatchTime
        `, {
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        return data && data.recordsets && data.recordsets.length === 8 && {
            teamKda: data.recordsets[0].map((row) => ({
                teamSize: row.TeamSize,
                teamId: row.TeamId,
                teamKda: row.TeamKDA,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamScore: data.recordsets[1].map((row) => ({
                teamSize: row.TeamSize,
                score: row.Score,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamAssists: data.recordsets[2].map((row) => ({
                teamSize: row.TeamSize,
                assists: row.Assists,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            teamDeaths: data.recordsets[3].map((row) => ({
                teamSize: row.TeamSize,
                deaths: row.Deaths,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            kda: data.recordsets[4].map((row) => ({
                teamSize: row.TeamSize,
                kda: row.KDA,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            kills: data.recordsets[5].map((row) => ({
                teamSize: row.TeamSize,
                kills: row.Kills,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            assists: data.recordsets[6].map((row) => ({
                teamSize: row.TeamSize,
                assists: row.Assists,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            })),
            deaths: data.recordsets[7].map((row) => ({
                teamSize: row.TeamSize,
                deaths: row.Deaths,
                teamId: row.TeamId,
                tag: row.Tag,
                teamName: row.TeamName,
                playerId: row.PlayerId,
                name: row.Name,
                opponentTeamId: row.OpponentTeamId,
                opponentTag: row.OpponentTag,
                opponentTeamName: row.OpponentTeamName,
                matchTime: row.MatchTime,
                map: row.Map,
                overtimePeriods: row.OvertimePeriods
            }))
        } || void 0;
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
     * @returns {Promise<{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, avgKills: number, avgAssists: number, avgDeaths: number, kda: number}[]>} A promise that resolves with the stats.
     */
    static async getSeasonStats(season, postseason) {
        /**
         * @type {{recordsets: [{PlayerId: number, Name: string, TeamId: number, TeamName: string, Tag: string, Disbanded: boolean, Locked: boolean, AvgKills: number, AvgAssists: number, AvgDeaths: number, KDA: number}[]]}}
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
                p.PlayerId,
                p.Name,
                r.TeamId,
                t.Name TeamName,
                t.Tag,
                t.Disbanded,
                t.Locked,
                SUM(s.Kills) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgKills,
                SUM(s.Assists) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgAssists,
                SUM(s.Deaths) / (COUNT(c.ChallengeId) + 0.15 * SUM(c.OvertimePeriods)) AvgDeaths,
                CAST(SUM(s.Kills) + SUM(s.Assists) AS FLOAT) / CASE WHEN SUM(s.Deaths) = 0 THEN 1 ELSE SUM(s.Deaths) END KDA
            FROM tblStat s
            INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            LEFT JOIN (
                tblRoster r
                INNER JOIN tblTeam t ON r.TeamId = t.TeamId
            ) ON p.PlayerId = r.PlayerId
            WHERE c.MatchTime IS NOT NULL
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            GROUP BY p.PlayerId, p.Name, r.TeamId, t.Name, t.Tag, t.Disbanded, t.Locked
        `, {
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            playerId: row.PlayerId,
            name: row.Name,
            teamId: row.TeamId,
            teamName: row.TeamName,
            tag: row.Tag,
            disbanded: row.Disbanded,
            locked: row.Locked,
            avgKills: row.AvgKills,
            avgAssists: row.AvgAssists,
            avgDeaths: row.AvgDeaths,
            kda: row.KDA
        })) || [];
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
        /**
         * @type {{recordsets: [{PlayerId: number, Name: string, TeamId: number, TeamName: string, Tag: string, Disbanded: boolean, Locked: boolean, KDA: number}[]]}}
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
            WHERE c.MatchTime IS NOT NULL
                AND c.Season = @season
            GROUP BY p.PlayerId, p.Name, r.TeamId, t.Name, t.Tag, t.Disbanded, t.Locked
            ORDER BY CAST(SUM(s.Kills) + SUM(s.Assists) AS FLOAT) / CASE WHEN SUM(s.Deaths) = 0 THEN 1 ELSE SUM(s.Deaths) END DESC
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            playerId: row.PlayerId,
            name: row.Name,
            teamId: row.TeamId,
            teamName: row.TeamName,
            tag: row.Tag,
            disbanded: row.Disbanded,
            locked: row.Locked,
            kda: row.KDA
        })) || [];
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
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF @playerId IS NULL
            BEGIN
                INSERT INTO tblPlayer (DiscordId, Name)
                VALUES (@discordId, @name)

                SET @playerId = SCOPE_IDENTITY()
            END

            UPDATE tblPlayer SET Timezone = @timezone WHERE PlayerId = @playerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(24), value: member.displayName},
            timezone: {type: Db.VARCHAR(50), value: timezone}
        });
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
