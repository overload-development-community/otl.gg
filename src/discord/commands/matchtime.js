const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #   #          #            #      #####    #
//  #   #          #            #        #
//  ## ##   ###   ####    ###   # ##     #     ##    ## #    ###
//  # # #      #   #     #   #  ##  #    #      #    # # #  #   #
//  #   #   ####   #     #      #   #    #      #    # # #  #####
//  #   #  #   #   #  #  #   #  #   #    #      #    # # #  #
//  #   #   ####    ##    ###   #   #    #     ###   #   #   ###
/**
 * A command to get the match time.
 */
class MatchTime {
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
                .setName("challengeid")
                .setDescription("The challenge ID.")
                .setMinValue(1)
                .setRequired(false))
            .setName("matchtime")
            .setDescription("Gets the match time of a challenge.");
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

        const member = Discord.findGuildMemberById(user.id),
            challengeId = interaction.options.getNumber("challengeid", false);

        let challenge;
        if (challengeId) {
            challenge = await Validation.challengeIdShouldExist(interaction, challengeId, member);
        } else {
            challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);

            if (!challenge) {
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but you must include a challenge ID when using this command outside of a challenge channel.`
                        })
                    ]
                });
            }
        }

        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);

        if (challenge.details.matchTime) {
            if (challengeId) {
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `${member}, the match between **${challenge.challengingTeam.name}** and **${challenge.challengedTeam.name}** ${challenge.details.matchTime > new Date() ? "is" : "was"} scheduled to take place <t:${Math.floor(challenge.details.matchTime.getTime() / 1000)}:F>, <t:${Math.floor(challenge.details.matchTime.getTime() / 1000)}:R>.`
                        })
                    ]
                });
            } else {
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `${member}, this match ${challenge.details.matchTime > new Date() ? "is" : "was"} scheduled to take place <t:${Math.floor(challenge.details.matchTime.getTime() / 1000)}:F>, <t:${Math.floor(challenge.details.matchTime.getTime() / 1000)}:R>.`
                        })
                    ]
                });
            }
        } else {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member}, this match has not yet been scheduled.`
                    })
                ]
            });
        }

        return true;
    }
}

module.exports = MatchTime;
