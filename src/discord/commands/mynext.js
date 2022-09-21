const Challenge = require("../../models/challenge"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Match = require("../../models/match"),
    Validation = require("../validation");

//  #   #         #   #                 #
//  #   #         #   #                 #
//  ## ##  #   #  ##  #   ###   #   #  ####
//  # # #  #   #  # # #  #   #   # #    #
//  #   #  #  ##  #  ##  #####    #     #
//  #   #   ## #  #   #  #       # #    #  #
//  #   #      #  #   #   ###   #   #    ##
//         #   #
//          ###
/**
 * A command to get the next games for your team.
 */
class MyNext {
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
            .setName("mynext")
            .setDescription("Display your team's next matches.");
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

        const member = Discord.findGuildMemberById(user.id);

        const team = await Validation.memberShouldBeOnATeam(interaction, member);

        let matches;
        try {
            matches = (await Match.getUpcoming()).filter((m) => m.challengingTeamTag === team.tag || m.challengedTeamTag === team.tag);
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but there was a server error.  An admin will be notified about this.`,
                        color: 0xff0000
                    })
                ]
            });
            throw err;
        }

        if (matches.length === 0) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: "There are no matches currently scheduled for your team.",
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
                    name: `${index === 0 ? `Upcoming Matches for **${team.name}**:\n` : ""}${match.challengingTeamName} vs ${match.challengedTeamName}`,
                    value: `**${Challenge.getGameTypeName(match.gameType)}**${match.map ? ` in **${match.map}**` : ""}\nBegins <t:${Math.floor(match.matchTime.getTime() / 1000)}:F>, <t:${Math.floor(match.matchTime.getTime() / 1000)}:R>.\n${match.twitchName ? `Watch online at https://twitch.tv/${match.twitchName}.` : `Watch online at https://otl.gg/cast/${match.challengeId}, or use \`/cast ${match.challengeId}\` to cast this game.`}`
                });
            }
        }

        await interaction.editReply({
            embeds: [msg]
        });

        return true;
    }
}

module.exports = MyNext;
