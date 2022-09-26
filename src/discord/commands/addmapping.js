const Challenge = require("../../models/challenge"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//    #        #      #  #   #                         #
//   # #       #      #  #   #
//  #   #   ## #   ## #  ## ##   ###   # ##   # ##    ##    # ##    ## #
//  #   #  #  ##  #  ##  # # #      #  ##  #  ##  #    #    ##  #  #  #
//  #####  #   #  #   #  #   #   ####  ##  #  ##  #    #    #   #   ##
//  #   #  #  ##  #  ##  #   #  #   #  # ##   # ##     #    #   #  #
//  #   #   ## #   ## #  #   #   ####  #      #       ###   #   #   ###
//                                     #      #                    #   #
//                                     #      #                     ###
/**
 * A command to add a pilot to user mapping.
 */
class AddMapping {
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
                .setName("name")
                .setDescription("The name of the pilot.")
                .setRequired(true))
            .addUserOption((option) => option
                .setName("pilot")
                .setDescription("The pilot.")
                .setRequired(true))
            .setName("addmapping")
            .setDescription("Adds a pilot to user mapping.")
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
        await interaction.deferReply({ephemeral: true});

        const member = Discord.findGuildMemberById(user.id),
            name = interaction.options.getString("name", true),
            pilot = interaction.options.getUser("pilot", true);

        await Validation.memberShouldBeOwner(interaction, member);

        try {
            await Challenge.addMapping(name, pilot);
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
                    description: `${member}, **${name}** has been mapped to ${pilot}.`
                })
            ]
        });

        return true;
    }
}

module.exports = AddMapping;
