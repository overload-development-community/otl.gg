/**
 * @typedef {import("../../types/azureTypes").Server} AzureTypes.Server
 * @typedef {import("../../types/ChallengeTypes").GameBoxScore} ChallengeTypes.GameBoxScore
 * @typedef {import("../../types/ChallengeTypes").GamePlayerStatsByTeam} ChallengeTypes.GamePlayerStatsByTeam
 * @typedef {import("discord.js").ButtonInteraction} DiscordJs.ButtonInteraction
 * @typedef {import("discord.js").ChatInputCommandInteraction} DiscordJs.ChatInputCommandInteraction
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").User} DiscordJs.User
 * @typedef {import("../../types/mapTypes").MapData} MapTypes.MapData
 * @typedef {import("../models/newTeam")} NewTeam
 */

const Challenge = require("../models/challenge"),
    Discord = require("../discord"),
    Exception = require("../logging/exception"),
    Log = require("../logging/log"),
    Map = require("../models/map"),
    tc = require("timezonecomplete"),
    settings = require("../../settings"),
    Team = require("../models/team"),
    tzdata = require("tzdata"),
    Warning = require("../logging/warning"),

    MAXIMUM_MAPS_PER_GAME_TYPE = 5,
    MAXIMUM_PILOTS_PER_ROSTER = 10,
    MINIMUM_PILOTS_PER_ROSTER = 2,
    seriesTitleParse = /^(?<base>.+ Game )(?<game>[1-9][0-9]*)$/,
    teamNameParse = /^[0-9a-zA-Z' -]{6,25}$/,
    teamTagParse = /^[0-9A-Z]{1,5}$/,
    timestampParse = /^(?<minutes>[1-9]?[0-9]):(?<seconds>[0-9]{2}(?:\.[0-9]{3})?)$/,
    trackerUrlParse = /^https:\/\/(?:tracker|olproxy).otl.gg\/archive\/(?<gameId>[1-9][0-9]*)$/,
    urlParse = /^https?:\/\/.+$/;

//  #   #          ##      #        #          #       #
//  #   #           #               #          #
//  #   #   ###     #     ##     ## #   ###   ####    ##     ###   # ##
//   # #       #    #      #    #  ##      #   #       #    #   #  ##  #
//   # #    ####    #      #    #   #   ####   #       #    #   #  #   #
//   # #   #   #    #      #    #  ##  #   #   #  #    #    #   #  #   #
//    #     ####   ###    ###    ## #   ####    ##    ###    ###   #   #

/**
 * A class to handle command validations.
 */
class Validation {
    // #  #   ##   #  #  ###   #  #  #  #  #  #        #  #   ##   ###    ##         ###   ####  ###          ##    ##   #  #  ####        ###   # #   ###   ####
    // ####  #  #  #  #   #    ####  #  #  ####        ####  #  #  #  #  #  #        #  #  #     #  #        #  #  #  #  ####  #            #    # #   #  #  #
    // ####  #  #   ##    #    ####  #  #  ####        ####  #  #  #  #   #          #  #  ###   #  #        #     #  #  ####  ###          #    # #   #  #  ###
    // #  #  ####   ##    #    #  #  #  #  #  #        #  #  ####  ###     #         ###   #     ###         # ##  ####  #  #  #            #     #    ###   #
    // #  #  #  #  #  #   #    #  #  #  #  #  #        #  #  #  #  #     #  #        #     #     # #         #  #  #  #  #  #  #            #     #    #     #
    // #  #  #  #  #  #  ###   #  #   ##   #  #  ####  #  #  #  #  #      ##   ####  #     ####  #  #  ####   ###  #  #  #  #  ####  ####   #     #    #     ####
    /**
     * The maximum number of maps per game type.
     * @returns {number} The maximum number of maps per game type.
     */
    static get MAXIMUM_MAPS_PER_GAME_TYPE() {
        return MAXIMUM_MAPS_PER_GAME_TYPE;
    }

    //       #           ##    ##                            ###                  #  ##     #                 ##   #                 ##       #  #  #                    ###                                #
    //       #            #     #                            #  #                 #   #                      #  #  #                  #       #  #  #                    #  #                               #
    //  ##   ###    ###   #     #     ##   ###    ###   ##   #  #   ##    ###   ###   #    ##    ###    ##    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   #  #   ###   ###    ###    ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  # ##  #  #  #  #   #     #    #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  ###   #  #  ##     ##     # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  ##    # ##  #  #   #     #    #  #  ##    #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #     # ##    ##     ##   ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    ##    # #   ###  ###   ###   #  #   ##    ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   #      # #  ###    ###     ##    ###
    //                                            ###
    /**
     * Validates that a challenge deadline has passed.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeDeadlineShouldHavePassed(interaction, challenge, member) {
        if (challenge.details.dateClockDeadline && challenge.details.dateClockDeadline.getTime() > Date.now()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this match'es clock deadline has not passed.  The current clock deadline is <t:${Math.floor(challenge.details.dateClockDeadline.getTime() / 1000)}:F>.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match clock deadline not passed yet.");
        }
    }

    //       #           ##    ##                            #  #                            ##   #                 ##       #  #  #                    ####                          #     #  #
    //       #            #     #                            #  #                           #  #  #                  #       #  #  #                    #                             #     ####
    //  ##   ###    ###   #     #     ##   ###    ###   ##   ####   ##   # #    ##    ###    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   ###   ###    ##   #  #   ###  ###   ####   ###  ###    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  #  #  ####  # ##  ##       #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  #     #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  #  ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  ##      ##   #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #     #  #  #  #  #  #   ##   #  #  #  #  # ##  #  #    ##
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##   #  #   ##   #  #   ##   ###     ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   ####  #  #   ##    ###  #     #  #  #  #   # #  ###   ###
    //                                            ###                                                                                                                            ###                    #
    /**
     * Validates that the challenge homes has enough maps.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {string} type The game type.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeHomesShouldHaveEnoughMaps(interaction, challenge, type, member) {
        if (!challenge.details.teamSize || type !== "TA") {
            return;
        }

        let homes;
        try {
            homes = await challenge.getHomeMaps(Challenge.getGameTypeForHomes(type, challenge.details.teamSize));
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

        if (!homes || homes.length < Validation.MAXIMUM_MAPS_PER_GAME_TYPE) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${challenge.details.homeMapTeam.name} does not have enough home maps set up for this game type and team size.  Try lowering the team size with \`/suggestteamsize\` and try again.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Home team does not have enough maps for this game mode.");
        }
    }

    //       #           ##    ##                            #  #                            ##   #                 ##       #  #  #         #    ###               ##             #        #  #
    //       #            #     #                            #  #                           #  #  #                  #       #  ## #         #     #                 #             #        ####
    //  ##   ###    ###   #     #     ##   ###    ###   ##   ####   ##   # #    ##    ###    #    ###    ##   #  #   #     ###  ## #   ##   ###    #    ###    ##    #    #  #   ###   ##   ####   ###  ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  #  #  ####  # ##  ##       #   #  #  #  #  #  #   #    #  #  # ##  #  #   #     #    #  #  #      #    #  #  #  #  # ##  #  #  #  #  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  ##      ##   #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #     #    #  #  #      #    #  #  #  #  ##    #  #  # ##  #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##   #  #   ##   #  #   ##   ###     ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###   #  #   ##   ###    ###   ###   ##   #  #   # #  ###
    //                                            ###                                                                                                                                                   #
    /**
     * Validates that the challenge homes doesn't include a map.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {MapTypes.MapData} map The map.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeHomesShouldNotIncludeMap(interaction, challenge, map, member) {
        if (challenge.details.homeMaps.indexOf(map.map) !== -1) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this is one of the home maps for the home map team, **${challenge.details.homeMapTeam.name}**, and cannot be used as a neutral map.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Home team's maps contains suggested map.");
        }
    }

    //       #           ##    ##                            ###      #   ##   #                 ##       #  ####         #            #
    //       #            #     #                             #       #  #  #  #                  #       #  #                         #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #     ###   #    ###    ##   #  #   #     ###  ###   #  #  ##     ###   ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    #  #    #   #  #  #  #  #  #   #    #  #  #      ##    #    ##      #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##     #    #  #  #  #  #  #  #  #  #  #   #    #  #  #      ##    #      ##    #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    ###   ##   #  #   ##    ###  ###    ###  ####  #  #  ###   ###      ##
    //                                            ###
    /**
     * Validates that the challenge ID exists.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {number} challengeId The challenge ID.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Challenge>} A promise that returns the challenge.
     */
    static async challengeIdShouldExist(interaction, challengeId, member) {
        let challenge;
        try {
            challenge = Challenge.getById(challengeId);
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

        if (!challenge) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this challenge does not exist.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Challenge ID doesn't exist.");
        }

        return challenge;
    }

    //       #           ##    ##                             ##   #                 ##       #  ###          ##                 #    #                         #
    //       #            #     #                            #  #  #                  #       #  #  #        #  #               # #                             #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ###    ##   #      ##   ###    #    ##    ###   # #    ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  #  #  ###    #    #  #  ####  # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #  #  #   #     #    #     #  #  ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  ###    ##    ##    ##   #  #   #    ###   #     #  #   ##    ###
    //                                            ###
    /**
     * Validates that a challenge is confirmed.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldBeConfirmed(interaction, challenge, member) {
        if (!challenge.details.dateConfirmed) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this match has not yet been confirmed.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match is not confirmed.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  ###         #                 #              #
    //       #            #     #                            #  #  #                  #       #  #  #        #                 #              #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ###    ##   #      ##    ##   # #    ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  #     ##    # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #     #  #  #     # #   ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  ###    ##   ####   ##    ##   #  #   ##    ###
    //                                            ###
    /**
     * Validates that a challenge is not locked.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldBeLocked(interaction, challenge, member) {
        if (!challenge.details.adminCreated) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this match is not locked.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match is not locked.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  ###          ##         ###   #            ##   ##                #
    //       #            #     #                            #  #  #                  #       #  #  #        #  #         #    #           #  #   #                #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ###    ##   #  #  ###    #    ###    ##   #      #     ##    ##   # #
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #    #  #  # ##  #      #    #  #  #     ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #   #    #  #  ##    #  #   #    #  #  #     # #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  ###    ##    ##   #  #   #    #  #   ##    ##   ###    ##    ##   #  #
    //                                            ###
    /**
     * Validates that a challenge is on the clock.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldBeOnTheClock(interaction, challenge, member) {
        if (!challenge.details.dateClockDeadline) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this challenge is not on the clock.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match is not on the clock.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  ###         ###                            #             #  ###         #                   #                ###
    //       #            #     #                            #  #  #                  #       #  #  #        #  #                           #             #  #  #        #                                     #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ###    ##   #  #   ##   ###    ##   ###   ###    ##    ###  ###   #  #  #      ##    ###   ##    ###    ###   #     ##    ###  # #
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##  ###   # ##  #  #  #  #  #  #   #    # ##  #  #  #  #  #  #  #     #  #  ##      #    #  #  #  #   #    # ##  #  #  ####
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    # #   ##    #  #  #  #  #      #    ##    #  #  #  #   # #  #     #  #    ##    #    #  #   ##    #    ##    # ##  #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  ###    ##   #  #   ##   ###    ##   #       ##   ##    ###  ###     #   ####   ##   ###    ###   #  #  #      #     ##    # #  #  #
    //                                            ###                                                                    #                                          #                                    ###
    /**
     * Validates that the challenge was reported by the losing team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<{winningScore: number, losingScore: number}>} A promise that returns the score.
     */
    static async challengeShouldBeReportedByLosingTeam(interaction, challenge, team, member) {
        let score1 = challenge.details.challengingTeamScore,
            score2 = challenge.details.challengedTeamScore;

        if (score1 > score2 && team.id === challenge.details.challengingTeamScore || score2 > score1 && team.id === challenge.details.challengedTeamScore) {
            try {
                await challenge.clearStats();
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
                        description: `Sorry, ${member}, but you can't report a win.  Have the other team use this command instead.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Winning team tried to report game.");
        }

        if (score2 > score1) {
            [score1, score2] = [score2, score1];
        }

        return {winningScore: score1, losingScore: score2};
    }

    //       #           ##    ##                             ##   #                 ##       #  ###          ##         #              #        ##             #
    //       #            #     #                            #  #  #                  #       #  #  #        #  #        #              #         #             #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ###    ##    #     ##   ###    ##    ###  #  #   #     ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##    #   #     #  #  # ##  #  #  #  #   #    # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #     #  #  ##    #  #  #  #   #    ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  ###    ##    ##    ##   #  #   ##    ###   ###  ###    ##    ###
    //                                            ###
    /**
     * Validates that a challenge is scheduled.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldBeScheduled(interaction, challenge, member) {
        if (!challenge.details.matchTime) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this challenge has not yet been scheduled.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match not scheduled.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #                     ##   ##    ##     ##    #           #
    //       #            #     #                            #  #  #                  #       #  #  #                    #  #   #     #    #  #   #           #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   #  #   #     #     #    ###    ###  ###    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  ####   #     #      #    #    #  #   #    ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #  #   #     #    #  #   #    # ##   #      ##
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   #  #  ###   ###    ##     ##   # #    ##  ###
    //                                            ###
    /**
     * Validates that a challenge has all stats.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<ChallengeTypes.GamePlayerStatsByTeam>} A promise that resolves when the validation is complete.
     */
    static async challengeShouldHaveAllStats(interaction, challenge, member) {
        const stats = {};
        try {
            stats.challengingTeamStats = await challenge.getStatsForTeam(challenge.challengingTeam);
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

        if (stats.challengingTeamStats.length > 0 && stats.challengingTeamStats.length !== challenge.details.teamSize) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${challenge.challengingTeam.tag}** has **${stats.challengingTeamStats.length}** player stats and this match requires **${challenge.details.teamSize}**.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Insufficient number of stats.");
        }

        try {
            stats.challengedTeamStats = await challenge.getStatsForTeam(challenge.challengedTeam);
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

        if (stats.challengedTeamStats.length > 0 && stats.challengedTeamStats.length !== challenge.details.teamSize) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${challenge.challengedTeam.tag}** has **${stats.challengedTeamStats.length}** player stats and this match requires **${challenge.details.teamSize}**.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Insufficient number of stats.");
        }

        if (stats.challengingTeamStats.length !== stats.challengedTeamStats.length) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must enter stats for either both teams or neither team.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Mismatched number of stats.");
        }

        return stats;
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #                     ##                 #
    //       #            #     #                            #  #  #                  #       #  #  #                    #  #                #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   #      ###   ###   ###    ##   ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  #     #  #  ##      #    # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #  #  # ##    ##    #    ##    #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##    ##    # #  ###      ##   ##   #
    //                                            ###
    /**
     * Validates that a challenge has a caster.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldHaveCaster(interaction, challenge, member) {
        if (!challenge.details.caster) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this match has no caster.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Caster is not set.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #                    ###          #           #    ##
    //       #            #     #                            #  #  #                  #       #  #  #                    #  #         #                 #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   #  #   ##   ###    ###  ##     #     ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  #  #  # ##   #    #  #   #     #    ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #  #  ##     #    # ##   #     #      ##
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   ###    ##     ##   # #  ###   ###   ###
    //                                            ###
    /**
     * Validates that a challenge should have details.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldHaveDetails(interaction, challenge, member) {
        try {
            await challenge.loadDetails();
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

    //       #           ##    ##                             ##   #                 ##       #  #  #                    #  #
    //       #            #     #                            #  #  #                  #       #  #  #                    ####
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   ####   ###  ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  #  #  #  #  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #  #  # ##  #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   #  #   # #  ###
    //                                            ###                                                                                #
    /**
     * Validates that a challenge should have a map.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldHaveMap(interaction, challenge, member) {
        if (!challenge.details.map) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but the map for this match has not been set yet.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Map not set.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #                    ###                      ##    #
    //       #            #     #                            #  #  #                  #       #  #  #                     #                      #  #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ####   ###  # #    ##    #     ##    ###  # #    #    ##    ####   ##
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##   #    # ##  #  #  ####    #    #      #   # ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##     #    ##    # ##  #  #  #  #   #     #    ##
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##    #     ##    # #  #  #   ##   ###   ####   ##
    //                                            ###
    /**
     * Validates that a challenge has a team size.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldHaveTeamSize(interaction, challenge, member) {
        if (challenge.details.gameType === "TA" && !challenge.details.teamSize) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must agree to a team size first.  Use \`/suggestteamsize\` to suggest a team size for this challenge.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team size not set.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    ###          ##                 #    #                         #
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #        #  #               # #                             #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #      ##   ###    #    ##    ###   # #    ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #     #  #  #  #  ###    #    #  #  ####  # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  #  #  #  #   #     #    #     #  #  ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##    ##   #  #   #    ###   #     #  #   ##    ###
    //                                            ###
    /**
     * Validates that a challenge is not confirmed.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotBeConfirmed(interaction, challenge, member) {
        if (challenge.details.dateConfirmed) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this match has already been confirmed.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match was already confirmed.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    ###         #                 #              #
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #        #                 #              #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #      ##    ##   # #    ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #     #  #  #     ##    # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #     #  #  #     # #   ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   ####   ##    ##   #  #   ##    ###
    //                                            ###
    /**
     * Validates that a challenge is not locked.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotBeLocked(interaction, challenge, member) {
        if (challenge.details.adminCreated) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this match is locked.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match is locked.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    ###          ##         ###   #            ##   ##                #
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #        #  #         #    #           #  #   #                #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #  ###    #    ###    ##   #      #     ##    ##   # #
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #  #  #  #   #    #  #  # ##  #      #    #  #  #     ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  #  #   #    #  #  ##    #  #   #    #  #  #     # #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##   #  #   #    #  #   ##    ##   ###    ##    ##   #  #
    //                                            ###
    /**
     * Validates that a challenge is not on the clock.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotBeOnTheClock(interaction, challenge, member) {
        if (challenge.details.dateClocked) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this challenge is currently on the clock.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match is on the clock.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    ###         ###                     ##     #                   #
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #        #  #                     #                         #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #   ##   ###    ###   #    ##    ####   ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  ###   # ##  #  #  #  #   #     #      #   # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #     ##    #  #  # ##   #     #     #    ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   #      ##   #  #   # #  ###   ###   ####   ##    ###
    //                                            ###
    /**
     * Validates that a challenge is not penalized.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotBePenalized(interaction, challenge, member) {
        if (challenge.details.challengingTeamPenalized || challenge.details.challengedTeamPenalized) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but due to penalties to ${challenge.details.challengingTeamPenalized && challenge.details.challengedTeamPenalized ? "both teams" : challenge.details.challengingTeamPenalized ? `**${challenge.challengingTeam.name}**` : `**${challenge.challengedTeam.name}**`}, this command is not available.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match is penalized.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    ###         ###                      #          #              #
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #        #  #                     #          #              #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #   ##   # #    ###  ###    ##   ###    ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  ###   # ##  ####  #  #   #    #     #  #  # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    # #   ##    #  #  # ##   #    #     #  #  ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   #  #   ##   #  #   # #    ##   ##   #  #   ##    ###
    //                                            ###
    /**
     * Validates that a challenge is not penalized.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotBeRematched(interaction, challenge, member) {
        if (challenge.details.dateRematched) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but a rematch for this challenge has already been created.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Already rematched.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    ###          ##         #              #        ##             #
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #        #  #        #              #         #             #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##    #     ##   ###    ##    ###  #  #   #     ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##    #   #     #  #  # ##  #  #  #  #   #    # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  #     #  #  ##    #  #  #  #   #    ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##    ##   #  #   ##    ###   ###  ###    ##    ###
    //                                            ###
    /**
     * Validates that a challenge is not scheduled.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotBeScheduled(interaction, challenge, member) {
        if (challenge.details.matchTime) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this challenge has already been scheduled.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match already scheduled.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    ###         #  #         #       #           #
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #        #  #                 #           #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #   ##   ##     ###   ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #  #  #  #   #    #  #  # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##     ##   #  #   #    #  #  ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##    ##   ###    ###   ##    ###
    //                                            ###
    /**
     * Validates that a challenge is not voided.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotBeVoided(interaction, challenge, member) {
        if (challenge.details.dateVoided) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this match is voided.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Match is voided.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    #  #                     ##                 #
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #                    #  #                #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##   #      ###   ###   ###    ##   ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##  #     #  #  ##      #    # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##    #  #  # ##    ##    #    ##    #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##    ##    # #  ###      ##   ##   #
    //                                            ###
    /**
     * Validates that a challenge does not have a caster.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotHaveCaster(interaction, challenge, member) {
        if (challenge.details.caster) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${challenge.details.caster} is scheduled to cast this match.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Caster is already set.");
        }
    }

    //       #           ##    ##                             ##   #                 ##       #  #  #         #    #  #                    #  #                     #    #                  #                   #  ###   ##
    //       #            #     #                            #  #  #                  #       #  ## #         #    #  #                    #  #                     #    #                                      #  #  #   #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##   #  #  ###    ###  #  #  ###   ###    ##   ###   ##    ####   ##    ###  #  #   #     ###  #  #   ##   ###    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##  #  #  #  #  #  #  #  #   #    #  #  #  #  #  #   #      #   # ##  #  #  ###    #    #  #  #  #  # ##  #  #  ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##    #  #  #  #  # ##  #  #   #    #  #  #  #  #      #     #    ##    #  #  #      #    # ##   # #  ##    #       ##
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##    ##   #  #   # #   ###    ##  #  #   ##   #     ###   ####   ##    ###  #     ###    # #    #    ##   #     ###
    //                                            ###                                                                                                                                                                                 #
    /**
     * Validates that a challenge has no unauthroized players.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async challengeShouldNotHaveUnauthorizedPlayers(interaction, challenge, member) {
        if (challenge.details.restricted) {
            let details;
            try {
                details = await challenge.getTeamDetails();
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
            const unauthorized = details.stats.filter((stat) => !stat.authorized);

            if (unauthorized.length > 0) {
                try {
                    await challenge.clearStats();
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
                            description: `Sorry, ${member}, but the following players are unauthorized to play in this match: ${unauthorized.map((player) => player.name).join(", ")}`,
                            color: 0xff0000
                        })
                    ]
                });
                throw new Warning("Unauthorized players in match.");
            }
        }
    }

    //       #           ##    ##                             ##    #           #            ##   #                 ##       #  ###          ##      #     #           #
    //       #            #     #                            #  #   #           #           #  #  #                  #       #  #  #        #  #     #     #           #
    //  ##   ###    ###   #     #     ##   ###    ###   ##    #    ###    ###  ###    ###    #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   ###   ##    ###
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #    #    #  #   #    ##       #   #  #  #  #  #  #   #    #  #  #  #  # ##  ####  #  #  #  #  # ##  #  #
    // #     #  #  # ##   #     #    ##    #  #   ##   ##    #  #   #    # ##   #      ##   #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #  #  #  ##    #  #
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##     ##   # #    ##  ###     ##   #  #   ##    ###  ###    ###  ###    ##   #  #   ###   ###   ##    ###
    //                                            ###
    /**
     * Validates that challenge stats are added successfully.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {number} gameId The game ID.
     * @param {boolean} requireConfirmation Whether to require confirmation.
     * @param {number} timestamp The timestamp.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<ChallengeTypes.GameBoxScore>} A promise that resolves when the validation is complete.
     */
    static async challengeStatsShouldBeAdded(interaction, challenge, gameId, requireConfirmation, timestamp, member) {
        let boxScore;
        try {
            boxScore = await challenge.addStats(+gameId, requireConfirmation, timestamp);
        } catch (err) {
            if (!requireConfirmation) {
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but there was a problem with adding stats to this match.  ${err.message}.`,
                            color: 0xff0000
                        })
                    ]
                });
                throw new Warning(err.message);
            } else if (err.constructor.name === "Error") {
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but there was a problem with reporting this match using the tracker URL.  You can still report the score of this match using \`/reportscore\` followed by the score using a space to separate the scores, for example \`/reportscore 49 27\`.`,
                            color: 0xff0000
                        })
                    ]
                });
                throw new Warning(err.message);
            } else {
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

        return boxScore;
    }

    //    #         #           ##   #                 ##       #  ###         #  #        ##     #       #
    //    #         #          #  #  #                  #       #  #  #        #  #         #             #
    //  ###   ###  ###    ##    #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   #    ##     ###
    // #  #  #  #   #    # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #     #    #  #
    // #  #  # ##   #    ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##     ##   # ##   #     #    #  #
    //  ###   # #    ##   ##    ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###   ###    ###
    /**
     * Validates that a date is valid.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} datetime The datetime string.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Date>} A promise that returns the date.
     */
    static async dateShouldBeValid(interaction, datetime, member) {
        const now = new Date();
        if (datetime.toLowerCase() === "now") {
            return new Date(now.getTime() + (300000 - now.getTime() % 300000));
        }

        const tz = tc.TimeZone.zone(await member.getTimezone());

        let date;
        try {
            date = new Date(new tc.DateTime(new Date(`${datetime} UTC`).toISOString(), tz).toIsoString());
        } catch (_) {
            try {
                date = new Date(new tc.DateTime(new Date(`${now.toDateString()} ${datetime} UTC`).toISOString(), tz).toIsoString());
                date.setDate(date.getDate() - 1);
                while (date.getTime() < now.getTime()) {
                    date.setDate(date.getDate() + 1);
                }
            } catch (err) {
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but I couldn't parse that date and time.`,
                            color: 0xff0000
                        })
                    ]
                });
                throw new Warning("Invalid date.");
            }
        }

        if (!date || isNaN(date.valueOf())) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I couldn't parse that date and time.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid date.");
        }

        if (date.getFullYear() === 2001 && datetime.indexOf("2001") === -1) {
            date = new Date(`${datetime} UTC`);
            date.setFullYear(now.getFullYear());
            date = new Date(new tc.DateTime(date.toISOString(), tz).toIsoString());
            if (date.getTime() < now.getTime()) {
                date.setFullYear(now.getFullYear() + 1);
            }
        }

        if (!date || isNaN(date.valueOf())) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I couldn't parse that date and time.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid date.");
        }

        return date;
    }

    // #                       #      #            #     ##   #                 ##       #  #  #                    ###
    // #                       #                   #    #  #  #                  #       #  #  #                    #  #
    // ###    ##   # #    ##   #     ##     ###   ###    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   #  #   ##    ##   # #
    // #  #  #  #  ####  # ##  #      #    ##      #      #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  ###   #  #  #  #  ####
    // #  #  #  #  #  #  ##    #      #      ##    #    #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    # #   #  #  #  #  #  #
    // #  #   ##   #  #   ##   ####  ###   ###      ##   ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   #  #   ##    ##   #  #
    /**
     * Validates that a home list has room for another home.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string[]} homes The home list.
     * @param {string} type The game type.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async homeListShouldHaveRoom(interaction, homes, type, member) {
        if (homes.length >= MAXIMUM_MAPS_PER_GAME_TYPE) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you already have ${MAXIMUM_MAPS_PER_GAME_TYPE} ${type} home maps.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team already has this home map set.");
        }
    }

    //  #           #                             #     #                 ##   #                 ##       #  ###         ###          ##   #           ##    ##                             ##   #                             ##
    //              #                             #                      #  #  #                  #       #  #  #         #          #  #  #            #     #                            #  #  #                              #
    // ##    ###   ###    ##   ###    ###   ##   ###   ##     ##   ###    #    ###    ##   #  #   #     ###  ###    ##    #    ###   #     ###    ###   #     #     ##   ###    ###   ##   #     ###    ###  ###   ###    ##    #
    //  #    #  #   #    # ##  #  #  #  #  #      #     #    #  #  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##   #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #     #  #  #  #  #  #  #  #  # ##   #
    //  #    #  #   #    ##    #     # ##  #      #     #    #  #  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  ##     #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  #  #  # ##  #  #  #  #  ##     #
    // ###   #  #    ##   ##   #      # #   ##     ##  ###    ##   #  #   ##   #  #   ##    ###  ###    ###  ###    ##   ###   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##   #  #   # #  #  #  #  #   ##   ###
    //                                                                                                                                                                          ###
    /**
     * Validates that an interaction took place in a challenge channel.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Challenge>} A promise that returns the challenge.
     */
    static async interactionShouldBeInChallengeChannel(interaction, member) {
        try {
            return await Challenge.getByChannel(interaction.channel);
        } catch (err) {
            await interaction.reply({
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

    // ##                ###          #     #                ####
    //  #                #  #         #     #                #
    //  #     ##    ###  ###   #  #  ###   ###    ##   ###   ###   ###   ###    ##   ###
    //  #    #  #  #  #  #  #  #  #   #     #    #  #  #  #  #     #  #  #  #  #  #  #  #
    //  #    #  #   ##   #  #  #  #   #     #    #  #  #  #  #     #     #     #  #  #
    // ###    ##   #     ###    ###    ##    ##   ##   #  #  ####  #     #      ##   #
    //              ###
    /**
     * Logs a button error.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.ButtonInteraction} buttonInteraction The interaction.
     * @param {Error} err The error.
     * @returns {void}
     */
    static logButtonError(interaction, buttonInteraction, err) {
        if (err instanceof Warning) {
            Log.warning(`${interaction.channel} ${buttonInteraction.user}: ${interaction} - Button Response - ${err.message || err}`);
        } else if (err instanceof Exception) {
            Log.exception(`${interaction.channel} ${buttonInteraction.user}: ${interaction} - Button Response - ${err.message}`, err.innerError);
        } else {
            Log.exception(`${interaction.channel} ${buttonInteraction.user}: ${interaction} - Button Response`, err);
        }
    }

    //                   #  #         #    ###    #          #              #  ####              ##     #                ###          ##                #
    //                   ## #         #    #  #              #              #  #                  #                       #          #  #
    // # #    ###  ###   ## #   ##   ###   #  #  ##     ##   # #    ##    ###  ###    ###  ###    #    ##     ##   ###    #    ###    #     ##   ###   ##     ##    ###
    // ####  #  #  #  #  # ##  #  #   #    ###    #    #     ##    # ##  #  #  #     #  #  #  #   #     #    # ##  #  #   #    #  #    #   # ##  #  #   #    # ##  ##
    // #  #  # ##  #  #  # ##  #  #   #    #      #    #     # #   ##    #  #  #     # ##  #      #     #    ##    #      #    #  #  #  #  ##    #      #    ##      ##
    // #  #   # #  ###   #  #   ##     ##  #     ###    ##   #  #   ##    ###  ####   # #  #     ###   ###    ##   #     ###   #  #   ##    ##   #     ###    ##   ###
    //             #
    /**
     * Validates that a map was not picked by this team earlier in the series.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {number} option The map option.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async mapNotPickedEarlierInSeries(interaction, option, challenge, member) {
        if (!challenge.details.title || !seriesTitleParse.test(challenge.details.title)) {
            return;
        }

        const {groups: {base, game}} = seriesTitleParse.exec(challenge.details.title),
            gameNum = +game;

        if (gameNum === 1) {
            return;
        }

        const challenges = await challenge.getAllByBaseTitleBeforeGame(base, gameNum);

        if (challenges.length === 0) {
            return;
        }

        const homeMaps = await challenge.getHomeMaps(Challenge.getGameTypeForHomes(challenge.details.gameType, challenge.details.teamSize));

        for (const previousChallenge of challenges) {
            if (challenge.challengedTeam.id !== previousChallenge.challengedTeam.id) {
                continue;
            }

            Validation.challengeShouldHaveDetails(interaction, previousChallenge, member);

            if (homeMaps[option - 1] === previousChallenge.details.map) {
                await interaction.reply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but this map for the home team was picked earlier in the series.  Please pick a different map.`,
                            color: 0xff0000
                        })
                    ]
                });
                throw new Warning("Map was used earlier in the series.");
            }
        }
    }

    //                    ##   #                 ##       #  #  #         #    ###          ##    #                #
    //                   #  #  #                  #       #  ## #         #    #  #        #  #   #                #
    // # #    ###  ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##    #    ###    ##    ##   # #
    // ####  #  #  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##    #    #    #  #  #     ##
    // #  #  # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #   #    #  #  #     # #
    // #  #   # #  ###    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##     ##   ##    ##   #  #
    //             #
    /**
     * Validates that a map is not valid for the type.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {MapTypes.MapData} mapData The map.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async mapShouldNotBeStock(interaction, mapData, member) {
        if (mapData.stock) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but that is a stock map.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Map is a stock map.");
        }
    }

    //                    ##   #                 ##       #  #  #         #    ###         #  #        ##     #       #
    //                   #  #  #                  #       #  ## #         #    #  #        #  #         #             #
    // # #    ###  ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #   ###   #    ##     ###
    // ####  #  #  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #  #  #  #   #     #    #  #
    // #  #  # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##     ##   # ##   #     #    #  #
    // #  #   # #  ###    ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##    # #  ###   ###    ###
    //             #
    /**
     * Validates that a map is not valid for the type.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} type The game type.
     * @param {string} map The map.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async mapShouldNotBeValid(interaction, type, map, member) {
        let mapData;
        try {
            mapData = await Map.validate(map, ["2v2", "3v3", "4v4+"].indexOf(type) === -1 ? type : "TA");
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

        if (mapData) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but that map is currently allowed.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Map currently allowed.");
        }
    }

    //                    ##   #                 ##       #  ###         #  #        ##     #       #
    //                   #  #  #                  #       #  #  #        #  #         #             #
    // # #    ###  ###    #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   #    ##     ###
    // ####  #  #  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #     #    #  #
    // #  #  # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  ##     ##   # ##   #     #    #  #
    // #  #   # #  ###    ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###   ###    ###
    //             #
    /**
     * Validates that a map is valid for the type.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} type The game type.
     * @param {string} map The map.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<MapTypes.MapData>} A promise that returns the map data.
     */
    static async mapShouldBeValid(interaction, type, map, member) {
        let mapData;
        try {
            mapData = await Map.validate(map, ["2v2", "3v3", "4v4+"].indexOf(type) === -1 ? type : "TA");
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

        if (!mapData) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but that is not a map you can use.  See https://otl.gg/maplist for a complete list of maps you can use.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid map.");
        }

        return mapData;
    }

    //                   #                  ##   #                 ##       #  ###          ##   ##    ##                         #  ###         ###          ##                #           #
    //                   #                 #  #  #                  #       #  #  #        #  #   #     #                         #   #          #  #        #  #               #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #   #     #     ##   #  #   ##    ###   #     ##   ###    ##   #      ###  ###   ###    ###  ##    ###
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  ####   #     #    #  #  #  #  # ##  #  #   #    #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #   #     #    #  #  ####  ##    #  #   #    #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##   #  #  ###   ###    ##   ####   ##    ###   #     ##   ###    ##    ##    # #  ###     ##   # #  ###   #  #
    //                                                                                                                                                                   #
    /**
     * Validates that the member is allowed to be a team captain.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldBeAllowedToBeCaptain(interaction, member) {
        let canBeCaptain;
        try {
            canBeCaptain = await member.canBeCaptain();
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

        if (!canBeCaptain) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but due to past penalties, you are not allowed to be a team captain or founder.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is penalized from being a team captain or founder.");
        }
    }

    //                   #                  ##   #                 ##       #  ###          ##   ##    ##                         #  ###            #         #           ##   ###
    //                   #                 #  #  #                  #       #  #  #        #  #   #     #                         #   #             #                    #  #   #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #   #     #     ##   #  #   ##    ###   #     ##      #   ##   ##    ###   #  #   #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  ####   #     #    #  #  #  #  # ##  #  #   #    #  #     #  #  #   #    #  #  ####   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #   #     #    #  #  ####  ##    #  #   #    #  #  #  #  #  #   #    #  #  #  #   #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##   #  #  ###   ###    ##   ####   ##    ###   #     ##    ##    ##   ###   #  #  #  #   #     ##    # #  #  #
    /**
     * Validates that the member is allowed to join a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldBeAllowedToJoinATeam(interaction, member) {
        let deniedUntil;
        try {
            deniedUntil = await member.joinTeamDeniedUntil();
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

        if (deniedUntil) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you have accepted a team's invitation in the past 28 days.  You cannot use this command until <t:${Math.floor(deniedUntil.getTime() / 1000)}:F>.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member already accepted an invitation within 28 days.");
        }
    }

    //                   #                  ##   #                 ##       #  ###          ##                #           #           ##         ####                       #
    //                   #                 #  #  #                  #       #  #  #        #  #               #                      #  #        #                          #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #
    //                                                                                                 #
    /**
     * Validates that the member is a captain or founder.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldBeCaptainOrFounder(interaction, member) {
        if (!member.isCaptainOrFounder()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must be a team captain or founder to use this command.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is not a captain or founder.");
        }
    }

    //                   #                  ##   #                 ##       #  ###          ##                 #
    //                   #                 #  #  #                  #       #  #  #        #  #                #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #      ###   ###   ###    ##   ###
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  ##      #    # ##  #  #
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  # ##    ##    #    ##    #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###      ##   ##   #
    /**
     * Validates that a member is a caster for a challenge.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldBeCaster(interaction, challenge, member) {
        if (challenge.details.caster.id !== member.id) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${challenge.details.caster} is scheduled to cast this match, not you.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is not caster for challenge.");
        }
    }

    //                   #                  ##   #                 ##       #  ###          ##                      #     #                #  #              ###
    //                   #                 #  #  #                  #       #  #  #        #  #                     #                      ## #               #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #     ###    ##    ###  ###   ##    ###    ###  ## #   ##   #  #   #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  # ##  #  #   #     #    #  #  #  #  # ##  # ##  #  #   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #     ##    # ##   #     #    #  #   ##   # ##  ##    ####   #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##    ##   #      ##    # #    ##  ###   #  #  #     #  #   ##   ####   #     ##    # #  #  #
    //                                                                                                                                ###
    /**
     * Validates that the member is creating a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<NewTeam>} A promise that returns the new team when the validation is complete.
     */
    static async memberShouldBeCreatingNewTeam(interaction, member) {
        let newTeam;
        try {
            newTeam = await member.getNewTeam();
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

        if (!newTeam) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you can only use this command when you're in the process of creating a new team.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is not in the process of starting a team.");
        }

        return newTeam;
    }

    //                   #                  ##   #                 ##       #  ###         ####                       #
    //                   #                 #  #  #                  #       #  #  #        #                          #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   ###    ##   #  #  ###    ###   ##   ###
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #     #  #  #  #  #  #  #  #  ##    #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##   #      ##    ###  #  #   ###   ##   #
    /**
     * Validates that the member is a founder.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldBeFounder(interaction, member) {
        if (!member.isFounder()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must be a team founder to use this command.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is not a founder.");
        }
    }

    //                   #                  ##   #                 ##       #  ###          ##          ##   ###
    //                   #                 #  #  #                  #       #  #  #        #  #        #  #   #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  ###   #  #   #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #  ####   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #  #  #   #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##    ##   #  #  #  #   #     ##    # #  #  #
    /**
     * Validates that the member is on a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Team>} A promise that returns the team the member is on.
     */
    static async memberShouldBeOnATeam(interaction, member) {
        let team;
        try {
            team = await member.getTeam();
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

        if (!team) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must be on a team to use this command.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is not currently on a team.");
        }

        return team;
    }

    //                   #                  ##   #                 ##       #  ###          ##
    //                   #                 #  #  #                  #       #  #  #        #  #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  #  #  ###    ##   ###
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #  #  #  # ##  #  #
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  ####  #  #  ##    #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##    ##   ####  #  #   ##   #
    /**
     * Validates that the member is the guild owner.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldBeOwner(interaction, member) {
        if (!Discord.isOwner(member)) {
            await interaction.deleteReply();
            throw new Warning("Member is not owner.");
        }
    }

    //                   #                  ##   #                 ##       #  ###         ###          #                ###                      ##                #           #           ##         ####                       #
    //                   #                 #  #  #                  #       #  #  #        #  #                           #                      #  #               #                      #  #        #                          #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  ###   ##     ##   ###    #     ##    ###  # #   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  ###   #  #   #    #  #  #  #   #    # ##  #  #  ####  #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #     #      #    #  #  #      #    ##    # ##  #  #  #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  ###    ##   #     #     ###    ##   #      #     ##    # #  #  #   ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #
    //                                                                                                                                                       #
    /**
     * Validates that the member was a prior captain or founder of a specified team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldBePriorTeamCaptainOrFounder(interaction, team, member) {
        let wasCaptain;
        try {
            wasCaptain = await member.wasPreviousCaptainOrFounderOfTeam(team);
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

        if (!wasCaptain) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must have been a captain or founder of the team you are trying to reinstate.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member was not a prior captain or founder of this team.");
        }
    }

    //                   #                  ##   #                 ##       #  #  #                    ###                #     #          ####                    ###
    //                   #                 #  #  #                  #       #  #  #                     #                       #          #                        #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ####   ###  # #    ##    #    ###   # #   ##    ###    ##   ###   ###    ##   # #    #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##   #    #  #  # #    #     #    # ##  #     #  #  #  #  ####   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##     #    #  #  # #    #     #    ##    #     #     #  #  #  #   #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   ###   #  #   #    ###     ##   ##   #     #      ##   #  #   #     ##    # #  #  #
    /**
     * Validates that the member has an invitation from a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldHaveInviteFromTeam(interaction, team, member) {
        let hasBeenInvited;
        try {
            hasBeenInvited = await member.hasBeenInvitedToTeam(team);
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

        if (!hasBeenInvited) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you don't have a pending invitation to **${team.name}**.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member does not have an invitation to accept.");
        }
    }

    //                   #                  ##   #                 ##       #  #  #                    ###          #     #          #     #  #
    //                   #                 #  #  #                  #       #  #  #                     #                 #          #     ## #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ####   ###  # #    ##    #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##   #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##     #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##    #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
    /**
     * Validates that the member has a Twitch name.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<string>} A promise that returns the Twitch name.
     */
    static async memberShouldHaveTwitchName(interaction, member) {
        let twitchName;
        try {
            twitchName = await member.getTwitchName();
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

        if (!twitchName) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you haven't linked your Twitch channel yet!  Use the \`/twitch\` command to link your Twitch channel.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Twitch channel not linked.");
        }

        return twitchName;
    }

    //                   #                  ##   #                 ##       #  #  #         #    ###         ###                              #  ####                    ###
    //                   #                 #  #  #                  #       #  ## #         #    #  #        #  #                             #  #                        #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   ###    ###  ###   ###    ##    ###  ###   ###    ##   # #    #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #  #  #  #  #  #  #  #  # ##  #  #  #     #  #  #  #  ####   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  # ##  #  #  #  #  ##    #  #  #     #     #  #  #  #   #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   ###    # #  #  #  #  #   ##    ###  #     #      ##   #  #   #     ##    # #  #  #
    /**
     * Validates that the member is not banned from a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldNotBeBannedFromTeam(interaction, team, member) {
        let bannedUntil;
        try {
            bannedUntil = await member.bannedFromTeamUntil(team);
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

        if (bannedUntil && bannedUntil.getTime() > Date.now()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you have left this team within the past 28 days.  You cannot use this command until <t:${Math.floor(bannedUntil.getTime() / 1000)}:F>.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member not allowed to accept an invite from this team.");
        }
    }

    //                   #                  ##   #                 ##       #  #  #         #    ###          ##                      #     #                ###
    //                   #                 #  #  #                  #       #  ## #         #    #  #        #  #                     #                       #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #     ###    ##    ###  ###   ##    ###    ###   #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #     #  #  # ##  #  #   #     #    #  #  #  #   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  #     ##    # ##   #     #    #  #   ##    #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##   #      ##    # #    ##  ###   #  #  #      #     ##    # #  #  #
    //                                                                                                                                                  ###
    /**
     * Validates that the member is not creating a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldNotBeCreatingTeam(interaction, member) {
        let newTeam;
        try {
            newTeam = await member.getNewTeam();
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

        if (newTeam) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you are currently in the process of starting a team!  Visit ${newTeam.channel} to get started, or \`/cancel\` to cancel your new team creation.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is currently in the process of starting a team.");
        }
    }

    //                   #                  ##   #                 ##       #  #  #         #    ###         ####                       #
    //                   #                 #  #  #                  #       #  ## #         #    #  #        #                          #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   ###    ##   #  #  ###    ###   ##   ###
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #     #  #  #  #  #  #  #  #  ##    #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   #      ##    ###  #  #   ###   ##   #
    /**
     * Validates that the member is not a founder.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldNotBeFounder(interaction, member) {
        if (member.isFounder()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you cannot use this command as a team founder.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is a founder.");
        }
    }

    //                   #                  ##   #                 ##       #  #  #         #    ###          ##          ##   ###
    //                   #                 #  #  #                  #       #  ## #         #    #  #        #  #        #  #   #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #  ###   #  #   #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #  #  #  #  ####   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  #  #  #  #   #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##   #  #  #  #   #     ##    # #  #  #
    /**
     * Validates that the member is not on a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldNotBeOnATeam(interaction, member) {
        let team;
        try {
            team = await member.getTeam();
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

        if (team) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you are currently on **${team.name}**!  Visit your team channel at ${team.teamChannel} to talk with your teammates, or use \`/leave\` to leave your current team.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member is currently on a team.");
        }
    }

    //                   #                  ##   #                 ##       #  #  #         #    #  #                    ###                #     #          ####                    ###
    //                   #                 #  #  #                  #       #  ## #         #    #  #                     #                       #          #                        #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##    #    ###   # #   ##    ###    ##   ###   ###    ##   # #    #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##   #    #  #  # #    #     #    # ##  #     #  #  #  #  ####   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##     #    #  #  # #    #     #    ##    #     #     #  #  #  #   #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##   ###   #  #   #    ###     ##   ##   #     #      ##   #  #   #     ##    # #  #  #
    /**
     * Validates that the member does not have an invitation from a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldNotHaveInviteFromTeam(interaction, team, member) {
        let hasBeenInvited;
        try {
            hasBeenInvited = await member.hasBeenInvitedToTeam(team);
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

        if (hasBeenInvited) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you have already been invited to this team.  Type \`/accept ${team.tag.toLowerCase()}\` to join **${team.name}**.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member already has invitation from team.");
        }
    }

    //                   #                  ##   #                 ##       #  #  #         #    #  #                    ###                                   #    ###         ###
    //                   #                 #  #  #                  #       #  ## #         #    #  #                    #  #                                  #     #           #
    // # #    ##   # #   ###    ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##   #  #   ##    ###  #  #   ##    ###   ###    #     ##    #     ##    ###  # #
    // ####  # ##  ####  #  #  # ##  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##  ###   # ##  #  #  #  #  # ##  ##      #     #    #  #   #    # ##  #  #  ####
    // #  #  ##    #  #  #  #  ##    #     #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##    # #   ##    #  #  #  #  ##      ##    #     #    #  #   #    ##    # ##  #  #
    // #  #   ##   #  #  ###    ##   #      ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##   #  #   ##    ###   ###   ##   ###      ##   #     ##    #     ##    # #  #  #
    //                                                                                                                                  #
    /**
     * Validates that the member does not have a request out to a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async memberShouldNotHaveRequestToTeam(interaction, team, member) {
        let hasRequested;
        try {
            hasRequested = await member.hasRequestedTeam(team);
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

        if (hasRequested) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you may only request to join a team once.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Request already exists.");
        }

    }

    //                   ###                      ##   #                 ##       #  #  #                    #  #
    //                    #                      #  #  #                  #       #  #  #                    ## #
    // ###    ##   #  #   #     ##    ###  # #    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   ## #   ###  # #    ##
    // #  #  # ##  #  #   #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  # ##  #  #  ####  # ##
    // #  #  ##    ####   #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    # ##  # ##  #  #  ##
    // #  #   ##   ####   #     ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   #  #   # #  #  #   ##
    /**
     * Validates that the new team has a name.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {NewTeam} newTeam The new team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async newTeamShouldHaveName(interaction, newTeam, member) {
        if (!newTeam.name) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must use the \`/name\` command to give your team a name before completing your request to create a team.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team not yet given a name.");
        }
    }

    //                   ###                      ##   #                 ##       #  #  #                    ###
    //                    #                      #  #  #                  #       #  #  #                     #
    // ###    ##   #  #   #     ##    ###  # #    #    ###    ##   #  #   #     ###  ####   ###  # #    ##    #     ###   ###
    // #  #  # ##  #  #   #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##   #    #  #  #  #
    // #  #  ##    ####   #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##     #    # ##   ##
    // #  #   ##   ####   #     ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##    #     # #  #
    //                                                                                                                    ###
    /**
     * Validates that the new team has a tag.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {NewTeam} newTeam The new team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async newTeamShouldHaveTag(interaction, newTeam, member) {
        if (!newTeam.tag) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must use the \`/tag\` command to give your team a tag before completing your request to create a team.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team not yet given a tag.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  ###          ##   ##    ##                         #  ###         ###          ##                #           #
    //              #           #    #  #  #                  #       #  #  #        #  #   #     #                         #   #          #  #        #  #               #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #   #     #     ##   #  #   ##    ###   #     ##   ###    ##   #      ###  ###   ###    ###  ##    ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  ####   #     #    #  #  #  #  # ##  #  #   #    #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #   #     #    #  #  ####  ##    #  #   #    #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##   #  #  ###   ###    ##   ####   ##    ###   #     ##   ###    ##    ##    # #  ###     ##   # #  ###   #  #
    // #                                                                                                                                                           #
    /**
     * Validates that the pilot is allowed to be a team captain.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldBeAllowedToBeCaptain(interaction, pilot, member) {
        let canBeCaptain;
        try {
            canBeCaptain = await pilot.canBeCaptain();
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

        if (!canBeCaptain) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but due to past penalties, ${pilot} is not allowed to be a team captain or a founder.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is penalized from being a team captain or founder.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  ###          ##          #    #                  #                   #
    //              #           #    #  #  #                  #       #  #  #        #  #         #    #                                      #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  #  #  ###   ###    ##   ###   ##    ####   ##    ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  ####  #  #   #    #  #  #  #  #  #   #      #   # ##  #  #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #   #    #  #  #  #  #      #     #    ##    #  #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##   #  #   ###    ##  #  #   ##   #     ###   ####   ##    ###
    // #
    /**
     * Validates that a pilot is authorized to play in a match.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.User} pilot The pilot.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldBeAuthorized(interaction, pilot, challenge, member) {
        if (!challenge.details.postseason && !challenge.details.restricted) {
            return;
        }

        let authorized;
        try {
            authorized = await pilot.isAuthorized();
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

        if (!authorized) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is not authorized to play in this match.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is not authorized.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  ###          ##                #           #
    //              #           #    #  #  #                  #       #  #  #        #  #               #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #      ###  ###   ###    ###  ##    ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###     ##   # #  ###   #  #
    // #                                                                                         #
    /**
     * Validates that the pilot is a captain.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldBeCaptain(interaction, pilot, member) {
        if (!pilot.isCaptainOrFounder() || pilot.isFounder()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is not a captain.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is not a captain.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  ###          ##                #           #           ##         ####                       #
    //              #           #    #  #  #                  #       #  #  #        #  #               #                      #  #        #                          #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #
    // #                                                                                         #
    /**
     * Validates that the pilot is a captain or founder.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldBeCaptainOrFounder(interaction, pilot, member) {
        if (!pilot.isCaptainOrFounder()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is not a captain or a founder.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is not a captain or founder.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  ###         ###    #      #     #                            #    ###   #                 #  #              #
    //              #           #    #  #  #                  #       #  #  #        #  #         # #   # #                           #     #    #                 ####              #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  ##     #     #     ##   ###    ##   ###   ###    #    ###    ###  ###   ####   ##   # #   ###    ##   ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #   #    ###   ###   # ##  #  #  # ##  #  #   #     #    #  #  #  #  #  #  #  #  # ##  ####  #  #  # ##  #  #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #   #     #     #    ##    #     ##    #  #   #     #    #  #  # ##  #  #  #  #  ##    #  #  #  #  ##    #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##   ###   ###    #     #     ##   #      ##   #  #    ##   #    #  #   # #  #  #  #  #   ##   #  #  ###    ##   #
    // #
    /**
     * Validates that the pilot and member are different.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldBeDifferentThanMember(interaction, pilot, member) {
        if (member.id === pilot.id) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you can't use this command on yourself!`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Member used command on themself.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  ###          ##          ##
    //              #           #    #  #  #                  #       #  #  #        #  #        #  #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  ###    #     ##   ###   # #    ##   ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #    #   # ##  #  #  # #   # ##  #  #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #  #  #  ##    #     # #   ##    #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##    ##   #  #   ##    ##   #      #     ##   #
    // #
    /**
     * Validates that the pilot is on the server.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<DiscordJs.GuildMember>} A promise that returns the pilot.
     */
    static async pilotShouldBeOnServer(interaction, member) {
        const pilot = Discord.findGuildMemberById(interaction.options.getUser("pilot", true).id);

        if (!pilot) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I can't find that pilot on this server.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot not on server.");
        }

        return pilot;
    }

    //        #    ##           #     ##   #                 ##       #  ###          ##         ###
    //              #           #    #  #  #                  #       #  #  #        #  #         #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  ###    #     ##    ###  # #
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #    # ##  #  #  ####
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #   #    ##    # ##  #  #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##    ##   #  #   #     ##    # #  #  #
    // #
    /**
     * Validates that the pilot is on a specific team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldBeOnTeam(interaction, pilot, team, member) {
        let pilotTeam;
        try {
            pilotTeam = await pilot.getTeam();
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

        if (!pilotTeam || team.id !== pilotTeam.id) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but the pilot must be on your team in order to use this command with them.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is not on same team as member.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  ###         ###                                 #     ##
    //              #           #    #  #  #                  #       #  #  #        #  #                                #      #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #   ##   # #    ##   # #    ###  ###    #     ##
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  ###   # ##  ####  #  #  # #   #  #  #  #   #    # ##
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    # #   ##    #  #  #  #  # #   # ##  #  #   #    ##
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##   #  #   ##   #  #   ##    #     # #  ###   ###    ##
    // #
    /**
     * Validates that the pilot is removable.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldBeRemovable(interaction, pilot, member) {
        let removable;
        try {
            removable = await member.canRemovePilot(pilot);
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

        if (!removable) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot.displayName} is not a pilot you can remove.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is not removable.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  ###         ###                      ##                       #
    //              #           #    #  #  #                  #       #  #  #         #                      #  #                      #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ###    ##    #     ##    ###  # #   #     #  #   ##    ###   ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##   #    # ##  #  #  ####  # ##  #  #  # ##  ##      #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##     #    ##    # ##  #  #  #  #  #  #  ##      ##    #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  ###    ##    #     ##    # #  #  #   ###   ###   ##   ###      ##
    // #
    /**
     * Validates that a pilot is a team's guest.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldBeTeamGuest(interaction, pilot, team, member) {
        if (!team.teamChannel.permissionOverwrites.cache.find((c) => c.id === pilot.id)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is not a guest of **${team.name}**.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is not a guest of the team.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  #  #                     ##    #           #    ###          ##   #           ##    ##
    //              #           #    #  #  #                  #       #  #  #                    #  #   #           #     #          #  #  #            #     #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ####   ###  # #    ##    #    ###    ###  ###    #    ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##    #    #    #  #   #     #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #  #   #    # ##   #     #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##    ##     ##   # #    ##  ###   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    // #                                                                                                                                                                        ###
    /**
     * Validates that a pilot has a stat in a challenge.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.User} pilot The pilot.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldHaveStatInChallenge(interaction, pilot, challenge, member) {
        let challengingTeamStats, challengedTeamStats;
        try {
            challengingTeamStats = await challenge.getStatsForTeam(challenge.challengingTeam);
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

        try {
            challengedTeamStats = await challenge.getStatsForTeam(challenge.challengedTeam);
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

        if (!challengingTeamStats.find((s) => s.pilot.id === pilot.id) && !challengedTeamStats.find((s) => s.pilot.id === pilot.id)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} does not have a recorded stat for this match.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("No stat for pilot.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  #  #         #    ###          ##                #           #           ##         ####                       #
    //              #           #    #  #  #                  #       #  ## #         #    #  #        #  #               #                      #  #        #                          #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #
    // #                                                                                                           #
    /**
     * Validates that the pilot is not a captain or founder.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldNotBeCaptainOrFounder(interaction, pilot, member) {
        if (pilot.isCaptainOrFounder()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is a ${pilot.isFounder() ? "founder" : "captain"}.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is already a captain or founder.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  #  #         #    ###          ##                      #     #                ###
    //              #           #    #  #  #                  #       #  ## #         #    #  #        #  #                     #                       #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #     ###    ##    ###  ###   ##    ###    ###   #     ##    ###  # #
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #     #  #  # ##  #  #   #     #    #  #  #  #   #    # ##  #  #  ####
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  #     ##    # ##   #     #    #  #   ##    #    ##    # ##  #  #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##   #      ##    # #    ##  ###   #  #  #      #     ##    # #  #  #
    // #                                                                                                                                          ###
    /**
     * Validates that the pilot is not creating a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldNotBeCreatingTeam(interaction, pilot, member) {
        let newTeam;
        try {
            newTeam = await pilot.getNewTeam();
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

        if (newTeam) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is currently in the process of starting a team.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is currently in the process of starting a team.");
        }
    }

    /**
     * Validates that the pilot is not a founder.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldNotBeFounder(interaction, pilot, member) {
        if (pilot.isFounder()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is a founder.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is a founder.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  #  #         #    ###         ###                #     #             #  ###         ###
    //              #           #    #  #  #                  #       #  ## #         #    #  #         #                       #             #   #           #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##    #    ###   # #   ##    ###    ##    ###   #     ##    #     ##    ###  # #
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##   #    #  #  # #    #     #    # ##  #  #   #    #  #   #    # ##  #  #  ####
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##     #    #  #  # #    #     #    ##    #  #   #    #  #   #    ##    # ##  #  #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   ###   #  #   #    ###     ##   ##    ###   #     ##    #     ##    # #  #  #
    // #
    /**
     * Validates that the pilot is not invited to the team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldNotBeInvitedToTeam(interaction, pilot, team, member) {
        let invited;
        try {
            invited = await pilot.hasBeenInvitedToTeam(team);
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

        if (invited) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you can only invite a pilot to your team once.  If ${pilot} has not responded yet, ask them to \`/accept\` the invitation.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot already invited.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  #  #         #    ###          ##          ##   ###
    //              #           #    #  #  #                  #       #  ## #         #    #  #        #  #        #  #   #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #  ###   #  #   #     ##    ###  # #
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #  #  #  #  ####   #    # ##  #  #  ####
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  #  #  #  #   #    ##    # ##  #  #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    ##   #  #  #  #   #     ##    # #  #  #
    // #
    /**
     * Validates that the pilot is not on a team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldNotBeOnATeam(interaction, pilot, member) {
        let team;
        try {
            team = await pilot.getTeam();
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

        if (team) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is already on **${team.name}**.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is on a team.");
        }
    }

    //        #    ##           #     ##   #                 ##       #  #  #         #    ###         ###                      ##                       #
    //              #           #    #  #  #                  #       #  ## #         #    #  #         #                      #  #                      #
    // ###   ##     #     ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##    #     ##    ###  # #   #     #  #   ##    ###   ###
    // #  #   #     #    #  #   #      #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##   #    # ##  #  #  ####  # ##  #  #  # ##  ##      #
    // #  #   #     #    #  #   #    #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##     #    ##    # ##  #  #  #  #  #  #  ##      ##    #
    // ###   ###   ###    ##     ##   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##    #     ##    # #  #  #   ###   ###   ##   ###      ##
    // #
    /**
     * Validates that a pilot is not a team's guest.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} pilot The pilot.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async pilotShouldNotBeTeamGuest(interaction, pilot, team, member) {
        if (team.teamChannel.permissionOverwrites.cache.find((c) => c.id === pilot.id)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but ${pilot} is a guest of **${team.name}**.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot is a guest of the team.");
        }
    }

    //                      #              #  #               ##   #                 ##       #  ####         #            #
    //                      #              ####              #  #  #                  #       #  #                         #
    // ###    ###  ###    ###   ##   # #   ####   ###  ###    #    ###    ##   #  #   #     ###  ###   #  #  ##     ###   ###
    // #  #  #  #  #  #  #  #  #  #  ####  #  #  #  #  #  #    #   #  #  #  #  #  #   #    #  #  #      ##    #    ##      #
    // #     # ##  #  #  #  #  #  #  #  #  #  #  # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #      ##    #      ##    #
    // #      # #  #  #   ###   ##   #  #  #  #   # #  ###    ##   #  #   ##    ###  ###    ###  ####  #  #  ###   ###      ##
    //                                                 #
    /**
     * Validates that a random map exists.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<string>} A promise that returns the map.
     */
    static async randomMapShouldExist(interaction, challenge, member) {
        const popularity = interaction.options.getString("popularity", false),
            amount = interaction.options.getNumber("amount", false) || 10;

        let map;
        try {
            map = await challenge.getRandomMap(popularity, popularity ? amount : void 0);
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

        if (!map) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I could not find a map to suggest.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("No matching maps.");
        }

        return map;
    }

    //                                       ##   #                 ##       #  ###         ###                      #
    //                                      #  #  #                  #       #  #  #        #  #
    //  ###    ##   ###   # #    ##   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  #  #  ###   ###   ##    ###    ###
    // ##     # ##  #  #  # #   # ##  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  ###   #  #  #  #  #  #   #    #  #  #  #
    //   ##   ##    #     # #   ##    #     #  #  #  #  #  #  #  #   #    #  #  #  #  ##    # #   #  #  #  #  #  #   #    #  #   ##
    // ###     ##   #      #     ##   #      ##   #  #   ##    ###  ###    ###  ###    ##   #  #   ###  #  #  #  #  ###   #  #  #
    //                                                                                                                           ###
    /**
     * Validates that a server should be running.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} checkServer The name of the server.
     * @param {AzureTypes.Server} server The server.
     * @param {DiscordJs.User} user The user.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async serverShouldBeRunning(interaction, checkServer, server, user) {
        if (!server.started) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${user}, but this server is not running.  Did you mean to \`/start ${checkServer}\` instead?`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Server already started.");
        }
    }

    //                                       ##   #                 ##       #  ####         #            #
    //                                      #  #  #                  #       #  #                         #
    //  ###    ##   ###   # #    ##   ###    #    ###    ##   #  #   #     ###  ###   #  #  ##     ###   ###
    // ##     # ##  #  #  # #   # ##  #  #    #   #  #  #  #  #  #   #    #  #  #      ##    #    ##      #
    //   ##   ##    #     # #   ##    #     #  #  #  #  #  #  #  #   #    #  #  #      ##    #      ##    #
    // ###     ##   #      #     ##   #      ##   #  #   ##    ###  ###    ###  ####  #  #  ###   ###      ##
    /**
     * Validates that a server should exist.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} server The server.
     * @param {DiscordJs.User} user The user.
     * @returns {Promise<AzureTypes.Server>} A promise that returns the server.
     */
    static async serverShouldExist(interaction, server, user) {
        if (!settings.servers[server]) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${user}, but this is not a valid server.  Use the \`/servers\` command to see the list of servers.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Server does not exist.");
        }

        return settings.servers[server];
    }

    //                                       ##   #                 ##       #  #  #         #    ###         ###                      #
    //                                      #  #  #                  #       #  ## #         #    #  #        #  #
    //  ###    ##   ###   # #    ##   ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #  #  #  ###   ###   ##    ###    ###
    // ##     # ##  #  #  # #   # ##  #  #    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  ###   #  #  #  #  #  #   #    #  #  #  #
    //   ##   ##    #     # #   ##    #     #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    # #   #  #  #  #  #  #   #    #  #   ##
    // ###     ##   #      #     ##   #      ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   #  #   ###  #  #  #  #  ###   #  #  #
    //                                                                                                                                             ###
    /**
     * Validates that a server should not be running.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} checkServer The name of the server.
     * @param {AzureTypes.Server} server The server.
     * @param {DiscordJs.User} user The user.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async serverShouldNotBeRunning(interaction, checkServer, server, user) {
        if (server.started) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${user}, but this server is already running.  Use \`/extend ${checkServer}\` command to extend the server's uptime.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Server already started.");
        }
    }

    //         #           #            ##   #                 ##       #  ###               ##             #         ##   ###   ####   ##    #           #
    //         #           #           #  #  #                  #       #   #                 #             #        #  #   #    #     #  #   #           #
    //  ###   ###    ###  ###    ###    #    ###    ##   #  #   #     ###   #    ###    ##    #    #  #   ###   ##   #      #    ###    #    ###    ###  ###    ###
    // ##      #    #  #   #    ##       #   #  #  #  #  #  #   #    #  #   #    #  #  #      #    #  #  #  #  # ##  #      #    #       #    #    #  #   #    ##
    //   ##    #    # ##   #      ##   #  #  #  #  #  #  #  #   #    #  #   #    #  #  #      #    #  #  #  #  ##    #  #   #    #     #  #   #    # ##   #      ##
    // ###      ##   # #    ##  ###     ##   #  #   ##    ###  ###    ###  ###   #  #   ##   ###    ###   ###   ##    ##    #    #      ##     ##   # #    ##  ###
    /**
     * Validates that all CTF stats are present.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {number} captures The number of captures.
     * @param {number} pickups The number of pickups.
     * @param {number} carrierKills The number of carrier kills.
     * @param {number} returns The number of returns.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async statsShouldIncludeCTFStats(interaction, captures, pickups, carrierKills, returns, member) {
        if (captures === null || pickups === null || carrierKills === null || returns === null) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must provide all CTF stats for a CTF match.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Not enough CTF stats provided.");
        }
    }

    //  #                      #  #                     ##   #                 ##       #  ###         #  #         #
    //  #                      ## #                    #  #  #                  #       #  #  #        #  #
    // ###    ##    ###  # #   ## #   ###  # #    ##    #    ###    ##   #  #   #     ###  ###    ##   #  #  ###   ##     ###  #  #   ##
    //  #    # ##  #  #  ####  # ##  #  #  ####  # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #    #  #  #  #  # ##
    //  #    ##    # ##  #  #  # ##  # ##  #  #  ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #   #    #  #  #  #  ##
    //   ##   ##    # #  #  #  #  #   # #  #  #   ##    ##   #  #   ##    ###  ###    ###  ###    ##    ##   #  #  ###    ###   ###   ##
    //                                                                                                                      #
    /**
     * Validates that a team name is unique.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} name The team name.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamNameShouldBeUnique(interaction, name, member) {
        if (Team.nameExists(name)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this team name already exists!  You'll need to use the \`/name\` command to try another.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team name already exists.");
        }
    }

    //  #                      #  #                     ##   #                 ##       #  ###         #  #        ##     #       #
    //  #                      ## #                    #  #  #                  #       #  #  #        #  #         #             #
    // ###    ##    ###  # #   ## #   ###  # #    ##    #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   #    ##     ###
    //  #    # ##  #  #  ####  # ##  #  #  ####  # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #     #    #  #
    //  #    ##    # ##  #  #  # ##  # ##  #  #  ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##     ##   # ##   #     #    #  #
    //   ##   ##    # #  #  #  #  #   # #  #  #   ##    ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###   ###    ###
    /**
     * Validates that a team name is valid.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} name The team name.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamNameShouldBeValid(interaction, name, member) {
        if (!teamNameParse.test(name)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you can only use alphanumeric characters and spaces, and names must be between 6 and 25 characters.  In the event you need to use other characters, please name your team within the rules for now, and then contact an admin after your team is created.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid team name.");
        }
    }

    //  #                       ##   #                 ##       #  ###          ##    #     ##                            #     #
    //  #                      #  #  #                  #       #  #  #        #  #   #    #  #                                 #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ###    ##   #  #  ###   #      ###  ###    ###   ##   ##    ###   #  #
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  # ##  ####   #    #     #  #  #  #  #  #  #      #     #    #  #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #   #    #  #  # ##  #  #  # ##  #      #     #     # #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  ###    ##   #  #    ##   ##    # #  ###    # #   ##   ###     ##    #
    //                                                                                                 #                              #
    /**
     * Validates that the team is at capacity.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldBeAtCapacity(interaction, team, member) {
        let pilotCount;
        try {
            pilotCount = await team.getPilotAndInvitedCount();
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

        if (pilotCount < MAXIMUM_PILOTS_PER_ROSTER) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${team.name}** is not at the maximum of ${MAXIMUM_PILOTS_PER_ROSTER} pilots per roster.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Roster is not full.");
        }
    }

    //  #                       ##   #                 ##       #  ###         ###    #           #                    #           #
    //  #                      #  #  #                  #       #  #  #        #  #               #                    #           #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ###    ##   #  #  ##     ###   ###    ###  ###    ###   ##    ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #   #    ##     #  #  #  #  #  #  #  #  # ##  #  #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #   #      ##   #  #  # ##  #  #  #  #  ##    #  #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  ###    ##   ###   ###   ###    ###    # #  #  #   ###   ##    ###
    /**
     * Validates that the team is disbanded.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldBeDisbanded(interaction, team, member) {
        if (!team.disbanded) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this team is not currently disbanded.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team is not disbanded.");
        }
    }

    //  #                       ##   #                 ##       #  ###         ###          ##   #           ##    ##
    //  #                      #  #  #                  #       #  #  #         #          #  #  #            #     #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ###    ##    #    ###   #     ###    ###   #     #     ##   ###    ###   ##
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  # ##   #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  ##     #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  ###    ##   ###   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                ###
    /**
     * Validates that a team is in a challenge.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldBeInChallenge(interaction, team, challenge, member) {
        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${team.name}** is not one of the teams in this challenge.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Pilot not on a team in the challenge.");
        }
    }

    //  #                       ##   #                 ##       #  ###         #                 #              #
    //  #                      #  #  #                  #       #  #  #        #                 #              #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ###    ##   #      ##    ##   # #    ##    ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  #     ##    # ##  #  #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #     #  #  #     # #   ##    #  #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  ###    ##   ####   ##    ##   #  #   ##    ###
    /**
     * Validates that a team is locked.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldBeLocked(interaction, team, member) {
        if (!team.locked) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but the roster for **${team.name}** is not currently locked for a tournament.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team's roster is not locked.");
        }
    }

    //  #                       ##   #                 ##       #  ####         #            #
    //  #                      #  #  #                  #       #  #                         #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ###   #  #  ##     ###   ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #      ##    #    ##      #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #      ##    #      ##    #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  ####  #  #  ###   ###      ##
    /**
     * Validates that a team exists.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} teamOrTag The team name or tag.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<Team>} A promise that returns the new team when the validation is complete.
     */
    static async teamShouldExist(interaction, teamOrTag, member) {
        if (!teamOrTag) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must specify a team.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team not specified.");
        }

        let team;
        try {
            team = await Team.getByNameOrTag(teamOrTag);
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

        if (!team) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but I have no record of that team ever existing.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team does not exist.");
        }

        return team;
    }

    //  #                       ##   #                 ##       #  #  #                    ####                          #     #  #
    //  #                      #  #  #                  #       #  #  #                    #                             #     #  #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   ###   ###    ##   #  #   ###  ###   ####   ##   # #    ##    ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  #     #  #  #  #  #  #  #  #  #  #  #  #  #  #  ####  # ##  ##
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #     #  #  #  #  #  #   ##   #  #  #  #  #  #  #  #  ##      ##
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   ####  #  #   ##    ###  #     #  #  #  #   ##   #  #   ##   ###
    //                                                                                                              ###
    /**
     * Validates that a team has enough homes.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {string} type The game type.
     * @param {number} pilotCount The pilot count.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldHaveEnoughHomes(interaction, team, type, pilotCount, member) {
        let homeMaps;
        try {
            homeMaps = await team.getHomeMapsByType();
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

        if (type === "TA") {
            if (!homeMaps.CTF || !homeMaps["2v2"] || pilotCount >= 3 && !homeMaps["3v3"] || pilotCount >= 4 && !homeMaps["4v4+"] || homeMaps["2v2"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE || pilotCount >= 3 && homeMaps["3v3"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE || pilotCount >= 4 && homeMaps["4v4+"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE) {
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but **${team.name}** must have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} home maps set for each category in the specified game type to be in a match.`,
                            color: 0xff0000
                        })
                    ]
                });
                throw new Warning(`Team does not have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} home maps set for specified game type.`);
            }
        } else if (!homeMaps[type] || homeMaps[type].length < Validation.MAXIMUM_MAPS_PER_GAME_TYPE) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${team.name}** must have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} home maps set for the specified game type to be in a match.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning(`Team does not have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} home maps set for specified game type.`);
        }
    }

    //  #                       ##   #                 ##       #  #  #                    #  #                     ##          #
    //  #                      #  #  #                  #       #  #  #                    #  #                    #  #         #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   ####   ##   # #    ##    #     ##   ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  #  #  #  #  ####  # ##    #   # ##   #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #  #  #  #  #  #  ##    #  #  ##     #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   #  #   ##   #  #   ##    ##    ##     ##
    /**
     * Validates that a team has a home level set.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {string} type The game type.
     * @param {MapTypes.MapData} map The map data.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldHaveHomeSet(interaction, team, type, map, member) {
        let homes;
        try {
            homes = await team.getHomeMaps(type);
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

        if (homes.indexOf(map.map) === -1) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you do not have this map set as your home.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team does not have this home map set.");
        }

        return homes;
    }

    //  #                       ##   #                 ##       #  #  #                    #  #   #           #                      ###   ##
    //  #                      #  #  #                  #       #  #  #                    ####                                      #  #   #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   ####  ##    ###   ##    # #   #  #  # #   #  #   #     ###  #  #   ##   ###    ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  #  #   #    #  #   #    ####  #  #  ####  ###    #    #  #  #  #  # ##  #  #  ##
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #  #   #    #  #   #    #  #  #  #  #  #  #      #    # ##   # #  ##    #       ##
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   #  #  ###   #  #  ###   #  #   ###  #  #  #     ###    # #    #    ##   #     ###
    //                                                                                                                                                  #
    /**
     * Validates that a team has a minimum number of players.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<number>} A promise that returns the pilot count.
     */
    static async teamShouldHaveMinimumPlayers(interaction, team, member) {
        let pilotCount;
        try {
            pilotCount = await team.getPilotCount();
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

        if (pilotCount < MINIMUM_PILOTS_PER_ROSTER) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${team.name}** must have ${MINIMUM_PILOTS_PER_ROSTER} or more pilots to be in a match.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team only has one member.");
        }

        return pilotCount;
    }

    //  #                       ##   #                 ##       #  #  #                    #  #               #                ##     ##          #
    //  #                      #  #  #                  #       #  #  #                    ## #               #                 #    #  #         #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  # ##  # ##  #  #   #    #  #  #  #   #      #   # ##   #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    # ##  ##    #  #   #    #     # ##   #    #  #  ##     #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   #  #   ##    ###    ##  #      # #  ###    ##    ##     ##
    /**
     * Validates that a team has a neutral level set.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {string} type The game type.
     * @param {MapTypes.MapData} map The map data.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldHaveNeutralSet(interaction, team, type, map, member) {
        let neutrals;
        try {
            neutrals = await team.getNeutralMaps(type);
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

        if (neutrals.indexOf(map.map) === -1) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you do not have this map set as a neutral map.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team does not have this neutral map set.");
        }

        return neutrals;
    }

    //  #                       ##   #                 ##       #  #  #                 #  #  #                     ##    #           #
    //  #                      #  #  #                  #       #  ## #                 #  ####                    #  #   #           #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ## #   ##    ##    ###  ####   ##   ###    ##    #    ###    ###  ###    ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  # ##  # ##  # ##  #  #  #  #  #  #  #  #  # ##    #    #    #  #   #    ##
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  ##    ##    #  #  #  #  #  #  #     ##    #  #   #    # ##   #      ##
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   ##    ##    ###  #  #   ##   #      ##    ##     ##   # #    ##  ###
    /**
     * Validates that a team needs more stats for a match.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.User} pilot The pilot.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldNeedMoreStats(interaction, team, challenge, pilot, member) {
        let stats;
        try {
            stats = await challenge.getStatsForTeam(team);
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

        if (!stats.find((s) => s.pilot && s.pilot.id === pilot.id) && stats.length >= challenge.details.teamSize) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you have already provided enough pilot stats for this match.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Too many stats for team.");
        }
    }

    //  #                       ##   #                 ##       #  #  #         #    ###          ##    #     ##                            #     #
    //  #                      #  #  #                  #       #  ## #         #    #  #        #  #   #    #  #                                 #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #  ###   #      ###  ###    ###   ##   ##    ###   #  #
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  ####   #    #     #  #  #  #  #  #  #      #     #    #  #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #   #    #  #  # ##  #  #  # ##  #      #     #     # #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   #  #    ##   ##    # #  ###    # #   ##   ###     ##    #
    //                                                                                                                   #                              #
    /**
     * Validates that the team is not at capacity.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldNotBeAtCapacity(interaction, team, member) {
        let pilotCount;
        try {
            pilotCount = await team.getPilotAndInvitedCount();
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

        if (pilotCount >= MAXIMUM_PILOTS_PER_ROSTER) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but there is a maximum of ${MAXIMUM_PILOTS_PER_ROSTER} pilots per roster, and **${team.name}** currently has ${pilotCount}, including invited pilots.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Roster is full.");
        }
    }

    //  #                       ##   #                 ##       #  #  #         #    ###         ###    #           #                    #           #
    //  #                      #  #  #                  #       #  ## #         #    #  #        #  #               #                    #           #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #  #  ##     ###   ###    ###  ###    ###   ##    ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #  #   #    ##     #  #  #  #  #  #  #  #  # ##  #  #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #   #      ##   #  #  # ##  #  #  #  #  ##    #  #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   ###   ###   ###    ###    # #  #  #   ###   ##    ###
    /**
     * Validates that the team is not disbanded.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldNotBeDisbanded(interaction, team, member) {
        if (team.disbanded) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this team is currently disbanded.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team is disbanded.");
        }
    }

    //  #                       ##   #                 ##       #  #  #         #    ###         #  #
    //  #                      #  #  #                  #       #  ## #         #    #  #        #  #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   ####   ##   # #    ##
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #  #  #  #  ####  # ##
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #  #  #  #  #  #  ##
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   #  #   ##   #  #   ##
    /**
     * Validates that a team is not the home team in a challenge.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldNotBeHome(interaction, team, challenge, member) {
        if (challenge.details.homeMapTeam.id === team.id) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but your team is the home team.  Your opponents must use this command.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team is the home team.");
        }
    }

    //  #                       ##   #                 ##       #  #  #         #    ###         #                 #              #
    //  #                      #  #  #                  #       #  ## #         #    #  #        #                 #              #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ## #   ##   ###   ###    ##   #      ##    ##   # #    ##    ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  #     #  #  #     ##    # ##  #  #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  ##    #     #  #  #     # #   ##    #  #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  ###    ##   ####   ##    ##   #  #   ##    ###
    /**
     * Validates that the team is not locked.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldNotBeLocked(interaction, team, member) {
        if (team.locked) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but the roster for **${team.name}** is locked for a tournament.  Roster changes will become available when your team is no longer participating.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team's roster is locked.");
        }
    }

    //  #                       ##   #                 ##       #  #  #         #    #  #                    #  #                     ##          #
    //  #                      #  #  #                  #       #  ## #         #    #  #                    #  #                    #  #         #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##   ####   ##   # #    ##    #     ##   ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##  #  #  #  #  ####  # ##    #   # ##   #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##    #  #  #  #  #  #  ##    #  #  ##     #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##   #  #   ##   #  #   ##    ##    ##     ##
    /**
     * Validates that a team does not have a home level set.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {string} type The game type.
     * @param {MapTypes.MapData} map The map data.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<string[]>} A promise that resolves with the list of home maps.
     */
    static async teamShouldNotHaveHomeSet(interaction, team, type, map, member) {
        let homes;
        try {
            homes = await team.getHomeMaps(type);
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

        if (homes.indexOf(map.map) !== -1) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you already have this map set as a home.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team already has this home map set.");
        }

        return homes;
    }

    //  #                       ##   #                 ##       #  #  #         #    #  #                    #  #               #                ##     ##          #
    //  #                      #  #  #                  #       #  ## #         #    #  #                    ## #               #                 #    #  #         #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##  # ##  # ##  #  #   #    #  #  #  #   #      #   # ##   #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##    # ##  ##    #  #   #    #     # ##   #    #  #  ##     #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##   #  #   ##    ###    ##  #      # #  ###    ##    ##     ##
    /**
     * Validates that a team does not have a neutral level set.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {string} type The game type.
     * @param {MapTypes.MapData} map The map data.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldNotHaveNeutralSet(interaction, team, type, map, member) {
        let neutrals;
        try {
            neutrals = await team.getNeutralMaps(type);
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

        if (neutrals.indexOf(map.map) !== -1) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you already have this map set as a preferred neutral map.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team already has this neutral map set.");
        }
    }

    //  #                       ##   #                 ##       #  #  #         #    #  #                    ###                            #    ##           ##   ##                #              #
    //  #                      #  #  #                  #       #  ## #         #    #  #                    #  #                           #     #          #  #   #                #              #
    // ###    ##    ###  # #    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##   #  #   ##    ##    ##   ###   ###    #    #  #  #      #     ##    ##   # #    ##    ###
    //  #    # ##  #  #  ####    #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##  ###   # ##  #     # ##  #  #   #     #    #  #  #      #    #  #  #     ##    # ##  #  #
    //  #    ##    # ##  #  #  #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##    # #   ##    #     ##    #  #   #     #     # #  #  #   #    #  #  #     # #   ##    #  #
    //   ##   ##    # #  #  #   ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##   #  #   ##    ##    ##   #  #    ##  ###     #    ##   ###    ##    ##   #  #   ##    ###
    //                                                                                                                                                  #
    /**
     * Validates that a team has not recently clocked another team.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamShouldNotHaveRecentlyClocked(interaction, team, member) {
        let nextClockDate;
        try {
            nextClockDate = await team.getNextClockDate();
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

        if (nextClockDate && nextClockDate > new Date()) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but your team cannot put another challenge on the clock until <t:${Math.floor(nextClockDate.getTime() / 1000)}:F>.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team has clocked a challenge in the last 28 days.");
        }
    }

    //  #                      ###                ##   #                 ##       #  ###         #  #         #
    //  #                       #                #  #  #                  #       #  #  #        #  #
    // ###    ##    ###  # #    #     ###   ###   #    ###    ##   #  #   #     ###  ###    ##   #  #  ###   ##     ###  #  #   ##
    //  #    # ##  #  #  ####   #    #  #  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #    #  #  #  #  # ##
    //  #    ##    # ##  #  #   #    # ##   ##   #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #   #    #  #  #  #  ##
    //   ##   ##    # #  #  #   #     # #  #      ##   #  #   ##    ###  ###    ###  ###    ##    ##   #  #  ###    ###   ###   ##
    //                                      ###                                                                       #
    /**
     * Validates that a team tag is unique.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} tag The team tag.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamTagShouldBeUnique(interaction, tag, member) {
        if (Team.tagExists(tag)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but this team tag already exists!  You'll need to use the \`/tag\` command to try another.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team tag already exists.");
        }
    }

    //  #                      ###                ##   #                 ##       #  ###         #  #        ##     #       #
    //  #                       #                #  #  #                  #       #  #  #        #  #         #             #
    // ###    ##    ###  # #    #     ###   ###   #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   #    ##     ###
    //  #    # ##  #  #  ####   #    #  #  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #     #    #  #
    //  #    ##    # ##  #  #   #    # ##   ##   #  #  #  #  #  #  #  #   #    #  #  #  #  ##     ##   # ##   #     #    #  #
    //   ##   ##    # #  #  #   #     # #  #      ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###   ###    ###
    //                                      ###
    /**
     * Validates that a team tag is valid.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} tag The team tag.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamTagShouldBeValid(interaction, tag, member) {
        if (!teamTagParse.test(tag)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you can only use alphanumeric characters, and are limited to 5 characters.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid team tag.");
        }
    }

    //  #                              ##   #                 ##       #  ###          ##   #           ##    ##                                  #     ##
    //  #                             #  #  #                  #       #  #  #        #  #  #            #     #                                  #      #
    // ###    ##    ###  # #    ###    #    ###    ##   #  #   #     ###  ###    ##   #     ###    ###   #     #     ##   ###    ###   ##    ###  ###    #     ##
    //  #    # ##  #  #  ####  ##       #   #  #  #  #  #  #   #    #  #  #  #  # ##  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  #  #   #    # ##
    //  #    ##    # ##  #  #    ##   #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #  #  #  # ##   #     #    ##    #  #   ##   ##    # ##  #  #   #    ##
    //   ##   ##    # #  #  #  ###     ##   #  #   ##    ###  ###    ###  ###    ##    ##   #  #   # #  ###   ###    ##   #  #  #      ##    # #  ###   ###    ##
    //                                                                                                                           ###
    /**
     * Validates that both teams are challengeable.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {Team} opponent The opposing team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamsShouldBeChallengeable(interaction, team, opponent, member) {
        let pilotCount;
        try {
            pilotCount = await team.getPilotCount();
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

        if (pilotCount < 2) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but your team must have 2 or more pilots to challenge another team.  \`/invite\` some pilots to your team!`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Team only has one member.");
        }

        let homeMaps;
        try {
            homeMaps = await team.getHomeMapsByType();
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

        if (!homeMaps.CTF || !homeMaps["2v2"] || pilotCount >= 3 && !homeMaps["3v3"] || pilotCount >= 4 && !homeMaps["4v4+"] || homeMaps.CTF.length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE || homeMaps["2v2"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE || pilotCount >= 3 && homeMaps["3v3"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE || pilotCount >= 4 && homeMaps["4v4+"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but your team must have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} home maps set for each game type before you challenge another team.  Use the \`/addhome\` command to set your team's home maps.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning(`Team does not have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} home maps set for each game type.`);
        }

        let opponentPilotCount;
        try {
            opponentPilotCount = await opponent.getPilotCount();
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

        if (opponentPilotCount < 2) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but your opponents must have 2 or more pilots to be challenged.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Opponent only has one member.");
        }

        let opponentHomeMaps;
        try {
            opponentHomeMaps = await opponent.getHomeMapsByType();
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

        if (!opponentHomeMaps.CTF || !opponentHomeMaps["2v2"] || opponentPilotCount >= 3 && !opponentHomeMaps["3v3"] || opponentPilotCount >= 4 && !opponentHomeMaps["4v4+"] || opponentHomeMaps.CTF.length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE || opponentHomeMaps["2v2"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE || opponentPilotCount >= 3 && opponentHomeMaps["3v3"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE || opponentPilotCount >= 4 && opponentHomeMaps["4v4+"].length !== Validation.MAXIMUM_MAPS_PER_GAME_TYPE) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but your opponents must have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} home maps set for each game type before you can challenge them.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning(`Opponent does not have ${Validation.MAXIMUM_MAPS_PER_GAME_TYPE} home maps set for each game type.`);
        }
    }

    //  #                              ##   #                 ##       #  ###         ###    #      #     #                            #
    //  #                             #  #  #                  #       #  #  #        #  #         # #   # #                           #
    // ###    ##    ###  # #    ###    #    ###    ##   #  #   #     ###  ###    ##   #  #  ##     #     #     ##   ###    ##   ###   ###
    //  #    # ##  #  #  ####  ##       #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #   #    ###   ###   # ##  #  #  # ##  #  #   #
    //  #    ##    # ##  #  #    ##   #  #  #  #  #  #  #  #   #    #  #  #  #  ##    #  #   #     #     #    ##    #     ##    #  #   #
    //   ##   ##    # #  #  #  ###     ##   #  #   ##    ###  ###    ###  ###    ##   ###   ###    #     #     ##   #      ##   #  #    ##
    /**
     * Validates that two teams are different.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {Team} opponent The opposing team.
     * @param {DiscordJs.GuildMember} member The member.
     * @param {string} message The message to use.
     * @param {boolean} [followUp] Whether to followup.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamsShouldBeDifferent(interaction, team, opponent, member, message, followUp) {
        const fx = followUp ? interaction.followUp : interaction.editReply;
        if (team.id === opponent.id) {
            await fx.call(interaction, {
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, ${message}`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Teams are the same.");
        }
    }

    //  #                              ##   #                 ##       #  #  #                    ####                          #     ###   ##
    //  #                             #  #  #                  #       #  #  #                    #                             #     #  #   #
    // ###    ##    ###  # #    ###    #    ###    ##   #  #   #     ###  ####   ###  # #    ##   ###   ###    ##   #  #   ###  ###   #  #   #     ###  #  #   ##   ###    ###
    //  #    # ##  #  #  ####  ##       #   #  #  #  #  #  #   #    #  #  #  #  #  #  # #   # ##  #     #  #  #  #  #  #  #  #  #  #  ###    #    #  #  #  #  # ##  #  #  ##
    //  #    ##    # ##  #  #    ##   #  #  #  #  #  #  #  #   #    #  #  #  #  # ##  # #   ##    #     #  #  #  #  #  #   ##   #  #  #      #    # ##   # #  ##    #       ##
    //   ##   ##    # #  #  #  ###     ##   #  #   ##    ###  ###    ###  #  #   # #   #     ##   ####  #  #   ##    ###  #     #  #  #     ###    # #    #    ##   #     ###
    //                                                                                                                     ###                           #
    /**
     * Validates that both teams in a challenge have enough players.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<number>} A promise that returns the team size.
     */
    static async teamsShouldHaveEnoughPlayers(interaction, challenge, member) {
        const size = +interaction.options.getString("size", true).charAt(0);

        let pilotCount;
        try {
            pilotCount = await challenge.challengingTeam.getPilotAndInvitedCount();
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

        if (pilotCount < size) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${challenge.challengingTeam.name}** does not have enough players.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Challenging team not large enough.");
        }

        try {
            pilotCount = await challenge.challengedTeam.getPilotAndInvitedCount();
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

        if (pilotCount < size) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${challenge.challengedTeam.name}** does not have enough players.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Challenged team not large enough.");
        }

        return size;
    }

    //  #                              ##   #                 ##       #  #  #         #    #  #                    ####         #            #     #                 ##   #           ##    ##
    //  #                             #  #  #                  #       #  ## #         #    #  #                    #                         #                      #  #  #            #     #
    // ###    ##    ###  # #    ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##   ###   #  #  ##     ###   ###   ##    ###    ###  #     ###    ###   #     #     ##   ###    ###   ##
    //  #    # ##  #  #  ####  ##       #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##  #      ##    #    ##      #     #    #  #  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    //  #    ##    # ##  #  #    ##   #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##    #      ##    #      ##    #     #    #  #   ##   #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //   ##   ##    # #  #  #  ###     ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##   ####  #  #  ###   ###      ##  ###   #  #  #      ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                                          ###                                             ###
    /**
     * Validates that two teams do not have an existing challenge.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Team} team The team.
     * @param {Team} opponent The opposing team.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamsShouldNotHaveExistingChallenge(interaction, team, opponent, member) {
        let existingChallenge;
        try {
            existingChallenge = await Challenge.getByTeams(team, opponent);
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

        if (existingChallenge) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but there is already a pending challenge between these two teams!  Visit ${existingChallenge.channel} for more information about this match.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Challenge already exists.");
        }
    }

    //  #                              ##   #                 ##       #  #  #         #    #  #                    ###               #  #                     ##   ##                #              #   ##   #           ##    ##
    //  #                             #  #  #                  #       #  ## #         #    #  #                     #                ####                    #  #   #                #              #  #  #  #            #     #
    // ###    ##    ###  # #    ###    #    ###    ##   #  #   #     ###  ## #   ##   ###   ####   ###  # #    ##    #     ##    ##   ####   ###  ###   #  #  #      #     ##    ##   # #    ##    ###  #     ###    ###   #     #     ##   ###    ###   ##    ###
    //  #    # ##  #  #  ####  ##       #   #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  #  #  # #   # ##   #    #  #  #  #  #  #  #  #  #  #  #  #  #      #    #  #  #     ##    # ##  #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  ##
    //  #    ##    # ##  #  #    ##   #  #  #  #  #  #  #  #   #    #  #  # ##  #  #   #    #  #  # ##  # #   ##     #    #  #  #  #  #  #  # ##  #  #   # #  #  #   #    #  #  #     # #   ##    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##      ##
    //   ##   ##    # #  #  #  ###     ##   #  #   ##    ###  ###    ###  #  #   ##     ##  #  #   # #   #     ##    #     ##    ##   #  #   # #  #  #    #    ##   ###    ##    ##   #  #   ##    ###   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###
    //                                                                                                                                                   #                                                                                         ###
    /**
     * Validates that teams in a challenge do not have too many clocked challenges.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise} A promise that resolves when the validation is complete.
     */
    static async teamsShouldNotHaveTooManyClockedChallenges(interaction, challenge, member) {
        let challengingTeamClockCount;
        try {
            challengingTeamClockCount = await challenge.challengingTeam.getClockedChallengeCount();
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

        if (challengingTeamClockCount >= 2) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${challenge.challengingTeam.name}** already has two challenges on the clock.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Challenging team has the maximum number of clocked challenges.");
        }

        let challengedTeamClockCount;
        try {
            challengedTeamClockCount = await challenge.challengedTeam.getClockedChallengeCount();
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

        if (challengedTeamClockCount >= 2) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but **${challenge.challengedTeam.name}** already has two challenges on the clock.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Challenged team has the maximum number of clocked challenges.");
        }
    }

    //  #     #                        #                       ##   #                 ##       #  ###         #  #        ##     #       #
    //  #                              #                      #  #  #                  #       #  #  #        #  #         #             #
    // ###   ##    # #    ##    ###   ###    ###  # #   ###    #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   #    ##     ###
    //  #     #    ####  # ##  ##      #    #  #  ####  #  #    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #     #    #  #
    //  #     #    #  #  ##      ##    #    # ##  #  #  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #  ##     ##   # ##   #     #    #  #
    //   ##  ###   #  #   ##   ###      ##   # #  #  #  ###    ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###   ###    ###
    //                                                  #
    /**
     * Validates that a timestamp is valid.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<number>} A promise that returns the timestamp in seconds.
     */
    static async timestampShouldBeValid(interaction, member) {
        const timestamp = interaction.options.getString("timestamp", false);

        if (!timestamp) {
            return void 0;
        }

        if (!timestampParse.test(timestamp)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but you must use the \`/addstats\` command followed by the tracker's game ID to add stats to the challenge.  If necessary, map the in-game pilot names to their Discord accounts by appending the in-game pilot name first and then mentioning the pilot.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid parameters.");
        }

        const {groups: {minutes, seconds}} = timestampParse.exec(timestamp);

        let totalSeconds = 0;
        if (minutes || seconds) {
            totalSeconds = (minutes ? +minutes : 0) * 60 + (seconds ? +seconds : 0);
        }

        return totalSeconds;
    }

    //  #     #                                         ##   #                 ##       #  ###         #  #        ##     #       #
    //  #                                              #  #  #                  #       #  #  #        #  #         #             #
    // ###   ##    # #    ##   ####   ##   ###    ##    #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   #    ##     ###
    //  #     #    ####  # ##    #   #  #  #  #  # ##    #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #     #    #  #
    //  #     #    #  #  ##     #    #  #  #  #  ##    #  #  #  #  #  #  #  #   #    #  #  #  #  ##     ##   # ##   #     #    #  #
    //   ##  ###   #  #   ##   ####   ##   #  #   ##    ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###   ###    ###
    /**
     * Validates that a time zone is valid.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {string} timezone The time zone.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<string>} A promise that returns the current time for the time zone.
     */
    static async timezoneShouldBeValid(interaction, timezone, member) {
        if (!tzdata.zones[timezone]) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but that time zone is not recognized.  Please note that this command is case sensitive.  See #timezone-faq for a complete list of time zones.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid time zone.");
        }

        let time;
        try {
            time = new Date().toLocaleString("en-US", {timeZone: timezone, hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"});
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but that time zone is not recognized.  Please note that this command is case sensitive.  See #timezone-faq for a complete list of time zones.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid time zone.");
        }

        return time;
    }

    //  #                      #                 #  #        ##     ##   #                 ##       #  ###         #  #        ##     #       #
    //  #                      #                 #  #         #    #  #  #                  #       #  #  #        #  #         #             #
    // ###   ###    ###   ##   # #    ##   ###   #  #  ###    #     #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   #    ##     ###
    //  #    #  #  #  #  #     ##    # ##  #  #  #  #  #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #     #    #  #
    //  #    #     # ##  #     # #   ##    #     #  #  #      #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##     ##   # ##   #     #    #  #
    //   ##  #      # #   ##   #  #   ##   #      ##   #     ###    ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###   ###    ###
    /**
     * Validates that a URL is valid tracker URL.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<number>} A promise that returns the game ID.
     */
    static async trackerUrlShouldBeValid(interaction, member) {
        const url = interaction.options.getString("url", true);

        if (!trackerUrlParse.test(url)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but that is not a valid URL.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid URL.");
        }

        const {groups: {gameId}} = trackerUrlParse.exec(url);

        return +gameId;
    }

    //             ##     ##   #                 ##       #  ###         #  #        ##     #       #
    //              #    #  #  #                  #       #  #  #        #  #         #             #
    // #  #  ###    #     #    ###    ##   #  #   #     ###  ###    ##   #  #   ###   #    ##     ###
    // #  #  #  #   #      #   #  #  #  #  #  #   #    #  #  #  #  # ##  #  #  #  #   #     #    #  #
    // #  #  #      #    #  #  #  #  #  #  #  #   #    #  #  #  #  ##     ##   # ##   #     #    #  #
    //  ###  #     ###    ##   #  #   ##    ###  ###    ###  ###    ##    ##    # #  ###   ###    ###
    /**
     * Validates that a URL is valid.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.GuildMember} member The member.
     * @returns {Promise<string>} A promise that returns the tracker URL.
     */
    static async urlShouldBeValid(interaction, member) {
        const url = interaction.options.getString("url", true);

        if (!urlParse.test(url)) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but that is not a valid URL.`,
                        color: 0xff0000
                    })
                ]
            });
            throw new Warning("Invalid URL.");
        }

        return url;
    }
}

module.exports = Validation;
