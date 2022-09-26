const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    commandSemaphore = new Semaphore(1);

//    #        #      #  #   #
//   # #       #      #  #   #
//  #   #   ## #   ## #  #   #   ###   ## #    ###
//  #   #  #  ##  #  ##  #####  #   #  # # #  #   #
//  #####  #   #  #   #  #   #  #   #  # # #  #####
//  #   #  #  ##  #  ##  #   #  #   #  # # #  #
//  #   #   ## #   ## #  #   #   ###   #   #   ###
/**
 * A command to add a home map for a team.
 */
class AddHome {
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
        return "maps";
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
            .setName("addhome")
            .setDescription("Adds a home map for your team.");
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
        AddHome.builder(builder);
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

            const member = Discord.findGuildMemberById(user.id),
                type = interaction.options.getString("type", true),
                checkMap = interaction.options.getString("map", true);

            await Validation.memberShouldBeCaptainOrFounder(interaction, member);
            const map = await Validation.mapShouldBeValid(interaction, type, checkMap, member),
                team = await Validation.memberShouldBeOnATeam(interaction, member),
                homes = await Validation.teamShouldNotHaveHomeSet(interaction, team, type, map, member);
            await Validation.homeListShouldHaveRoom(interaction, homes, type, member);

            try {
                await team.addHomeMap(member, type, map.map);
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
                        description: `${member}, your home map of **${map.map}** has been set.  Note this only applies to future challenges, any current challenges you have will use the home maps you had at the time of the challenge.`,
                        color: team.role.color
                    })
                ]
            });
            return true;
        });
    }
}

module.exports = AddHome;
