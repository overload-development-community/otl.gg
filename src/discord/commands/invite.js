const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    commandSemaphore = new Semaphore(1);

//   ###                   #     #
//    #                          #
//    #    # ##   #   #   ##    ####    ###
//    #    ##  #  #   #    #     #     #   #
//    #    #   #   # #     #     #     #####
//    #    #   #   # #     #     #  #  #
//   ###   #   #    #     ###     ##    ###
/**
 * A command to invite a player to your team.
 */
class Invite {
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
            .addUserOption((option) => option
                .setName("pilot")
                .setDescription("The pilot to invite.")
                .setRequired(true))
            .setName("invite")
            .setDescription("Invite a pilot to join your team.");
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
        Invite.builder(builder);
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
    static handle(interaction, user) {
        return commandSemaphore.callFunction(async () => {
            await interaction.deferReply({ephemeral: true});

            const member = Discord.findGuildMemberById(user.id);

            await Validation.memberShouldBeCaptainOrFounder(interaction, member);
            const team = await Validation.memberShouldBeOnATeam(interaction, member);
            await Validation.teamShouldNotBeAtCapacity(interaction, team, member);
            const pilot = await Validation.pilotShouldBeOnServer(interaction, member);
            await Validation.pilotShouldNotBeCreatingTeam(interaction, pilot, member);
            await Validation.pilotShouldNotBeOnATeam(interaction, pilot, member);
            await Validation.pilotShouldNotBeInvitedToTeam(interaction, pilot, team, member);

            try {
                await team.invitePilot(member, pilot);
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
                        description: `${member}, ${pilot} has been invited to your team.`,
                        color: team.role.color
                    })
                ]
            });
            return true;
        });
    }
}

module.exports = Invite;
