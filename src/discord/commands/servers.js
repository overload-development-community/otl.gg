const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    settings = require("../../../settings");

//   ###
//  #   #
//  #       ###   # ##   #   #   ###   # ##    ###
//   ###   #   #  ##  #  #   #  #   #  ##  #  #
//      #  #####  #       # #   #####  #       ###
//  #   #  #      #       # #   #      #          #
//   ###    ###   #        #     ###   #      ####
/**
 * A command to list available servers.
 */
class Servers {
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
            .setName("servers")
            .setDescription("Lists the available servers on the otl.gg Azure network.");
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
        await interaction.deferReply({ephemeral: false});

        const msg = Discord.embedBuilder({
            title: "Overload Azure Server Status",
            fields: []
        });

        const offline = [],
            online = [];

        Object.keys(settings.servers).sort().forEach((region) => {
            const server = settings.servers[region];

            if (server.started) {
                online.push(region);
            } else {
                offline.push(region);
            }
        });

        if (offline.length > 0) {
            msg.addFields({
                name: "Offline Servers - Use `/start <region>` to start a server.",
                value: offline.map((r) => `${r} - ${settings.servers[r].location}`).join("\n")
            });
        }

        if (online.length > 0) {
            msg.addFields({
                name: "Online Servers",
                value: online.map((r) => `${r} - ${settings.servers[r].ipAddress} - ${settings.servers[r].host} - ${settings.servers[r].location}`).join("\n")
            });
        }

        await interaction.editReply({
            embeds: [msg]
        });
        return true;
    }
}

module.exports = Servers;
