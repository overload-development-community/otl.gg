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
     * Adds a captain to a user's team.
     * @param {User} user The user adding the captain.
     * @param {User} captain The captain to add.
     * @returns {Promise} A promise that resolves when the captain has been added.
     */
    static async addCaptain(user, captain) {
        await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            UPDATE tblRoster SET Captain = 1 WHERE DiscordId = @captainId AND TeamId = @teamId

            MERGE tblCaptainHistory ch
                USING (VALUES (@teamId, @captainId)) AS v (TeamId, DiscordId)
                ON ch.TeamId = v.TeamId AND ch.DiscordId = v.DiscordId
            WHEN NOT MATCHED THEN
                INSERT (TeamId, DiscordId) VALUES (v.TeamId, v.DiscordId);
        `, {captainId: {type: Db.VARCHAR(24), value: captain.id}, userId: {type: Db.VARCHAR(24), value: user.id}});
    }

    //          #     #  #  #                     ###         ###
    //          #     #  #  #                      #           #
    //  ###   ###   ###  #  #   ###    ##   ###    #     ##    #     ##    ###  # #
    // #  #  #  #  #  #  #  #  ##     # ##  #  #   #    #  #   #    # ##  #  #  ####
    // # ##  #  #  #  #  #  #    ##   ##    #      #    #  #   #    ##    # ##  #  #
    //  # #   ###   ###   ##   ###     ##   #      #     ##    #     ##    # #  #  #
    /**
     * Adds a user to a team.  Also removes any outstanding requests or invites for the user.
     * @param {GuildMember} guildMember The user to add.
     * @param {object} team The team to add the user to.
     * @returns {Promise} A promise that resolves when the user has been added to the team.
     */
    static async addUserToTeam(guildMember, team) {
        await db.query(`
            INSERT INTO tblRoster (TeamId, DiscordId, Name) VALUES (@teamId, @userId, @name)
            DELETE FROM tblRequest WHERE DiscordId = @userId
            DELETE FROM tblInvite WHERE DiscordId = @userId
            DELETE FROM tblJoinBan WHERE DiscordId = @userId
            INSERT INTO tblJoinBan (DiscordId) VALUES (@userId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND DiscordId = @userId
        `, {teamId: {type: Db.INT, value: team.id}, userId: {type: Db.VARCHAR(24), value: guildMember.id}, name: {type: Db.VARCHAR(64), value: guildMember.displayName}});
    }

    //                   ##          #  #                    #  #
    //                    #          #  #                    ####
    //  ###  ###   ###    #    #  #  ####   ##   # #    ##   ####   ###  ###
    // #  #  #  #  #  #   #    #  #  #  #  #  #  ####  # ##  #  #  #  #  #  #
    // # ##  #  #  #  #   #     # #  #  #  #  #  #  #  ##    #  #  # ##  #  #
    //  # #  ###   ###   ###     #   #  #   ##   #  #   ##   #  #   # #  ###
    //       #     #            #                                        #
    /**
     * Applies a home map for a user's team.
     * @param {User} user The user whose team is applying their home map.
     * @param {number} number The map number.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the home map has been applied.
     */
    static async applyHomeMap(user, number, map) {
        await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            MERGE tblTeamHome th
                USING (VALUES (@teamId, @number, @map)) AS v (TeamId, Number, Map)
                ON th.TeamId = v.TeamId AND th.Number = v.Number
            WHEN MATCHED THEN
                UPDATE SET Map = v.Map
            WHEN NOT MATCHED THEN
                INSERT (TeamId, Number, Map) VALUES (v.TeamId, v.Number, v.Map);
        `, {
            userId: {type: Db.VARCHAR(24), value: user.id},
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
     * @param {User} user The user creating the team.
     * @param {string} name The name of the team.
     * @returns {Promise<{name: string, tag: string}>} A promise that resolves with the name and tag of the team.
     */
    static async applyTeamName(user, name) {
        const data = await db.query(`
            UPDATE tblNewTeam SET Name = @name WHERE DiscordID = @userId
            SELECT Name, Tag FROM tblNewTeam WHERE DiscordID = @userId
        `, {name: {type: Db.VARCHAR(25), value: name}, userId: {type: Db.VARCHAR(24), value: user.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag} || {};
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
     * @param {User} user The user creating the team.
     * @param {string} tag The tag of the team.
     * @returns {Promise<{name: string, tag: string}>} A promise that resolves with the name and tag of the team.
     */
    static async applyTeamTag(user, tag) {
        const data = await db.query(`
            UPDATE tblNewTeam SET Tag = @tag WHERE DiscordID = @userId
            SELECT Name, Tag FROM tblNewTeam WHERE DiscordID = @userId
        `, {tag: {type: Db.VARCHAR(25), value: tag}, userId: {type: Db.VARCHAR(24), value: user.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag} || {};
    }

    // #                                #  ####                    ###                     #  #         #     #    ##
    // #                                #  #                        #                      #  #         #           #
    // ###    ###  ###   ###    ##    ###  ###   ###    ##   # #    #     ##    ###  # #   #  #  ###   ###   ##     #
    // #  #  #  #  #  #  #  #  # ##  #  #  #     #  #  #  #  ####   #    # ##  #  #  ####  #  #  #  #   #     #     #
    // #  #  # ##  #  #  #  #  ##    #  #  #     #     #  #  #  #   #    ##    # ##  #  #  #  #  #  #   #     #     #
    // ###    # #  #  #  #  #   ##    ###  #     #      ##   #  #   #     ##    # #  #  #   ##   #  #    ##  ###   ###
    /**
     * Returns the date and time which the user is banned from a team until.
     * @param {User} user The user to check.
     * @param {object} team The team to check.
     * @returns {Promise<Date|void>} A promise that resolves with the date and time which the user is banned from the team until.  Returns nothing if the user is not banned.
     */
    static async bannedFromTeamUntil(user, team) {
        const data = await db.query("SELECT DateExpires FROM tblTeamBan WHERE TeamId = @teamId AND DiscordId = @userId", {teamId: {type: Db.INT, value: team.id}, userId: {type: Db.VARCHAR(24), value: user.id}});
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
     * Returns whether the user can be a captain.
     * @param {User} user The user to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user can be a captain.
     */
    static async canBeCaptain(user) {
        const data = await db.query("SELECT TOP 1 1 FROM tblLeadershipPenalty WHERE DiscordId = @userId", {userId: {type: Db.VARCHAR(24), value: user.id}});
        return !(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    //                   ###                                 ###    #    ##           #
    //                   #  #                                #  #         #           #
    //  ##    ###  ###   #  #   ##   # #    ##   # #    ##   #  #  ##     #     ##   ###
    // #     #  #  #  #  ###   # ##  ####  #  #  # #   # ##  ###    #     #    #  #   #
    // #     # ##  #  #  # #   ##    #  #  #  #  # #   ##    #      #     #    #  #   #
    //  ##    # #  #  #  #  #   ##   #  #   ##    #     ##   #     ###   ###    ##     ##
    /**
     * Returns whether the user can remove a pilot.
     * @param {User} user The user to check.
     * @param {User} pilot The pilot to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user can remove the pilot.
     */
    static async canRemovePilot(user, pilot) {
        const data = await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            SELECT RosterId FROM tblRoster WHERE TeamId = @teamId AND DiscordId = @pilotId
            UNION SELECT RequestId FROM tblRequest WHERE TeamId = @teamId AND DiscordId = @pilotId
            UNION SELECT InviteId FROM tblInvite WHERE TeamId = @teamId AND DiscordId = @pilotId
        `, {
            userId: {type: Db.VARCHAR(24), value: user.id},
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
     * Cancels the creation of a new team for a user.
     * @param {User} user The user to cancel team creation for.
     * @returns {Promise} A promise that resolves when team creation is cancelled.
     */
    static async cancelCreateTeam(user) {
        await db.query("DELETE FROM tblNewTeam WHERE DiscordId = @userId", {userId: {type: Db.VARCHAR(24), value: user.id}});
    }

    //                          #          ###
    //                          #           #
    //  ##   ###    ##    ###  ###    ##    #     ##    ###  # #
    // #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     #     ##    # ##   #    ##     #    ##    # ##  #  #
    //  ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Creates a team with the specified user as the founder.
     * @param {GuildMember} guildMember The guild member founding the team.
     * @param {string} name The team name.
     * @param {string} tag The tame tag.
     * @returns {Promise} A promise that resolves when the team is created.
     */
    static async createTeam(guildMember, name, tag) {
        await db.query(`
            DECLARE @teamId INT

            INSERT INTO tblTeam (Name, Tag) VALUES (@teamName, @tag)

            SET @teamId = SCOPE_IDENTITY()

            INSERT INTO tblRoster (TeamId, DiscordId, Name, Founder) VALUES (@teamId, @userId, @userName, 1)

            MERGE tblCaptainHistory ch
                USING (VALUES (@teamId, @userId)) AS v (TeamId, DiscordId)
                ON ch.TeamId = v.TeamId AND ch.DiscordId = v.DiscordId
            WHEN NOT MATCHED THEN
                INSERT (TeamId, DiscordId) VALUES (v.TeamId, v.DiscordId);

            DELETE FROM tblJoinBan WHERE DiscordId = @userId
            INSERT INTO tblJoinBan (DiscordId) VALUES (@userId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND DiscordId = @userId
            DELETE FROM tblNewTeam WHERE DiscordId = @userId
        `, {
            teamName: {type: Db.VARCHAR(25), value: name},
            tag: {type: Db.VARCHAR(5), value: tag},
            userId: {type: Db.VARCHAR(24), value: guildMember.id},
            userName: {type: Db.VARCHAR(64), value: guildMember.displayName}
        });
    }

    //    #   #           #                    #  ###
    //    #               #                    #   #
    //  ###  ##     ###   ###    ###  ###    ###   #     ##    ###  # #
    // #  #   #    ##     #  #  #  #  #  #  #  #   #    # ##  #  #  ####
    // #  #   #      ##   #  #  # ##  #  #  #  #   #    ##    # ##  #  #
    //  ###  ###   ###    ###    # #  #  #   ###   #     ##    # #  #  #
    /**
     * Disbands a team.
     * @param {User} user The user whose team to disband.
     * @returns {Promise} A promise that resolves when the team is disbanded.
     */
    static async disbandTeam(user) {
        await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            UPDATE tblTeam SET Disbanded = 1 WHERE TeamId = @teamId

            DELETE FROM tblRoster WHERE TeamId = @teamId
            DELETE FROM tblRequest WHERE TeamId = @teamId
            DELETE FROM tblInvite WHERE TeamId = @teamId
        `, {userId: {type: Db.VARCHAR(24), value: user.id}});
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
     * @returns {Promise<{id: number, name: string, tag: string, disbanded: boolean}|void>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getAnyTeamByNameOrTag(text) {
        const data = await db.query("SELECT TeamId, Name, Tag, Disbanded FROM tblTeam WHERE Name = @text OR Tag = @text", {text: {type: Db.VARCHAR(25), value: text}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, disbanded: !!data.recordsets[0][0].Disbanded} || void 0;
    }

    //              #    #  #              ###
    //              #    ## #               #
    //  ###   ##   ###   ## #   ##   #  #   #     ##    ###  # #
    // #  #  # ##   #    # ##  # ##  #  #   #    # ##  #  #  ####
    //  ##   ##     #    # ##  ##    ####   #    ##    # ##  #  #
    // #      ##     ##  #  #   ##   ####   #     ##    # #  #  #
    //  ###
    /**
     * Gets new team data for the user.
     * @param {User} user The user to get the new team for.
     * @returns {Promise<{name: string?, tag: string?}>} A promise that resolves with the new team's name and tag.
     */
    static async getNewTeam(user) {
        const data = await db.query("SELECT Name, Tag FROM tblNewTeam WHERE DiscordId = @userId", {userId: {type: Db.VARCHAR(24), value: user.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag} || {};
    }

    //              #    ###                                   #             #   ##         ###                #     #             #  ###
    //              #    #  #                                  #             #  #  #         #                       #             #   #
    //  ###   ##   ###   #  #   ##    ###  #  #   ##    ###   ###    ##    ###  #  #  ###    #    ###   # #   ##    ###    ##    ###   #     ##    ###  # #    ###
    // #  #  # ##   #    ###   # ##  #  #  #  #  # ##  ##      #    # ##  #  #  #  #  #  #   #    #  #  # #    #     #    # ##  #  #   #    # ##  #  #  ####  ##
    //  ##   ##     #    # #   ##    #  #  #  #  ##      ##    #    ##    #  #  #  #  #      #    #  #  # #    #     #    ##    #  #   #    ##    # ##  #  #    ##
    // #      ##     ##  #  #   ##    ###   ###   ##   ###      ##   ##    ###   ##   #     ###   #  #   #    ###     ##   ##    ###   #     ##    # #  #  #  ###
    //  ###                             #
    /**
     * Gets the list of requested or invited teams for the user.
     * @param {User} user The user to check.
     * @returns {Promise<[{id: number, name: string, tag: string, disbanded: boolean}]>} A promise that resolves with the list of teams the user has requested or is invited to.
     */
    static async getRequestedOrInvitedTeams(user) {
        const data = await db.query("SELECT TeamId, Name, Tag FROM tblTeam WHERE Disbanded = 0 AND (TeamId IN (SELECT TeamId FROM tblRequest WHERE DiscordId = @userId) OR TeamId IN (SELECT TeamId FROM tblInvite WHERE DiscordId = @userId))", {userId: {type: Db.VARCHAR(24), value: user.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({id: row.TeamId, name: row.Name, tag: row.Tag})) || [];
    }

    //              #    ###
    //              #     #
    //  ###   ##   ###    #     ##    ###  # #
    // #  #  # ##   #     #    # ##  #  #  ####
    //  ##   ##     #     #    ##    # ##  #  #
    // #      ##     ##   #     ##    # #  #  #
    //  ###
    /**
     * Gets the team for the user.
     * @param {User} user The user to get the team for.
     * @returns {Promise<{id: number, name: string, tag: string, isFounder: boolean}|void>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getTeam(user) {
        const data = await db.query("SELECT TeamId, Name, Tag, CASE WHEN EXISTS(SELECT TOP 1 1 FROM tblRoster WHERE Founder = 1 AND DiscordId = @userId) THEN 1 ELSE 0 END IsFounder FROM tblTeam WHERE TeamId IN (SELECT TeamId FROM tblRoster WHERE DiscordId = @userId)", {userId: {type: Db.VARCHAR(24), value: user.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, isFounder: !!data.recordsets[0][0].IsFounder} || void 0;
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
     * @param {User} user The user whose team to get maps for.
     * @returns {Promise<[string]>} A promise that resolves with a list of the team's home maps.
     */
    static async getTeamHomeMaps(user) {
        const data = await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId
        `, {userId: {type: Db.VARCHAR(24), value: user.id}});
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
     * @param {object} team The team to get the info for.
     * @returns {Promise<{homes: [string], members: [{name: string, role: string}], requests: [{name: string, date: Date}], invites: [{name: string, date: Date}]}>} A promise that resolves with the team's info.
     */
    static async getTeamInfo(team) {
        const data = await db.query(`
            SELECT Map FROM tblTeamHome WHERE TeamId = @teamId ORDER BY Number

            SELECT Name, Captain, Founder FROM tblRoster WHERE TeamId = @teamId ORDER BY CASE WHEN Founder = 1 THEN 0 WHEN Captain = 1 THEN 1 ELSE 2 END, Name

            SELECT Name, DateRequested FROM tblRequest WHERE TeamId = @teamId ORDER BY DateRequested

            SELECT Name, DateInvited FROM tblInvite WHERE TeamId = @teamId ORDER BY DateInvited
        `, {teamId: {type: Db.VARCHAR(24), value: team.id}});
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
     * Gets the number of pilots on and invited pilots for a user's team.
     * @param {User} user The user whose team to check.
     * @returns {Promise<number>} A promise that resolves with the number of pilots on and invited pilots for a user's team.
     */
    static async getTeamPilotAndInvitedCount(user) {
        const data = await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            SELECT
                (SELECT COUNT(*) FROM tblRoster WHERE TeamId = @teamId) +
                (SELECT COUNT(*) FROM tblInvite WHERE TeamId = @teamId) Members
        `, {userId: {type: Db.VARCHAR(24), value: user.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Members || 0;
    }

    // #                  ###                     ###                #     #             #  ###         ###
    // #                  #  #                     #                       #             #   #           #
    // ###    ###   ###   ###    ##    ##   ###    #    ###   # #   ##    ###    ##    ###   #     ##    #     ##    ###  # #
    // #  #  #  #  ##     #  #  # ##  # ##  #  #   #    #  #  # #    #     #    # ##  #  #   #    #  #   #    # ##  #  #  ####
    // #  #  # ##    ##   #  #  ##    ##    #  #   #    #  #  # #    #     #    ##    #  #   #    #  #   #    ##    # ##  #  #
    // #  #   # #  ###    ###    ##    ##   #  #  ###   #  #   #    ###     ##   ##    ###   #     ##    #     ##    # #  #  #
    /**
     * Checks if a user has been invited to a team.
     * @param {User} user The user to check.
     * @param {object} team The team to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user has been invited to a team.
     */
    static async hasBeenInvitedToTeam(user, team) {
        const data = await db.query("SELECT InviteId FROM tblInvite WHERE DiscordId = @userId AND TeamId = @teamId", {userId: {type: Db.VARCHAR(24), value: user.id}, teamId: {type: Db.INT, value: team.id}});
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
     * Checks if a user has requested a team.
     * @param {User} user The user to check.
     * @param {object} team The team to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user has requested a team.
     */
    static async hasRequestedTeam(user, team) {
        const data = await db.query("SELECT RequestId FROM tblRequest WHERE DiscordId = @userId AND TeamId = @teamId", {userId: {type: Db.VARCHAR(24), value: user.id}, teamId: {type: Db.INT, value: team.id}});
        return !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    //  #                 #     #          ###    #    ##           #    ###         ###
    //                          #          #  #         #           #     #           #
    // ##    ###   # #   ##    ###    ##   #  #  ##     #     ##   ###    #     ##    #     ##    ###  # #
    //  #    #  #  # #    #     #    # ##  ###    #     #    #  #   #     #    #  #   #    # ##  #  #  ####
    //  #    #  #  # #    #     #    ##    #      #     #    #  #   #     #    #  #   #    ##    # ##  #  #
    // ###   #  #   #    ###     ##   ##   #     ###   ###    ##     ##   #     ##    #     ##    # #  #  #
    /**
     * Invites a pilot to the user's team.
     * @param {User} user The user whos team to invite the pilot to.
     * @param {GuildMember} guildPilot The pilot to invite to the team.
     * @returns {Promise} A promise that resolves when the pilot is invited to the user's team.
     */
    static async invitePilotToTeam(user, guildPilot) {
        await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            DELETE FROM tblRequest WHERE TeamId = @teamId AND DiscordId = @pilotId
            INSERT INTO tblInvite (TeamId, DiscordId, Name) VALUES (@teamId, @pilotId, @pilotName)
        `, {userId: {type: Db.VARCHAR(24), value: user.id}, pilotId: {type: Db.VARCHAR(24), value: guildPilot.id}, pilotName: {type: Db.VARCHAR(64), value: guildPilot.displayName}});
    }

    //  #           ###                #     #             #  ###         ###
    //               #                       #             #   #           #
    // ##     ###    #    ###   # #   ##    ###    ##    ###   #     ##    #     ##    ###  # #
    //  #    ##      #    #  #  # #    #     #    # ##  #  #   #    #  #   #    # ##  #  #  ####
    //  #      ##    #    #  #  # #    #     #    ##    #  #   #    #  #   #    ##    # ##  #  #
    // ###   ###    ###   #  #   #    ###     ##   ##    ###   #     ##    #     ##    # #  #  #
    /**
     * Gets whether the user is invited to a team.
     * @param {User} user The user to check.
     * @param {Team} team The team to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user is invited to a team.
     */
    static async isInvitedToTeam(user, team) {
        const data = await db.query("SELECT InviteId FROM tblInvite WHERE DiscordId = @userId AND TeamId = @teamId", {userId: {type: Db.VARCHAR(24), value: user.id}, teamId: {type: Db.INT, value: team.id}});
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
     * Returns the date and time which the user is banned from joining a team.
     * @param {User} user The user to check.
     * @returns {Promise<Date|void>} A promise that resolves with the date and time which the user is banned from joining a team.  Returns nothing if the user is not banned.
     */
    static async joinTeamDeniedUntil(user) {
        const data = await db.query("SELECT DateExpires FROM tblJoinBan WHERE DiscordId = @userId", {userId: {type: Db.VARCHAR(24), value: user.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].DateExpires && data.recordsets[0][0].DateExpires > new Date() && data.recordsets[0][0].DateExpires || void 0;
    }

    //             #           ####                       #
    //             #           #                          #
    // # #    ###  # #    ##   ###    ##   #  #  ###    ###   ##   ###
    // ####  #  #  ##    # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  # ##  # #   ##    #     #  #  #  #  #  #  #  #  ##    #
    // #  #   # #  #  #   ##   #      ##    ###  #  #   ###   ##   #
    /**
     * Transfers ownership of a team from one pilot to another.
     * @param {User} user The user to transfer ownership from.
     * @param {User} pilot The user to transfer ownership to.
     * @returns {Promise} A promise that resolves when ownership has been transferred.
     */
    static async makeFounder(user, pilot) {
        await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            UPDATE tblRoster SET Founder = 0, Captain = 1 WHERE TeamId = @teamId AND DiscordId = @userId
            UPDATE tblRoster SET Founder = 1, Captain = 0 WHERE TeamId = @teamId AND DiscordId = @pilotId

            MERGE tblCaptainHistory ch
                USING (VALUES (@teamId, @pilotId)) AS v (TeamId, DiscordId)
                ON ch.TeamId = v.TeamId AND ch.DiscordId = v.DiscordId
            WHEN NOT MATCHED THEN
                INSERT (TeamId, DiscordId) VALUES (v.TeamId, v.DiscordId);
        `, {
            userId: {type: Db.VARCHAR(24), value: user.id},
            pilotId: {type: Db.VARCHAR(24), value: pilot.id}
        });
    }

    //              #                  #           #          ###
    //                                 #           #           #
    // ###    ##   ##    ###    ###   ###    ###  ###    ##    #     ##    ###  # #
    // #  #  # ##   #    #  #  ##      #    #  #   #    # ##   #    # ##  #  #  ####
    // #     ##     #    #  #    ##    #    # ##   #    ##     #    ##    # ##  #  #
    // #      ##   ###   #  #  ###      ##   # #    ##   ##    #     ##    # #  #  #
    /**
     * Reinstates a team with the user as its founder.
     * @param {GuildMember} guildMember The user reinstating the team.
     * @param {object} team The team to reinstate.
     * @returns {Promise} A promise that resolves when the team is reinstated.
     */
    static async reinstateTeam(guildMember, team) {
        await db.query(`
            UPDATE tblTeam SET Disbanded = 0 WHERE TeamId = @teamId

            INSERT INTO tblRoster (TeamId, DiscordId, Name, Founder) VALUES (@teamId, @userId, @userName, 1)

            DELETE FROM tblJoinBan WHERE DiscordId = @userId
            INSERT INTO tblJoinBan (DiscordId) VALUES (@userId)
            DELETE FROM tblTeamBan WHERE TeamId = @teamId AND DiscordId = @userId
        `, {
            userId: {type: Db.VARCHAR(24), value: guildMember.id},
            userName: {type: Db.VARCHAR(64), value: guildMember.displayName},
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
     * Removes a pilot as captain from the user's team.
     * @param {User} user The user removing the captain.
     * @param {User} captain The captain to remove.
     * @returns {Promise} A promise that resolves when the captain has been removed.
     */
    static async removeCaptain(user, captain) {
        await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            UPDATE tblRoster SET Captain = 0 WHERE DiscordId = @captainId AND TeamId = @teamId
        `, {
            userId: {type: Db.VARCHAR(24), value: user.id},
            captainId: {type: Db.VARCHAR(24), value: captain.id}
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
     * @param {User} user The user removing the pilot.
     * @param {User} pilot The pilot to remove.
     * @returns {Promise} A promise that resolves when the pilot has been removed.
     */
    static async removePilot(user, pilot) {
        // TODO: Remove from tblJoinBan and tblTeamBan if they did not play a game for this team.
        await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            IF EXISTS(SELECT TOP 1 1 FROM tblRoster WHERE TeamId = @teamId AND DiscordId = @pilotId)
            BEGIN
                DELETE FROM tblRoster WHERE TeamId = @teamId AND DiscordId = @pilotId

                DELETE FROM tblTeamBan WHERE TeamId = @teamId AND DiscordId = @pilotId
                INSERT INTO tblTeamBan (TeamId, DiscordId) VALUES (@teamId, @pilotId)
            END

            DELETE FROM tblRequest WHERE TeamId = @teamId AND DiscordId = @pilotId
            DELETE FROM tblInvite WHERE TeamId = @teamId AND DiscordId = @pilotId
        `, {
            userId: {type: Db.VARCHAR(24), value: user.id},
            pilotId: {type: Db.VARCHAR(24), value: pilot.id}
        });
    }

    //                                     #  #                     ####                    ###
    //                                     #  #                     #                        #
    // ###    ##   # #    ##   # #    ##   #  #   ###    ##   ###   ###   ###    ##   # #    #     ##    ###  # #
    // #  #  # ##  ####  #  #  # #   # ##  #  #  ##     # ##  #  #  #     #  #  #  #  ####   #    # ##  #  #  ####
    // #     ##    #  #  #  #  # #   ##    #  #    ##   ##    #     #     #     #  #  #  #   #    ##    # ##  #  #
    // #      ##   #  #   ##    #     ##    ##   ###     ##   #     #     #      ##   #  #   #     ##    # #  #  #
    /**
     * Removes a user from a team.
     * @param {User} user The user to remove.
     * @param {object} team The team to remove the user from.
     * @returns {Promise} A promise that resolves when the user has been removed from the team.
     */
    static async removeUserFromTeam(user, team) {
        await db.query(`
            DELETE FROM tblRoster WHERE TeamId = @teamId AND DiscordId = @userId
            INSERT INTO tblTeamBan (TeamId, DiscordId) VALUES (@teamId, @userId)
        `, {
            teamId: {type: Db.INT, value: team.id},
            userId: {type: Db.VARCHAR(24), value: user.id}
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
     * Submits a request for the user to join a team.
     * @param {GuildMember} guildMember The user making the request.
     * @param {object} team The team to send the request to.
     * @returns {Promise} A promise that resolves when the request has been made.
     */
    static async requestTeam(guildMember, team) {
        await db.query("INSERT INTO tblRequest (TeamId, DiscordId, Name) VALUES (@teamId, @userId, @userName)", {teamId: {type: Db.INT, value: team.id}, userId: {type: Db.VARCHAR(24), value: guildMember.id}, userName: {type: Db.VARCHAR(64), value: guildMember.displayName}});
    }

    //         #                 #     ##                      #          ###
    //         #                 #    #  #                     #           #
    //  ###   ###    ###  ###   ###   #     ###    ##    ###  ###    ##    #     ##    ###  # #
    // ##      #    #  #  #  #   #    #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    //   ##    #    # ##  #      #    #  #  #     ##    # ##   #    ##     #    ##    # ##  #  #
    // ###      ##   # #  #       ##   ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Begins the process of creating a new team for the user.
     * @param {User} user The user creating a new team.
     * @returns {Promise} A promise that resolves when the process of creating a new team for the user has begun.
     */
    static async startCreateTeam(user) {
        await db.query("INSERT INTO tblNewTeam (DiscordId) VALUES (@userId)", {userId: {type: Db.VARCHAR(24), value: user.id}});
    }

    //  #                      #  #               ###                #     #             #  ###    #    ##           #
    //  #                      #  #                #                       #             #  #  #         #           #
    // ###    ##    ###  # #   ####   ###   ###    #    ###   # #   ##    ###    ##    ###  #  #  ##     #     ##   ###
    //  #    # ##  #  #  ####  #  #  #  #  ##      #    #  #  # #    #     #    # ##  #  #  ###    #     #    #  #   #
    //  #    ##    # ##  #  #  #  #  # ##    ##    #    #  #  # #    #     #    ##    #  #  #      #     #    #  #   #
    //   ##   ##    # #  #  #  #  #   # #  ###    ###   #  #   #    ###     ##   ##    ###  #     ###   ###    ##     ##
    /**
     * Gets whether the user's team has invited a pilot.
     * @param {User} user The user whose team to check.
     * @param {User} pilot The pilot to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user's team has invited a pilot.
     */
    static async teamHasInvitedPilot(user, pilot) {
        const data = await db.query(`
            DECLARE @teamId INT

            SELECT @teamId = TeamId FROM tblRoster WHERE DiscordId = @userId

            SELECT InviteId FROM tblInvite WHERE TeamId = @teamId AND DiscordId = @pilotId
        `, {
            userId: {type: Db.VARCHAR(24), value: user.id},
            pilotId: {type: Db.VARCHAR(24), value: pilot.id}
        });
        return !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    //  #                      #  #                     ##         ###                     ###               ####         #            #
    //  #                      ## #                    #  #         #                       #                #                         #
    // ###    ##    ###  # #   ## #   ###  # #    ##   #  #  ###    #     ##    ###  # #    #     ###   ###  ###   #  #  ##     ###   ###    ###
    //  #    # ##  #  #  ####  # ##  #  #  ####  # ##  #  #  #  #   #    # ##  #  #  ####   #    #  #  #  #  #      ##    #    ##      #    ##
    //  #    ##    # ##  #  #  # ##  # ##  #  #  ##    #  #  #      #    ##    # ##  #  #   #    # ##   ##   #      ##    #      ##    #      ##
    //   ##   ##    # #  #  #  #  #   # #  #  #   ##    ##   #      #     ##    # #  #  #   #     # #  #     ####  #  #  ###   ###      ##  ###
    //                                                                                                  ###
    /**
     * Determines whether either the name or the tag has been taken by another team.
     * @param {string} name The name of the team to check.
     * @param {string} tag The tag of the team to check.
     * @returns {Promise<[boolean, boolean]>} A promise that resolves with whether either the name or the tag has been taken by another team.
     */
    static async teamNameOrTeamTagExists(name, tag) {
        const data = await db.query(`
            SELECT TeamID FROM tblTeam WHERE Name = @name
            SELECT TeamID FROM tblTeam WHERE Tag = @tag
        `, {
            name: {type: Db.VARCHAR(25), value: name},
            tag: {type: Db.VARCHAR(5), value: tag}
        });
        return [!!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]), !!(data && data.recordsets && data.recordsets[1] && data.recordsets[1][0])];
    }

    //  #                      ###               ####         #            #
    //  #                       #                #                         #
    // ###    ##    ###  # #    #     ###   ###  ###   #  #  ##     ###   ###    ###
    //  #    # ##  #  #  ####   #    #  #  #  #  #      ##    #    ##      #    ##
    //  #    ##    # ##  #  #   #    # ##   ##   #      ##    #      ##    #      ##
    //   ##   ##    # #  #  #   #     # #  #     ####  #  #  ###   ###      ##  ###
    //                                      ###
    /**
     * Determines whether the tag has been taken by another team.
     * @param {string} tag The tag of the team to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the tag has been taken by another team.
     */
    static async teamTagExists(tag) {
        const data = await db.query("SELECT TeamID FROM tblTeam WHERE Tag = @tag", {tag: {type: Db.VARCHAR(5), value: tag}});
        return !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    //                #         #          #  #
    //                #         #          ## #
    // #  #  ###    ###   ###  ###    ##   ## #   ###  # #    ##
    // #  #  #  #  #  #  #  #   #    # ##  # ##  #  #  ####  # ##
    // #  #  #  #  #  #  # ##   #    ##    # ##  # ##  #  #  ##
    //  ###  ###    ###   # #    ##   ##   #  #   # #  #  #   ##
    //       #
    /**
     * Updates a user's name.
     * @param {GuildMember} guildMember The guild member with their updated name.
     * @returns {Promise} A promise that resolves when the name has been updated.
     */
    static async updateName(guildMember) {
        await db.query(`
            UPDATE tblRoster SET Name = @userName WHERE DiscordId = @userId
            UPDATE tblRequest SET Name = @userName WHERE DiscordId = @userId
            UPDATE tblInvite SET Name = @userName WHERE DiscordId = @userId
        `, {
            userId: {type: Db.VARCHAR(24), value: guildMember.id},
            userName: {type: Db.VARCHAR(64), value: guildMember.displayName}
        });
    }

    //                    ###                      #                        ##                #           #           ##         ####                       #               ##     #   ###
    //                    #  #                                             #  #               #                      #  #        #                          #              #  #   # #   #
    // #  #   ###   ###   #  #  ###    ##   # #   ##     ##   #  #   ###   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###   #  #   #     #     ##    ###  # #
    // #  #  #  #  ##     ###   #  #  # ##  # #    #    #  #  #  #  ##     #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #  #  #  ###    #    # ##  #  #  ####
    // ####  # ##    ##   #     #     ##    # #    #    #  #  #  #    ##   #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #     #  #   #     #    ##    # ##  #  #
    // ####   # #  ###    #     #      ##    #    ###    ##    ###  ###     ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #      ##    #     #     ##    # #  #  #
    //                                                                                 #
    /**
     * Gets whether the user was a previous captain or founder of a team.
     * @param {User} user The user to check.
     * @param {object} team The team to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user was a previous captain or founder of a team.
     */
    static async wasPreviousCaptainOrFounderOfTeam(user, team) {
        const data = await db.query("SELECT HistoryID FROM tblCaptainHistory WHERE DiscordId = @userId AND TeamId = @teamId", {userId: {type: Db.VARCHAR(24), value: user.id}, teamId: {type: Db.INT, value: team.id}});
        return !!(data && data.recordsets && data.recordsets[0] && data.recordsets[0][0]);
    }

    // TODO: Roster History!
}

module.exports = Database;
