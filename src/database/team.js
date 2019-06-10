/**
 * @typedef {import("../models/challenge")} Challenge
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("../models/newTeam")} NewTeam
 * @typedef {import("../models/team")} Team
 * @typedef {{member?: DiscordJs.GuildMember, id: number, name: string, tag: string, isFounder?: boolean, disbanded?: boolean, locked?: boolean}} TeamData
 * @typedef {{homes: string[], members: {playerId: number, name: string, role: string}[], requests: {name: string, date: Date}[], invites: {name: string, date: Date}[], penaltiesRemaining: number}} TeamInfo
 */

const Cache = require("../cache"),
    Db = require("node-database"),
    db = require("./index");

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
        /**
         * @type {{recordsets: [{PlayerId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            INSERT INTO tblRoster (TeamId, PlayerId) VALUES (@teamId, @playerId)
            DELETE FROM tblRequest WHERE PlayerId = @playerId
            DELETE FROM tblInvite WHERE PlayerId = @playerId
            DELETE FROM tblJoinBan WHERE PlayerId = @playerId
            INSERT INTO tblJoinBan (PlayerId) VALUES (@playerId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND PlayerId = @playerId

            SELECT @playerId PlayerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });

        if (data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].PlayerId) {
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents", `otl.gg:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents"]);
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
     * @returns {Promise<TeamData>} A promise that resolves with the created team.
     */
    static async create(newTeam) {
        /**
         * @type {{recordsets: [{TeamId: number, PlayerId: number}[]]}}
         */
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
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents", `otl.gg:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents"]);
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
        /**
         * @type {{recordsets: [{ChallengeId: number}[], {PlayerId: number}[]]}}
         */
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

            DELETE FROM tblRoster WHERE TeamId = @teamId
            DELETE FROM tblRequest WHERE TeamId = @teamId
            DELETE FROM tblInvite WHERE TeamId = @teamId

            SELECT ChallengeId
            FROM tblChallenge
            WHERE (ChallengingTeamId = @teamId OR ChallengedTeamId = @teamId)
                AND DateConfirmed IS NULL
                AND DateClosed IS NULL
                AND DateVoided IS NULL

            SELECT @playerId PlayerId
        `, {teamId: {type: Db.INT, value: team.id}});

        if (data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].PlayerId) {
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents", `otl.gg:invalidate:player:${data.recordsets[1][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents"]);
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
     * @returns {Promise<TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getById(id) {
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Locked: boolean}[]]}}
         */
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
     * @returns {Promise<TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getByNameOrTag(text) {
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean}[]]}}
         */
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
     * @returns {Promise<TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getByPilot(member) {
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, IsFounder: boolean, Locked: boolean}[]]}}
         */
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
        /**
         * @type {{recordsets: [{ClockedChallenges: number}[]]}}
         */
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
     * @returns {Promise<{records: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, winsMap1: number, lossesMap1: number, tiesMap1: number, winsMap2: number, lossesMap2: number, tiesMap2: number, winsMap3: number, lossesMap3: number, tiesMap3: number, winsServer1: number, lossesServer1: number, tiesServer1: number, winsServer2: number, lossesServer2: number, tiesServer2: number, winsServer3: number, lossesServer3: number, tiesServer3: number, wins2v2: number, losses2v2: number, ties2v2: number, wins3v3: number, losses3v3: number, ties3v3: number, wins4v4: number, losses4v4: number, ties4v4: number}, opponents: {teamId: number, name: string, tag: string, wins: number, losses: number, ties: number}[], maps: {map: string, wins: number, losses: number, ties: number}[], matches: {challengeId: number, challengingTeamId: number, challengingTeamName: string, challengingTeamTag: string, challengingTeamScore: number, challengedTeamId: number, challengedTeamName: string, challengedTeamTag: string, challengedTeamScore: number, map: string, matchTime: Date, statTeamId: number, statTeamName: string, statTeamTag: string, playerId: number, name: string, kills: number, deaths: number, assists: number}[], stats: {playerId: number, name: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, teamId: number, teamName: string, teamTag: string, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, map: string, matchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number}[]}>} The team data.
     */
    static async getData(team, season, postseason) {
        // TODO: Redis
        // Key: otl.gg:db:team:getData:<team>:<season>:<postseason>
        // Expiration: End of season (only if null season passed)
        // Invalidation: otl.gg:invalidate:challenge:closed
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number, WinsMap1: number, LossesMap1: number, TiesMap1: number, WinsMap2: number, LossesMap2: number, TiesMap2: number, WinsMap3: number, LossesMap3: number, TiesMap3: number, WinsServer1: number, LossesServer1: number, TiesServer1: number, WinsServer2: number, LossesServer2: number, TiesServer2: number, WinsServer3: number, LossesServer3: number, TiesServer3: number, Wins2v2: number, Losses2v2: number, Ties2v2: number, Wins3v3: number, Losses3v3: number, Ties3v3: number, Wins4v4: number, Losses4v4: number, Ties4v4: number}[], {TeamId: number, Name: string, Tag: string, Wins: number, Losses: number, Ties: number}[], {Map: string, Wins: number, Losses: number, Ties: number}[], {ChallengeId: number, ChallengingTeamId: number, ChallengingTeamName: string, ChallengingTeamTag: string, ChallengingTeamScore: number, ChallengedTeamId: number, ChallengedTeamName: string, ChallengedTeamTag: string, ChallengedTeamScore: number, Map: string, MatchTime: Date, StatTeamId: number, StatTeamName: string, StatTeamTag: string, PlayerId: number, Name: string, Kills: number, Deaths: number, Assists: number}[], {PlayerId: number, Name: string, Games: number, Kills: number, Assists: number, Deaths: number, OvertimePeriods: number, TeamId: number, TeamName: string, TeamTag: string, ChallengeId: number, ChallengingTeamTag: string, ChallengedTeamTag: string, Map: string, MatchTime: Date, BestKills: number, BestAssists: number, BestDeaths: number}[]]}}
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
                c.ChallengeId,
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

            SELECT s.PlayerId, p.Name, COUNT(s.StatId) Games, SUM(s.Kills) Kills, SUM(s.Assists) Assists, SUM(s.Deaths) Deaths, SUM(c.OvertimePeriods) OvertimePeriods, t.TeamId, t.Name TeamName, t.Tag TeamTag, c.ChallengeId, t1.Tag ChallengingTeamTag, t2.Tag ChallengedTeamTag, c.Map, c.MatchTime, sb.Kills BestKills, sb.Assists BestAssists, sb.Deaths BestDeaths
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
            INNER JOIN tblTeam t1 ON c.ChallengingTeamId = t1.TeamId
            INNER JOIN tblTeam t2 ON c.ChallengedTeamId = t2.TeamId
            WHERE s.TeamId = @teamId
            GROUP BY s.PlayerId, p.Name, t.TeamId, t.Tag, t.Name, c.ChallengeId, t1.Tag, t2.Tag, c.Map, c.MatchTime, sb.Kills, sb.Deaths, sb.Assists
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
                challengeId: row.ChallengeId,
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
                challengeId: row.ChallengeId,
                challengingTeamTag: row.ChallengingTeamTag,
                challengedTeamTag: row.ChallengedTeamTag,
                map: row.Map,
                matchTime: row.MatchTime,
                bestKills: row.BestKills,
                bestAssists: row.BestAssists,
                bestDeaths: row.BestDeaths
            }))
        } || {records: void 0, opponents: void 0, maps: void 0, matches: void 0, stats: void 0};
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
     * @returns {Promise<string[]>} A promise that resolves with a list of the team's home maps.
     */
    static async getHomeMaps(team) {
        /**
         * @type {{recordsets: [{Map: string}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Number
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [];
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
     * @returns {Promise<TeamInfo>} A promise that resolves with the team's info.
     */
    static async getInfo(team) {
        /**
         * @type {{recordsets: [{Map: string}[], {PlayerId: number, Name: string, Captain: boolean, Founder: boolean}[], {Name: string, DateRequested: Date}[], {Name: string, DateInvited: Date}[], {PenaltiesRemaining: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Number

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
            homes: data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [],
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
        /**
         * @type {{recordsets: [{NextDate: Date}[]]}}
         */
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
        /**
         * @type {{recordsets: [{Members: number}[]]}}
         */
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
        /**
         * @type {{recordsets: [{Members: number}[]]}}
         */
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
     * @returns {Promise<{teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, wins1: number, losses1: number, ties1: number, wins2: number, losses2: number, ties2: number, wins3: number, losses3: number, ties3: number, winsMap: number, lossesMap: number, tiesMap: number}[]>} A promise that resolves with the season standings.
     */
    static async getSeasonStandings(season, records, map) {
        // TODO: Redis
        // Key: otl.gg:db:team:getSeasonStandings:<season>:<records>:<map>
        // Expiration: End of season (only if null season passed)
        // Invalidation: otl.gg:invalidate:challenge:closed
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
        /**
         * @type {{recordsets: [{Timezone: string}[]]}}
         */
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
        /**
         * @type {{recordsets: [{HasClocked: boolean}[]]}}
         */
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

    // #                   ##    #                #     #  #                    #  #
    // #                  #  #   #                #     #  #                    ####
    // ###    ###   ###    #    ###    ##    ##   # #   ####   ##   # #    ##   ####   ###  ###
    // #  #  #  #  ##       #    #    #  #  #     ##    #  #  #  #  ####  # ##  #  #  #  #  #  #
    // #  #  # ##    ##   #  #   #    #  #  #     # #   #  #  #  #  #  #  ##    #  #  # ##  #  #
    // #  #   # #  ###     ##     ##   ##    ##   #  #  #  #   ##   #  #   ##   #  #   # #  ###
    //                                                                                      #
    /**
     * Checks to see if a team has a stock home map.
     * @param {Team} team The team to check.
     * @param {number} [excludeNumber] Excludes a home map number from the check.
     * @returns {Promise<boolean>} A promise that resolves with whether the team has a stock home map.
     */
    static async hasStockHomeMap(team, excludeNumber) {
        /**
         * @type {{recordsets: [{}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT TOP 1 1
            FROM tblTeamHome th
            INNER JOIN tblAllowedMap am ON th.Map = am.Map
            WHERE th.TeamId = @teamId
                AND (@excludeNumber IS NULL OR th.Number <> @excludeNumber)
                AND am.Stock = 1
        `, {
            teamId: {type: Db.INT, value: team.id},
            excludeNumber: {type: Db.INT, value: excludeNumber}
        });

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].length > 0 || false;
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
        /**
         * @type {{recordsets: [{PlayerId: number}[]]}}
         */
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
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents", `otl.gg:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents"]);
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
        /**
         * @type {{recordsets: [{PlayerId: number}[]]}}
         */
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
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents", `otl.gg:invalidate:player:${data.recordsets[0][0].PlayerId}:updated`]);
        } else {
            await Cache.invalidate(["otl.gg:invalidate:player:freeagents"]);
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

    //                #         #          #  #                    #  #
    //                #         #          #  #                    ####
    // #  #  ###    ###   ###  ###    ##   ####   ##   # #    ##   ####   ###  ###
    // #  #  #  #  #  #  #  #   #    # ##  #  #  #  #  ####  # ##  #  #  #  #  #  #
    // #  #  #  #  #  #  # ##   #    ##    #  #  #  #  #  #  ##    #  #  # ##  #  #
    //  ###  ###    ###   # #    ##   ##   #  #   ##   #  #   ##   #  #   # #  ###
    //       #                                                                 #
    /**
     * Applies a home map for a team.
     * @param {Team} team The team applying the home map.
     * @param {number} number The map number.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the home map has been applied.
     */
    static async updateHomeMap(team, number, map) {
        await db.query(/* sql */`
            MERGE tblTeamHome th
                USING (VALUES (@teamId, @number, @map)) AS v (TeamId, Number, Map)
                ON th.TeamId = v.TeamId AND th.Number = v.Number
            WHEN MATCHED THEN
                UPDATE SET Map = v.Map
            WHEN NOT MATCHED THEN
                INSERT (TeamId, Number, Map) VALUES (v.TeamId, v.Number, v.Map);
        `, {
            teamId: {type: Db.INT, value: team.id},
            number: {type: Db.INT, value: number},
            map: {type: Db.VARCHAR(100), value: map}
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
     * Updates the ratins for the season based on the challenge supplied.
     * @param {Challenge} challenge The challenge in the season to update ratings for.
     * @param {Object<number, number>} ratings The ratings.
     * @returns {Promise} A promise that resolves when the ratings are updated.
     */
    static async updateRatingsForSeasonFromChallenge(challenge, ratings) {
        let sql = /* sql */`
            DECLARE @matchTime DATETIME
            DECLARE @season INT

            SELECT @matchTime = MatchTime FROM tblChallenge WHERE ChallengeId = @challengeId

            IF @matchTime < (SELECT TOP 1 DateStart FROM tblSeason ORDER BY Season)
            BEGIN
                SELECT TOP 1 @matchTime = DateStart FROM tblSeason ORDER BY Season
            END

            SELECT @season = Season FROM tblSeason WHERE DateStart <= @matchTime And DateEnd >= @matchTime

            DELETE FROM tblTeamRating WHERE Season = @season
        `;

        const params = {
            challengeId: {type: Db.INT, value: challenge.id}
        };

        for (const {teamId, rating, index} of Object.keys(ratings).map((r, i) => ({teamId: r, rating: ratings[r], index: i}))) {
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

        await db.query(sql, params);
    }
}

module.exports = TeamDb;
