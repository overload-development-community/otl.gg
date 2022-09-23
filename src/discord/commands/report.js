const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1),
    commandSemaphore = new Semaphore(1);

//  ####                                #
//  #   #                               #
//  #   #   ###   # ##    ###   # ##   ####
//  ####   #   #  ##  #  #   #  ##  #   #
//  # #    #####  ##  #  #   #  #       #
//  #  #   #      # ##   #   #  #       #  #
//  #   #   ###   #       ###   #        ##
//                #
//                #
/**
 * A command that reports a match by URL.
 */
class Report {
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
                .setName("url")
                .setDescription("The URL of the match from the tracker URL.")
                .setRequired(true))
            .setName("report")
            .setDescription("Reports a match from the tracker URL.");
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
        Report.builder(builder);
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
            const member = Discord.findGuildMemberById(user.id),
                challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);
            if (!challenge) {
                return false;
            }

            const response = await interaction.deferReply({ephemeral: false});

            await Validation.memberShouldBeCaptainOrFounder(interaction, member);
            const checkTeam = await Validation.memberShouldBeOnATeam(interaction, member);
            await Validation.teamShouldBeInChallenge(interaction, checkTeam, challenge, member);
            await Validation.challengeShouldHaveDetails(interaction, challenge, member);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
            await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
            await Validation.challengeShouldHaveMap(interaction, challenge, member);
            await Validation.challengeShouldHaveTeamSize(interaction, challenge, member);
            await Validation.challengeShouldBeScheduled(interaction, challenge, member);
            const gameId = await Validation.trackerUrlShouldBeValid(interaction, member);
            await Validation.challengeStatsShouldBeAdded(interaction, challenge, +gameId, true, void 0, member);
            const {winningScore, losingScore} = await Validation.challengeShouldBeReportedByLosingTeam(interaction, challenge, checkTeam, member);
            await Validation.challengeShouldNotHaveUnauthorizedPlayers(interaction, challenge, member);

            try {
                await challenge.reportMatch(checkTeam, winningScore, losingScore);
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

            const winningTeam = checkTeam.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam;

            const customId = `report-${user.id}-${challenge.id}-${winningScore}-${losingScore}-${Date.now()}`;

            const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
                .addComponents(new DiscordJs.ButtonBuilder()
                    .setCustomId(customId)
                    .setLabel(`${winningTeam.name}, confirm the match`)
                    .setStyle(DiscordJs.ButtonStyle.Primary)));

            let msg;
            if (winningScore === losingScore) {
                msg = Discord.embedBuilder({
                    description: `This match has been reported as a **tie**, **${winningScore}** to **${losingScore}**.  If this is correct, **${winningTeam.name}** needs to confirm the result.  If this was reported in error, the losing team may correct this by issuing the command \`/reportscore 0 0\` and then re-reporting the correct match.  If there are multiple games to include in this report, continue to \`/report\` more tracker URLs.  You may \`/reportscore 0 0\` in order to reset the stats and restart the reporting process.`
                });
            } else {
                msg = Discord.embedBuilder({
                    description: `This match has been reported as a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.  If this is correct, **${winningTeam.name}** needs to confirm the result.  If this was reported in error, the losing team may correct this by issuing the command \`/reportscore 0 0\` and then re-reporting the correct match.`,
                    color: winningTeam.role.color
                });
            }

            await interaction.editReply({
                embeds: [msg],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({time: 890000});

            collector.on("collect", (buttonInteraction) => buttonSemaphore.callFunction(async () => {
                if (collector.ended || buttonInteraction.customId !== customId) {
                    return;
                }

                const buttonUser = buttonInteraction.user,
                    buttonMember = Discord.findGuildMemberById(buttonUser.id);
                await Validation.memberShouldBeCaptainOrFounder(interaction, buttonMember);
                const team = await Validation.memberShouldBeOnATeam(interaction, buttonMember);
                await Validation.teamShouldBeInChallenge(interaction, team, challenge, buttonMember);
                await Validation.teamsShouldBeDifferent(interaction, checkTeam, team, buttonMember, "but someone from the other team has to confirm the match.");
                await Validation.challengeShouldHaveDetails(interaction, challenge, buttonMember);
                await Validation.challengeShouldNotBeVoided(interaction, challenge, buttonMember);
                await Validation.challengeShouldNotBeConfirmed(interaction, challenge, buttonMember);
                await Validation.challengeShouldHaveMap(interaction, challenge, buttonMember);
                await Validation.challengeShouldHaveTeamSize(interaction, challenge, buttonMember);
                await Validation.challengeShouldBeScheduled(interaction, challenge, buttonMember);

                try {
                    await challenge.confirmMatch();
                } catch (err) {
                    await interaction.editReply({components: []});
                    await interaction.followUp({
                        embeds: [
                            Discord.embedBuilder({
                                description: `Sorry, ${buttonMember}, but there was a server error.  An admin will be notified about this.`,
                                color: 0xff0000
                            })
                        ]
                    });
                    collector.stop();
                    throw err;
                }

                const embed = Discord.embedBuilder({
                    title: "Match Confirmed",
                    fields: [
                        {
                            name: "This channel is now closed",
                            value: "No further match-related commands will be accepted.  If you need to adjust anything in this match, please notify an admin immediately.  This channel will be removed once the stats have been posted."
                        }
                    ]
                });

                if (winningScore === losingScore) {
                    embed.setDescription(`This match has been confirmed as a **tie**, **${winningScore}** to **${losingScore}**.${challenge.details.adminCreated ? "" : "  Interested in playing another right now?  Use the `/rematch` command!"}`);
                } else {
                    embed.setDescription(`This match has been confirmed as a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.${challenge.details.adminCreated ? "" : "  Interested in playing another right now?  Use the `/rematch` command!"}`);
                    embed.setColor(winningTeam.role.color);
                }

                await interaction.editReply({components: []});
                await interaction.followUp({
                    embeds: [embed]
                });

                collector.stop();
            }));

            collector.on("end", async () => {
                await interaction.editReply({components: []});
            });

            return true;
        });
    }
}

module.exports = Report;
