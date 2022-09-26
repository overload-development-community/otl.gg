const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####                       #####    #
//    #                           #
//    #     ###    ###   ## #     #     ##    ## #    ###   #####   ###   # ##    ###
//    #    #   #      #  # # #    #      #    # # #  #   #     #   #   #  ##  #  #   #
//    #    #####   ####  # # #    #      #    # # #  #####    #    #   #  #   #  #####
//    #    #      #   #  # # #    #      #    # # #  #       #     #   #  #   #  #
//    #     ###    ####  #   #    #     ###   #   #   ###   #####   ###   #   #   ###
/**
 * A command that sets your team's timezone.
 */
class TeamTimezone {
    //         #                ##           #
    //                           #           #
    //  ###   ##    # #   #  #   #     ###  ###    ##
    // ##      #    ####  #  #   #    #  #   #    # ##
    //   ##    #    #  #  #  #   #    # ##   #    ##
    // ###    ###   #  #   ###  ###    # #    ##   ##
    /**
     * Indicates that this is a command that can be simulated.
     * @returns {string} The subcommand group for this command.
     */
    static get simulate() {
        return "team";
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
                .setName("timezone")
                .setDescription("Your team's time zone.")
                .setRequired(true))
            .setName("teamtimezone")
            .setDescription("Set your team's time zone.");
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
        TeamTimezone.builder(builder);
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

        const member = Discord.findGuildMemberById(user.id),
            timezone = interaction.options.getString("timezone", true);

        await Validation.memberShouldBeFounder(interaction, member);
        const team = await Validation.memberShouldBeOnATeam(interaction, member),
            time = await Validation.timezoneShouldBeValid(interaction, timezone, member);

        try {
            await team.setTimezone(timezone);
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
                    description: `${member}, the time zone for **${team.name}** has been set to ${timezone}, where the current local time is **${time}**.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = TeamTimezone;
