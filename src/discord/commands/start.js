const Azure = require("../../azure"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    settings = require("../../../settings"),
    Validation = require("../validation"),

    commandSemaphore = new Semaphore(1);

//   ###    #                    #
//  #   #   #                    #
//  #      ####    ###   # ##   ####
//   ###    #         #  ##  #   #
//      #   #      ####  #       #
//  #   #   #  #  #   #  #       #  #
//   ###     ##    ####  #        ##
/**
 * A command to start a server.
 */
class Start {
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
            .setName("start")
            .setDescription("Starts a server on the otl.gg Azure network.");
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

        return commandSemaphore.callFunction(async () => {
            const checkServer = interaction.options.getString("server", true).toLowerCase();

            const server = await Validation.serverShouldExist(interaction, checkServer, user);
            await Validation.serverShouldNotBeRunning(interaction, checkServer, server, user);

            try {
                await Azure.start(server);
            } catch (err) {
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${user}, but there was a server error.  An admin will be notified about this.`,
                            color: 0xff0000
                        })
                    ]
                });
                throw err;
            }

            Azure.setup(server, checkServer, interaction.channel);

            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${user}, the ${checkServer} server has been started at **${server.ipAddress}** (${server.host}) and should be available in a couple of minutes.  The server will automatically shut down when idle for 15 minutes.  Use the \`/extend ${checkServer}\` command to reset the idle shutdown timer and move notifications about this server to a new channel.`
                    })
                ]
            });
            return true;
        });
    }
}

module.exports = Start;
