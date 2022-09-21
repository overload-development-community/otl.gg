const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #   #          #      ###    #                                   #
//  #   #          #     #   #   #
//  ##  #   ###   ####   #      ####   # ##    ###    ###   ## #    ##    # ##    ## #
//  # # #  #   #   #      ###    #     ##  #  #   #      #  # # #    #    ##  #  #  #
//  #  ##  #   #   #         #   #     #      #####   ####  # # #    #    #   #   ##
//  #   #  #   #   #  #  #   #   #  #  #      #      #   #  # # #    #    #   #  #
//  #   #   ###     ##    ###     ##   #       ###    ####  #   #   ###   #   #   ###
//                                                                               #   #
//                                                                                ###
/**
 * A command to set that you a pilot is not streaming their match.
 */
class NotStreaming {
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
            .setName("notstreaming")
            .setDescription("Mark yourself as not streaming a match.");
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

        const team = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.teamShouldBeInChallenge(interaction, team, challenge, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);

        try {
            await challenge.removeStreamer(member);
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
                    description: `${member} is no longer streaming this match.`
                })
            ]
        });

        return true;
    }
}

module.exports = NotStreaming;
