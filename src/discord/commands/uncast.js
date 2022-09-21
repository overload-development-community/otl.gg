const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #   #                               #
//  #   #                               #
//  #   #  # ##    ###    ###    ###   ####
//  #   #  ##  #  #   #      #  #       #
//  #   #  #   #  #       ####   ###    #
//  #   #  #   #  #   #  #   #      #   #  #
//   ###   #   #   ###    ####  ####     ##
/**
 * A command that allows a member to uncast a match.
 */
class Uncast {
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
            .setName("uncast")
            .setDescription("Mark yourself as not casting a match.");
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

        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotHaveCaster(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldHaveCaster(interaction, challenge, member);
        await Validation.memberShouldBeCaster(interaction, challenge, member);

        try {
            await challenge.unsetCaster(member);
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

        if (challenge.channel) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member}, you are no longer scheduled to cast this match, and have been removed from ${challenge.channel}.`
                    })
                ]
            });
        } else {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member}, you are no longer scheduled to cast this match.`
                    })
                ]
            });
        }

        return true;
    }
}

module.exports = Uncast;
