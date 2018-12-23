/**
 * @typedef {import("./challenge")} Challenge
 * @typedef {{id?: number, challengingTeamId: number, challengedTeamId: number}} ChallengeData
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("./newTeam")} NewTeam
 * @typedef {{id: number, member: DiscordJs.GuildMember, name?: string, tag?: string}} NewTeamData
 * @typedef {import("./team")} Team
 * @typedef {{member?: DiscordJs.GuildMember, id: number, name: string, tag: string, isFounder?: boolean, disbanded?: boolean, locked?: boolean}} TeamData
 * @typedef {{homes: string[], members: {name: string, role: string}[], requests: {name: string, date: Date}[], invites: {name: string, date: Date}[], upcomingMatches?: object[], recentMatches?: object[]}} TeamInfo
 */

const Db = require("node-database"),

    settings = require("./settings"),

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
        await db.query(`
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

    //          #     #   ##                 #                ###          ##   #           ##    ##
    //          #     #  #  #                #                 #          #  #  #            #     #
    //  ###   ###   ###  #      ###   ###   ###    ##   ###    #     ##   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #  #  #  #     #  #  ##      #    # ##  #  #   #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // # ##  #  #  #  #  #  #  # ##    ##    #    ##    #      #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  # #   ###   ###   ##    # #  ###      ##   ##   #      #     ##    ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                               ###
    /**
     * Adds a caster to a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The caster.
     * @returns {Promise} A promise that resolves when a caster is added to a challenge.
     */
    static async addCasterToChallenge(challenge, member) {
        await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblChallenge SET CasterPlayerId = @playerId WHERE ChallengeId = @challengeId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //          #     #  ###    #    ##           #    ###         ###
    //          #     #  #  #         #           #     #           #
    //  ###   ###   ###  #  #  ##     #     ##   ###    #     ##    #     ##    ###  # #
    // #  #  #  #  #  #  ###    #     #    #  #   #     #    #  #   #    # ##  #  #  ####
    // # ##  #  #  #  #  #      #     #    #  #   #     #    #  #   #    ##    # ##  #  #
    //  # #   ###   ###  #     ###   ###    ##     ##   #     ##    #     ##    # #  #  #
    /**
     * Adds a pilot to a team.  Also removes any outstanding requests or invites for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot to add.
     * @param {Team} team The team to add the pilot to.
     * @returns {Promise} A promise that resolves when the pilot has been added to the team.
     */
    static async addPilotToTeam(member, team) {
        await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            INSERT INTO tblRoster (TeamId, PlayerId) VALUES (@teamId, @playerId)
            DELETE FROM tblRequest WHERE PlayerId = @playerId
            DELETE FROM tblInvite WHERE PlayerId = @playerId
            DELETE FROM tblJoinBan WHERE PlayerId = @playerId
            INSERT INTO tblJoinBan (PlayerId) VALUES (@playerId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND PlayerId = @playerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //          #     #   ##    #           #    ###          ##   #           ##    ##
    //          #     #  #  #   #           #     #          #  #  #            #     #
    //  ###   ###   ###   #    ###    ###  ###    #     ##   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #  #  #    #    #    #  #   #     #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // # ##  #  #  #  #  #  #   #    # ##   #     #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  # #   ###   ###   ##     ##   # #    ##   #     ##    ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                  ###
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
    static async addStatToChallenge(challenge, team, pilot, kills, assists, deaths) {
        await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            MERGE tblStats s
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

    //          #     #   ##    #                                        ###          ##   #           ##    ##
    //          #     #  #  #   #                                         #          #  #  #            #     #
    //  ###   ###   ###   #    ###   ###    ##    ###  # #    ##   ###    #     ##   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #  #  #    #    #    #  #  # ##  #  #  ####  # ##  #  #   #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // # ##  #  #  #  #  #  #   #    #     ##    # ##  #  #  ##    #      #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  # #   ###   ###   ##     ##  #      ##    # #  #  #   ##   #      #     ##    ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                          ###
    /**
     * Adds a streamer to a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The streamer to add.
     * @returns {Promise} A promise that resolves when a streamer is added to a challenge.
     */
    static async addStreamerToChallenge(challenge, member) {
        await db.query(`
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

    //          #     #  ###          #     #          #     #  #
    //          #     #   #                 #          #     ## #
    //  ###   ###   ###   #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
    // #  #  #  #  #  #   #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
    // # ##  #  #  #  #   #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
    //  # #   ###   ###   #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
    /**
     * Adds a pilot's Twitch name to their profile.
     * @param {DiscordJs.GuildMember} member The pilot to update.
     * @param {string} name The name of the Twitch channel.
     * @returns {Promise} A promise that resolves when the Twitch name has been added to the profile.
     */
    static async addTwitchName(member, name) {
        await db.query(`
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

    //                   ##          #  #                    #  #
    //                    #          #  #                    ####
    //  ###  ###   ###    #    #  #  ####   ##   # #    ##   ####   ###  ###
    // #  #  #  #  #  #   #    #  #  #  #  #  #  ####  # ##  #  #  #  #  #  #
    // # ##  #  #  #  #   #     # #  #  #  #  #  #  #  ##    #  #  # ##  #  #
    //  # #  ###   ###   ###     #   #  #   ##   #  #   ##   #  #   # #  ###
    //       #     #            #                                        #
    /**
     * Applies a home map for a team.
     * @param {Team} team The team applying the home map.
     * @param {number} number The map number.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the home map has been applied.
     */
    static async applyHomeMap(team, number, map) {
        await db.query(`
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

    //                   ##          ###                     #  #
    //                    #           #                      ## #
    //  ###  ###   ###    #    #  #   #     ##    ###  # #   ## #   ###  # #    ##
    // #  #  #  #  #  #   #    #  #   #    # ##  #  #  ####  # ##  #  #  ####  # ##
    // # ##  #  #  #  #   #     # #   #    ##    # ##  #  #  # ##  # ##  #  #  ##
    //  # #  ###   ###   ###     #    #     ##    # #  #  #  #  #   # #  #  #   ##
    //       #     #            #
    /**
     * Applies a team name to a team being created and returns the team name and tag.
     * @param {NewTeam} newTeam The new team.
     * @param {string} name The name of the team.
     * @returns {Promise} A promise that resolves when the team name is updated.
     */
    static async applyTeamName(newTeam, name) {
        await db.query("UPDATE tblNewTeam SET Name = @name WHERE NewTeamId = @newTeamId", {name: {type: Db.VARCHAR(25), value: name}, newTeamId: {type: Db.INT, value: newTeam.id}});
    }

    //                   ##          ###                     ###
    //                    #           #                       #
    //  ###  ###   ###    #    #  #   #     ##    ###  # #    #     ###   ###
    // #  #  #  #  #  #   #    #  #   #    # ##  #  #  ####   #    #  #  #  #
    // # ##  #  #  #  #   #     # #   #    ##    # ##  #  #   #    # ##   ##
    //  # #  ###   ###   ###     #    #     ##    # #  #  #   #     # #  #
    //       #     #            #                                         ###
    /**
     * Applies a team tag to a team being created and returns the team name and tag.
     * @param {NewTeam} newTeam The new team.
     * @param {string} tag The tag of the team.
     * @returns {Promise} A promise that resolves when the team tag is updated.
     */
    static async applyTeamTag(newTeam, tag) {
        await db.query("UPDATE tblNewTeam SET Tag = @tag WHERE NewTeamId = @newTeamId", {tag: {type: Db.VARCHAR(25), value: tag}, newTeamId: {type: Db.INT, value: newTeam.id}});
    }

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
        const data = await db.query(`
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
        const data = await db.query(`
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
        const data = await db.query(`
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

    //                               ##     ##                      #          ###
    //                                #    #  #                     #           #
    //  ##    ###  ###    ##    ##    #    #     ###    ##    ###  ###    ##    #     ##    ###  # #
    // #     #  #  #  #  #     # ##   #    #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     # ##  #  #  #     ##     #    #  #  #     ##    # ##   #    ##     #    ##    # ##  #  #
    //  ##    # #  #  #   ##    ##   ###    ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Cancels the creation of a new team for a pilot.
     * @param {NewTeam} newTeam The new team.
     * @returns {Promise} A promise that resolves when team creation is cancelled.
     */
    static async cancelCreateTeam(newTeam) {
        await db.query("DELETE FROM tblNewTeam WHERE NewTeamId = @newTeamId", {newTeamId: {type: Db.INT, value: newTeam.id}});
    }

    //       ##                #      ##   #           ##    ##
    //        #                #     #  #  #            #     #
    //  ##    #     ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #      #    #  #  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #      #    #  #  #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##   ###    ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                          ###
    /**
     * Puts a challenge on the clock.
     * @param {Team} team The team clocking the challenge.
     * @param {Challenge} challenge The challenge to clock.
     * @returns {Promise<{clocked: Date, clockDeadline: Date}>} A promise that resolves with the clocked date and the clock deadline date.
     */
    static async clockChallenge(team, challenge) {

        /**
         * @type {{recordsets: [{DateClocked: Date, DateClockDeadline: Date}[]]}}
         */
        const data = await db.query(`
            UPDATE tblChallenge SET DateClocked = GETUTCDATE(), DateClockDeadline = DATEADD(DAY, 28, UTCDATE()), ClockTeamId = @teamId WHERE ChallengeId = @challengeId

            SELECT DateClocked, DateClockDeadline FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {clocked: data.recordsets[0][0].DateClocked, clockDeadline: data.recordsets[0][0].DateClockDeadline} || void 0;
    }

    //       ##                #              #   ##   #           ##    ##                             ##                      #    ####              ###
    //        #                #              #  #  #  #            #     #                            #  #                     #    #                  #
    //  ##    #     ##    ##   # #    ##    ###  #     ###    ###   #     #     ##   ###    ###   ##   #      ##   #  #  ###   ###   ###    ##   ###    #     ##    ###  # #
    // #      #    #  #  #     ##    # ##  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #     #  #  #  #  #  #   #    #     #  #  #  #   #    # ##  #  #  ####
    // #      #    #  #  #     # #   ##    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #     #  #  #      #    ##    # ##  #  #
    //  ##   ###    ##    ##   #  #   ##    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##    ##    ###  #  #    ##  #      ##   #      #     ##    # #  #  #
    //                                                                                      ###
    /**
     * Gets the number of clocked challenges for a team.
     * @param {Team} team The team to check.
     * @returns {Promise<number>} A promise that resolves with the number of clocked challenges for this team.
     */
    static async clockedChallengeCountForTeam(team) {

        /**
         * @type {{recordsets: [{ClockedChallenges: number}[]]}}
         */
        const data = await db.query(`
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

    //       ##                        ##   #           ##    ##
    //        #                       #  #  #            #     #
    //  ##    #     ##    ###    ##   #     ###    ###   #     #     ##   ###    ###   ##
    // #      #    #  #  ##     # ##  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #      #    #  #    ##   ##    #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##   ###    ##   ###     ##    ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                           ###
    /**
     * Closes a challenge.
     * @param {Challenge} challenge The challenge to close.
     * @returns {Promise} A promise that resolves when the challenge is closed.
     */
    static async closeChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET DateClosed = GETUTCDATE() WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                     #    #                #  #              ####               ##   #           ##    ##
    //                    # #                    ####              #                 #  #  #            #     #
    //  ##    ##   ###    #    ##    ###   # #   ####   ###  ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #     #  #  #  #  ###    #    #  #  ####  #  #  #  #  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     #  #  #  #   #     #    #     #  #  #  #  # ##  #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##    ##   #  #   #    ###   #     #  #  #  #   # #  ###   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                       #                                                                  ###
    /**
     * Confirms a suggested neutral map for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the suggested neutral map has been confirmed.
     */
    static async confirmMapForChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET Map = SuggestedMap, UsingHomeMapTeam = 0 WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                     #    #                #  #         #          #
    //                    # #                    ####         #          #
    //  ##    ##   ###    #    ##    ###   # #   ####   ###  ###    ##   ###
    // #     #  #  #  #  ###    #    #  #  ####  #  #  #  #   #    #     #  #
    // #     #  #  #  #   #     #    #     #  #  #  #  # ##   #    #     #  #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   # #    ##   ##   #  #
    /**
     * Confirms a reported match.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<Date>} A promise that resolves with the date the match was confirmed.
     */
    static async confirmMatch(challenge) {

        /**
         * @type {{recordsets: [{DateConfirmed: Date}[]]}}
         */
        const data = await db.query(`
            UPDATE tblChallenge SET DateConfirmed = GETUTCDATE() WHERE ChallengeId = @challengeId

            SELECT DateConfirmed FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateConfirmed || void 0;
    }

    //                     #    #                ###                      ##    #                ####               ##   #           ##    ##
    //                    # #                     #                      #  #                    #                 #  #  #            #     #
    //  ##    ##   ###    #    ##    ###   # #    #     ##    ###  # #    #    ##    ####   ##   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #     #  #  #  #  ###    #    #  #  ####   #    # ##  #  #  ####    #    #      #   # ##  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     #  #  #  #   #     #    #     #  #   #    ##    # ##  #  #  #  #   #     #    ##    #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##    ##   #  #   #    ###   #     #  #   #     ##    # #  #  #   ##   ###   ####   ##   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                                        ###
    /**
     * Confirms a suggested team size for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the suggested team size has been confirmed.
     */
    static async confirmTeamSizeForChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET TeamSize = SuggestedTeamSize, SuggestedTeamSize = NULL, SuggestedTeamSizeTeamId = NULL WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                     #    #                ###    #                ####               ##   #           ##    ##
    //                    # #                     #                      #                 #  #  #            #     #
    //  ##    ##   ###    #    ##    ###   # #    #    ##    # #    ##   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #     #  #  #  #  ###    #    #  #  ####   #     #    ####  # ##  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     #  #  #  #   #     #    #     #  #   #     #    #  #  ##    #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##    ##   #  #   #    ###   #     #  #   #    ###   #  #   ##   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                ###
    /**
     * Confirms a suggested time for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the suggested time has been confirmed.
     */
    static async confirmTimeForChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET MatchTime = SuggestedTime, SuggestedTime = NULL, SuggestedTimeTeamId = NULL WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                          #           ##   #           ##    ##
    //                          #          #  #  #            #     #
    //  ##   ###    ##    ###  ###    ##   #     ###    ###   #     #     ##   ###    ###   ##
    // #     #  #  # ##  #  #   #    # ##  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     #     ##    # ##   #    ##    #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##   #      ##    # #    ##   ##    ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                ###
    /**
     * Creates a challenge between two teams.
     * @param {Team} team1 The first team.
     * @param {Team} team2 The second team.
     * @param {boolean} adminCreated Whether the challenge is admin-created.
     * @returns {Promise<{id: number, orangeTeam: Team, blueTeam: Team, homeMapTeam: Team, homeServerTeam: Team, team1Penalized: boolean, team2Penalized: boolean}>} A promise that resolves with the challenge ID.
     */
    static async createChallenge(team1, team2, adminCreated) {

        /**
         * @type {{recordsets: [{ChallengeId: number, OrangeTeamId: number, BlueTeamId: number, HomeMapTeamId: number, HomeServerTeamId: number, Team1Penalized: boolean, Team2Penalized: boolean}[]]}}
         */
        const data = await db.query(`
            DECLARE @OrangeTeamId INT
            DECLARE @BlueTeamId INT
            DECLARE @HomeMapTeamId INT
            DECLARE @HomeServerTeamId INT
            DECLARE @Team1Penalized BIT
            DECLARE @Team2Penalized BIT
            DECLARE @ChallengeId INT

            SELECT
                @OrangeTeamId = CASE WHEN Team1Orange < Team2Orange THEN @team1Id WHEN Team1Orange > Team2Orange THEN @team2Id WHEN @colorSeed < 0.5 THEN @team1Id ELSE @team2Id END,
                @BlueTeamId = CASE WHEN Team1Orange > Team2Orange THEN @team1Id WHEN Team1Orange < Team2Orange THEN @team2Id WHEN @colorSeed >= 0.5 THEN @team1Id ELSE @team2Id END,
                @HomeMapTeamId = CASE WHEN Team1Penalties = 0 AND Team2Penalties > 0 THEN @team1Id WHEN Team1Penalties > 0 AND Team2Penalties = 0 THEN @team2Id WHEN Team1HomeMap < Team2HomeMap THEN @team1Id WHEN Team1HomeMap > Team2HomeMap THEN @team2Id WHEN @mapSeed < 0.5 THEN @team1Id ELSE @team2Id END,
                @HomeServerTeamId = CASE WHEN Team1Penalties = 0 AND Team2Penalties > 0 THEN @team1Id WHEN Team1Penalties > 0 AND Team2Penalties = 0 THEN @team2Id WHEN Team1HomeServer < Team2HomeServer THEN @team1Id WHEN Team1HomeServer > Team2HomeServer THEN @team2Id WHEN @ServerSeed < 0.5 THEN @team1Id ELSE @team2Id END,
                @Team1Penalized = CASE WHEN Team1Penalties > 0 THEN 1 ELSE 0 END,
                @Team2Penalized = CASE WHEN Team2Penalties > 0 THEN 1 ELSE 0 END
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
                    AND DateConfirmed IS NOT NULL
                    AND DateVoided IS NULL
            ) a

            INSERT INTO tblChallenge (
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
                @team1Id,
                @team2Id,
                @OrangeTeamId,
                @BlueTeamId,
                @HomeMapTeamId,
                @HomeServerTeamId,
                @Team1Penalized,
                @Team2Penalized,
                @adminCreated
            )

            UPDATE tblTeamPenalty
            SET PenaltiesRemaining = PenaltiesRemaining - 1
            WHERE (TeamId = @team1Id OR TeamId = @team2Id)
                AND PenaltiesRemaining > 0

            SET @ChallengeId = SCOPE_IDENTITY()

            INSERT INTO tblChallengeMap (ChallengeId, Number, Map)
            SELECT @ChallengeId, Number, Map
            FROM tblTeamHome
            WHERE TeamId = @HomeMapTeamId

            SELECT
                @ChallengeId ChallengeId,
                @OrangeTeamId OrangeTeamId,
                @BlueTeamId BlueTeamId,
                @HomeMapTeamId HomeMapTeamId,
                @HomeServerTeamId HomeServerTeamId,
                @Team1Penalized Team1Penalized,
                @Team2Penalized Team2Penalized
        `, {
            team1Id: {type: Db.INT, value: team1.id},
            team2Id: {type: Db.INT, value: team2.id},
            colorSeed: {type: Db.FLOAT, value: Math.random()},
            mapSeed: {type: Db.FLOAT, value: Math.random()},
            serverSeed: {type: Db.FLOAT, value: Math.random()},
            adminCreated: {type: Db.BIT, value: adminCreated}
        });
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

    //                          #          ###
    //                          #           #
    //  ##   ###    ##    ###  ###    ##    #     ##    ###  # #
    // #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     #     ##    # ##   #    ##     #    ##    # ##  #  #
    //  ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Creates a team with the specified pilot as the founder.
     * @param {NewTeam} newTeam The new team.
     * @returns {Promise<TeamData>} A promise that resolves with the created team.
     */
    static async createTeam(newTeam) {

        /**
         * @type {{recordsets: [{TeamId: number}[]]}}
         */
        const data = await db.query(`
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

            SELECT @TeamId TeamId
        `, {
            discordId: {type: Db.VARCHAR(24), value: newTeam.member.id},
            name: {type: Db.VARCHAR(25), value: newTeam.name},
            tag: {type: Db.VARCHAR(5), value: newTeam.tag},
            newTeamId: {type: Db.INT, value: newTeam.id}
        });

        const teamId = data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].TeamId || void 0;

        return teamId ? {member: newTeam.member, id: teamId, name: newTeam.name, tag: newTeam.tag, isFounder: true, disbanded: false, locked: false} : void 0;
    }

    //    #   #           #                    #  ###
    //    #               #                    #   #
    //  ###  ##     ###   ###    ###  ###    ###   #     ##    ###  # #
    // #  #   #    ##     #  #  #  #  #  #  #  #   #    # ##  #  #  ####
    // #  #   #      ##   #  #  # ##  #  #  #  #   #    ##    # ##  #  #
    //  ###  ###   ###    ###    # #  #  #   ###   #     ##    # #  #  #
    /**
     * Disbands a team.
     * @param {Team} team The team to disband.
     * @returns {Promise} A promise that resolves when the team is disbanded.
     */
    static async disbandTeam(team) {
        await db.query(`
            UPDATE tblTeam SET Disbanded = 1 WHERE TeamId = @teamId

            DELETE FROM cs
            FROM tblChallengeStreamer cs
            INNER JOIN tblChallenge c ON cs.ChallengeId = c.ChallengeId
            WHERE c.DateConfirmed IS NULL
                AND c.DateVoided IS NULL
                AND cs.PlayerId IN (SELECT PlayerId FROM tblRoster WHERE TeamId = @teamId)

            DELETE FROM tblRoster WHERE TeamId = @teamId
            DELETE FROM tblRequest WHERE TeamId = @teamId
            DELETE FROM tblInvite WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: team.id}});
    }

    //              #                   #   ##   #           ##    ##
    //              #                   #  #  #  #            #     #
    //  ##   #  #  ###    ##   ###    ###  #     ###    ###   #     #     ##   ###    ###   ##
    // # ##   ##    #    # ##  #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // ##     ##    #    ##    #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##   #  #    ##   ##   #  #   ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                ###
    /**
     * Extends a challenge.
     * @param {Challenge} challenge The challenge to extend.
     * @returns {Promise<Date>} A promise that resolves with the extended clock deadline.
     */
    static async extendChallenge(challenge) {

        /**
         * @type {{recordsets: [{DateClockDeadline: Date}[]]}}
         */
        const data = await db.query(`
            UPDATE tblChallenge SET
                DateClockDeadline = CASE WHEN DateClockDeadline IS NULL THEN NULL ELSE DATEADD(DAY, 14, UTCDATE()) END,
                MatchTime = NULL,
                SuggestedTime = NULL,
                SuggestedTimeTeamId = NULL
            WHERE ChallengeId = @challengeId

            SELECT DateClockDeadline FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateClockDeadline || void 0;
    }

    //              #     ##               ###                     ###         #  #                     ##         ###
    //              #    #  #               #                      #  #        ## #                    #  #         #
    //  ###   ##   ###   #  #  ###   #  #   #     ##    ###  # #   ###   #  #  ## #   ###  # #    ##   #  #  ###    #     ###   ###
    // #  #  # ##   #    ####  #  #  #  #   #    # ##  #  #  ####  #  #  #  #  # ##  #  #  ####  # ##  #  #  #  #   #    #  #  #  #
    //  ##   ##     #    #  #  #  #   # #   #    ##    # ##  #  #  #  #   # #  # ##  # ##  #  #  ##    #  #  #      #    # ##   ##
    // #      ##     ##  #  #  #  #    #    #     ##    # #  #  #  ###     #   #  #   # #  #  #   ##    ##   #      #     # #  #
    //  ###                           #                                   #                                                     ###
    /**
     * Gets a team by name or tag.  Team can be disbanded
     * @param {string} text The name or tag of the team.
     * @returns {Promise<TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getAnyTeamByNameOrTag(text) {

        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean}[]]}}
         */
        const data = await db.query("SELECT TeamId, Name, Tag, Disbanded, Locked FROM tblTeam WHERE Name = @text OR Tag = @text", {text: {type: Db.VARCHAR(25), value: text}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, disbanded: !!data.recordsets[0][0].Disbanded, locked: !!data.recordsets[0][0].Locked} || void 0;
    }

    //              #     ##   #           ##    ##                            ###         ###      #
    //              #    #  #  #            #     #                            #  #         #       #
    //  ###   ##   ###   #     ###    ###   #     #     ##   ###    ###   ##   ###   #  #   #     ###
    // #  #  # ##   #    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  #  #   #    #  #
    //  ##   ##     #    #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #   # #   #    #  #
    // #      ##     ##   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###     #   ###    ###
    //  ###                                                         ###               #
    /**
     * Gets a challenge by its ID.
     * @param {number} id The ID number of the challenge.
     * @returns {Promise<ChallengeData>} A promise that resolves with the challenge data.
     */
    static async getChallengeById(id) {

        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number}[]]}}
         */
        const data = await db.query("SELECT ChallengeId, ChallengingTeamId, ChallengedTeamId FROM tblChallenge WHERE ChallengeId = @id", {id: {type: Db.INT, value: id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].ChallengeId, challengingTeamId: data.recordsets[0][0].ChallengingTeamId, challengedTeamId: data.recordsets[0][0].ChallengedTeamId} || void 0;
    }

    //              #     ##   #           ##    ##                            ###         ###
    //              #    #  #  #            #     #                            #  #         #
    //  ###   ##   ###   #     ###    ###   #     #     ##   ###    ###   ##   ###   #  #   #     ##    ###  # #    ###
    // #  #  # ##   #    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  #  #   #    # ##  #  #  ####  ##
    //  ##   ##     #    #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #   # #   #    ##    # ##  #  #    ##
    // #      ##     ##   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###     #    #     ##    # #  #  #  ###
    //  ###                                                         ###               #
    /**
     * Gets a challenge between two teams.
     * @param {Team} team1 The first team.
     * @param {Team} team2 The second team.
     * @returns {Promise<ChallengeData>} A promise that resolves with the challenge data.
     */
    static async getChallengeByTeams(team1, team2) {

        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number}[]]}}
         */
        const data = await db.query(`
            SELECT ChallengeId, ChallengingTeamId, ChallengedTeamId
            FROM tblChallenge
            WHERE ((ChallengingTeamId = @team1Id AND ChallengedTeamId = @team2Id) OR (ChallengingTeamId = @team2Id AND ChallengedTeamId = @team1Id))
                AND DateConfirmed IS NULL
                AND DateClosed IS NULL
                AND DateVoided IS NULL
        `, {
            team1Id: {type: Db.INT, value: team1.id},
            team2Id: {type: Db.INT, value: team2.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].ChallengeId, challengingTeamId: data.recordsets[0][0].ChallengingTeamId, challengedTeamId: data.recordsets[0][0].ChallengedTeamId} || void 0;
    }

    //              #     ##   #           ##    ##                            ###          #           #    ##
    //              #    #  #  #            #     #                            #  #         #                 #
    //  ###   ##   ###   #     ###    ###   #     #     ##   ###    ###   ##   #  #   ##   ###    ###  ##     #     ###
    // #  #  # ##   #    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  # ##   #    #  #   #     #    ##
    //  ##   ##     #    #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  ##     #    # ##   #     #      ##
    // #      ##     ##   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    ##     ##   # #  ###   ###   ###
    //  ###                                                         ###
    /**
     * Gets the details of a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<{orangeTeamId: number, blueTeamId: number, map: string, teamSize: number, matchTime: Date, homeMapTeamId: number, homeServerTeamId: number, adminCreated: boolean, homesLocked: boolean, usingHomeMapTeam: boolean, usingHomeServerTeam: boolean, challengingTeamPenalized: boolean, challengedTeamPenalized: boolean, suggestedMap: string, suggestedMapTeamId: number, suggestedNeutralServerTeamId: number, suggestedTeamSize: number, suggestedTeamSizeTeamId: number, suggestedTime: Date, suggestedTimeTeamId: number, reportingTeamId: number, challengingTeamScore: number, challengedTeamScore: number, casterDiscordId: string, dateAdded: Date, dateClocked: Date, clockTeamId: number, dateClockDeadline: Date, dateClockDeadlineNotified: Date, dateReported: Date, dateConfirmed: Date, dateClosed: Date, dateVoided: Date, homeMaps: string[]}>} A promise that resolves with the challenge details.
     */
    static async getChallengeDetails(challenge) {

        /**
         * @type {{recordsets: [{OrangeTeamId: number, BlueTeamId: number, Map: string, TeamSize: number, MatchTime: Date, HomeMapTeamId: number, HomeServerTeamId: number, AdminCreated: boolean, HomesLocked: boolean, UsingHomeMapTeam: boolean, UsingHomeServerTeam: boolean, ChallengingTeamPenalized: boolean, ChallengedTeamPenalized: boolean, SuggestedMap: string, SuggestedMapTeamId: number, SuggestedNeutralServerTeamId: number, SuggestedTeamSize: number, SuggestedTeamSizeTeamId: number, SuggestedTime: Date, SuggestedTimeTeamId: number, ReportingTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, DateAdded: Date, DateClocked: Date, ClockTeamId: number, DiscordId: string, DateClockDeadline: Date, DateClockDeadlineNotified: Date, DateReported: Date, DateConfirmed: Date, DateClosed: Date, DateVoided: Date}[], {Map: string}[]]}}
         */
        const data = await db.query(`
            SELECT
                c.OrangeTeamId,
                c.BlueTeamId,
                c.Map,
                c.TeamSize,
                c.MatchTime,
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
                c.DateVoided
            FROM tblChallenge c
            LEFT OUTER JOIN tblPlayer p ON c.CasterPlayerId = p.PlayerId
            WHERE c.ChallengeId = @challengeId

            SELECT Map FROM tblChallengeHome WHERE ChallengeId = @challengeId ORDER BY Number
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {
            orangeTeamId: data.recordsets[0][0].OrangeTeamId,
            blueTeamId: data.recordsets[0][0].BlueTeamId,
            map: data.recordsets[0][0].Map,
            teamSize: data.recordsets[0][0].TeamSize,
            matchTime: data.recordsets[0][0].MatchTime,
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
            homeMaps: data.recordsets[1] && data.recordsets[1].map((row) => row.Map) || void 0
        } || void 0;
    }

    //              #     ##   #           ##    ##                                   ###         ###
    //              #    #  #  #            #     #                                   #  #         #
    //  ###   ##   ###   #     ###    ###   #     #     ##   ###    ###   ##    ###   ###   #  #   #     ##    ###  # #
    // #  #  # ##   #    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  ##     #  #  #  #   #    # ##  #  #  ####
    //  ##   ##     #    #  #  #  #  # ##   #     #    ##    #  #   ##   ##      ##   #  #   # #   #    ##    # ##  #  #
    // #      ##     ##   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    ###     #    #     ##    # #  #  #
    //  ###                                                         ###                      #
    /**
     * Gets all challenges for a team.
     * @param {Team} team The team.
     * @returns {Promise<ChallengeData[]>} A promise that resolves with an array of challenge data.
     */
    static async getChallengesByTeam(team) {

        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number}[]]}}
         */
        const data = await db.query(`
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

    //              #     ##   #           ##    ##                                   ###         ###
    //              #    #  #  #            #     #                                   #  #         #
    //  ###   ##   ###   #     ###    ###   #     #     ##   ###    ###   ##    ###   ###   #  #   #     ##    ###  # #    ###
    // #  #  # ##   #    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  ##     #  #  #  #   #    # ##  #  #  ####  ##
    //  ##   ##     #    #  #  #  #  # ##   #     #    ##    #  #   ##   ##      ##   #  #   # #   #    ##    # ##  #  #    ##
    // #      ##     ##   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    ###     #    #     ##    # #  #  #  ###
    //  ###                                                         ###                      #
    /**
     * Gets all challenges for two teams.
     * @param {Team} team1 The first team.
     * @param {Team} team2 The second team.
     * @returns {Promise<ChallengeData[]>} A promise that resolves with an array of challenge data.
     */
    static async getChallengesByTeams(team1, team2) {

        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamId: number, ChallengedTeamId: number}[]]}}
         */
        const data = await db.query(`
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

    //              #    #  #              ###
    //              #    ## #               #
    //  ###   ##   ###   ## #   ##   #  #   #     ##    ###  # #
    // #  #  # ##   #    # ##  # ##  #  #   #    # ##  #  #  ####
    //  ##   ##     #    # ##  ##    ####   #    ##    # ##  #  #
    // #      ##     ##  #  #   ##   ####   #     ##    # #  #  #
    //  ###
    /**
     * Gets new team data for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot to get the new team for.
     * @returns {Promise<NewTeamData>} A promise that resolves with the new team's name and tag.
     */
    static async getNewTeam(member) {

        /**
         * @type {{recordsets: [{NewTeamId: number, Name: string, Tag: string}[]]}}
         */
        const data = await db.query(`
            SELECT nt.NewTeamId, nt.Name, nt.Tag
            FROM tblNewTeam nt
            INNER JOIN tblPlayer p ON nt.PlayerId = p.PlayerId
            WHERE p.DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].NewTeamId, member, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag} || void 0;
    }

    //              #    #  #               #     ##   ##                #     ###          #          ####              ###
    //              #    ## #               #    #  #   #                #     #  #         #          #                  #
    //  ###   ##   ###   ## #   ##   #  #  ###   #      #     ##    ##   # #   #  #   ###  ###    ##   ###    ##   ###    #     ##    ###  # #
    // #  #  # ##   #    # ##  # ##   ##    #    #      #    #  #  #     ##    #  #  #  #   #    # ##  #     #  #  #  #   #    # ##  #  #  ####
    //  ##   ##     #    # ##  ##     ##    #    #  #   #    #  #  #     # #   #  #  # ##   #    ##    #     #  #  #      #    ##    # ##  #  #
    // #      ##     ##  #  #   ##   #  #    ##   ##   ###    ##    ##   #  #  ###    # #    ##   ##   #      ##   #      #     ##    # #  #  #
    //  ###
    /**
     * Gets the next date this team can put a challenge on the clock.
     * @param {Team} team The team to check.
     * @returns {Promise<Date>} A promise that resolves with the next date this team can put a challenge on the clock.
     */
    static async getNextClockDateForTeam(team) {

        /**
         * @type {{recordsets: [{NextDate: Date}[]]}}
         */
        const data = await db.query("SELECT DATEADD(DAY, 28, MAX(DateClocked)) NextDate FROM tblChallenge WHERE ClockTeamId = @teamId AND DateVoided IS NULL", {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].NextDate || void 0;
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
        const data = await db.query(`
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

    //              #    ###                     ###         ###      #
    //              #     #                      #  #         #       #
    //  ###   ##   ###    #     ##    ###  # #   ###   #  #   #     ###
    // #  #  # ##   #     #    # ##  #  #  ####  #  #  #  #   #    #  #
    //  ##   ##     #     #    ##    # ##  #  #  #  #   # #   #    #  #
    // #      ##     ##   #     ##    # #  #  #  ###     #   ###    ###
    //  ###                                             #
    /**
     * Gets the team by the team ID.
     * @param {number} id The Team ID.
     * @returns {Promise<TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getTeamById(id) {

        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Locked: boolean}[]]}}
         */
        const data = await db.query(`
            SELECT TeamId, Name, Tag, Locked
            FROM tblTeam
            WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, locked: !!data.recordsets[0][0].Locked} || void 0;
    }

    //              #    ###                     ###         ###    #    ##           #
    //              #     #                      #  #        #  #         #           #
    //  ###   ##   ###    #     ##    ###  # #   ###   #  #  #  #  ##     #     ##   ###
    // #  #  # ##   #     #    # ##  #  #  ####  #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #     #    ##    # ##  #  #  #  #   # #  #      #     #    #  #   #
    // #      ##     ##   #     ##    # #  #  #  ###     #   #     ###   ###    ##     ##
    //  ###                                             #
    /**
     * Gets the team for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot to get the team for.
     * @returns {Promise<TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getTeamByPilot(member) {

        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, IsFounder: boolean, Locked: boolean}[]]}}
         */
        const data = await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            SELECT TeamId, Name, Tag, CASE WHEN EXISTS(SELECT TOP 1 1 FROM tblRoster WHERE Founder = 1 AND PlayerId = @playerId) THEN 1 ELSE 0 END IsFounder, Locked
            FROM tblTeam
            WHERE TeamId IN (SELECT TeamId FROM tblRoster WHERE PlayerId = @playerId)
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {member, id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, isFounder: !!data.recordsets[0][0].IsFounder, locked: !!data.recordsets[0][0].Locked} || void 0;
    }

    //              #    ###                     #  #                    #  #
    //              #     #                      #  #                    ####
    //  ###   ##   ###    #     ##    ###  # #   ####   ##   # #    ##   ####   ###  ###    ###
    // #  #  # ##   #     #    # ##  #  #  ####  #  #  #  #  ####  # ##  #  #  #  #  #  #  ##
    //  ##   ##     #     #    ##    # ##  #  #  #  #  #  #  #  #  ##    #  #  # ##  #  #    ##
    // #      ##     ##   #     ##    # #  #  #  #  #   ##   #  #   ##   #  #   # #  ###   ###
    //  ###                                                                          #
    /**
     * Gets all of the team's home maps.
     * @param {Team} team The team to get maps for.
     * @returns {Promise<string[]>} A promise that resolves with a list of the team's home maps.
     */
    static async getTeamHomeMaps(team) {

        /**
         * @type {{recordsets: [{Map: string}[]]}}
         */
        const data = await db.query("SELECT Map FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Number", {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [];
    }

    //              #    ###                     ###           #
    //              #     #                       #           # #
    //  ###   ##   ###    #     ##    ###  # #    #    ###    #     ##
    // #  #  # ##   #     #    # ##  #  #  ####   #    #  #  ###   #  #
    //  ##   ##     #     #    ##    # ##  #  #   #    #  #   #    #  #
    // #      ##     ##   #     ##    # #  #  #  ###   #  #   #     ##
    //  ###
    /**
     * Gets a team's info.
     * @param {Team} team The team to get the info for.
     * @returns {Promise<TeamInfo>} A promise that resolves with the team's info.
     */
    static async getTeamInfo(team) {

        /**
         * @type {{recordsets: [{Map: string}[], {Name: string, Captain: boolean, Founder: boolean}[], {Name: string, DateRequested: Date}[], {Name: string, DateInvited: Date}[]]}}
         */
        const data = await db.query(`
            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Number

            SELECT p.Name, r.Captain, r.Founder
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
        `, {teamId: {type: Db.INT, value: team.id}});
        return {
            homes: data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [],
            members: data && data.recordsets && data.recordsets[1] && data.recordsets[1].map((row) => ({name: row.Name, role: row.Captain ? "Captain" : row.Founder ? "Founder" : void 0})) || [],
            requests: data && data.recordsets && data.recordsets[2] && data.recordsets[2].map((row) => ({name: row.Name, date: row.DateRequested})) || [],
            invites: data && data.recordsets && data.recordsets[3] && data.recordsets[3].map((row) => ({name: row.Name, date: row.DateInvited})) || []
        };
    }

    //              #    ###                     ###    #    ##           #     ##            #  ###                #     #             #   ##                      #
    //              #     #                      #  #         #           #    #  #           #   #                       #             #  #  #                     #
    //  ###   ##   ###    #     ##    ###  # #   #  #  ##     #     ##   ###   #  #  ###    ###   #    ###   # #   ##    ###    ##    ###  #      ##   #  #  ###   ###
    // #  #  # ##   #     #    # ##  #  #  ####  ###    #     #    #  #   #    ####  #  #  #  #   #    #  #  # #    #     #    # ##  #  #  #     #  #  #  #  #  #   #
    //  ##   ##     #     #    ##    # ##  #  #  #      #     #    #  #   #    #  #  #  #  #  #   #    #  #  # #    #     #    ##    #  #  #  #  #  #  #  #  #  #   #
    // #      ##     ##   #     ##    # #  #  #  #     ###   ###    ##     ##  #  #  #  #   ###  ###   #  #   #    ###     ##   ##    ###   ##    ##    ###  #  #    ##
    //  ###
    /**
     * Gets the number of pilots on and invited pilots for a team.
     * @param {Team} team The team to check.
     * @returns {Promise<number>} A promise that resolves with the number of pilots on and invited pilots for a team.
     */
    static async getTeamPilotAndInvitedCount(team) {

        /**
         * @type {{recordsets: [{Members: number}[]]}}
         */
        const data = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM tblRoster WHERE TeamId = @teamId) +
                (SELECT COUNT(*) FROM tblInvite WHERE TeamId = @teamId) Members
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Members || 0;
    }

    //              #    ###                     ###    #    ##           #     ##                      #
    //              #     #                      #  #         #           #    #  #                     #
    //  ###   ##   ###    #     ##    ###  # #   #  #  ##     #     ##   ###   #      ##   #  #  ###   ###
    // #  #  # ##   #     #    # ##  #  #  ####  ###    #     #    #  #   #    #     #  #  #  #  #  #   #
    //  ##   ##     #     #    ##    # ##  #  #  #      #     #    #  #   #    #  #  #  #  #  #  #  #   #
    // #      ##     ##   #     ##    # #  #  #  #     ###   ###    ##     ##   ##    ##    ###  #  #    ##
    //  ###
    /**
     * Gets the number of pilots on a team.
     * @param {Team} team The team to check.
     * @returns {Promise<number>} A promise that resolves with the number of pilots on a team.
     */
    static async getTeamPilotCount(team) {

        /**
         * @type {{recordsets: [{Members: number}[]]}}
         */
        const data = await db.query("SELECT COUNT(*) Members FROM tblRoster WHERE TeamId = @teamId", {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Members || 0;
    }

    //              #    ###                      ##    #           #           ####               ##   #           ##    ##
    //              #     #                      #  #   #           #           #                 #  #  #            #     #
    //  ###   ##   ###    #     ##    ###  # #    #    ###    ###  ###    ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  # ##   #     #    # ##  #  #  ####    #    #    #  #   #    ##     #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //  ##   ##     #     #    ##    # ##  #  #  #  #   #    # ##   #      ##   #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #      ##     ##   #     ##    # #  #  #   ##     ##   # #    ##  ###    #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //  ###                                                                                                                                  ###
    /**
     * Gets the team stats for a challenge.
     * @param {Challenge} challenge The challenge to get stats for.
     * @param {Team} team The team to get stats for.
     * @returns {Promise<{discordId: string, kills: number, assists: number, deaths: number}[]>} A promise that resolves with the team's stats for the challenge.
     */
    static async getTeamStatsForChallenge(challenge, team) {

        /**
         * @type {{recordsets: [{DiscordId: string, Kills: number, Assists: number, Deaths: number}[]]}}
         */
        const data = await db.query(`
            SELECT p.DiscordId, s.Kills, s.Assists, s.Deaths
            FROM tblStats s
            INNER JOIN tblPlayer p ON s.PlayerId = p.PlayerId
            WHERE s.ChallengeId = @challengeId
                AND s.TeamId = @teamId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            teamId: {type: Db.INT, value: team.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({discordId: row.DiscordId, kills: row.Kills, assists: row.Assists, deaths: row.Deaths})) || [];
    }

    //              #    ###    #                                        ####              ###    #    ##           #
    //              #     #                                              #                 #  #         #           #
    //  ###   ##   ###    #    ##    # #    ##   ####   ##   ###    ##   ###    ##   ###   #  #  ##     #     ##   ###
    // #  #  # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##  #     #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##    #     #  #  #     #      #     #    #  #   #
    // #      ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##   #      ##   #     #     ###   ###    ##     ##
    //  ###
    /**
     * Gets a pilot's time zone.
     * @param {DiscordJs.GuildMember} member The pilot to get the time zone for.
     * @returns {Promise<string>} The pilot's time zone.
     */
    static async getTimezoneForPilot(member) {

        /**
         * @type {{recordsets: [{Timezone: string}[]]}}
         */
        const data = await db.query("SELECT Timezone FROM tblPlayer WHERE DiscordId = @discordId", {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Timezone || void 0;
    }

    //              #    ###    #                                        ####              ###
    //              #     #                                              #                  #
    //  ###   ##   ###    #    ##    # #    ##   ####   ##   ###    ##   ###    ##   ###    #     ##    ###  # #
    // #  #  # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##  #     #  #  #  #   #    # ##  #  #  ####
    //  ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##    #     #  #  #      #    ##    # ##  #  #
    // #      ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##   #      ##   #      #     ##    # #  #  #
    //  ###
    /**
     * Gets a team's time zone.
     * @param {Team} team The team to get the time zone for.
     * @returns {Promise<string>} The team's time zone.
     */
    static async getTimezoneForTeam(team) {

        /**
         * @type {{recordsets: [{Timezone: string}[]]}}
         */
        const data = await db.query("SELECT Timezone FROM tblTeam WHERE TeamId = @teamId", {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Timezone || void 0;
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
        const data = await db.query("SELECT TwitchName FROM tblPlayer WHERE DiscordId = @discordId", {discordId: {type: Db.VARCHAR(24), value: member.id}});
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
        const data = await db.query(`
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
        const data = await db.query(`
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

    //  #                 #     #          ###    #    ##           #    ###         ###
    //                          #          #  #         #           #     #           #
    // ##    ###   # #   ##    ###    ##   #  #  ##     #     ##   ###    #     ##    #     ##    ###  # #
    //  #    #  #  # #    #     #    # ##  ###    #     #    #  #   #     #    #  #   #    # ##  #  #  ####
    //  #    #  #  # #    #     #    ##    #      #     #    #  #   #     #    #  #   #    ##    # ##  #  #
    // ###   #  #   #    ###     ##   ##   #     ###   ###    ##     ##   #     ##    #     ##    # #  #  #
    /**
     * Invites a pilot to the pilot's team.
     * @param {Team} team The pilot whos team to invite the pilot to.
     * @param {DiscordJs.GuildMember} member The pilot to invite to the team.
     * @returns {Promise} A promise that resolves when the pilot is invited to the pilot's team.
     */
    static async invitePilotToTeam(team, member) {
        await db.query(`
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
        const data = await db.query(`
            SELECT jb.DateExpires
            FROM tblJoinBan jb
            INNER JOIN tblPlayer p ON jb.PlayerId = p.PlayerId
            WHERE p.DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateExpires && data.recordsets[0][0].DateExpires > new Date() && data.recordsets[0][0].DateExpires || void 0;
    }

    // ##                #      ##   #           ##    ##
    //  #                #     #  #  #            #     #
    //  #     ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    //  #    #  #  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //  #    #  #  #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###    ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                    ###
    /**
     * Locks a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the challenge is locked.
     */
    static async lockChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET AdminCreated = 1 WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
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
        await db.query(`
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

    //        #          #     #  #              ####               ##   #           ##    ##
    //                   #     ####              #                 #  #  #            #     #
    // ###   ##     ##   # #   ####   ###  ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #   #    #     ##    #  #  #  #  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #   #    #     # #   #  #  # ##  #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###   ###    ##   #  #  #  #   # #  ###   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    // #                                   #                                                                  ###
    /**
     * Picks the map for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {number} number The number of the map, 1, 2, or 3.
     * @returns {Promise<string>} A promise that resolves with the name of the map that was picked.
     */
    static async pickMapForChallenge(challenge, number) {

        /**
         * @type {{recordsets: [{Map: string}[]]}}
         */
        const data = await db.query(`
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
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Map || void 0;
    }

    //              #                  #           #          ###
    //                                 #           #           #
    // ###    ##   ##    ###    ###   ###    ###  ###    ##    #     ##    ###  # #
    // #  #  # ##   #    #  #  ##      #    #  #   #    # ##   #    # ##  #  #  ####
    // #     ##     #    #  #    ##    #    # ##   #    ##     #    ##    # ##  #  #
    // #      ##   ###   #  #  ###      ##   # #    ##   ##    #     ##    # #  #  #
    /**
     * Reinstates a team with the pilot as its founder.
     * @param {DiscordJs.GuildMember} member The pilot reinstating the team.
     * @param {Team} team The team to reinstate.
     * @returns {Promise} A promise that resolves when the team is reinstated.
     */
    static async reinstateTeam(member, team) {
        await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblTeam SET Disbanded = 0 WHERE TeamId = @teamId

            INSERT INTO tblRoster (TeamId, PlayerId, Founder) VALUES (@teamId, @playerId, 1)

            DELETE FROM tblJoinBan WHERE PlayerId = @playerId
            INSERT INTO tblJoinBan (PlayerId) VALUES (@playerId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND PlayerId = @playerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });
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
        await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblRoster SET Captain = 0 WHERE PlayerId = @playerId AND TeamId = @teamId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //                                      ##                 #                ####                     ##   #           ##    ##
    //                                     #  #                #                #                       #  #  #            #     #
    // ###    ##   # #    ##   # #    ##   #      ###   ###   ###    ##   ###   ###   ###    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  # ##  ####  #  #  # #   # ##  #     #  #  ##      #    # ##  #  #  #     #  #  #  #  ####  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     ##    #  #  #  #  # #   ##    #  #  # ##    ##    #    ##    #     #     #     #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #      ##   #  #   ##    #     ##    ##    # #  ###      ##   ##   #     #     #      ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                             ###
    /**
     * Removes a caster from a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when a caster is removed from a challenge.
     */
    static async removeCasterFromChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET CasterPlayerId = NULL WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                                     ###    #    ##           #    ####                    ###
    //                                     #  #         #           #    #                        #
    // ###    ##   # #    ##   # #    ##   #  #  ##     #     ##   ###   ###   ###    ##   # #    #     ##    ###  # #
    // #  #  # ##  ####  #  #  # #   # ##  ###    #     #    #  #   #    #     #  #  #  #  ####   #    # ##  #  #  ####
    // #     ##    #  #  #  #  # #   ##    #      #     #    #  #   #    #     #     #  #  #  #   #    ##    # ##  #  #
    // #      ##   #  #   ##    #     ##   #     ###   ###    ##     ##  #     #      ##   #  #   #     ##    # #  #  #
    /**
     * Removes a pilot from a team, whether they are on the roster, requested, or invited.
     * @param {DiscordJs.GuildMember} member The pilot to remove.
     * @param {Team} team The team to remove the pilot from.
     * @returns {Promise} A promise that resolves when the pilot has been removed.
     */
    static async removePilotFromTeam(member, team) {
        await db.query(`
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
                    FROM tblStats s
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

            DELETE FROM tblRequest WHERE TeamId = @teamId AND PlayerId = @playerId
            DELETE FROM tblInvite WHERE TeamId = @teamId AND PlayerId = @playerId
        `, {
            teamId: {type: Db.INT, value: team.id},
            discordId: {type: Db.VARCHAR(24), value: member.id}
        });
    }

    //                                      ##    #           #    ####                     ##   #           ##    ##
    //                                     #  #   #           #    #                       #  #  #            #     #
    // ###    ##   # #    ##   # #    ##    #    ###    ###  ###   ###   ###    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #   #    #     #  #  #  #  ####  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     ##    #  #  #  #  # #   ##    #  #   #    # ##   #    #     #     #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #      ##   #  #   ##    #     ##    ##     ##   # #    ##  #     #      ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                ###
    /**
     * Removes a stat from a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @returns {Promise} A promise that resolves when the stat has been removed.
     */
    static async removeStatFromChallenge(challenge, pilot) {
        await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            DELETE FROM tblStats WHERE ChallengeId = @challengeId AND PlayerId = @playerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: pilot.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                      ##    #                                        ####                     ##   #           ##    ##
    //                                     #  #   #                                        #                       #  #  #            #     #
    // ###    ##   # #    ##   # #    ##    #    ###   ###    ##    ###  # #    ##   ###   ###   ###    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #  # ##  #  #  ####  # ##  #  #  #     #  #  #  #  ####  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     ##    #  #  #  #  # #   ##    #  #   #    #     ##    # ##  #  #  ##    #     #     #     #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #      ##   #  #   ##    #     ##    ##     ##  #      ##    # #  #  #   ##   #     #     #      ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                                        ###
    /**
     * Removes a streamer from a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The streamer to remove.
     * @returns {Promise} A promise that resolves when a streamer is removed from a challenge.
     */
    static async removeStreamerFromChallenge(challenge, member) {
        await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            DELETE FROM tblChallengeStreamer cs
            WHERE ChallengeId = @challengeId
                AND PlayerId = @playerId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                     ###          #     #          #     #  #
    //                                      #                 #          #     ## #
    // ###    ##   # #    ##   # #    ##    #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
    // #  #  # ##  ####  #  #  # #   # ##   #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
    // #     ##    #  #  #  #  # #   ##     #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
    // #      ##   #  #   ##    #     ##    #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
    /**
     * Removes a pilot's Twitch name from their profile.
     * @param {DiscordJs.GuildMember} member The pilot to update.
     * @returns {Promise} A promise that resolves when the Twitch name has been removed from the profile.
     */
    static async removeTwitchName(member) {
        await db.query("UPDATE tblPlayer SET TwitchName = NULL WHERE DiscordId = @discordId", {discordId: {type: Db.VARCHAR(24), value: member.id}});
    }

    //                                     ###
    //                                      #
    // ###    ##   ###    ###  # #    ##    #     ##    ###  # #
    // #  #  # ##  #  #  #  #  ####  # ##   #    # ##  #  #  ####
    // #     ##    #  #  # ##  #  #  ##     #    ##    # ##  #  #
    // #      ##   #  #   # #  #  #   ##    #     ##    # #  #  #
    /**
     * Renames a team.
     * @param {Team} team The team to rename.
     * @param {string} name The name to rename the team to.
     * @returns {Promise} A promise that resolves when the team has been renamed.
     */
    static async renameTeam(team, name) {
        await db.query("UPDATE tblTeam SET Name = @name WHERE TeamId = @teamId", {
            name: {type: Db.VARCHAR(25), value: name},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //                                #    #  #         #          #
    //                                #    ####         #          #
    // ###    ##   ###    ##   ###   ###   ####   ###  ###    ##   ###
    // #  #  # ##  #  #  #  #  #  #   #    #  #  #  #   #    #     #  #
    // #     ##    #  #  #  #  #      #    #  #  # ##   #    #     #  #
    // #      ##   ###    ##   #       ##  #  #   # #    ##   ##   #  #
    //             #
    /**
     * Reports a match.
     * @param {Challenge} challenge The challenge.
     * @param {Team} reportingTeam The reporting team.
     * @param {number} challengingTeamScore The challenging team's score.
     * @param {number} challengedTeamScore The challenged team's score.
     * @returns {Promise<Date>} A promise that resolves with the date the match was reported.
     */
    static async reportMatch(challenge, reportingTeam, challengingTeamScore, challengedTeamScore) {

        /**
         * @type {{recordsets: [{DateReported: Date}[]]}}
         */
        const data = await db.query(`
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
        await db.query(`
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

    //              #                ###
    //              #                 #
    // ###    ##   ###    ###   ###   #     ##    ###  # #
    // #  #  # ##   #    #  #  #  #   #    # ##  #  #  ####
    // #     ##     #    # ##   ##    #    ##    # ##  #  #
    // #      ##     ##   # #  #      #     ##    # #  #  #
    //                          ###
    /**
     * Renames a team tag.
     * @param {Team} team The team to rename the tag of.
     * @param {string} tag The tag to rename the team tag to.
     * @returns {Promise} A promise that resolves when the team tag has been renamed.
     */
    static async retagTeam(team, tag) {
        await db.query("UPDATE tblTeam SET Tag = @tag WHERE TeamId = @teamId", {
            tag: {type: Db.VARCHAR(5), value: tag},
            teamId: {type: Db.INT, value: team.id}
        });
    }

    //               #    #  #                    #  #              ###                     ####               ##   #           ##    ##
    //               #    #  #                    ####               #                      #                 #  #  #            #     #
    //  ###    ##   ###   ####   ##   # #    ##   ####   ###  ###    #     ##    ###  # #   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #    #  #  #  #  ####  # ##  #  #  #  #  #  #   #    # ##  #  #  ####  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    #  #  #  #  #  #  ##    #  #  # ##  #  #   #    ##    # ##  #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##  #  #   ##   #  #   ##   #  #   # #  ###    #     ##    # #  #  #  #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                        #                                                                                          ###
    /**
     * Sets the home map team for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The new home map team.
     * @returns {Promise<string[]>} A promise that resolves with the new home map team's home maps.
     */
    static async setHomeMapTeamForChallenge(challenge, team) {

        /**
         * @type {{recordsets: [{Map: string}[]]}}
         */
        const data = await db.query(`
            UPDATE tblChallenge SET HomeMapTeamId = @teamId, UsingHomeMapTeam = 1, Map = NULL WHERE ChallengeId = @challengeId

            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Number
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [];
    }

    //               #    #  #                     ##                                 ###                     ####               ##   #           ##    ##
    //               #    #  #                    #  #                                 #                      #                 #  #  #            #     #
    //  ###    ##   ###   ####   ##   # #    ##    #     ##   ###   # #    ##   ###    #     ##    ###  # #   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #    #  #  #  #  ####  # ##    #   # ##  #  #  # #   # ##  #  #   #    # ##  #  #  ####  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    #  #  #  #  #  #  ##    #  #  ##    #     # #   ##    #      #    ##    # ##  #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##  #  #   ##   #  #   ##    ##    ##   #      #     ##   #      #     ##    # #  #  #  #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                                                     ###
    /**
     * Sets the home server team for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The new home server team.
     * @returns {Promise} A promise that resolves when the home server team has been set.
     */
    static async setHomeServerTeamForChallenge(challenge, team) {
        await db.query("UPDATE tblChallenge SET HomeServerTeamId = @teamId, UsingHomeServerTeam = 1 WHERE ChallengeId = @challengeId", {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //               #    #  #              ####               ##   #           ##    ##
    //               #    ####              #                 #  #  #            #     #
    //  ###    ##   ###   ####   ###  ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #    #  #  #  #  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    #  #  # ##  #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##  #  #   # #  ###   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                #                                                                  ###
    /**
     * Sets the map for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the map has been set.
     */
    static async setMapForChallenge(challenge, map) {
        await db.query("UPDATE tblChallenge SET Map = @map, UsingHomeMapTeam = 0 FROM tblChallenge WHERE ChallengeId = @challengeId", {
            challengeId: {type: Db.INT, value: challenge.id},
            map: {type: Db.VARCHAR(100), value: map}
        });
    }

    //               #    #  #               #                ##     ##                                 ####               ##   #           ##    ##
    //               #    ## #               #                 #    #  #                                #                 #  #  #            #     #
    //  ###    ##   ###   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #    # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #     #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #     #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                                               ###
    /**
     * Confirms a suggested neutral server for a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the suggested neutral map has been confirmed.
     */
    static async setNeutralServerForChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET UsingHomeServerTeam = 0 WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #     ##                           ####               ##   #           ##    ##
    //               #    #  #                          #                 #  #  #            #     #
    //  ###    ##   ###    #     ##    ##   ###    ##   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #      #   #     #  #  #  #  # ##  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    #  #  #     #  #  #     ##    #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##   ##    ##    ##   #      ##   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                               ###
    /**
     * Sets the score of a match.
     * @param {Challenge} challenge The challenge.
     * @param {number} challengingTeamScore The challenging team's score.
     * @param {number} challengedTeamScore The challenged team's score.
     * @returns {Promise} A promise that resolves when the score is set.
     */
    static async setScoreForChallenge(challenge, challengingTeamScore, challengedTeamScore) {
        await db.query(`
            UPDATE tblChallenge SET
                ReportingTeamId = NULL,
                ChallengingTeamScore = @challengingTeamScore,
                ChallengedTeamScore = @challengedTeamScore
            WHERE ChallengeId = @challengeId
        `, {
            challengingTeamScore: {type: Db.INT, value: challengingTeamScore},
            challengedTeamScore: {type: Db.INT, value: challengedTeamScore},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //               #    ###                      ##    #                ####               ##   #           ##    ##
    //               #     #                      #  #                    #                 #  #  #            #     #
    //  ###    ##   ###    #     ##    ###  # #    #    ##    ####   ##   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #     #    # ##  #  #  ####    #    #      #   # ##  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #     #    ##    # ##  #  #  #  #   #     #    ##    #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##   #     ##    # #  #  #   ##   ###   ####   ##   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                 ###
    /**
     * Sets a team size for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {number} size The team size.
     * @returns {Promise} A promise that resolves when the team size has been set.
     */
    static async setTeamSizeForChallenge(challenge, size) {
        await db.query("UPDATE tblChallenge SET TeamSize = @size, , SuggestedTeamSize = NULL, SuggestedTeamSizeTeamId = NULL WHERE ChallengeId = @challengeId", {
            size: {type: Db.INT, value: size},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //               #    ###    #                ####               ##   #           ##    ##
    //               #     #                      #                 #  #  #            #     #
    //  ###    ##   ###    #    ##    # #    ##   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #     #     #    ####  # ##  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #     #     #    #  #  ##    #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##   #    ###   #  #   ##   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                         ###
    /**
     * Sets the time for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Date} date The time of the challenge.
     * @returns {Promise} A promise that resolves when the time has been set.
     */
    static async setTimeForChallenge(challenge, date) {
        await db.query("UPDATE tblChallenge SET MatchTime = @time, SuggestedTime = NULL, SuggestedTimeTeamId = NULL WHERE ChallengeId = @challengeId", {
            challengeId: {type: Db.INT, value: challenge.id},
            date: {type: Db.DATETIME, value: date}
        });
    }

    //               #    ###    #                                        ####              ###    #    ##           #
    //               #     #                                              #                 #  #         #           #
    //  ###    ##   ###    #    ##    # #    ##   ####   ##   ###    ##   ###    ##   ###   #  #  ##     #     ##   ###
    // ##     # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##  #     #  #  #  #  ###    #     #    #  #   #
    //   ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##    #     #  #  #     #      #     #    #  #   #
    // ###     ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##   #      ##   #     #     ###   ###    ##     ##
    /**
     * Sets a pilot's time zone.
     * @param {DiscordJs.GuildMember} member The pilot to set the time zone for.
     * @param {string} timezone The time zone to set.
     * @returns {Promise} A promise that resolves when the time zone is set.
     */
    static async setTimezoneForPilot(member, timezone) {
        await db.query(`
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

    //               #    ###    #                                        ####              ###
    //               #     #                                              #                  #
    //  ###    ##   ###    #    ##    # #    ##   ####   ##   ###    ##   ###    ##   ###    #     ##    ###  # #
    // ##     # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##  #     #  #  #  #   #    # ##  #  #  ####
    //   ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##    #     #  #  #      #    ##    # ##  #  #
    // ###     ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##   #      ##   #      #     ##    # #  #  #
    /**
     * Sets a team's time zone.
     * @param {Team} team The team to set the time zone for.
     * @param {string} timezone The time zone to set.
     * @returns {Promise} A promise that resolves when the time zone is set.
     */
    static async setTimezoneForTeam(team, timezone) {
        await db.query("UPDATE tblTeam SET Timezone = @timezone WHERE TeamId = @teamId", {
            teamId: {type: Db.INT, value: team.id},
            timezone: {type: Db.VARCHAR(50), value: timezone}
        });
    }

    //         #                 #     ##                      #          ###
    //         #                 #    #  #                     #           #
    //  ###   ###    ###  ###   ###   #     ###    ##    ###  ###    ##    #     ##    ###  # #
    // ##      #    #  #  #  #   #    #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    //   ##    #    # ##  #      #    #  #  #     ##    # ##   #    ##     #    ##    # ##  #  #
    // ###      ##   # #  #       ##   ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Begins the process of creating a new team for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot creating a new team.
     * @returns {Promise<{id: number, member: DiscordJs.GuildMember}>} A promise that resolves when the process of creating a new team for the pilot has begun.
     */
    static async startCreateTeam(member) {

        /**
         * @type {{recordsets: [{NewTeamId: number}[]]}}
         */
        const data = await db.query(`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            IF @playerId IS NULL
            BEGIN
                INSERT INTO tblPlayer (DiscordId, Name)
                VALUES (@discordId, @name)

                SET @playerId = SCOPE_IDENTITY()
            END

            INSERT INTO tblNewTeam (PlayerId) VALUES (@playerId)

            SELECT SCOPE_IDENTITY() NewTeamId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(64), value: member.displayName}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].NewTeamId, member} || void 0;
    }

    //                                        #    #  #              ####               ##   #           ##    ##
    //                                        #    ####              #                 #  #  #            #     #
    //  ###   #  #   ###   ###   ##    ###   ###   ####   ###  ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     #  #  #  #  #  #  # ##  ##      #    #  #  #  #  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   #  #   ##    ##   ##      ##    #    #  #  # ##  #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ###  #     #      ##   ###      ##  #  #   # #  ###   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //               ###   ###                                 #                                                                  ###
    /**
     * Suggests a map for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @param {string} map The suggested map.
     * @returns {Promise} A promise that resolves when the map has been suggested.
     */
    static async suggestMapForChallenge(challenge, team, map) {
        await db.query("UPDATE tblChallenge SET SuggestedMap = @map, SuggestedMapTeamId = @teamId WHERE ChallengeId = @challengeId", {
            map: {type: Db.VARCHAR(100), value: map},
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                        #    #  #               #                ##     ##                                 ####               ##   #           ##    ##
    //                                        #    ## #               #                 #    #  #                                #                 #  #  #            #     #
    //  ###   #  #   ###   ###   ##    ###   ###   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     #  #  #  #  #  #  # ##  ##      #    # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   #  #   ##    ##   ##      ##    #    # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #     #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ###  #     #      ##   ###      ##  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #     #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //               ###   ###                                                                                                                                                                ###
    /**
     * Suggests a neutral server for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @returns {Promise} A promise that resolves when the neutral server has been suggested.
     */
    static async suggestNeutralServerForChallenge(challenge, team) {
        await db.query("UPDATE tblChallenge SET SuggestedNeutralServerTeamId = @teamId WHERE ChallengeId = @challengeId", {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                        #    ###                      ##    #                ####               ##   #           ##    ##
    //                                        #     #                      #  #                    #                 #  #  #            #     #
    //  ###   #  #   ###   ###   ##    ###   ###    #     ##    ###  # #    #    ##    ####   ##   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #    # ##  #  #  ####    #    #      #   # ##  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   #  #   ##    ##   ##      ##    #     #    ##    # ##  #  #  #  #   #     #    ##    #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ###  #     #      ##   ###      ##   #     ##    # #  #  #   ##   ###   ####   ##   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //               ###   ###                                                                                                                                  ###
    /**
     * Suggests a team size for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @param {number} size The team size.
     * @returns {Promise} A promise that resolves when the team size has been suggested.
     */
    static async suggestTeamSizeForChallenge(challenge, team, size) {
        await db.query("UPDATE tblChallenge SET SuggestedTeamSize = @size, SuggestedTeamSizeTeamId = @teamId WHERE ChallengeId = @challengeId", {
            size: {type: Db.INT, value: size},
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //                                        #    ###    #                ####               ##   #           ##    ##
    //                                        #     #                      #                 #  #  #            #     #
    //  ###   #  #   ###   ###   ##    ###   ###    #    ##    # #    ##   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #     #    ####  # ##  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   #  #   ##    ##   ##      ##    #     #     #    #  #  ##    #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ###  #     #      ##   ###      ##   #    ###   #  #   ##   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //               ###   ###                                                                                                          ###
    /**
     * Suggests a time for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team issuing the suggestion.
     * @param {Date} date The time.
     * @returns {Promise} A promise that resolves when the time has been suggested.
     */
    static async suggestTimeForChallenge(challenge, team, date) {
        await db.query("UPDATE tblChallenge SET SuggestedTime = @date, SuggestedTimeTeamId = @teamId WHERE ChallengeId = @challengeId", {
            date: {type: Db.DATETIME, value: date},
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //  #                      #  #                ##   ##                #              #  ###                     ###   #      #            ##
    //  #                      #  #               #  #   #                #              #   #                       #    #                  #  #
    // ###    ##    ###  # #   ####   ###   ###   #      #     ##    ##   # #    ##    ###   #     ##    ###  # #    #    ###   ##     ###    #     ##    ###   ###    ##   ###
    //  #    # ##  #  #  ####  #  #  #  #  ##     #      #    #  #  #     ##    # ##  #  #   #    # ##  #  #  ####   #    #  #   #    ##       #   # ##  #  #  ##     #  #  #  #
    //  #    ##    # ##  #  #  #  #  # ##    ##   #  #   #    #  #  #     # #   ##    #  #   #    ##    # ##  #  #   #    #  #   #      ##   #  #  ##    # ##    ##   #  #  #  #
    //   ##   ##    # #  #  #  #  #   # #  ###     ##   ###    ##    ##   #  #   ##    ###   #     ##    # #  #  #   #    #  #  ###   ###     ##    ##    # #  ###     ##   #  #
    /**
     * Checks if one team has clocked another this season.
     * @param {Team} team1 The team to check for clocking.
     * @param {Team} team2 The team to check for being clocked.
     * @returns {Promise<boolean>} A promise that resolves with whether a team has clocked another this season.
     */
    static async teamHasClockedTeamThisSeason(team1, team2) {

        // TODO: Check season, not full history.
        /**
         * @type {{recordsets: [{HasClocked: boolean}[]]}}
         */
        const data = await db.query(`
            SELECT CAST(CASE WHEN COUNT(ChallengeId) > 0 THEN 1 ELSE 0 END AS BIT) HasClocked
            FROM tblChallenge
            WHERE ClockTeamId = @team1Id
                AND (ChallengingTeamId = @team2Id OR ChallengedTeamId = @team2Id)
                AND Voided IS NULL
        `, {
            team1id: {type: Db.INT, value: team1.id},
            team2id: {type: Db.INT, value: team2.id}
        });
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].HasClocked || false;
    }

    //             ##                #      ##   #           ##    ##
    //              #                #     #  #  #            #     #
    // #  #  ###    #     ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #   #    #  #  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #  #  #   #    #  #  #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ###  #  #  ###    ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                ###
    /**
     * Unlocks a challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the challenge is unlocked.
     */
    static async unlockChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET AdminCreated = 0 WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                          #       #   ##   #           ##    ##
    //                                  #  #  #  #            #     #
    // #  #  ###   # #    ##   ##     ###  #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #  # #   #  #   #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #  #  #  # #   #  #   #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ###  #  #   #     ##   ###    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                ###
    /**
     * Unvoids a challenge.
     * @param {Challenge} challenge The challenge to unvoid.
     * @returns {Promise} A promise that resolves when the challenge is unvoided.
     */
    static async unvoidChallenge(challenge) {
        await db.query("UPDATE tblChallenge SET DateVoided = NULL WHERE ChallengeId = @challengeId", {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                #         #          #  #
    //                #         #          ## #
    // #  #  ###    ###   ###  ###    ##   ## #   ###  # #    ##
    // #  #  #  #  #  #  #  #   #    # ##  # ##  #  #  ####  # ##
    // #  #  #  #  #  #  # ##   #    ##    # ##  # ##  #  #  ##
    //  ###  ###    ###   # #    ##   ##   #  #   # #  #  #   ##
    //       #
    /**
     * Updates a pilot's name.
     * @param {DiscordJs.GuildMember} member The guild member with their updated name.
     * @returns {Promise} A promise that resolves when the name has been updated.
     */
    static async updateName(member) {
        await db.query("UPDATE tblPlayer SET Name = @name WHERE DiscordId = @discordId", {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(64), value: member.displayName}
        });
    }

    //              #       #   ##   #           ##    ##
    //                      #  #  #  #            #     #
    // # #    ##   ##     ###  #     ###    ###   #     #     ##   ###    ###   ##
    // # #   #  #   #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // # #   #  #   #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  #     ##   ###    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                    ###
    /**
     * Voids a challenge.
     * @param {Challenge} challenge The challenge to void.
     * @returns {Promise} A promise that resolves when the challenge is voided.
     */
    static async voidChallenge(challenge) {
        await db.query(`
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
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //              #       #   ##   #           ##    ##                            #  #   #     #    #     ###                     ##     #     #
    //                      #  #  #  #            #     #                            #  #         #    #     #  #                     #     #
    // # #    ##   ##     ###  #     ###    ###   #     #     ##   ###    ###   ##   #  #  ##    ###   ###   #  #   ##   ###    ###   #    ###   ##     ##    ###
    // # #   #  #   #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  ####   #     #    #  #  ###   # ##  #  #  #  #   #     #     #    # ##  ##
    // # #   #  #   #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##    ####   #     #    #  #  #     ##    #  #  # ##   #     #     #    ##      ##
    //  #     ##   ###    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##   #  #  ###     ##  #  #  #      ##   #  #   # #  ###     ##  ###    ##   ###
    //                                                                    ###
    /**
     * Voids a challenge and assesses penalties.
     * @param {Challenge} challenge The challenge to void.
     * @param {Team[]} teams The teams to assess penalties to.
     * @returns {Promise} A promise that resolves when the challenge is voided and penalties are assessed.
     */
    static async voidChallengeWithPenalties(challenge, teams) {
        // TODO: Actually return data.
        const params = {challengeId: {type: Db.INT, value: challenge.id}};
        let sql = `
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
        `;

        teams.forEach((team, index) => {
            params[`team${index}Id`] = {type: Db.INT, value: team.id};

            sql = `${sql}
                IF (SELECT TOP 1 1 FROM tblTeamPenalty WHERE TeamId = @team${index}Id)
                BEGIN
                    INSERT INTO tblLeadershipPenalty
                    (PlayerId, DatePenalized)
                    SELECT PlayerId, GETUTCDATE()
                    FROM tblRoster
                    WHERE TeamId = @team${index}Id
                        AND (Founder = 1 OR Captain = 1)

                    UPDATE tblTeam SET Disbanded = 1 WHERE TeamId = @team${index}Id

                    DELETE FROM cs
                    FROM tblChallengeStreamer cs
                    INNER JOIN tblChallenge c ON cs.ChallengeId = c.ChallengeId
                    WHERE c.DateConfirmed IS NULL
                        AND c.DateVoided IS NULL
                        AND cs.PlayerId IN (SELECT PlayerId FROM tblRoster WHERE TeamId = @team${index}Id)

                    DELETE FROM tblRoster WHERE TeamId = @team${index}Id
                    DELETE FROM tblRequest WHERE TeamId = @team${index}Id
                    DELETE FROM tblInvite WHERE TeamId = @team${index}Id
                END
                ELSE
                BEGIN
                    INSERT INTO tblTeamPenalty
                    (TeamId, PenaltiesRemaining, DatePenalized)
                    VALUES (@team${index}Id, 3, GETUTCDATE())
                END
            `;
        });

        await db.query(sql, params);
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
        const data = await db.query(`
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

module.exports = Database;
