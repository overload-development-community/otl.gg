const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####                                       ###                         #
//  #   #                                     #   #                        #
//  #   #   ###   ## #    ###   #   #   ###   #      #   #   ###    ###   ####
//  ####   #   #  # # #  #   #  #   #  #   #  #      #   #  #   #  #       #
//  # #    #####  # # #  #   #   # #   #####  #  ##  #   #  #####   ###    #
//  #  #   #      # # #  #   #   # #   #      #   #  #  ##  #          #   #  #
//  #   #   ###   #   #   ###     #     ###    ###    ## #   ###   ####     ##
/**
 * A command to remove guests from a team.
 */
class RemoveGuest {
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
        return "roster";
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
            .addUserOption((option) => option
                .setName("pilot")
                .setDescription("The guest to remove.")
                .setRequired(true))
            .setName("removeguest")
            .setDescription("Removes a guest from your team.");
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
        RemoveGuest.builder(builder);
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

        await Validation.memberShouldBeCaptainOrFounder(interaction, member);
        const pilot = await Validation.pilotShouldBeOnServer(interaction, member);
        const team = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.pilotShouldBeTeamGuest(interaction, pilot, team, member);

        try {
            await team.removeGuest(member, pilot);
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
                    description: `${member}, ${pilot} is no longer a guest of your team.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = RemoveGuest;
