const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####    #     #      ##
//    #            #       #
//    #     ##    ####     #     ###
//    #      #     #       #    #   #
//    #      #     #       #    #####
//    #      #     #  #    #    #
//    #     ###     ##    ###    ###
/**
 * A command that sets the title of a match.
 */
class Title {
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
            .addStringOption((option) => option
                .setName("title")
                .setDescription("The title of the game.")
                .setMaxLength(100)
                .setRequired(false))
            .setName("title")
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

        const title = interaction.options.getString("title", false);

        await Validation.memberShouldBeOwner(interaction, member);

        try {
            await challenge.title(title);
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

        if (title) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member}, the title of this match has been updated to **${title}**.`
                    })
                ]
            });
        } else {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member}, the title of this match has been unset.`
                    })
                ]
            });
        }

        return true;
    }
}

module.exports = Title;
