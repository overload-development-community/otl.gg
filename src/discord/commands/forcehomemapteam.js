const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  #####                              #   #                       #   #                #####
//  #                                  #   #                       #   #                  #
//  #       ###   # ##    ###    ###   #   #   ###   ## #    ###   ## ##   ###   # ##     #     ###    ###   ## #
//  ####   #   #  ##  #  #   #  #   #  #####  #   #  # # #  #   #  # # #      #  ##  #    #    #   #      #  # # #
//  #      #   #  #      #      #####  #   #  #   #  # # #  #####  #   #   ####  ##  #    #    #####   ####  # # #
//  #      #   #  #      #   #  #      #   #  #   #  # # #  #      #   #  #   #  # ##     #    #      #   #  # # #
//  #       ###   #       ###    ###   #   #   ###   #   #   ###   #   #   ####  #        #     ###    ####  #   #
//                                                                               #
//                                                                               #
/**
 * A command that forces a home map team.
 */
class ForceHomeMapTeam {
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
                .setDescription("The team to make the home team.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .setName("forcehomemapteam")
            .setDescription("Forces a team in a challenge to be the home map team.")
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

        const checkTeam = interaction.options.getString("team", true);

        const team = await Validation.teamShouldExist(interaction, checkTeam, member);
        await Validation.teamShouldBeInChallenge(interaction, team, challenge, member);

        let homes;
        try {
            homes = await challenge.setHomeMapTeam(team);
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

        if (homes.length === 0) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member} has made **${team.tag}** the home map team, so **${(team.tag === challenge.challengingTeam.tag ? challenge.challengedTeam : challenge.challengingTeam).tag}** must choose from one of **${(team.tag === challenge.challengingTeam.tag ? challenge.challengingTeam : challenge.challengedTeam).tag}**'s home maps.  To view the home maps, you must first agree to a team size.`
                    })
                ]
            });
        } else {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member} has made **${team.tag}** the home map team, so **${(team.tag === challenge.challengingTeam.tag ? challenge.challengedTeam : challenge.challengingTeam).tag}** must choose from one of the following home maps:\n\n${homes.map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}`
                    })
                ]
            });
        }

        return true;
    }
}

module.exports = ForceHomeMapTeam;
