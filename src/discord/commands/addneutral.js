const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//    #        #      #  #   #                 #                    ##
//   # #       #      #  #   #                 #                     #
//  #   #   ## #   ## #  ##  #   ###   #   #  ####   # ##    ###     #
//  #   #  #  ##  #  ##  # # #  #   #  #   #   #     ##  #      #    #
//  #####  #   #  #   #  #  ##  #####  #   #   #     #       ####    #
//  #   #  #  ##  #  ##  #   #  #      #  ##   #  #  #      #   #    #
//  #   #   ## #   ## #  #   #   ###    ## #    ##   #       ####   ###
/**
 * A command to add a preferred neutral map for a team.
 */
class AddNeutral {
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
                .setName("type")
                .setDescription("The type of game the map is to be played on.")
                .addChoices(
                    {name: "TA", value: "TA"},
                    {name: "CTF", value: "CTF"}
                )
                .setRequired(true))
            .addStringOption((option) => option
                .setName("map")
                .setDescription("The name of the map.")
                .setRequired(true))
            .setName("addneutral")
            .setDescription("Adds a neutral map for your team.");
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
        AddNeutral.builder(builder);
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
            type = interaction.options.getString("type", true),
            checkMap = interaction.options.getString("map", true);

        await Validation.memberShouldBeCaptainOrFounder(interaction, member);
        const map = await Validation.mapShouldBeValid(interaction, type, checkMap, member),
            team = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.teamShouldNotHaveNeutralSet(interaction, team, type, map, member);

        try {
            await team.addNeutralMap(member, type, map.map);
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
                    description: `${member}, your preferred neutral map of **${map.map}** has been set.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = AddNeutral;
