const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####                     #   ##      #
//   #  #                    #    #
//   #  #   ###    ###    ## #    #     ##    # ##    ###
//   #  #  #   #      #  #  ##    #      #    ##  #  #   #
//   #  #  #####   ####  #   #    #      #    #   #  #####
//   #  #  #      #   #  #  ##    #      #    #   #  #
//  ####    ###    ####   ## #   ###    ###   #   #   ###
/**
 * A command to get the deadline for a challenge.
 */
class Deadline {
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
            .setName("deadline")
            .setDescription("Gets the deadline of a clocked challenge.");
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
            return false;
        }

        await interaction.deferReply({ephemeral: false});

        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldBeOnTheClock(interaction, challenge, member);

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member}, the clock deadline ${challenge.details.dateClockDeadline > new Date() ? "expires" : "expired"} <t:${Math.floor(challenge.details.dateClockDeadline.getTime() / 1000)}:F>, <t:${Math.floor(challenge.details.dateClockDeadline.getTime() / 1000)}:R>.`
                })
            ]
        });

        return true;
    }
}

module.exports = Deadline;
