const DiscordJs = require("discord.js"),
    fs = require("fs/promises"),
    path = require("path"),
    Rest = require("@discordjs/rest"),

    Exception = require("../logging/exception"),
    Log = require("../logging/log"),
    Notify = require("../notify"),
    settings = require("../../settings"),
    Warning = require("../logging/warning"),

    discord = new DiscordJs.Client({
        intents: [
            DiscordJs.IntentsBitField.Flags.DirectMessages,
            DiscordJs.IntentsBitField.Flags.Guilds,
            DiscordJs.IntentsBitField.Flags.GuildMembers,
            DiscordJs.IntentsBitField.Flags.GuildMessages,
            DiscordJs.IntentsBitField.Flags.GuildPresences
        ],
        partials: [DiscordJs.Partials.Channel],
        rest: {retries: 999999}
    }),
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

require("../extensions/discordJs.GuildMember.extensions");
require("../extensions/discordJs.User.extensions");

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

    // #            #    ###      #
    // #            #     #       #
    // ###    ##   ###    #     ###
    // #  #  #  #   #     #    #  #
    // #  #  #  #   #     #    #  #
    // ###    ##     ##  ###    ###
    /**
     * Returns the ID of the bot.
     * @returns {string} The ID of the bot.
     */
    static get botId() {
        if (discord && discord.user) {
            return discord.user.id;
        }

        return "";
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
     * @returns {DiscordJs.Collection<string, DiscordJs.GuildChannel | DiscordJs.ThreadChannel>} The channels.
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
        discord.on("ready", async () => {
            Log.log("Connected to Discord.");

            otlGuild = discord.guilds.cache.find((g) => g.name === settings.guild);

            const files = await fs.readdir(path.join(__dirname, "commands")),
                guildCommands = [],
                globalCommands = [];

            /** @type {{[x: string]: (function(DiscordJs.SlashCommandSubcommandBuilder): DiscordJs.SlashCommandSubcommandBuilder)[]}} */
            const simulateCommands = {};

            for (const file of files) {
                const commandFile = require(`./commands/${file}`);

                /** @type {DiscordJs.SlashCommandBuilder} */
                const command = commandFile.command();

                if (commandFile.global) {
                    globalCommands.push(command);
                } else {
                    guildCommands.push(command);
                    if (commandFile.simulate) {
                        if (!simulateCommands[commandFile.simulate]) {
                            simulateCommands[commandFile.simulate] = [];
                        }
                        simulateCommands[commandFile.simulate].push((subcommand) => {
                            subcommand
                                .addUserOption((option) => option
                                    .setName("from")
                                    .setDescription("The user to simulate the command with.")
                                    .setRequired(true));
                            commandFile.builder(subcommand);
                            return subcommand;
                        });
                    }
                }
            }

            for (const group of Object.keys(simulateCommands)) {
                const simulate = new DiscordJs.SlashCommandBuilder();
                simulate
                    .setName(`simulate${group}`)
                    .setDescription(`Simulates a ${group} command from another user.`)
                    .setDefaultMemberPermissions(0);

                for (const subcommand of simulateCommands[group]) {
                    simulate.addSubcommand(subcommand);
                }

                guildCommands.push(simulate);
            }


            try {
                const rest = new Rest.REST().setToken(settings.discord.token);

                await rest.put(DiscordJs.Routes.applicationGuildCommands(settings.discord.clientId, otlGuild.id), {body: guildCommands});
                await rest.put(DiscordJs.Routes.applicationCommands(settings.discord.clientId), {body: globalCommands});
            } catch (err) {
                Log.exception("Error adding slash commands.", err);
            }

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

        discord.on("interactionCreate", async (interaction) => {
            if (!interaction.isChatInputCommand()) {
                return;
            }

            let success = false;

            try {
                if (interaction.commandName.startsWith("simulate")) {
                    const module = require(`../discord/commands/${interaction.options.getSubcommand(true).toLowerCase()}`);

                    if (!module.global && !Discord.channelIsOnServer(interaction.channel)) {
                        return;
                    }

                    success = await module.handle(interaction, interaction.options.getUser("from", true));
                } else {
                    const module = require(`../discord/commands/${interaction.commandName.toLowerCase()}`);

                    if (!module.global && !Discord.channelIsOnServer(interaction.channel)) {
                        return;
                    }

                    success = await module.handle(interaction, interaction.user);
                }
            } catch (err) {
                if (err instanceof Warning) {
                    Log.warning(`${interaction.channel} ${interaction.user}: ${interaction} - ${err.message || err}`);
                } else if (err instanceof Exception) {
                    Log.exception(`${interaction.channel} ${interaction.user}: ${interaction} - ${err.message}`, err.innerError);
                } else {
                    Log.exception(`${interaction.channel} ${interaction.user}: ${interaction}`, err);
                }
            }

            if (success) {
                Log.log(`${interaction.channel} ${interaction.user}: ${interaction}`);
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

    //  ###  #  #   ##   #  #   ##
    // #  #  #  #  # ##  #  #  # ##
    // #  #  #  #  ##    #  #  ##
    //  ###   ###   ##    ###   ##
    //    #
    /**
     * Queues a message to be sent.
     * @param {string} message The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GuildMember|DiscordJs.GuildTextBasedChannel} channel The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that resolves with the sent message.
     */
    static async queue(message, channel) {
        if (channel.id === discord.user.id) {
            return void 0;
        }

        let msg;
        try {
            msg = await Discord.richQueue(Discord.embedBuilder({description: message}), channel);
        } catch {}
        return msg;
    }

    //             #              #  ###          #    ##       #
    //             #              #  #  #               #       #
    //  ##   # #   ###    ##    ###  ###   #  #  ##     #     ###
    // # ##  ####  #  #  # ##  #  #  #  #  #  #   #     #    #  #
    // ##    #  #  #  #  ##    #  #  #  #  #  #   #     #    #  #
    //  ##   #  #  ###    ##    ###  ###    ###  ###   ###    ###
    /**
     * Gets a new DiscordJs EmbedBuilder object.
     * @param {DiscordJs.EmbedData} [options] The options to pass.
     * @returns {DiscordJs.EmbedBuilder} The EmbedBuilder object.
     */
    static embedBuilder(options) {
        const embed = new DiscordJs.EmbedBuilder(options);

        embed.setFooter({text: embed.data && embed.data.footer ? embed.data.footer.text : "Overload Teams League", iconURL: Discord.icon});

        if (!embed.data || !embed.data.color) {
            embed.setColor(0xFF6600);
        }

        if (!embed.data || !embed.data.timestamp) {
            embed.setTimestamp(new Date());
        }

        return embed;
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
     * @param {DiscordJs.EmbedBuilder} embed The message to change the posted message to.
     * @returns {Promise} A promise that resolves when the message is edited.
     */
    static async richEdit(message, embed) {
        embed.setFooter({
            text: embed.data && embed.data.footer ? embed.data.footer.text : "Overload Teams League",
            iconURL: Discord.icon
        });

        if (embed && embed.data && embed.data.fields) {
            embed.data.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        embed.setColor(message.embeds[0].color);

        if (!embed.data || !embed.data.timestamp) {
            embed.setTimestamp(new Date());
        }

        await message.edit({embeds: [embed]});
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
     * @param {DiscordJs.EmbedBuilder} embed The message to be sent.
     * @param {DiscordJs.TextChannel|DiscordJs.DMChannel|DiscordJs.GuildMember|DiscordJs.GuildTextBasedChannel} channel The channel to send the message to.
     * @returns {Promise<DiscordJs.Message>} A promise that resolves with the sent message.
     */
    static async richQueue(embed, channel) {
        if (channel.id === discord.user.id) {
            return void 0;
        }

        if (embed && embed.data && embed.data.fields) {
            embed.data.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        let msg;
        try {
            const msgSend = await channel.send({embeds: [embed]});

            if (msgSend instanceof Array) {
                msg = msgSend[0];
            } else {
                msg = msgSend;
            }
        } catch {}
        return msg;
    }

    //       #                             ##    ###           ##          ##
    //       #                              #     #           #  #        #  #
    //  ##   ###    ###  ###   ###    ##    #     #     ###   #  #  ###    #     ##   ###   # #    ##   ###
    // #     #  #  #  #  #  #  #  #  # ##   #     #    ##     #  #  #  #    #   # ##  #  #  # #   # ##  #  #
    // #     #  #  # ##  #  #  #  #  ##     #     #      ##   #  #  #  #  #  #  ##    #     # #   ##    #
    //  ##   #  #   # #  #  #  #  #   ##   ###   ###   ###     ##   #  #   ##    ##   #      #     ##   #
    /**
     * Returns whether the channel is on the OTL server.
     * @param {DiscordJs.GuildTextBasedChannel} channel The channel.
     * @returns {boolean} Whether the channel is on the OTL server.
     */
    static channelIsOnServer(channel) {
        return channel.type === DiscordJs.ChannelType.GuildText && channel.guild.name === settings.guild;
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
     * @param {DiscordJs.GuildChannelTypes} type The type of channel to create.
     * @param {DiscordJs.OverwriteResolvable[]|DiscordJs.Collection<DiscordJs.Snowflake, DiscordJs.OverwriteResolvable>} [overwrites] The permissions that should overwrite the default permission set.
     * @param {string} [reason] The reason the channel is being created.
     * @returns {Promise<DiscordJs.TextChannel | DiscordJs.NewsChannel | DiscordJs.VoiceChannel | DiscordJs.CategoryChannel | DiscordJs.StageChannel>} The created channel.
     */
    static createChannel(name, type, overwrites, reason) {
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.channels.create({name, type, permissionOverwrites: overwrites, reason});
    }

    //                          #          ###         ##
    //                          #          #  #         #
    //  ##   ###    ##    ###  ###    ##   #  #   ##    #     ##
    // #     #  #  # ##  #  #   #    # ##  ###   #  #   #    # ##
    // #     #     ##    # ##   #    ##    # #   #  #   #    ##
    //  ##   #      ##    # #    ##   ##   #  #   ##   ###    ##
    /**
     * Creates a new role on the Discord server.
     * @param {DiscordJs.CreateRoleOptions} data The role data.
     * @returns {Promise<DiscordJs.Role>} A promise that resolves with the created role.
     */
    static createRole(data) {
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.roles.create(data);
    }

    //                          #          ####                     #
    //                          #          #                        #
    //  ##   ###    ##    ###  ###    ##   ###   # #    ##   ###   ###
    // #     #  #  # ##  #  #   #    # ##  #     # #   # ##  #  #   #
    // #     #     ##    # ##   #    ##    #     # #   ##    #  #   #
    //  ##   #      ##    # #    ##   ##   ####   #     ##   #  #    ##
    /**
     * Creates a new event on the Discord server.
     * @param {DiscordJs.GuildScheduledEventCreateOptions} data The event data.
     * @returns {Promise<DiscordJs.GuildScheduledEvent>} A promise that returns the event.
     */
    static createEvent(data) {
        if (!otlGuild) {
            return void 0;
        }
        return otlGuild.scheduledEvents.create(data);
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
     * @returns {DiscordJs.GuildChannel | DiscordJs.ThreadChannel} The Discord channel.
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
     * @returns {DiscordJs.GuildChannel | DiscordJs.ThreadChannel} The Discord channel.
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
        return discord.users.fetch(id, {cache: false});
    }

    //   #    #             #  ####                     #    ###         ###      #
    //  # #                 #  #                        #    #  #         #       #
    //  #    ##    ###    ###  ###   # #    ##   ###   ###   ###   #  #   #     ###
    // ###    #    #  #  #  #  #     # #   # ##  #  #   #    #  #  #  #   #    #  #
    //  #     #    #  #  #  #  #     # #   ##    #  #   #    #  #   # #   #    #  #
    //  #    ###   #  #   ###  ####   #     ##   #  #    ##  ###     #   ###    ###
    //                                                              #
    /**
     * Finds a Discord event by event ID.
     * @param {string} id The event ID.
     * @returns {Promise<DiscordJs.GuildScheduledEvent>} A promise that returns the event.
     */
    static findEventById(id) {
        return otlGuild.scheduledEvents.fetch(id);
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

    //              #    #  #                           #                ####                     #
    //              #    #  #                                            #                        #
    //  ###   ##   ###   #  #  ###    ##    ##   # #   ##    ###    ###  ###   # #    ##   ###   ###    ###
    // #  #  # ##   #    #  #  #  #  #     #  #  ####   #    #  #  #  #  #     # #   # ##  #  #   #    ##
    //  ##   ##     #    #  #  #  #  #     #  #  #  #   #    #  #   ##   #     # #   ##    #  #   #      ##
    // #      ##     ##   ##   ###    ##    ##   #  #  ###   #  #  #     ####   #     ##   #  #    ##  ###
    //  ###                    #                                    ###
    /**
     * Gets upcoming Discord events.
     * @returns {Promise<DiscordJs.GuildScheduledEvent[]>} A promise that returns the events.
     */
    static async getUpcomingEvents() {
        if (!otlGuild) {
            return [];
        }

        return Array.from(await otlGuild.scheduledEvents.fetch()).filter((e) => !e[1].isCompleted() && !e[1].isCanceled()).map((e) => e[1]);
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
