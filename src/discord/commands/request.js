const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####                                       #
//  #   #                                      #
//  #   #   ###    ## #  #   #   ###    ###   ####
//  ####   #   #  #  ##  #   #  #   #  #       #
//  # #    #####  #  ##  #   #  #####   ###    #
//  #  #   #       ## #  #  ##  #          #   #  #
//  #   #   ###       #   ## #   ###   ####     ##
//                    #
//                    #
/**
 * A command to request joining a team.
 */
class Request {
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
                .setName("team")
                .setDescription("The name or tag of the team.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .setName("request")
            .setDescription("Request to join a team.");
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
        Request.builder(builder);
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
            checkTeam = interaction.options.getString("team", false);

        await Validation.memberShouldNotBeCreatingTeam(interaction, member);
        await Validation.memberShouldNotBeOnATeam(interaction, member);
        const team = await Validation.teamShouldExist(interaction, checkTeam, member);
        await Validation.teamShouldNotBeDisbanded(interaction, team, member);
        await Validation.memberShouldNotHaveRequestToTeam(interaction, team, member);
        await Validation.memberShouldNotHaveInviteFromTeam(interaction, team, member);

        try {
            await member.requestTeam(team);
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
                    description: `${member}, your request has been sent to join **${team.name}**.  The team's leadership has been notified of this request.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = Request;
