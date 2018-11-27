const DiscordJs = require("discord.js"),

    Commands = require("./commands"),
    Exception = require("./exception"),
    Log = require("./log"),
    settings = require("./settings"),
    Warning = require("./warning"),

    commands = new Commands(),
    discord = new DiscordJs.Client(/** @type {DiscordJs.ClientOptions} */ (settings.discord.options)), // eslint-disable-line no-extra-parens
    messageParse = /^!([^ ]+)(?: +(.*[^ ]))? *$/;

let readied = false;

/**
 * @type {DiscordJs.Role}
 */
let captainRole;

/**
 * @type {DiscordJs.Role}
 */
let founderRole;

/**
 * @type {DiscordJs.Guild}
 */
let otlGuild;

/**
 * @type {DiscordJs.TextChannel}
 */
let rosterUpdatesChannel;

require("./discordJs.GuildMember.extensions");

//  ####     #                                    #
//   #  #                                         #
//   #  #   ##     ###    ###    ###   # ##    ## #
//   #  #    #    #      #   #  #   #  ##  #  #  ##
//   #  #    #     ###   #      #   #  #      #   #
//   #  #    #        #  #   #  #   #  #      #  ##
//  ####    ###   ####    ###    ###   #       ## #
/**
 * A static class that handles all Discord.js interctions.
 */
class Discord {
    //                    #           #          ###         ##
    //                    #                      #  #         #
    //  ##    ###  ###   ###    ###  ##    ###   #  #   ##    #     ##
    // #     #  #  #  #   #    #  #   #    #  #  ###   #  #   #    # ##
    // #     # ##  #  #   #    # ##   #    #  #  # #   #  #   #    ##
    //  ##    # #  ###     ##   # #  ###   #  #  #  #   ##   ###    ##
    //             #
    /**
     * Returns the captain role.
     * @returns {DiscordJs.Role} The captain role.
     */
    static get captainRole() {
        return captainRole;
    }

    //   #                        #              ###         ##
    //  # #                       #              #  #         #
    //  #     ##   #  #  ###    ###   ##   ###   #  #   ##    #     ##
    // ###   #  #  #  #  #  #  #  #  # ##  #  #  ###   #  #   #    # ##
    //  #    #  #  #  #  #  #  #  #  ##    #     # #   #  #   #    ##
    //  #     ##    ###  #  #   ###   ##   #     #  #   ##   ###    ##
    /**
     * Returns the founder role.
     * @returns {DiscordJs.Role} The founder role.
     */
    static get founderRole() {
        return founderRole;
    }

    //  #
    //
    // ##     ##    ##   ###
    //  #    #     #  #  #  #
    //  #    #     #  #  #  #
    // ###    ##    ##   #  #
    /**
     * Returns the OTL's icon.
     * @returns {string} The URL of the icon.
     */
    static get icon() {
        if (discord && discord.status === 0) {
            return discord.user.avatarURL;
        }

        return void 0;
    }

    //  #       #
    //          #
    // ##     ###
    //  #    #  #
    //  #    #  #
    // ###    ###
    /**
     * Returns the OTL's server ID.
     * @returns {string} The ID of the server.
     */
    static get id() {
        if (otlGuild) {
            return otlGuild.id;
        }

        return void 0;
    }

    //                     #                #  #           #         #                  ##   #                             ##
    //                     #                #  #           #         #                 #  #  #                              #
    // ###    ##    ###   ###    ##   ###   #  #  ###    ###   ###  ###    ##    ###   #     ###    ###  ###   ###    ##    #
    // #  #  #  #  ##      #    # ##  #  #  #  #  #  #  #  #  #  #   #    # ##  ##     #     #  #  #  #  #  #  #  #  # ##   #
    // #     #  #    ##    #    ##    #     #  #  #  #  #  #  # ##   #    ##      ##   #  #  #  #  # ##  #  #  #  #  ##     #
    // #      ##   ###      ##   ##   #      ##   ###    ###   # #    ##   ##   ###     ##   #  #   # #  #  #  #  #   ##   ###
    //                                            #
    /**
     * Returns the roster updates channel.
     * @returns {DiscordJs.TextChannel} The roster updates channel.
     */
    static get rosterUpdatesChannel() {
        return rosterUpdatesChannel;
    }

    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###   #  #  ###
    // ##      #    #  #  #  #   #    #  #  #  #
    //   ##    #    # ##  #      #    #  #  #  #
    // ###      ##   # #  #       ##   ###  ###
    //                                      #
    /**
     * Sets up Discord events.  Should only ever be called once.
     * @returns {void}
     */
    static startup() {
        discord.on("ready", () => {
            Log.log("Connected to Discord.");

            otlGuild = discord.guilds.find((g) => g.name === settings.guild);

            if (!readied) {
                readied = true;
            }

            captainRole = otlGuild.roles.find((r) => r.name === "Captain");
            founderRole = otlGuild.roles.find((r) => r.name === "Founder");

            rosterUpdatesChannel = /** @type {DiscordJs.TextChannel} */ (otlGuild.channels.find((c) => c.name === "roster-updates")); // eslint-disable-line no-extra-parens
        });

        discord.on("disconnect", (ev) => {
            Log.exception("Disconnected from Discord.", ev);
        });

        discord.on("message", (message) => {
            Discord.message(message.author, message.content, message.channel);
        });

        discord.on("guildMemberRemove", async (member) => {
            try {
                await member.leftDiscord();
            } catch (err) {
                Log.exception(`There was a problem with ${member.displayName} leaving the server.`, err);
            }
        });

        discord.on("guildMemberUpdate", async (oldMember, newMember) => {
            if (oldMember.displayName === newMember.displayName) {
                return;
            }

            try {
                await newMember.updateName(oldMember);
            } catch (err) {
                Log.exception(`There was a problem with ${oldMember.displayName} changing their name to ${newMember.displayName}.`, err);
            }
        });
    }

    //                                      #
    //                                      #
    //  ##    ##   ###   ###    ##    ##   ###
    // #     #  #  #  #  #  #  # ##  #      #
    // #     #  #  #  #  #  #  ##    #      #
    //  ##    ##   #  #  #  #   ##    ##     ##
    /**
     * Connects to Discord.
     * @returns {void}
     */
    static connect() {
        Log.log("Connecting to Discord...");

        discord.login(settings.discord.token).then(() => {
            Log.log("Connected.");
        }).catch((err) => {
            Log.exception("Error connecting to Discord, will automatically retry.", err);
        });

        discord.on("error", (err) => {
            Log.exception("Discord error.", err);
        });
    }

    //  #            ##                                  #             #
    //              #  #                                 #             #
    // ##     ###   #      ##   ###   ###    ##    ##   ###    ##    ###
    //  #    ##     #     #  #  #  #  #  #  # ##  #      #    # ##  #  #
    //  #      ##   #  #  #  #  #  #  #  #  ##    #      #    ##    #  #
    // ###   ###     ##    ##   #  #  #  #   ##    ##     ##   ##    ###
    /**
     * Determines whether the bot is connected to Discord.
     * @returns {boolean} Whether the bot is connected to Discord.
     */
    static isConnected() {
        return discord && otlGuild ? discord.status === 0 : false;
    }

    // # #    ##    ###    ###    ###   ###   ##
    // ####  # ##  ##     ##     #  #  #  #  # ##
    // #  #  ##      ##     ##   # ##   ##   ##
    // #  #   ##   ###    ###     # #  #      ##
    //                                  ###
    /**
     * Parses a message.
     * @param {DiscordJs.User} user The user who sent the message.
     * @param {string} message The text of the message.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GroupDMChannel} channel The channel the message was sent on.
     * @returns {Promise} A promise that resolves when the message is parsed.
     */
    static async message(user, message, channel) {
        const member = otlGuild.members.find((m) => m.id === user.id);

        if (!member) {
            await Discord.queue(`Sorry, ${user}, but you are not part of the OTL!`, channel);
            return;
        }

        for (const text of message.split("\n")) {
            const matches = messageParse.exec(text);

            if (matches) {
                const command = matches[1].toLocaleLowerCase(),
                    args = matches[2];

                if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(command) !== -1) {
                    let success;
                    try {
                        success = await commands[command](member, args, channel);
                    } catch (err) {
                        if (err instanceof Warning) {
                            Log.warning(`${member}: ${text}\n${err}`);
                        } else if (err instanceof Exception) {
                            Log.exception(`${member}: ${text}\n${err.message}`, err.innerError);
                        } else {
                            Log.exception(`${member}: ${text}`, err);
                        }

                        return;
                    }

                    if (success) {
                        Log.log(`${member}: ${text}`);
                    }
                }
            }
        }
    }

    //  ###  #  #   ##   #  #   ##
    // #  #  #  #  # ##  #  #  # ##
    // #  #  #  #  ##    #  #  ##
    //  ###   ###   ##    ###   ##
    //    #
    /**
     * Queues a message to be sent.
     * @param {string} message The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GroupDMChannel|DiscordJs.GuildMember} channel The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that resolves with the sent message.
     */
    static async queue(message, channel) {
        let msg;

        if (channel.id === discord.user.id) {
            return void 0;
        }

        try {
            msg = await Discord.richQueue(new DiscordJs.RichEmbed({
                description: message,
                timestamp: new Date()
            }), channel);
        } finally {}
        return msg;
    }

    //        #          #      ##
    //                   #     #  #
    // ###   ##     ##   ###   #  #  #  #   ##   #  #   ##
    // #  #   #    #     #  #  #  #  #  #  # ##  #  #  # ##
    // #      #    #     #  #  ## #  #  #  ##    #  #  ##
    // #     ###    ##   #  #   ##    ###   ##    ###   ##
    //                            #
    /**
     * Queues a rich embed message to be sent.
     * @param {DiscordJs.RichEmbed} embed The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GroupDMChannel|DiscordJs.GuildMember} channel The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that resolves with the sent message.
     */
    static async richQueue(embed, channel) {
        if (channel.id === discord.user.id) {
            return void 0;
        }

        embed.setFooter(embed.footer ? embed.footer.text : "", Discord.icon);

        if (embed && embed.fields) {
            embed.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        if (!embed.color) {
            embed.setColor(0x16F6F8); // TODO: Update to use OTL color.
        }

        let msg;
        try {
            msg = await channel.sendEmbed(embed);
        } finally {}
        return msg;
    }

    //                          #           ##   #                             ##
    //                          #          #  #  #                              #
    //  ##   ###    ##    ###  ###    ##   #     ###    ###  ###   ###    ##    #
    // #     #  #  # ##  #  #   #    # ##  #     #  #  #  #  #  #  #  #  # ##   #
    // #     #     ##    # ##   #    ##    #  #  #  #  # ##  #  #  #  #  ##     #
    //  ##   #      ##    # #    ##   ##    ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Creates a new channel on the Discord server.
     * @param {string} name The name of the channel.
     * @param {"category" | "text" | "voice"} type The type of channel to create.
     * @param {DiscordJs.PermissionOverwrites[]|DiscordJs.ChannelCreationOverwrites[]} [overwrites] The permissions that should overwrite the default permission set.
     * @param {string} [reason] The reason the channel is being created.
     * @returns {Promise<DiscordJs.TextChannel|DiscordJs.VoiceChannel|DiscordJs.CategoryChannel>} The created channel.
     */
    static createChannel(name, type, overwrites, reason) {
        return otlGuild.createChannel(name, type, overwrites, reason);
    }

    //                          #          ###         ##
    //                          #          #  #         #
    //  ##   ###    ##    ###  ###    ##   #  #   ##    #     ##
    // #     #  #  # ##  #  #   #    # ##  ###   #  #   #    # ##
    // #     #     ##    # ##   #    ##    # #   #  #   #    ##
    //  ##   #      ##    # #    ##   ##   #  #   ##   ###    ##
    /**
     * Creates a new role on the Discord server.
     * @param {DiscordJs.RoleData} [data] The role data.
     * @param {string} [reason] The reason the role is being created.
     * @returns {Promise<DiscordJs.Role>} A promise that resolves with the created role.
     */
    static createRole(data, reason) {
        return otlGuild.createRole(data, reason);
    }

    //   #    #             #   ##   #                             ##    ###         #  #
    //  # #                 #  #  #  #                              #    #  #        ## #
    //  #    ##    ###    ###  #     ###    ###  ###   ###    ##    #    ###   #  #  ## #   ###  # #    ##
    // ###    #    #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #    #  #  #  #  # ##  #  #  ####  # ##
    //  #     #    #  #  #  #  #  #  #  #  # ##  #  #  #  #  ##     #    #  #   # #  # ##  # ##  #  #  ##
    //  #    ###   #  #   ###   ##   #  #   # #  #  #  #  #   ##   ###   ###     #   #  #   # #  #  #   ##
    //                                                                          #
    /**
     * Finds a Discord channel by its name.
     * @param {string} name The name of the channel.
     * @returns {DiscordJs.GuildChannel} The Discord channel.
     */
    static findChannelByName(name) {
        return otlGuild.channels.find((c) => c.name === name);
    }

    //   #    #             #   ##          #    ##       #  #  #              #                 ###         ###    #                 ##                #  #
    //  # #                 #  #  #               #       #  ####              #                 #  #        #  #                      #                ## #
    //  #    ##    ###    ###  #     #  #  ##     #     ###  ####   ##   # #   ###    ##   ###   ###   #  #  #  #  ##     ###   ###    #     ###  #  #  ## #   ###  # #    ##
    // ###    #    #  #  #  #  # ##  #  #   #     #    #  #  #  #  # ##  ####  #  #  # ##  #  #  #  #  #  #  #  #   #    ##     #  #   #    #  #  #  #  # ##  #  #  ####  # ##
    //  #     #    #  #  #  #  #  #  #  #   #     #    #  #  #  #  ##    #  #  #  #  ##    #     #  #   # #  #  #   #      ##   #  #   #    # ##   # #  # ##  # ##  #  #  ##
    //  #    ###   #  #   ###   ###   ###  ###   ###    ###  #  #   ##   #  #  ###    ##   #     ###     #   ###   ###   ###    ###   ###    # #    #   #  #   # #  #  #   ##
    //                                                                                                  #                       #                  #
    /**
     * Returns the Discord user in the guild by their display name.
     * @param {string} displayName The display name of the Discord user.
     * @returns {DiscordJs.GuildMember} The guild member.
     */
    static findGuildMemberByDisplayName(displayName) {
        return otlGuild.members.find((m) => m.displayName === displayName);
    }

    //   #    #             #   ##          #    ##       #  #  #              #                 ###         ###      #
    //  # #                 #  #  #               #       #  ####              #                 #  #         #       #
    //  #    ##    ###    ###  #     #  #  ##     #     ###  ####   ##   # #   ###    ##   ###   ###   #  #   #     ###
    // ###    #    #  #  #  #  # ##  #  #   #     #    #  #  #  #  # ##  ####  #  #  # ##  #  #  #  #  #  #   #    #  #
    //  #     #    #  #  #  #  #  #  #  #   #     #    #  #  #  #  ##    #  #  #  #  ##    #     #  #   # #   #    #  #
    //  #    ###   #  #   ###   ###   ###  ###   ###    ###  #  #   ##   #  #  ###    ##   #     ###     #   ###    ###
    //                                                                                                  #
    /**
     * Returns the Discord user in the guild by their Discord ID.
     * @param {string} id The ID of the Discord user.
     * @returns {DiscordJs.GuildMember} The guild member.
     */
    static findGuildMemberById(id) {
        return otlGuild.members.find((m) => m.id === id);
    }

    //   #    #             #  ###         ##          ###         #  #
    //  # #                 #  #  #         #          #  #        ## #
    //  #    ##    ###    ###  #  #   ##    #     ##   ###   #  #  ## #   ###  # #    ##
    // ###    #    #  #  #  #  ###   #  #   #    # ##  #  #  #  #  # ##  #  #  ####  # ##
    //  #     #    #  #  #  #  # #   #  #   #    ##    #  #   # #  # ##  # ##  #  #  ##
    //  #    ###   #  #   ###  #  #   ##   ###    ##   ###     #   #  #   # #  #  #   ##
    //                                                        #
    /**
     * Finds a Discord role by its name.
     * @param {string} name The name of the role.
     * @returns {DiscordJs.Role} The Discord role.
     */
    static findRoleByName(name) {
        return otlGuild.roles.find((r) => r.name === name);
    }

    //  #            ##
    //              #  #
    // ##     ###   #  #  #  #  ###    ##   ###
    //  #    ##     #  #  #  #  #  #  # ##  #  #
    //  #      ##   #  #  ####  #  #  ##    #
    // ###   ###     ##   ####  #  #   ##   #
    /**
     * Determines whether the user is the owner.
     * @param {DiscordJs.GuildMember} member The user to check.
     * @returns {boolean} Whether the user is the owner.
     */
    static isOwner(member) {
        return member && member.user.username === settings.admin.username && member.user.discriminator === settings.admin.discriminator;
    }
}

module.exports = Discord;
