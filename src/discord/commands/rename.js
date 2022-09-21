const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####
//  #   #
//  #   #   ###   # ##    ###   ## #    ###
//  ####   #   #  ##  #      #  # # #  #   #
//  # #    #####  #   #   ####  # # #  #####
//  #  #   #      #   #  #   #  # # #  #
//  #   #   ###   #   #   ####  #   #   ###
/**
 * A command that renames a team.
 */
class Rename {
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
            .addStringOption((option) => option
                .setName("name")
                .setDescription("The new team name.")
                .setMinLength(6)
                .setMaxLength(25)
                .setRequired(true))
            .setName("rename")
            .setDescription("Renames a team.")
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
            checkTeam = interaction.options.getString("team", true),
            name = interaction.options.getString("name", true);

        await Validation.memberShouldBeOwner(interaction, member);
        const team = await Validation.teamShouldExist(interaction, checkTeam, member);
        await Validation.teamNameShouldBeUnique(interaction, name, member);

        const oldName = team.name;

        try {
            await team.rename(name, member);
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
                    description: `${member}, **${oldName}** has been renamed to **${team.name}**.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = Rename;
