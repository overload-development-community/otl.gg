/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 * @typedef {import("../../types/newTeamTypes").NewTeamData} NewTeamTypes.NewTeamData
 */

const Db = require("../database/newTeam"),
    Exception = require("../logging/exception"),
    Team = require("./team");

/** @type {typeof import("../discord")} */
let Discord;

setTimeout(() => {
    Discord = require("../discord");
}, 0);

//  #   #                #####
//  #   #                  #
//  ##  #   ###   #   #    #     ###    ###   ## #
//  # # #  #   #  #   #    #    #   #      #  # # #
//  #  ##  #####  # # #    #    #####   ####  # # #
//  #   #  #      # # #    #    #      #   #  # # #
//  #   #   ###    # #     #     ###    ####  #   #
/**
 * A class that handles team creation-related functions.
 */
class NewTeam {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * A constructor to create an object that represents a team being created.
     * @param {NewTeamTypes.NewTeamData} data The data to load into the team being created.
     */
    constructor(data) {
        this.id = data.id;
        this.member = data.member;
        this.name = data.name;
        this.tag = data.tag;
    }

    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Creates a new team creation channel for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot starting team creation.
     * @returns {Promise<NewTeam>} A promise that resolves with the new team creation object.
     */
    static async create(member) {
        let data;
        try {
            data = await Db.create(member);
        } catch (err) {
            throw new Exception("There was a database error starting to create a team.", err);
        }

        const newTeam = new NewTeam(data);

        try {
            const currentTeam = await Team.getByPilot(member);

            if (currentTeam) {
                throw new Error("Pilot is already on a team.");
            }

            if (newTeam.channel) {
                throw new Error("Channel already exists.");
            }

            await Discord.createChannel(newTeam.channelName, "GUILD_TEXT", [
                {
                    id: Discord.id,
                    deny: ["VIEW_CHANNEL"]
                }, {
                    id: member.id,
                    allow: ["VIEW_CHANNEL"]
                }
            ], `${member.displayName} has started the process of creating a team.`);

            await newTeam.channel.setTopic("New Team Creation - View the pinned post for the current status of the new team.");

            await newTeam.updateChannel();

            return newTeam;
        } catch (err) {
            throw new Exception("There was a critical Discord error starting a new team for the pilot.  Please resolve this manually as soon as possible.", err);
        }
    }

    //              #    ###         ###    #    ##           #
    //              #    #  #        #  #         #           #
    //  ###   ##   ###   ###   #  #  #  #  ##     #     ##   ###
    // #  #  # ##   #    #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #    #  #   # #  #      #     #    #  #   #
    // #      ##     ##  ###     #   #     ###   ###    ##     ##
    //  ###                     #
    /**
     * Gets a new team creation object by pilot.
     * @param {DiscordJs.GuildMember} pilot The pilot to get the new team creation object for.
     * @returns {Promise<NewTeam>} A promise that resolves with the new team creation object, or nothing if it does not exist for the pilot.
     */
    static async getByPilot(pilot) {
        let data;
        try {
            data = await Db.getByPilot(pilot);
        } catch (err) {
            throw new Exception("There was a database error getting a pilot's new team creation object.", err);
        }

        return data ? new NewTeam(data) : void 0;
    }

    //       #                             ##
    //       #                              #
    //  ##   ###    ###  ###   ###    ##    #
    // #     #  #  #  #  #  #  #  #  # ##   #
    // #     #  #  # ##  #  #  #  #  ##     #
    //  ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Gets the new team creation channel.
     * @returns {DiscordJs.TextChannel} The new team creation channel.
     */
    get channel() {
        return /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(this.channelName)); // eslint-disable-line no-extra-parens
    }

    //       #                             ##    #  #
    //       #                              #    ## #
    //  ##   ###    ###  ###   ###    ##    #    ## #   ###  # #    ##
    // #     #  #  #  #  #  #  #  #  # ##   #    # ##  #  #  ####  # ##
    // #     #  #  # ##  #  #  #  #  ##     #    # ##  # ##  #  #  ##
    //  ##   #  #   # #  #  #  #  #   ##   ###   #  #   # #  #  #   ##
    /**
     * Gets the new team creation channel name.
     * @returns {string} The new team creation channel name.
     */
    get channelName() {
        return `new-team-${this.member.id}`;
    }

    //                          #          ###
    //                          #           #
    //  ##   ###    ##    ###  ###    ##    #     ##    ###  # #
    // #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     #     ##    # ##   #    ##     #    ##    # ##  #  #
    //  ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Creates a team from the new team object.
     * @returns {Promise<Team>} A promise that resolves with the team.
     */
    createTeam() {
        return Team.create(this);
    }

    //    #        ##           #
    //    #         #           #
    //  ###   ##    #     ##   ###    ##
    // #  #  # ##   #    # ##   #    # ##
    // #  #  ##     #    ##     #    ##
    //  ###   ##   ###    ##     ##   ##
    /**
     * Deletes a new team creation channel.
     * @param {string} reason The reason the channel is being deleted.
     * @returns {Promise} A promise that resolves when the channel is deleted.
     */
    async delete(reason) {
        try {
            await Db.delete(this);
        } catch (err) {
            throw new Exception("There was a database error removing a new team creation record.", err);
        }

        try {
            await this.channel.delete(reason);
        } catch (err) {
            throw new Exception("There was a critical Discord error removing a new team creation channel.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    #  #
    //               #    ## #
    //  ###    ##   ###   ## #   ###  # #    ##
    // ##     # ##   #    # ##  #  #  ####  # ##
    //   ##   ##     #    # ##  # ##  #  #  ##
    // ###     ##     ##  #  #   # #  #  #   ##
    /**
     * Sets a new team's name.
     * @param {string} name The name.
     * @returns {Promise} A promise that resolves when the name is set.
     */
    async setName(name) {
        try {
            await Db.setName(this, name);
        } catch (err) {
            throw new Exception("There was a database error setting a new team's name.", err);
        }

        this.name = name;

        try {
            await this.updateChannel();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a new team name.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    ###
    //               #     #
    //  ###    ##   ###    #     ###   ###
    // ##     # ##   #     #    #  #  #  #
    //   ##   ##     #     #    # ##   ##
    // ###     ##     ##   #     # #  #
    //                                 ###
    /**
     * Sets a new team's tag.
     * @param {string} tag The tag.
     * @returns {Promise} A promise that resolves when the tag is set.
     */
    async setTag(tag) {
        try {
            await Db.setTag(this, tag);
        } catch (err) {
            throw new Exception("There was a database error setting a new team's tag.", err);
        }

        this.tag = tag;

        try {
            await this.updateChannel();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a new team tag.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                #         #           ##   #                             ##
    //                #         #          #  #  #                              #
    // #  #  ###    ###   ###  ###    ##   #     ###    ###  ###   ###    ##    #
    // #  #  #  #  #  #  #  #   #    # ##  #     #  #  #  #  #  #  #  #  # ##   #
    // #  #  #  #  #  #  # ##   #    ##    #  #  #  #  # ##  #  #  #  #  ##     #
    //  ###  ###    ###   # #    ##   ##    ##   #  #   # #  #  #  #  #   ##   ###
    //       #
    /**
     * Updates a new team's channel.
     * @returns {Promise} A promise that resolves when the channel is updated.
     */
    async updateChannel() {
        const embed = Discord.messageEmbed({
            title: "New Team Creation",
            fields: [
                {
                    name: "Team Name:",
                    value: this.name || "(unset)",
                    inline: true
                },
                {
                    name: "Team Tag:",
                    value: this.tag || "(unset)",
                    inline: true
                }
            ]
        });

        const commands = [];

        commands.push("`!name <name>` - Set your team's name.  Required before you complete team creation.");
        commands.push("`!tag <tag>` - Sets your tame tag, which is up to five letters or numbers that is considered to be a short form of your team name.  Required before you complete team creation.");
        commands.push("`!cancel` - Cancels team creation.");
        commands.push("`!complete` - Completes the team creation process and creates your team on the OTL.");

        embed.addField("Commands", commands.join("\n"));

        const pinned = await this.channel.messages.fetchPinned(false);

        if (pinned.size === 1) {
            Discord.richEdit(pinned.first(), embed);
        } else {
            for (const message of pinned) {
                await message[1].unpin();
            }

            const message = await Discord.richQueue(embed, this.channel);

            await message.pin();
        }
    }
}

module.exports = NewTeam;
