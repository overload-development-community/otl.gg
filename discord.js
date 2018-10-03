const DiscordJs = require("discord.js"),

    Commands = require("./commands"),
    Db = require("./database"),
    Exception = require("./exception"),
    Log = require("./log"),
    settings = require("./settings"),

    discord = new DiscordJs.Client(settings.discord),
    messageParse = /^!([^ ]+)(?: +(.*[^ ]))? *$/,
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
 * TODO: Add/remove voice channels when creating/removing a team.
 */
class Discord {
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
        Discord.commands = new Commands();

        discord.addListener("ready", () => {
            Log.log("Connected to Discord.");

            otlGuild = discord.guilds.find((g) => g.name === settings.guild);

            if (!readied) {
                readied = true;
            }

            captainRole = otlGuild.roles.find((r) => r.name === "Captain");
            founderRole = otlGuild.roles.find((r) => r.name === "Founder");

            rosterUpdatesChannel = otlGuild.channels.find((c) => c.name === "roster-updates");
        });

        discord.on("disconnect", (ev) => {
            Log.exception("Disconnected from Discord.", ev);
        });

        discord.addListener("message", (message) => {
            Discord.message(message.author, message.channel, message.content);
        });

        discord.addListener("guildMemberRemoved", async (guildMember) => {
            let team;
            try {
                team = await Db.getTeam(guildMember);
            } catch (err) {
                Log.exception(`There was a database error getting a team for a user.  Please remove ${guildMember.displayName} manually.`, err);
                return;
            }

            if (!team) {
                let requestedTeams;
                try {
                    requestedTeams = await Db.getRequestedOrInvitedTeams(guildMember);
                } catch (err) {
                    Log.exception(`There was a database error getting a user's team invites and requests.  Please remove ${guildMember.displayName} manually.`, err);
                    return;
                }

                requestedTeams.forEach(async (requestedTeam) => {
                    try {
                        await Db.removeUserFromTeam(guildMember, requestedTeam);
                    } catch (err) {
                        Log.exception(`There was a database error removing a user from a team invite or request.  Please remove ${guildMember.displayName} from ${requestedTeam.name} manually.`, err);
                    }

                    await Discord.updateTeam(requestedTeam);
                });

                const channel = otlGuild.channels.find((c) => c.name === `new-team-${guildMember.id}`);
                if (channel) {
                    await Db.cancelCreateTeam(guildMember);
                    await Discord.cancelCreateTeam(guildMember);
                }

                return;
            }

            if (team.isFounder) {
                Log.exception(`${guildMember.displayName} has left the server, but was the founder of ${team.name}.  Please resolve team ownership manually.`);
            }

            const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
            if (!captainChannel) {
                Log.exception(`Captain's channel does not exist for the team.  Please remove ${guildMember.displayName} manually.`);
                return;
            }

            const channelName = `team-${team.tag.toLowerCase().replace(/ /g, "-")}`,
                channel = otlGuild.channels.find((c) => c.name === channelName);
            if (!channel) {
                Log.exception(`Team's channel does not exist.  Please remove ${guildMember.displayName} manually.`);
                return;
            }

            try {
                await Db.removeUserFromTeam(guildMember, team);
            } catch (err) {
                Log.exception(`There was a database error removing ${guildMember.displayName} from ${team.name}.  Please remove ${guildMember.displayName} manually.`, err);
                return;
            }

            await Discord.updateTeam(team);

            try {
                await captainChannel.overwritePermissions(
                    guildMember,
                    {"VIEW_CHANNEL": null},
                    `${guildMember.displayName} left the team.`
                );
            } finally {}

            await Discord.queue(`${guildMember.displayName} has left the team.`, captainChannel);
            await Discord.queue(`${guildMember.displayName} has left the team.`, channel);

            await Discord.richQueue({
                embed: {
                    title: team.name,
                    description: "Pilot Left",
                    color: 0xFF0000,
                    timestamp: new Date(),
                    fields: [
                        {
                            name: "Pilot Left",
                            value: `${guildMember.displayName}`
                        }
                    ],
                    footer: {
                        text: "pilot left server"
                        // "icon_url": Discord.icon
                    }
                }
            }, rosterUpdatesChannel);
        });

        discord.addListener("guildMemberUpdate", async (oldGuildMember, newGuildMember) => {
            if (oldGuildMember.displayName === newGuildMember.displayName) {
                return;
            }

            try {
                await Db.updateName(newGuildMember);
            } catch (err) {
                Log.exception(`There was a database error changing ${oldGuildMember.displayName}'s name to ${newGuildMember.displayName}.  Please change this manually.`, err);
                return;
            }

            const teamRole = Discord.getTeamRoleFromGuildMember(newGuildMember);

            if (!teamRole) {
                let requestedTeams;
                try {
                    requestedTeams = await Db.getRequestedOrInvitedTeams(newGuildMember);
                } catch (err) {
                    Log.exception(`There was a database error getting a user's team invites and requests.  Please update ${newGuildMember.displayName} manually.`, err);
                    return;
                }

                requestedTeams.forEach(async (requestedTeam) => {
                    await Discord.updateTeam(requestedTeam);
                });
                return;
            }

            const teamName = Discord.getTeamNameFromTeamRole(teamRole);

            if (!teamName) {
                return;
            }

            await Discord.richQueue({
                embed: {
                    title: teamName,
                    description: "Pilot Name Change",
                    color: 0xFFFF00,
                    timestamp: new Date(),
                    fields: [
                        {
                            name: "Old Name",
                            value: `${oldGuildMember.displayName}`,
                            inline: true
                        },
                        {
                            name: "New Name",
                            value: `${newGuildMember.displayName}`,
                            inline: true
                        }
                    ],
                    footer: {
                        text: "pilot changed name"
                        // "icon_url": Discord.icon
                    }
                }
            }, rosterUpdatesChannel);

            Discord.updateUserTeam(newGuildMember);
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
     * @param {Channel} channel The channel the message was sent on.
     * @param {string} text The text of the message.
     * @returns {void}
     */
    static async message(user, channel, text) {
        if (!messageParse.test(text)) {
            return;
        }

        const {1: command, 2: message} = messageParse.exec(text);
        if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(command) !== -1) {
            let success;
            try {
                success = await Discord.commands[command](user, channel, message);
            } catch (err) {
                if (err instanceof Exception) {
                    if (err.innerError) {
                        Log.exception(err.message, err.innerError);
                    } else {
                        Log.warning(`${user}: ${text}\n${err}`);
                    }
                } else {
                    Log.exception(void 0, err);
                }
            }

            if (success) {
                Log.log(`${user}: ${text}`);
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
     * @returns {Promise<Message|undefined>} A promise that resolves with the sent message.
     */
    static async queue(message, channel) {
        let msg;

        if (channel.id === discord.user.id) {
            return void 0;
        }

        try {
            msg = await channel.send(
                "",
                {
                    embed: {
                        description: message,
                        timestamp: new Date(),
                        color: 0x16F6F8
                        // footer: {"icon_url": Discord.icon}
                    }
                }
            );
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
     * @param {object} message The message to be sent.
     * @param {Channel} channel The channel to send the message to.
     * @returns {Promise<Message|undefined>} A promise that resolves with the sent message.
     */
    static async richQueue(message, channel) {
        if (channel.id === discord.user.id) {
            return void 0;
        }

        if (message.embed && message.embed.fields) {
            message.embed.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                }
            });
        }

        let msg;
        try {
            msg = await channel.send("", message);
        } finally {}
        return msg;
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
        return otlGuild.members.find((m) => m.id === id);
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
        return otlGuild.members.find((m) => m.displayName === displayName);
    }

    //   #    #             #  #  #                     ###         ###      #
    //  # #                 #  #  #                     #  #         #       #
    //  #    ##    ###    ###  #  #   ###    ##   ###   ###   #  #   #     ###
    // ###    #    #  #  #  #  #  #  ##     # ##  #  #  #  #  #  #   #    #  #
    //  #     #    #  #  #  #  #  #    ##   ##    #     #  #   # #   #    #  #
    //  #    ###   #  #   ###   ##   ###     ##   #     ###     #   ###    ###
    //                                                         #
    /**
     * Returns the Discord user by their Discord ID.
     * @param {string} id The ID of the Discord user.
     * @returns {Promise<User>} A promise that resolves with the user.
     */
    static findUserById(id) {
        return discord.fetchUser(id, true);
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
        return otlGuild.channels.find((c) => c.name === name);
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

    //              #    ###                     #  #                    ####                    ###                     ###         ##
    //              #     #                      ## #                    #                        #                      #  #         #
    //  ###   ##   ###    #     ##    ###  # #   ## #   ###  # #    ##   ###   ###    ##   # #    #     ##    ###  # #   #  #   ##    #     ##
    // #  #  # ##   #     #    # ##  #  #  ####  # ##  #  #  ####  # ##  #     #  #  #  #  ####   #    # ##  #  #  ####  ###   #  #   #    # ##
    //  ##   ##     #     #    ##    # ##  #  #  # ##  # ##  #  #  ##    #     #     #  #  #  #   #    ##    # ##  #  #  # #   #  #   #    ##
    // #      ##     ##   #     ##    # #  #  #  #  #   # #  #  #   ##   #     #      ##   #  #   #     ##    # #  #  #  #  #   ##   ###    ##
    //  ###
    /**
     * Gets the team name from the team role.
     * @param {Role} role The team role.
     * @returns {string} The name of the team.
     */
    static getTeamNameFromTeamRole(role) {
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
    static async updateTeam(team) {
        try {
            const teamTag = team.tag,
                captainChannelName = `captains-${teamTag.toLowerCase().replace(/ /g, "-")}`,
                captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
            if (!captainChannel) {
                Log.exception(`Captain's channel does not exist for the team.  Please update ${team.name} manually.`);
                return;
            }

            const channelName = `team-${teamTag.toLowerCase().replace(/ /g, "-")}`,
                channel = otlGuild.channels.find((c) => c.name === channelName);
            if (!channel) {
                Log.exception(`Team's channel does not exist.  Please update ${team.name} manually.`);
                return;
            }

            let teamInfo;
            try {
                teamInfo = await Db.getTeamInfo(team);
            } catch (err) {
                Log.exception(`There was a database error retrieving team information for ${team.name}.  Please update ${team.name} manually.`, err);
                return;
            }

            let topic = `${team.name}\nhttp://overloadteamsleague.org/team/${team.tag}\n\nRoster:`;

            teamInfo.members.forEach((member) => {
                topic += `\n${member.name}`;
                if (member.role) {
                    topic += ` - ${member.role}`;
                }
            });

            let channelTopic = topic,
                captainChannelTopic = topic;

            if (teamInfo.homes && teamInfo.homes.length > 0) {
                channelTopic += "\n\nHome Maps:";
                teamInfo.homes.forEach((home) => {
                    channelTopic += `\n${home}`;
                });
            }

            if (teamInfo.upcomingMatches && teamInfo.upcomingMatches.length > 0) {
                channelTopic += "\n\nUpcoming matches:";
                teamInfo.upcomingMatches.forEach((match) => {
                    channelTopic += `\n${match.opponent} - ${match.date.toLocaleTimeString("en-us", {timeZone: "GMT", hour12: true, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short"})}`;
                    if (match.map) {
                        channelTopic += ` - ${match.map}`;
                    }
                });
            }

            if (teamInfo.recentMatches && teamInfo.recentMatches.length > 0) {
                channelTopic += "\n\nRecentMatches:";
                teamInfo.recentMatches.forEach((match) => {
                    channelTopic += `\n${match.result} - ${match.score}-${match.opponentScore} - ${match.opponent} - ${match.map}`;
                });
            }

            if (teamInfo.requests && teamInfo.requests.length > 0) {
                captainChannelTopic += "\n\nRequests:";
                teamInfo.requests.forEach((request) => {
                    captainChannelTopic += `\n${request.name} - ${request.date.toLocaleTimeString("en-us", {timeZone: "GMT", hour12: true, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short"})}`;
                });
            }

            if (teamInfo.invites && teamInfo.invites.length > 0) {
                captainChannelTopic += "\n\nInvites:";
                teamInfo.invites.forEach((invite) => {
                    captainChannelTopic += `\n${invite.name} - ${invite.date.toLocaleTimeString("en-us", {timeZone: "GMT", hour12: true, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short"})}`;
                });
            }

            await channel.setTopic(channelTopic, "Team topic update requested.");
            channel.topic = channelTopic;
            await captainChannel.setTopic(captainChannelTopic, "Team topic update requested.");
            captainChannel.topic = captainChannelTopic;
        } catch (err) {
            Log.exception(`There was an error updating team information for ${team.name}.  Please update ${team.name} manually.`, err);
        }
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
    static async updateUserTeam(user) {
        let team;
        try {
            team = await Db.getTeam(user);
        } catch (err) {
            Log.exception("There was a database error getting a team for a user.", err);
            return;
        }

        if (team) {
            await Discord.updateTeam(team);
        }
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
    static async addCaptain(user, captain) {
        const guildMember = otlGuild.member(user);

        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const guildCaptain = otlGuild.member(captain);

        if (!guildCaptain) {
            throw new Exception("Captain does not exist on server.");
        }

        if (!founderRole.members.find((m) => m.id === guildMember.id)) {
            throw new Exception("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Exception("User is not on a team.");
        }

        if (!teamRole.members.find((m) => m.id === guildCaptain.id)) {
            throw new Exception("Users are not on the same team.");
        }

        const team = await Db.getTeam(user);
        if (!team) {
            throw new Exception("User is not on a team.");
        }

        const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (!captainChannel) {
            throw new Exception("Captain's channel does not exist for the team.");
        }

        const channelName = `team-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find((c) => c.name === channelName);
        if (!channel) {
            throw new Exception("Team's channel does not exist.");
        }

        await guildCaptain.addRole(captainRole, `${guildMember.displayName} added ${guildCaptain.displayName} as a captain of ${team.name}.`);

        await captainChannel.overwritePermissions(
            guildCaptain,
            {"VIEW_CHANNEL": true},
            `${guildMember.displayName} added ${guildCaptain.displayName} as a captain of ${team.name}.`
        );

        Discord.updateUserTeam(user);

        await Discord.queue(`${guildCaptain}, you have been added as a captain of **${team.name}**!  You now have access to your team's captain's channel, ${captainChannel}.  Be sure to read the pinned messages in that channel for more information as to what you can do for your team as a captain.`, captain);
        await Discord.queue(`@everyone Welcome **${guildCaptain}** as the newest team captain!`, captainChannel);
        await Discord.queue(`**${guildCaptain}** is now a team captain!`, channel);
        await Discord.richQueue({
            embed: {
                title: team.name,
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
                    text: `added by ${guildMember.displayName}`
                    // "icon_url": Discord.icon
                }
            }
        }, rosterUpdatesChannel);
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
    static async addUserToTeam(user, team) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const teamRole = otlGuild.roles.find((r) => r.name === `Team: ${team.name}`);
        if (!teamRole) {
            throw new Exception("Team does not exist.");
        }

        const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (!captainChannel) {
            throw new Exception("Captain's channel does not exist for the team.");
        }

        const channelName = `team-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find((c) => c.name === channelName);
        if (!channel) {
            throw new Exception("Team's channel does not exist.");
        }

        await guildMember.addRole(teamRole, `${guildMember.displayName} accepted their invitation to ${team.name}.`);

        Discord.updateUserTeam(user);

        await Discord.queue(`${guildMember}, you are now a member of **${team.name}**!  You now have access to your team's channel, ${channel}.`, user);
        await Discord.queue(`@everyone **${guildMember}** has accepted your invitation to join the team!`, captainChannel);
        await Discord.queue(`**${guildMember}** has joined the team!`, channel);
        await Discord.richQueue({
            embed: {
                title: team.name,
                description: "Pilot Added",
                color: 0x00FF00,
                timestamp: new Date(),
                fields: [
                    {
                        name: "Pilot Added",
                        value: `${guildMember}`
                    }
                ],
                footer: {
                    text: "added by accepted invitation"
                    // "icon_url": Discord.icon
                }
            }
        }, rosterUpdatesChannel);
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
    static async applyHomeMap(user, number, map) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const team = await Db.getTeam(user);
        if (!team) {
            throw new Exception("User is not on a team.");
        }

        if (!captainRole.members.find((m) => m.id === user.id) && !founderRole.members.find((m) => m.id === user.id)) {
            throw new Exception("User is not a captain or a founder.");
        }

        const teamTag = team.tag,
            channelName = `team-${teamTag.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find((c) => c.name === channelName);
        if (!channel) {
            throw new Exception("Guild channel does not exist for the team.");
        }

        Discord.updateUserTeam(user);

        await Discord.queue(`${guildMember} has changed home map number ${number} to ${map}.`, channel);
    }

    //                   ##          ###                     #  #                     ##            #  ###
    //                    #           #                      ## #                    #  #           #   #
    //  ###  ###   ###    #    #  #   #     ##    ###  # #   ## #   ###  # #    ##   #  #  ###    ###   #     ###   ###
    // #  #  #  #  #  #   #    #  #   #    # ##  #  #  ####  # ##  #  #  ####  # ##  ####  #  #  #  #   #    #  #  #  #
    // # ##  #  #  #  #   #     # #   #    ##    # ##  #  #  # ##  # ##  #  #  ##    #  #  #  #  #  #   #    # ##   ##
    //  # #  ###   ###   ###     #    #     ##    # #  #  #  #  #   # #  #  #   ##   #  #  #  #   ###   #     # #  #
    //       #     #            #                                                                                   ###
    /**
     * Applies the team name and tag to a team being created.
     * @param {User} user The user applying the team tag.
     * @param {string} name The team name to apply.
     * @param {string} tag The team tag to apply.
     * @returns {Promise} A promise that resolves when the team name and tag have been applied.
     */
    static async applyTeamNameAndTag(user, name, tag) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const channel = otlGuild.channels.find((c) => c.name === `new-team-${user.id}`);
        if (!channel) {
            throw new Exception("Channel does not exist.");
        }

        const topic = `Team Name: ${name || "(unset)"}\r\nTeam Tag: ${tag || "unset"}`;
        await channel.setTopic(topic, `${guildMember.displayName} updated the team info.`);
        channel.topic = topic;
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
    static async cancelCreateTeam(user) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const channel = otlGuild.channels.find((c) => c.name === `new-team-${user.id}`);
        if (!channel) {
            throw new Exception("Channel does not exist.");
        }

        await channel.delete(`${guildMember.displayName} cancelled team creation.`);
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
     * @returns {number} The number of captains on the user's team.
     */
    static captainCountOnUserTeam(user) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Exception("User is not on a team.");
        }

        return teamRole.members.filter((tm) => captainRole.members.find((cm) => cm.id === tm.id)).size;
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
    static async changeTeamColor(user, color) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Exception("User is not on a team.");
        }

        if (!founderRole.members.find((m) => m.id === user.id)) {
            throw new Exception("User is not a founder.");
        }

        await teamRole.setColor(color, `${guildMember.displayName} updated the team color.`);
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
     * @param {bool} [reinstating] Whether the team is being reinstated rather than created.
     * @returns {Promise<{guildChannel: GuildChannel, captianChannel: GuildChannel}>} A promise that resolves with the new channels created for the team.
     */
    static async createTeam(user, name, tag, reinstating) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const currentTeamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (currentTeamRole) {
            throw new Exception("User is already on a team.");
        }

        const existingRole = otlGuild.roles.find((r) => r.name === `Team: ${name}`);
        if (existingRole) {
            throw new Exception("Team role already exists.");
        }

        const existingCategory = otlGuild.channels.find((c) => c.name === name);
        if (existingCategory) {
            throw new Exception("Team category already exists.");
        }

        const channelName = `team-${tag.toLowerCase().replace(/ /g, "-")}`,
            existingChannel = otlGuild.channels.find((c) => c.name === channelName);
        if (existingChannel) {
            throw new Exception("Team channel already exists.");
        }

        const captainChannelName = `captains-${tag.toLowerCase().replace(/ /g, "-")}`,
            existingCaptainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (existingCaptainChannel) {
            throw new Exception("Captain channel already exists.");
        }

        const teamRole = await otlGuild.createRole({
            name: `Team: ${name}`,
            mentionable: false
        }, `${guildMember.displayName} created the team ${name}.`);

        await guildMember.addRole(founderRole, `${guildMember.displayName} created the team ${name}.`);

        await guildMember.addRole(teamRole, `${guildMember.displayName} created the team ${name}.`);

        const category = await otlGuild.createChannel(name, "category", [
            {
                id: otlGuild.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: teamRole.id,
                allow: ["VIEW_CHANNEL"]
            }
        ], `${guildMember.displayName} created the team ${name}.`);

        const guildChannel = await otlGuild.createChannel(`team-${tag}`, "text", [
            {
                id: otlGuild.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: teamRole.id,
                allow: ["VIEW_CHANNEL"]
            }
        ], `${guildMember.displayName} created the team ${name}.`);

        await guildChannel.setParent(category);

        const captainChannel = await otlGuild.createChannel(`captains-${tag}`, "text", [
            {
                id: otlGuild.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: user.id,
                allow: ["VIEW_CHANNEL"]
            }
        ], `${guildMember.displayName} created the team ${name}.`);

        await captainChannel.setParent(category);

        await Discord.richQueue({
            embed: {
                title: `${name} (${tag})`,
                description: reinstating ? "Team Reinstating" : "New Team",
                color: 0x0000FF,
                timestamp: new Date(),
                fields: [
                    {
                        name: "Founder Added",
                        value: `${guildMember}`
                    }
                ],
                footer: {
                    text: `created by ${guildMember.displayName}`
                    // "icon_url": Discord.icon
                }
            }
        }, rosterUpdatesChannel);

        const msg1 = await Discord.richQueue({
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
        }, captainChannel);

        if (msg1) {
            await msg1.pin();
        }

        const msg2 = await Discord.richQueue({
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
        }, captainChannel);

        if (msg2) {
            await msg2.pin();
        }

        const newChannel = otlGuild.channels.find((c) => c.name === `new-team-${user.id}`);
        if (newChannel) {
            await newChannel.delete(`${guildMember.displayName} created the team ${name}.`);
        }

        return {guildChannel, captainChannel};
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
     * @param {object} team The team to disband.
     * @returns {Promise} A promise that resolves when the team is disbanded.
     */
    static async disbandTeam(user, team) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        if (!founderRole.members.find((m) => m.id === guildMember.id)) {
            throw new Exception("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Exception("User is not on a team.");
        }

        const channelName = `team-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find((c) => c.name === channelName);
        if (!channel) {
            throw new Exception("Team channel does not exists.");
        }

        const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (!captainChannel) {
            throw new Exception("Captain channel does not exists.");
        }

        const category = otlGuild.channels.find((c) => c.name === team.name);
        if (!category) {
            throw new Exception("Team category does not exists.");
        }

        await channel.delete(`${guildMember.displayName} disbanded ${team.name}.`);
        await captainChannel.delete(`${guildMember.displayName} disbanded ${team.name}.`);
        await category.delete(`${guildMember.displayName} disbanded ${team.name}.`);

        const memberList = [];

        for (const memberPair of teamRole.members) {
            const member = memberPair[1];

            memberList.push(`${member}`);

            if (captainRole.members.find((m) => m.id === member.id)) {
                await member.removeRole(captainRole, `${guildMember.displayName} disbanded ${team.name}.`);
            }

            if (founderRole.members.find((m) => m.id === member.id)) {
                await member.removeRole(founderRole, `${guildMember.displayName} disbanded ${team.name}.`);
            }

            await Discord.queue(`Your team ${team.name} has been disbanded.`, member);
        }

        await teamRole.delete(`${guildMember.displayName} disbanded ${team.name}.`);

        await Discord.richQueue({
            embed: {
                title: `${team.name}`,
                description: "Team Disbanded",
                color: 0xFF00FF,
                timestamp: new Date(),
                fields: [
                    {
                        name: "Pilots Removed",
                        value: `${memberList.join(", ")}`
                    }
                ],
                footer: {
                    text: `disbanded by ${guildMember.displayName}`
                    // "icon_url": Discord.icon
                }
            }
        }, rosterUpdatesChannel);
    }

    //  #                 #     #          ###    #    ##           #    ###         ###
    //                          #          #  #         #           #     #           #
    // ##    ###   # #   ##    ###    ##   #  #  ##     #     ##   ###    #     ##    #     ##    ###  # #
    //  #    #  #  # #    #     #    # ##  ###    #     #    #  #   #     #    #  #   #    # ##  #  #  ####
    //  #    #  #  # #    #     #    ##    #      #     #    #  #   #     #    #  #   #    ##    # ##  #  #
    // ###   #  #   #    ###     ##   ##   #     ###   ###    ##     ##   #     ##    #     ##    # #  #  #
    /**
     * Invites a pilot to a team.
     * @param {User} user The user inviting the pilot.
     * @param {User} pilot The pilot being invited.
     * @returns {Promise} A promise that resolves when the pilot has been invited.
     */
    static async invitePilotToTeam(user, pilot) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const pilotMember = otlGuild.member(pilot);
        if (!pilotMember) {
            throw new Exception("Pilot does not exist on server.");
        }

        if (!founderRole.members.find((m) => m.id === guildMember.id) && !captainRole.members.find((m) => m.id === guildMember.id)) {
            throw new Exception("User is not a founder or captain.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Exception("User is not on a team.");
        }

        const teamName = Discord.getTeamNameFromTeamRole(teamRole);
        await Discord.queue(`${pilot.displayName}, you have been invited to join **${teamName}** by ${user.displayName}.  You can accept this invitation by responding with \`!accept ${teamName}\`.`, pilot);

        Discord.updateUserTeam(user);
    }

    //             #           ####                       #
    //             #           #                          #
    // # #    ###  # #    ##   ###    ##   #  #  ###    ###   ##   ###
    // ####  #  #  ##    # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  # ##  # #   ##    #     #  #  #  #  #  #  #  #  ##    #
    // #  #   # #  #  #   ##   #      ##    ###  #  #   ###   ##   #
    /**
     * Transfers the team's founder from one pilot to another.
     * @param {User} user The user who is the current founder.
     * @param {User} pilot The user becoming the founder.
     * @returns {Promise} A promise that resolves when the founder has been transferred.
     */
    static async makeFounder(user, pilot) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const guildPilot = otlGuild.member(pilot);
        if (!guildPilot) {
            throw new Exception("Pilot does not exist on server.");
        }

        if (!founderRole.members.find((m) => m.id === guildMember.id)) {
            throw new Exception("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Exception("User is not on a team.");
        }

        if (!teamRole.members.find((m) => m.id === guildPilot.id)) {
            throw new Exception("Users are not on the same team.");
        }

        const team = await Db.getTeam(user);
        if (!team) {
            throw new Exception("User is not on a team.");
        }

        const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (!captainChannel) {
            throw new Exception("Captain's channel does not exist for the team.");
        }

        const channelName = `team-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find((c) => c.name === channelName);
        if (!channel) {
            throw new Exception("Team's channel does not exist.");
        }

        await guildMember.removeRole(founderRole, `${guildMember.displayName} transferred founder of team ${team.name} to ${guildPilot.displayName}.`);
        await guildMember.addRole(captainRole, `${guildMember.displayName} transferred founder of team ${team.name} to ${guildPilot.displayName}.`);

        await guildPilot.addRole(founderRole, `${guildMember.displayName} transferred founder of team ${team.name} to ${guildPilot.displayName}.`);
        await guildPilot.removeRole(captainRole, `${guildMember.displayName} transferred founder of team ${team.name} to ${guildPilot.displayName}.`);

        await captainChannel.overwritePermissions(
            guildPilot,
            {"VIEW_CHANNEL": true},
            `${guildMember.displayName} made ${guildPilot.displayName} the founder of ${team.name}.`
        );

        Discord.updateUserTeam(user);

        await Discord.queue(`${guildPilot}, you are now the founder of **${team.name}**!`, guildPilot);
        await Discord.queue(`${guildPilot.displayName} is now the team founder!`, captainChannel);
        await Discord.queue(`${guildPilot.displayName} is now the team founder!`, channel);
        await Discord.richQueue({
            embed: {
                title: team.name,
                description: "Leadership Update",
                color: 0x800000,
                timestamp: new Date(),
                fields: [
                    {
                        name: "Old Founder",
                        value: `${guildMember}`,
                        inline: true
                    },
                    {
                        name: "New Founder",
                        value: `${guildPilot}`,
                        inline: true
                    }
                ],
                footer: {
                    text: `changed by ${guildMember.displayName}`
                    // "icon_url": Discord.icon
                }
            }
        }, rosterUpdatesChannel);
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
     * @returns {Promise<{guildChannel: GuildChannel, captianChannel: GuildChannel}>} A promise that resolves with the new channels created for the team.
     */
    static reinstateTeam(user, team) {
        return Discord.createTeam(user, team.name, team.tag, true);
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
    static async removeCaptain(user, captain) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const guildCaptain = otlGuild.member(captain);
        if (!guildCaptain) {
            throw new Exception("Captain does not exist on server.");
        }

        if (!founderRole.members.find((m) => m.id === guildMember.id)) {
            throw new Exception("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Exception("User is not on a team.");
        }

        if (!teamRole.members.find((m) => m.id === guildCaptain.id)) {
            throw new Exception("Users are not on the same team.");
        }

        const team = await Db.getTeam(user);
        if (!team) {
            throw new Exception("User is not on a team.");
        }

        const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (!captainChannel) {
            throw new Exception("Captain's channel does not exist for the team.");
        }

        const channelName = `team-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find((c) => c.name === channelName);
        if (!channel) {
            throw new Exception("Team's channel does not exist.");
        }

        await guildCaptain.removeRole(captainRole, `${guildMember.displayName} removed ${guildCaptain.displayName} as a captain.`);

        await captainChannel.overwritePermissions(
            guildCaptain,
            {"VIEW_CHANNEL": null},
            `${guildMember.displayName} removed ${guildCaptain.displayName} as a captain.`
        );

        Discord.updateUserTeam(user);

        await Discord.queue(`${guildCaptain}, you are no longer a captain of **${team.name}**.`, captain);
        await Discord.queue(`${guildCaptain.displayName} is no longer a team captain.`, captainChannel);
        await Discord.queue(`${guildCaptain.displayName} is no longer a team captain.`, channel);
        await Discord.richQueue({
            embed: {
                title: team.name,
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
                    text: `removed by ${guildMember.displayName}`
                    // "icon_url": Discord.icon
                }
            }
        }, rosterUpdatesChannel);
    }

    //                                     ###    #    ##           #
    //                                     #  #         #           #
    // ###    ##   # #    ##   # #    ##   #  #  ##     #     ##   ###
    // #  #  # ##  ####  #  #  # #   # ##  ###    #     #    #  #   #
    // #     ##    #  #  #  #  # #   ##    #      #     #    #  #   #
    // #      ##   #  #   ##    #     ##   #     ###   ###    ##     ##
    /**
     * Removes a pilot from a team, whether they are a pilot on the team, someone who has been invited, or someone who has requested to join.
     * @param {User} user The user removing the pilot.
     * @param {User} pilot The pilot to remove.
     * @returns {Promise} A promise that resolves when the pilot has been removed.
     */
    static async removePilot(user, pilot) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const guildPilot = otlGuild.member(pilot);
        if (!guildPilot) {
            throw new Exception("Pilot does not exist on server.");
        }

        if (!founderRole.members.find((m) => m.id === guildMember.id)) {
            throw new Exception("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Exception("User is not on a team.");
        }

        const team = await Db.getTeam(user);
        if (!team) {
            throw new Exception("User is not on a team.");
        }

        const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (!captainChannel) {
            throw new Exception("Captain's channel does not exist for the team.");
        }

        const channelName = `team-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find((c) => c.name === channelName);
        if (!channel) {
            throw new Exception("Team's channel does not exist.");
        }

        if (teamRole.members.find((m) => m.id === guildPilot.id)) {
            await guildPilot.removeRole(captainRole, `${guildMember.displayName} removed ${guildPilot.displayName} from the team.`);

            await captainChannel.overwritePermissions(
                guildPilot,
                {"VIEW_CHANNEL": null},
                `${guildMember.displayName} removed ${guildPilot.displayName} from the team.`
            );

            await guildPilot.removeRole(teamRole, `${guildMember.displayName} removed ${guildPilot.displayName} from the team.`);

            await Discord.queue(`${guildPilot}, you have been removed from **${team.name}** by ${guildMember.displayName}.`, pilot);
            await Discord.queue(`${guildPilot.displayName} has been removed from the team by ${guildMember.displayName}.`, captainChannel);
            await Discord.queue(`${guildPilot.displayName} has been removed from the team by ${guildMember.displayName}.`, channel);

            await Discord.richQueue({
                embed: {
                    title: team.name,
                    description: "Pilot Removed",
                    color: 0xFF0000,
                    timestamp: new Date(),
                    fields: [
                        {
                            name: "Pilot Removed",
                            value: `${guildPilot}`
                        }
                    ],
                    footer: {
                        text: `removed by ${guildMember.displayName}`
                        // "icon_url": Discord.icon
                    }
                }
            }, rosterUpdatesChannel);
        } else {
            await Discord.queue(`${guildMember.displayName} declined to invite ${guildPilot.displayName}.`, captainChannel);
        }

        Discord.updateUserTeam(user);
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
    static async removeUserFromTeam(user, team) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const teamRole = otlGuild.roles.find((r) => r.name === `Team: ${team.name}`);
        if (!teamRole) {
            throw new Exception("Team does not exist.");
        }

        const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (!captainChannel) {
            throw new Exception("Captain's channel does not exist for the team.");
        }

        const channelName = `team-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find((c) => c.name === channelName);
        if (!channel) {
            throw new Exception("Team's channel does not exist.");
        }

        await guildMember.removeRole(captainRole, `${guildMember.displayName} left the team.`);

        await captainChannel.overwritePermissions(
            guildMember,
            {"VIEW_CHANNEL": null},
            `${guildMember.displayName} left the team.`
        );

        await guildMember.removeRole(teamRole, `${guildMember.displayName} left the team.`);

        await Discord.queue(`${guildMember.displayName} has left the team.`, captainChannel);
        await Discord.queue(`${guildMember.displayName} has left the team.`, channel);

        await Discord.richQueue({
            embed: {
                title: team.name,
                description: "Pilot Left",
                color: 0xFF0000,
                timestamp: new Date(),
                fields: [
                    {
                        name: "Pilot Left",
                        value: `${guildMember}`
                    }
                ],
                footer: {
                    text: "pilot left team"
                    // "icon_url": Discord.icon
                }
            }
        }, rosterUpdatesChannel);
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
    static async requestTeam(user, team) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const teamRole = otlGuild.roles.find((r) => r.name === `Team: ${team.name}`);
        if (!teamRole) {
            throw new Exception("Team does not exist.");
        }

        const captainChannelName = `captains-${team.tag.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find((c) => c.name === captainChannelName);
        if (!captainChannel) {
            throw new Exception("Captain's channel does not exist for the team.");
        }

        await Discord.queue(`@everyone, ${guildMember.displayName} has requested to join the team.`, captainChannel);

        await Discord.updateTeam(team);
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
     * @returns {Promise<GuildChannel>} A promise that resolves with the new channel created for the user.
     */
    static async startCreateTeam(user) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Exception("User does not exist on server.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (teamRole) {
            throw new Exception("User is already on a team.");
        }

        const channelName = `new-team-${user.id}`,
            existingChannel = otlGuild.channels.find((c) => c.name === channelName);
        if (existingChannel) {
            throw new Exception("Channel already exists.");
        }

        const channel = await otlGuild.createChannel(channelName, "text", [
            {
                id: otlGuild.id,
                deny: ["VIEW_CHANNEL"]
            }, {
                id: user.id,
                allow: ["VIEW_CHANNEL"]
            }
        ], `${guildMember.displayName} has started the process of creating a team.`);

        await channel.setTopic("Team Name: (unset)\r\nTeam Tag: (unset)", `${guildMember.displayName} has started the process of creating a team.`);
        channel.topic = "Team Name: (unset)\r\nTeam Tag: (unset)";

        const msg = await Discord.richQueue({
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
        }, channel);

        if (msg) {
            await msg.pin();
        }

        return channel;
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
     * @returns {boolean} A promise that resolves with whether the team name exists.
     */
    static teamNameExists(name) {
        return !!otlGuild.roles.find((r) => r.name === `Team: ${name}`);
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
     * @returns {boolean} A promise that resolves with whether the user is a captain or a founder.
     */
    static userIsCaptainOrFounder(user) {
        return !!founderRole.members.find((m) => m.id === user.id) || !!captainRole.members.find((m) => m.id === user.id);
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
     * @returns {boolean} A promise that resolves with whether the user is a founder.
     */
    static userIsFounder(user) {
        return !!founderRole.members.find((m) => m.id === user.id);
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
     * @returns {boolean} Whether the user is starting a team.
     */
    static userIsStartingTeam(user) {
        return !!otlGuild.channels.find((c) => c.name === `new-team-${user.id}`);
    }

    //                           ##    #                 #     #                ###                      ##   #                             ##
    //                          #  #   #                 #                       #                      #  #  #                              #
    // #  #   ###    ##   ###    #    ###    ###  ###   ###   ##    ###    ###   #     ##    ###  # #   #     ###    ###  ###   ###    ##    #
    // #  #  ##     # ##  #  #    #    #    #  #  #  #   #     #    #  #  #  #   #    # ##  #  #  ####  #     #  #  #  #  #  #  #  #  # ##   #
    // #  #    ##   ##    #     #  #   #    # ##  #      #     #    #  #   ##    #    ##    # ##  #  #  #  #  #  #  # ##  #  #  #  #  ##     #
    //  ###  ###     ##   #      ##     ##   # #  #       ##  ###   #  #  #      #     ##    # #  #  #   ##   #  #   # #  #  #  #  #   ##   ###
    //                                                                     ###
    /**
     * Retrieves the user's starting team channel, if they have one.
     * @param {User} user The user to check.
     * @returns {GuildChannel|undefined} The user's starting team channel, or undefined if they have none.
     */
    static userStartingTeamChannel(user) {
        return otlGuild.channels.find((c) => c.name === `new-team-${user.id}`);
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
     * @throws {Error} An error is thrown when user1 or user2 does not exist on the server.
     */
    static usersAreOnTheSameTeam(user1, user2) {
        const guildMember1 = otlGuild.member(user1);
        if (!guildMember1) {
            throw new Exception("User 1 does not exist on server.");
        }

        const guildMember2 = otlGuild.member(user2);
        if (!guildMember2) {
            throw new Exception("User 2 does not exist on server.");
        }

        const team1Role = Discord.getTeamRoleFromGuildMember(guildMember1);
        if (!team1Role) {
            return false;
        }

        const team2Role = Discord.getTeamRoleFromGuildMember(guildMember2);
        if (!team2Role) {
            return false;
        }

        return team1Role.id === team2Role.id;
    }
}

module.exports = Discord;
