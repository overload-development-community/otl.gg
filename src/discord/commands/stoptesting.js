const Discord = require("../../discord"),
    DiscordJs = require("discord.js");

//   ###    #                   #####                 #       #
//  #   #   #                     #                   #
//  #      ####    ###   # ##     #     ###    ###   ####    ##    # ##    ## #
//   ###    #     #   #  ##  #    #    #   #  #       #       #    ##  #  #  #
//      #   #     #   #  ##  #    #    #####   ###    #       #    #   #   ##
//  #   #   #  #  #   #  # ##     #    #          #   #  #    #    #   #  #
//   ###     ##    ###   #        #     ###   ####     ##    ###   #   #   ###
//                       #                                                #   #
//                       #                                                 ###
/**
 * A command to add yourself to the testers role.
 */
class StopTesting {
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
            .setName("stoptesting")
            .setDescription("Remove yourself from the @Testers role.");
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

        const member = Discord.findGuildMemberById(user.id);

        try {
            await member.roles.remove(Discord.testersRole);
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
                    description: `${member}, you have been removed from the ${Discord.testersRole} role.  Use \`/testing\` to add yourself back to this role.`
                })
            ]
        });
        return true;
    }
}

module.exports = StopTesting;
