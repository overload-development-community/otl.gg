/**
 * @typedef {import("discord.js").CategoryChannel} DiscordJs.CategoryChannel
 * @typedef {import("discord.js").ColorResolvable} DiscordJs.ColorResolvable
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").Role} DiscordJs.Role
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 * @typedef {import("discord.js").VoiceChannel} DiscordJs.VoiceChannel
 * @typedef {import("./newTeam.js")} NewTeam
 * @typedef {{member?: DiscordJs.GuildMember, id: number, name: string, tag: string, isFounder?: boolean, disbanded?: boolean, locked?: boolean}} TeamData
 * @typedef {{homes: string[], members: {name: string, role: string}[], requests: {name: string, date: Date}[], invites: {name: string, date: Date}[], penaltiesRemaining: number}} TeamInfo
 */

const Db = require("./database/team"),
    Exception = require("./exception"),
    Log = require("./log"),
    settings = require("../settings");

/**
 * @type {typeof import("./challenge")}
 */
let Challenge;

setTimeout(() => {
    Challenge = require("./challenge");
}, 0);

/**
 * @type {typeof import("./discord")}
 */
let Discord;

setTimeout(() => {
    Discord = require("./discord");
}, 0);

//  #####
//    #
//    #     ###    ###   ## #
//    #    #   #      #  # # #
//    #    #####   ####  # # #
//    #    #      #   #  # # #
//    #     ###    ####  #   #
/**
 * A class that handles team-related functions.
 */
class Team {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * A constructor to create a team.
     * @param {TeamData} data The data to load into the team.
     */
    constructor(data) {
        if (data) {
            this.id = data.id;
            this.name = data.name;
            this.tag = data.tag;
            if (data.isFounder) {
                this.founder = data.member;
            }
            this.disbanded = data.disbanded;
            this.locked = data.locked;
        }
    }

    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Creates a new team.
     * @param {NewTeam} newTeam The data to create the team with.
     * @returns {Promise<Team>} A promise that resolves with the newly created team.
     */
    static async create(newTeam) {
        let teamData;
        try {
            teamData = await Db.create(newTeam);
        } catch (err) {
            throw new Exception("There was a database error creating a team.", err);
        }

        const team = new Team(teamData);

        try {
            await team.setup(newTeam.member, false);

            await newTeam.delete(`${newTeam.member.displayName} created the team ${newTeam.name}.`);
        } catch (err) {
            throw new Exception("There was a critical Discord error creating a team.  Please resolve this manually as soon as possible.", err);
        }

        return team;
    }

    //              #    ###         ###      #
    //              #    #  #         #       #
    //  ###   ##   ###   ###   #  #   #     ###
    // #  #  # ##   #    #  #  #  #   #    #  #
    //  ##   ##     #    #  #   # #   #    #  #
    // #      ##     ##  ###     #   ###    ###
    //  ###                     #
    /**
     * Gets a team by its Team ID.
     * @param {number} id The team ID.
     * @returns {Promise<Team>} A promise that resolves with the team.
     */
    static async getById(id) {
        let data;
        try {
            data = await Db.getById(id);
        } catch (err) {
            throw new Exception("There was a database error getting a team by team ID.", err);
        }

        return data ? new Team(data) : void 0;
    }

    //              #    ###         ###    #    ##           #
    //              #    #  #        #  #         #           #
    //  ###   ##   ###   ###   #  #  #  #  ##     #     ##   ###
    // #  #  # ##   #    #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #    #  #   # #  #      #     #    #  #   #
    // #      ##     ##  ###     #   #     ###   ###    ##     ##
    //  ###                     #
    /**
     * Gets a team by its pilot.
     * @param {DiscordJs.GuildMember} pilot The pilot to get the team for.
     * @returns {Promise<Team>} A promise that resolves with the team.
     */
    static async getByPilot(pilot) {
        let data;
        try {
            data = await Db.getByPilot(pilot);
        } catch (err) {
            throw new Exception("There was a database error getting a team by pilot.", err);
        }

        return data ? new Team(data) : void 0;
    }

    //              #    ###         #  #                     ##         ###
    //              #    #  #        ## #                    #  #         #
    //  ###   ##   ###   ###   #  #  ## #   ###  # #    ##   #  #  ###    #     ###   ###
    // #  #  # ##   #    #  #  #  #  # ##  #  #  ####  # ##  #  #  #  #   #    #  #  #  #
    //  ##   ##     #    #  #   # #  # ##  # ##  #  #  ##    #  #  #      #    # ##   ##
    // #      ##     ##  ###     #   #  #   # #  #  #   ##    ##   #      #     # #  #
    //  ###                     #                                                     ###
    /**
     * Gets a team by its name or tag.
     * @param {string} name The name or tag.
     * @returns {Promise<Team>} A promise that resolves with the team.
     */
    static async getByNameOrTag(name) {
        let data;
        try {
            data = await Db.getByNameOrTag(name);
        } catch (err) {
            throw new Exception("There was a database error getting a team by name or tag.", err);
        }

        return data ? new Team(data) : void 0;
    }

    //                         ####         #            #
    //                         #                         #
    // ###    ###  # #    ##   ###   #  #  ##     ###   ###    ###
    // #  #  #  #  ####  # ##  #      ##    #    ##      #    ##
    // #  #  # ##  #  #  ##    #      ##    #      ##    #      ##
    // #  #   # #  #  #   ##   ####  #  #  ###   ###      ##  ###
    /**
     * Determines whether a team name exists.
     * @param {string} name The team name to check.
     * @returns {boolean} A promise that resolves with whether the team name exists.
     */
    static nameExists(name) {
        return !!Discord.findRoleByName(`Team: ${name}`);
    }

    //  #                ####         #            #
    //  #                #                         #
    // ###    ###   ###  ###   #  #  ##     ###   ###    ###
    //  #    #  #  #  #  #      ##    #    ##      #    ##
    //  #    # ##   ##   #      ##    #      ##    #      ##
    //   ##   # #  #     ####  #  #  ###   ###      ##  ###
    //              ###
    /**
     * Determines whether a team tag exists.
     * @param {string} tag The team tag to check.
     * @returns {boolean} A promise that resolves with whether the team tag exists.
     */
    static tagExists(tag) {
        return !!Discord.findChannelByName(`Team ${tag}`);
    }

    //                                                                    #            ##   #                             ##
    //                                                                    #           #  #  #                              #
    //  ###  ###   ###    ##   #  #  ###    ##    ##   # #    ##   ###   ###    ###   #     ###    ###  ###   ###    ##    #
    // #  #  #  #  #  #  #  #  #  #  #  #  #     # ##  ####  # ##  #  #   #    ##     #     #  #  #  #  #  #  #  #  # ##   #
    // # ##  #  #  #  #  #  #  #  #  #  #  #     ##    #  #  ##    #  #   #      ##   #  #  #  #  # ##  #  #  #  #  ##     #
    //  # #  #  #  #  #   ##    ###  #  #   ##    ##   #  #   ##   #  #    ##  ###     ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Gets the team's announcements channel.
     * @returns {DiscordJs.TextChannel} The team's announcements channel.
     */
    get announcementsChannel() {
        return /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(this.announcementsChannelName)); // eslint-disable-line no-extra-parens
    }

    //                                                                    #            ##   #                             ##    #  #
    //                                                                    #           #  #  #                              #    ## #
    //  ###  ###   ###    ##   #  #  ###    ##    ##   # #    ##   ###   ###    ###   #     ###    ###  ###   ###    ##    #    ## #   ###  # #    ##
    // #  #  #  #  #  #  #  #  #  #  #  #  #     # ##  ####  # ##  #  #   #    ##     #     #  #  #  #  #  #  #  #  # ##   #    # ##  #  #  ####  # ##
    // # ##  #  #  #  #  #  #  #  #  #  #  #     ##    #  #  ##    #  #   #      ##   #  #  #  #  # ##  #  #  #  #  ##     #    # ##  # ##  #  #  ##
    //  # #  #  #  #  #   ##    ###  #  #   ##    ##   #  #   ##   #  #    ##  ###     ##   #  #   # #  #  #  #  #   ##   ###   #  #   # #  #  #   ##
    /**
     * Gets the team's announcements channel name.
     * @returns {string} The team's announcements channel name.
     */
    get announcementsChannelName() {
        return `announcements-${this.tag.toLowerCase().replace(/ /g, "-")}`;
    }

    //                    #           #                  ##   #                             ##
    //                    #                             #  #  #                              #
    //  ##    ###  ###   ###    ###  ##    ###    ###   #     ###    ###  ###   ###    ##    #
    // #     #  #  #  #   #    #  #   #    #  #  ##     #     #  #  #  #  #  #  #  #  # ##   #
    // #     # ##  #  #   #    # ##   #    #  #    ##   #  #  #  #  # ##  #  #  #  #  ##     #
    //  ##    # #  ###     ##   # #  ###   #  #  ###     ##   #  #   # #  #  #  #  #   ##   ###
    //             #
    /**
     * Gets the team's captains channel.
     * @returns {DiscordJs.TextChannel} The team's captains channel.
     */
    get captainsChannel() {
        return /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(this.captainsChannelName)); // eslint-disable-line no-extra-parens
    }

    //                    #           #                  ##   #                             ##    #  #
    //                    #                             #  #  #                              #    ## #
    //  ##    ###  ###   ###    ###  ##    ###    ###   #     ###    ###  ###   ###    ##    #    ## #   ###  # #    ##
    // #     #  #  #  #   #    #  #   #    #  #  ##     #     #  #  #  #  #  #  #  #  # ##   #    # ##  #  #  ####  # ##
    // #     # ##  #  #   #    # ##   #    #  #    ##   #  #  #  #  # ##  #  #  #  #  ##     #    # ##  # ##  #  #  ##
    //  ##    # #  ###     ##   # #  ###   #  #  ###     ##   #  #   # #  #  #  #  #   ##   ###   #  #   # #  #  #   ##
    //             #
    /**
     * Gets the team's captains channel name.
     * @returns {string} The team's captains channel name.
     */
    get captainsChannelName() {
        return `captains-${this.tag.toLowerCase().replace(/ /g, "-")}`;
    }

    //                    #           #                 #  #         #                 ##   #                             ##
    //                    #                             #  #                          #  #  #                              #
    //  ##    ###  ###   ###    ###  ##    ###    ###   #  #   ##   ##     ##    ##   #     ###    ###  ###   ###    ##    #
    // #     #  #  #  #   #    #  #   #    #  #  ##     #  #  #  #   #    #     # ##  #     #  #  #  #  #  #  #  #  # ##   #
    // #     # ##  #  #   #    # ##   #    #  #    ##    ##   #  #   #    #     ##    #  #  #  #  # ##  #  #  #  #  ##     #
    //  ##    # #  ###     ##   # #  ###   #  #  ###     ##    ##   ###    ##    ##    ##   #  #   # #  #  #  #  #   ##   ###
    //             #
    /**
     * Gets the team's captains voice channel.
     * @returns {DiscordJs.VoiceChannel} The team's captains voice channel.
     */
    get captainsVoiceChannel() {
        return /** @type {DiscordJs.VoiceChannel} */ (Discord.findChannelByName(this.captainsVoiceChannelName)); // eslint-disable-line no-extra-parens
    }

    //                    #           #                 #  #         #                 ##   #                             ##    #  #
    //                    #                             #  #                          #  #  #                              #    ## #
    //  ##    ###  ###   ###    ###  ##    ###    ###   #  #   ##   ##     ##    ##   #     ###    ###  ###   ###    ##    #    ## #   ###  # #    ##
    // #     #  #  #  #   #    #  #   #    #  #  ##     #  #  #  #   #    #     # ##  #     #  #  #  #  #  #  #  #  # ##   #    # ##  #  #  ####  # ##
    // #     # ##  #  #   #    # ##   #    #  #    ##    ##   #  #   #    #     ##    #  #  #  #  # ##  #  #  #  #  ##     #    # ##  # ##  #  #  ##
    //  ##    # #  ###     ##   # #  ###   #  #  ###     ##    ##   ###    ##    ##    ##   #  #   # #  #  #  #  #   ##   ###   #  #   # #  #  #   ##
    //             #
    /**
     * Gets the team's captains voice channel name.
     * @returns {string} The team's captains voice channel name.
     */
    get captainsVoiceChannelName() {
        return `Captains ${this.tag}`;
    }

    //              #                                   ##   #                             ##
    //              #                                  #  #  #                              #
    //  ##    ###  ###    ##    ###   ##   ###   #  #  #     ###    ###  ###   ###    ##    #
    // #     #  #   #    # ##  #  #  #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #
    // #     # ##   #    ##     ##   #  #  #      # #  #  #  #  #  # ##  #  #  #  #  ##     #
    //  ##    # #    ##   ##   #      ##   #       #    ##   #  #   # #  #  #  #  #   ##   ###
    //                          ###               #
    /**
     * Gets the team's category channel.
     * @returns {DiscordJs.CategoryChannel} The team's category channel.
     */
    get categoryChannel() {
        return /** @type {DiscordJs.CategoryChannel} */ (Discord.findChannelByName(this.name)); // eslint-disable-line no-extra-parens
    }

    //  #                       ##   #                             ##
    //  #                      #  #  #                              #
    // ###    ##    ###  # #   #     ###    ###  ###   ###    ##    #
    //  #    # ##  #  #  ####  #     #  #  #  #  #  #  #  #  # ##   #
    //  #    ##    # ##  #  #  #  #  #  #  # ##  #  #  #  #  ##     #
    //   ##   ##    # #  #  #   ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Gets the team's channel.
     * @returns {DiscordJs.TextChannel} The team's channel.
     */
    get teamChannel() {
        return /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(this.teamChannelName)); // eslint-disable-line no-extra-parens
    }

    //  #                       ##   #                             ##    #  #
    //  #                      #  #  #                              #    ## #
    // ###    ##    ###  # #   #     ###    ###  ###   ###    ##    #    ## #   ###  # #    ##
    //  #    # ##  #  #  ####  #     #  #  #  #  #  #  #  #  # ##   #    # ##  #  #  ####  # ##
    //  #    ##    # ##  #  #  #  #  #  #  # ##  #  #  #  #  ##     #    # ##  # ##  #  #  ##
    //   ##   ##    # #  #  #   ##   #  #   # #  #  #  #  #   ##   ###   #  #   # #  #  #   ##
    /**
     * Getws the team's channel name.
     * @returns {string} The team's channel name.
     */
    get teamChannelName() {
        return `team-${this.tag.toLowerCase().replace(/ /g, "-")}`;
    }

    //  #                      #  #         #                 ##   #                             ##
    //  #                      #  #                          #  #  #                              #
    // ###    ##    ###  # #   #  #   ##   ##     ##    ##   #     ###    ###  ###   ###    ##    #
    //  #    # ##  #  #  ####  #  #  #  #   #    #     # ##  #     #  #  #  #  #  #  #  #  # ##   #
    //  #    ##    # ##  #  #   ##   #  #   #    #     ##    #  #  #  #  # ##  #  #  #  #  ##     #
    //   ##   ##    # #  #  #   ##    ##   ###    ##    ##    ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Gets the team's voice channel.
     * @returns {DiscordJs.VoiceChannel} The team's voice channel.
     */
    get teamVoiceChannel() {
        return /** @type {DiscordJs.VoiceChannel} */ (Discord.findChannelByName(this.teamVoiceChannelName)); // eslint-disable-line no-extra-parens
    }

    //  #                      #  #         #                 ##   #                             ##    #  #
    //  #                      #  #                          #  #  #                              #    ## #
    // ###    ##    ###  # #   #  #   ##   ##     ##    ##   #     ###    ###  ###   ###    ##    #    ## #   ###  # #    ##
    //  #    # ##  #  #  ####  #  #  #  #   #    #     # ##  #     #  #  #  #  #  #  #  #  # ##   #    # ##  #  #  ####  # ##
    //  #    ##    # ##  #  #   ##   #  #   #    #     ##    #  #  #  #  # ##  #  #  #  #  ##     #    # ##  # ##  #  #  ##
    //   ##   ##    # #  #  #   ##    ##   ###    ##    ##    ##   #  #   # #  #  #  #  #   ##   ###   #  #   # #  #  #   ##
    /**
     * Gets the team's voice channel name.
     * @returns {string} The team's voice channel name.
     */
    get teamVoiceChannelName() {
        return `Team ${this.tag}`;
    }

    //             ##
    //              #
    // ###    ##    #     ##
    // #  #  #  #   #    # ##
    // #     #  #   #    ##
    // #      ##   ###    ##
    /**
     * Gets the team's role.
     * @returns {DiscordJs.Role} The team's role.
     */
    get role() {
        return Discord.findRoleByName(this.roleName);
    }

    //             ##          #  #
    //              #          ## #
    // ###    ##    #     ##   ## #   ###  # #    ##
    // #  #  #  #   #    # ##  # ##  #  #  ####  # ##
    // #     #  #   #    ##    # ##  # ##  #  #  ##
    // #      ##   ###    ##   #  #   # #  #  #   ##
    /**
     * Gets the team's role name.
     * @returns {string} The team's role name.
     */
    get roleName() {
        return `Team: ${this.name}`;
    }

    //          #     #   ##                #           #
    //          #     #  #  #               #
    //  ###   ###   ###  #      ###  ###   ###    ###  ##    ###
    // #  #  #  #  #  #  #     #  #  #  #   #    #  #   #    #  #
    // # ##  #  #  #  #  #  #  # ##  #  #   #    # ##   #    #  #
    //  # #   ###   ###   ##    # #  ###     ##   # #  ###   #  #
    //                               #
    /**
     * Adds a captain to the team.
     * @param {DiscordJs.GuildMember} member The pilot adding the captain.
     * @param {DiscordJs.GuildMember} captain The pilot to add as a captain.
     * @returns {Promise} A promise that resolves when the captain has been added.
     */
    async addCaptain(member, captain) {
        try {
            await Db.addCaptain(this, captain);
        } catch (err) {
            throw new Exception("There was a database error adding a captain.", err);
        }

        try {
            const announcementsChannel = this.announcementsChannel;
            if (!announcementsChannel) {
                throw new Error("Announcement's channel does not exist for the team.");
            }

            const captainsChannel = this.captainsChannel;
            if (!captainsChannel) {
                throw new Error("Captain's channel does not exist for the team.");
            }

            const captainsVoiceChannel = this.captainsVoiceChannel;
            if (!captainsVoiceChannel) {
                throw new Error("Captain's voice channel does not exist for the team.");
            }

            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                throw new Error("Team's channel does not exist.");
            }

            await captain.addRole(Discord.captainRole, `${member.displayName} added ${captain.displayName} as a captain of ${this.name}.`);

            await captainsChannel.overwritePermissions(
                captain,
                {"VIEW_CHANNEL": true},
                `${member.displayName} added ${captain.displayName} as a captain of ${this.name}.`
            );

            await captainsVoiceChannel.overwritePermissions(
                captain,
                {"VIEW_CHANNEL": true},
                `${member.displayName} added ${captain.displayName} as a captain of ${this.name}.`
            );

            await this.updateChannels();

            await Discord.queue(`${captain}, you have been added as a captain of **${this.name}**!  You now have access to your team's captain's channel, ${captainsChannel}, and can post in the team's announcements channel, ${announcementsChannel}.  Be sure to read the pinned messages in that channel for more information as to what you can do for your team as a captain.`, captain);
            await Discord.queue(`Welcome **${captain}** as the newest team captain!`, captainsChannel);
            await Discord.queue(`**${captain}** is now a team captain!`, teamChannel);
            await Discord.richQueue(Discord.richEmbed({
                title: `${this.name} (${this.tag})`,
                description: "Leadership Update",
                color: this.role.color,
                fields: [
                    {
                        name: "Captain Added",
                        value: `${captain}`
                    }
                ],
                footer: {
                    text: `added by ${member.displayName}`
                }
            }), Discord.rosterUpdatesChannel);

            await this.updateChannels();
        } catch (err) {
            throw new Exception("There was a critical Discord error adding a captain.  Please resolve this manually as soon as possible.", err);
        }
    }

    //          #     #  ###    #    ##           #
    //          #     #  #  #         #           #
    //  ###   ###   ###  #  #  ##     #     ##   ###
    // #  #  #  #  #  #  ###    #     #    #  #   #
    // # ##  #  #  #  #  #      #     #    #  #   #
    //  # #   ###   ###  #     ###   ###    ##     ##
    /**
     * Adds a pilot to the team.
     * @param {DiscordJs.GuildMember} member The pilot to add.
     * @returns {Promise} A promise that resolves when the pilot has been added.
     */
    async addPilot(member) {
        try {
            await Db.addPilot(member, this);
        } catch (err) {
            throw new Exception("There was a database error adding a pilot to a team.", err);
        }

        try {
            const captainsChannel = this.captainsChannel;
            if (!captainsChannel) {
                throw new Error("Captain's channel does not exist for the team.");
            }

            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                throw new Error("Team's channel does not exist.");
            }

            await member.addRole(this.role, `${member.displayName} accepted their invitation to ${this.name}.`);

            await this.updateChannels();

            await Discord.queue(`${member}, you are now a member of **${this.name}**!  You now have access to your team's channel, ${teamChannel}.`, member);
            await Discord.queue(`**${member}** has accepted your invitation to join the team!`, captainsChannel);
            await Discord.queue(`**${member}** has joined the team!`, teamChannel);
            await Discord.richQueue(Discord.richEmbed({
                title: `${this.name} (${this.tag})`,
                description: "Pilot Added",
                color: this.role.color,
                fields: [
                    {
                        name: "Pilot Added",
                        value: `${member}`
                    }
                ],
                footer: {
                    text: "added by accepted invitation"
                }
            }), Discord.rosterUpdatesChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error adding a pilot to a team.  Please resolve this manually as soon as possible.", err);
        }
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
     * @param {DiscordJs.GuildMember} member The pilot updating the home map.
     * @param {number} number The number of the home map.
     * @param {string} map The new home map.
     * @returns {Promise} A promise that resolves when the home map has been updated.
     */
    async applyHomeMap(member, number, map) {
        try {
            await Db.updateHomeMap(this, number, map);
        } catch (err) {
            throw new Exception("There was a database error setting a home map.", err);
        }

        try {
            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                throw new Error("Guild channel does not exist for the team.");
            }

            await this.updateChannels();

            await Discord.queue(`${member} has changed home map number ${number} to ${map}.`, teamChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a home map.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                    #           #           ##                      #
    //                    #                      #  #                     #
    //  ##    ###  ###   ###    ###  ##    ###   #      ##   #  #  ###   ###
    // #     #  #  #  #   #    #  #   #    #  #  #     #  #  #  #  #  #   #
    // #     # ##  #  #   #    # ##   #    #  #  #  #  #  #  #  #  #  #   #
    //  ##    # #  ###     ##   # #  ###   #  #   ##    ##    ###  #  #    ##
    //             #
    /**
     * Gets the count of captains on the team.
     * @returns {number} The number of captains on the team.
     */
    captainCount() {
        return this.role.members.filter((tm) => !!Discord.captainRole.members.find((cm) => cm.id === tm.id)).size;
    }

    //       #                              ##         ##
    //       #                             #  #         #
    //  ##   ###    ###  ###    ###   ##   #      ##    #     ##   ###
    // #     #  #  #  #  #  #  #  #  # ##  #     #  #   #    #  #  #  #
    // #     #  #  # ##  #  #   ##   ##    #  #  #  #   #    #  #  #
    //  ##   #  #   # #  #  #  #      ##    ##    ##   ###    ##   #
    //                          ###
    /**
     * Changes the team's color.
     * @param {DiscordJs.GuildMember} member The pilot whose team to change color for.
     * @param {DiscordJs.ColorResolvable} color The color to change to.
     * @returns {Promise} A promise that resolves when the team's color has changed.
     */
    async changeColor(member, color) {
        try {
            await this.role.setColor(color, `${member.displayName} updated the team color.`);
        } catch (err) {
            throw new Exception("There was a Discord error changing a team's color.", err);
        }
    }

    //    #   #           #                    #  ###
    //    #               #                    #   #
    //  ###  ##     ###   ###    ###  ###    ###   #     ##    ###  # #
    // #  #   #    ##     #  #  #  #  #  #  #  #   #    # ##  #  #  ####
    // #  #   #      ##   #  #  # ##  #  #  #  #   #    ##    # ##  #  #
    //  ###  ###   ###    ###    # #  #  #   ###   #     ##    # #  #  #
    /**
     * Disbands the team.
     * @param {DiscordJs.GuildMember} member The pilot disbanding the team.
     * @returns {Promise} A promise that resolves when the team is disbanded.
     */
    async disband(member) {
        let challengeIds;
        try {
            challengeIds = await Db.disband(this);
        } catch (err) {
            throw new Exception("There was a database error disbanding a team.", err);
        }

        try {
            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                throw new Error("Team channel does not exist.");
            }

            const announcementsChannel = this.announcementsChannel;
            if (!announcementsChannel) {
                throw new Error("Announcements channel does not exist.");
            }

            const captainsChannel = this.captainsChannel;
            if (!captainsChannel) {
                throw new Error("Captain channel does not exist.");
            }

            const teamVoiceChannel = this.teamVoiceChannel;
            if (!teamVoiceChannel) {
                throw new Error("Team voice channel does not exist.");
            }

            const captainsVoiceChannel = this.captainsVoiceChannel;
            if (!captainsVoiceChannel) {
                throw new Error("Captains voice channel does not exist.");
            }

            const categoryChannel = this.categoryChannel;
            if (!categoryChannel) {
                throw new Error("Team category does not exist.");
            }

            await teamChannel.delete(`${member.displayName} disbanded ${this.name}.`);
            await announcementsChannel.delete(`${member.displayName} disbanded ${this.name}.`);
            await captainsChannel.delete(`${member.displayName} disbanded ${this.name}.`);
            await teamVoiceChannel.delete(`${member.displayName} disbanded ${this.name}.`);
            await captainsVoiceChannel.delete(`${member.displayName} disbanded ${this.name}.`);
            await categoryChannel.delete(`${member.displayName} disbanded ${this.name}.`);

            const memberList = [];

            for (const memberPair of this.role.members) {
                const teamMember = memberPair[1];

                memberList.push(`${teamMember}`);

                if (Discord.captainRole.members.find((m) => m.id === teamMember.id)) {
                    await teamMember.removeRole(Discord.captainRole, `${member.displayName} disbanded ${this.name}.`);
                }

                if (Discord.founderRole.members.find((m) => m.id === teamMember.id)) {
                    await teamMember.removeRole(Discord.founderRole, `${member.displayName} disbanded ${this.name}.`);
                }

                await Discord.queue(`Your team **${this.name}** has been disbanded.`, teamMember);
            }

            await Discord.richQueue(Discord.richEmbed({
                title: `${this.name} (${this.tag})`,
                description: "Team Disbanded",
                color: this.role.color,
                fields: memberList.length > 0 ? [
                    {
                        name: "Pilots Removed",
                        value: `${memberList.join(", ")}`
                    }
                ] : void 0,
                footer: {
                    text: `disbanded by ${member.displayName}`
                }
            }), Discord.rosterUpdatesChannel);

            await this.role.delete(`${member.displayName} disbanded ${this.name}.`);

            this.disbanded = true;
        } catch (err) {
            throw new Exception("There was a critical Discord error disbanding a team.  Please resolve this manually as soon as possible.", err);
        }

        for (const challengeId of challengeIds) {
            const challenge = await Challenge.getById(challengeId);
            if (challenge) {
                challenge.void(member, this);
            }
        }
    }

    //              #     ##   ##                #              #   ##   #           ##    ##                             ##                      #
    //              #    #  #   #                #              #  #  #  #            #     #                            #  #                     #
    //  ###   ##   ###   #      #     ##    ##   # #    ##    ###  #     ###    ###   #     #     ##   ###    ###   ##   #      ##   #  #  ###   ###
    // #  #  # ##   #    #      #    #  #  #     ##    # ##  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #     #  #  #  #  #  #   #
    //  ##   ##     #    #  #   #    #  #  #     # #   ##    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #
    // #      ##     ##   ##   ###    ##    ##   #  #   ##    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##    ##    ###  #  #    ##
    //  ###                                                                                                   ###
    /**
     * Gets the number of clocked challenges for this team.
     * @returns {Promise<number>} A promise that resolves with the number of clocked challenges.
     */
    async getClockedChallengeCount() {
        try {
            return await Db.getClockedChallengeCount(this);
        } catch (err) {
            throw new Exception("There was a database error getting the number of clocked challenges for a team.", err);
        }
    }

    //              #    #  #                    #  #
    //              #    #  #                    ####
    //  ###   ##   ###   ####   ##   # #    ##   ####   ###  ###    ###
    // #  #  # ##   #    #  #  #  #  ####  # ##  #  #  #  #  #  #  ##
    //  ##   ##     #    #  #  #  #  #  #  ##    #  #  # ##  #  #    ##
    // #      ##     ##  #  #   ##   #  #   ##   #  #   # #  ###   ###
    //  ###                                                  #
    /**
     * Gets the list of home maps for the team.
     * @returns {Promise<string[]>} A promise that resolves with a list of the team's home maps.
     */
    async getHomeMaps() {
        try {
            return await Db.getHomeMaps(this);
        } catch (err) {
            throw new Exception("There was a database error getting the home maps for the team the pilot is on.", err);
        }
    }

    //              #    ###           #
    //              #     #           # #
    //  ###   ##   ###    #    ###    #     ##
    // #  #  # ##   #     #    #  #  ###   #  #
    //  ##   ##     #     #    #  #   #    #  #
    // #      ##     ##  ###   #  #   #     ##
    //  ###
    /**
     * Gets the team info.
     * @returns {Promise<TeamInfo>} A promise that resolves with the team's info.
     */
    async getInfo() {
        try {
            return await Db.getInfo(this);
        } catch (err) {
            throw new Exception("There was a database error getting the team info.", err);
        }
    }

    //              #    #  #               #     ##   ##                #     ###          #
    //              #    ## #               #    #  #   #                #     #  #         #
    //  ###   ##   ###   ## #   ##   #  #  ###   #      #     ##    ##   # #   #  #   ###  ###    ##
    // #  #  # ##   #    # ##  # ##   ##    #    #      #    #  #  #     ##    #  #  #  #   #    # ##
    //  ##   ##     #    # ##  ##     ##    #    #  #   #    #  #  #     # #   #  #  # ##   #    ##
    // #      ##     ##  #  #   ##   #  #    ##   ##   ###    ##    ##   #  #  ###    # #    ##   ##
    //  ###
    /**
     * Gets the next date that this team can put a challenge on the clock.
     * @returns {Promise<Date>} A promise that resolves with the date the team can put a challenge on the clock.  Returns undefined if they have not clocked a challenge yet.
     */
    async getNextClockDate() {
        try {
            return await Db.getNextClockDate(this);
        } catch (err) {
            throw new Exception("There was a database error getting a team's next clock date.", err);
        }
    }

    //              #    ###    #    ##           #     ##            #  ###                #     #             #   ##                      #
    //              #    #  #         #           #    #  #           #   #                       #             #  #  #                     #
    //  ###   ##   ###   #  #  ##     #     ##   ###   #  #  ###    ###   #    ###   # #   ##    ###    ##    ###  #      ##   #  #  ###   ###
    // #  #  # ##   #    ###    #     #    #  #   #    ####  #  #  #  #   #    #  #  # #    #     #    # ##  #  #  #     #  #  #  #  #  #   #
    //  ##   ##     #    #      #     #    #  #   #    #  #  #  #  #  #   #    #  #  # #    #     #    ##    #  #  #  #  #  #  #  #  #  #   #
    // #      ##     ##  #     ###   ###    ##     ##  #  #  #  #   ###  ###   #  #   #    ###     ##   ##    ###   ##    ##    ###  #  #    ##
    //  ###
    /**
     * Gets the total number of pilots on the team and invited to the team.
     * @returns {Promise<number>} A promise that resolves with the total number of pilots on the team and invited to the team.
     */
    async getPilotAndInvitedCount() {
        try {
            return await Db.getPilotAndInvitedCount(this);
        } catch (err) {
            throw new Exception("There was a database error getting the number of pilots on and invited to a team.", err);
        }
    }

    //              #    ###    #    ##           #     ##                      #
    //              #    #  #         #           #    #  #                     #
    //  ###   ##   ###   #  #  ##     #     ##   ###   #      ##   #  #  ###   ###
    // #  #  # ##   #    ###    #     #    #  #   #    #     #  #  #  #  #  #   #
    //  ##   ##     #    #      #     #    #  #   #    #  #  #  #  #  #  #  #   #
    // #      ##     ##  #     ###   ###    ##     ##   ##    ##    ###  #  #    ##
    //  ###
    /**
     * Gets the number of pilots on the team.
     * @returns {Promise<number>} A promise that resolves with the total number of pilots on the team.
     */
    async getPilotCount() {
        try {
            return await Db.getPilotCount(this);
        } catch (err) {
            throw new Exception("There was a database error getting the number of pilots on a team.", err);
        }
    }

    //              #    ###    #
    //              #     #
    //  ###   ##   ###    #    ##    # #    ##   ####   ##   ###    ##
    // #  #  # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##
    //  ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##
    // #      ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##
    //  ###
    /**
     * Gets the team's time zone.
     * @returns {Promise<string>} A promise that resolves with the team's time zone.
     */
    async getTimezone() {
        try {
            return await Db.getTimezone(this) || settings.defaultTimezone;
        } catch (err) {
            return settings.defaultTimezone;
        }
    }

    // #                   ##   ##                #              #  ###   #      #            ##
    // #                  #  #   #                #              #   #    #                  #  #
    // ###    ###   ###   #      #     ##    ##   # #    ##    ###   #    ###   ##     ###    #     ##    ###   ###    ##   ###
    // #  #  #  #  ##     #      #    #  #  #     ##    # ##  #  #   #    #  #   #    ##       #   # ##  #  #  ##     #  #  #  #
    // #  #  # ##    ##   #  #   #    #  #  #     # #   ##    #  #   #    #  #   #      ##   #  #  ##    # ##    ##   #  #  #  #
    // #  #   # #  ###     ##   ###    ##    ##   #  #   ##    ###   #    #  #  ###   ###     ##    ##    # #  ###     ##   #  #
    /**
     * Determines whether this team has clocked a challenge against another team this season.
     * @param {Team} team The team to check against.
     * @returns {Promise<Boolean>} A promise that resolves with whether this team has clocked the specified team this season.
     */
    async hasClockedThisSeason(team) {
        try {
            return await Db.hasClockedTeamThisSeason(this, team);
        } catch (err) {
            throw new Exception("There was a database error getting whether a team has clocked another team this season.", err);
        }
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
     * @param {number} [excludeNumber] Excludes a home map number from the check.
     * @returns {Promise<boolean>} A promise that resolves with whether the team has a stock home map.
     */
    async hasStockHomeMap(excludeNumber) {
        try {
            return await Db.hasStockHomeMap(this, excludeNumber);
        } catch (err) {
            throw new Exception("There was a database error checking whether a team has a stock home map.", err);
        }
    }

    //  #                 #     #          ###    #    ##           #
    //                          #          #  #         #           #
    // ##    ###   # #   ##    ###    ##   #  #  ##     #     ##   ###
    //  #    #  #  # #    #     #    # ##  ###    #     #    #  #   #
    //  #    #  #  # #    #     #    ##    #      #     #    #  #   #
    // ###   #  #   #    ###     ##   ##   #     ###   ###    ##     ##
    /**
     * Invites a pilot to the team.
     * @param {DiscordJs.GuildMember} fromMember The member inviting the pilot to the team.
     * @param {DiscordJs.GuildMember} toMember The pilot being invited to the team.
     * @returns {Promise} A promise that resolves when the pilot has been invited to the team.
     */
    async invitePilot(fromMember, toMember) {
        try {
            await Db.invitePilot(this, toMember);
        } catch (err) {
            throw new Exception("There was a database error inviting a pilot to a team.", err);
        }

        try {
            await Discord.queue(`${toMember.displayName}, you have been invited to join **${this.name}** by ${fromMember.displayName}.  You can accept this invitation by responding with \`!accept ${this.name}\`.`, toMember);

            await this.updateChannels();
        } catch (err) {
            throw new Exception("There was a critical Discord error inviting a pilot to a team.  Please resolve this manually as soon as possible.", err);
        }
    }

    //             #           ####                       #
    //             #           #                          #
    // # #    ###  # #    ##   ###    ##   #  #  ###    ###   ##   ###
    // ####  #  #  ##    # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  # ##  # #   ##    #     #  #  #  #  #  #  #  #  ##    #
    // #  #   # #  #  #   ##   #      ##    ###  #  #   ###   ##   #
    /**
     * Transfers the team's founder from one pilot to another.
     * @param {DiscordJs.GuildMember} member The pilot who is the current founder.
     * @param {DiscordJs.GuildMember} pilot The pilot becoming the founder.
     * @returns {Promise} A promise that resolves when the founder has been transferred.
     */
    async makeFounder(member, pilot) {
        try {
            await Db.makeFounder(this, pilot);
        } catch (err) {
            throw new Exception("There was a database error transfering a team founder to another pilot.", err);
        }

        try {
            if (!this.role.members.find((m) => m.id === pilot.id)) {
                throw new Error("Pilots are not on the same team.");
            }

            const captainsChannel = this.captainsChannel;
            if (!captainsChannel) {
                throw new Error("Captain's channel does not exist for the team.");
            }

            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                throw new Error("Team's channel does not exist.");
            }

            await member.removeRole(Discord.founderRole, `${member.displayName} transferred founder of team ${this.name} to ${pilot.displayName}.`);
            await member.addRole(Discord.captainRole, `${member.displayName} transferred founder of team ${this.name} to ${pilot.displayName}.`);

            await pilot.addRole(Discord.founderRole, `${member.displayName} transferred founder of team ${this.name} to ${pilot.displayName}.`);
            await pilot.removeRole(Discord.captainRole, `${member.displayName} transferred founder of team ${this.name} to ${pilot.displayName}.`);

            await captainsChannel.overwritePermissions(
                pilot,
                {"VIEW_CHANNEL": true},
                `${member.displayName} made ${pilot.displayName} the founder of ${this.name}.`
            );

            await this.updateChannels();

            await Discord.queue(`${pilot}, you are now the founder of **${this.name}**!`, pilot);
            await Discord.queue(`${pilot.displayName} is now the team founder!`, captainsChannel);
            await Discord.queue(`${pilot.displayName} is now the team founder!`, teamChannel);
            await Discord.richQueue(Discord.richEmbed({
                title: `${this.name} (${this.tag})`,
                description: "Leadership Update",
                color: this.role.color,
                fields: [
                    {
                        name: "Old Founder",
                        value: `${member}`
                    },
                    {
                        name: "New Founder",
                        value: `${pilot}`
                    }
                ],
                footer: {
                    text: `changed by ${member.displayName}`
                }
            }), Discord.rosterUpdatesChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error transfering a team founder to another pilot.  Please resolve this manually as soon as possible.", err);
        }
    }

    //        #    ##           #    #             #    #
    //              #           #    #            # #   #
    // ###   ##     #     ##   ###   #      ##    #    ###
    // #  #   #     #    #  #   #    #     # ##  ###    #
    // #  #   #     #    #  #   #    #     ##     #     #
    // ###   ###   ###    ##     ##  ####   ##    #      ##
    // #
    /**
     * Removes a pilot who left the team.
     * @param {DiscordJs.GuildMember} member The pilot to remove.
     * @returns {Promise} A promise that resolves when the pilot is removed.
     */
    async pilotLeft(member) {
        const team = await member.getTeam();

        try {
            await Db.removePilot(member, this);
        } catch (err) {
            throw new Exception("There was a database error removing a pilot from a team.", err);
        }

        try {
            if (team) {
                const captainsChannel = this.captainsChannel;
                if (!captainsChannel) {
                    throw new Error("Captain's channel does not exist for the team.");
                }

                const teamChannel = this.teamChannel;
                if (!teamChannel) {
                    throw new Error("Team's channel does not exist.");
                }

                if (Discord.findGuildMemberById(member.id)) {
                    await member.removeRole(Discord.captainRole, `${member.displayName} left the team.`);
                    await member.removeRole(this.role, `${member.displayName} left the team.`);
                }

                await Discord.queue(`${member.displayName} has left the team.`, captainsChannel);
                await Discord.queue(`${member.displayName} has left the team.`, teamChannel);

                const challenges = await Challenge.getAllByTeam(this);
                for (const challenge of challenges) {
                    await challenge.updateTopic();
                }

                await Discord.richQueue(Discord.richEmbed({
                    title: `${this.name} (${this.tag})`,
                    description: "Pilot Left",
                    color: this.role.color,
                    fields: [
                        {
                            name: "Pilot Left",
                            value: `${member}`
                        }
                    ],
                    footer: {
                        text: "pilot left team"
                    }
                }), Discord.rosterUpdatesChannel);
            }

            await this.updateChannels();
        } catch (err) {
            throw new Exception("There was a critical Discord error removing a pilot from a team.  Please resolve this manually as soon as possible.", err);
        }
    }

    //              #                  #           #
    //                                 #           #
    // ###    ##   ##    ###    ###   ###    ###  ###    ##
    // #  #  # ##   #    #  #  ##      #    #  #   #    # ##
    // #     ##     #    #  #    ##    #    # ##   #    ##
    // #      ##   ###   #  #  ###      ##   # #    ##   ##
    /**
     * Reinstates a disbanded team with a new founder.
     * @param {DiscordJs.GuildMember} member The new founder reinstating the team.
     * @returns {Promise} A promise that resolves when the team is reinstated.
     */
    async reinstate(member) {
        try {
            await Db.reinstate(member, this);
        } catch (err) {
            throw new Exception("There was a database error reinstating a team.", err);
        }

        this.founder = member;

        try {
            await this.setup(member, true);
        } catch (err) {
            throw new Exception("There was a critical Discord error reinstating a team.  Please resolve this manually as soon as possible.", err);
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
     * Removes a captain from the team.
     * @param {DiscordJs.GuildMember} member The pilot removing the captain.
     * @param {DiscordJs.GuildMember} captain The captain to remove.
     * @returns {Promise} A promise that resolves when the captain has been removed.
     */
    async removeCaptain(member, captain) {
        try {
            await Db.removeCaptain(this, captain);
        } catch (err) {
            throw new Exception("There was a database error removing a captain.", err);
        }

        try {
            const captainsChannel = this.captainsChannel;
            if (!captainsChannel) {
                throw new Error("Captain's channel does not exist for the team.");
            }

            const captainsVoiceChannel = this.captainsVoiceChannel;
            if (!captainsVoiceChannel) {
                throw new Error("Captain's channel does not exist for the team.");
            }

            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                throw new Error("Team's channel does not exist.");
            }

            await captain.removeRole(Discord.captainRole, `${member.displayName} removed ${captain.displayName} as a captain.`);

            await captainsChannel.overwritePermissions(
                captain,
                {"VIEW_CHANNEL": null},
                `${member.displayName} removed ${captain.displayName} as a captain.`
            );

            await captainsVoiceChannel.overwritePermissions(
                captain,
                {"VIEW_CHANNEL": null},
                `${member.displayName} removed ${captain.displayName} as a captain.`
            );

            await this.updateChannels();

            await Discord.queue(`${captain}, you are no longer a captain of **${this.name}**.`, captain);
            await Discord.queue(`${captain.displayName} is no longer a team captain.`, captainsChannel);
            await Discord.queue(`${captain.displayName} is no longer a team captain.`, teamChannel);
            await Discord.richQueue(Discord.richEmbed({
                title: `${this.name} (${this.tag})`,
                description: "Leadership Update",
                color: this.role.color,
                fields: [
                    {
                        name: "Captain Removed",
                        value: `${captain}`
                    }
                ],
                footer: {
                    text: `removed by ${member.displayName}`
                }
            }), Discord.rosterUpdatesChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error removing a captain.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                                     ###    #    ##           #
    //                                     #  #         #           #
    // ###    ##   # #    ##   # #    ##   #  #  ##     #     ##   ###
    // #  #  # ##  ####  #  #  # #   # ##  ###    #     #    #  #   #
    // #     ##    #  #  #  #  # #   ##    #      #     #    #  #   #
    // #      ##   #  #   ##    #     ##   #     ###   ###    ##     ##
    /**
     * Removes a pilot from the team, whether they are a pilot on the team, someone who has been invited, or someone who has requested to join.
     * @param {DiscordJs.GuildMember} member The pilot removing the pilot.
     * @param {DiscordJs.GuildMember} pilot The pilot to remove.
     * @returns {Promise} A promise that resolves when the pilot has been removed.
     */
    async removePilot(member, pilot) {
        try {
            await Db.removePilot(pilot, this);
        } catch (err) {
            throw new Exception("There was a database error removing a pilot from a team.", err);
        }

        try {
            const captainsChannel = this.captainsChannel;
            if (!captainsChannel) {
                throw new Error("Captain's channel does not exist for the team.");
            }

            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                throw new Error("Team's channel does not exist.");
            }

            if (this.role.members.find((m) => m.id === pilot.id)) {
                await pilot.removeRole(Discord.captainRole, `${member.displayName} removed ${pilot.displayName} from the team.`);

                await captainsChannel.overwritePermissions(
                    pilot,
                    {"VIEW_CHANNEL": null},
                    `${member.displayName} removed ${pilot.displayName} from the team.`
                );

                await pilot.removeRole(this.role, `${member.displayName} removed ${pilot.displayName} from the team.`);

                await Discord.queue(`${pilot}, you have been removed from **${this.name}** by ${member.displayName}.`, pilot);
                await Discord.queue(`${pilot.displayName} has been removed from the team by ${member.displayName}.`, captainsChannel);
                await Discord.queue(`${pilot.displayName} has been removed from the team by ${member.displayName}.`, teamChannel);

                await Discord.richQueue(Discord.richEmbed({
                    title: `${this.name} (${this.tag})`,
                    description: "Pilot Removed",
                    color: this.role.color,
                    fields: [
                        {
                            name: "Pilot Removed",
                            value: `${pilot}`
                        }
                    ],
                    footer: {
                        text: `removed by ${member.displayName}`
                    }
                }), Discord.rosterUpdatesChannel);
            } else {
                await Discord.queue(`${member.displayName} declined to invite ${pilot.displayName}.`, captainsChannel);
            }

            await this.updateChannels();
        } catch (err) {
            throw new Exception("There was a critical Discord error removing a pilot from a team.  Please resolve this manually as soon as possible.", err);
        }
    }

    // ###    ##   ###    ###  # #    ##
    // #  #  # ##  #  #  #  #  ####  # ##
    // #     ##    #  #  # ##  #  #  ##
    // #      ##   #  #   # #  #  #   ##
    /**
     * Renames a team.
     * @param {string} name The new name.
     * @param {DiscordJs.GuildMember} member The admin renaming the team.
     * @returns {Promise} A promise that resolves when the team has been renamed.
     */
    async rename(name, member) {
        const oldName = this.name,
            categoryChannel = this.categoryChannel,
            role = this.role;

        try {
            await Db.setName(this, name);
        } catch (err) {
            throw new Exception("There was a database error renaming a team.", err);
        }

        this.name = name;

        const challenges = await Challenge.getAllByTeam(this);

        try {
            await categoryChannel.setName(this.name, "Team renamed by admin.");
            await role.setName(this.roleName, "Team renamed by admin.");

            await this.updateChannels();

            for (const challenge of challenges) {
                await challenge.updateTopic();
                await Discord.queue(`${member} has changed the name of **${oldName}** to **${name}**.`, challenge.channel);
            }

            await Discord.queue(`${member} has changed your team's name to **${name}**.`, this.teamChannel);

            await Discord.richQueue(Discord.richEmbed({
                title: `${this.name} (${this.tag})`,
                description: "Team renamed",
                color: this.role.color,
                fields: [
                    {
                        name: "Old Name",
                        value: `${oldName}`
                    },
                    {
                        name: "New Name",
                        value: `${name}`
                    }
                ],
                footer: {
                    text: `renamed by ${member.displayName}`
                }
            }), Discord.rosterUpdatesChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error renaming a team.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                   ##                      ####                       #
    //                    #                      #                          #
    // ###    ##   ###    #     ###   ##    ##   ###    ##   #  #  ###    ###   ##   ###
    // #  #  # ##  #  #   #    #  #  #     # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #     ##    #  #   #    # ##  #     ##    #     #  #  #  #  #  #  #  #  ##    #
    // #      ##   ###   ###    # #   ##    ##   #      ##    ###  #  #   ###   ##   #
    //             #
    /**
     * Replaces the founder.
     * @param {DiscordJs.GuildMember} pilot The new founder.
     * @param {DiscordJs.GuildMember} member The admin replacing the founder.
     * @returns {Promise} A promise that resolves when the founder has been replaced.
     */
    async replaceFounder(pilot, member) {
        const oldFounder = this.role.members.find((m) => !!m.roles.find((r) => r.id === Discord.founderRole.id));

        try {
            await Db.makeFounder(this, pilot);
        } catch (err) {
            throw new Exception("There was a database error transfering a team founder to another pilot.", err);
        }

        try {
            if (!this.role.members.find((m) => m.id === pilot.id)) {
                throw new Error("Pilots are not on the same team.");
            }

            const captainsChannel = this.captainsChannel;
            if (!captainsChannel) {
                throw new Error("Captain's channel does not exist for the team.");
            }

            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                throw new Error("Team's channel does not exist.");
            }

            if (oldFounder) {
                await oldFounder.removeRole(Discord.founderRole, `${member.displayName} transferred founder of team ${this.name} to ${pilot.displayName}.`);
                await oldFounder.addRole(Discord.captainRole, `${member.displayName} transferred founder of team ${this.name} to ${pilot.displayName}.`);
            }

            await pilot.addRole(Discord.founderRole, `${member.displayName} transferred founder of team ${this.name} to ${pilot.displayName}.`);
            await pilot.removeRole(Discord.captainRole, `${member.displayName} transferred founder of team ${this.name} to ${pilot.displayName}.`);

            await captainsChannel.overwritePermissions(
                pilot,
                {"VIEW_CHANNEL": true},
                `${member.displayName} made ${pilot.displayName} the founder of ${this.name}.`
            );

            await this.updateChannels();

            await Discord.queue(`${pilot}, you are now the founder of **${this.name}**!`, pilot);
            await Discord.queue(`${pilot.displayName} is now the team founder!`, captainsChannel);
            await Discord.queue(`${pilot.displayName} is now the team founder!`, teamChannel);
            await Discord.richQueue(Discord.richEmbed({
                title: `${this.name} (${this.tag})`,
                description: "Leadership Update",
                color: this.role.color,
                fields: [
                    {
                        name: "Old Founder",
                        value: `${oldFounder || "Position Vacated"}`
                    },
                    {
                        name: "New Founder",
                        value: `${pilot}`
                    }
                ],
                footer: {
                    text: `changed by ${member.displayName}`
                }
            }), Discord.rosterUpdatesChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error transfering a team founder to another pilot.  Please resolve this manually as soon as possible.", err);
        }
    }

    //              #
    //              #
    // ###    ##   ###    ###   ###
    // #  #  # ##   #    #  #  #  #
    // #     ##     #    # ##   ##
    // #      ##     ##   # #  #
    //                          ###
    /**
     * Renames a team tag.
     * @param {string} tag The new team tag.
     * @param {DiscordJs.GuildMember} member The admin renaming the team tag.
     * @returns {Promise} A promise that resolves when the team's tag has been renamed.
     */
    async retag(tag, member) {
        const oldTag = this.tag,
            teamChannel = this.teamChannel,
            teamVoiceChannel = this.teamVoiceChannel,
            announcementsChannel = this.announcementsChannel,
            captainsChannel = this.captainsChannel,
            captainsVoiceChannel = this.captainsVoiceChannel;

        try {
            await Db.setTag(this, tag);
        } catch (err) {
            throw new Exception("There was a database error renaming a team tag.", err);
        }

        this.tag = tag;

        const challenges = await Challenge.getAllByTeam(this);

        try {
            await teamChannel.setName(this.teamChannelName, "Team tag renamed by admin.");
            await teamVoiceChannel.setName(this.teamVoiceChannelName, "Team tag renamed by admin.");
            await announcementsChannel.setName(this.announcementsChannelName, "Team tag renamed by admin.");
            await captainsChannel.setName(this.captainsChannelName, "Team tag renamed by admin.");
            await captainsVoiceChannel.setName(this.captainsVoiceChannelName, "Team tag renamed by admin.");

            await this.updateChannels();

            for (const challenge of challenges) {
                const channel = /** @type {DiscordJs.TextChannel} */ Discord.channels.find((c) => c.name.endsWith(`-${challenge.id}`) && c.name.indexOf(oldTag.toLowerCase()) !== -1); // eslint-disable-line no-extra-parens

                if (channel) {
                    await channel.setName(challenge.channelName, "Team tag renamed by admin.");

                    await challenge.updateTopic();
                    await Discord.queue(`${member} has changed the team tag of **${this.name}** from **${oldTag}** to **${tag}**.`, challenge.channel);
                }
            }

            await Discord.queue(`${member} has changed your team's tag to **${tag}**.`, this.teamChannel);

            await Discord.richQueue(Discord.richEmbed({
                title: `${this.name} (${this.tag})`,
                description: "Team tag renamed",
                color: this.role.color,
                fields: [
                    {
                        name: "Old Tag",
                        value: `${oldTag}`
                    },
                    {
                        name: "New Tag",
                        value: `${tag}`
                    }
                ],
                footer: {
                    text: `renamed by ${member.displayName}`
                }
            }), Discord.rosterUpdatesChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error renaming a team tag.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    #                 #
    //               #    #                 #
    //  ###    ##   ###   #      ##    ##   # #
    // ##     # ##   #    #     #  #  #     ##
    //   ##   ##     #    #     #  #  #     # #
    // ###     ##     ##  ####   ##    ##   #  #
    /**
     * Sets the roster lock state for a team.
     * @param {boolean} locked Whether the team's roster should be locked.
     * @returns {Promise} A promise that resolves when the lock state has been set.
     */
    async setLock(locked) {
        try {
            await Db.setLocked(this, locked);
        } catch (err) {
            throw new Exception("There was a database error setting a team's roster lock state.", err);
        }
    }

    //               #    ###    #
    //               #     #
    //  ###    ##   ###    #    ##    # #    ##   ####   ##   ###    ##
    // ##     # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##
    //   ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##
    // ###     ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##
    /**
     * Sets a team's time zone.
     * @param {string} timezone The timezone to set.
     * @returns {Promise} A promise that resolves when the time zone is sest.
     */
    async setTimezone(timezone) {
        try {
            await Db.setTimezone(this, timezone);
        } catch (err) {
            throw new Exception("There was a database error setting a team's timezone.", err);
        }

        const challenges = await Challenge.getAllByTeam(this);

        try {
            await this.updateChannels();

            for (const challenge of challenges) {
                await challenge.updateTopic();
            }

            await Discord.queue(`Your team's time zone has been set to ${timezone}, where the current local time is ${new Date().toLocaleString("en-US", {timeZone: timezone, hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, this.teamChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error setting the a team's timezone.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #
    //               #
    //  ###    ##   ###   #  #  ###
    // ##     # ##   #    #  #  #  #
    //   ##   ##     #    #  #  #  #
    // ###     ##     ##   ###  ###
    //                          #
    /**
     * Sets up the team on Discord.
     * @param {DiscordJs.GuildMember} founder The founder of the team.
     * @param {boolean} reinstating Whether the team is being reinstated.
     * @returns {Promise} A promise that resolves when the team is setup on Discord.
     */
    async setup(founder, reinstating) {
        if (this.role) {
            throw new Error("Team role already exists.");
        }

        if (this.categoryChannel) {
            throw new Error("Team category already exists.");
        }

        if (this.teamChannel) {
            throw new Error("Team channel already exists.");
        }

        if (this.announcementsChannel) {
            throw new Error("Announcements channel already exists.");
        }

        if (this.captainsChannel) {
            throw new Error("Captains channel already exists.");
        }

        if (this.teamVoiceChannel) {
            throw new Error("Team voice channel already exists.");
        }

        if (this.captainsVoiceChannel) {
            throw new Error("Captains voice channel already exists.");
        }

        const teamRole = await Discord.createRole({
            name: this.roleName,
            mentionable: false
        }, `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        await founder.addRole(Discord.founderRole, `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        await founder.addRole(teamRole, `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        const category = await Discord.createChannel(this.name, "category", [
            {
                id: Discord.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: teamRole.id,
                allow: ["VIEW_CHANNEL"]
            }
        ], `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        const teamChannel = await Discord.createChannel(this.teamChannelName, "text", [
            {
                id: Discord.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: teamRole.id,
                allow: ["VIEW_CHANNEL"]
            }, {
                id: Discord.founderRole,
                allow: ["MANAGE_MESSAGES", "MENTION_EVERYONE"]
            }, {
                id: Discord.captainRole,
                allow: ["MENTION_EVERYONE"]
            }
        ], `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        await teamChannel.setParent(category);

        const announcementsChannel = await Discord.createChannel(this.announcementsChannelName, "text", [
            {
                id: Discord.id,
                deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
            }, {
                id: teamRole.id,
                allow: ["VIEW_CHANNEL"]
            }, {
                id: Discord.founderRole,
                allow: ["SEND_MESSAGES", "MANAGE_MESSAGES", "MENTION_EVERYONE"]
            }, {
                id: Discord.captainRole,
                allow: ["SEND_MESSAGES", "MENTION_EVERYONE"]
            }
        ], `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        await announcementsChannel.setParent(category);

        const captainsChannel = await Discord.createChannel(this.captainsChannelName, "text", [
            {
                id: Discord.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: founder.id,
                allow: ["VIEW_CHANNEL"]
            }, {
                id: Discord.founderRole,
                allow: ["MANAGE_MESSAGES", "MENTION_EVERYONE"]
            }, {
                id: Discord.captainRole,
                allow: ["MENTION_EVERYONE"]
            }
        ], `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        await captainsChannel.setParent(category);

        const teamVoiceChannel = await Discord.createChannel(this.teamVoiceChannelName, "voice", [
            {
                id: Discord.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: teamRole.id,
                allow: ["VIEW_CHANNEL"]
            }
        ], `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        await teamVoiceChannel.setParent(category);
        await teamVoiceChannel.edit({bitrate: 64000});

        const captainsVoiceChannel = await Discord.createChannel(this.captainsVoiceChannelName, "voice", [
            {
                id: Discord.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: founder.id,
                allow: ["VIEW_CHANNEL"]
            }
        ], `${founder.displayName} ${reinstating ? "reinstated" : "created"} the team ${this.name}.`);

        await captainsVoiceChannel.setParent(category);
        await captainsVoiceChannel.edit({bitrate: 64000});

        await Discord.richQueue(Discord.richEmbed({
            title: `${this.name} (${this.tag})`,
            description: reinstating ? "Team Reinstated" : "New Team",
            fields: [
                {
                    name: "Founder Added",
                    value: `${founder}`
                }
            ],
            footer: {
                text: `${reinstating ? "reinstated" : "created"} by ${founder.displayName}`
            }
        }), Discord.rosterUpdatesChannel);

        const msg1 = await Discord.richQueue(Discord.richEmbed({
            title: "Founder commands",
            fields: [
                {
                    name: "!color ([light|dark]) [red|orange|yellow|green|indigo|blue|purple]",
                    value: "Set the color for display in Discord."
                },
                {
                    name: "!teamtimezone <timezone>",
                    value: "Sets the default timezone for your team."
                },
                {
                    name: "!addcaptain <teammate>",
                    value: "Makes a teammate a captain."
                },
                {
                    name: "!removecaptain <captain>",
                    value: "Removes a captain.  Does not remove them from the team."
                },
                {
                    name: "!disband",
                    value: "Disbands the team."
                },
                {
                    name: "!makefounder <teammate>",
                    value: "Replace yourself with another teammate."
                }
            ]
        }), this.captainsChannel);

        if (msg1) {
            await msg1.pin();
        }

        const msg2 = await Discord.richQueue(Discord.richEmbed({
            title: "Captain commands",
            fields: [
                {
                    name: "!home [1|2|3] <map>",
                    value: "Set a home map.  You must set all 3 home maps before you can send or receive challenges."
                },
                {
                    name: "!invite <pilot>",
                    value: "Invite a pilot to join your team."
                },
                {
                    name: "!remove <pilot>",
                    value: "Removes a pilot from the team, or revokes a pilot's invitation, or removes a pilot's request to join the team."
                },
                {
                    name: "!challenge <team>",
                    value: "Challenge a team to a match."
                }
            ]
        }), this.captainsChannel);

        if (msg2) {
            await msg2.pin();
        }

        await this.updateChannels();
    }

    //                #         #           ##   #                             ##
    //                #         #          #  #  #                              #
    // #  #  ###    ###   ###  ###    ##   #     ###    ###  ###   ###    ##    #     ###
    // #  #  #  #  #  #  #  #   #    # ##  #     #  #  #  #  #  #  #  #  # ##   #    ##
    // #  #  #  #  #  #  # ##   #    ##    #  #  #  #  # ##  #  #  #  #  ##     #      ##
    //  ###  ###    ###   # #    ##   ##    ##   #  #   # #  #  #  #  #   ##   ###   ###
    //       #
    /**
     * Updates the team's channels.
     * @returns {Promise} A promise that resolves when the team's channels have been updated.
     */
    async updateChannels() {
        try {
            const captainsChannel = this.captainsChannel;
            if (!captainsChannel) {
                Log.exception(`Captain's channel does not exist.  Please update ${this.name} manually.`);
                return;
            }

            const teamChannel = this.teamChannel;
            if (!teamChannel) {
                Log.exception(`Team's channel does not exist.  Please update ${this.name} manually.`);
                return;
            }

            const timezone = await this.getTimezone();

            let teamInfo;
            try {
                teamInfo = await Db.getInfo(this);
            } catch (err) {
                Log.exception(`There was a database error retrieving team information.  Please update ${this.name} manually.`, err);
                return;
            }

            let topic = `${this.name}\nhttps://otl.gg/team/${this.tag}\n\nRoster:`;

            teamInfo.members.forEach((member) => {
                topic += `\n${member.name}`;
                if (member.role) {
                    topic += ` - ${member.role}`;
                }
            });

            let channelTopic = topic,
                captainsChannelTopic = topic;

            if (teamInfo.homes && teamInfo.homes.length > 0) {
                channelTopic += "\n\nHome Maps:";
                teamInfo.homes.forEach((home) => {
                    channelTopic += `\n${home}`;
                });
            }

            if (typeof teamInfo.penaltiesRemaining === "number") {
                channelTopic += `\n\nTeam has been penalized.  Penalized games remaining: ${teamInfo.penaltiesRemaining}`;
            }

            if (teamInfo.requests && teamInfo.requests.length > 0) {
                captainsChannelTopic += "\n\nRequests:";
                teamInfo.requests.forEach((request) => {
                    captainsChannelTopic += `\n${request.name} - ${request.date.toLocaleTimeString("en-us", {timeZone: timezone, hour12: true, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short"})}`;
                });
            }

            if (teamInfo.invites && teamInfo.invites.length > 0) {
                captainsChannelTopic += "\n\nInvites:";
                teamInfo.invites.forEach((invite) => {
                    captainsChannelTopic += `\n${invite.name} - ${invite.date.toLocaleTimeString("en-us", {timeZone: timezone, hour12: true, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short"})}`;
                });
            }

            await teamChannel.setTopic(channelTopic, "Team topic update requested.");
            await captainsChannel.setTopic(captainsChannelTopic, "Team topic update requested.");
        } catch (err) {
            Log.exception(`There was an error updating team information for ${this.name}.  Please update ${this.name} manually.`, err);
        }
    }
}

module.exports = Team;
