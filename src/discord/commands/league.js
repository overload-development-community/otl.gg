const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #
//  #
//  #       ###    ###    ## #  #   #   ###
//  #      #   #      #  #  #   #   #  #   #
//  #      #####   ####   ##    #   #  #####
//  #      #      #   #  #      #  ##  #
//  #####   ###    ####   ###    ## #   ###
//                       #   #
//                        ###
/**
 * A command to set a team's league.
 */
class League {
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
                .setDescription("The team to place into a league.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .addStringOption((option) => option
                .setName("league")
                .setDescription("The league to place the team into.")
                .addChoices(
                    {name: "Upper", value: "Upper"},
                    {name: "Lower", value: "Lower"}
                )
                .setRequired(true))
            .setName("league")
            .setDescription("Places a team in a league.")
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
            checkTeam = interaction.options.getString("team", true),
            league = interaction.options.getString("league", true);

        await Validation.memberShouldBeOwner(interaction, member);
        const team = await Validation.teamShouldExist(interaction, checkTeam, member);

        try {
            await team.setLeague(league);
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
                    description: `**${team.name}** has been placed in the ${league.toLowerCase()} league.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = League;
