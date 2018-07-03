const DiscordJs = require("discord.js"),

    Commands = require("./commands"),
    Db = require("./database"),
    Log = require("./log"),
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
    static async message(user, text) {
        const matches = messageParse.exec(text);

        if (matches) {
            if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(matches[1]) !== -1) {
                let success;
                try {
                    success = await Discord.commands[matches[1]](user, matches[2]);
                } catch (err) {
                    if (err.innerError) {
                        Log.exception(err.message, err.innerError);
                    } else {
                        Log.warning(err);
                    }
                }

                if (success) {
                    Log.log(`${user}: ${text}`);
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
     * @param {Channel} channel The channel to send the message to.
     * @returns {Promise} A promise that resolves when the message is sent.
     */
    static async queue(message, channel) {
        try {
            await channel.send(
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
        } finally {}
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
    static async richQueue(message, channel) {
        if (message.embed && message.embed.fields) {
            message.embed.fields.forEach((field) => {
                if (field.value && field.value.length > 1024) {
                    field.value = field.value.substring(0, 1024);
                    console.log(message);
                }
            });
        }

        try {
            await channel.send("", message);
        } finally {}
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
    static async updateTeam(team) {
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
    static async updateUserTeam(user) {
        let team;
        try {
            team = Db.getTeam(user);
        } catch (err) {
            Log.exception("There was a database error getting a team for a user.", err);
        }

        if (team) {
            try {
                await Discord.updateTeam(team);
            } catch (err) {
                Log.exception("There was an error while updating a team.", err);
            }
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
            throw new Error("User does not exist on server.");
        }

        const guildCaptain = otlGuild.member(captain);

        if (!guildCaptain) {
            throw new Error("Captain does not exist on server.");
        }

        if (!founderRole.members.find("id", guildMember.id)) {
            throw new Error("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is not on a team.");
        }

        if (!teamRole.members.find("id", guildCaptain.id)) {
            throw new Error("Users are not on the same team.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole),
            captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find("name", channelName);
        if (!channel) {
            throw new Error("Team's channel does not exist.");
        }

        await guildCaptain.addRole(captainRole, `${guildMember.displayName} added ${guildCaptain.displayName} as a captain of ${teamName}.`);

        await captainChannel.overwritePermissions(guildCaptain, [
            {
                id: guildCaptain.id,
                allow: ["VIEW_CHANNEL"]
            }
        ], `${guildMember.displayName} added ${guildCaptain.displayName} as a captain of ${teamName}.`);

        Discord.updateUserTeam(user);

        await Discord.queue(`${guildCaptain}, you have been added as a captain of **${teamName}**!  You now have access to your team's captain's channel, #${captainChannelName}.  Be sure to read the pinned messages in that channel for more information as to what you can do for your team as a captain.`, captain);
        await Discord.queue(`@everyone Welcome **${guildCaptain}** as the newest team captain!`, captainChannel);
        await Discord.queue(`**${guildCaptain}** is now a team captain!`, channel);
        await Discord.richQueue({
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
            throw new Error("User does not exist on server.");
        }

        const teamRole = otlGuild.roles.find("name", `Team: ${team.name}`);
        if (!teamRole) {
            throw new Error("Team does not exist.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole),
            captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find("name", channelName);
        if (!channel) {
            throw new Error("Team's channel does not exist.");
        }

        await guildMember.addRole(teamRole, `${guildMember.displayName} accepted their invitation to ${team.name}.`);

        Discord.updateUserTeam(user);

        await Discord.queue(`${guildMember}, you are now a member of **${teamName}**!  You now have access to your team's channel, #${channelName}.`, user);
        await Discord.queue(`@everyone **${guildMember}** has accepted your invitation to join the team!`, captainChannel);
        await Discord.queue(`**${guildMember}** has joined the team!`, channel);
        await Discord.richQueue({
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
            throw new Error("User does not exist on server.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is not on a team.");
        }

        if (!captainRole.members.find("id", user.id) && !founderRole.members.find("id", user.id)) {
            throw new Error("User is not a captain or a founder.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole),
            captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        Discord.updateUserTeam(user);

        await Discord.queue(`${guildMember} has changed home map number ${number} to ${map}.`, captainChannel);
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
    static async applyTeamName(user, name) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const channel = otlGuild.channels.find("name", `new-team-${user.id}`);
        if (!channel) {
            throw new Error("Channel does not exist.");
        }

        const {2: tag} = newTeamTopicParse.exec(channel.topic);

        await channel.setTopic(`Team Name: ${name}\r\nTeam Tag: ${tag || "(unset)"}`, `${guildMember.displayName} updated the team name.`);
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
    static async applyTeamTag(user, tag) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const channel = otlGuild.channels.find("name", `new-team-${user.id}`);
        if (!channel) {
            throw new Error("Channel does not exist.");
        }

        const {1: name} = newTeamTopicParse.exec(channel.topic);
        await channel.setTopic(`Team Name: ${name || "(unset)"}\r\nTeam Tag: ${tag}`, `${guildMember.displayName} updated the tag name.`);
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
            throw new Error("User does not exist on server.");
        }

        const channel = otlGuild.channels.find("name", `new-team-${user.id}`);
        if (!channel) {
            throw new Error("Channel does not exist.");
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
            throw new Error("User does not exist on server.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is not on a team.");
        }

        return teamRole.members.filter((m) => captainRole.members.find("id", m.id)).length;
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
            throw new Error("User does not exist on server.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is not on a team.");
        }

        if (!founderRole.members.find("id", user.id)) {
            throw new Error("User is not a founder.");
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
     * @returns {Promise} A promise that resolves when the team is created.
     */
    static async createTeam(user, name, tag) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const currentTeamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (currentTeamRole) {
            throw new Error("User is already on a team.");
        }

        const existingRole = otlGuild.roles.find("name", `Team: ${name}`);
        if (existingRole) {
            throw new Error("Team role already exists.");
        }

        const existingCategory = otlGuild.channels.find("name", name);
        if (existingCategory) {
            throw new Error("Team category already exists.");
        }

        const channelName = `team-${name.toLowerCase().replace(/ /g, "-")}`,
            existingChannel = otlGuild.channels.find("name", channelName);
        if (existingChannel) {
            throw new Error("Team channel already exists.");
        }

        const captainChannelName = `captains-${name.toLowerCase().replace(/ /g, "-")}`,
            existingCaptainChannel = otlGuild.channels.find("name", captainChannelName);
        if (existingCaptainChannel) {
            throw new Error("Captain channel already exists.");
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

        const channel = await otlGuild.createChannel(name, "text", [], `${guildMember.displayName} created the team ${name}.`);

        await channel.setParent(category);

        const captainChannel = await otlGuild.createChannel(name, "text", [
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
        ], `${guildMember.displayName} created the team ${name}.`);

        await captainChannel.setParent(category);

        await Discord.richQueue({
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

        await msg1.pin();

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

        await msg2.pin();

        const newChannel = otlGuild.channels.find("name", `new-team-${user.id}`);
        if (newChannel) {
            await newChannel.delete(`${guildMember.displayName} created the team ${name}.`);
        }
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
    static async disbandTeam(user) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        if (!founderRole.members.find("id", guildMember.id)) {
            throw new Error("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is already on a team.");
        }

        const name = Discord.getTeamFromTeamRole(teamRole),
            channelName = `team-${name.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find("name", channelName);

        if (!channel) {
            throw new Error("Team channel does not exists.");
        }

        const captainChannelName = `captains-${name.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain channel does not exists.");
        }

        const category = otlGuild.channels.find("name", name);
        if (!category) {
            throw new Error("Team category does not exists.");
        }

        await channel.delete(`${guildMember.displayName} disbanded ${name}.`);
        await captainChannel.delete(`${guildMember.displayName} disbanded ${name}.`);
        await category.delete(`${guildMember.displayName} disbanded ${name}.`);

        const memberList = [];

        teamRole.members.forEach(async (member) => {
            memberList.push(`${member}`);

            if (captainRole.members.find("id", member.id)) {
                await member.removeRole(captainRole, `${guildMember.displayName} disbanded ${name}.`);
            }

            if (founderRole.members.find("id", member.id)) {
                await member.removeRole(founderRole, `${guildMember.displayName} disbanded ${name}.`);
            }

            await Discord.queue(`Your team ${name} has been disbanded.`, member);
        });

        await teamRole.delete(`${guildMember.displayName} disbanded ${name}.`);

        await Discord.richQueue({
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
        }, rosterUpdatesChannel);
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
    static async invitePlayerToTeam(user, player) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const playerMember = otlGuild.member(player);
        if (!playerMember) {
            throw new Error("Player does not exist on server.");
        }

        if (!founderRole.members.find("id", guildMember.id) && !captainRole.members.find("id", guildMember.id)) {
            throw new Error("User is not a founder or captain.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is not on a team.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole);
        await Discord.queue(`${player.displayName}, you have been invited to join **${teamName}** by ${user.displayName}.  You can accept this invitation by responding with \`!accept ${teamName}\`.`, player);

        Discord.updateUserTeam(user);
    }

    //             #           ####                       #
    //             #           #                          #
    // # #    ###  # #    ##   ###    ##   #  #  ###    ###   ##   ###
    // ####  #  #  ##    # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  # ##  # #   ##    #     #  #  #  #  #  #  #  #  ##    #
    // #  #   # #  #  #   ##   #      ##    ###  #  #   ###   ##   #
    /**
     * Transfers the team's founder from one player to another.
     * @param {User} user The user who is the current founder.
     * @param {User} player The user becoming the founder.
     * @returns {Promise} A promise that resolves when the founder has been transferred.
     */
    static async makeFounder(user, player) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const guildPlayer = otlGuild.member(player);
        if (!guildPlayer) {
            throw new Error("Player does not exist on server.");
        }

        if (!founderRole.members.find("id", guildMember.id)) {
            throw new Error("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is not on a team.");
        }

        if (!teamRole.members.find("id", guildPlayer.id)) {
            throw new Error("Users are not on the same team.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole),
            captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find("name", channelName);
        if (!channel) {
            throw new Error("Team's channel does not exist.");
        }

        await guildMember.removeRole(founderRole, `${guildMember.displayName} transferred founder of team ${teamName} to ${guildPlayer.displayName}.`);
        await guildMember.addRole(captainRole, `${guildMember.displayName} transferred founder of team ${teamName} to ${guildPlayer.displayName}.`);

        await guildPlayer.addRole(founderRole, `${guildMember.displayName} transferred founder of team ${teamName} to ${guildPlayer.displayName}.`);
        await guildPlayer.removeRole(captainRole, `${guildMember.displayName} transferred founder of team ${teamName} to ${guildPlayer.displayName}.`);

        await Discord.queue(`${guildPlayer}, you are now the founder of **${teamName}**!`, guildPlayer);
        await Discord.queue(`${guildPlayer.displayName} is now the team founder!`, captainChannel);
        await Discord.queue(`${guildPlayer.displayName} is now the team founder!`, channel);
        await Discord.richQueue({
            embed: {
                title: teamName,
                description: "Leadership Update",
                color: 0x800000,
                timestamp: new Date(),
                fields: [
                    {
                        name: "Old Founder",
                        value: `${guildMember}`
                    },
                    {
                        name: "New Founder",
                        value: `${guildPlayer}`
                    }
                ],
                footer: {
                    text: `changed by ${guildMember.displayName}`,
                    icon_url: Discord.icon // eslint-disable-line camelcase
                }
            }
        }, rosterUpdatesChannel);
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
     * @returns {[bool, string, string]} Returns whether the user is ready to create their team, the team name, and the team tag.
     */
    static readyToCreateTeam(user) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const channel = otlGuild.channels.find("name", `new-team-${user.id}`);
        if (!channel) {
            throw new Error("Channel does not exist.");
        }

        const {1: team, 2: tag} = newTeamTopicParse.exec(channel.topic);
        if (team && team !== "(unset)" && tag && tag !== "(unset)") {
            return [true, team, tag];
        }

        return [false];
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
    static async removeCaptain(user, captain) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const guildCaptain = otlGuild.member(captain);
        if (!guildCaptain) {
            throw new Error("Captain does not exist on server.");
        }

        if (!founderRole.members.find("id", guildMember.id)) {
            throw new Error("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is not on a team.");
        }

        if (!teamRole.members.find("id", guildCaptain.id)) {
            throw new Error("Users are not on the same team.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole),
            captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find("name", channelName);
        if (!channel) {
            throw new Error("Team's channel does not exist.");
        }

        await guildCaptain.removeRole(captainRole, `${guildMember.displayName} removed ${guildCaptain.displayName} as a captain.`);

        await captainChannel.overwritePermissions(guildCaptain, [
            {
                id: guildCaptain.id,
                deny: ["VIEW_CHANNEL"]
            }
        ], `${guildMember.displayName} removed ${guildCaptain.displayName} as a captain.`);

        await Discord.queue(`${guildCaptain}, you are no longer a captain of **${teamName}**.`, captain);
        await Discord.queue(`${guildCaptain.displayName} is no longer a team captain.`, captainChannel);
        await Discord.queue(`${guildCaptain.displayName} is no longer a team captain.`, channel);
        await Discord.richQueue({
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
    static async removePlayer(user, player) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const guildPlayer = otlGuild.member(player);
        if (!guildPlayer) {
            throw new Error("Player does not exist on server.");
        }

        if (!founderRole.members.find("id", guildMember.id)) {
            throw new Error("User is not a founder.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (!teamRole) {
            throw new Error("User is not on a team.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole),
            captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find("name", channelName);
        if (!channel) {
            throw new Error("Team's channel does not exist.");
        }

        if (teamRole.members.find("id", guildPlayer.id)) {
            await guildPlayer.removeRole(captainRole, `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`);

            await captainChannel.overwritePermissions(guildPlayer, [
                {
                    id: guildPlayer.id,
                    deny: ["VIEW_CHANNEL"]
                }
            ], `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`);

            await guildPlayer.removeRole(teamRole, `${guildMember.displayName} removed ${guildPlayer.displayName} from the team.`);

            await Discord.queue(`${guildPlayer}, you have been removed from **${teamName}** by ${guildMember.displayName}.`, player);
            await Discord.queue(`${guildPlayer.displayName} has been removed from the team by ${guildMember.displayName}.`, captainChannel);
            await Discord.queue(`${guildPlayer.displayName} has been removed from the team by ${guildMember.displayName}.`, channel);

            await Discord.richQueue({
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
        } else {
            await Discord.queue(`${guildPlayer.displayName} declined to invite ${guildMember.displayName}.`, captainChannel);
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
            throw new Error("User does not exist on server.");
        }

        const teamRole = otlGuild.roles.find("name", `Team: ${team.name}`);
        if (!teamRole) {
            throw new Error("Team does not exist.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole),
            captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        const channelName = `${teamName.toLowerCase().replace(/ /g, "-")}`,
            channel = otlGuild.channels.find("name", channelName);
        if (!channel) {
            throw new Error("Team's channel does not exist.");
        }

        await guildMember.removeRole(captainRole, `${guildMember.displayName} left the team.`);

        await captainChannel.overwritePermissions(guildMember, [
            {
                id: guildMember.id,
                deny: ["VIEW_CHANNEL"]
            }
        ], `${guildMember.displayName} left the team.`);

        await guildMember.removeRole(teamRole, `${guildMember.displayName} left the team.`);

        await Discord.queue(`${guildMember.displayName} has left the team.`, captainChannel);
        await Discord.queue(`${guildMember.displayName} has left the team.`, channel);

        await Discord.richQueue({
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
            throw new Error("User does not exist on server.");
        }

        const teamRole = otlGuild.roles.find("name", `Team: ${team.name}`);
        if (!teamRole) {
            throw new Error("Team does not exist.");
        }

        const teamName = Discord.getTeamFromTeamRole(teamRole),
            captainChannelName = `captains-${teamName.toLowerCase().replace(/ /g, "-")}`,
            captainChannel = otlGuild.channels.find("name", captainChannelName);
        if (!captainChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        await Discord.queue(`@everyone, ${guildMember.displayName} has requested to join the team.`, captainChannel);

        Discord.updateTeam(team);
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
    static async startCreateTeam(user) {
        const guildMember = otlGuild.member(user);
        if (!guildMember) {
            throw new Error("User does not exist on server.");
        }

        const teamRole = Discord.getTeamRoleFromGuildMember(guildMember);
        if (teamRole) {
            throw new Error("User is already on a team.");
        }

        const channelName = `new-team-${user.id}`,
            existingChannel = otlGuild.channels.find("name", channelName);
        if (existingChannel) {
            throw new Error("Channel already exists.");
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

        await channel.setTopic("Team Name: (Unset)\r\nTeam Tag: (unset)", `${guildMember.displayName} has started the process of creating a team.`);

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

        await msg.pin();
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
        return !!otlGuild.roles.find("name", `Team: ${name}`);
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
        return !!founderRole.members.find("id", user.id) || !!captainRole.members.find("id", user.id);
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
        return !!founderRole.members.find("id", user.id);
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
     * @returns {boolean} A promise that resolves with whether the user is starting a team.
     */
    static userIsStartingTeam(user) {
        return !!otlGuild.channels.find(`new-user-${user.id}`);
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
            throw new Error("User 1 does not exist on server.");
        }

        const guildMember2 = otlGuild.member(user2);
        if (!guildMember2) {
            throw new Error("User 2 does not exist on server.");
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
