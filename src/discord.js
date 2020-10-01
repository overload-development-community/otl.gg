const DiscordJs = require("discord.js"),

    Commands = require("./commands"),
    Exception = require("./logging/exception"),
    Log = require("./logging/log"),
    Notify = require("./notify"),
    settings = require("../settings"),
    Warning = require("./logging/warning"),

    commands = new Commands(),
    discord = new DiscordJs.Client({ws: {intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES"]}}),
    messageParse = /^!(?<cmd>[^ ]+)(?: +(?<args>.*[^ ]))? *$/,
    urlParse = /^https:\/\/www.twitch.tv\/(?<user>.+)$/;

let readied = false;

/** @type {DiscordJs.TextChannel} */
let alertsChannel;

/** @type {DiscordJs.TextChannel} */
let announcementsChannel;

/** @type {DiscordJs.Role} */
let captainRole;

/** @type {DiscordJs.CategoryChannel} */
let challengesCategory;

/** @type {DiscordJs.Role} */
let exemptRole;

/** @type {DiscordJs.Role} */
let founderRole;

/** @type {DiscordJs.TextChannel} */
let matchResultsChannel;

/** @type {DiscordJs.Guild} */
let otlGuild;

/** @type {DiscordJs.TextChannel} */
let rosterUpdatesChannel;

/** @type {DiscordJs.TextChannel} */
let scheduledMatchesChannel;

/** @type {DiscordJs.Role} */
let testersRole;

/** @type {DiscordJs.TextChannel} */
let vodsChannel;

require("./extensions/discordJs.GuildMember.extensions");
require("./extensions/discordJs.User.extensions");

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
    //       ##                 #            ##   #                             ##
    //        #                 #           #  #  #                              #
    //  ###   #     ##   ###   ###    ###   #     ###    ###  ###   ###    ##    #
    // #  #   #    # ##  #  #   #    ##     #     #  #  #  #  #  #  #  #  # ##   #
    // # ##   #    ##    #      #      ##   #  #  #  #  # ##  #  #  #  #  ##     #
    //  # #  ###    ##   #       ##  ###     ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Returns the alerts channel.
     * @returns {DiscordJs.TextChannel} The alerts channel.
     */
    static get alertsChannel() {
        return alertsChannel;
    }

    //                                                                    #            ##   #                             ##
    //                                                                    #           #  #  #                              #
    //  ###  ###   ###    ##   #  #  ###    ##    ##   # #    ##   ###   ###    ###   #     ###    ###  ###   ###    ##    #
    // #  #  #  #  #  #  #  #  #  #  #  #  #     # ##  ####  # ##  #  #   #    ##     #     #  #  #  #  #  #  #  #  # ##   #
    // # ##  #  #  #  #  #  #  #  #  #  #  #     ##    #  #  ##    #  #   #      ##   #  #  #  #  # ##  #  #  #  #  ##     #
    //  # #  #  #  #  #   ##    ###  #  #   ##    ##   #  #   ##   #  #    ##  ###     ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Returns the announcements channel.
     * @returns {DiscordJs.TextChannel} The announcements channel.
     */
    static get announcementsChannel() {
        return announcementsChannel;
    }

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

    //       #           ##    ##                                    ##          #
    //       #            #     #                                   #  #         #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    ###   #      ###  ###    ##    ###   ##   ###   #  #
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  ##     #     #  #   #    # ##  #  #  #  #  #  #  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##      ##   #  #  # ##   #    ##     ##   #  #  #      # #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###     ##    # #    ##   ##   #      ##   #       #
    //                                            ###                                        ###               #
    /**
     * Returns the challenges category.
     * @returns {DiscordJs.CategoryChannel} The challenges category.
     */
    static get challengesCategory() {
        return challengesCategory;
    }

    /**
     * Sets the challenges category.
     * @param {DiscordJs.CategoryChannel} category The challenges category.
     */
    static set challengesCategory(category) {
        challengesCategory = category;
    }

    //       #                             ##
    //       #                              #
    //  ##   ###    ###  ###   ###    ##    #     ###
    // #     #  #  #  #  #  #  #  #  # ##   #    ##
    // #     #  #  # ##  #  #  #  #  ##     #      ##
    //  ##   #  #   # #  #  #  #  #   ##   ###   ###
    /**
     * Returns the channels on the server.
     * @returns {DiscordJs.Collection<string, DiscordJs.GuildChannel>} The channels.
     */
    static get channels() {
        if (otlGuild) {
            return otlGuild.channels.cache;
        }

        return new DiscordJs.Collection();
    }

    //                                #    ###         ##
    //                                #    #  #         #
    //  ##   #  #   ##   # #   ###   ###   #  #   ##    #     ##
    // # ##   ##   # ##  ####  #  #   #    ###   #  #   #    # ##
    // ##     ##   ##    #  #  #  #   #    # #   #  #   #    ##
    //  ##   #  #   ##   #  #  ###     ##  #  #   ##   ###    ##
    //                         #
    /**
     * Returns the cap exempt role.
     * @returns {DiscordJs.Role} The cap exempt role.
     */
    static get exemptRole() {
        return exemptRole;
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
        if (discord && discord.ws && discord.ws.status === 0) {
            return discord.user.avatarURL();
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

    //              #          #     ###                      ##     #            ##   #                             ##
    //              #          #     #  #                      #     #           #  #  #                              #
    // # #    ###  ###    ##   ###   #  #   ##    ###   #  #   #    ###    ###   #     ###    ###  ###   ###    ##    #
    // ####  #  #   #    #     #  #  ###   # ##  ##     #  #   #     #    ##     #     #  #  #  #  #  #  #  #  # ##   #
    // #  #  # ##   #    #     #  #  # #   ##      ##   #  #   #     #      ##   #  #  #  #  # ##  #  #  #  #  ##     #
    // #  #   # #    ##   ##   #  #  #  #   ##   ###     ###  ###     ##  ###     ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Returns the match results channel.
     * @returns {DiscordJs.TextChannel} The match results channel.
     */
    static get matchResultsChannel() {
        return matchResultsChannel;
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

    //              #              #        ##             #  #  #         #          #                   ##   #                             ##
    //              #              #         #             #  ####         #          #                  #  #  #                              #
    //  ###    ##   ###    ##    ###  #  #   #     ##    ###  ####   ###  ###    ##   ###    ##    ###   #     ###    ###  ###   ###    ##    #
    // ##     #     #  #  # ##  #  #  #  #   #    # ##  #  #  #  #  #  #   #    #     #  #  # ##  ##     #     #  #  #  #  #  #  #  #  # ##   #
    //   ##   #     #  #  ##    #  #  #  #   #    ##    #  #  #  #  # ##   #    #     #  #  ##      ##   #  #  #  #  # ##  #  #  #  #  ##     #
    // ###     ##   #  #   ##    ###   ###  ###    ##    ###  #  #   # #    ##   ##   #  #   ##   ###     ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Returns the scheduled matches channel.
     * @returns {DiscordJs.TextChannel} The scheduled matches channel.
     */
    static get scheduledMatchesChannel() {
        return scheduledMatchesChannel;
    }

    //  #                  #                       ###         ##
    //  #                  #                       #  #         #
    // ###    ##    ###   ###    ##   ###    ###   #  #   ##    #     ##
    //  #    # ##  ##      #    # ##  #  #  ##     ###   #  #   #    # ##
    //  #    ##      ##    #    ##    #       ##   # #   #  #   #    ##
    //   ##   ##   ###      ##   ##   #     ###    #  #   ##   ###    ##
    /**
     * Returns the testers role.
     * @returns {DiscordJs.Role} The testers role.
     */
    static get testersRole() {
        return testersRole;
    }

    //                #          ##   #                             ##
    //                #         #  #  #                              #
    // # #    ##    ###   ###   #     ###    ###  ###   ###    ##    #
    // # #   #  #  #  #  ##     #     #  #  #  #  #  #  #  #  # ##   #
    // # #   #  #  #  #    ##   #  #  #  #  # ##  #  #  #  #  ##     #
    //  #     ##    ###  ###     ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Returns the VoDs channel.
     * @returns {DiscordJs.TextChannel} The VoDs channel.
     */
    static get vodsChannel() {
        return vodsChannel;
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

            otlGuild = discord.guilds.cache.find((g) => g.name === settings.guild);

            if (!readied) {
                readied = true;
            }

            captainRole = otlGuild.roles.cache.find((r) => r.name === "Captain");
            exemptRole = otlGuild.roles.cache.find((r) => r.name === "Cap Exempt");
            founderRole = otlGuild.roles.cache.find((r) => r.name === "Founder");
            testersRole = otlGuild.roles.cache.find((r) => r.name === "Testers");

            alertsChannel = /** @type {DiscordJs.TextChannel} */ (otlGuild.channels.cache.find((c) => c.name === "otlbot-alerts")); // eslint-disable-line no-extra-parens
            announcementsChannel = /** @type {DiscordJs.TextChannel} */ (otlGuild.channels.cache.find((c) => c.name === "announcements")); // eslint-disable-line no-extra-parens
            matchResultsChannel = /** @type {DiscordJs.TextChannel} */ (otlGuild.channels.cache.find((c) => c.name === "match-results")); // eslint-disable-line no-extra-parens
            rosterUpdatesChannel = /** @type {DiscordJs.TextChannel} */ (otlGuild.channels.cache.find((c) => c.name === "roster-updates")); // eslint-disable-line no-extra-parens
            scheduledMatchesChannel = /** @type {DiscordJs.TextChannel} */ (otlGuild.channels.cache.find((c) => c.name === "scheduled-matches")); // eslint-disable-line no-extra-parens
            vodsChannel = /** @type {DiscordJs.TextChannel} */ (otlGuild.channels.cache.find((c) => c.name === "vods")); // eslint-disable-line no-extra-parens

            challengesCategory = /** @type {DiscordJs.CategoryChannel} */ (otlGuild.channels.cache.find((c) => c.name === "Challenges")); // eslint-disable-line no-extra-parens

            Notify.setupNotifications();
        });

        discord.on("disconnect", (ev) => {
            Log.exception("Disconnected from Discord.", ev);
        });

        discord.on("message", (message) => {
            Discord.message(message.author, message.content, message.channel);
        });

        discord.on("guildMemberRemove", async (member) => {
            if (member.guild && member.guild.id === otlGuild.id) {
                try {
                    await member.leftDiscord();
                } catch (err) {
                    Log.exception(`There was a problem with ${member.displayName} leaving the server.`, err);
                }
            }
        });

        discord.on("guildMemberUpdate", async (/** @type {DiscordJs.GuildMember} */ oldMember, newMember) => {
            if (newMember.guild && newMember.guild.id === otlGuild.id) {
                if (oldMember.displayName === newMember.displayName) {
                    return;
                }

                try {
                    await newMember.updateName(oldMember);
                } catch (err) {
                    Log.exception(`There was a problem with ${oldMember.displayName} changing their name to ${newMember.displayName}.`, err);
                }
            }
        });

        discord.on("presenceUpdate", async (oldPresence, newPresence) => {
            if (newPresence && newPresence.activities && newPresence.member && newPresence.guild && newPresence.guild.id === otlGuild.id) {
                const activity = newPresence.activities.find((p) => p.name === "Twitch");

                if (activity && urlParse.test(activity.url)) {
                    const {groups: {user}} = urlParse.exec(activity.url);

                    await newPresence.member.addTwitchName(user);

                    if (activity.state.toLowerCase() === "overload") {
                        await newPresence.member.setStreamer();
                    }
                }
            }
        });

        discord.on("error", (err) => {
            if (err.message === "read ECONNRESET") {
                // Swallow this error, see https://github.com/discordjs/discord.js/issues/3043#issuecomment-465543902
                return;
            }

            Log.exception("Discord error.", err);
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
     * @returns {Promise} A promise that resolves once Discord is connected.
     */
    static async connect() {
        Log.log("Connecting to Discord...");

        try {
            await discord.login(settings.discord.token);
            Log.log("Connected.");
        } catch (err) {
            Log.exception("Error connecting to Discord, will automatically retry.", err);
        }
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
        return discord && discord.ws && otlGuild ? discord.ws.status === 0 : false;
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
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.NewsChannel} channel The channel the message was sent on.
     * @returns {Promise} A promise that resolves when the message is parsed.
     */
    static async message(user, message, channel) {
        if (settings.testing && (channel.type === "dm" || !channel.guild || channel.guild.id !== otlGuild.id)) {
            return;
        }

        const member = otlGuild.members.cache.find((m) => m.id === user.id);

        for (const text of message.split("\n")) {
            if (!messageParse.test(text)) {
                continue;
            }

            const {groups: {cmd, args}} = messageParse.exec(text),
                command = cmd.toLocaleLowerCase();

            if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(command) !== -1) {
                let success;
                try {
                    success = await commands[command](member, channel, args);
                } catch (err) {
                    if (err instanceof Warning) {
                        Log.warning(`${channel} ${member}: ${text}\n${err}`);
                    } else if (err instanceof Exception) {
                        Log.exception(`${channel} ${member}: ${text}\n${err.message}`, err.innerError);
                    } else {
                        Log.exception(`${channel} ${member}: ${text}`, err);
                    }

                    return;
                }

                if (success) {
                    Log.log(`${channel} ${member}: ${text}`);
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
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GuildMember} channel The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that resolves with the sent message.
     */
    static async queue(message, channel) {
        if (channel.id === discord.user.id) {
            return void 0;
        }

        let msg;
        try {
            msg = await Discord.richQueue(new DiscordJs.MessageEmbed({description: message}), channel);
        } catch {}
        return msg;
    }

    //                                             ####        #              #
    //                                             #           #              #
    // # #    ##    ###    ###    ###   ###   ##   ###   # #   ###    ##    ###
    // ####  # ##  ##     ##     #  #  #  #  # ##  #     ####  #  #  # ##  #  #
    // #  #  ##      ##     ##   # ##   ##   ##    #     #  #  #  #  ##    #  #
    // #  #   ##   ###    ###     # #  #      ##   ####  #  #  ###    ##    ###
    //                                  ###
    /**
     * Gets a new DiscordJs MessageEmbed object.
     * @param {DiscordJs.MessageEmbedOptions} [options] The options to pass.
     * @returns {DiscordJs.MessageEmbed} The MessageEmbed object.
     */
    static messageEmbed(options) {
        return new DiscordJs.MessageEmbed(options);
    }

    //        #          #     ####     #   #     #
    //                   #     #        #         #
    // ###   ##     ##   ###   ###    ###  ##    ###
    // #  #   #    #     #  #  #     #  #   #     #
    // #      #    #     #  #  #     #  #   #     #
    // #     ###    ##   #  #  ####   ###  ###     ##
    /**
     * Edits a rich embed message.
     * @param {DiscordJs.Message} message The posted message to edit.
     * @param {DiscordJs.MessageEmbed} embed The message to change the posted message to.
     * @returns {Promise} A promise that resolves when the message is edited.
     */
    static async richEdit(message, embed) {
        embed.setFooter(embed.footer ? embed.footer.text : "", Discord.icon);

        if (embed && embed.fields) {
            embed.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        embed.color = message.embeds[0].color;

        if (!embed.timestamp) {
            embed.setTimestamp(new Date());
        }

        await message.edit("", embed);
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
     * @param {DiscordJs.MessageEmbed} embed The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GuildMember} channel The channel to send the message to.
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
            embed.setColor(0xFF6600);
        }

        if (!embed.timestamp) {
            embed.setTimestamp(new Date());
        }

        let msg;
        try {
            const msgSend = await channel.send("", embed);

            if (msgSend instanceof Array) {
                msg = msgSend[0];
            } else {
                msg = msgSend;
            }
        } catch {}
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
     * @param {DiscordJs.OverwriteResolvable[]|DiscordJs.Collection<DiscordJs.Snowflake, DiscordJs.OverwriteResolvable>} [overwrites] The permissions that should overwrite the default permission set.
     * @param {string} [reason] The reason the channel is being created.
     * @returns {Promise<DiscordJs.TextChannel|DiscordJs.VoiceChannel|DiscordJs.CategoryChannel>} The created channel.
     */
    static createChannel(name, type, overwrites, reason) {
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.channels.create(name, {type, permissionOverwrites: overwrites, reason});
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
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.roles.create({data, reason});
    }

    //   #    #             #   ##   #                             ##    ###         ###      #
    //  # #                 #  #  #  #                              #    #  #         #       #
    //  #    ##    ###    ###  #     ###    ###  ###   ###    ##    #    ###   #  #   #     ###
    // ###    #    #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #    #  #  #  #   #    #  #
    //  #     #    #  #  #  #  #  #  #  #  # ##  #  #  #  #  ##     #    #  #   # #   #    #  #
    //  #    ###   #  #   ###   ##   #  #   # #  #  #  #  #   ##   ###   ###     #   ###    ###
    //                                                                          #
    /**
     * Finds a Discord channel by its ID.
     * @param {string} id The ID of the channel.
     * @returns {DiscordJs.GuildChannel} The Discord channel.
     */
    static findChannelById(id) {
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.channels.cache.find((c) => c.id === id);
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
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.channels.cache.find((c) => c.name === name);
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
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.members.cache.find((m) => m.displayName === displayName);
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
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.members.cache.find((m) => m.id === id);
    }

    //   #    #             #  ###         ##          ###         ###      #
    //  # #                 #  #  #         #          #  #         #       #
    //  #    ##    ###    ###  #  #   ##    #     ##   ###   #  #   #     ###
    // ###    #    #  #  #  #  ###   #  #   #    # ##  #  #  #  #   #    #  #
    //  #     #    #  #  #  #  # #   #  #   #    ##    #  #   # #   #    #  #
    //  #    ###   #  #   ###  #  #   ##   ###    ##   ###     #   ###    ###
    //                                                        #
    /**
     * Finds a Discord role by its ID.
     * @param {string} id The ID of the role.
     * @returns {DiscordJs.Role} The Discord role.
     */
    static findRoleById(id) {
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.roles.cache.find((r) => r.id === id);
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
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.roles.cache.find((r) => r.name === name);
    }

    //   #    #             #  #  #                     ###         ###      #
    //  # #                 #  #  #                     #  #         #       #
    //  #    ##    ###    ###  #  #   ###    ##   ###   ###   #  #   #     ###
    // ###    #    #  #  #  #  #  #  ##     # ##  #  #  #  #  #  #   #    #  #
    //  #     #    #  #  #  #  #  #    ##   ##    #     #  #   # #   #    #  #
    //  #    ###   #  #   ###   ##   ###     ##   #     ###     #   ###    ###
    //                                                         #
    /**
     * Finds a Discord user by user ID.
     * @param {string} id The user ID.
     * @returns {Promise<DiscordJs.User>} A promise that resolves with the user.
     */
    static findUserById(id) {
        return discord.users.fetch(id, false);
    }

    //              #    #  #
    //              #    ## #
    //  ###   ##   ###   ## #   ###  # #    ##
    // #  #  # ##   #    # ##  #  #  ####  # ##
    //  ##   ##     #    # ##  # ##  #  #  ##
    // #      ##     ##  #  #   # #  #  #   ##
    //  ###
    /**
     * Returns the user's display name if they are a guild member, or a username if they are a user.
     * @param {DiscordJs.GuildMember|DiscordJs.User} user The user to get the name for.
     * @returns {string} The name of the user.
     */
    static getName(user) {
        return user instanceof DiscordJs.GuildMember ? user.displayName : user.username;
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
