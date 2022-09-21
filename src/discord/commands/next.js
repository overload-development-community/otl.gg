const Challenge = require("../../models/challenge"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Match = require("../../models/match");

//  #   #                 #
//  #   #                 #
//  ##  #   ###   #   #  ####
//  # # #  #   #   # #    #
//  #  ##  #####    #     #
//  #   #  #       # #    #  #
//  #   #   ###   #   #    ##
/**
 * A command to get the next games.
 */
class Next {
    //       ##          #           ##
    //        #          #            #
    //  ###   #     ##   ###    ###   #
    // #  #   #    #  #  #  #  #  #   #
    //  ##    #    #  #  #  #  # ##   #
    // #     ###    ##   ###    # #  ###
    //  ###
    /**
     * Indicates that this is a global command.
     * @returns {boolean} Whether this is a global command.
     */
    static get global() {
        return true;
    }

    //                                        #
    //                                        #
    //  ##    ##   # #   # #    ###  ###    ###
    // #     #  #  ####  ####  #  #  #  #  #  #
    // #     #  #  #  #  #  #  # ##  #  #  #  #
    //  ##    ##   #  #  #  #   # #  #  #   ###
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .setName("next")
            .setDescription("Display the next matches and events in the OTL.");
    }

    // #                    #  ##
    // #                    #   #
    // ###    ###  ###    ###   #     ##
    // #  #  #  #  #  #  #  #   #    # ##
    // #  #  # ##  #  #  #  #   #    ##
    // #  #   # #  #  #   ###  ###    ##
    /**
     * The command handler.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.User} user The user initiating the interaction.
     * @returns {Promise<boolean>} A promise that returns whether the interaction was successfully handled.
     */
    static async handle(interaction, user) {
        await interaction.deferReply({ephemeral: false});

        let matches;
        try {
            matches = await Match.getUpcoming();
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${user}, but there was a server error.  An admin will be notified about this.`,
                        color: 0xff0000
                    })
                ]
            });
            throw err;
        }

        const eventIds = matches.filter((m) => m.discordEventId).map((m) => m.discordEventId);

        let events;
        try {
            events = (await Discord.getUpcomingEvents()).filter((e) => eventIds.indexOf(e.id) === -1 && e.creator.id !== Discord.botId).sort((a, b) => a.scheduledStartAt.getTime() - b.scheduledStartAt.getTime());
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${user}, but there was a server error.  An admin will be notified about this.`,
                        color: 0xff0000
                    })
                ]
            });
            throw err;
        }

        if (matches.length === 0 && events.length === 0) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: "There are no matches or events currently scheduled.",
                        color: 0xff0000
                    })
                ]
            });
            return true;
        }

        const msg = Discord.embedBuilder({
            title: "Overload Teams League Schedule",
            fields: []
        });

        if (matches.length !== 0) {
            for (const [index, match] of matches.entries()) {
                msg.addFields({
                    name: `${index === 0 ? "Upcoming Matches:\n" : ""}${match.challengingTeamName} vs ${match.challengedTeamName}`,
                    value: `**${Challenge.getGameTypeName(match.gameType)}**${match.map ? ` in **${match.map}**` : ""}\nBegins <t:${Math.floor(match.matchTime.getTime() / 1000)}:F>, <t:${Math.floor(match.matchTime.getTime() / 1000)}:R>.\n${match.twitchName ? `Watch online at https://twitch.tv/${match.twitchName}.` : Discord.channelIsOnServer(interaction.channel) ? `Watch online at https://otl.gg/cast/${match.challengeId}, or use \`/cast ${match.challengeId}\` to cast this game.` : `Watch online at https://otl.gg/cast/${match.challengeId}.`}`
                });
            }
        }

        if (events.length !== 0) {
            for (const [index, event] of events.entries()) {
                if (event.scheduledStartAt >= new Date()) {
                    msg.addFields({
                        name: `${index === 0 ? "Upcoming Events:\n" : ""}${event.name}`,
                        value: `Begins <t:${Math.floor(event.scheduledStartAt.getTime() / 1000)}:F>, <t:${Math.floor(event.scheduledStartAt.getTime() / 1000)}:R>.`
                    });
                } else if (event.scheduledEndAt >= new Date()) {
                    msg.addFields({
                        name: `${index === 0 ? "Upcoming Events:\n" : ""}${event.name}`,
                        value: `Currently ongoing until <t:${Math.floor(event.scheduledEndAt.getTime() / 1000)}:F>, ending <t:${Math.floor(event.scheduledEndAt.getTime() / 1000)}:F>.`
                    });
                } else {
                    msg.addFields({
                        name: `${index === 0 ? "Upcoming Events:\n" : ""}${event.name}`,
                        value: "Just recently completed."
                    });
                }
            }
        }

        await interaction.editReply({
            embeds: [msg]
        });

        return true;
    }
}

module.exports = Next;
