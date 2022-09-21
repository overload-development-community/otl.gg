const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####     #                  #     ####     #     ##            #
//  #                            #     #   #           #            #
//  #        ##    ###    ###   ####   #   #   ##      #     ###   ####
//  ####      #   #   #  #   #   #     ####     #      #    #   #   #
//  #         #   #####  #       #     #        #      #    #   #   #
//  #         #   #      #   #   #  #  #        #      #    #   #   #  #
//  #####  #  #    ###    ###     ##   #       ###    ###    ###     ##
//         #  #
//          ##
/**
 * A command that ejects a pilot from a team.
 */
class EjectPilot {
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
                .setName("team")
                .setDescription("The team.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .addUserOption((option) => option
                .setName("pilot")
                .setDescription("The pilot to eject.")
                .setRequired(true))
            .setName("ejectpilot")
            .setDescription("Ejects a pilot from a team.")
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
        await interaction.deferReply({ephemeral: true});

        const member = Discord.findGuildMemberById(user.id),
            checkTeam = interaction.options.getString("team", true);

        await Validation.memberShouldBeOwner(interaction, member);
        const team = await Validation.teamShouldExist(interaction, checkTeam, member),
            pilot = await Validation.pilotShouldBeOnServer(interaction, member);
        await Validation.pilotShouldBeOnTeam(interaction, pilot, team, member);
        await Validation.pilotShouldNotBeFounder(interaction, pilot, member);

        try {
            await team.removePilot(member, pilot);
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
                    description: `${member}, ${pilot} has been removed from **${team.name}**.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = EjectPilot;
