const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//   ###           ##
//  #   #           #
//  #       ###     #     ###   # ##
//  #      #   #    #    #   #  ##  #
//  #      #   #    #    #   #  #
//  #   #  #   #    #    #   #  #
//   ###    ###    ###    ###   #
/**
 * A command that changes a team's color.
 */
class Color {
    //         #                ##           #
    //                           #           #
    //  ###   ##    # #   #  #   #     ###  ###    ##
    // ##      #    ####  #  #   #    #  #   #    # ##
    //   ##    #    #  #  #  #   #    # ##   #    ##
    // ###    ###   #  #   ###  ###    # #    ##   ##
    /**
     * Indicates that this is a command that can be simulated.
     * @returns {boolean} Whether this is a command that can be simulated.
     */
    static get simulate() {
        return true;
    }

    // #            #    ##       #
    // #                  #       #
    // ###   #  #  ##     #     ###   ##   ###
    // #  #  #  #   #     #    #  #  # ##  #  #
    // #  #  #  #   #     #    #  #  ##    #
    // ###    ###  ###   ###    ###   ##   #
    /**
     * The common command builder.
     * @param {DiscordJs.SlashCommandBuilder | DiscordJs.SlashCommandSubcommandBuilder} builder The command builder.
     * @returns {void}
     */
    static builder(builder) {
        builder
            .addStringOption((option) => option
                .setName("shade")
                .setDescription("The shade of the color.")
                .addChoices(
                    {name: "normal", value: "normal"},
                    {name: "dark", value: "dark"},
                    {name: "light", value: "light"}
                )
                .setRequired(true))
            .addStringOption((option) => option
                .setName("color")
                .setDescription("The color to use.")
                .addChoices(
                    {name: "red", value: "red"},
                    {name: "orange", value: "orange"},
                    {name: "yellow", value: "yellow"},
                    {name: "lime", value: "lime"},
                    {name: "green", value: "green"},
                    {name: "spring", value: "spring"},
                    {name: "aqua", value: "aqua"},
                    {name: "azure", value: "azure"},
                    {name: "blue", value: "blue"},
                    {name: "violet", value: "violet"},
                    {name: "purple", value: "purple"},
                    {name: "pink", value: "pink"}
                )
                .setRequired(true))
            .setName("color")
            .setDescription("Changes the color of your team.");
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
        const builder = new DiscordJs.SlashCommandBuilder();
        Color.builder(builder);
        return builder;
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

        const member = Discord.findGuildMemberById(user.id);

        await Validation.memberShouldBeFounder(interaction, member);
        const team = await Validation.memberShouldBeOnATeam(interaction, member);

        const shade = interaction.options.getString("shade", true);

        let color;
        switch (interaction.options.getString("color", true)) {
            case "red":
                switch (shade) {
                    case "dark":
                        color = 0x800000;
                        break;
                    case "light":
                        color = 0xFF8080;
                        break;
                    default:
                        color = 0xFF0000;
                        break;
                }
                break;
            case "orange":
                switch (shade) {
                    case "dark":
                        color = 0x804000;
                        break;
                    case "light":
                        color = 0xFFC080;
                        break;
                    default:
                        color = 0xFF8000;
                        break;
                }
                break;
            case "yellow":
                switch (shade) {
                    case "dark":
                        color = 0x808000;
                        break;
                    case "light":
                        color = 0xFFFF80;
                        break;
                    default:
                        color = 0xFFFF00;
                        break;
                }
                break;
            case "lime":
                switch (shade) {
                    case "dark":
                        color = 0x408000;
                        break;
                    case "light":
                        color = 0xC0FF80;
                        break;
                    default:
                        color = 0x80FF00;
                        break;
                }
                break;
            case "green":
                switch (shade) {
                    case "dark":
                        color = 0x008000;
                        break;
                    case "light":
                        color = 0x80FF80;
                        break;
                    default:
                        color = 0x00FF00;
                        break;
                }
                break;
            case "spring":
                switch (shade) {
                    case "dark":
                        color = 0x008040;
                        break;
                    case "light":
                        color = 0x80FFC0;
                        break;
                    default:
                        color = 0x00FF80;
                        break;
                }
                break;
            case "aqua":
                switch (shade) {
                    case "dark":
                        color = 0x008080;
                        break;
                    case "light":
                        color = 0x80FFFF;
                        break;
                    default:
                        color = 0x00FFFF;
                        break;
                }
                break;
            case "azure":
                switch (shade) {
                    case "dark":
                        color = 0x004080;
                        break;
                    case "light":
                        color = 0x80C0FF;
                        break;
                    default:
                        color = 0x0080FF;
                        break;
                }
                break;
            case "blue":
                switch (shade) {
                    case "dark":
                        color = 0x000080;
                        break;
                    case "light":
                        color = 0x8080FF;
                        break;
                    default:
                        color = 0x0000FF;
                        break;
                }
                break;
            case "violet":
                switch (shade) {
                    case "dark":
                        color = 0x400080;
                        break;
                    case "light":
                        color = 0xC080FF;
                        break;
                    default:
                        color = 0x8000FF;
                        break;
                }
                break;
            case "purple":
                switch (shade) {
                    case "dark":
                        color = 0x800080;
                        break;
                    case "light":
                        color = 0xFF80FF;
                        break;
                    default:
                        color = 0xFF00FF;
                        break;
                }
                break;
            case "pink":
                switch (shade) {
                    case "dark":
                        color = 0x800040;
                        break;
                    case "light":
                        color = 0xFF80C0;
                        break;
                    default:
                        color = 0xFF0080;
                        break;
                }
                break;
        }

        try {
            await team.changeColor(member, color);
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
                    description: `${member}, your team's color has been updated.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = Color;
