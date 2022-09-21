const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####                                      #   #
//  #   #                                     #   #
//  #   #   ###   ## #    ###   #   #   ###   #   #   ###   ## #    ###
//  ####   #   #  # # #  #   #  #   #  #   #  #####  #   #  # # #  #   #
//  # #    #####  # # #  #   #   # #   #####  #   #  #   #  # # #  #####
//  #  #   #      # # #  #   #   # #   #      #   #  #   #  # # #  #
//  #   #   ###   #   #   ###     #     ###   #   #   ###   #   #   ###
/**
 * A command to remove a home map from a team.
 */
class RemoveHome {
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
                    {name: "2v2", value: "2v2"},
                    {name: "3v3", value: "3v3"},
                    {name: "4v4+", value: "4v4+"},
                    {name: "CTF", value: "CTF"}
                )
                .setRequired(true))
            .addStringOption((option) => option
                .setName("map")
                .setDescription("The name of the map.")
                .setRequired(true))
            .setName("removehome")
            .setDescription("Removes a home map from your team.");
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
        RemoveHome.builder(builder);
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
        await Validation.teamShouldHaveHomeSet(interaction, team, type, map, member);

        try {
            await team.removeHomeMap(member, type, map.map);
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
                    description: `${member}, your home map of **${map.map}** has been removed.  Note this only applies to future challenges, any current challenges you have will use the home maps you had at the time of the challenge.  Also note that you will not be able to send or receive challenges until you once again have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} maps in this category.  Use the \`/addhome\` command to do this.`,
                    color: team.role.color
                })
            ]
        });
        return true;
    }
}

module.exports = RemoveHome;
