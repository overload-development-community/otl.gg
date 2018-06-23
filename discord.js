const DiscordJs = require("discord.js"),

    Commands = require("./commands"),
    Log = require("./log"),
    Queue = require("./queue"),
    settings = require("./settings"),

    discord = new DiscordJs.Client(settings.discord),
    messageParse = /^!([^ ]+)(?: +(.+[^ ]))? *$/,
    newTeamTopicParse = /^Team Name: (.+)$(?:\r\n|\r|\n)^Team Tag: (.+)$/m,
    teamMatch = /^Team: (.+)$/;

let readied = false,

    captainRole,
    founderRole,
    otlGuild,
    rosterUpdatesChannel;

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
    static get discord() {
        return discord;
    }

    //  #
    //
    // ##     ##    ##   ###
    //  #    #     #  #  #  #
    //  #    #     #  #  #  #
    // ###    ##    ##   #  #
    /**
     * OTL's icon.
     * @returns {string} The URL of the icon.
     */
    static get icon() {
        if (discord && discord.status === 0) {
            return discord.user.avatarURL;
        }

        return void 0;
    }

    //         #                 #
    //         #                 #
    //  ###   ###    ###  ###   ###   #  #  ###
    // ##      #    #  #  #  #   #    #  #  #  #
    //   ##    #    # ##  #      #    #  #  #  #
    // ###      ##   # #  #       ##   ###  ###
    //                                      #
    /**
     * Starts up the connection to Discord.
     * @returns {void}
     */
    static startup() {
        Discord.commands = new Commands(Discord);

        discord.addListener("ready", () => {
            Log.log("Connected to Discord.");

            otlGuild = discord.guilds.find("name", "Overload Teams League");

            if (!readied) {
                readied = true;
            }

            captainRole = otlGuild.roles.find("name", "Captain");
            founderRole = otlGuild.roles.find("name", "Founder");

            rosterUpdatesChannel = otlGuild.channels.find("name", "roster-updates");
        });

        discord.on("disconnect", (ev) => {
            Log.exception("Disconnected from Discord.", ev);
        });

        discord.addListener("message", (message) => {
            Discord.message(message.author, message.channel, message.content);
        });

        // TODO: If someone leaves the server, remove them from the league accordingly.  If they are a team founder, notify administration to assign a new founder.
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
            Log.exception("Discord error.", err.error || err);
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
     * @param {User} user The user who sent the message.
     * @param {string} text The text of the message.
     * @returns {void}
     */
    static message(user, text) {
        const matches = messageParse.exec(text);

        if (matches) {
            if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(matches[1]) !== -1) {
                Discord.commands[matches[1]](user, matches[2]).then((success) => {
                    if (success) {
                        Log.log(`${user}: ${text}`);
                    }
                }).catch((err) => {
                    if (err.innerError) {
                        Log.exception(err.message, err.innerError);
                    } else {
                        Log.warning(err);
                    }
                });
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
     * @param {Channel} channel The channel to send the message to.
     * @returns {Promise} A promise that resolves when the message is sent.
     */
    static queue(message, channel) {
        return channel.send(
            "",
            {
                embed: {
                    description: message,
                    timestamp: new Date(),
                    color: 0x16F6F8,
                    footer: {icon_url: Discord.icon} // eslint-disable-line camelcase
                }
            }
        );
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
     * @param {object} message The message to be sent.
     * @param {Channel} channel The channel to send the message to.
     * @returns {Promise} A promise that resolves when the message is sent.
     */
    static richQueue(message, channel) {
        if (message.embed && message.embed.fields) {
            message.embed.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                    console.log(message);
                }
            });
        }

        return channel.send("", message);
    }

    //  #            ##
    //              #  #
    // ##     ###   #  #  #  #  ###    ##   ###
    //  #    ##     #  #  #  #  #  #  # ##  #  #
    //  #      ##   #  #  ####  #  #  ##    #
    // ###   ###     ##   ####  #  #   ##   #
    /**
     * Determines whether the user is the owner.
     * @param {User} user The user to check.
     * @returns {boolean} Whether the user is a podcaster.
     */
    static isOwner(user) {
        return user && user.username === settings.admin.username && user.discriminator === settings.admin.discriminator;
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
     * @returns {GuildMember} The guild member.
     */
    static findGuildMemberById(id) {
        return otlGuild.members.find("id", id);
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
     * @returns {GuildMember} The guild member.
     */
    static findGuildMemberByDisplayName(displayName) {
        return otlGuild.members.find("displayName", displayName);
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
     * @returns {Channel} The Discord channel.
     */
    static findChannelByName(name) {
        return otlGuild.channels.find("name", name);
    }

    //              #    ###                     ###         ##          ####                     ##          #    ##       #  #  #              #
    //              #     #                      #  #         #          #                       #  #               #       #  ####              #
    //  ###   ##   ###    #     ##    ###  # #   #  #   ##    #     ##   ###   ###    ##   # #   #     #  #  ##     #     ###  ####   ##   # #   ###    ##   ###
    // #  #  # ##   #     #    # ##  #  #  ####  ###   #  #   #    # ##  #     #  #  #  #  ####  # ##  #  #   #     #    #  #  #  #  # ##  ####  #  #  # ##  #  #
    //  ##   ##     #     #    ##    # ##  #  #  # #   #  #   #    ##    #     #     #  #  #  #  #  #  #  #   #     #    #  #  #  #  ##    #  #  #  #  ##    #
    // #      ##     ##   #     ##    # #  #  #  #  #   ##   ###    ##   #     #      ##   #  #   ###   ###  ###   ###    ###  #  #   ##   #  #  ###    ##   #
    //  ###
    /**
     * Gets a user's team role.
     * @param {GuildMember} member The guild member to get a team role for.
     * @returns {Role} The team role for the guild member.
     */
    static getTeamRoleFromGuildMember(member) {
        return member.roles.find((r) => r.name.startsWith("Team: "));
    }

    //              #    ###                     ####                    ###                     ###         ##
    //              #     #                      #                        #                      #  #         #
    //  ###   ##   ###    #     ##    ###  # #   ###   ###    ##   # #    #     ##    ###  # #   #  #   ##    #     ##
    // #  #  # ##   #     #    # ##  #  #  ####  #     #  #  #  #  ####   #    # ##  #  #  ####  ###   #  #   #    # ##
    //  ##   ##     #     #    ##    # ##  #  #  #     #     #  #  #  #   #    ##    # ##  #  #  # #   #  #   #    ##
    // #      ##     ##   #     ##    # #  #  #  #     #      ##   #  #   #     ##    # #  #  #  #  #   ##   ###    ##
    //  ###
    /**
     * Gets the team name from the team role.
     * @param {Role} role The team role.
     * @returns {string} The name of the team.
     */
    static getTeamFromTeamRole(role) {
        if (!teamMatch.test(role.name)) {
            return null;
        }

        return teamMatch.exec(role.name)[1];
    }

    //                #         #          ###
    //                #         #           #
    // #  #  ###    ###   ###  ###    ##    #     ##    ###  # #
    // #  #  #  #  #  #  #  #   #    # ##   #    # ##  #  #  ####
    // #  #  #  #  #  #  # ##   #    ##     #    ##    # ##  #  #
    //  ###  ###    ###   # #    ##   ##    #     ##    # #  #  #
    //       #
    /**
     * Updates the team's channels.
     * @param {object} team The team to update.
     * @returns {void}
     */
    static updateTeam(team) {
        // TODO: Update the team and captain channel topics.
    }

    //                #         #          #  #                      #
    //                #         #          #  #                      #
    // #  #  ###    ###   ###  ###    ##   #  #   ###    ##   ###   ###    ##    ###  # #
    // #  #  #  #  #  #  #  #   #    # ##  #  #  ##     # ##  #  #   #    # ##  #  #  ####
    // #  #  #  #  #  #  # ##   #    ##    #  #    ##   ##    #      #    ##    # ##  #  #
    //  ###  ###    ###   # #    ##   ##    ##   ###     ##   #       ##   ##    # #  #  #
    //       #
    /**
     * Updates the user's team's channels.
     * @param {User} user The user whose team to update.
     * @returns {void}
     */
    static updateUserTeam(user) {
        // TODO: Update the team and captain channel topics.
    }

    //          #     #   ##                #           #
    //          #     #  #  #               #
    //  ###   ###   ###  #      ###  ###   ###    ###  ##    ###
    // #  #  #  #  #  #  #     #  #  #  #   #    #  #   #    #  #
    // # ##  #  #  #  #  #  #  # ##  #  #   #    # ##   #    #  #
    //  # #   ###   ###   ##    # #  ###     ##   # #  ###   #  #
    //                               #
    /**
     * Adds a captain to the user's team.
     * @param {User} user The user adding the captain to their team.
     * @param {User} captain The user to add as a captain.
     * @returns {Promise} A promise that resolves when the captain has been added.
     */
    static addCaptain(user, captain) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const guildCaptain = otlGuild.member(captain);

            if (!guildCaptain) {
                reject(new Error("Captain does not exist on server."));
                return;
            }

            if (!founderRole.members.find("id", guildMember.id)) {
                reject(new Error("User is not a founder."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (!teamRole) {
                reject(new Error("User is not on a team."));
                return;
            }

            if (!teamRole.members.find("id", guildCaptain.id)) {
                reject(new Error("Users are not on the same team."));
                return;
            }

            const teamName = Discord.getTeamFromTeamRole(teamRole),
                captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
                channel = otlGuild.channels.find("name", channelName);

            if (!channel) {
                reject(new Error("Team's channel does not exist."));
                return;
            }

            guildCaptain.addRole(captainRole, `${guildMember.displayName} added ${guildCaptain.displayName} as a captain of ${teamName}.`).then(() => {
                captainChannel.overwritePermissions(guildCaptain, [
                    {
                        id: guildCaptain.id,
                        allow: ["VIEW_CHANNEL"]
                    }
                ], `${guildMember.displayName} added ${guildCaptain.displayName} as a captain of ${teamName}.`).then(() => {
                    Discord.updateUserTeam(user);
                    Discord.queue(`${guildCaptain}, you have been added as a captain of **${teamName}**!  You now have access to your team's captain's channel, #${captainChannelName}.  Be sure to read the pinned messages in that channel for more information as to what you can do for your team as a captain.`, captain);
                    Discord.queue(`@everyone Welcome **${guildCaptain}** as the newest team captain!`, captainChannel);
                    Discord.queue(`**${guildCaptain}** is now a team captain!`, channel);
                    Discord.richQueue({
                        embed: {
                            title: teamName,
                            description: "Leadership Update",
                            color: 0x008000,
                            timestamp: new Date(),
                            fields: [
                                {
                                    name: "Captain Added",
                                    value: `${guildCaptain}`
                                }
                            ],
                            footer: {
                                text: `added by ${guildMember.displayName}`,
                                icon_url: Discord.icon // eslint-disable-line camelcase
                            }
                        }
                    }, rosterUpdatesChannel);

                    resolve();
                }).catch(reject);
            }).catch(reject);
        });
    }

    //          #     #  #  #                     ###         ###
    //          #     #  #  #                      #           #
    //  ###   ###   ###  #  #   ###    ##   ###    #     ##    #     ##    ###  # #
    // #  #  #  #  #  #  #  #  ##     # ##  #  #   #    #  #   #    # ##  #  #  ####
    // # ##  #  #  #  #  #  #    ##   ##    #      #    #  #   #    ##    # ##  #  #
    //  # #   ###   ###   ##   ###     ##   #      #     ##    #     ##    # #  #  #
    /**
     * Adds a user to a team.
     * @param {User} user The user to add.
     * @param {object} team The team to add the user to.
     * @returns {Promise} A promise that resolves when the user has been added.
     */
    static addUserToTeam(user, team) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const teamRole = otlGuild.roles.find("name", `Team: ${team.name}`);

            if (!teamRole) {
                reject(new Error("Team does not exist."));
                return;
            }

            const teamName = Discord.getTeamFromTeamRole(teamRole),
                captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
                channel = otlGuild.channels.find("name", channelName);

            if (!channel) {
                reject(new Error("Team's channel does not exist."));
                return;
            }

            guildMember.addRole(teamRole, `${guildMember.displayName} accepted their invitation to ${team.name}.`).then(() => {
                Discord.updateUserTeam(user);
                Discord.queue(`${guildMember}, you are now a member of **${teamName}**!  You now have access to your team's channel, #${channelName}.`, user);
                Discord.queue(`@everyone **${guildMember}** has accepted your invitation to join the team!`, captainChannel);
                Discord.queue(`**${guildMember}** has joined the team!`, channel);
                Discord.richQueue({
                    embed: {
                        title: teamName,
                        description: "Player Added",
                        color: 0x00FF00,
                        timestamp: new Date(),
                        fields: [
                            {
                                name: "Player Added",
                                value: `${guildMember}`
                            }
                        ],
                        footer: {
                            text: "added by accepted invitation",
                            icon_url: Discord.icon // eslint-disable-line camelcase
                        }
                    }
                }, rosterUpdatesChannel);

                resolve();
            }).catch(reject);
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
     * @param {User} user The user updating the home map.
     * @param {number} number The number of the home map.
     * @param {string} map The new home map.
     * @returns {Promise} A promise that resolves when the home map has been updated.
     */
    static applyHomeMap(user, number, map) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (!teamRole) {
                reject(new Error("User is not on a team."));
                return;
            }

            if (!captainRole.members.find("id", user.id) && !founderRole.members.find("id", user.id)) {
                reject(new Error("User is not a captain or a founder."));
                return;
            }

            const teamName = Discord.getTeamFromTeamRole(teamRole),
                captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            Discord.updateUserTeam(user);

            Discord.queue(`${guildMember} has changed home map number ${number} to ${map}.`, captainChannel);

            resolve();
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
     * Applies a team name to a team being created.
     * @param {User} user The user applying the team name.
     * @param {string} name The team name to apply.
     * @returns {Promise} A promise that resolves when the team name has been applied.
     */
    static applyTeamName(user, name) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const channel = otlGuild.channels.find("name", `new-team-${user.id}`);

            if (!channel) {
                reject(new Error("Channel does not exist."));
                return;
            }

            const {2: tag} = newTeamTopicParse.exec(channel.topic);

            channel.setTopic(`Team Name: ${name}\r\nTeam Tag: ${tag || "(unset)"}`, `${guildMember.displayName} updated the team name.`).then(resolve).catch(reject);
        });
    }

    //                   ##          ###                     ###
    //                    #           #                       #
    //  ###  ###   ###    #    #  #   #     ##    ###  # #    #     ###   ###
    // #  #  #  #  #  #   #    #  #   #    # ##  #  #  ####   #    #  #  #  #
    // # ##  #  #  #  #   #     # #   #    ##    # ##  #  #   #    # ##   ##
    //  # #  ###   ###   ###     #    #     ##    # #  #  #   #     # #  #
    //       #     #            #                                         ###
    /**
     * Applies a team tag to a team being created.
     * @param {User} user The user applying the team tag.
     * @param {string} tag The team tag to apply.
     * @returns {Promise} A promise that resolves when the team tag has been applied.
     */
    static applyTeamTag(user, tag) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const channel = otlGuild.channels.find("name", `new-team-${user.id}`);

            if (!channel) {
                reject(new Error("Channel does not exist."));
                return;
            }

            const {1: name} = newTeamTopicParse.exec(channel.topic);

            channel.setTopic(`Team Name: ${name || "(unset)"}\r\nTeam Tag: ${tag}`, `${guildMember.displayName} updated the tag name.`).then(resolve).catch(reject);
        });
    }

    //                               ##     ##                      #          ###
    //                                #    #  #                     #           #
    //  ##    ###  ###    ##    ##    #    #     ###    ##    ###  ###    ##    #     ##    ###  # #
    // #     #  #  #  #  #     # ##   #    #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     # ##  #  #  #     ##     #    #  #  #     ##    # ##   #    ##     #    ##    # ##  #  #
    //  ##    # #  #  #   ##    ##   ###    ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Cancels creating a team.
     * @param {User} user The user to cancel team creation.
     * @returns {Promise} A promise that resolves when team creation has been cancelled.
     */
    static cancelCreateTeam(user) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const channel = otlGuild.channels.find("name", `new-team-${user.id}`);

            if (!channel) {
                reject(new Error("Channel does not exist."));
                return;
            }

            channel.delete(`${guildMember.displayName} cancelled team creation.`).then(resolve).catch(reject);
        });
    }

    //                    #           #           ##                      #     ##         #  #                     ###
    //                    #                      #  #                     #    #  #        #  #                      #
    //  ##    ###  ###   ###    ###  ##    ###   #      ##   #  #  ###   ###   #  #  ###   #  #   ###    ##   ###    #     ##    ###  # #
    // #     #  #  #  #   #    #  #   #    #  #  #     #  #  #  #  #  #   #    #  #  #  #  #  #  ##     # ##  #  #   #    # ##  #  #  ####
    // #     # ##  #  #   #    # ##   #    #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  #  #    ##   ##    #      #    ##    # ##  #  #
    //  ##    # #  ###     ##   # #  ###   #  #   ##    ##    ###  #  #    ##   ##   #  #   ##   ###     ##   #      #     ##    # #  #  #
    //             #
    /**
     * Gets the count of captains on the user's team.
     * @param {User} user The user whose team to get the captain count for.
     * @returns {Promise<number>} A promise that resolves with the number of captains on the user's team.
     */
    static captainCountOnUserTeam(user) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (!teamRole) {
                reject(new Error("User is not on a team."));
                return;
            }

            resolve(teamRole.members.filter((m) => captainRole.members.find("id", m.id)).length);
        });
    }

    //       #                             ###                      ##         ##
    //       #                              #                      #  #         #
    //  ##   ###    ###  ###    ###   ##    #     ##    ###  # #   #      ##    #     ##   ###
    // #     #  #  #  #  #  #  #  #  # ##   #    # ##  #  #  ####  #     #  #   #    #  #  #  #
    // #     #  #  # ##  #  #   ##   ##     #    ##    # ##  #  #  #  #  #  #   #    #  #  #
    //  ##   #  #   # #  #  #  #      ##    #     ##    # #  #  #   ##    ##   ###    ##   #
    //                          ###
    /**
     * Changes a team's color.
     * @param {User} user The user whose team to change color for.
     * @param {string} color The color to change to.
     * @returns {Promise} A promise that resolves when the team's color has changed.
     */
    static changeTeamColor(user, color) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (!teamRole) {
                reject(new Error("User is not on a team."));
                return;
            }

            if (!founderRole.members.find("id", user.id)) {
                reject(new Error("User is not a founder."));
                return;
            }

            teamRole.setColor(color, `${guildMember.displayName} updated the team color.`).then(resolve).catch(reject);
        });
    }

    //                          #          ###
    //                          #           #
    //  ##   ###    ##    ###  ###    ##    #     ##    ###  # #
    // #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     #     ##    # ##   #    ##     #    ##    # ##  #  #
    //  ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Creates the team.
     * @param {User} user The user creating the team.
     * @param {string} name The team name.
     * @param {string} tag The team tag.
     * @returns {Promise} A promise that resolves when the team is created.
     */
    static createTeam(user, name, tag) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const currentTeamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (currentTeamRole) {
                reject(new Error("User is already on a team."));
                return;
            }

            const existingRole = otlGuild.roles.find("name", `Team: ${name}`);

            if (existingRole) {
                reject(new Error("Team role already exists."));
                return;
            }

            const existingCategory = otlGuild.channels.find("name", name);

            if (existingCategory) {
                reject(new Error("Team category already exists."));
                return;
            }

            const channelName = `team-${name.toLowerCase().replace(/ /g, "-")}`,
                existingChannel = otlGuild.channels.find("name", channelName);

            if (existingChannel) {
                reject(new Error("Team channel already exists."));
                return;
            }

            const captainChannelName = `captains-${name.toLowerCase().replace(/ /g, "-")}`,
                existingCaptainChannel = otlGuild.channels.find("name", captainChannelName);

            if (existingCaptainChannel) {
                reject(new Error("Captain channel already exists."));
                return;
            }

            otlGuild.createRole({
                name: `Team: ${name}`,
                mentionable: false
            }, `${guildMember.displayName} created the team ${name}.`).then((teamRole) => {
                otlGuild.createChannel(name, "category", [
                    {
                        id: otlGuild.id,
                        deny: ["VIEW_CHANNEL"]
                    }, {
                        id: teamRole.id,
                        allow: ["VIEW_CHANNEL"]
                    }
                ], `${guildMember.displayName} created the team ${name}.`).then((category) => {
                    otlGuild.createChannel(name, "text", [], `${guildMember.displayName} created the team ${name}.`).then((channel) => {
                        channel.setParent(category).then(() => {
                            otlGuild.createChannel(name, "text", [
                                {
                                    id: otlGuild.id,
                                    deny: ["VIEW_CHANNEL"]
                                }, {
                                    id: teamRole.id,
                                    deny: ["VIEW_CHANNEL"]
                                }, {
                                    id: user.id,
                                    allow: ["VIEW_CHANNEL"]
                                }
                            ], `${guildMember.displayName} created the team ${name}.`).then((captainChannel) => {
                                captainChannel.setParent(category).then(() => {
                                    Discord.richQueue({
                                        embed: {
                                            title: `${name} (${tag})`,
                                            description: "New Team",
                                            color: 0x0000FF,
                                            timestamp: new Date(),
                                            fields: [
                                                {
                                                    name: "Founder Added",
                                                    value: `${guildMember}`
                                                }
                                            ],
                                            footer: {
                                                text: `created by ${guildMember.displayName}`,
                                                icon_url: Discord.icon // eslint-disable-line camelcase
                                            }
                                        }
                                    }, rosterUpdatesChannel);

                                    Discord.richQueue({
                                        embed: {
                                            title: "Founder commands",
                                            color: 0x00FF00,
                                            timestamp: new Date(),
                                            fields: [
                                                {
                                                    name: "!color ([light|dark]) [red|orange|yellow|green|indigo|blue|purple]",
                                                    value: "Set the color for display in Discord."
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
                                        }
                                    }, captainChannel).then((msg1) => {
                                        msg1.pin().then(() => {
                                            Discord.richQueue({
                                                embed: {
                                                    title: "Captain commands",
                                                    color: 0x00FF00,
                                                    timestamp: new Date(),
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
                                                }
                                            }, captainChannel).then((msg2) => {
                                                msg2.pin().then(() => {
                                                    const newChannel = otlGuild.channels.find("name", `new-team-${user.id}`);

                                                    if (!newChannel) {
                                                        resolve();
                                                        return;
                                                    }

                                                    newChannel.delete(`${guildMember.displayName} created the team ${name}.`).then(resolve).catch(reject);
                                                }).catch(reject);
                                            }).catch(reject);
                                        }).catch(reject);
                                    }).catch(reject);
                                }).catch(reject);
                            }).catch(reject);
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
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
     * @param {User} user The user to disband a team for.
     * @returns {Promise} A promise that resolves when the team is disbanded.
     */
    static disbandTeam(user) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            if (!founderRole.members.find("id", guildMember.id)) {
                reject(new Error("User is not a founder."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (!teamRole) {
                reject(new Error("User is already on a team."));
                return;
            }

            const name = Discord.getTeamFromTeamRole(teamRole);

            const channelName = `team-${name.toLowerCase().replace(/ /g, "-")}`,
                channel = otlGuild.channels.find("name", channelName);

            if (!channel) {
                reject(new Error("Team channel does not exists."));
                return;
            }

            const captainChannelName = `captains-${name.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain channel does not exists."));
                return;
            }

            const category = otlGuild.channels.find("name", name);

            if (!category) {
                reject(new Error("Team category does not exists."));
                return;
            }

            channel.delete(`${guildMember.displayName} disbanded ${name}.`).then(() => {
                captainChannel.delete(`${guildMember.displayName} disbanded ${name}.`).then(() => {
                    category.delete(`${guildMember.displayName} disbanded ${name}.`).then(() => {
                        const queue = new Queue(),
                            memberList = [];

                        teamRole.members.forEach((member) => {
                            memberList.push(`${member}`);

                            queue.push(() => {
                                if (captainRole.members.find("id", member.id)) {
                                    return member.removeRole(captainRole, `${guildMember.displayName} disbanded ${name}.`);
                                }

                                return true;
                            });
                            queue.push(() => {
                                if (founderRole.members.find("id", member.id)) {
                                    return member.removeRole(founderRole, `${guildMember.displayName} disbanded ${name}.`);
                                }

                                return true;
                            });

                            queue.push(() => Discord.queue(`Your team ${name} has been disbanded.`, member));
                        });

                        queue.push(() => teamRole.delete(`${guildMember.displayName} disbanded ${name}.`));

                        queue.push(() => Discord.richQueue({
                            embed: {
                                title: `${name}`,
                                description: "Team Disbanded",
                                color: 0xFF00FF,
                                timestamp: new Date(),
                                fields: [
                                    {
                                        name: "Players Removed",
                                        value: `${memberList.join(", ")}`
                                    }
                                ],
                                footer: {
                                    text: `disbanded by ${guildMember.displayName}`,
                                    icon_url: Discord.icon // eslint-disable-line camelcase
                                }
                            }
                        }, rosterUpdatesChannel));

                        queue.promise.then(resolve).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        });
    }

    //  #                 #     #          ###   ##                            ###         ###
    //                          #          #  #   #                             #           #
    // ##    ###   # #   ##    ###    ##   #  #   #     ###  #  #   ##   ###    #     ##    #     ##    ###  # #
    //  #    #  #  # #    #     #    # ##  ###    #    #  #  #  #  # ##  #  #   #    #  #   #    # ##  #  #  ####
    //  #    #  #  # #    #     #    ##    #      #    # ##   # #  ##    #      #    #  #   #    ##    # ##  #  #
    // ###   #  #   #    ###     ##   ##   #     ###    # #    #    ##   #      #     ##    #     ##    # #  #  #
    //                                                        #
    /**
     * Invites a player to a team.
     * @param {User} user The user inviting the player.
     * @param {User} player The player being invited.
     * @returns {Promise} A promise that resolves when the player has been invited.
     */
    static invitePlayerToTeam(user, player) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const playerMember = otlGuild.member(player);

            if (!playerMember) {
                reject(new Error("Player does not exist on server."));
                return;
            }

            if (!founderRole.members.find("id", guildMember.id) && !captainRole.members.find("id", guildMember.id)) {
                reject(new Error("User is not a founder or captain."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (!teamRole) {
                reject(new Error("User is not on a team."));
                return;
            }

            const teamName = Discord.getTeamFromTeamRole(teamRole);

            Discord.queue(`${player.displayName}, you have been invited to join **${teamName}** by ${user.displayName}.  You can accept this invitation by responding with \`!accept ${teamName}\`.`, player);

            Discord.updateUserTeam(user);

            resolve();
        });
    }

    //                      #        ###          ##                      #          ###
    //                      #         #          #  #                     #           #
    // ###    ##    ###   ###  #  #   #     ##   #     ###    ##    ###  ###    ##    #     ##    ###  # #
    // #  #  # ##  #  #  #  #  #  #   #    #  #  #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     ##    # ##  #  #   # #   #    #  #  #  #  #     ##    # ##   #    ##     #    ##    # ##  #  #
    // #      ##    # #   ###    #    #     ##    ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    //                          #
    /**
     * Checks if a user is ready to create a team.
     * @param {User} user The user to check.
     * @returns {Promise<bool, string, string>} Returns a promise that includes whether the user is ready to create their team, the team name, and the team tag.
     */
    static readyToCreateTeam(user) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const channel = otlGuild.channels.find("name", `new-team-${user.id}`);

            if (!channel) {
                reject(new Error("Channel does not exist."));
                return;
            }

            const {1: team, 2: tag} = newTeamTopicParse.exec(channel.topic);

            if (team && team !== "(unset)" && tag && tag !== "(unset)") {
                resolve(true, team, tag);
            } else {
                resolve(false);
            }
        });
    }

    //              #                  #           #          ###
    //                                 #           #           #
    // ###    ##   ##    ###    ###   ###    ###  ###    ##    #     ##    ###  # #
    // #  #  # ##   #    #  #  ##      #    #  #   #    # ##   #    # ##  #  #  ####
    // #     ##     #    #  #    ##    #    # ##   #    ##     #    ##    # ##  #  #
    // #      ##   ###   #  #  ###      ##   # #    ##   ##    #     ##    # #  #  #
    /**
     * Reinstates an existing team to the league.
     * @param {User} user The user reinstating the team.
     * @param {object} team The team to reinstate.
     * @returns {Promise} A promise that resolves when the team is reinstated.
     */
    static reinstateTeam(user, team) {
        return Discord.createTeam(user, team.name, team.tag);
    }

    //                                      ##                #           #
    //                                     #  #               #
    // ###    ##   # #    ##   # #    ##   #      ###  ###   ###    ###  ##    ###
    // #  #  # ##  ####  #  #  # #   # ##  #     #  #  #  #   #    #  #   #    #  #
    // #     ##    #  #  #  #  # #   ##    #  #  # ##  #  #   #    # ##   #    #  #
    // #      ##   #  #   ##    #     ##    ##    # #  ###     ##   # #  ###   #  #
    //                                                 #
    /**
     * Removes a captain from a team.
     * @param {User} user The user removing the captain.
     * @param {User} captain The captain to remove.
     * @returns {Promise} A promise that resolves when the captain has been removed.
     */
    static removeCaptain(user, captain) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const guildCaptain = otlGuild.member(captain);

            if (!guildCaptain) {
                reject(new Error("Captain does not exist on server."));
                return;
            }

            if (!founderRole.members.find("id", guildMember.id)) {
                reject(new Error("User is not a founder."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (!teamRole) {
                reject(new Error("User is not on a team."));
                return;
            }

            if (!teamRole.members.find("id", guildCaptain.id)) {
                reject(new Error("Users are not on the same team."));
                return;
            }

            const teamName = Discord.getTeamFromTeamRole(teamRole),
                captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
                channel = otlGuild.channels.find("name", channelName);

            if (!channel) {
                reject(new Error("Team's channel does not exist."));
                return;
            }

            guildCaptain.removeRole(captainRole, `${guildMember.displayName} removed ${guildCaptain.displayName} as a captain.`).then(() => {
                captainChannel.overwritePermissions(guildCaptain, [
                    {
                        id: guildCaptain.id,
                        deny: ["VIEW_CHANNEL"]
                    }
                ], `${guildMember.displayName} removed ${guildCaptain.displayName} as a captain.`).then(() => {
                    Discord.queue(`${guildCaptain}, you are no longer a captain of **${teamName}**.`, captain);
                    Discord.queue(`${guildCaptain.displayName} is no longer a team captain.`, captainChannel);
                    Discord.queue(`${guildCaptain.displayName} is no longer a team captain.`, channel);
                    Discord.richQueue({
                        embed: {
                            title: teamName,
                            description: "Leadership Update",
                            color: 0x800000,
                            timestamp: new Date(),
                            fields: [
                                {
                                    name: "Captain Removed",
                                    value: `${guildCaptain}`
                                }
                            ],
                            footer: {
                                text: `removed by ${guildMember.displayName}`,
                                icon_url: Discord.icon // eslint-disable-line camelcase
                            }
                        }
                    }, rosterUpdatesChannel);

                    resolve();
                }).catch(reject);
            }).catch(reject);
        });
    }

    //                                     ###   ##
    //                                     #  #   #
    // ###    ##   # #    ##   # #    ##   #  #   #     ###  #  #   ##   ###
    // #  #  # ##  ####  #  #  # #   # ##  ###    #    #  #  #  #  # ##  #  #
    // #     ##    #  #  #  #  # #   ##    #      #    # ##   # #  ##    #
    // #      ##   #  #   ##    #     ##   #     ###    # #    #    ##   #
    //                                                        #
    /**
     * Removes a player from a team, whether they are a player on the team, someone who has been invited, or someone who has requested to join.
     * @param {User} user The user removing the player.
     * @param {User} player The player to remove.
     * @returns {Promise} A promise that resolves when the player has been removed.
     */
    static removePlayer(user, player) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const guildPlayer = otlGuild.member(player);

            if (!guildPlayer) {
                reject(new Error("Player does not exist on server."));
                return;
            }

            if (!founderRole.members.find("id", guildMember.id)) {
                reject(new Error("User is not a founder."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (!teamRole) {
                reject(new Error("User is not on a team."));
                return;
            }

            const teamName = Discord.getTeamFromTeamRole(teamRole),
                captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
                channel = otlGuild.channels.find("name", channelName);

            if (!channel) {
                reject(new Error("Team's channel does not exist."));
                return;
            }

            if (teamRole.members.find("id", guildPlayer.id)) {
                guildPlayer.removeRole(captainRole, `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`).then(() => {
                    captainChannel.overwritePermissions(guildPlayer, [
                        {
                            id: guildPlayer.id,
                            deny: ["VIEW_CHANNEL"]
                        }
                    ], `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`).then(() => {
                        guildPlayer.removeRole(teamRole, `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`).then(() => {
                            Discord.queue(`${guildPlayer}, you have been removed from **${teamName}** by ${guildMember.displayName}.`, player);
                            Discord.queue(`${guildPlayer.displayName} has been removed from the team by ${guildMember.displayName}.`, captainChannel);
                            Discord.queue(`${guildPlayer.displayName} has been removed from the team by ${guildMember.displayName}.`, channel);

                            Discord.richQueue({
                                embed: {
                                    title: teamName,
                                    description: "Player Removed",
                                    color: 0xFF0000,
                                    timestamp: new Date(),
                                    fields: [
                                        {
                                            name: "Player Removed",
                                            value: `${guildMember}`
                                        }
                                    ],
                                    footer: {
                                        text: `removed by ${guildMember.displayName}`,
                                        icon_url: Discord.icon // eslint-disable-line camelcase
                                    }
                                }
                            }, rosterUpdatesChannel);

                            resolve();
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            } else {
                Discord.queue(`${guildPlayer.displayName} declined to invite ${guildMember.displayName}.`, captainChannel);

                resolve();
            }

            Discord.updateUserTeam(user);
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
     * @returns {Promise} A promise that resolves when the user is removed.
     */
    static removeUserFromTeam(user, team) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const teamRole = otlGuild.roles.find("name", `Team: ${team.name}`);

            if (!teamRole) {
                reject(new Error("Team does not exist."));
                return;
            }

            const teamName = Discord.getTeamFromTeamRole(teamRole),
                captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
                channel = otlGuild.channels.find("name", channelName);

            if (!channel) {
                reject(new Error("Team's channel does not exist."));
                return;
            }

            guildMember.removeRole(captainRole, `${guildMember.displayName} left the team.`).then(() => {
                captainChannel.overwritePermissions(guildMember, [
                    {
                        id: guildMember.id,
                        deny: ["VIEW_CHANNEL"]
                    }
                ], `${guildMember.displayName} left the team.`).then(() => {
                    guildMember.removeRole(teamRole, `${guildMember.displayName} left the team.`).then(() => {
                        Discord.queue(`${guildMember.displayName} has left the team.`, captainChannel);
                        Discord.queue(`${guildMember.displayName} has left the team.`, channel);
                        Discord.richQueue({
                            embed: {
                                title: teamName,
                                description: "Player Left",
                                color: 0xFF0000,
                                timestamp: new Date(),
                                fields: [
                                    {
                                        name: "Player Left",
                                        value: `${guildMember}`
                                    }
                                ],
                                footer: {
                                    text: "player left",
                                    icon_url: Discord.icon // eslint-disable-line camelcase
                                }
                            }
                        }, rosterUpdatesChannel);

                        resolve();
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
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
     * Creates a request for a user to join a team.
     * @param {User} user The user making the request.
     * @param {object} team The team being requested to join.
     * @returns {Promise} A promise that resolves when the request has been processed.
     */
    static requestTeam(user, team) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const teamRole = otlGuild.roles.find("name", `Team: ${team.name}`);

            if (!teamRole) {
                reject(new Error("Team does not exist."));
                return;
            }

            const teamName = Discord.getTeamFromTeamRole(teamRole),
                captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            Discord.queue(`@everyone, ${guildMember.displayName} has requested to join the team.`, captainChannel);

            Discord.updateTeam(team);

            resolve();
        });
    }

    //         #                 #     ##                      #          ###
    //         #                 #    #  #                     #           #
    //  ###   ###    ###  ###   ###   #     ###    ##    ###  ###    ##    #     ##    ###  # #
    // ##      #    #  #  #  #   #    #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    //   ##    #    # ##  #      #    #  #  #     ##    # ##   #    ##     #    ##    # ##  #  #
    // ###      ##   # #  #       ##   ##   #      ##    # #    ##   ##    #     ##    # #  #  #
    /**
     * Starts the process of creating a team for a user.
     * @param {User} user The user creating the team.
     * @returns {Promise} A promise that resolves when the process of starting to create a team is complete.
     */
    static startCreateTeam(user) {
        return new Promise((resolve, reject) => {
            const guildMember = otlGuild.member(user);

            if (!guildMember) {
                reject(new Error("User does not exist on server."));
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);

            if (teamRole) {
                reject(new Error("User is already on a team."));
                return;
            }

            const channelName = `new-team-${user.id}`,
                existingChannel = otlGuild.channels.find("name", channelName);

            if (existingChannel) {
                reject(new Error("Channel already exists."));
                return;
            }

            otlGuild.createChannel(channelName, "text", [
                {
                    id: otlGuild.id,
                    deny: ["VIEW_CHANNEL"]
                }, {
                    id: user.id,
                    allow: ["VIEW_CHANNEL"]
                }
            ], `${guildMember.displayName} has started the process of creating a team.`).then((channel) => {
                channel.setTopic("Team Name: (Unset)\r\nTeam Tag: (unset)", `${guildMember.displayName} has started the process of creating a team.`).then(() => {
                    Discord.richQueue({
                        embed: {
                            title: "Team creation commands",
                            color: 0x00FF00,
                            timestamp: new Date(),
                            fields: [
                                {
                                    name: "!name <name>",
                                    value: "Set your team's name.  Required before you complete team creation."
                                },
                                {
                                    name: "!tag <tag>",
                                    value: "Sets your tame tag, which is up to five letters or numbers that is considered to be a short form of your team name.  Required before you complete team creation."
                                },
                                {
                                    name: "!cancel",
                                    value: "Cancels team creation."
                                },
                                {
                                    name: "!complete",
                                    value: "Completes the team creation process and creates your team on the OTL."
                                }
                            ]
                        }
                    }, channel).then((msg) => {
                        msg.pin().then(resolve).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        });
    }

    //  #                      #  #                    ####         #            #
    //  #                      ## #                    #                         #
    // ###    ##    ###  # #   ## #   ###  # #    ##   ###   #  #  ##     ###   ###    ###
    //  #    # ##  #  #  ####  # ##  #  #  ####  # ##  #      ##    #    ##      #    ##
    //  #    ##    # ##  #  #  # ##  # ##  #  #  ##    #      ##    #      ##    #      ##
    //   ##   ##    # #  #  #  #  #   # #  #  #   ##   ####  #  #  ###   ###      ##  ###
    /**
     * Determines whether a team name exists.
     * @param {string} name The team name to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the team name exists.
     */
    static teamNameExists(name) {
        return new Promise((resolve) => {
            resolve(!!otlGuild.roles.find("name", `Team: ${name}`));
        });
    }

    //                          ###           ##                #           #           ##         ####                       #
    //                           #           #  #               #                      #  #        #                          #
    // #  #   ###    ##   ###    #     ###   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###
    // #  #  ##     # ##  #  #   #    ##     #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #    ##   ##    #      #      ##   #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #
    //  ###  ###     ##   #     ###   ###     ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #
    //                                                   #
    /**
     * Determines whether the user is a captain or a founder.
     * @param {User} user The user to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user is a captain or a founder.
     */
    static userIsCaptainOrFounder(user) {
        return new Promise((resolve) => {
            resolve(!!founderRole.members.find("id", user.id) || !!captainRole.members.find("id", user.id));
        });
    }

    //                          ###          ####                       #
    //                           #           #                          #
    // #  #   ###    ##   ###    #     ###   ###    ##   #  #  ###    ###   ##   ###
    // #  #  ##     # ##  #  #   #    ##     #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #    ##   ##    #      #      ##   #     #  #  #  #  #  #  #  #  ##    #
    //  ###  ###     ##   #     ###   ###    #      ##    ###  #  #   ###   ##   #
    /**
     * Determines whether the user is a founder.
     * @param {User} user The user to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user is a founder.
     */
    static userIsFounder(user) {
        return new Promise((resolve) => {
            resolve(!!founderRole.members.find("id", user.id));
        });
    }

    //                          ###           ##    #                 #     #                ###
    //                           #           #  #   #                 #                       #
    // #  #   ###    ##   ###    #     ###    #    ###    ###  ###   ###   ##    ###    ###   #     ##    ###  # #
    // #  #  ##     # ##  #  #   #    ##       #    #    #  #  #  #   #     #    #  #  #  #   #    # ##  #  #  ####
    // #  #    ##   ##    #      #      ##   #  #   #    # ##  #      #     #    #  #   ##    #    ##    # ##  #  #
    //  ###  ###     ##   #     ###   ###     ##     ##   # #  #       ##  ###   #  #  #      #     ##    # #  #  #
    //                                                                                  ###
    /**
     * Determines whether the user is starting a team.
     * @param {User} user The user to check.
     * @returns {Promise<boolean>} A promise that resolves with whether the user is starting a team.
     */
    static userIsStartingTeam(user) {
        return new Promise((resolve) => {
            resolve(!!otlGuild.channels.find(`new-user-${user.id}`));
        });
    }

    //                                  ##                ##         ###   #            ##                     ###
    //                                 #  #              #  #         #    #           #  #                     #
    // #  #   ###    ##   ###    ###   #  #  ###    ##   #  #  ###    #    ###    ##    #     ###  # #    ##    #     ##    ###  # #
    // #  #  ##     # ##  #  #  ##     ####  #  #  # ##  #  #  #  #   #    #  #  # ##    #   #  #  ####  # ##   #    # ##  #  #  ####
    // #  #    ##   ##    #       ##   #  #  #     ##    #  #  #  #   #    #  #  ##    #  #  # ##  #  #  ##     #    ##    # ##  #  #
    //  ###  ###     ##   #     ###    #  #  #      ##    ##   #  #   #    #  #   ##    ##    # #  #  #   ##    #     ##    # #  #  #
    /**
     * Determines whether two users are on the same team.
     * @param {User} user1 The first user to check.
     * @param {User} user2 The second user to check.
     * @returns {Promise<boolean>} A promise that resolves with whether both users are on the same team.
     */
    static usersAreOnTheSameTeam(user1, user2) {
        return new Promise((resolve, reject) => {
            const guildMember1 = otlGuild.member(user1);

            if (!guildMember1) {
                reject(new Error("User 1 does not exist on server."));
                return;
            }

            const guildMember2 = otlGuild.member(user2);

            if (!guildMember2) {
                reject(new Error("User 2 does not exist on server."));
                return;
            }

            const team1Role = Discord.getTeamRoleFromGuildMember(guildMember1);

            if (!team1Role) {
                resolve(false);
                return;
            }

            const team2Role = Discord.getTeamRoleFromGuildMember(guildMember2);

            if (!team2Role) {
                resolve(false);
                return;
            }

            resolve(team1Role.id === team2Role.id);
        });
    }
}

module.exports = Discord;