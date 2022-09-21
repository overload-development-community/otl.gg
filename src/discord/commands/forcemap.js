const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####                              #   #
//  #                                  #   #
//  #       ###   # ##    ###    ###   ## ##   ###   # ##
//  ####   #   #  ##  #  #   #  #   #  # # #      #  ##  #
//  #      #   #  #      #      #####  #   #   ####  ##  #
//  #      #   #  #      #   #  #      #   #  #   #  # ##
//  #       ###   #       ###    ###   #   #   ####  #
//                                                   #
//                                                   #
/**
 * A command that forces a map.
 */
class ForceMap {
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
                .setName("map")
                .setDescription("The name of the map.")
                .setRequired(true))
            .setName("forcemap")
            .setDescription("Forces a map for a challenge.")
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
        const member = Discord.findGuildMemberById(user.id),
            challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);
        if (!challenge) {
            return false;
        }

        await interaction.deferReply({ephemeral: false});

        const checkMap = interaction.options.getString("map", true);

        await Validation.memberShouldBeOwner(interaction, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldHaveTeamSize(interaction, challenge, member);

        if (["a", "b", "c", "d", "e"].indexOf(checkMap.toLowerCase()) === -1) {
            const map = await Validation.mapShouldBeValid(interaction, challenge.details.gameType, checkMap, member);

            try {
                await challenge.setMap(map.map);
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
        } else {
            const option = checkMap.toLowerCase().charCodeAt(0) - 96;

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
        }

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member} has set the map for this match to **${challenge.details.map}**.`
                })
            ]
        });

        return true;
    }
}

module.exports = ForceMap;
