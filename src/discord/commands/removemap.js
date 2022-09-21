const Challenge = require("../../models/challenge"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Map = require("../../models/map"),
    Validation = require("../validation");

//  ####                                      #   #
//  #   #                                     #   #
//  #   #   ###   ## #    ###   #   #   ###   ## ##   ###   # ##
//  ####   #   #  # # #  #   #  #   #  #   #  # # #      #  ##  #
//  # #    #####  # # #  #   #   # #   #####  #   #   ####  ##  #
//  #  #   #      # # #  #   #   # #   #      #   #  #   #  # ##
//  #   #   ###   #   #   ###     #     ###   #   #   ####  #
//                                                          #
//                                                          #
/**
 * A command that removes an allowed map.
 */
class RemoveMap {
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
                .setName("type")
                .setDescription("The game type.")
                .addChoices(
                    {name: "TA", value: "TA"},
                    {name: "CTF", value: "CTF"},
                    {name: "MB", value: "MB"}
                )
                .setRequired(true))
            .addStringOption((option) => option
                .setName("map")
                .setDescription("The name of the map.")
                .setRequired(true))
            .setName("removemap")
            .setDescription("Removes an allowed map.")
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
        await interaction.deferReply({ephemeral: false});

        const member = Discord.findGuildMemberById(user.id),
            type = interaction.options.getString("type", true),
            map = interaction.options.getString("map", true);

        await Validation.memberShouldBeOwner(interaction, member);
        const mapData = await Validation.mapShouldBeValid(interaction, type, map, member);
        await Validation.mapShouldNotBeStock(interaction, mapData, member);

        try {
            await Map.remove(map, type);
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
                    description: `${member}, the map **${map}** is no longer available for ${Challenge.getGameTypeName(type)} play.`
                })
            ]
        });
        return true;
    }
}

module.exports = RemoveMap;
