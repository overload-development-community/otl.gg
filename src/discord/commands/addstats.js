/**
 * @typedef {import("../../../types/challengeTypes").GamePlayerStats} ChallengeTypes.GamePlayerStats
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    commandSemaphore = new Semaphore(1);

//    #        #      #   ###    #             #
//   # #       #      #  #   #   #             #
//  #   #   ## #   ## #  #      ####    ###   ####    ###
//  #   #  #  ##  #  ##   ###    #         #   #     #
//  #####  #   #  #   #      #   #      ####   #      ###
//  #   #  #  ##  #  ##  #   #   #  #  #   #   #  #      #
//  #   #   ## #   ## #   ###     ##    ####    ##   ####
/**
 * A command to add stats to a match.
 */
class AddStats {
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
            .addNumberOption((option) => option
                .setName("gameid")
                .setDescription("The game ID of the match from the tracker URL.")
                .setMinValue(1)
                .setRequired(true))
            .addStringOption((option) => option
                .setName("timestamp")
                .setDescription("The timestamp to stop recording stats at.")
                .setRequired(false))
            .setName("addstats")
            .setDescription("Adds stats to a match.")
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
    static handle(interaction, user) {
        return commandSemaphore.callFunction(async () => {
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

            const gameId = interaction.options.getNumber("gameid", true);

            await Validation.memberShouldBeOwner(interaction, member);
            await Validation.challengeShouldHaveDetails(interaction, challenge, member);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
            await Validation.challengeShouldBeConfirmed(interaction, challenge, member);
            const timestamp = await Validation.timestampShouldBeValid(interaction, member),
                boxScore = await Validation.challengeStatsShouldBeAdded(interaction, challenge, gameId, false, timestamp, member);
            await Validation.challengeShouldNotHaveUnauthorizedPlayers(interaction, challenge, member);

            const msg = Discord.embedBuilder({
                title: "Stats Added",
                fields: []
            });

            if (boxScore.scoreChanged) {
                const winningScore = Math.max(challenge.details.challengingTeamScore, challenge.details.challengedTeamScore),
                    losingScore = Math.min(challenge.details.challengingTeamScore, challenge.details.challengedTeamScore),
                    winningTeam = winningScore === challenge.details.challengingTeamScore ? challenge.challengingTeam : challenge.challengedTeam;

                if (winningScore === losingScore) {
                    msg.addFields({
                        name: "Score Updated",
                        value: `The score for this match has been updated to a tie with the score of **${winningScore}** to **${losingScore}**.`,
                        inline: false
                    });
                } else {
                    msg.addFields({
                        name: "Score Updated",
                        value: `The score for this match has been updated to a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.`,
                        inline: false
                    });
                    msg.setColor(winningTeam.role.color);
                }
            }

            if (boxScore.timeChanged) {
                msg.addFields({
                    name: "Match Time Updated",
                    value: `The match time for this match has been updated to **<t:${Math.floor(challenge.details.matchTime.getTime() / 1000)}:F>**`,
                    inline: false
                });
            }

            switch (challenge.details.gameType) {
                case "TA":
                    msg.addFields({
                        name: `${challenge.challengingTeam.name} Stats`,
                        value: `${boxScore.challengingTeamStats.sort((a, b) => {
                            if (a.kills !== b.kills) {
                                return b.kills - a.kills;
                            }
                            if (a.assists !== b.assists) {
                                return b.assists - a.assists;
                            }
                            if (a.deaths !== b.deaths) {
                                return a.deaths - b.deaths;
                            }
                            if (!a.pilot || !b.pilot) {
                                return 0;
                            }
                            return a.name.localeCompare(b.name);
                        }).map((stat) => `${stat.pilot}: ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D), ${stat.damage.toFixed(0)} Dmg (${(stat.damage / Math.max(stat.deaths, 1)).toFixed(2)} DmgPD)`).join("\n")}`,
                        inline: false
                    });

                    msg.addFields({
                        name: `${challenge.challengedTeam.name} Stats`,
                        value: `${boxScore.challengedTeamStats.sort((a, b) => {
                            if ((a.kills + a.assists) / Math.max(a.deaths, 1) !== (b.kills + b.assists) / Math.max(b.deaths, 1)) {
                                return (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1);
                            }
                            return a.name.localeCompare(b.name);
                        }).map((stat) => `${stat.pilot}: ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D), ${stat.damage.toFixed(0)} Dmg (${(stat.damage / Math.max(stat.deaths, 1)).toFixed(2)} DmgPD)`).join("\n")}`,
                        inline: false
                    });
                    break;
                case "CTF":
                    msg.addFields({
                        name: `${challenge.challengingTeam.name} Stats`,
                        value: `${boxScore.challengingTeamStats.sort((a, b) => {
                            if (a.captures !== b.captures) {
                                return b.captures - a.captures;
                            }
                            if (a.carrierKills !== b.carrierKills) {
                                return b.carrierKills - a.carrierKills;
                            }
                            if ((a.kills + a.assists) / Math.max(a.deaths, 1) !== (b.kills + b.assists) / Math.max(b.deaths, 1)) {
                                return (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1);
                            }
                            if (!a.pilot || !b.pilot) {
                                return 0;
                            }
                            return a.name.localeCompare(b.name);
                        }).map((stat) => `${stat.pilot}: ${stat.captures} C/${stat.pickups} P, ${stat.carrierKills} CK, ${stat.returns} R, ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA, ${stat.damage.toFixed(0)} Dmg`).join("\n")}`,
                        inline: false
                    });

                    msg.addFields({
                        name: `${challenge.challengedTeam.name} Stats`,
                        value: `${boxScore.challengedTeamStats.sort((a, b) => {
                            if (a.captures !== b.captures) {
                                return b.captures - a.captures;
                            }
                            if (a.carrierKills !== b.carrierKills) {
                                return b.carrierKills - a.carrierKills;
                            }
                            if ((a.kills + a.assists) / Math.max(a.deaths, 1) !== (b.kills + b.assists) / Math.max(b.deaths, 1)) {
                                return (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1);
                            }
                            if (!a.pilot || !b.pilot) {
                                return 0;
                            }
                            return a.name.localeCompare(b.name);
                        }).map((stat) => `${stat.pilot}: ${stat.captures} C/${stat.pickups} P, ${stat.carrierKills} CK, ${stat.returns} R, ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA, ${stat.damage.toFixed(0)} Dmg`).join("\n")}`,
                        inline: false
                    });
                    break;
            }

            await interaction.editReply({
                embeds: [msg]
            });

            return true;
        });
    }
}

module.exports = AddStats;
