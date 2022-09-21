const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####     #           #      #   #
//  #   #                #      #   #
//  #   #   ##     ###   #   #  ## ##   ###   # ##
//  ####     #    #   #  #  #   # # #      #  ##  #
//  #        #    #      ###    #   #   ####  ##  #
//  #        #    #   #  #  #   #   #  #   #  # ##
//  #       ###    ###   #   #  #   #   ####  #
//                                            #
//                                            #
/**
 * A command to pick a map.
 */
class PickMap {
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
                .setName("option")
                .setDescription("The map option.")
                .addChoices(
                    {name: "a", value: "a"},
                    {name: "b", value: "b"},
                    {name: "c", value: "c"},
                    {name: "d", value: "d"},
                    {name: "e", value: "e"}
                )
                .setRequired(true))
            .setName("pickmap")
            .setDescription("Pick a map for a challenge.");
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
        PickMap.builder(builder);
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
        const member = Discord.findGuildMemberById(user.id),
            challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);
        if (!challenge) {
            return false;
        }

        await interaction.deferReply({ephemeral: false});

        const option = interaction.options.getString("option", true).toLowerCase().charCodeAt(0) - 96;

        const team = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.memberShouldBeCaptainOrFounder(interaction, member);
        await Validation.teamShouldBeInChallenge(interaction, team, challenge, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
        await Validation.teamShouldNotBeHome(interaction, team, challenge, member);
        await Validation.challengeShouldHaveTeamSize(interaction, challenge, member);
        await Validation.mapNotPickedEarlierInSeries(interaction, option, challenge, member);

        try {
            await challenge.pickMap(option);
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
                    description: `The map for this match has been set to **${challenge.details.map}**.`
                })
            ]
        });
        return true;
    }
}

module.exports = PickMap;
