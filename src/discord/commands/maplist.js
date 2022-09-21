const Discord = require("../../discord"),
    DiscordJs = require("discord.js");

//  #   #                #        #            #
//  #   #                #                     #
//  ## ##   ###   # ##   #       ##     ###   ####
//  # # #      #  ##  #  #        #    #       #
//  #   #   ####  ##  #  #        #     ###    #
//  #   #  #   #  # ##   #        #        #   #  #
//  #   #   ####  #      #####   ###   ####     ##
//                #
//                #
/**
 * A command that returns the URL of the OTL map list.
 */
class MapList {
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
            .setName("maplist")
            .setDescription("Provides a link to the OTL's approved map list.");
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
                    description: "View the complete list of maps approved for play at https://otl.gg/maplist."
                })
            ]
        });
        return true;
    }
}

module.exports = MapList;
