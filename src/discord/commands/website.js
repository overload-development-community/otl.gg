const Discord = require("../../discord"),
    DiscordJs = require("discord.js");

//  #   #         #               #     #
//  #   #         #                     #
//  #   #   ###   # ##    ###    ##    ####    ###
//  # # #  #   #  ##  #  #        #     #     #   #
//  # # #  #####  #   #   ###     #     #     #####
//  ## ##  #      ##  #      #    #     #  #  #
//  #   #   ###   # ##   ####    ###     ##    ###
/**
 * A command that returns the URL of the website.
 */
class Help {
    //       ##          #           ##
    //        #          #            #
    //  ###   #     ##   ###    ###   #
    // #  #   #    #  #  #  #  #  #   #
    //  ##    #    #  #  #  #  # ##   #
    // #     ###    ##   ###    # #  ###
    //  ###
    /**
     * Indicates that this is a global command.
     * @returns {boolean} Whether this is a global command.
     */
    static get global() {
        return true;
    }

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
            .setName("website")
            .setDescription("Provides a link to the OTL's website.");
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
     * @returns {Promise<boolean>} A promise that returns whether the interaction was successfully handled.
     */
    static async handle(interaction) {
        await interaction.deferReply({ephemeral: true});

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: "Visit our website at https://otl.gg for league standings, matches, and stats!"
                })
            ]
        });
        return true;
    }
}

module.exports = Help;
