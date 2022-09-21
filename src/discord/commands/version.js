const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    pjson = require("../../../package.json");

//  #   #                         #
//  #   #
//  #   #   ###   # ##    ###    ##     ###   # ##
//   # #   #   #  ##  #  #        #    #   #  ##  #
//   # #   #####  #       ###     #    #   #  #   #
//   # #   #      #          #    #    #   #  #   #
//    #     ###   #      ####    ###    ###   #   #
/**
 * A command that returns version and open source information about the bot.
 */
class Version {
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
            .setName("version")
            .setDescription("Provides development information about the bot.");
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
                    description: `We are The Fourth Sovereign, we are trillions.  By roncli, Version ${pjson.version}.  Project is open source, visit https://github.com/overload-development-community/otl.gg.`
                })
            ]
        });
        return true;
    }
}

module.exports = Version;
