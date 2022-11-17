const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    commandSemaphore = new Semaphore(1);

//   ###                   ##     #                  #####    #
//  #   #                 #  #                         #
//  #       ###   # ##    #      ##    # ##   ## #     #     ##    ## #    ###
//  #      #   #  ##  #  ####     #    ##  #  # # #    #      #    # # #  #   #
//  #      #   #  #   #   #       #    #      # # #    #      #    # # #  #####
//  #   #  #   #  #   #   #       #    #      # # #    #      #    # # #  #
//   ###    ###   #   #   #      ###   #      #   #    #     ###   #   #   ###
/**
 * A command to confirm a time.
 */
class ConfirmTime {
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
        return "challenge";
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
            .setName("confirmtime")
            .setDescription("Confirms a time for the challenge.");
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
        ConfirmTime.builder(builder);
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
        await interaction.deferReply({ephemeral: false});

        return commandSemaphore.callFunction(async () => {
            const member = Discord.findGuildMemberById(user.id),
                challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);

            if (!challenge) {
                await interaction.deleteReply();
                await interaction.followUp({
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

            await Validation.memberShouldBeCaptainOrFounder(interaction, member);
            const checkTeam = await Validation.memberShouldBeOnATeam(interaction, member);
            await Validation.teamShouldBeInChallenge(interaction, checkTeam, challenge, member);
            await Validation.challengeShouldHaveDetails(interaction, challenge, member);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
            await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
            await Validation.challengeShouldHaveSuggestedTime(interaction, challenge, member);
            await Validation.teamsShouldBeDifferent(interaction, challenge.details.suggestedTimeTeam, checkTeam, member, "but someone from the other team has to confirm the suggested time.", true);

            try {
                await challenge.setTime(challenge.details.suggestedTime);
            } catch (err) {
                await interaction.editReply({components: []});
                await interaction.followUp({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but there was a server error.  An admin will be notified about this.`,
                            color: 0xff0000
                        })
                    ]
                });
                throw err;
            }

            await interaction.editReply({components: []});
            await interaction.followUp({
                embeds: [
                    Discord.embedBuilder({
                        description: "The time for this match has been set.",
                        fields: [{name: "Local Time", value: `<t:${Math.floor(challenge.details.matchTime.getTime() / 1000)}:F>`}]
                    })
                ]
            });

            return true;
        });
    }
}

module.exports = ConfirmTime;
