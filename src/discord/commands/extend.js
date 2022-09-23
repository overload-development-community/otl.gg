const Azure = require("../../azure"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    settings = require("../../../settings"),
    Validation = require("../validation"),

    commandSemaphore = new Semaphore(1);

//  #####          #                       #
//  #              #                       #
//  #      #   #  ####    ###   # ##    ## #
//  ####    # #    #     #   #  ##  #  #  ##
//  #        #     #     #####  #   #  #   #
//  #       # #    #  #  #      #   #  #  ##
//  #####  #   #    ##    ###   #   #   ## #
/**
 * A command to extend a server.
 */
class Extend {
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
            .addStringOption((option) => option
                .setName("server")
                .setDescription("The name of the server.")
                .addChoices(...Object.keys(settings.servers).map((server) => ({name: server, value: server})))
                .setRequired(true))
            .setName("extend")
            .setDescription("Extends the uptime of a server on the otl.gg Azure network.");
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
    static handle(interaction, user) {
        return commandSemaphore.callFunction(async () => {
            await interaction.deferReply({ephemeral: false});

            const checkServer = interaction.options.getString("server", true).toLowerCase();

            const server = await Validation.serverShouldExist(interaction, checkServer, user);
            await Validation.serverShouldBeRunning(interaction, server, user);

            Azure.setup(server, checkServer, interaction.channel);

            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${user}, the ${checkServer} server has been extended at **${server.ipAddress}** (${server.host}).  The server will automatically shut down when idle for 15 minutes.`
                    })
                ]
            });
            return true;
        });
    }
}

module.exports = Extend;
