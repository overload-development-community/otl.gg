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
    otlGuild;

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
        channel.send(
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

        channel.send("", message);
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

            const captainChannelName = `captains-${Discord.getTeamFromTeamRole(teamRole).toLowerCase().repalce(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            guildCaptain.addRole(captainRole, `${guildMember.displayName} added ${guildCaptain.displayName} as a captain.`).then(() => {
                captainChannel.overwritePermissions(guildCaptain, [
                    {
                        id: guildCaptain.id,
                        allow: ["VIEW_CHANNEL"]
                    }
                ], `${guildMember.displayName} added ${guildCaptain.displayName} as a captain.`).then(resolve).catch(reject);
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

            guildMember.addRole(teamRole, `${guildMember.displayName} accepted their invitation to ${team.name}.`).then(resolve).catch(reject);
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
                                captainChannel.setParent(category).then(resolve).catch(reject);
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
                        const queue = new Queue();

                        teamRole.members.forEach((member) => {
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
                        });

                        queue.push(() => teamRole.delete(`${guildMember.displayName} disbanded ${name}.`));

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

            const captainChannelName = `captains-${Discord.getTeamFromTeamRole(teamRole).toLowerCase().repalce(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            guildCaptain.removeRole(captainRole, `${guildMember.displayName} removed ${guildCaptain.displayName} as a captain.`).then(() => {
                captainChannel.overwritePermissions(guildCaptain, [
                    {
                        id: guildCaptain.id,
                        deny: ["VIEW_CHANNEL"]
                    }
                ], `${guildMember.displayName} removed ${guildCaptain.displayName} as a captain.`).then(resolve).catch(reject);
            }).catch(reject);
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

            const captainChannelName = `captains-${Discord.getTeamFromTeamRole(teamRole).toLowerCase().repalce(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find("name", captainChannelName);

            if (!captainChannel) {
                reject(new Error("Captain's channel does not exist for the team."));
                return;
            }

            guildMember.removeRole(captainRole, `${guildMember.displayName} left the team.`).then(() => {
                captainChannel.overwritePermissions(guildMember, [
                    {
                        id: guildMember.id,
                        deny: ["VIEW_CHANNEL"]
                    }
                ], `${guildMember.displayName} left the team.`).then(() => {
                    guildMember.removeRole(teamRole, `${guildMember.displayName} left the team.`).then(resolve).catch(reject);
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

            if (teamRole.members.find("id", guildPlayer.id)) {
                const captainChannelName = `captains-${Discord.getTeamFromTeamRole(teamRole).toLowerCase().repalce(/ /g, "-")}`,
                    captainChannel = otlGuild.channels.find("name", captainChannelName);

                if (!captainChannel) {
                    reject(new Error("Captain's channel does not exist for the team."));
                    return;
                }

                guildPlayer.removeRole(captainRole, `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`).then(() => {
                    captainChannel.overwritePermissions(guildPlayer, [
                        {
                            id: guildPlayer.id,
                            deny: ["VIEW_CHANNEL"]
                        }
                    ], `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`).then(() => {
                        guildPlayer.removeRole(teamRole, `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`).then(() => {
                            resolve();
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            } else {
                resolve();
            }

            Discord.updateUserTeam(user);
        });
    }

    /*
    static requestTeam(user, team)
    static startCreateTeam(user)
    static teamNameExists(name)
    static userIsCaptainOrFounder(user)
    static userIsFounder(user)
    static userIsStartingTeam(user)
    static usersAreOnTheSameTeam(user1, user2)
    */
}

module.exports = Discord;
