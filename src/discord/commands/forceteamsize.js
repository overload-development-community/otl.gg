const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####                              #####                        ###     #
//  #                                    #                         #   #
//  #       ###   # ##    ###    ###     #     ###    ###   ## #   #       ##    #####   ###
//  ####   #   #  ##  #  #   #  #   #    #    #   #      #  # # #   ###     #       #   #   #
//  #      #   #  #      #      #####    #    #####   ####  # # #      #    #      #    #####
//  #      #   #  #      #   #  #        #    #      #   #  # # #  #   #    #     #     #
//  #       ###   #       ###    ###     #     ###    ####  #   #   ###    ###   #####   ###
/**
 * A command that forces a team size.
 */
class ForceTeamSize {
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
                .setName("size")
                .setDescription("The team size.")
                .addChoices(
                    {name: "2v2", value: "2v2"},
                    {name: "3v3", value: "3v3"},
                    {name: "4v4", value: "4v4"},
                    {name: "5v5", value: "5v5"},
                    {name: "6v6", value: "6v6"},
                    {name: "7v7", value: "7v7"},
                    {name: "8v8", value: "8v8"}
                )
                .setRequired(true))
            .setName("forceteamsize")
            .setDescription("Forces a team size for a challenge.")
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

        await Validation.memberShouldBeOwner(interaction, member);

        let homes;
        try {
            homes = await challenge.setTeamSize(+interaction.options.getString("size").charAt(0));
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
                    description: `${member} has set the team size for this match to **${challenge.details.teamSize}v${challenge.details.teamSize}**.${challenge.details.gameType === "TA" && (!challenge.details.map || homes.indexOf(challenge.details.map) === -1) ? `  **${(challenge.details.homeMapTeam.tag === challenge.challengingTeam.tag ? challenge.challengedTeam : challenge.challengingTeam).tag}** must now choose from one of the following home maps:\n\n${homes.map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}` : ""}`
                })
            ]
        });

        return true;
    }
}

module.exports = ForceTeamSize;
