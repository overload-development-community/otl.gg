const Discord = require("../../discord"),
    DiscordJs = require("discord.js");

//  #   #          ##
//  #   #           #
//  #   #   ###     #    # ##
//  #####  #   #    #    ##  #
//  #   #  #####    #    ##  #
//  #   #  #        #    # ##
//  #   #   ###    ###   #
//                       #
//                       #
/**
 * A command that returns a URL containing information about using the bot.
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
            .setName("help")
            .setDescription("Provides a URL to get help with the bot.");
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
                    description: "See the about page at https://otl.gg/about."
                })
            ]
        });
        return true;
    }
}

module.exports = Help;
