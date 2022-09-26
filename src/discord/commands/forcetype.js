const Challenge = require("../../models/challenge"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####                              #####
//  #                                    #
//  #       ###   # ##    ###    ###     #    #   #  # ##    ###
//  ####   #   #  ##  #  #   #  #   #    #    #   #  ##  #  #   #
//  #      #   #  #      #      #####    #    #  ##  ##  #  #####
//  #      #   #  #      #   #  #        #     ## #  # ##   #
//  #       ###   #       ###    ###     #        #  #       ###
//                                            #   #  #
//                                             ###   #
/**
 * A command to force the game type.
 */
class ForceType {
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
                .setName("type")
                .setDescription("The game type.")
                .addChoices(
                    {name: "TA", value: "TA"},
                    {name: "CTF", value: "CTF"}
                )
                .setRequired(true))
            .setName("forcetype")
            .setDescription("Forces a game type for a challenge.")
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
            await interaction.reply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this command can only be used in a challenge channel.`,
                        color: 0xff0000
                    })
                ],
                ephemeral: true
            });
            return false;
        }

        await interaction.deferReply({ephemeral: false});

        const type = interaction.options.getString("type", true);

        await Validation.memberShouldBeOwner(interaction, member);

        let homes;
        try {
            homes = await challenge.setGameType(type);
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
                    description: `${member} has set the game type for this match to **${Challenge.getGameTypeName(type)}**.  **${(challenge.details.homeMapTeam.tag === challenge.challengingTeam.tag ? challenge.challengedTeam : challenge.challengingTeam).tag}** must now choose from one of the following home maps:\n\n${homes.map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}`
                })
            ]
        });

        if (!challenge.details.challengingTeamPenalized && !challenge.details.challengedTeamPenalized && !challenge.details.adminCreated) {
            try {
                await challenge.notifyMatchingNeutrals();
            } catch {}
        }

        return true;
    }
}

module.exports = ForceType;
