const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #   #             #
//  #   #             #
//  #   #   ###    ## #
//   # #   #   #  #  ##
//   # #   #   #  #   #
//   # #   #   #  #  ##
//    #     ###    ## #
/**
 * A command to set a VOD.
 */
class Vod {
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
                .setRequired(true))
            .addStringOption((option) => option
                .setName("url")
                .setDescription("The URL of the VOD.")
                .setRequired(true))
            .setName("vod")
            .setDescription("Add a VOD for a match you casted.");
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
        await interaction.deferReply({ephemeral: true});

        const member = Discord.findGuildMemberById(user.id),
            challengeId = interaction.options.getNumber("challengeid", true);

        const url = await Validation.urlShouldBeValid(interaction, member),
            challenge = await Validation.challengeIdShouldExist(interaction, challengeId, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldBeConfirmed(interaction, challenge, member);
        await Validation.challengeShouldHaveCaster(interaction, challenge, member);
        await Validation.memberShouldBeCaster(interaction, challenge, member);

        try {
            await challenge.setVoD(url);
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
                    description: `${member}, you have been recorded as casting the match between **${challenge.challengingTeam.name}** and **${challenge.challengedTeam.name}**.`
                })
            ]
        });

        return true;
    }
}

module.exports = Vod;
