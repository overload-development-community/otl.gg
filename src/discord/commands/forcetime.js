const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####                              #####    #
//  #                                    #
//  #       ###   # ##    ###    ###     #     ##    ## #    ###
//  ####   #   #  ##  #  #   #  #   #    #      #    # # #  #   #
//  #      #   #  #      #      #####    #      #    # # #  #####
//  #      #   #  #      #   #  #        #      #    # # #  #
//  #       ###   #       ###    ###     #     ###   #   #   ###
/**
 * A command to force the time.
 */
class ForceTime {
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
                .setName("datetime")
                .setDescription("The date and time.")
                .setRequired(true))
            .setName("forcetime")
            .setDescription("Forces a time for a challenge.")
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

        const datetime = interaction.options.getString("datetime", true);

        await Validation.memberShouldBeOwner(interaction, member);
        const date = await Validation.dateShouldBeValid(interaction, datetime, member);

        try {
            await challenge.setTime(date);
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
                    description: `${member} has set the time for this match.`,
                    fields: [{name: "Local Time", value: `<t:${Math.floor(date.getTime() / 1000)}:F>`}]
                })
            ]
        });

        return true;
    }
}

module.exports = ForceTime;
