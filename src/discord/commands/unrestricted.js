const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #   #                               #              #            #                #
//  #   #                               #                           #                #
//  #   #  # ##   # ##    ###    ###   ####   # ##    ##     ###   ####    ###    ## #
//  #   #  ##  #  ##  #  #   #  #       #     ##  #    #    #   #   #     #   #  #  ##
//  #   #  #   #  #      #####   ###    #     #        #    #       #     #####  #   #
//  #   #  #   #  #      #          #   #  #  #        #    #   #   #  #  #      #  ##
//   ###   #   #  #       ###   ####     ##   #       ###    ###     ##    ###    ## #
/**
 * A command that makes a match restricted.
 */
class Unrestricted {
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
            .setName("unrestricted")
            .setDescription("Unrestricts a match.")
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

        await interaction.deferReply({ephemeral: true});

        await Validation.memberShouldBeOwner(interaction, member);

        try {
            await challenge.setRestricted(false);
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
                    description: "This match is now set as unrestricted, both teams' full rosters may play in this match."
                })
            ]
        });

        return true;
    }
}

module.exports = Unrestricted;
