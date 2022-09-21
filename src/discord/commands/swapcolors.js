const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//   ###                         ###           ##
//  #   #                       #   #           #
//  #      #   #   ###   # ##   #       ###     #     ###   # ##    ###
//   ###   #   #      #  ##  #  #      #   #    #    #   #  ##  #  #
//      #  # # #   ####  ##  #  #      #   #    #    #   #  #       ###
//  #   #  # # #  #   #  # ##   #   #  #   #    #    #   #  #          #
//   ###    # #    ####  #       ###    ###    ###    ###   #      ####
//                       #
//                       #
/**
 * A command that swaps colors in a match.
 */
class SwapColors {
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
            .setName("swapcolors")
            .setDescription("Swaps the colors for a game.")
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
            return false;
        }

        await interaction.deferReply({ephemeral: true});

        await Validation.memberShouldBeOwner(interaction, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);

        try {
            await challenge.swapColors();
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

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member} has swapped the colors for this match.  **${challenge.details.blueTeam.name}** is now blue/team 1, and **${challenge.details.orangeTeam.name}** is now orange/team 2.`
                })
            ]
        });

        return true;
    }
}

module.exports = SwapColors;
