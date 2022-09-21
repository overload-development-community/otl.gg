const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####           #
//  #   #          #
//  #   #   ###   ####    ###    ## #
//  ####   #   #   #         #  #  #
//  # #    #####   #      ####   ##
//  #  #   #       #  #  #   #  #
//  #   #   ###     ##    ####   ###
//                              #   #
//                               ###
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
                .setName("tag")
                .setDescription("The new team tag.")
                .setMinLength(1)
                .setMaxLength(5)
                .setRequired(true))
            .setName("retag")
            .setDescription("Retags a team.")
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
            tag = interaction.options.getString("tag", true).toUpperCase();

        await Validation.memberShouldBeOwner(interaction, member);
        const team = await Validation.teamShouldExist(interaction, checkTeam, member);
        await Validation.teamTagShouldBeUnique(interaction, tag, member);

        const oldTag = team.tag;

        try {
            await team.retag(tag, member);
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
                    description: `${member}, **${oldTag}** has been retagged to **${team.tag}**.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = Rename;
