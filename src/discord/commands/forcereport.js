const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####                              ####                                #
//  #                                  #   #                               #
//  #       ###   # ##    ###    ###   #   #   ###   # ##    ###   # ##   ####
//  ####   #   #  ##  #  #   #  #   #  ####   #   #  ##  #  #   #  ##  #   #
//  #      #   #  #      #      #####  # #    #####  ##  #  #   #  #       #
//  #      #   #  #      #   #  #      #  #   #      # ##   #   #  #       #  #
//  #       ###   #       ###    ###   #   #   ###   #       ###   #        ##
//                                                   #
//                                                   #
/**
 * A command to force report a match.
 */
class ForceReport {
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
            .addNumberOption((option) => option
                .setName("score1")
                .setDescription("The challenging team's score.")
                .setRequired(true))
            .addNumberOption((option) => option
                .setName("score2")
                .setDescription("The challenged team's score.")
                .setRequired(true))
            .setName("forcereport")
            .setDescription("Forces a match report.")
            .setDefaultMemberPermissions("0");
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
        const member = Discord.findGuildMemberById(user.id),
            challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);
        if (!challenge) {
            await interaction.reply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this command can only be used in a challenge channel.`,
                        color: 0xff0000
                    })
                ],
                ephemeral: true
            });
            return false;
        }

        await interaction.deferReply({ephemeral: false});

        const score1 = interaction.options.getNumber("score1", true),
            score2 = interaction.options.getNumber("score2", true);

        await Validation.memberShouldBeOwner(interaction, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldHaveMap(interaction, challenge, member);
        await Validation.challengeShouldHaveTeamSize(interaction, challenge, member);
        await Validation.challengeShouldBeScheduled(interaction, challenge, member);

        try {
            await challenge.setScore(score1, score2);
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

        const msg = Discord.embedBuilder({
            title: "Match Confirmed",
            fields: [
                {
                    name: "Post the game stats",
                    value: "Remember, OTL matches are only official with pilot statistics from the tracker at https://tracker.otl.gg or from the .ssl file for the game from the server."
                },
                {
                    name: "This channel is now closed",
                    value: "No further match-related commands will be accepted.  If you need to adjust anything in this match, please notify an admin immediately.  This channel will be closed once the stats have been posted."
                }
            ]
        });

        const winningScore = Math.max(challenge.details.challengingTeamScore, challenge.details.challengedTeamScore),
            losingScore = Math.min(challenge.details.challengingTeamScore, challenge.details.challengedTeamScore),
            winningTeam = winningScore === challenge.details.challengingTeamScore ? challenge.challengingTeam : challenge.challengedTeam;

        if (winningScore === losingScore) {
            msg.setDescription(`This match has been confirmed as a **tie**, **${winningScore}** to **${losingScore}**.${challenge.details.adminCreated ? "" : "  Interested in playing another right now?  Use the `/rematch` command!"}`);
        } else {
            msg.setDescription(`This match has been confirmed as a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.${challenge.details.adminCreated ? "" : "  Interested in playing another right now?  Use the `/rematch` command!"}`);
            msg.setColor(winningTeam.role.color);
        }

        await interaction.editReply({
            embeds: [msg]
        });

        return true;
    }
}

module.exports = ForceReport;
