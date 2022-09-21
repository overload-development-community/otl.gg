const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//   ###                  #
//  #   #                 #
//  #       ###    ###   ####
//  #          #  #       #
//  #       ####   ###    #
//  #   #  #   #      #   #  #
//   ###    ####  ####     ##
/**
 * A command that allows a member to cast a match.
 */
class Cast {
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
            .setName("cast")
            .setDescription("Mark yourself as casting a match.");
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

        const twitchName = await Validation.memberShouldHaveTwitchName(interaction, member),
            challenge = await Validation.challengeIdShouldExist(interaction, challengeId, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotHaveCaster(interaction, challenge, member);
        await Validation.challengeShouldBeScheduled(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);

        try {
            await challenge.setCaster(member);
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
                        description: `${member}, you have been recorded as casting the match between **${challenge.challengingTeam.name}** and **${challenge.challengedTeam.name}**.`
                    })
                ]
            });
        } else {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member} has been setup to stream this match at https://twitch.tv/${twitchName}.`
                    })
                ]
            });
        }

        return true;
    }
}

module.exports = Cast;
