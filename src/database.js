/**
 * @typedef {import("./models/team")} Team
 */

const Db = require("node-database"),

    settings = require("../settings"),

    db = new Db(settings.database);

//  ####           #            #
//   #  #          #            #
//   #  #   ###   ####    ###   # ##    ###    ###    ###
//   #  #      #   #         #  ##  #      #  #      #   #
//   #  #   ####   #      ####  #   #   ####   ###   #####
//   #  #  #   #   #  #  #   #  ##  #  #   #      #  #
//  ####    ####    ##    ####  # ##    ####  ####    ###
/**
* Defines the database class.
*/
class Database {
    //   #                      ##                      #
    //  # #                    #  #                     #
    //  #    ###    ##    ##   #  #   ###   ##   ###   ###    ###
    // ###   #  #  # ##  # ##  ####  #  #  # ##  #  #   #    ##
    //  #    #     ##    ##    #  #   ##   ##    #  #   #      ##
    //  #    #      ##    ##   #  #  #      ##   #  #    ##  ###
    //                                ###
    /**
     * Gets the current list of free agents.
     * @returns {Promise<{playerId: number, name: string, discordId: string, timezone: string}[]>} The list of free agents.
     */
    static async freeAgents() {
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

    //              #    ###                     ###          #
    //              #     #                      #  #         #
    //  ###   ##   ###    #     ##    ###  # #   #  #   ###  ###    ###
    // #  #  # ##   #     #    # ##  #  #  ####  #  #  #  #   #    #  #
    //  ##   ##     #     #    ##    # ##  #  #  #  #  # ##   #    # ##
    // #      ##     ##   #     ##    # #  #  #  ###    # #    ##   # #
    //  ###
    /**
     * Gets data for the team.
     * @param {Team} team The team to get the data for.
     * @param {number} season The season to get the team's data for, 0 for all time.
     * @param {boolean} postseason Whether to get postseason records.
     * @returns {Promise<{records: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, winsMap1: number, lossesMap1: number, tiesMap1: number, winsMap2: number, lossesMap2: number, tiesMap2: number, winsMap3: number, lossesMap3: number, tiesMap3: number, winsServer1: number, lossesServer1: number, tiesServer1: number, winsServer2: number, lossesServer2: number, tiesServer2: number, winsServer3: number, lossesServer3: number, tiesServer3: number, wins2v2: number, losses2v2: number, ties2v2: number, wins3v3: number, losses3v3: number, ties3v3: number, wins4v4: number, losses4v4: number, ties4v4: number}, opponents: {teamId: number, name: string, tag: string, wins: number, losses: number, ties: number}[], maps: {map: string, wins: number, losses: number, ties: number}[], matches: {challengingTeamId: number, challengingTeamName: string, challengingTeamTag: string, challengingTeamScore: number, challengedTeamId: number, challengedTeamName: string, challengedTeamTag: string, challengedTeamScore: number, map: string, matchTime: Date, statTeamId: number, statTeamName: string, statTeamTag: string, playerId: number, name: string, kills: number, deaths: number, assists: number}[], stats: {playerId: number, name: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, teamId: number, teamName: string, teamTag: string, map: string, matchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number}[]}>} The team data.
     */
    static async getTeamData(team, season, postseason) {
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number, WinsMap1: number, LossesMap1: number, TiesMap1: number, WinsMap2: number, LossesMap2: number, TiesMap2: number, WinsMap3: number, LossesMap3: number, TiesMap3: number, WinsServer1: number, LossesServer1: number, TiesServer1: number, WinsServer2: number, LossesServer2: number, TiesServer2: number, WinsServer3: number, LossesServer3: number, TiesServer3: number, Wins2v2: number, Losses2v2: number, Ties2v2: number, Wins3v3: number, Losses3v3: number, Ties3v3: number, Wins4v4: number, Losses4v4: number, Ties4v4: number}[], {TeamId: number, Name: string, Tag: string, Wins: number, Losses: number, Ties: number}[], {Map: string, Wins: number, Losses: number, Ties: number}[], {ChallengingTeamId: number, ChallengingTeamName: string, ChallengingTeamTag: string, ChallengingTeamScore: number, ChallengedTeamId: number, ChallengedTeamName: string, ChallengedTeamTag: string, ChallengedTeamScore: number, Map: string, MatchTime: Date, StatTeamId: number, StatTeamName: string, StatTeamTag: string, PlayerId: number, Name: string, Kills: number, Deaths: number, Assists: number}[], {PlayerId: number, Name: string, Games: number, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number, TeamId: number, TeamName: string, TeamTag: string, Map: string, MatchTime: Date, BestKills: number, BestAssists: number, BestDeaths: number}[]]}}
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
                TeamId, Name, Tag, Disbanded, Locked,
                CASE WHEN Wins + Losses + Ties >= 10 THEN Rating WHEN Wins + Losses + Ties = 0 THEN NULL ELSE (Wins + Losses + Ties) * Rating / 10 END Rating,
                Wins, Losses, Ties, WinsMap1, LossesMap1, TiesMap1, WinsMap2, LossesMap2, TiesMap2, WinsMap3, LossesMap3, TiesMap3, WinsServer1, LossesServer1, TiesServer1, WinsServer2, LossesServer2, TiesServer2, WinsServer3, LossesServer3, TiesServer3, Wins2v2, Losses2v2, Ties2v2, Wins3v3, Losses3v3, Ties3v3, Wins4v4, Losses4v4, Ties4v4
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
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsMap1,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesMap1,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId = t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesMap1,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsMap2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesMap2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 1 AND c.HomeMapTeamId <> t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesMap2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsMap3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesMap3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeMapTeam = 0 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesMap3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsServer1,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesServer1,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId = t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesServer1,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsServer2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesServer2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId <> t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesServer2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) WinsServer3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) LossesServer3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.UsingHomeServerTeam = 0 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) TiesServer3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins2v2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses2v2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 2 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties2v2,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins3v3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses3v3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 3 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties3v3,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins4v4,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses4v4,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE (@season = 0 OR c.Season = @season) AND c.Postseason = @postseason AND c.TeamSize = 4 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties4v4
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
                SUM(CASE WHEN c.ChallengingTeamScore = c.ChallengedTeamScore THEN 1 ELSE 0 END) Ties
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
                SUM(CASE WHEN ChallengingTeamScore = ChallengedTeamScore THEN 1 ELSE 0 END) Ties
            FROM vwCompletedChallenge
            WHERE (ChallengingTeamId = @teamId OR ChallengedTeamId = @teamId)
                AND (@season = 0 OR Season = @season)
                AND Postseason = @postseason
            GROUP BY Map
            ORDER BY Map

            SELECT
                c.ChallengingTeamId,
                tc1.Name ChallengingTeamName,
                tc1.Tag ChallengingTeamTag,
                c.ChallengingTeamScore,
                c.ChallengedTeamId,
                tc2.Name ChallengedTeamName,
                tc2.Tag ChallengedTeamTag,
                c.ChallengedTeamScore,
                c.Map,
                c.MatchTime,
                s.TeamId StatTeamId,
                tc3.Name StatTeamName,
                tc3.Tag StatTeamTag,
                s.PlayerId,
                p.Name,
                s.Kills,
                s.Deaths,
                s.Assists
            FROM vwCompletedChallenge c
            INNER JOIN tblTeam tc1 ON c.ChallengingTeamId = tc1.TeamId
            INNER JOIN tblTeam tc2 ON c.ChallengedTeamId = tc2.TeamId
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
            INNER JOIN tblTeam tc3 ON s.TeamId = tc3.TeamId
            WHERE (c.ChallengingTeamId = @teamId OR c.ChallengedTeamId = @teamId)
                AND (@season = 0 OR c.Season = @season)
                AND c.Postseason = @postseason
            ORDER BY c.MatchTime

            SELECT s.PlayerId, p.Name, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods, t.TeamId, t.Name TeamName, t.Tag TeamTag, c.Map, c.MatchTime, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths
            FROM tblStat s
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            INNER JOIN vwCompletedChallenge cc ON s.ChallengeId = cc.ChallengeId
            INNER JOIN (
                SELECT
                    ROW_NUMBER() OVER (PARTITION BY s.PlayerId, s.TeamId ORDER BY CAST(s.Kills + s.Assists AS FLOAT) / CASE WHEN s.Deaths < 1 THEN 1 ELSE s.Deaths END DESC) Row,
                    s.ChallengeId,
                    s.PlayerId,
                    s.TeamId,
                    s.Kills,
                    s.Assists,
                    s.Deaths
                FROM tblStat s
                INNER JOIN vwCompletedChallenge c ON s.ChallengeId = c.ChallengeId
                WHERE (@season = 0 OR c.Season = @season)
                    AND c.Postseason = @postseason
            ) sb ON s.PlayerId = sb.PlayerId AND sb.TeamId = @teamId AND sb.Row = 1
            INNER JOIN tblChallenge c ON sb.ChallengeId = c.ChallengeId
            INNER JOIN tblTeam t ON (CASE WHEN c.ChallengingTeamId = @teamId THEN c.ChallengedTeamId ELSE c.ChallengingTeamId END) = t.TeamId
            WHERE s.TeamId = @teamId
            GROUP BY s.PlayerId, p.Name, t.TeamId, t.Tag, t.Name, c.Map, c.MatchTime, sb.Kills, sb.Deaths, sb.Assists
            ORDER BY p.Name
        `, {
            teamId: {type: Db.INT, value: team.id},
            season: {type: Db.INT, value: season},
            postseason: {type: Db.BIT, value: postseason}
        });
        return data && data.recordsets && data.recordsets.length === 5 && {
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
                winsMap1: data.recordsets[0][0].WinsMap1,
                lossesMap1: data.recordsets[0][0].LossesMap1,
                tiesMap1: data.recordsets[0][0].TiesMap1,
                winsMap2: data.recordsets[0][0].WinsMap2,
                lossesMap2: data.recordsets[0][0].LossesMap2,
                tiesMap2: data.recordsets[0][0].TiesMap2,
                winsMap3: data.recordsets[0][0].WinsMap3,
                lossesMap3: data.recordsets[0][0].LossesMap3,
                tiesMap3: data.recordsets[0][0].TiesMap3,
                winsServer1: data.recordsets[0][0].WinsServer1,
                lossesServer1: data.recordsets[0][0].LossesServer1,
                tiesServer1: data.recordsets[0][0].TiesServer1,
                winsServer2: data.recordsets[0][0].WinsServer2,
                lossesServer2: data.recordsets[0][0].LossesServer2,
                tiesServer2: data.recordsets[0][0].TiesServer2,
                winsServer3: data.recordsets[0][0].WinsServer3,
                lossesServer3: data.recordsets[0][0].LossesServer3,
                tiesServer3: data.recordsets[0][0].TiesServer3,
                wins2v2: data.recordsets[0][0].Wins2v2,
                losses2v2: data.recordsets[0][0].Losses2v2,
                ties2v2: data.recordsets[0][0].Ties2v2,
                wins3v3: data.recordsets[0][0].Wins3v3,
                losses3v3: data.recordsets[0][0].Losses3v3,
                ties3v3: data.recordsets[0][0].Ties3v3,
                wins4v4: data.recordsets[0][0].Wins4v4,
                losses4v4: data.recordsets[0][0].Losses4v4,
                ties4v4: data.recordsets[0][0].Ties4v4
            } || void 0,
            opponents: data.recordsets[1].map((row) => ({
                teamId: row.TeamId,
                name: row.Name,
                tag: row.Tag,
                wins: row.Wins,
                losses: row.Losses,
                ties: row.Ties
            })),
            maps: data.recordsets[2].map((row) => ({
                map: row.Map,
                wins: row.Wins,
                losses: row.Losses,
                ties: row.Ties
            })),
            matches: data.recordsets[3].map((row) => ({
                challengingTeamId: row.ChallengingTeamId,
                challengingTeamName: row.ChallengingTeamName,
                challengingTeamTag: row.ChallengingTeamTag,
                challengingTeamScore: row.ChallengingTeamScore,
                challengedTeamId: row.ChallengedTeamId,
                challengedTeamName: row.ChallengedTeamName,
                challengedTeamTag: row.ChallengedTeamTag,
                challengedTeamScore: row.ChallengedTeamScore,
                map: row.Map,
                matchTime: row.MatchTime,
                statTeamId: row.StatTeamId,
                statTeamName: row.StatTeamName,
                statTeamTag: row.StatTeamTag,
                playerId: row.PlayerId,
                name: row.Name,
                kills: row.Kills,
                deaths: row.Deaths,
                assists: row.Assists
            })),
            stats: data.recordsets[4].map((row) => ({
                playerId: row.PlayerId,
                name: row.Name,
                games: row.Games,
                kills: row.Kills,
                assists: row.Assists,
                deaths: row.Deaths,
                overtimePeriods: row.OvertimePeriods,
                teamId: row.TeamId,
                teamName: row.TeamName,
                teamTag: row.TeamTag,
                map: row.Map,
                matchTime: row.MatchTime,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths
            }))
        } || {records: void 0, opponents: void 0, maps: void 0, matches: void 0, stats: void 0};
    }

    //       ##                         #  #  #                     ####               ##
    //        #                         #  ####                     #                 #  #
    // ###    #     ###  #  #   ##    ###  ####   ###  ###    ###   ###    ##   ###    #     ##    ###   ###    ##   ###
    // #  #   #    #  #  #  #  # ##  #  #  #  #  #  #  #  #  ##     #     #  #  #  #    #   # ##  #  #  ##     #  #  #  #
    // #  #   #    # ##   # #  ##    #  #  #  #  # ##  #  #    ##   #     #  #  #     #  #  ##    # ##    ##   #  #  #  #
    // ###   ###    # #    #    ##    ###  #  #   # #  ###   ###    #      ##   #      ##    ##    # #  ###     ##   #  #
    // #                  #                            #
    /**
     * Gets played maps for the season.
     * @param {number} [season] The season number, or void for the latest season.
     * @returns {Promise<string[]>} The list of maps played in a season.
     */
    static async playedMapsForSeason(season) {
        /**
         * @type {{recordsets: [{Map: string}[]]}}
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

            SELECT DISTINCT Map
            FROM vwCompletedChallenge
            WHERE MatchTime IS NOT NULL
                AND Season = @season
            ORDER BY Map
        `, {season: {type: Db.INT, value: season}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || void 0;
    }

    //       ##                             ##                                   ##    #           #
    //        #                            #  #                                 #  #   #           #
    // ###    #     ###  #  #   ##   ###    #     ##    ###   ###    ##   ###    #    ###    ###  ###    ###
    // #  #   #    #  #  #  #  # ##  #  #    #   # ##  #  #  ##     #  #  #  #    #    #    #  #   #    ##
    // #  #   #    # ##   # #  ##    #     #  #  ##    # ##    ##   #  #  #  #  #  #   #    # ##   #      ##
    // ###   ###    # #    #    ##   #      ##    ##    # #  ###     ##   #  #   ##     ##   # #    ##  ###
    // #                  #
    /**
     * Gets player stats for the specified season.
     * @param {number} [season] The season number, or void for the latest season.
     * @param {boolean} postseason Whether to get stats for the postseason.
     * @returns {Promise<{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, avgKills: number, avgAssists: number, avgDeaths: number, kda: number}[]>} A promise that resolves with the stats.
     */
    static async playerSeasonStats(season, postseason) {
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

    //       ##                             ##                                  ###               #  #     #         ##    #           #
    //        #                            #  #                                  #                # #      #        #  #   #           #
    // ###    #     ###  #  #   ##   ###    #     ##    ###   ###    ##   ###    #     ##   ###   ##     ###   ###   #    ###    ###  ###    ###
    // #  #   #    #  #  #  #  # ##  #  #    #   # ##  #  #  ##     #  #  #  #   #    #  #  #  #  ##    #  #  #  #    #    #    #  #   #    ##
    // #  #   #    # ##   # #  ##    #     #  #  ##    # ##    ##   #  #  #  #   #    #  #  #  #  # #   #  #  # ##  #  #   #    # ##   #      ##
    // ###   ###    # #    #    ##   #      ##    ##    # #  ###     ##   #  #   #     ##   ###   #  #   ###   # #   ##     ##   # #    ##  ###
    // #                  #                                                                 #
    /**
     * Gets player top KDA stats for the current season.
     * @returns {Promise<{playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, kda: number}[]>} A promise that resolves with the stats.
     */
    static async playerSeasonTopKdaStats() {
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

    //                                       #      #            #
    //                                       #                   #
    //  ###    ##    ###   ###    ##   ###   #     ##     ###   ###
    // ##     # ##  #  #  ##     #  #  #  #  #      #    ##      #
    //   ##   ##    # ##    ##   #  #  #  #  #      #      ##    #
    // ###     ##    # #  ###     ##   #  #  ####  ###   ###      ##
    /**
     * Gets the list of seasons.
     * @returns {Promise<number[]>} A promise that resolves with the list of available seasons.
     */
    static async seasonList() {
        /**
         * @type {{recordsets: [{Season: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Season FROM tblSeason ORDER BY Season
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Season) || [];
    }

    //                                        ##    #                   #   #
    //                                       #  #   #                   #
    //  ###    ##    ###   ###    ##   ###    #    ###    ###  ###    ###  ##    ###    ###   ###
    // ##     # ##  #  #  ##     #  #  #  #    #    #    #  #  #  #  #  #   #    #  #  #  #  ##
    //   ##   ##    # ##    ##   #  #  #  #  #  #   #    # ##  #  #  #  #   #    #  #   ##     ##
    // ###     ##    # #  ###     ##   #  #   ##     ##   # #  #  #   ###  ###   #  #  #     ###
    //                                                                                  ###
    /**
     * Gets the season standings for the specified season.
     * @param {number} [season] The season number, or void for the latest season.
     * @param {string} [records] The type of record split to retrieve.
     * @param {string} [map] The map record to retrieve.
     * @returns {Promise<{teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, wins1: number, losses1: number, ties1: number, wins2: number, losses2: number, ties2: number, wins3: number, losses3: number, ties3: number, winsMap: number, lossesMap: number, tiesMap: number}[]>} A promise that resolves with the season standings.
     */
    static async seasonStandings(season, records, map) {
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number, Wins1: number, Losses1: number, Ties1: number, Wins2: number, Losses2: number, Ties2: number, Wins3: number, Losses3: number, Ties3: number, WinsMap?: number, LossesMap?: number, TiesMap?: number}[]]}}
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
                TeamId, Name, Tag, Disbanded, Locked,
                CASE WHEN Wins + Losses + Ties >= 10 THEN Rating WHEN Wins + Losses + Ties = 0 THEN NULL ELSE (Wins + Losses + Ties) * Rating / 10 END Rating,
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
                    ${records === "Server Records" ? /* sql */`
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId = t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId = t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId <> t.TeamId AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 1 AND c.HomeServerTeamId <> t.TeamId AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 0 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.UsingHomeServerTeam = 0 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties3
                    ` : records === "Team Size Records" ? /* sql */`
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 2 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 2 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties1,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 3 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 3 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties2,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 4 AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses3,
                        (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND c.TeamSize = 4 AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties3
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
            ORDER BY Rating DESC, Wins DESC, Losses ASC, Name ASC
        `, {
            season: {type: Db.INT, value: season},
            map: {type: Db.VARCHAR(100), value: map}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({teamId: row.TeamId, name: row.Name, tag: row.Tag, disbanded: row.Disbanded, locked: row.Locked, rating: row.Rating, wins: row.Wins, losses: row.Losses, ties: row.Ties, wins1: row.Wins1, losses1: row.Losses1, ties1: row.Ties1, wins2: row.Wins2, losses2: row.Losses2, ties2: row.Ties2, wins3: row.Wins3, losses3: row.Losses3, ties3: row.Ties3, winsMap: row.WinsMap || 0, lossesMap: row.LossesMap || 0, tiesMap: row.TiesMap || 0})) || [];
    }

    //                                #                #  #         #          #
    //                                                 ####         #          #
    // #  #  ###    ##    ##   # #   ##    ###    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  #  #  #     #  #  ####   #    #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    // #  #  #  #  #     #  #  #  #   #    #  #   ##   #  #  # ##   #    #     #  #  ##      ##
    //  ###  ###    ##    ##   #  #  ###   #  #  #     #  #   # #    ##   ##   #  #   ##   ###
    //       #                                    ###
    /**
     * Gets the upcoming matches.
     * @returns {Promise<{challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number}[]>} A promise that resolves with the upcoming matches.
     */
    static async upcomingMatches() {
        /**
         * @type {{recordsets: [{ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, MatchTime: Date, Map: string, DateClosed: Date, OvertimePeriods: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT
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
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            challengingTeamId: row.ChallengingTeamId,
            challengedTeamId: row.ChallengedTeamId,
            challengingTeamScore: row.ChallengingTeamScore,
            challengedTeamScore: row.ChallengedTeamScore,
            matchTime: row.MatchTime,
            map: row.Map,
            dateClosed: row.DateClosed,
            overtimePeriods: row.OvertimePeriods
        })) || [];
    }
}

module.exports = Database;
