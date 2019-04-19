/**
 * @typedef {import("./challenge")} Challenge
 * @typedef {{id?: number, challengingTeamId: number, challengedTeamId: number}} ChallengeData
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("./newTeam")} NewTeam
 * @typedef {{id: number, member: DiscordJs.GuildMember, name?: string, tag?: string}} NewTeamData
 * @typedef {import("./team")} Team
 * @typedef {{member?: DiscordJs.GuildMember, id: number, name: string, tag: string, isFounder?: boolean, disbanded?: boolean, locked?: boolean}} TeamData
 * @typedef {{homes: string[], members: {name: string, role: string}[], requests: {name: string, date: Date}[], invites: {name: string, date: Date}[], penaltiesRemaining: number}} TeamInfo
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
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            UPDATE tblChallenge SET CasterPlayerId = @playerId WHERE ChallengeId = @challengeId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
    }

    //          #     #  ####                     #
    //          #     #  #                        #
    //  ###   ###   ###  ###   # #    ##   ###   ###
    // #  #  #  #  #  #  #     # #   # ##  #  #   #
    // # ##  #  #  #  #  #     # #   ##    #  #   #
    //  # #   ###   ###  ####   #     ##   #  #    ##
    /**
     * Adds an event.
     * @param {string} title The title of the event.
     * @param {Date} dateStart The start of the event.
     * @param {Date} dateEnd The end of the event.
     * @returns {Promise} A promise that resolves when the event is added.
     */
    static async addEvent(title, dateStart, dateEnd) {
        await db.query(/* sql */`
            INSERT INTO tblEvent (Title, DateStart, DateEnd) VALUES (@title, @dateStart, @dateEnd)
        `, {
            title: {type: Db.VARCHAR(200), value: title},
            dateStart: {type: Db.DATETIME, value: dateStart},
            dateEnd: {type: Db.DATETIME, value: dateEnd}
        });
    }

    //          #     #  #  #
    //          #     #  ####
    //  ###   ###   ###  ####   ###  ###
    // #  #  #  #  #  #  #  #  #  #  #  #
    // # ##  #  #  #  #  #  #  # ##  #  #
    //  # #   ###   ###  #  #   # #  ###
    //                               #
    /**
     * Adds a map to the database.
     * @param {string} map The map to add.
     * @param {boolean} [stock] Whether or not this is a stock map.
     * @returns {Promise} A promise that resolves when the map has been added.
     */
    static async addMap(map, stock) {
        await db.query(/* sql */`
            INSERT INTO tblAllowedMap (Map, Stock) VALUES (@map, @stock)
        `, {
            map: {type: Db.VARCHAR(100), value: map},
            stock: {type: Db.BIT, value: !!stock}
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
        await db.query(/* sql */`
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
        await db.query(/* sql */`
            UPDATE tblNewTeam SET Name = @name WHERE NewTeamId = @newTeamId
        `, {name: {type: Db.VARCHAR(25), value: name}, newTeamId: {type: Db.INT, value: newTeam.id}});
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
        await db.query(/* sql */`
            UPDATE tblNewTeam SET Tag = @tag WHERE NewTeamId = @newTeamId
        `, {tag: {type: Db.VARCHAR(25), value: tag}, newTeamId: {type: Db.INT, value: newTeam.id}});
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
        await db.query(/* sql */`
            DELETE FROM tblNewTeam WHERE NewTeamId = @newTeamId
        `, {newTeamId: {type: Db.INT, value: newTeam.id}});
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
        const data = await db.query(/* sql */`
            UPDATE tblChallenge SET DateClocked = GETUTCDATE(), DateClockDeadline = DATEADD(DAY, 28, GETUTCDATE()), ClockTeamId = @teamId, DateClockDeadlineNotified = NULL WHERE ChallengeId = @challengeId

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
        await db.query(/* sql */`
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
            `, {challengeId: {type: Db.INT, value: challenge.id}});
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET Map = SuggestedMap, UsingHomeMapTeam = 0 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
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
        const data = await db.query(/* sql */`
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET TeamSize = SuggestedTeamSize, SuggestedTeamSize = NULL, SuggestedTeamSizeTeamId = NULL WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET MatchTime = SuggestedTime, SuggestedTime = NULL, SuggestedTimeTeamId = NULL, DateMatchTimeNotified = NULL, DateMatchTimePassedNotified = NULL WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
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
     * @param {Team} [homeMapTeam] The home map team.
     * @param {Team} [homeServerTeam] The home server team.
     * @param {number} [teamSize] The team size.
     * @param {boolean} [startNow] Whether to start the match now.
     * @returns {Promise<{id: number, orangeTeam: Team, blueTeam: Team, homeMapTeam: Team, homeServerTeam: Team, team1Penalized: boolean, team2Penalized: boolean}>} A promise that resolves with the challenge ID.
     */
    static async createChallenge(team1, team2, adminCreated, homeMapTeam, homeServerTeam, teamSize, startNow) {
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
                    AND DateConfirmed IS NOT NULL
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

            SELECT @teamId TeamId
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
     * @returns {Promise<number[]>} A promise that resolves with the list of challenge IDs that need to be voided due to the team being disbanded.
     */
    static async disbandTeam(team) {

        /**
         * @type {{recordsets: [{ChallengeId: number}[]]}}
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
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.ChallengeId) || [];
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
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateClockDeadline || void 0;
    }

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

    //              #     ##               ###                     ###         #  #                     ##         ###
    //              #    #  #               #                      #  #        ## #                    #  #         #
    //  ###   ##   ###   #  #  ###   #  #   #     ##    ###  # #   ###   #  #  ## #   ###  # #    ##   #  #  ###    #     ###   ###
    // #  #  # ##   #    ####  #  #  #  #   #    # ##  #  #  ####  #  #  #  #  # ##  #  #  ####  # ##  #  #  #  #   #    #  #  #  #
    //  ##   ##     #    #  #  #  #   # #   #    ##    # ##  #  #  #  #   # #  # ##  # ##  #  #  ##    #  #  #      #    # ##   ##
    // #      ##     ##  #  #  #  #    #    #     ##    # #  #  #  ###     #   #  #   # #  #  #   ##    ##   #      #     # #  #
    //  ###                           #                                   #                                                     ###
    /**
     * Gets a team by name or tag.
     * @param {string} text The name or tag of the team.
     * @returns {Promise<TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getAnyTeamByNameOrTag(text) {

        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT TeamId, Name, Tag, Disbanded, Locked FROM tblTeam WHERE Name = @text OR Tag = @text
        `, {text: {type: Db.VARCHAR(25), value: text}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, disbanded: !!data.recordsets[0][0].Disbanded, locked: !!data.recordsets[0][0].Locked} || void 0;
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

    //              #     ##                 #             #   ##   #           ##    ##                            ###      #         ####              ###    #    ##           #
    //              #    #  #                #             #  #  #  #            #     #                             #       #         #                 #  #         #           #
    //  ###   ##   ###   #      ###   ###   ###    ##    ###  #     ###    ###   #     #     ##   ###    ###   ##    #     ###   ###   ###    ##   ###   #  #  ##     #     ##   ###
    // #  #  # ##   #    #     #  #  ##      #    # ##  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    #  #  ##     #     #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #    #  #  # ##    ##    #    ##    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #    #  #    ##   #     #  #  #     #      #     #    #  #   #
    // #      ##     ##   ##    # #  ###      ##   ##    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    ###  ###    #      ##   #     #     ###   ###    ##     ##
    //  ###                                                                                              ###
    /**
     * Gets the challenge IDs for the matches the pilot is casting.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @returns {Promise<number[]>} A promise that resolves with the list of challenge IDs they are casting.
     */
    static async getCastedChallengeIdsForPilot(pilot) {

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
        const data = await db.query(/* sql */`
            SELECT ChallengeId, ChallengingTeamId, ChallengedTeamId FROM tblChallenge WHERE ChallengeId = @id
        `, {id: {type: Db.INT, value: id}});
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
        const data = await db.query(/* sql */`
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

    //              #     ##   #           ##    ##                            ###          #          ####               ##                 #
    //              #    #  #  #            #     #                            #  #         #          #                 #  #                #
    //  ###   ##   ###   #     ###    ###   #     #     ##   ###    ###   ##   #  #   ###  ###    ###  ###    ##   ###   #      ###   ###   ###
    // #  #  # ##   #    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  #  #   #    #  #  #     #  #  #  #  #     #  #  ##      #
    //  ##   ##     #    #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  # ##   #    # ##  #     #  #  #     #  #  # ##    ##    #
    // #      ##     ##   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    # #    ##   # #  #      ##   #      ##    # #  ###      ##
    //  ###                                                         ###
    /**
     * Gets challenge data for use in casting.
     * @param {Challenge} challenge The challenge being cast.
     * @returns {Promise<{data: {challengingTeamWins: number, challengingTeamLosses: number, challengingTeamTies: number, challengingTeamRating: number, challengedTeamWins: number, challengedTeamLosses: number, challengedTeamTies: number, challengedTeamRating: number, challengingTeamHeadToHeadWins: number, challengedTeamHeadToHeadWins: number, headToHeadTies: number, challengingTeamId: number, challengingTeamScore: number, challengedTeamId: number, challengedTeamScore: number, map: string, matchTime: Date, name: string, teamId: number, kills: number, assists: number, deaths: number}, challengingTeamRoster: {name: string, games: number, kills: number, assists: number, deaths: number, twitchName: string}[], challengedTeamRoster: {name: string, games: number, kills: number, assists: number, deaths: number, twitchName: string}[]}>} A promise that resolves with the challenge data.
     */
    static async getChallengeDataForCast(challenge) {

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
     * @returns {Promise<{title: string, orangeTeamId: number, blueTeamId: number, map: string, teamSize: number, matchTime: Date, postseason: boolean, homeMapTeamId: number, homeServerTeamId: number, adminCreated: boolean, homesLocked: boolean, usingHomeMapTeam: boolean, usingHomeServerTeam: boolean, challengingTeamPenalized: boolean, challengedTeamPenalized: boolean, suggestedMap: string, suggestedMapTeamId: number, suggestedNeutralServerTeamId: number, suggestedTeamSize: number, suggestedTeamSizeTeamId: number, suggestedTime: Date, suggestedTimeTeamId: number, reportingTeamId: number, challengingTeamScore: number, challengedTeamScore: number, casterDiscordId: string, dateAdded: Date, dateClocked: Date, clockTeamId: number, dateClockDeadline: Date, dateClockDeadlineNotified: Date, dateReported: Date, dateConfirmed: Date, dateClosed: Date, dateRematchRequested: Date, rematchTeamId: number, dateRematched: Date, dateVoided: Date, overtimePeriods: number, homeMaps: string[]}>} A promise that resolves with the challenge details.
     */
    static async getChallengeDetails(challenge) {

        /**
         * @type {{recordsets: [{Title: string, OrangeTeamId: number, BlueTeamId: number, Map: string, TeamSize: number, MatchTime: Date, Postseason: boolean, HomeMapTeamId: number, HomeServerTeamId: number, AdminCreated: boolean, HomesLocked: boolean, UsingHomeMapTeam: boolean, UsingHomeServerTeam: boolean, ChallengingTeamPenalized: boolean, ChallengedTeamPenalized: boolean, SuggestedMap: string, SuggestedMapTeamId: number, SuggestedNeutralServerTeamId: number, SuggestedTeamSize: number, SuggestedTeamSizeTeamId: number, SuggestedTime: Date, SuggestedTimeTeamId: number, ReportingTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, DateAdded: Date, DateClocked: Date, ClockTeamId: number, DiscordId: string, DateClockDeadline: Date, DateClockDeadlineNotified: Date, DateReported: Date, DateConfirmed: Date, DateClosed: Date, DateRematchRequested: Date, RematchTeamId: number, DateRematched: Date, OvertimePeriods: number, DateVoided: Date}[], {Map: string}[]]}}
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
                c.OvertimePeriods
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
        const data = await db.query(/* sql */`
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
        const data = await db.query(/* sql */`
            SELECT DATEADD(DAY, 28, MAX(DateClocked)) NextDate FROM tblChallenge WHERE ClockTeamId = @teamId AND DateVoided IS NULL
        `, {teamId: {type: Db.INT, value: team.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].NextDate || void 0;
    }

    //              #    ###                  #   #                #  #         #          #
    //              #    #  #                 #                    ####         #          #
    //  ###   ##   ###   #  #   ##   ###    ###  ##    ###    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  # ##   #    ###   # ##  #  #  #  #   #    #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    //  ##   ##     #    #     ##    #  #  #  #   #    #  #   ##   #  #  # ##   #    #     #  #  ##      ##
    // #      ##     ##  #      ##   #  #   ###  ###   #  #  #     #  #   # #    ##   ##   #  #   ##   ###
    //  ###                                                   ###
    /**
     * Gets the pending matches, plus the number of completed matches for the season.
     * @param {number} [season] The season number, or void for the latest season.
     * @returns {Promise<{matches: {challengeId: number, title: string, challengingTeamId: number, challengedTeamId: number, matchTime: Date, map: string, twitchName: string}[], standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[], completed: number}>} A promise that resolves with the season's matches.
     */
    static async getPendingMatches(season) {

        /**
         * @type {{recordsets: [{ChallengeId: number, Title: string, ChallengingTeamId: number, ChallengedTeamId: number, MatchTime: Date, Map: string, TwitchName: string}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[], {Completed: number}[]]}}
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
                c.ChallengeId,
                c.Title,
                c.ChallengingTeamId,
                c.ChallengedTeamId,
                c.MatchTime,
                c.Map,
                p.TwitchName
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
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore > c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore > c.ChallengingTeamScore))) Wins,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND ((c.ChallengingTeamId = t.TeamId AND c.ChallengingTeamScore < c.ChallengedTeamScore) OR (c.ChallengedTeamId = t.TeamId AND c.ChallengedTeamScore < c.ChallengingTeamScore))) Losses,
                    (SELECT COUNT(*) FROM vwCompletedChallenge c WHERE c.Season = @season AND (c.ChallengingTeamId = t.TeamId OR c.ChallengedTeamId = t.TeamId) AND c.ChallengedTeamScore = c.ChallengingTeamScore) Ties
                FROM tblTeam t
                LEFT OUTER JOIN tblTeamRating tr ON t.TeamId = tr.TeamId AND tr.Season = @season
            ) a

            SELECT COUNT(ChallengeId) Completed
            FROM vwCompletedChallenge
            WHERE MatchTime IS NOT NULL
                AND Season = @season
                AND DateVoided IS NULL
                AND DateConfirmed IS NOT NULL
        `, {season: {type: Db.INT, value: season}});

        return data && data.recordsets && data.recordsets.length === 3 && {
            matches: data.recordsets[0].map((row) => ({
                challengeId: row.ChallengeId,
                title: row.Title,
                challengingTeamId: row.ChallengingTeamId,
                challengedTeamId: row.ChallengedTeamId,
                matchTime: row.MatchTime,
                map: row.Map,
                twitchName: row.TwitchName
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
            completed: data.recordsets[2] && data.recordsets[2][0] && data.recordsets[2][0].Completed || 0
        } || {matches: [], standings: [], completed: 0};
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
     * @returns {Promise<{matches: {challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number}[], k: number}>} A promise that resolves with the season data.
     */
    static async getSeasonDataFromChallenge(challenge) {

        /**
         * @type {{recordsets: [{ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number}[], {K: number}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @matchTime DATETIME
            DECLARE @k FLOAT
            DECLARE @season INT

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
                END

                SELECT @k = K, @season = Season FROM tblSeason WHERE DateStart <= @matchTime And DateEnd >= @matchTime

                SELECT
                    ChallengingTeamId,
                    ChallengedTeamId,
                    ChallengingTeamScore,
                    ChallengedTeamScore
                FROM vwCompletedChallenge
                WHERE Season = @season
                    AND Postseason = 0
                ORDER BY MatchTime, ChallengeId

                SELECT @k K
            END
        `, {challengeId: {type: Db.INT, value: challenge.id}});
        return data && data.recordsets && data.recordsets.length === 2 && {
            matches: data.recordsets[0] && data.recordsets[0].map((row) => ({
                challengingTeamId: row.ChallengingTeamId,
                challengedTeamId: row.ChallengedTeamId,
                challengingTeamScore: row.ChallengingTeamScore,
                challengedTeamScore: row.ChallengedTeamScore
            })) || [],
            k: data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].K || 32
        } || void 0;
    }

    //              #     ##                                  #  #         #          #                  ###         ###
    //              #    #  #                                 ####         #          #                  #  #        #  #
    //  ###   ##   ###    #     ##    ###   ###    ##   ###   ####   ###  ###    ##   ###    ##    ###   ###   #  #  #  #   ###   ###   ##
    // #  #  # ##   #      #   # ##  #  #  ##     #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##     #  #  #  #  ###   #  #  #  #  # ##
    //  ##   ##     #    #  #  ##    # ##    ##   #  #  #  #  #  #  # ##   #    #     #  #  ##      ##   #  #   # #  #     # ##   ##   ##
    // #      ##     ##   ##    ##    # #  ###     ##   #  #  #  #   # #    ##   ##   #  #   ##   ###    ###     #   #      # #  #      ##
    //  ###                                                                                                     #                 ###
    /**
     * Gets the matches for the specified season by page number.
     * @param {number} [season] The season number, or void for the latest season.
     * @param {number} [page] The page number, or void for the first page.
     * @returns {Promise<{completed: {challengeId: number, title: string, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number}[], stats: {challengeId: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, kills: number, assists: number, deaths: number}[], standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}[]}>} A promise that resolves with the season's matches for the specified page.
     */
    static async getSeasonMatchesByPage(season, page) {

        /**
         * @type {{recordsets: [{ChallengeId: number, Title: string, ChallengingTeamId: number, ChallengedTeamId: number, ChallengingTeamScore: number, ChallengedTeamScore: number, MatchTime: Date, Map: string, DateClosed: Date, OvertimePeriods: number}[], {ChallengeId: number, TeamId: number, Tag: string, TeamName: string, PlayerId: number, Name: string, Kills: number, Assists: number, Deaths: number}[], {TeamId: number, Name: string, Tag: string, Disbanded: boolean, Locked: boolean, Rating: number, Wins: number, Losses: number, Ties: number}[]]}}
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
                ChallengeId,
                Title,
                ChallengingTeamId,
                ChallengedTeamId,
                ChallengingTeamScore,
                ChallengedTeamScore,
                MatchTime,
                Map,
                DateClosed,
                OvertimePeriods
            FROM (
                SELECT *, ROW_NUMBER() OVER (ORDER BY MatchTime DESC) Row
                FROM vwCompletedChallenge
                WHERE MatchTime IS NOT NULL
                    AND Season = @season
                    AND DateVoided IS NULL
                    AND DateConfirmed IS NOT NULL
            ) c
            WHERE Row >= @page * 10 - 9
                AND Row <= @page * 10
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
                s.Deaths
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
            WHERE Row >= @page * 10 - 9
                AND Row <= @page * 10

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
        `, {
            season: {type: Db.INT, value: season},
            page: {type: Db.INT, value: page}
        });
        return data && data.recordsets && data.recordsets.length === 3 && {
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
                overtimePeriods: row.OvertimePeriods
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
                deaths: row.Deaths
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
    }

    //              #     ##    #           #           ####              ###    #    ##           #
    //              #    #  #   #           #           #                 #  #         #           #
    //  ###   ##   ###    #    ###    ###  ###    ###   ###    ##   ###   #  #  ##     #     ##   ###
    // #  #  # ##   #      #    #    #  #   #    ##     #     #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #    #  #   #    # ##   #      ##   #     #  #  #     #      #     #    #  #   #
    // #      ##     ##   ##     ##   # #    ##  ###    #      ##   #     #     ###   ###    ##     ##
    //  ###
    /**
     * Gets the season stats for the specified pilot.
     * @param {DiscordJs.GuildMember} pilot The pilot to get stats for.
     * @returns {Promise<{playerId: number, name: string, tag: string, games: number, kills: number, assists: number, deaths: number}>} A promise that resolves with the player's stats.
     */
    static async getStatsForPilot(pilot) {

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

    //              #     ##    #                                               ####               ##   #           ##    ##
    //              #    #  #   #                                               #                 #  #  #            #     #
    //  ###   ##   ###    #    ###   ###    ##    ###  # #    ##   ###    ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  # ##   #      #    #    #  #  # ##  #  #  ####  # ##  #  #  ##     #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //  ##   ##     #    #  #   #    #     ##    # ##  #  #  ##    #       ##   #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #      ##     ##   ##     ##  #      ##    # #  #  #   ##   #     ###    #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //  ###                                                                                                                                  ###
    /**
     * Gets the pilots who will be streaming the challenge.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise<{discordId: string, twitchName: string}[]>} A promise that resolves with the list of streamers for the challenge.
     */
    static async getStreamersForChallenge(challenge) {

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
        const data = await db.query(/* sql */`
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
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            SELECT TeamId, Name, Tag, CASE WHEN EXISTS(SELECT TOP 1 1 FROM tblRoster WHERE Founder = 1 AND PlayerId = @playerId) THEN 1 ELSE 0 END IsFounder, Locked
            FROM tblTeam
            WHERE TeamId IN (SELECT TeamId FROM tblRoster WHERE PlayerId = @playerId)
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {member, id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, isFounder: !!data.recordsets[0][0].IsFounder, locked: !!data.recordsets[0][0].Locked} || void 0;
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
        const data = await db.query(/* sql */`
            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Number
        `, {teamId: {type: Db.INT, value: team.id}});
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
         * @type {{recordsets: [{Map: string}[], {Name: string, Captain: boolean, Founder: boolean}[], {Name: string, DateRequested: Date}[], {Name: string, DateInvited: Date}[], {PenaltiesRemaining: number}[]]}}
         */
        const data = await db.query(/* sql */`
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

            SELECT PenaltiesRemaining FROM tblTeamPenalty WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: team.id}});
        return {
            homes: data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || [],
            members: data && data.recordsets && data.recordsets[1] && data.recordsets[1].map((row) => ({name: row.Name, role: row.Captain ? "Captain" : row.Founder ? "Founder" : void 0})) || [],
            requests: data && data.recordsets && data.recordsets[2] && data.recordsets[2].map((row) => ({name: row.Name, date: row.DateRequested})) || [],
            invites: data && data.recordsets && data.recordsets[3] && data.recordsets[3].map((row) => ({name: row.Name, date: row.DateInvited})) || [],
            penaltiesRemaining: data && data.recordsets && data.recordsets[4] && data.recordsets[4][0] && data.recordsets[4][0].PenaltiesRemaining || void 0
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
        const data = await db.query(/* sql */`
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
        const data = await db.query(/* sql */`
            SELECT COUNT(*) Members FROM tblRoster WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: team.id}});
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
        const data = await db.query(/* sql */`
            SELECT Timezone FROM tblPlayer WHERE DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
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
        const data = await db.query(/* sql */`
            SELECT Timezone FROM tblTeam WHERE TeamId = @teamId
        `, {teamId: {type: Db.INT, value: team.id}});
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
        const data = await db.query(/* sql */`
            SELECT TwitchName FROM tblPlayer WHERE DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].TwitchName || void 0;
    }

    //              #    #  #                     #     #      #    #             #  ####               #                   #   ##   ##                #
    //              #    #  #                     #           # #                 #  #                                      #  #  #   #                #
    //  ###   ##   ###   #  #  ###   ###    ##   ###   ##     #    ##     ##    ###  ###   #  #  ###   ##    ###    ##    ###  #      #     ##    ##   # #    ###
    // #  #  # ##   #    #  #  #  #  #  #  #  #   #     #    ###    #    # ##  #  #  #      ##   #  #   #    #  #  # ##  #  #  #      #    #  #  #     ##    ##
    //  ##   ##     #    #  #  #  #  #  #  #  #   #     #     #     #    ##    #  #  #      ##   #  #   #    #     ##    #  #  #  #   #    #  #  #     # #     ##
    // #      ##     ##   ##   #  #  #  #   ##     ##  ###    #    ###    ##    ###  ####  #  #  ###   ###   #      ##    ###   ##   ###    ##    ##   #  #  ###
    //  ###                                                                                      #
    /**
     * Gets challenges with expired clocks that have not been notified yet.
     * @returns {Promise<number[]>} A promise that resolves with the list of challenge IDs that need notifying.
     */
    static async getUnnotifiedExpiredClocks() {

        /**
         * @type {{recordsets: [{ChallengeId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT ChallengeId
            FROM tblChallenge
            WHERE DateClockDeadline < GETUTCDATE()
                AND DateClockDeadlineNotified IS NULL
                AND DateClosed IS NULL
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.ChallengeId) || [];
    }

    //              #    #  #                     #     #      #    #             #  #  #   #                           #  #  #         #          #
    //              #    #  #                     #           # #                 #  ####                               #  ####         #          #
    //  ###   ##   ###   #  #  ###   ###    ##   ###   ##     #    ##     ##    ###  ####  ##     ###    ###    ##    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  # ##   #    #  #  #  #  #  #  #  #   #     #    ###    #    # ##  #  #  #  #   #    ##     ##     # ##  #  #  #  #  #  #   #    #     #  #  # ##  ##
    //  ##   ##     #    #  #  #  #  #  #  #  #   #     #     #     #    ##    #  #  #  #   #      ##     ##   ##    #  #  #  #  # ##   #    #     #  #  ##      ##
    // #      ##     ##   ##   #  #  #  #   ##     ##  ###    #    ###    ##    ###  #  #  ###   ###    ###     ##    ###  #  #   # #    ##   ##   #  #   ##   ###
    //  ###
    /**
     * Gets unconfirmed challenges with starting times that happened an hour ago that have not been notified yet.
     * @returns {Promise<number[]>} A promise that resolves with the list of challenge IDs that need notifying.
     */
    static async getUnnotifiedMissedMatches() {

        /**
         * @type {{recordsets: [{ChallengeId: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT ChallengeId
            FROM tblChallenge
            WHERE MatchTime <= DATEADD(HOUR, -1, GETUTCDATE())
                AND DateMatchTimePassedNotified IS NULL
                AND DateConfirmed IS NULL
                AND DateVoided IS NULL
                AND DateClosed IS NULL
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.ChallengeId) || [];
    }

    //              #    #  #                     #     #      #    #             #   ##    #                 #     #                #  #         #          #
    //              #    #  #                     #           # #                 #  #  #   #                 #                      ####         #          #
    //  ###   ##   ###   #  #  ###   ###    ##   ###   ##     #    ##     ##    ###   #    ###    ###  ###   ###   ##    ###    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  # ##   #    #  #  #  #  #  #  #  #   #     #    ###    #    # ##  #  #    #    #    #  #  #  #   #     #    #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    //  ##   ##     #    #  #  #  #  #  #  #  #   #     #     #     #    ##    #  #  #  #   #    # ##  #      #     #    #  #   ##   #  #  # ##   #    #     #  #  ##      ##
    // #      ##     ##   ##   #  #  #  #   ##     ##  ###    #    ###    ##    ###   ##     ##   # #  #       ##  ###   #  #  #     #  #   # #    ##   ##   #  #   ##   ###
    //  ###                                                                                                                     ###
    /**
     * Gets challenges with starting times happening within 30 minutes that have not been notified yet.
     * @returns {Promise<{challengeId: number, matchTime: Date}[]>} A promise that resolves with the list of challenge IDs that need notifying.
     */
    static async getUnnotifiedStartingMatches() {

        /**
         * @type {{recordsets: [{ChallengeId: number, MatchTime: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT ChallengeId, MatchTime
            FROM tblChallenge
            WHERE MatchTime <= DATEADD(MINUTE, 30, GETUTCDATE())
                AND DateMatchTimeNotified IS NULL
                AND DateConfirmed IS NULL
                AND DateVoided IS NULL
                AND DateClosed IS NULL
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({challengeId: row.ChallengeId, matchTime: row.MatchTime})) || [];
    }

    //              #    #  #                           #                ####                     #
    //              #    #  #                                            #                        #
    //  ###   ##   ###   #  #  ###    ##    ##   # #   ##    ###    ###  ###   # #    ##   ###   ###    ###
    // #  #  # ##   #    #  #  #  #  #     #  #  ####   #    #  #  #  #  #     # #   # ##  #  #   #    ##
    //  ##   ##     #    #  #  #  #  #     #  #  #  #   #    #  #   ##   #     # #   ##    #  #   #      ##
    // #      ##     ##   ##   ###    ##    ##   #  #  ###   #  #  #     ####   #     ##   #  #    ##  ###
    //  ###                    #                                    ###
    /**
     * Gets the upcoming scheduled events.
     * @returns {Promise<{title: string, dateStart: Date, dateEnd: Date}[]>} A promise that resolves with the upcoming events.
     */
    static async getUpcomingEvents() {

        /**
         * @type {{recordsets: [{Title: string, DateStart: Date, DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Title, DateStart, DateEnd
            FROM tblEvent
            WHERE (DateStart >= GETUTCDATE() AND DateStart <= DATEADD(DAY, 28, GETUTCDATE())) OR (DateStart < GETUTCDATE() AND DateEnd > GETUTCDATE())
            ORDER BY
                CASE WHEN DateStart < GETUTCDATE() THEN 0 ELSE 1 END,
                CASE WHEN DateStart < GETUTCDATE() THEN DateStart ELSE DateEnd END
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            title: row.Title,
            dateStart: row.DateStart,
            dateEnd: row.DateEnd
        })) || [];
    }

    //              #    #  #                           #                #  #         #          #
    //              #    #  #                                            ####         #          #
    //  ###   ##   ###   #  #  ###    ##    ##   # #   ##    ###    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  # ##   #    #  #  #  #  #     #  #  ####   #    #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    //  ##   ##     #    #  #  #  #  #     #  #  #  #   #    #  #   ##   #  #  # ##   #    #     #  #  ##      ##
    // #      ##     ##   ##   ###    ##    ##   #  #  ###   #  #  #     #  #   # #    ##   ##   #  #   ##   ###
    //  ###                    #                                    ###
    /**
     * Gets the upcoming scheduled matches.
     * @returns {Promise<{challengeId: number, challengingTeamTag: string, challengingTeamName: string, challengedTeamTag: string, challengedTeamName: string, matchTime: Date, map: string, twitchName: string}[]>} A promise that resolves with the upcoming matches.
     */
    static async getUpcomingMatches() {

        /**
         * @type {{recordsets: [{ChallengeId: number, ChallengingTeamTag: string, ChallengingTeamName: string, ChallengedTeamTag: string, ChallengedTeamName: string, MatchTime: Date, Map: string, TwitchName: string}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT c.ChallengeId,
                t1.Tag ChallengingTeamTag,
                t1.Name ChallengingTeamName,
                t2.Tag ChallengedTeamTag,
                t2.Name ChallengedTeamName,
                c.MatchTime,
                c.Map,
                p.TwitchName
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
            twitchName: row.TwitchName
        })) || [];
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET AdminCreated = 1 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
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

    //              #     #      #          ##   ##                #     ####               #                   #  ####               ##   #           ##    ##
    //              #           # #        #  #   #                #     #                                      #  #                 #  #  #            #     #
    // ###    ##   ###   ##     #    #  #  #      #     ##    ##   # #   ###   #  #  ###   ##    ###    ##    ###  ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #   #     #    ###   #  #  #      #    #  #  #     ##    #      ##   #  #   #    #  #  # ##  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #  #  #   #     #     #     # #  #  #   #    #  #  #     # #   #      ##   #  #   #    #     ##    #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #  #   ##     ##  ###    #      #    ##   ###    ##    ##   #  #  ####  #  #  ###   ###   #      ##    ###  #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                #                                              #                                                                                          ###
    /**
     * Records the notification for a clock deadline expiration.
     * @param {Challenge} challenge The challenge with the expired clock deadline.
     * @returns {Promise} A promise that resolves when the notification has been recorded.
     */
    static async notifyClockExpiredForChallenge(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateClockDeadlineNotified = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //              #     #      #         #  #         #          #     #  #   #                           #  ####               ##   #           ##    ##
    //              #           # #        ####         #          #     ####                               #  #                 #  #  #            #     #
    // ###    ##   ###   ##     #    #  #  ####   ###  ###    ##   ###   ####  ##     ###    ###    ##    ###  ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #  #  #   #    ##     ##     # ##  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #  #  #   #     #     #     # #  #  #  # ##   #    #     #  #  #  #   #      ##     ##   ##    #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #  #  #  ###   ###    ###     ##    ###  #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                #                                                                                                                                     ###
    /**
     * Records the notification for a missed match.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the notification has been recorded.
     */
    static async notifyMatchMissedForChallenge(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateMatchTimePassedNotified = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //              #     #      #         #  #         #          #      ##    #                 #     #                ####               ##   #           ##    ##
    //              #           # #        ####         #          #     #  #   #                 #                      #                 #  #  #            #     #
    // ###    ##   ###   ##     #    #  #  ####   ###  ###    ##   ###    #    ###    ###  ###   ###   ##    ###    ###  ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #    #    #    #  #  #  #   #     #    #  #  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #  #  #   #     #     #     # #  #  #  # ##   #    #     #  #  #  #   #    # ##  #      #     #    #  #   ##   #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #   ##     ##   # #  #       ##  ###   #  #  #     #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                #                                                                             ###                                                               ###
    /**
     * Records the notification for a match starting soon.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the notification has been recorded.
     */
    static async notifyMatchStartingForChallenge(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateMatchTimeNotified = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
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
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Map || void 0;
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
        await db.query(/* sql */`
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
        await db.query(/* sql */`
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET CasterPlayerId = NULL WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //                                     ####                     #
    //                                     #                        #
    // ###    ##   # #    ##   # #    ##   ###   # #    ##   ###   ###
    // #  #  # ##  ####  #  #  # #   # ##  #     # #   # ##  #  #   #
    // #     ##    #  #  #  #  # #   ##    #     # #   ##    #  #   #
    // #      ##   #  #   ##    #     ##   ####   #     ##   #  #    ##
    /**
     * Removes an event from the databse.
     * @param {string} title The title of the event.
     * @returns {Promise} A promise that resolves when the event has been removed.
     */
    static async removeEvent(title) {
        await db.query(/* sql */`
            DELETE FROM tblEvent WHERE Title = @title
        `, {
            title: {type: Db.VARCHAR(200), value: title}
        });
    }

    //                                     #  #
    //                                     ####
    // ###    ##   # #    ##   # #    ##   ####   ###  ###
    // #  #  # ##  ####  #  #  # #   # ##  #  #  #  #  #  #
    // #     ##    #  #  #  #  # #   ##    #  #  # ##  #  #
    // #      ##   #  #   ##    #     ##   #  #   # #  ###
    //                                                 #
    /**
     * Removes a map from the database.
     * @param {string} map The map to remove.
     * @returns {Promise} A promise that resolves when the map has been removed.
     */
    static async removeMap(map) {
        await db.query(/* sql */`
            DELETE FROM tblAllowedMap WHERE Map = @map
        `, {map: {type: Db.VARCHAR(100), value: map}});
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
        await db.query(/* sql */`
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
        await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            DELETE FROM tblStat WHERE ChallengeId = @challengeId AND PlayerId = @playerId
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
        await db.query(/* sql */`
            UPDATE tblPlayer SET TwitchName = NULL WHERE DiscordId = @discordId
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
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
        await db.query(/* sql */`
            UPDATE tblTeam SET Name = @name WHERE TeamId = @teamId
        `, {
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

    //                                       #    ###                      #          #     ####               ##   #           ##    ##
    //                                       #    #  #                     #          #     #                 #  #  #            #     #
    // ###    ##    ###  #  #   ##    ###   ###   #  #   ##   # #    ###  ###    ##   ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  # ##  #  #  #  #  # ##  ##      #    ###   # ##  ####  #  #   #    #     #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     ##    #  #  #  #  ##      ##    #    # #   ##    #  #  # ##   #    #     #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #      ##    ###   ###   ##   ###      ##  #  #   ##   #  #   # #    ##   ##   #  #  #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                #                                                                                                                                  ###
    /**
     * Logs a request for a rematch for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team requesting the rematch.
     * @returns {Promise} A promise that resolves when the rematch has been requested.
     */
    static async requestRematchForChallenge(challenge, team) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET RematchTeamId = @teamId, DateRematchRequested = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {
            teamId: {type: Db.INT, value: team.id},
            challengeId: {type: Db.INT, value: challenge.id}
        });
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
        await db.query(/* sql */`
            UPDATE tblTeam SET Tag = @tag WHERE TeamId = @teamId
        `, {
            tag: {type: Db.VARCHAR(5), value: tag},
            teamId: {type: Db.INT, value: team.id}
        });
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET HomeServerTeamId = @teamId, UsingHomeServerTeam = 1 WHERE ChallengeId = @challengeId
        `, {
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET Map = @map, UsingHomeMapTeam = 0 FROM tblChallenge WHERE ChallengeId = @challengeId
        `, {
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET UsingHomeServerTeam = 0 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #     ##                      #     #                ###                #             #         ####               ##   #           ##    ##
    //               #    #  #                     #                      #  #                             #         #                 #  #  #            #     #
    //  ###    ##   ###   #  #  # #    ##   ###   ###   ##    # #    ##   #  #   ##   ###   ##     ##    ###   ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #    #  #  # #   # ##  #  #   #     #    ####  # ##  ###   # ##  #  #   #    #  #  #  #  ##     #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    #  #  # #   ##    #      #     #    #  #  ##    #     ##    #      #    #  #  #  #    ##   #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##   ##    #     ##   #       ##  ###   #  #   ##   #      ##   #     ###    ##    ###  ###    #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                                                            ###
    /**
     * Sets the number of overtime periods for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {number} overtimePeriods The number of overtime periods played.
     * @returns {Promise} A promise that resolves when the number of overtime periods has been set.
     */
    static async setOvertimePeriodsForChallenge(challenge, overtimePeriods) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET OvertimePeriods = @overtimePeriods WHERE ChallengeId = @challengeId
        `, {
            challengeId: {type: Db.INT, value: challenge.id},
            overtimePeriods: {type: Db.INT, value: overtimePeriods}
        });
    }

    //               #    ###                 #                                          ####               ##   #           ##    ##
    //               #    #  #                #                                          #                 #  #  #            #     #
    //  ###    ##   ###   #  #   ##    ###   ###    ###    ##    ###   ###    ##   ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #    ###   #  #  ##      #    ##     # ##  #  #  ##     #  #  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    #     #  #    ##    #      ##   ##    # ##    ##   #  #  #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##  #      ##   ###      ##  ###     ##    # #  ###     ##   #  #  #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                                ###
    /**
     * Sets a match to be a postseason match.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the match is set as a postseason match.
     */
    static async setPostseasonForChallenge(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET Postseason = 1 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #    ###                     ##                 ##                                  ####               ##   #           ##    ##
    //               #    #  #                     #                #  #                                 #                 #  #  #            #     #
    //  ###    ##   ###   #  #   ##    ###  #  #   #     ###  ###    #     ##    ###   ###    ##   ###   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #    ###   # ##  #  #  #  #   #    #  #  #  #    #   # ##  #  #  ##     #  #  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    # #   ##     ##   #  #   #    # ##  #     #  #  ##    # ##    ##   #  #  #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##  #  #   ##   #      ###  ###    # #  #      ##    ##    # #  ###     ##   #  #  #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                 ###                                                                                                                            ###
    /**
     * Sets a match to be a regular season match.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the match is set as a postseason match.
     */
    static async setRegularSeasonForChallenge(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET Postseason = 0 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
    }

    //               #    ###                      #          #              #  ####               ##   #           ##    ##
    //               #    #  #                     #          #              #  #                 #  #  #            #     #
    //  ###    ##   ###   #  #   ##   # #    ###  ###    ##   ###    ##    ###  ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #    ###   # ##  ####  #  #   #    #     #  #  # ##  #  #  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #    # #   ##    #  #  # ##   #    #     #  #  ##    #  #  #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##  #  #   ##   #  #   # #    ##   ##   #  #   ##    ###  #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                       ###
    /**
     * Sets a challenge as having been rematched.
     * @param {Challenge} challenge The challenge.
     * @returns {Promise} A promise that resolves when the challenge has been set as having been rematched.
     */
    static async setRematchedForChallenge(challenge) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateRematched = GETUTCDATE() WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
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

    //               #    ###                     ###                 #                #                 #
    //               #     #                      #  #                #                #                 #
    //  ###    ##   ###    #     ##    ###  # #   #  #   ##    ###   ###    ##   ###   #      ##    ##   # #
    // ##     # ##   #     #    # ##  #  #  ####  ###   #  #  ##      #    # ##  #  #  #     #  #  #     ##
    //   ##   ##     #     #    ##    # ##  #  #  # #   #  #    ##    #    ##    #     #     #  #  #     # #
    // ###     ##     ##   #     ##    # #  #  #  #  #   ##   ###      ##   ##   #     ####   ##    ##   #  #
    /**
     * Sets a team's roster lock state.
     * @param {Team} team The team to set the roster lock state for.
     * @param {boolean} locked Whether the team's roster should be locked.
     * @returns {Promise} A promise that resolves when the lock state has been set.
     */
    static async setTeamRosterLock(team, locked) {
        await db.query(/* sql */`
            UPDATE tblTeam SET Locked = @locked WHERE TeamId = @teamId
        `, {
            teamId: {type: Db.INT, value: team.id},
            locked: {type: Db.BIT, value: locked}
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET TeamSize = @size, SuggestedTeamSize = NULL, SuggestedTeamSizeTeamId = NULL WHERE ChallengeId = @challengeId
        `, {
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET MatchTime = @date, SuggestedTime = NULL, SuggestedTimeTeamId = NULL, DateMatchTimeNotified = NULL, DateMatchTimePassedNotified = NULL WHERE ChallengeId = @challengeId
        `, {
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
        await db.query(/* sql */`
            UPDATE tblTeam SET Timezone = @timezone WHERE TeamId = @teamId
        `, {
            teamId: {type: Db.INT, value: team.id},
            timezone: {type: Db.VARCHAR(50), value: timezone}
        });
    }

    //               #    ###    #     #    ##          ####               ##   #           ##    ##
    //               #     #           #     #          #                 #  #  #            #     #
    //  ###    ##   ###    #    ##    ###    #     ##   ###    ##   ###   #     ###    ###   #     #     ##   ###    ###   ##
    // ##     # ##   #     #     #     #     #    # ##  #     #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //   ##   ##     #     #     #     #     #    ##    #     #  #  #     #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###     ##     ##   #    ###     ##  ###    ##   #      ##   #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                               ###
    /**
     * Sets a title for a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {string} title The title.
     * @returns {Promise} A promise that resolves when the title is set.
     */
    static async setTitleForChallenge(challenge, title) {
        await db.query(/* sql */`
            UPDATE tblChallenge SET Title = CASE WHEN ISNULL(@title, '') = '' THEN NULL ELSE @title END WHERE ChallengeId = @challengeId
        `, {
            title: {type: Db.VARCHAR(100), value: title},
            challengeId: {type: Db.INT, value: challenge.id}
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
        const data = await db.query(/* sql */`
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedMap = @map, SuggestedMapTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedNeutralServerTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedTeamSize = @size, SuggestedTeamSizeTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET SuggestedTime = @date, SuggestedTimeTeamId = @teamId WHERE ChallengeId = @challengeId
        `, {
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

    /**
     * Checks to see if a team has a stock home map.
     * @param {Team} team The team to check.
     * @param {number} [excludeNumber] Excludes a home map number from the check.
     * @returns {Promise<boolean>} A promise that resolves with whether the team has a stock home map.
     */
    static async teamHasStockHomeMap(team, excludeNumber) {

        /** @type {{recordsets: [{}[]]}} */
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET AdminCreated = 0 WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
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
        await db.query(/* sql */`
            UPDATE tblChallenge SET DateVoided = NULL WHERE ChallengeId = @challengeId
        `, {challengeId: {type: Db.INT, value: challenge.id}});
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
        await db.query(/* sql */`
            UPDATE tblPlayer SET Name = @name WHERE DiscordId = @discordId
        `, {
            discordId: {type: Db.VARCHAR(24), value: member.id},
            name: {type: Db.VARCHAR(64), value: member.displayName}
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

    //             ##     #       #         #          #  #
    //              #             #         #          ####
    // # #    ###   #    ##     ###   ###  ###    ##   ####   ###  ###
    // # #   #  #   #     #    #  #  #  #   #    # ##  #  #  #  #  #  #
    // # #   # ##   #     #    #  #  # ##   #    ##    #  #  # ##  #  #
    //  #     # #  ###   ###    ###   # #    ##   ##   #  #   # #  ###
    //                                                             #
    /**
     * Validates a map.
     * @param {string} map The map.
     * @returns {Promise<{map: string, stock: boolean}>} A promise that resolves with the validated map.
     */
    static async validateMap(map) {

        /**
         * @type {{recordsets: [{Map: string, Stock: boolean}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Map, Stock FROM tblAllowedMap WHERE Map = @map
        `, {map: {type: Db.VARCHAR(100), value: map}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {map: data.recordsets[0][0].Map, stock: data.recordsets[0][0].Stock} || void 0;
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
        await db.query(/* sql */`
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
     * @returns {Promise<{teamId: number, first: boolean}[]>} A promise that resolves with a list of teams that were penalized along with whether it was their first penalty.
     */
    static async voidChallengeWithPenalties(challenge, teams) {
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
         * @type {{recordsets: [{TeamId: number, First: boolean}[]]}}
         */
        const data = await db.query(sql, params);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({teamId: row.TeamId, first: row.First})) || [];
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

module.exports = Database;
