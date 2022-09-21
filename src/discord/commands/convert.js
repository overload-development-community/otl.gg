const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//   ###                                       #
//  #   #                                      #
//  #       ###   # ##   #   #   ###   # ##   ####
//  #      #   #  ##  #  #   #  #   #  ##  #   #
//  #      #   #  #   #   # #   #####  #       #
//  #   #  #   #  #   #   # #   #      #       #  #
//   ###    ###   #   #    #     ###   #        ##
/**
 * A command to convert a local time to a Discord timestamp.
 */
class Convert {
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
                .setName("datetime")
                .setDescription("The date and time.")
                .setRequired(true))
            .setName("convert")
            .setDescription("Converts a time from your time zone for others.");
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
            datetime = interaction.options.getString("datetime", true);

        const date = await Validation.dateShouldBeValid(interaction, datetime, member);

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: "**Converted Time**",
                    fields: [
                        {name: "Local Time", value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: true},
                        {name: "Discord Markdown", value: `\`<t:${Math.floor(date.getTime() / 1000)}:F>\``, inline: true}
                    ]
                })
            ]
        });
        return true;
    }
}

module.exports = Convert;
