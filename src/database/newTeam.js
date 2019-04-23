/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("../models/newTeam")} NewTeam
 * @typedef {{id: number, member: DiscordJs.GuildMember, name?: string, tag?: string}} NewTeamData
 */

const Db = require("node-database"),

    settings = require("../../settings"),

    db = new Db(settings.database);

//  #   #                #####                       ####   #
//  #   #                  #                          #  #  #
//  ##  #   ###   #   #    #     ###    ###   ## #    #  #  # ##
//  # # #  #   #  #   #    #    #   #      #  # # #   #  #  ##  #
//  #  ##  #####  # # #    #    #####   ####  # # #   #  #  #   #
//  #   #  #      # # #    #    #      #   #  # # #   #  #  ##  #
//  #   #   ###    # #     #     ###    ####  #   #  ####   # ##
/**
 * A class that handles calls to the database for new teams.
 */
class NewTeamDb {
    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Begins the process of creating a new team for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot creating a new team.
     * @returns {Promise<{id: number, member: DiscordJs.GuildMember}>} A promise that resolves when the process of creating a new team for the pilot has begun.
     */
    static async create(member) {
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

    //    #        ##           #
    //    #         #           #
    //  ###   ##    #     ##   ###    ##
    // #  #  # ##   #    # ##   #    # ##
    // #  #  ##     #    ##     #    ##
    //  ###   ##   ###    ##     ##   ##
    /**
     * Cancels the creation of a new team for a pilot.
     * @param {NewTeam} newTeam The new team.
     * @returns {Promise} A promise that resolves when team creation is cancelled.
     */
    static async delete(newTeam) {
        await db.query(/* sql */`
            DELETE FROM tblNewTeam WHERE NewTeamId = @newTeamId
        `, {newTeamId: {type: Db.INT, value: newTeam.id}});
    }

    //              #    ###         ###    #    ##           #
    //              #    #  #        #  #         #           #
    //  ###   ##   ###   ###   #  #  #  #  ##     #     ##   ###
    // #  #  # ##   #    #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #    #  #   # #  #      #     #    #  #   #
    // #      ##     ##  ###     #   #     ###   ###    ##     ##
    //  ###                     #
    /**
     * Gets new team data for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot to get the new team for.
     * @returns {Promise<NewTeamData>} A promise that resolves with the new team's name and tag.
     */
    static async getByPilot(member) {
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

    //               #    #  #
    //               #    ## #
    //  ###    ##   ###   ## #   ###  # #    ##
    // ##     # ##   #    # ##  #  #  ####  # ##
    //   ##   ##     #    # ##  # ##  #  #  ##
    // ###     ##     ##  #  #   # #  #  #   ##
    /**
     * Applies a team name to a team being created and returns the team name and tag.
     * @param {NewTeam} newTeam The new team.
     * @param {string} name The name of the team.
     * @returns {Promise} A promise that resolves when the team name is updated.
     */
    static async setName(newTeam, name) {
        await db.query(/* sql */`
            UPDATE tblNewTeam SET Name = @name WHERE NewTeamId = @newTeamId
        `, {name: {type: Db.VARCHAR(25), value: name}, newTeamId: {type: Db.INT, value: newTeam.id}});
    }

    //               #    ###
    //               #     #
    //  ###    ##   ###    #     ###   ###
    // ##     # ##   #     #    #  #  #  #
    //   ##   ##     #     #    # ##   ##
    // ###     ##     ##   #     # #  #
    //                                 ###
    /**
     * Applies a team tag to a team being created and returns the team name and tag.
     * @param {NewTeam} newTeam The new team.
     * @param {string} tag The tag of the team.
     * @returns {Promise} A promise that resolves when the team tag is updated.
     */
    static async setTag(newTeam, tag) {
        await db.query(/* sql */`
            UPDATE tblNewTeam SET Tag = @tag WHERE NewTeamId = @newTeamId
        `, {tag: {type: Db.VARCHAR(25), value: tag}, newTeamId: {type: Db.INT, value: newTeam.id}});
    }
}

module.exports = NewTeamDb;
