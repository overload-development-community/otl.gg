const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####                  #              #            #                #
//  #   #                 #                           #                #
//  #   #   ###    ###   ####   # ##    ##     ###   ####    ###    ## #
//  ####   #   #  #       #     ##  #    #    #   #   #     #   #  #  ##
//  # #    #####   ###    #     #        #    #       #     #####  #   #
//  #  #   #          #   #  #  #        #    #   #   #  #  #      #  ##
//  #   #   ###   ####     ##   #       ###    ###     ##    ###    ## #
/**
 * A command that makes a match restricted.
 */
class Restricted {
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
            .setName("restricted")
            .setDescription("Restricts a match to authorized players.")
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

        await interaction.deferReply({ephemeral: true});

        await Validation.memberShouldBeOwner(interaction, member);
        await Validation.teamShouldBeLocked(interaction, challenge.challengingTeam, member);
        await Validation.teamShouldBeLocked(interaction, challenge.challengedTeam, member);

        try {
            await challenge.setRestricted(true);
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

        const authorized = await challenge.getAuthorizedPlayers();

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    title: "Match Restricted",
                    description: "This match is now set as a restricted tournament match.  The following players are eligible to play in this match.",
                    fields: [
                        {
                            name: challenge.challengingTeam.name,
                            value: authorized.challengingTeamPlayers.map((player) => `<@${player.discordId}>`).join("\n"),
                            inline: true
                        },
                        {
                            name: challenge.challengedTeam.name,
                            value: authorized.challengedTeamPlayers.map((player) => `<@${player.discordId}>`).join("\n"),
                            inline: true
                        }
                    ]
                })
            ]
        });

        return true;
    }
}

module.exports = Restricted;
