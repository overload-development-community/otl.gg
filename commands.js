/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 * @typedef {import("./newteam")} NewTeam
 */

const tz = require("timezone-js"),
    tzdata = require("tzdata"),

    Challenge = require("./challenge"),
    Common = require("./web/includes/common"),
    Otl = require("./otl"),
    pjson = require("./package.json"),
    settings = require("./settings"),
    Team = require("./team"),
    Warning = require("./warning"),

    adjudicateMatch = /^(cancel|extend|penalize)(?: ([^ ]{1,5}))?$/,
    colorMatch = /^(?:dark |light )?(?:red|orange|yellow|green|aqua|blue|purple)$/,
    eventParse = /^(.+) ((?:[1-9]|1[0-2])\/(?:[1-9]|[12][0-9]|3[01])\/[1-9][0-9]{3}(?: (?:[1-9]|1[0-2]):[0-5][0-9] [AP]M)?) ((?:[1-9]|1[0-2])\/(?:[1-9]|[12][0-9]|3[01])\/[1-9][0-9]{3}(?: (?:[1-9]|1[0-2]):[0-5][0-9] [AP]M)?)$/,
    idParse = /^<@!?([0-9]+)>$/,
    idConfirmParse = /^<@!?([0-9]+)>(?: (confirm|[^ ]*))?$/,
    idMessageParse = /^<@!?([0-9]+)> ([^ ]+)(?: (.+))?$/,
    mapMatch = /^([123]) (.+)$/,
    nameConfirmParse = /^@?(.+?)(?: (confirm))?$/,
    numberMatch = /^(?:[1-9][0-9]*)$/,
    scoreMatch = /^((?:0|-?[1-9][0-9]*)) ((?:0|-?[1-9][0-9]*))$/,
    statMatch = /^(.+) ([^ ]{1,5}) (0|[1-9][0-9]*) (0|[1-9][0-9]*) (0|[1-9][0-9]*)$/,
    teamNameMatch = /^[0-9a-zA-Z' -]{6,25}$/,
    teamPilotMatch = /^(.+) (<@!?[0-9]+>)$/,
    teamTagMatch = /^[0-9A-Za-z]{1,5}$/,
    teamTagTeamNameMatch = /^([^ ]{1,5}) (.{6,25})$/,
    twoTeamTagMatch = /^([^ ]{1,5}) ([^ ]{1,5})$/;

/**
 * @type {typeof import("./discord")}
 */
let Discord;

setTimeout(() => {
    Discord = require("./discord");
}, 0);

//   ###                                          #
//  #   #                                         #
//  #       ###   ## #   ## #    ###   # ##    ## #   ###
//  #      #   #  # # #  # # #      #  ##  #  #  ##  #
//  #      #   #  # # #  # # #   ####  #   #  #   #   ###
//  #   #  #   #  # # #  # # #  #   #  #   #  #  ##      #
//   ###    ###   #   #  #   #   ####  #   #   ## #  ####
/**
 * A class that handles commands given by chat.
 */
class Commands {
    //       #                 #      ##   #           ##    ##                            ###          #           #    ##
    //       #                 #     #  #  #            #     #                            #  #         #                 #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##   #  #   ##   ###    ###  ##     #     ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  # ##   #    #  #   #     #    ##
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  ##     #    # ##   #     #      ##
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    ##     ##   # #  ###   ###   ###
    //                                                                          ###
    /**
     * Checks to ensure challenge details are loaded.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeDetails(challenge, member, channel) {
        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }
    }

    //       #                 #      ##   #           ##    ##                            ###      #  ####         #            #
    //       #                 #     #  #  #            #     #                             #       #  #                         #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #     ###  ###   #  #  ##     ###   ###    ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    #  #  #      ##    #    ##      #    ##
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #    #  #  #      ##    #      ##    #      ##
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###    ###  ####  #  #  ###   ###      ##  ###
    //                                                                          ###
    /**
     * Checks to ensure a challenge exists.
     * @param {number} id The ID of the challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<Challenge>} A promise that resolves with the challenge.
     */
    static async checkChallengeIdExists(id, member, channel) {
        let challenge;
        try {
            challenge = await Challenge.getById(id);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            await Discord.queue(`Sorry, ${member}, but that was an invalid challenge ID.`, channel);
            throw new Warning("Invalid challenge ID.");
        }

        return challenge;
    }

    //       #                 #      ##   #           ##    ##                            ###           ##                 #    #                         #
    //       #                 #     #  #  #            #     #                             #           #  #               # #                             #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #     ###   #      ##   ###    #    ##    ###   # #    ##    ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    ##     #     #  #  #  #  ###    #    #  #  ####  # ##  #  #
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #      ##   #  #  #  #  #  #   #     #    #     #  #  ##    #  #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###   ###     ##    ##   #  #   #    ###   #     #  #   ##    ###
    //                                                                          ###
    /**
     * Checks to ensure the challenge is confirmed.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeIsConfirmed(challenge, member, channel) {
        if (!challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has not yet been confirmed.`, channel);
            throw new Warning("Match was not confirmed.");
        }
    }

    //       #                 #      ##   #           ##    ##                            ###          #  #         #     ##                 #    #                         #
    //       #                 #     #  #  #            #     #                             #           ## #         #    #  #               # #                             #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #     ###   ## #   ##   ###   #      ##   ###    #    ##    ###   # #    ##    ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    ##     # ##  #  #   #    #     #  #  #  #  ###    #    #  #  ####  # ##  #  #
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #      ##   # ##  #  #   #    #  #  #  #  #  #   #     #    #     #  #  ##    #  #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###   ###    #  #   ##     ##   ##    ##   #  #   #    ###   #     #  #   ##    ###
    //                                                                          ###
    /**
     * Checks to ensure the challenge is not confirmed.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeIsNotConfirmed(challenge, member, channel) {
        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been confirmed.`, channel);
            throw new Warning("Match was already confirmed.");
        }
    }

    //       #                 #      ##   #           ##    ##                            ###          #  #         #    #                 #              #
    //       #                 #     #  #  #            #     #                             #           ## #         #    #                 #              #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #     ###   ## #   ##   ###   #      ##    ##   # #    ##    ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    ##     # ##  #  #   #    #     #  #  #     ##    # ##  #  #
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #      ##   # ##  #  #   #    #     #  #  #     # #   ##    #  #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###   ###    #  #   ##     ##  ####   ##    ##   #  #   ##    ###
    //                                                                          ###
    /**
     * Checks to ensure the challenge is not locked.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeIsNotLocked(challenge, member, channel) {
        if (challenge.details.adminCreated) {
            await Discord.queue(`Sorry, ${member}, but this match is locked, and this command is not available.`, channel);
            throw new Warning("Match is locked by admin.");
        }
    }

    //       #                 #      ##   #           ##    ##                            ###          #  #         #    ###                     ##     #                   #
    //       #                 #     #  #  #            #     #                             #           ## #         #    #  #                     #                         #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #     ###   ## #   ##   ###   #  #   ##   ###    ###   #    ##    ####   ##    ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    ##     # ##  #  #   #    ###   # ##  #  #  #  #   #     #      #   # ##  #  #
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #      ##   # ##  #  #   #    #     ##    #  #  # ##   #     #     #    ##    #  #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###   ###    #  #   ##     ##  #      ##   #  #   # #  ###   ###   ####   ##    ###
    //                                                                          ###
    /**
     * Checks to ensure the challenge is not penalized.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeIsNotPenalized(challenge, member, channel) {
        if (challenge.details.challengingTeamPenalized || challenge.details.challengedTeamPenalized) {
            await Discord.queue(`Sorry, ${member}, but due to penalties to ${challenge.details.challengingTeamPenalized && challenge.details.challengedTeamPenalized ? "both teams" : challenge.details.challengingTeamPenalized ? `**${challenge.challengingTeam.name}**` : `**${challenge.challengedTeam.name}**`}, this command is not available.`, channel);
            throw new Warning("Penalties apply.");
        }
    }

    //       #                 #      ##   #           ##    ##                            ###          #  #         #    #  #         #       #           #
    //       #                 #     #  #  #            #     #                             #           ## #         #    #  #                 #           #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #     ###   ## #   ##   ###   #  #   ##   ##     ###   ##    ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    ##     # ##  #  #   #    #  #  #  #   #    #  #  # ##  #  #
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #      ##   # ##  #  #   #     ##   #  #   #    #  #  ##    #  #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   ###   ###    #  #   ##     ##   ##    ##   ###    ###   ##    ###
    //                                                                          ###
    /**
     * Checks to ensure the challenge is not voided.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeIsNotVoided(challenge, member, channel) {
        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }
    }

    //       #                 #      ##   #           ##    ##                            #  #              ###           ##          #
    //       #                 #     #  #  #            #     #                            ####               #           #  #         #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##   ####   ###  ###    #     ###    #     ##   ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  #  #  #  #   #    ##       #   # ##   #
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  # ##  #  #   #      ##   #  #  ##     #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   #  #   # #  ###   ###   ###     ##    ##     ##
    //                                                                          ###                    #
    /**
     * Checks to ensure the challenge map is set.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeMapIsSet(challenge, member, channel) {
        if (!challenge.details.map) {
            await Discord.queue(`Sorry, ${member}, but the map for this match has not been set yet.`, channel);
            throw new Warning("Map not set.");
        }
    }

    //       #                 #      ##   #           ##    ##                            #  #         #          #     ###    #                ###           ##          #
    //       #                 #     #  #  #            #     #                            ####         #          #      #                       #           #  #         #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##   ####   ###  ###    ##   ###    #    ##    # #    ##    #     ###    #     ##   ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  #  #  #  #   #    #     #  #   #     #    ####  # ##   #    ##       #   # ##   #
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #  # ##   #    #     #  #   #     #    #  #  ##     #      ##   #  #  ##     #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##   #  #   # #    ##   ##   #  #   #    ###   #  #   ##   ###   ###     ##    ##     ##
    //                                                                          ###
    /**
     * Checks to ensure the challenge match time is set.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeMatchTimeIsSet(challenge, member, channel) {
        if (!challenge.details.matchTime) {
            await Discord.queue(`Sorry, ${member}, but the time for this match has not been set yet.`, channel);
            throw new Warning("Match time not set.");
        }
    }

    //       #                 #      ##   #           ##    ##                             ##    #           #            ##                     ##           #
    //       #                 #     #  #  #            #     #                            #  #   #           #           #  #                     #           #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #    ###    ###  ###    ###   #      ##   # #   ###    #     ##   ###    ##
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##    #    #    #  #   #    ##     #     #  #  ####  #  #   #    # ##   #    # ##
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##    #  #   #    # ##   #      ##   #  #  #  #  #  #  #  #   #    ##     #    ##
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##    ##     ##   # #    ##  ###     ##    ##   #  #  ###   ###    ##     ##   ##
    //                                                                          ###                                                         #
    /**
     * Checks to ensure sufficient stats have been posted to the challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<{challengingTeamStats: {pilot: DiscordJs.GuildMember, kills: number, assists: number, deaths: number}[], challengedTeamStats: {pilot: DiscordJs.GuildMember, kills: number, assists: number, deaths: number}[]}>} A promise that resolves with the stats for the game.
     */
    static async checkChallengeStatsComplete(challenge, member, channel) {
        const stats = {};
        try {
            stats.challengingTeamStats = await challenge.getStatsForTeam(challenge.challengingTeam);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (stats.challengingTeamStats.length !== challenge.details.teamSize) {
            await Discord.queue(`Sorry, ${member}, but **${challenge.challengingTeam.tag}** has **${stats.challengingTeamStats.length}** player stats and this match requires **${challenge.details.teamSize}**.`, channel);
            throw new Warning("Insufficient number of stats.");
        }

        try {
            stats.challengedTeamStats = await challenge.getStatsForTeam(challenge.challengedTeam);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (stats.challengedTeamStats.length !== challenge.details.teamSize) {
            await Discord.queue(`Sorry, ${member}, but **${challenge.challengedTeam.tag}** has **${stats.challengedTeamStats.length}** player stats and this match requires **${challenge.details.teamSize}**.`, channel);
            throw new Warning("Insufficient number of stats.");
        }

        return stats;
    }

    //       #                 #      ##   #           ##    ##                            ###                      ##    #                ###           ##          #
    //       #                 #     #  #  #            #     #                             #                      #  #                     #           #  #         #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #     ##    ###  # #    #    ##    ####   ##    #     ###    #     ##   ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    # ##  #  #  ####    #    #      #   # ##   #    ##       #   # ##   #
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #    ##    # ##  #  #  #  #   #     #    ##     #      ##   #  #  ##     #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##    #     ##    # #  #  #   ##   ###   ####   ##   ###   ###     ##    ##     ##
    //                                                                          ###
    /**
     * Checks to ensure the challenge team size is set.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeTeamSizeIsSet(challenge, member, channel) {
        if (!challenge.details.teamSize) {
            await Discord.queue(`Sorry, ${member}, but the team size for this match has not been set yet.`, channel);
            throw new Warning("Team size not set.");
        }
    }

    //       #                 #      ##   #           ##    ##                            ###                      ##    #           #
    //       #                 #     #  #  #            #     #                             #                      #  #   #           #
    //  ##   ###    ##    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##    #     ##    ###  # #    #    ###    ###  ###    ###
    // #     #  #  # ##  #     ##    #     #  #  #  #   #     #    # ##  #  #  #  #  # ##   #    # ##  #  #  ####    #    #    #  #   #    ##
    // #     #  #  ##    #     # #   #  #  #  #  # ##   #     #    ##    #  #   ##   ##     #    ##    # ##  #  #  #  #   #    # ##   #      ##
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##    #     ##    # #  #  #   ##     ##   # #    ##  ###
    //                                                                          ###
    /**
     * Checks to ensure that adding a pilot's stat won't put the team over the number of pilots per side in the challenge.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} pilot The pilot to check.
     * @param {Team} team The team to check.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkChallengeTeamStats(challenge, pilot, team, member, channel) {
        const stats = await challenge.getStatsForTeam(team);

        if (!stats.find((s) => s.pilot.id === pilot.id) && stats.length >= challenge.details.teamSize) {
            await Discord.queue(`Sorry, ${member}, but you have already provided enough pilot stats for this match.`, channel);
            throw new Warning("Too many stats for team.");
        }
    }

    //       #                 #      ##   #                             ##    ###           ##   #           ##    ##                            ###
    //       #                 #     #  #  #                              #     #           #  #  #            #     #                            #  #
    //  ##   ###    ##    ##   # #   #     ###    ###  ###   ###    ##    #     #     ###   #     ###    ###   #     #     ##   ###    ###   ##   #  #   ##    ##   # #
    // #     #  #  # ##  #     ##    #     #  #  #  #  #  #  #  #  # ##   #     #    ##     #     #  #  #  #   #     #    # ##  #  #  #  #  # ##  ###   #  #  #  #  ####
    // #     #  #  ##    #     # #   #  #  #  #  # ##  #  #  #  #  ##     #     #      ##   #  #  #  #  # ##   #     #    ##    #  #   ##   ##    # #   #  #  #  #  #  #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  #  #  #  #   ##   ###   ###   ###     ##   #  #   # #  ###   ###    ##   #  #  #      ##   #  #   ##    ##   #  #
    //                                                                                                                                 ###
    /**
     * Checks to ensure a channel is a challenge room, returning the challenge room.
     * @param {DiscordJs.TextChannel} channel The channel.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @returns {Promise<Challenge>} A promise that resolves with the challenge.
     */
    static async checkChannelIsChallengeRoom(channel, member) {
        try {
            return await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }
    }

    //       #                 #      ##   #                             ##    ###           ##          ##
    //       #                 #     #  #  #                              #     #           #  #        #  #
    //  ##   ###    ##    ##   # #   #     ###    ###  ###   ###    ##    #     #     ###   #  #  ###    #     ##   ###   # #    ##   ###
    // #     #  #  # ##  #     ##    #     #  #  #  #  #  #  #  #  # ##   #     #    ##     #  #  #  #    #   # ##  #  #  # #   # ##  #  #
    // #     #  #  ##    #     # #   #  #  #  #  # ##  #  #  #  #  ##     #     #      ##   #  #  #  #  #  #  ##    #     # #   ##    #
    //  ##   #  #   ##    ##   #  #   ##   #  #   # #  #  #  #  #   ##   ###   ###   ###     ##   #  #   ##    ##   #      #     ##   #
    /**
     * Checks to ensure a channel is a challenge room, returning the challenge room.
     * @param {DiscordJs.TextChannel} channel The channel.
     * @returns {boolean} Whether the channel is on the correct server.
     */
    static checkChannelIsOnServer(channel) {
        return channel.type === "text" && channel.guild.name === settings.guild;
    }

    //       #                 #     #  #               ###                                  #
    //       #                 #     #  #               #  #                                 #
    //  ##   ###    ##    ##   # #   ####   ###   ###   #  #   ###  ###    ###  # #    ##   ###    ##   ###    ###
    // #     #  #  # ##  #     ##    #  #  #  #  ##     ###   #  #  #  #  #  #  ####  # ##   #    # ##  #  #  ##
    // #     #  #  ##    #     # #   #  #  # ##    ##   #     # ##  #     # ##  #  #  ##     #    ##    #       ##
    //  ##   #  #   ##    ##   #  #  #  #   # #  ###    #      # #  #      # #  #  #   ##     ##   ##   #     ###
    /**
     * Checks to ensure a command has parameters.
     * @param {string} message The message sent.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {string} text The text to display if parameters are found.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<boolean>} A promise that returns with whether the check passed.
     */
    static async checkHasParameters(message, member, text, channel) {
        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  ${text}`, channel);
            return false;
        }

        return true;
    }

    //       #                 #     #  #              ###          #  #        ##     #       #
    //       #                 #     ####               #           #  #         #             #
    //  ##   ###    ##    ##   # #   ####   ###  ###    #     ###   #  #   ###   #    ##     ###
    // #     #  #  # ##  #     ##    #  #  #  #  #  #   #    ##     #  #  #  #   #     #    #  #
    // #     #  #  ##    #     # #   #  #  # ##  #  #   #      ##    ##   # ##   #     #    #  #
    //  ##   #  #   ##    ##   #  #  #  #   # #  ###   ###   ###     ##    # #  ###   ###    ###
    //                                           #
    /**
     * Checks to ensure a map is valid.
     * @param {string} map The map to check.
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<string>} A promise that resolves with the chosen map, properly cased.
     */
    static async checkMapIsValid(map, member, channel) {
        let correctedMap;
        try {
            correctedMap = await Otl.validateMap(map);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!correctedMap) {
            await Discord.queue(`Sorry, ${member}, but you that is not a map you can use.  You can only use valid multiplayer maps that you can pick in the game client.`, channel);
            throw new Warning("Invalid map.");
        }

        return correctedMap;
    }

    //       #                 #     #  #              #                  ##               ###          ##                #           #
    //       #                 #     ####              #                 #  #              #  #        #  #               #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###   #      ###  ###   ###    ##   #      ###  ###   ###    ###  ##    ###
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #  #     #  #  #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #     #  #  # ##  #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #      ##    # #  #  #  ###    ##    ##    # #  ###     ##   # #  ###   #  #
    //                                                                                                             #
    /**
     * Checks to ensure the member can be a team captain.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkMemberCanBeCaptain(member, channel) {
        let canBeCaptain;
        try {
            canBeCaptain = await member.canBeCaptain();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${member}, but you are penalized and cannot use this command.  For details, talk to an admin.`, channel);
            throw new Warning("Pilot is penalized from being captain.");
        }
    }

    //       #                 #     #  #              #                  ##                  #         #           ##   ###
    //       #                 #     ####              #                 #  #                 #                    #  #   #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###   #      ###  ###      #   ##   ##    ###   #  #   #     ##    ###  # #
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #  #     #  #  #  #     #  #  #   #    #  #  ####   #    # ##  #  #  ####
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #     #  #  # ##  #  #  #  #  #  #   #    #  #  #  #   #    ##    # ##  #  #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #      ##    # #  #  #   ##    ##   ###   #  #  #  #   #     ##    # #  #  #
    /**
     * Checks to ensure a member can join a team.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkMemberCanJoinATeam(member, channel) {
        let deniedUntil;
        try {
            deniedUntil = await member.joinTeamDeniedUntil();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (deniedUntil) {
            await Discord.queue(`Sorry, ${member}, but you have accepted an invitation in the past 28 days.  You cannot use this command until ${deniedUntil.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, channel);
            throw new Warning("Pilot already accepted an invitation within 28 days.");
        }
    }

    //       #                 #     #  #              #                 #  #               ###          #     #          #     #  #
    //       #                 #     ####              #                 #  #                #                 #          #     ## #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###   ####   ###   ###    #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #  #  #  #  #  ##      #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #     #  #  # ##    ##    #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #     #  #   # #  ###     #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
    /**
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<string>} A promise that resolves with the pilot's Twitch name.
     */
    static async checkMemberHasTwitchName(member, channel) {
        let twitchName;
        try {
            twitchName = await member.getTwitchName();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!twitchName) {
            await Discord.queue(`Sorry, ${member}, but you haven't linked your Twitch channel yet!  Use the \`!twitch\` command to link your Twitch channel.`, channel);
            throw new Warning("Twitch channel not linked.");
        }

        return twitchName;
    }

    //       #                 #     #  #              #                 ###           ##                #           #           ##         ####                       #
    //       #                 #     ####              #                  #           #  #               #                      #  #        #                          #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###    #     ###   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #   #    ##     #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #      #      ##   #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #     ###   ###     ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #
    //                                                                                            #
    /**
     * Checks to ensure a member is a captian or a founder.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkMemberIsCaptainOrFounder(member, channel) {
        const isCaptain = member.isCaptainOrFounder();
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a captain or founder.");
        }
    }

    //       #                 #     #  #              #                 ###          ####                       #
    //       #                 #     ####              #                  #           #                          #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###    #     ###   ###    ##   #  #  ###    ###   ##   ###
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #   #    ##     #     #  #  #  #  #  #  #  #  # ##  #  #
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #      #      ##   #     #  #  #  #  #  #  #  #  ##    #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #     ###   ###    #      ##    ###  #  #   ###   ##   #
    /**
     * Checks to ensure a member is a founder.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkMemberIsFounder(member, channel) {
        const isFounder = member.isFounder();
        if (!isFounder) {
            await Discord.queue(`Sorry, ${member}, but you must be a team founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder.");
        }
    }

    //       #                 #     #  #              #                 ###           ##
    //       #                 #     ####              #                  #           #  #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###    #     ###   #  #  #  #  ###    ##   ###
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #   #    ##     #  #  #  #  #  #  # ##  #  #
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #      #      ##   #  #  ####  #  #  ##    #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #     ###   ###     ##   ####  #  #   ##   #
    /**
     * Checks to ensure the member is the owner of the server.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @returns {void}
     */
    static checkMemberIsOwner(member) {
        if (!Discord.isOwner(member)) {
            throw new Warning("Owner permission required to perform this command.");
        }
    }

    //       #                 #     #  #              #                 #  #         #    ###                              #  ####                    ###
    //       #                 #     ####              #                 ## #         #    #  #                             #  #                        #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###   ## #   ##   ###   ###    ###  ###   ###    ##    ###  ###   ###    ##   # #    #     ##    ###  # #
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #  # ##  #  #   #    #  #  #  #  #  #  #  #  # ##  #  #  #     #  #  #  #  ####   #    # ##  #  #  ####
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #     # ##  #  #   #    #  #  # ##  #  #  #  #  ##    #  #  #     #     #  #  #  #   #    ##    # ##  #  #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #     #  #   ##     ##  ###    # #  #  #  #  #   ##    ###  #     #      ##   #  #   #     ##    # #  #  #
    /**
     * Checks to ensure the member is not banned from a team.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {Team} team The team to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on,
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkMemberNotBannedFromTeam(member, team, channel) {
        let bannedUntil;
        try {
            bannedUntil = await member.bannedFromTeamUntil(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (bannedUntil) {
            await Discord.queue(`Sorry, ${member}, but you have left this team within the past 28 days.  You cannot use this command until ${bannedUntil.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`, channel);
            throw new Warning("Pilot not allowed to accept an invite from this team.");
        }
    }

    //       #                 #     #  #              #                 #  #         #     ##         ###
    //       #                 #     ####              #                 ## #         #    #  #         #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###   ## #   ##   ###   #  #  ###    #     ##    ###  # #
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #  # ##  #  #   #    #  #  #  #   #    # ##  #  #  ####
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #     # ##  #  #   #    #  #  #  #   #    ##    # ##  #  #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #     #  #   ##     ##   ##   #  #   #     ##    # #  #  #
    /**
     * Checks to ensure the member is not on a team.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkMemberNotOnTeam(member, channel) {
        let team;
        try {
            team = await member.getTeam();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (team) {
            await Discord.queue(`Sorry, ${member}, but you are already on **${team.name}**!  Visit your team channel at ${team.teamChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Warning("Pilot is already on a team.");
        }
    }

    //       #                 #     #  #              #                 #  #         #     ##    #                 #     #                ###
    //       #                 #     ####              #                 ## #         #    #  #   #                 #                       #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###   ## #   ##   ###    #    ###    ###  ###   ###   ##    ###    ###   #     ##    ###  # #
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #  # ##  #  #   #      #    #    #  #  #  #   #     #    #  #  #  #   #    # ##  #  #  ####
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #     # ##  #  #   #    #  #   #    # ##  #      #     #    #  #   ##    #    ##    # ##  #  #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #     #  #   ##     ##   ##     ##   # #  #       ##  ###   #  #  #      #     ##    # #  #  #
    //                                                                                                                                ###
    /**
     * Checks to ensure the member is not starting a team.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkMemberNotStartingTeam(member, channel) {
        let newTeam;
        try {
            newTeam = await member.getNewTeam();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (newTeam) {
            await Discord.queue(`Sorry, ${member}, but you are already in the process of starting a team!  Visit ${newTeam.channel} to get started, or \`!cancel\` to cancel your new team creation.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }
    }

    //       #                 #     #  #              #                  ##         ###
    //       #                 #     ####              #                 #  #         #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###   #  #  ###    #     ##    ###  # #
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #  #  #  #  #   #    # ##  #  #  ####
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #     #  #  #  #   #    ##    # ##  #  #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #      ##   #  #   #     ##    # #  #  #
    /**
     * Checks to ensure the member is on the team, and returns the team.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<Team>} A promise that resolves with the member's team.
     */
    static async checkMemberOnTeam(member, channel) {
        let team;
        try {
            team = await member.getTeam();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        return team;
    }

    //       #                 #     #  #              #                  ##    #                 #     #                #  #              ###
    //       #                 #     ####              #                 #  #   #                 #                      ## #               #
    //  ##   ###    ##    ##   # #   ####   ##   # #   ###    ##   ###    #    ###    ###  ###   ###   ##    ###    ###  ## #   ##   #  #   #     ##    ###  # #
    // #     #  #  # ##  #     ##    #  #  # ##  ####  #  #  # ##  #  #    #    #    #  #  #  #   #     #    #  #  #  #  # ##  # ##  #  #   #    # ##  #  #  ####
    // #     #  #  ##    #     # #   #  #  ##    #  #  #  #  ##    #     #  #   #    # ##  #      #     #    #  #   ##   # ##  ##    ####   #    ##    # ##  #  #
    //  ##   #  #   ##    ##   #  #  #  #   ##   #  #  ###    ##   #      ##     ##   # #  #       ##  ###   #  #  #     #  #   ##   ####   #     ##    # #  #  #
    //                                                                                                              ###
    /**
     * Checks to ensure the member is starting a new team, and returns the new team object.
     * @param {DiscordJs.GuildMember} member The member to check.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<NewTeam>} A promise that resolves with the new team object.
     */
    static async checkMemberStartingNewTeam(member, channel) {
        let newTeam;
        try {
            newTeam = await member.getNewTeam();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!newTeam) {
            await Discord.queue(`Sorry, ${member}, but you can only use this command when you're in the process of creating a new team.`, channel);
            throw new Warning("Pilot is not in the process of starting a team.");
        }

        return newTeam;
    }

    //       #                 #     #  #        ###                                  #
    //       #                 #     ## #        #  #                                 #
    //  ##   ###    ##    ##   # #   ## #   ##   #  #   ###  ###    ###  # #    ##   ###    ##   ###    ###
    // #     #  #  # ##  #     ##    # ##  #  #  ###   #  #  #  #  #  #  ####  # ##   #    # ##  #  #  ##
    // #     #  #  ##    #     # #   # ##  #  #  #     # ##  #     # ##  #  #  ##     #    ##    #       ##
    //  ##   #  #   ##    ##   #  #  #  #   ##   #      # #  #      # #  #  #   ##     ##   ##   #     ###
    /**
     * Checks to ensure a command has no parameters.
     * @param {string} message The message sent.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {string} text The text to display if parameters are found.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<boolean>} A promise that returns with whether the check passed.
     */
    static async checkNoParameters(message, member, text, channel) {
        if (message) {
            await Discord.queue(`Sorry, ${member ? `${member}, ` : ""}but this command does not take any parameters.  ${text}`, channel);
            return false;
        }

        return true;
    }

    //       #                 #     ###    #    ##           #     ##               ###          ##                #           #
    //       #                 #     #  #         #           #    #  #              #  #        #  #               #
    //  ##   ###    ##    ##   # #   #  #  ##     #     ##   ###   #      ###  ###   ###    ##   #      ###  ###   ###    ###  ##    ###
    // #     #  #  # ##  #     ##    ###    #     #    #  #   #    #     #  #  #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #
    // #     #  #  ##    #     # #   #      #     #    #  #   #    #  #  # ##  #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #
    //  ##   #  #   ##    ##   #  #  #     ###   ###    ##     ##   ##    # #  #  #  ###    ##    ##    # #  ###     ##   # #  ###   #  #
    //                                                                                                       #
    /**
     * Checks to ensure a pilot can be a captain.
     * @param {DiscordJs.GuildMember} pilot The pilot to check.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkPilotCanBeCaptain(pilot, member, channel) {
        let canBeCaptain;
        try {
            canBeCaptain = await pilot.canBeCaptain();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${member}, but due to past penalties, ${pilot.displayName} is unable to be a team captain or founder.`, channel);
            throw new Warning("Pilot is penalized from being a team captain or founder.");
        }
    }

    //       #                 #     ###    #    ##           #    ####         #            #
    //       #                 #     #  #         #           #    #                         #
    //  ##   ###    ##    ##   # #   #  #  ##     #     ##   ###   ###   #  #  ##     ###   ###    ###
    // #     #  #  # ##  #     ##    ###    #     #    #  #   #    #      ##    #    ##      #    ##
    // #     #  #  ##    #     # #   #      #     #    #  #   #    #      ##    #      ##    #      ##
    //  ##   #  #   ##    ##   #  #  #     ###   ###    ##     ##  ####  #  #  ###   ###      ##  ###
    /**
     * Checks to ensure the pilot exists, and returns the pilot.
     * @param {string} message The message sent.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<DiscordJs.GuildMember>} A promise that resolves with the pilot.
     */
    static async checkPilotExists(message, member, channel) {
        let pilot;
        if (idParse.test(message)) {
            const {1: id} = idParse.exec(message);

            pilot = Discord.findGuildMemberById(id);
        } else {
            pilot = Discord.findGuildMemberByDisplayName(message);
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${member ? `${member}, ` : ""}but I can't find that pilot on this server.  You must mention the pilot.`, channel);
            throw new Warning("Pilot not found.");
        }

        return pilot;
    }

    //       #                 #     ###    #    ##           #    ####         #            #           #  #   #     #    #      ##                 #    #                       #     #
    //       #                 #     #  #         #           #    #                         #           #  #         #    #     #  #               # #                           #
    //  ##   ###    ##    ##   # #   #  #  ##     #     ##   ###   ###   #  #  ##     ###   ###    ###   #  #  ##    ###   ###   #      ##   ###    #    ##    ###   # #    ###  ###   ##     ##   ###
    // #     #  #  # ##  #     ##    ###    #     #    #  #   #    #      ##    #    ##      #    ##     ####   #     #    #  #  #     #  #  #  #  ###    #    #  #  ####  #  #   #     #    #  #  #  #
    // #     #  #  ##    #     # #   #      #     #    #  #   #    #      ##    #      ##    #      ##   ####   #     #    #  #  #  #  #  #  #  #   #     #    #     #  #  # ##   #     #    #  #  #  #
    //  ##   #  #   ##    ##   #  #  #     ###   ###    ##     ##  ####  #  #  ###   ###      ##  ###    #  #  ###     ##  #  #   ##    ##   #  #   #    ###   #     #  #   # #    ##  ###    ##   #  #
    /**
     * Checks to ensure the pilot exists, and returns the pilot along with whether there was confirmation.
     * @param {string} message The message sent.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<{pilot: DiscordJs.GuildMember, confirm: string}>} A promise that resolves with the pilot and whether there was confirmation.
     */
    static async checkPilotExistsWithConfirmation(message, member, channel) {
        let pilot, confirm;
        if (idConfirmParse.test(message)) {
            const {1: id, 2: confirmed} = idConfirmParse.exec(message);

            pilot = Discord.findGuildMemberById(id);
            confirm = confirmed;
        } else if (nameConfirmParse.test(message)) {
            const {1: name, 2: confirmed} = nameConfirmParse.exec(message);

            pilot = Discord.findGuildMemberByDisplayName(name);
            confirm = confirmed;
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${member}, but I can't find that pilot on this server.  You must mention the pilot you wish to make founder.`, channel);
            throw new Warning("Pilot not found.");
        }

        return {pilot, confirm};
    }

    //       #                 #     ###    #    ##           #     ##         ###
    //       #                 #     #  #         #           #    #  #         #
    //  ##   ###    ##    ##   # #   #  #  ##     #     ##   ###   #  #  ###    #     ##    ###  # #
    // #     #  #  # ##  #     ##    ###    #     #    #  #   #    #  #  #  #   #    # ##  #  #  ####
    // #     #  #  ##    #     # #   #      #     #    #  #   #    #  #  #  #   #    ##    # ##  #  #
    //  ##   #  #   ##    ##   #  #  #     ###   ###    ##     ##   ##   #  #   #     ##    # #  #  #
    /**
     * Checks to ensure the pilot is on the specified team.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} pilot The pilot to check.
     * @param {DiscordJs.GuildMember} member The member issuing the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkPilotOnTeam(team, pilot, member, channel) {
        if (!team.role.members.find((m) => m.id === pilot.id)) {
            await Discord.queue(`Sorry, ${member}, but this pilot is not on **${team.name}**.`, channel);
            throw new Warning("Pilot is not on the correct team.");
        }
    }

    //       #                 #     ###                     ####         #            #
    //       #                 #      #                      #                         #
    //  ##   ###    ##    ##   # #    #     ##    ###  # #   ###   #  #  ##     ###   ###    ###
    // #     #  #  # ##  #     ##     #    # ##  #  #  ####  #      ##    #    ##      #    ##
    // #     #  #  ##    #     # #    #    ##    # ##  #  #  #      ##    #      ##    #      ##
    //  ##   #  #   ##    ##   #  #   #     ##    # #  #  #  ####  #  #  ###   ###      ##  ###
    /**
     * Checks to ensure the team exists, and returns the team.
     * @param {string} message The message sent.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<Team>} A promise that resolves with the team.
     */
    static async checkTeamExists(message, member, channel) {
        let team;
        try {
            team = await Team.getByNameOrTag(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but I can't find a team by the name of **${message}**.`, channel);
            throw new Warning("Team does not exist.");
        }

        return team;
    }

    //       #                 #     ###                     ####         #            #           #  #   #     #    #      ##                 #    #                       #     #
    //       #                 #      #                      #                         #           #  #         #    #     #  #               # #                           #
    //  ##   ###    ##    ##   # #    #     ##    ###  # #   ###   #  #  ##     ###   ###    ###   #  #  ##    ###   ###   #      ##   ###    #    ##    ###   # #    ###  ###   ##     ##   ###
    // #     #  #  # ##  #     ##     #    # ##  #  #  ####  #      ##    #    ##      #    ##     ####   #     #    #  #  #     #  #  #  #  ###    #    #  #  ####  #  #   #     #    #  #  #  #
    // #     #  #  ##    #     # #    #    ##    # ##  #  #  #      ##    #      ##    #      ##   ####   #     #    #  #  #  #  #  #  #  #   #     #    #     #  #  # ##   #     #    #  #  #  #
    //  ##   #  #   ##    ##   #  #   #     ##    # #  #  #  ####  #  #  ###   ###      ##  ###    #  #  ###     ##  #  #   ##    ##   #  #   #    ###   #     #  #   # #    ##  ###    ##   #  #
    /**
     * Checks to ensure the team exists, and returns the team along with whether there was confirmation.
     * @param {string} message The message sent.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<{team: Team, confirm: string}>} A promise that resolves with the team and whether there was confirmation.
     */
    static async checkTeamExistsWithConfirmation(message, member, channel) {
        const {1: name, 2: confirm} = nameConfirmParse.exec(message);
        let team;
        try {
            team = await Team.getByNameOrTag(name);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but I have no record of that team ever existing.`, channel);
            throw new Warning("Team does not exist.");
        }

        return {team, confirm};
    }

    //       #                 #     ###                     ###          ###          ##   #           ##    ##
    //       #                 #      #                       #            #          #  #  #            #     #
    //  ##   ###    ##    ##   # #    #     ##    ###  # #    #     ###    #    ###   #     ###    ###   #     #     ##   ###    ###   ##
    // #     #  #  # ##  #     ##     #    # ##  #  #  ####   #    ##      #    #  #  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     #  #  ##    #     # #    #    ##    # ##  #  #   #      ##    #    #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##   #  #   ##    ##   #  #   #     ##    # #  #  #  ###   ###    ###   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                           ###
    /**
     * Checks to ensure a team is in a challenge.
     * @param {Challenge} challenge The challenge.
     * @param {Team} team The team.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise} A promise that resolves when the check has completed.
     */
    static async checkTeamIsInChallenge(challenge, team, member, channel) {
        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but **${team.name}** is not one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }
    }

    //       #                 #     ###    #                                        ###          #  #        ##     #       #
    //       #                 #      #                                               #           #  #         #             #
    //  ##   ###    ##    ##   # #    #    ##    # #    ##   ####   ##   ###    ##    #     ###   #  #   ###   #    ##     ###
    // #     #  #  # ##  #     ##     #     #    ####  # ##    #   #  #  #  #  # ##   #    ##     #  #  #  #   #     #    #  #
    // #     #  #  ##    #     # #    #     #    #  #  ##     #    #  #  #  #  ##     #      ##    ##   # ##   #     #    #  #
    //  ##   #  #   ##    ##   #  #   #    ###   #  #   ##   ####   ##   #  #   ##   ###   ###     ##    # #  ###   ###    ###
    /**
     * Checks to ensure a time zone is valid.
     * @param {string} message The message sent.
     * @param {DiscordJs.GuildMember} member The pilot sending the command.
     * @param {DiscordJs.TextChannel} channel The channel to reply on.
     * @returns {Promise<string>} A promise that resolves with the time in the specified time zone.
     */
    static async checkTimezoneIsValid(message, member, channel) {
        if (!tzdata.zones[message]) {
            await Discord.queue(`Sorry, ${member}, but that time zone is not recognized.  Please note that this command is case sensitive.  See #timezone-faq for a complete list of time zones.`, channel);
            throw new Warning("Invalid time zone.");
        }

        let time;
        try {
            time = new Date().toLocaleString("en-US", {timeZone: message, hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"});
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but that time zone is not recognized.  Please note that this command is case sensitive.  See #timezone-faq for a complete list of time zones.`, channel);
            throw new Warning("Invalid time zone.");
        }

        return time;
    }

    //         #                ##           #
    //                           #           #
    //  ###   ##    # #   #  #   #     ###  ###    ##
    // ##      #    ####  #  #   #    #  #   #    # ##
    //   ##    #    #  #  #  #   #    # ##   #    ##
    // ###    ###   #  #   ###  ###    # #    ##   ##
    /**
     * Simulates other users making a command.
     * @param {DiscordJs.GuildMember} member The guild member initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async simulate(member, channel, message) {
        await Commands.checkMemberIsOwner(member);

        if (!idMessageParse.test(message)) {
            return false;
        }

        const {1: id, 2: command, 3: newMessage} = idMessageParse.exec(message);
        if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(command) === -1) {
            throw new Warning("Invalid command.");
        }

        const newMember = await Discord.findGuildMemberById(id);
        if (!newMember) {
            throw new Warning("User does not exist on the server.");
        }

        return await this[command](newMember, channel, newMessage) || void 0;
    }

    // #           ##
    // #            #
    // ###    ##    #    ###
    // #  #  # ##   #    #  #
    // #  #  ##     #    #  #
    // #  #   ##   ###   ###
    //                   #
    /**
     * Replies with a URL to the bot's help page.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async help(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        if (message) {
            return false;
        }

        await Discord.queue(`${member}, see the about page at http://otl.gg/about.`, channel);
        return true;
    }

    //                           #
    //
    // # #    ##   ###    ###   ##     ##   ###
    // # #   # ##  #  #  ##      #    #  #  #  #
    // # #   ##    #       ##    #    #  #  #  #
    //  #     ##   #     ###    ###    ##   #  #
    /**
     * Replies with the current version of the bot.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async version(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        if (message) {
            return false;
        }

        await Discord.queue(`We are The Fourth Sovereign, we are trillions.  By roncli, Version ${pjson.version}.  Project is open source, visit https://github.com/roncli/otl-bot.`, channel);
        return true;
    }

    //             #             #     #
    //             #                   #
    // #  #   ##   ###    ###   ##    ###    ##
    // #  #  # ##  #  #  ##      #     #    # ##
    // ####  ##    #  #    ##    #     #    ##
    // ####   ##   ###   ###    ###     ##   ##
    /**
     * Replies with OTL's Website URL.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async website(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        if (message) {
            return false;
        }

        await Discord.queue("Visit our website at http://otl.gg for league standings, matches, and stats!", channel);
        return true;
    }

    //                          #           #
    //                          #           #
    //  ##   ###    ##    ###  ###    ##   ###    ##    ###  # #
    // #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     #     ##    # ##   #    ##     #    ##    # ##  #  #
    //  ##   #      ##    # #    ##   ##     ##   ##    # #  #  #
    /**
     * Allows a pilot who is not part of a team to create a new time.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async createteam(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberNotStartingTeam(member, channel);
        await Commands.checkMemberNotOnTeam(member, channel);
        await Commands.checkMemberCanBeCaptain(member, channel);
        await Commands.checkMemberCanJoinATeam(member, channel);

        if (!await Commands.checkNoParameters(message, member, "Use `!createteam` by itself to begin the process of creating a team.", channel)) {
            return false;
        }

        let newTeam;
        try {
            newTeam = await member.createNewTeam();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you have begun the process of creating a team.  Visit ${newTeam.channel} to set up your new team.`, channel);
        return true;
    }

    // ###    ###  # #    ##
    // #  #  #  #  ####  # ##
    // #  #  # ##  #  #  ##
    // #  #   # #  #  #   ##
    /**
     * Names a new team that's being created.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async name(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const newTeam = await Commands.checkMemberStartingNewTeam(member, channel);

        if (!await Commands.checkHasParameters(message, member, "To name your team, add the team name after the command, for example `!name Cronus Frontier`.", channel)) {
            return false;
        }

        if (!teamNameMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but to prevent abuse, you can only use alphanumeric characters and spaces, and names must be between 6 and 25 characters.  In the event you need to use other characters, please name your team within the rules for now, and then contact an admin after your team is created.`, channel);
            throw new Warning("Invalid team name.");
        }

        if (Team.nameExists(message)) {
            await Discord.queue(`Sorry, ${member}, but this team name already exists!`, channel);
            throw new Warning("Team name already exists.");
        }

        try {
            await newTeam.setName(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team name is now set to ${message}.  Note that proper casing may be applied to your name by an admin.`, channel);
        return true;
    }

    //  #
    //  #
    // ###    ###   ###
    //  #    #  #  #  #
    //  #    # ##   ##
    //   ##   # #  #
    //              ###
    /**
     * Assigns a tag to a new team that's being created.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async tag(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const newTeam = await Commands.checkMemberStartingNewTeam(member, channel);

        if (!await Commands.checkHasParameters(message, member, "To assign a tag to your team, add the tag after the command, for example `!tag CF` for a team named Cronus Frontier.", channel)) {
            return false;
        }

        message = message.toUpperCase();

        if (!teamTagMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you can only use alphanumeric characters, and are limited to 5 characters.`, channel);
            throw new Warning("Invalid team tag.");
        }

        if (Team.tagExists(message)) {
            await Discord.queue(`Sorry, ${member}, but this team tag already exists!`, channel);
            throw new Warning("Team tag already exists.");
        }

        try {
            await newTeam.setTag(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team tag is now set to ${message}.`, channel);
        return true;
    }

    //                               ##
    //                                #
    //  ##    ###  ###    ##    ##    #
    // #     #  #  #  #  #     # ##   #
    // #     # ##  #  #  #     ##     #
    //  ##    # #  #  #   ##    ##   ###
    /**
     * Cancels a new team request.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async cancel(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const newTeam = await Commands.checkMemberStartingNewTeam(member, channel);

        if (!message) {
            await Discord.queue(`${member}, are you sure you want to cancel your new team request?  There is no undoing this action!  Type \`!cancel confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!cancel confirm\` to confirm that you wish to cancel your request to create a team.`, channel);
            return false;
        }

        try {
            await newTeam.delete(`${member.displayName} cancelled team creation.`);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue("Your request to create a team has been cancelled.", member);
        return true;
    }

    //                         ##           #
    //                          #           #
    //  ##    ##   # #   ###    #     ##   ###    ##
    // #     #  #  ####  #  #   #    # ##   #    # ##
    // #     #  #  #  #  #  #   #    ##     #    ##
    //  ##    ##   #  #  ###   ###    ##     ##   ##
    //                   #
    /**
     * Completes a new team request.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async complete(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const newTeam = await Commands.checkMemberStartingNewTeam(member, channel);

        if (!newTeam.name) {
            await Discord.queue(`Sorry, ${member}, but you must use the \`!name\` and \`!tag\` commands to give your team a name and a tag before completing your request to create a team.`, channel);
            throw new Warning("Team not yet given a name.");
        }

        if (!newTeam.tag) {
            await Discord.queue(`Sorry, ${member}, but you must use the \`!tag\` command to give your team a tag before completing your request to create a team.`, channel);
            throw new Warning("Team not yet given a tag.");
        }

        if (Team.nameExists(newTeam.name)) {
            await Discord.queue(`Sorry, ${member}, but this team name already exists!  You'll need to use the \`!name\` command to try another.`, channel);
            throw new Warning("Team name already exists.");
        }

        if (Team.tagExists(newTeam.tag)) {
            await Discord.queue(`Sorry, ${member}, but this team tag already exists!  You'll need to use the \`!tag\` command to try another.`, channel);
            throw new Warning("Team tag already exists.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you want to complete your request to create a team?  There is no undoing this action!  Type \`!complete confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!complete confirm\` to confirm that you wish to complete your request to create a team.`, channel);
            return false;
        }

        let team;
        try {
            team = await newTeam.createTeam();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`Congratulations, ${member}!  Your team has been created!  You may now visit ${team.teamChannel} for team chat, and ${team.captainsChannel} for private chat with your team captains as well as system notifications for your team.`, member);
        return true;
    }

    //             ##
    //              #
    //  ##    ##    #     ##   ###
    // #     #  #   #    #  #  #  #
    // #     #  #   #    #  #  #
    //  ##    ##   ###    ##   #
    /**
     * Assigns a color to the team's Discord role.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async color(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You can use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter `!color dark green`.", channel)) {
            return false;
        }

        if (!colorMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you can only use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter \`!color dark green\`.`, channel);
            throw new Warning("Invalid color.");
        }

        const team = await Commands.checkMemberOnTeam(member, channel),
            colors = message.split(" ");
        let color;

        switch (colors[colors.length === 1 ? 0 : 1]) {
            case "red":
                switch (colors[0]) {
                    case "dark":
                        color = 0x800000;
                        break;
                    case "light":
                        color = 0xFF8080;
                        break;
                    default:
                        color = 0xFF0000;
                        break;
                }
                break;
            case "orange":
                switch (colors[0]) {
                    case "dark":
                        color = 0x804000;
                        break;
                    case "light":
                        color = 0xFFC080;
                        break;
                    default:
                        color = 0xFF8000;
                        break;
                }
                break;
            case "yellow":
                switch (colors[0]) {
                    case "dark":
                        color = 0x808000;
                        break;
                    case "light":
                        color = 0xFFFF80;
                        break;
                    default:
                        color = 0xFFFF00;
                        break;
                }
                break;
            case "green":
                switch (colors[0]) {
                    case "dark":
                        color = 0x008000;
                        break;
                    case "light":
                        color = 0x80FF80;
                        break;
                    default:
                        color = 0x00FF00;
                        break;
                }
                break;
            case "aqua":
                switch (colors[0]) {
                    case "dark":
                        color = 0x008080;
                        break;
                    case "light":
                        color = 0x80FFFF;
                        break;
                    default:
                        color = 0x00FFFF;
                        break;
                }
                break;
            case "blue":
                switch (colors[0]) {
                    case "dark":
                        color = 0x000080;
                        break;
                    case "light":
                        color = 0x8080FF;
                        break;
                    default:
                        color = 0x0000FF;
                        break;
                }
                break;
            case "purple":
                switch (colors[0]) {
                    case "dark":
                        color = 0x800080;
                        break;
                    case "light":
                        color = 0xFF80FF;
                        break;
                    default:
                        color = 0xFF00FF;
                        break;
                }
                break;
        }

        try {
            await team.changeColor(member, color);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team's color has been updated.`, channel);
        return true;
    }

    //          #     #                     #           #
    //          #     #                     #
    //  ###   ###   ###   ##    ###  ###   ###    ###  ##    ###
    // #  #  #  #  #  #  #     #  #  #  #   #    #  #   #    #  #
    // # ##  #  #  #  #  #     # ##  #  #   #    # ##   #    #  #
    //  # #   ###   ###   ##    # #  ###     ##   # #  ###   #  #
    //                               #
    /**
     * Adds a captain to the team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async addcaptain(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You must mention the pilot on your team that you wish to add as a captain.", channel)) {
            return false;
        }

        const captain = await Commands.checkPilotExists(message, member, channel);

        if (captain.id === member.id) {
            await Discord.queue(`Sorry, ${member}, but you can't promote yourself to captain!`, channel);
            throw new Warning("Pilot can't promote themselves.");
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkPilotOnTeam(team, captain, member, channel);

        const isCaptain = captain.isCaptainOrFounder();
        if (isCaptain) {
            await Discord.queue(`Sorry, ${member}, but ${captain.displayName} is already a captain!`, channel);
            throw new Warning("Pilot is already a captain.");
        }

        const captainCount = team.captainCount();
        if (captainCount >= 2) {
            await Discord.queue(`Sorry, ${member}, but you already have ${captainCount} captains, and the limit is 2.`, channel);
            throw new Warning("Captain count limit reached.");
        }

        await Commands.checkPilotCanBeCaptain(captain, member, channel);

        try {
            await team.addCaptain(member, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, ${captain.displayName} is now a team captain!`, channel);
        return true;
    }

    //                                                        #           #
    //                                                        #
    // ###    ##   # #    ##   # #    ##    ##    ###  ###   ###    ###  ##    ###
    // #  #  # ##  ####  #  #  # #   # ##  #     #  #  #  #   #    #  #   #    #  #
    // #     ##    #  #  #  #  # #   ##    #     # ##  #  #   #    # ##   #    #  #
    // #      ##   #  #   ##    #     ##    ##    # #  ###     ##   # #  ###   #  #
    //                                                 #
    /**
     * Removes a captain from the team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async removecaptain(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You must mention the pilot on your team that you wish to remove as a captain.", channel)) {
            return false;
        }

        const captain = await Commands.checkPilotExists(message, member, channel);

        if (captain.id === member.id) {
            await Discord.queue(`Sorry, ${member}, but you can't remove yourself as captain!`, channel);
            throw new Warning("Pilot can't remove themselves as captain.");
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        if (!team.role.members.find((m) => m.id === captain.id)) {
            await Discord.queue(`Sorry, ${member}, but you can only remove a captain if they are on your team.`, channel);
            throw new Warning("Pilots are not on the same team.");
        }

        const isCaptain = captain.isCaptainOrFounder();
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${member}, but ${captain.displayName} is not a captain!`, channel);
            throw new Warning("Pilot is not a captain.");
        }

        try {
            await team.removeCaptain(member, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, ${captain.displayName} is no longer a team captain.`, channel);
        return true;
    }

    //    #   #           #                    #
    //    #               #                    #
    //  ###  ##     ###   ###    ###  ###    ###
    // #  #   #    ##     #  #  #  #  #  #  #  #
    // #  #   #      ##   #  #  # ##  #  #  #  #
    //  ###  ###   ###    ###    # #  #  #   ###
    /**
     * Disbands a team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async disband(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsFounder(member, channel);

        const team = await Commands.checkMemberOnTeam(member, channel);

        if (team.locked) {
            await Discord.queue(`Sorry, ${member}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Warning("Team rosters are locked.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you want to disband your team?  There is no undoing this action!  Type \`!disband confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!disband confirm\` to confirm that you wish to disband your team.`, channel);
            return false;
        }

        try {
            await team.disband(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue("You have successfully disbanded your team.  Note that you or anyone else who has been founder or captain of your team in the past may `!reinstate` your team.", member);
        return true;
    }

    //             #           ####                       #
    //             #           #                          #
    // # #    ###  # #    ##   ###    ##   #  #  ###    ###   ##   ###
    // ####  #  #  ##    # ##  #     #  #  #  #  #  #  #  #  # ##  #  #
    // #  #  # ##  # #   ##    #     #  #  #  #  #  #  #  #  ##    #
    // #  #   # #  #  #   ##   #      ##    ###  #  #   ###   ##   #
    /**
     * Transfers team founder to another pilot.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async makefounder(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You must mention the pilot you wish to make founder.", channel)) {
            return false;
        }

        const {pilot, confirm} = await Commands.checkPilotExistsWithConfirmation(message, member, channel);

        if (!pilot) {
            await Discord.queue(`Sorry, ${member}, but I can't find that pilot on this server.  You must mention the pilot you wish to make founder.`, channel);
            throw new Warning("Pilot not found.");
        }

        if (pilot.id === member.id) {
            await Discord.queue(`Sorry, ${member}, you can't make yourself the team's founder, you already *are* the founder!`, channel);
            throw new Warning("Pilot is already the team's founder.");
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkPilotOnTeam(team, pilot, member, channel);

        const captainCount = team.captainCount();
        if (captainCount === 2 && !pilot.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you already have ${captainCount} captains, and the limit is 2.`, channel);
            throw new Warning("Captain count limit reached.");
        }

        await Commands.checkPilotCanBeCaptain(pilot, member, channel);

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you want to make ${pilot.displayName} your team's founder?  Type \`!makefounder ${pilot.displayName} confirm\` to confirm.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!makefounder ${pilot.displayName} confirm\` to confirm that you wish to transfer team ownership.`, channel);
            return false;
        }

        try {
            await team.makeFounder(member, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you have transferred team ownership to ${pilot.displayName}.  You remain a team captain.`, member);
        return true;
    }

    //              #                  #           #
    //                                 #           #
    // ###    ##   ##    ###    ###   ###    ###  ###    ##
    // #  #  # ##   #    #  #  ##      #    #  #   #    # ##
    // #     ##     #    #  #    ##    #    # ##   #    ##
    // #      ##   ###   #  #  ###      ##   # #    ##   ##
    /**
     * Reinstates a disbanded team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async reinstate(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberNotStartingTeam(member, channel);
        await Commands.checkMemberNotOnTeam(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You must mention the pilot you wish to make founder.", channel)) {
            return false;
        }

        const {team, confirm} = await Commands.checkTeamExistsWithConfirmation(message, member, channel);

        if (!team.disbanded) {
            await Discord.queue(`Sorry, ${member}, but you can't reinstate a team that isn't disbanded.`, channel);
            throw new Warning("Team is not disbanded.");
        }

        let wasCaptain;
        try {
            wasCaptain = await member.wasPreviousCaptainOrFounderOfTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!wasCaptain) {
            await Discord.queue(`Sorry, ${member}, but you must have been a captain or founder of the team you are trying to reinstate.`, channel);
            throw new Warning("Team does not exist.");
        }

        await Commands.checkMemberCanBeCaptain(member, channel);
        await Commands.checkMemberCanJoinATeam(member, channel);
        await Commands.checkMemberNotBannedFromTeam(member, team, channel);

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you wish to reinstate this team?  Type \`!reinstate ${team.name} confirm\` to confirm that you wish to reinstate this team.  Note that you will not be able to accept another invitation or create a team for 28 days.`, channel);
            return true;
        }

        try {
            await team.reinstate(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team has been reinstated!`, channel);
        await Discord.queue(`Congratulations, ${member}!  Your team has been reinstated!  You may now visit ${team.teamChannel} for team chat, and ${team.captainsChannel} for private chat with your team captains as well as system notifications for your team.`, member);
        return true;
    }

    // #
    // #
    // ###    ##   # #    ##
    // #  #  #  #  ####  # ##
    // #  #  #  #  #  #  ##
    // #  #   ##   #  #   ##
    /**
     * Sets a team's home map.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async home(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "To set one of your three home maps, you must include the home number you wish to set, followed by the name of the map.  For instance, to set your second home map to Vault, enter the following command: `!home 2 Vault`.", channel)) {
            return false;
        }

        if (!mapMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must include the home number you wish to set, followed by the name of the map, such as \`!home 2 Vault\`.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        const {1: number, 2: mapToCheck} = mapMatch.exec(message),
            map = await Commands.checkMapIsValid(mapToCheck, member, channel),
            team = await Commands.checkMemberOnTeam(member, channel);

        let homes;
        try {
            homes = await team.getHomeMaps();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (homes.indexOf(map) !== -1) {
            await Discord.queue(`Sorry, ${member}, but you already have this map set as your home.`, channel);
            throw new Warning("Team already has this home map set.");
        }

        try {
            await team.applyHomeMap(member, +number, map);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your home map has been set.  Note this only applies to future challenges, any current challenges you have will use the home maps you had at the time of the challenge.`, channel);
        return true;
    }

    //                                       #
    //                                       #
    // ###    ##    ###  #  #   ##    ###   ###
    // #  #  # ##  #  #  #  #  # ##  ##      #
    // #     ##    #  #  #  #  ##      ##    #
    // #      ##    ###   ###   ##   ###      ##
    //                #
    /**
     * Request to join a team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async request(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberNotStartingTeam(member, channel);
        await Commands.checkMemberNotOnTeam(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You must include the name of the team you want to send a join request to.", channel)) {
            return false;
        }

        const team = await Commands.checkTeamExists(message, member, channel);

        if (team.disbanded) {
            await Discord.queue(`Sorry, ${member}, but that team has disbanded.  A former captain or founder may reinstate the team with the \`!reinstate ${team.tag}\` command.`, channel);
            throw new Warning("Team is disbanded.");
        }

        let hasRequested;
        try {
            hasRequested = await member.hasRequestedTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (hasRequested) {
            await Discord.queue(`Sorry, ${member}, but to prevent abuse, you may only requeset to join a team once.`, channel);
            throw new Warning("Request already exists.");
        }

        let hasBeenInvited;
        try {
            hasBeenInvited = await member.hasBeenInvitedToTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (hasBeenInvited) {
            await Discord.queue(`Sorry, ${member}, but you have already been invited to this team.  Type \`!accept ${team.tag.toLowerCase()}\` to join **${team.name}**.`, channel);
            throw new Warning("Invitation exists, request not necessary.");
        }

        try {
            await member.requestTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your request has been sent to join ${team.name}.  The team's leadership has been notified of this request.`, channel);
        return true;
    }

    //  #                 #     #
    //                          #
    // ##    ###   # #   ##    ###    ##
    //  #    #  #  # #    #     #    # ##
    //  #    #  #  # #    #     #    ##
    // ###   #  #   #    ###     ##   ##
    /**
     * Invites a pilot to a team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async invite(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You must mention the pilot you wish to invite.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);
        let pilotCount;
        try {
            pilotCount = await team.getPilotAndInvitedCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (pilotCount >= 8) {
            await Discord.queue(`Sorry, ${member}, but there is a maximum of 8 pilots per roster, and your team currently has ${pilotCount}, including invited pilots.`, channel);
            throw new Warning("Roster is full.");
        }

        const pilot = await Commands.checkPilotExists(message, member, channel);

        let existingNewTeam;
        try {
            existingNewTeam = await pilot.getNewTeam();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (existingNewTeam) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} is currently in the process of starting a team.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        let invited;
        try {
            invited = await pilot.hasBeenInvitedToTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (invited) {
            await Discord.queue(`Sorry, ${member}, but to prevent abuse you can only invite a pilot to your team once.  If ${pilot.displayName} has not responded yet, ask them to \`!accept\` the invitation.`, channel);
            throw new Warning("Pilot already invited.");
        }

        let currentTeam;
        try {
            currentTeam = await pilot.getTeam();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (currentTeam) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} is already on another team!`, channel);
            throw new Warning("Pilot already on another team.");
        }

        try {
            await team.invitePilot(member, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, ${pilot.displayName} has been invited to your team.`, channel);
        return true;
    }

    //                                #
    //                                #
    //  ###   ##    ##    ##   ###   ###
    // #  #  #     #     # ##  #  #   #
    // # ##  #     #     ##    #  #   #
    //  # #   ##    ##    ##   ###     ##
    //                         #
    /**
     * Accept an invitation to join a team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async accept(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberNotStartingTeam(member, channel);
        await Commands.checkMemberNotOnTeam(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You must include the name or tag of the team you wish to accept an invitation from.  For example, if you wish to accept an invitation from Cronus Frontier, use either `!accept Cronus Frontier` or `!accept CF`.", channel)) {
            return false;
        }

        if (!nameConfirmParse.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must include the name or tag of the team you wish to accept an invitation from.  For example, if you wish to accept an invitation from Cronus Frontier, use either \`!accept Cronus Frontier\` or \`!accept CF\`.`, channel);
            return false;
        }

        const {team, confirm} = await Commands.checkTeamExistsWithConfirmation(message, member, channel);

        if (team.disbanded) {
            await Discord.queue(`Sorry, ${member}, but that team has disbanded.  A former captain or founder may reinstate the team with the \`!reinstate ${team.tag}\` command.`, channel);
            throw new Warning("Team is disbanded.");
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${member}, but that team's roster is locked for the playoffs.  Roster changes will become available when that team is no longer participating.`, channel);
            throw new Warning("Team rosters are locked.");
        }

        let isInvited;
        try {
            isInvited = await member.hasBeenInvitedToTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!isInvited) {
            await Discord.queue(`Sorry, ${member}, but you don't have a pending invitation to ${team.name}.`, channel);
            throw new Warning("Pilot does not have an invitation to accept.");
        }

        await Commands.checkMemberCanJoinATeam(member, channel);
        await Commands.checkMemberNotBannedFromTeam(member, team, channel);

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you want to join **${team.name}**?  Type \`!accept ${team.tag.toUpperCase()} confirm\` to confirm.  Note that you will not be able to accept another invitation or create a team for 28 days.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!accept ${team.tag.toUpperCase()} confirm\` to confirm that you wish to join this team.`, channel);
            return false;
        }

        let requestedTeams;
        try {
            requestedTeams = await member.getRequestedOrInvitedTeams();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        try {
            await team.addPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        requestedTeams.forEach(async (requestedTeam) => {
            await requestedTeam.updateChannels();
        });

        await Discord.queue(`${member}, you are now a member of **${team.name}**!  Visit your team channel at ${team.teamChannel} to talk with your teammates.  Best of luck flying in the OTL!`, channel);
        return true;
    }

    // ##
    //  #
    //  #     ##    ###  # #    ##
    //  #    # ##  #  #  # #   # ##
    //  #    ##    # ##  # #   ##
    // ###    ##    # #   #     ##
    /**
     * Leave a team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async leave(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        if (team.locked) {
            await Discord.queue(`Sorry, ${member}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Warning("Team rosters are locked.");
        }

        const isFounder = member.isFounder();
        if (isFounder) {
            await Discord.queue(`Sorry, ${member}, but you are the team founder.  You must either \`!disband\` the team or choose another teammate to \`!makefounder\`.`, channel);
            throw new Warning("Pilot is the team founder.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you want to leave **${team.name}**?  Type \`!leave confirm\` to confirm.  Note that you will not be able to rejoin this team for 28 days.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!leave confirm\` to confirm that you wish to leave **${team.name}**.  Note that you will not be able to rejoin this team for 28 days.`, channel);
            return false;
        }

        try {
            await team.pilotLeft(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you have left **${team.name}**.`, member);
        return true;
    }

    // ###    ##   # #    ##   # #    ##
    // #  #  # ##  ####  #  #  # #   # ##
    // #     ##    #  #  #  #  # #   ##
    // #      ##   #  #   ##    #     ##
    /**
     * Removes a pilot from a team, rejects a pilot requesting to join the team, or revokes an invitation to join the team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async remove(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        const team = await Commands.checkMemberOnTeam(member, channel);

        if (team.locked) {
            await Discord.queue(`Sorry, ${member}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Warning("Team rosters are locked.");
        }

        if (!await Commands.checkHasParameters(message, member, "To remove a pilot, you must mention them as part of the `!remove` command.", channel)) {
            return false;
        }

        const {pilot, confirm} = await Commands.checkPilotExistsWithConfirmation(message, member, channel);

        if (pilot.id === member.id) {
            await Discord.queue(`Sorry, ${member}, you can't remove yourself with this command.  If you wish to leave the team, use the \`!leave\` command.`, channel);
            throw new Warning("Pilot cannot remove themselves.");
        }

        const isFounder = member.isFounder(),
            pilotIsCaptain = pilot.isCaptainOrFounder();
        if (!isFounder && pilotIsCaptain) {
            await Discord.queue(`Sorry, ${member}, but you must be the founder to remove this pilot.`, channel);
            throw new Warning("Pilot cannot remove a captain.");
        }

        let removable;
        try {
            removable = await member.canRemovePilot(pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!removable) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} is not a pilot you can remove.`, channel);
            throw new Warning("Pilot is not removable.");
        }

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you want to remove ${pilot.displayName}?  Type \`!remove ${pilot.displayName} confirm\` to confirm.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!remove ${pilot.displayName} confirm\` to confirm that you wish to remove this pilot.`, channel);
            return false;
        }

        try {
            await team.removePilot(member, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you have removed ${pilot.displayName}.`, channel);
        return true;
    }

    //  #     #
    //  #
    // ###   ##    # #    ##   ####   ##   ###    ##
    //  #     #    ####  # ##    #   #  #  #  #  # ##
    //  #     #    #  #  ##     #    #  #  #  #  ##
    //   ##  ###   #  #   ##   ####   ##   #  #   ##
    /**
     * Sets a pilot's time zone.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async timezone(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        if (!await Commands.checkHasParameters(message, member, "You must specify a time zone with this command.", channel)) {
            return false;
        }

        const time = await Commands.checkTimezoneIsValid(message, member, channel);

        try {
            await member.setTimezone(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your time zone has been set to ${message}, where the current local time is ${time}.`, channel);
        return true;
    }

    //       #           ##    ##
    //       #            #     #
    //  ##   ###    ###   #     #     ##   ###    ###   ##
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                            ###
    /**
     * Issues a challenge to another team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async challenge(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (!await Commands.checkHasParameters(message, member, "You must specify the team you wish to challenge with this command.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        let pilotCount;
        try {
            pilotCount = await team.getPilotCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (pilotCount < 2) {
            await Discord.queue(`Sorry, ${member}, but your team must have 2 or more pilots to challenge another team.  \`!invite\` some pilots to your team!`, channel);
            throw new Warning("Team only has one member.");
        }

        let homeMaps;
        try {
            homeMaps = await team.getHomeMaps();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (homeMaps.length !== 3) {
            await Discord.queue(`Sorry, ${member}, but your team must have 3 home maps set before you challenge another team.  Use the \`!home <number> <map>\` command to set your team's home maps.`, channel);
            throw new Warning("Team does not have 3 home maps set.");
        }

        const opponent = await Commands.checkTeamExists(message, member, channel);

        if (opponent.disbanded) {
            await Discord.queue(`Sorry, ${member}, but that team is disbanded.`, channel);
            throw new Warning("Team is disbanded.");
        }

        let opponentPilotCount;
        try {
            opponentPilotCount = await opponent.getPilotCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (opponentPilotCount < 2) {
            await Discord.queue(`Sorry, ${member}, but your opponents must have 2 or more pilots to be challenged.`, channel);
            throw new Warning("Opponent only has one member.");
        }

        let opponentHomeMaps;
        try {
            opponentHomeMaps = await opponent.getHomeMaps();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (opponentHomeMaps.length !== 3) {
            await Discord.queue(`Sorry, ${member}, but your opponents must have 3 home maps set before you can challenge them.`, channel);
            throw new Warning("Opponent does not have 3 home maps set.");
        }

        let existingChallenge;
        try {
            existingChallenge = await Challenge.getByTeams(team, opponent);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (existingChallenge) {
            await Discord.queue(`Sorry, ${member}, but there is already a pending challenge between these two teams!  Visit ${existingChallenge.channel} for more information about this match.`, channel);
            throw new Warning("Challenge already exists.");
        }

        let challenge;
        try {
            challenge = await Challenge.create(team, opponent);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your challenge to **${opponent.name}** has been issued!  Visit ${challenge.channel} for match discussion and to set the parameters for your match.`, channel);
        return true;
    }

    //        #          #
    //                   #
    // ###   ##     ##   # #   # #    ###  ###
    // #  #   #    #     ##    ####  #  #  #  #
    // #  #   #    #     # #   #  #  # ##  #  #
    // ###   ###    ##   #  #  #  #   # #  ###
    // #                                   #
    /**
     * Picks a map for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async pickmap(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        if (challenge.details.homeMapTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team is the home team.  Your opponents must pick the map from your list of home maps.`, channel);
            throw new Warning("Wrong team.");
        }

        if (!message || ["a", "b", "c"].indexOf(message.toLowerCase()) === -1) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To pick from one of the three home maps, use \`!pickmap a\`, \`!pickmap b\`, or \`!pickmap c\`.`, channel);
            throw new Warning("Missing map selection.");
        }

        try {
            await challenge.pickMap(message.charCodeAt(0) - 96);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                        #
    //                                        #
    //  ###   #  #   ###   ###   ##    ###   ###   # #    ###  ###
    // ##     #  #  #  #  #  #  # ##  ##      #    ####  #  #  #  #
    //   ##   #  #   ##    ##   ##      ##    #    #  #  # ##  #  #
    // ###     ###  #     #      ##   ###      ##  #  #   # #  ###
    //               ###   ###                                 #
    /**
     * Suggests a neutral map for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async suggestmap(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "To suggest a neutral map, use the `!suggestmap` command with the map you want to suggest.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);
        await Commands.checkChallengeIsNotLocked(challenge, member, channel);
        await Commands.checkChallengeIsNotPenalized(challenge, member, channel);

        const map = await Commands.checkMapIsValid(message, member, channel);

        if (challenge.details.homeMaps.indexOf(map) !== -1) {
            await Discord.queue(`Sorry, ${member}, but this is one of the home maps for the home map team, **${challenge.details.homeMapTeam.name}**, and cannot be used as a neutral map.`, channel);
            throw new Warning("Pilot suggested one of the home options.");
        }

        try {
            await challenge.suggestMap(team, map);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #
    //                    # #
    //  ##    ##   ###    #    ##    ###   # #   # #    ###  ###
    // #     #  #  #  #  ###    #    #  #  ####  ####  #  #  #  #
    // #     #  #  #  #   #     #    #     #  #  #  #  # ##  #  #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   # #  ###
    //                                                       #
    /**
     * Confirms a suggested neutral map for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async confirmmap(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkNoParameters(message, member, "Use `!confirmmap` by itself to confirm a suggested neutral map.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);
        await Commands.checkChallengeIsNotLocked(challenge, member, channel);
        await Commands.checkChallengeIsNotPenalized(challenge, member, channel);

        if (!challenge.details.suggestedMap || challenge.details.suggestedMap.length === 0) {
            await Discord.queue(`Sorry, ${member}, but no one has suggested a neutral map for this match yet!  Use the \`!suggestmap\` command to do so.`, channel);
            throw new Warning("No map suggested yet.");
        }

        if (challenge.details.suggestedMapTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team suggested this map, the other team must confirm.`, channel);
            throw new Warning("Can't confirm own neutral map suggestion.");
        }

        try {
            await challenge.confirmMap();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                        #                       #                ##
    //                                        #                       #                 #
    //  ###   #  #   ###   ###   ##    ###   ###   ###    ##   #  #  ###   ###    ###   #     ###    ##   ###   # #    ##   ###
    // ##     #  #  #  #  #  #  # ##  ##      #    #  #  # ##  #  #   #    #  #  #  #   #    ##     # ##  #  #  # #   # ##  #  #
    //   ##   #  #   ##    ##   ##      ##    #    #  #  ##    #  #   #    #     # ##   #      ##   ##    #     # #   ##    #
    // ###     ###  #     #      ##   ###      ##  #  #   ##    ###    ##  #      # #  ###   ###     ##   #      #     ##   #
    //               ###   ###
    /**
     * Suggests a neutral server for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async suggestneutralserver(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkNoParameters(message, member, "Use `!suggestneutralserver` by itself to suggest a neutral server.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);
        await Commands.checkChallengeIsNotLocked(challenge, member, channel);
        await Commands.checkChallengeIsNotPenalized(challenge, member, channel);

        if (!challenge.details.usingHomeServerTeam) {
            await Discord.queue(`Sorry, ${member}, but the server for this match has already been locked in to be neutral.`, channel);
            throw new Warning("Neutral server has already been set.");
        }

        if (challenge.details.suggestedNeutralServerTeam) {
            await Discord.queue(`Sorry, ${member}, but **${challenge.details.suggestedNeutralServerTeam.name}** has already suggested for this game to be played on a neutral server.  The other team must use the \`!confirmneutralserver\` command to confirm.`, channel);
            throw new Warning("Neutral server already suggested.");
        }

        try {
            await challenge.suggestNeutralServer(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #                #  #               #                ##     ##
    //                    # #                    ## #               #                 #    #  #
    //  ##    ##   ###    #    ##    ###   # #   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###
    // #     #  #  #  #  ###    #    #  #  ####  # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #
    // #     #  #  #  #   #     #    #     #  #  # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #
    /**
     * Confirms a suggested neutral server for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async confirmneutralserver(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkNoParameters(message, member, "Use `!confirmneutralserver` by itself to confirm a suggested neutral server.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);
        await Commands.checkChallengeIsNotLocked(challenge, member, channel);
        await Commands.checkChallengeIsNotPenalized(challenge, member, channel);

        if (!challenge.details.usingHomeServerTeam) {
            await Discord.queue(`Sorry, ${member}, but this match is already set to use a neutral server.`, channel);
            throw new Warning("Neutral server already confirmed.");
        }

        if (!challenge.details.suggestedNeutralServerTeam) {
            await Discord.queue(`Sorry, ${member}, but no one has suggested a neutral server for this match yet!  Use the \`!suggestneutralserver\` command to do so.`, channel);
            throw new Warning("Neutral server not suggested yet.");
        }

        if (challenge.details.suggestedNeutralServerTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team suggested a neutral server, the other team must confirm.`, channel);
            throw new Warning("Can't confirm own neutral server suggestion.");
        }

        try {
            await challenge.confirmNeutralServer();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                        #     #                              #
    //                                        #     #
    //  ###   #  #   ###   ###   ##    ###   ###   ###    ##    ###  # #    ###   ##    ####   ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #    # ##  #  #  ####  ##      #      #   # ##
    //   ##   #  #   ##    ##   ##      ##    #     #    ##    # ##  #  #    ##    #     #    ##
    // ###     ###  #     #      ##   ###      ##    ##   ##    # #  #  #  ###    ###   ####   ##
    //               ###   ###
    /**
     * Suggests the team size for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async suggestteamsize(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!message || ["2", "3", "4", "2v2", "3v3", "4v4", "2V2", "3V3", "4V4"].indexOf(message) === -1) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To suggest a team size, use \`!suggestteamsize 2\`, \`!suggestteamsize 3\`, or \`!suggestteamsize 4\`.`, channel);
            throw new Warning("Missing team size.");
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        try {
            await challenge.suggestTeamSize(team, +message.charAt(0));
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #                 #                              #
    //                    # #                     #
    //  ##    ##   ###    #    ##    ###   # #   ###    ##    ###  # #    ###   ##    ####   ##
    // #     #  #  #  #  ###    #    #  #  ####   #    # ##  #  #  ####  ##      #      #   # ##
    // #     #  #  #  #   #     #    #     #  #   #    ##    # ##  #  #    ##    #     #    ##
    //  ##    ##   #  #   #    ###   #     #  #    ##   ##    # #  #  #  ###    ###   ####   ##
    /**
     * Confirms a suggested team size for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async confirmteamsize(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkNoParameters(message, member, "Use `!confirmteamsize` by itself to confirm a suggested team size.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        if (!challenge.details.suggestedTeamSize) {
            await Discord.queue(`Sorry, ${member}, but no one has suggested a team size for this match yet!  Use the \`!suggestteamsize\` command to do so.`, channel);
            throw new Warning("Team size not yet suggested.");
        }

        if (challenge.details.suggestedTeamSizeTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team suggested this team size, the other team must confirm.`, channel);
            throw new Warning("Can't confirm own team size suggestion.");
        }

        try {
            await challenge.confirmTeamSize();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                        #     #     #
    //                                        #     #
    //  ###   #  #   ###   ###   ##    ###   ###   ###   ##    # #    ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #     #    ####  # ##
    //   ##   #  #   ##    ##   ##      ##    #     #     #    #  #  ##
    // ###     ###  #     #      ##   ###      ##    ##  ###   #  #   ##
    //               ###   ###
    /**
     * Suggests the time for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async suggesttime(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "To suggest a time, use `!suggesttime` along with the date and time.  Time zone defaults to your team's selected time zone, or Pacific Time if not set.  Use the `!timezone` command to set your own time zone.  Founders may use the `!teamtimezone` command to set the default time zone for their team.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        let date;
        if (message.toLowerCase() === "now") {
            date = new Date();
            date = new Date(date.getTime() + (300000 - date.getTime() % 300000));
        } else {
            try {
                date = new Date(new tz.Date(message, await member.getTimezone()).getTime());
            } catch (err) {
                await Discord.queue(`Sorry, ${member}, but I couldn't parse that date and time.`, channel);
                throw new Warning("Invalid date.");
            }

            if (!date || isNaN(date.valueOf())) {
                await Discord.queue(`Sorry, ${member}, but I couldn't parse that date and time.`, channel);
                throw new Warning("Invalid date.");
            }

            if (date.getFullYear() === 2001 && message.indexOf("2001") === -1) {
                date = new Date(new tz.Date(`${message} ${new Date().getFullYear()}`, await member.getTimezone()).getTime());
                if (date < new Date()) {
                    date = new Date(new tz.Date(`${message} ${new Date().getFullYear() + 1}`, await member.getTimezone()).getTime());
                }
            }

            if (date < new Date()) {
                await Discord.queue(`Sorry, ${member}, but that date is in the past.`, channel);
                throw new Warning("Date is in the past.");
            }

            if (date.getTime() - new Date().getTime() > 28 * 24 * 60 * 60 * 1000) {
                await Discord.queue(`Sorry, ${member}, but you cannot schedule a match that far into the future.`, channel);
                throw new Warning("Date too far into the future.");
            }
        }

        try {
            await challenge.suggestTime(team, date);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #                 #     #
    //                    # #                     #
    //  ##    ##   ###    #    ##    ###   # #   ###   ##    # #    ##
    // #     #  #  #  #  ###    #    #  #  ####   #     #    ####  # ##
    // #     #  #  #  #   #     #    #     #  #   #     #    #  #  ##
    //  ##    ##   #  #   #    ###   #     #  #    ##  ###   #  #   ##
    /**
     * Confirms a suggested time for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async confirmtime(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkNoParameters(message, member, "Use `!confirmtime` by itself to confirm a suggested time.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        if (!challenge.details.suggestedTime) {
            await Discord.queue(`Sorry, ${member}, but no one has suggested a time for this match yet!  Use the \`!suggesttime\` command to do so.`, channel);
            throw new Warning("Time not yet suggested.");
        }

        if (challenge.details.suggestedTimeTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team suggested this time, the other team must confirm.`, channel);
            throw new Warning("Can't confirm own time suggestion.");
        }

        try {
            await challenge.confirmTime();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //       ##                #
    //        #                #
    //  ##    #     ##    ##   # #
    // #      #    #  #  #     ##
    // #      #    #  #  #     # #
    //  ##   ###    ##    ##   #  #
    /**
     * Puts the challenge on the clock.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async clock(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        if (challenge.details.dateClocked) {
            await Discord.queue(`Sorry, ${member}, but this challenge is already on the clock!`, channel);
            throw new Warning("Match already clocked.");
        }

        if (challenge.details.matchTime) {
            await Discord.queue(`Sorry, ${member}, but this challenge has already been scheduled and doesn't need to be clocked.`, channel);
            throw new Warning("Match already scheduled.");
        }

        if (challenge.challengingTeam.locked || challenge.challengedTeam.locked) {
            await Discord.queue(`Sorry, ${member}, but due to tournament participation, this match cannot be clocked.`, channel);
            throw new Warning("A team is in a tournament.");
        }

        let nextClockDate;
        try {
            nextClockDate = await team.getNextClockDate();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (nextClockDate && nextClockDate > new Date()) {
            await Discord.queue(`Sorry, ${member}, but your team cannot put another challenge on the clock until ${nextClockDate.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, channel);
            throw new Warning("Team has clocked a challenge in the last 28 days.");
        }

        let challengingTeamClockCount;
        try {
            challengingTeamClockCount = await challenge.challengingTeam.getClockedChallengeCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challengingTeamClockCount >= 2) {
            await Discord.queue(`Sorry, ${member}, but **${challenge.challengingTeam.name}** already has two challenges on the clock.`, channel);
            throw new Warning("Challenging team has the maximum number of clocked challenges.");
        }

        let challengedTeamClockCount;
        try {
            challengedTeamClockCount = await challenge.challengedTeam.getClockedChallengeCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challengedTeamClockCount >= 2) {
            await Discord.queue(`Sorry, ${member}, but **${challenge.challengedTeam.name}** already has two challenges on the clock.`, channel);
            throw new Warning("Challenged team has the maximum number of clocked challenges.");
        }

        let alreadyClocked;
        try {
            alreadyClocked = await team.hasClockedThisSeason(team.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (alreadyClocked) {
            await Discord.queue(`Sorry, ${member}, but your team has already put **${(team.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam).name}** on the clock this season.`, channel);
            throw new Warning("Team already clocked this season.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you wish to put this challenge on the clock?  This command should only be used if the opposing team is not responding to your challenge.  Note that you can only clock a challenge once every 28 days, you can only clock a team once every season, and you can have a maximum of two active challenges clocked at a time.  Use \`!clock confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!clock confirm\` to confirm that you wish to put this challenge on the clock.`, channel);
            return false;
        }

        try {
            await challenge.clock(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                    #
    //                    #
    // ###    ##   #  #  ###
    // #  #  # ##   ##    #
    // #  #  ##     ##    #
    // #  #   ##   #  #    ##
    /**
     * Gets the list of pending matches and the time until each match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async next(member, channel, message) {
        if (!await Commands.checkNoParameters(message, member, "Use `!next` by itself to get the list of upcoming matches.", channel)) {
            return false;
        }

        const matches = await Otl.upcomingMatches(),
            events = await Otl.upcomingEvents();

        const msg = Discord.richEmbed({
            title: "Overload Teams League Schedule",
            fields: []
        });

        if (matches.length === 0 && events.length === 0) {
            await Discord.queue("There are no matches or events currently scheduled.", channel);
            return true;
        }

        if (matches.length !== 0) {
            matches.forEach((match, index) => {
                const difference = match.matchTime.getTime() - new Date().getTime(),
                    days = Math.floor(Math.abs(difference) / (24 * 60 * 60 * 1000)),
                    hours = Math.floor(Math.abs(difference) / (60 * 60 * 1000) % 24),
                    minutes = Math.floor(Math.abs(difference) / (60 * 1000) % 60 % 60),
                    seconds = Math.floor(Math.abs(difference) / 1000 % 60);

                if (difference > 0) {
                    msg.addField(`${index === 0 ? "Upcoming Matches:\n" : ""}${match.challengingTeamName} vs ${match.challengedTeamName}`, `${match.map ? `in **${match.map}**\n` : ""}Begins in ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}`}.\n${match.twitchName ? `Watch online at https://twitch.tv/${match.twitchName}.` : Commands.checkChannelIsOnServer(channel) ? `Watch online at http://otl.gg/cast/${match.challengeId}, or use \`!cast ${match.challengeId}\` to cast this game.` : `Watch online at http://otl.gg/cast/${match.challengeId}.`}`);
                } else {
                    msg.addField(`${index === 0 ? "Upcoming Matches:\n" : ""}${match.challengingTeamName} vs ${match.challengedTeamName}`, `${match.map ? `in **${match.map}**\n` : ""}Began ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}`} ago.\n${match.twitchName ? `Watch online at https://twitch.tv/${match.twitchName}.` : Commands.checkChannelIsOnServer(channel) ? `Watch online at http://otl.gg/cast/${match.challengeId}, or use \`!cast ${match.challengeId}\` to cast this game.` : `Watch online at http://otl.gg/cast/${match.challengeId}.`}`);
                }
            });
        }

        if (events.length !== 0) {
            events.forEach((event, index) => {
                if (event.dateStart >= new Date()) {
                    const difference = event.dateStart.getTime() - new Date().getTime(),
                        days = Math.floor(Math.abs(difference) / (24 * 60 * 60 * 1000)),
                        hours = Math.floor(Math.abs(difference) / (60 * 60 * 1000) % 24),
                        minutes = Math.floor(Math.abs(difference) / (60 * 1000) % 60 % 60),
                        seconds = Math.floor(Math.abs(difference) / 1000 % 60);

                    msg.addField(`${index === 0 ? "Upcoming Events:\n" : ""}${event.title}`, `Begins in ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}`}.`);
                } else if (event.dateEnd >= new Date()) {
                    const difference = event.dateEnd.getTime() - new Date().getTime(),
                        days = Math.floor(Math.abs(difference) / (24 * 60 * 60 * 1000)),
                        hours = Math.floor(Math.abs(difference) / (60 * 60 * 1000) % 24),
                        minutes = Math.floor(Math.abs(difference) / (60 * 1000) % 60 % 60),
                        seconds = Math.floor(Math.abs(difference) / 1000 % 60);

                    msg.addField(`${index === 0 ? "Upcoming Events:\n" : ""}${event.title}`, `Currently ongoing for another ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}`}.`);
                } else {
                    msg.addField(`${index === 0 ? "Upcoming Events:\n" : ""}${event.title}`, "Just recently completed.");
                }
            });
        }

        await Discord.richQueue(msg, channel);

        return true;
    }

    //              #          #      #     #
    //              #          #      #
    // # #    ###  ###    ##   ###   ###   ##    # #    ##
    // ####  #  #   #    #     #  #   #     #    ####  # ##
    // #  #  # ##   #    #     #  #   #     #    #  #  ##
    // #  #   # #    ##   ##   #  #    ##  ###   #  #   ##
    /**
     * Gets the challenge's match time in the pilot's local time zone.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async matchtime(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        let challenge;

        if (message) {
            const challengeId = +message || 0;

            challenge = await Commands.checkChallengeIdExists(challengeId, member, channel);
        } else {
            challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
            if (!challenge) {
                return false;
            }
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);

        if (challenge.details.matchTime) {
            if (message) {
                await Discord.queue(`${member}, the match between **${challenge.challengingTeam.name}** and **${challenge.challengedTeam.name}** ${challenge.details.matchTime > new Date() ? "is" : "was"} scheduled to take place ${challenge.details.matchTime.toLocaleString("en-US", {timeZone: await member.getTimezone(), weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, channel);
            } else {
                await Discord.queue(`${member}, this match ${challenge.details.matchTime > new Date() ? "is" : "was"} scheduled to take place ${challenge.details.matchTime.toLocaleString("en-US", {timeZone: await member.getTimezone(), weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, channel);
            }
        } else {
            await Discord.queue(`${member}, this match has not yet been scheduled.`, channel);
        }

        return true;
    }

    //                          #       #
    //                          #       #
    //  ##    ##   #  #  ###   ###    ###   ##   #  #  ###
    // #     #  #  #  #  #  #   #    #  #  #  #  #  #  #  #
    // #     #  #  #  #  #  #   #    #  #  #  #  ####  #  #
    //  ##    ##    ###  #  #    ##   ###   ##   ####  #  #
    /**
     * Gets the amount of time until the challenge begins.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async countdown(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        let challenge;

        if (message) {
            const challengeId = +message || 0;

            challenge = await Commands.checkChallengeIdExists(challengeId, member, channel);
        } else {
            challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
            if (!challenge) {
                return false;
            }
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);

        if (challenge.details.matchTime) {
            const difference = challenge.details.matchTime.getTime() - new Date().getTime(),
                days = Math.floor(Math.abs(difference) / (24 * 60 * 60 * 1000)),
                hours = Math.floor(Math.abs(difference) / (60 * 60 * 1000) % 24),
                minutes = Math.floor(Math.abs(difference) / (60 * 1000) % 60 % 60),
                seconds = Math.floor(Math.abs(difference) / 1000 % 60);

            if (message) {
                if (difference > 0) {
                    await Discord.queue(`${member}, the match between **${challenge.challengingTeam.name}** and **${challenge.challengedTeam.name}** is scheduled to begin in ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}`}.`, channel);
                } else {
                    await Discord.queue(`${member}, the match between **${challenge.challengingTeam.name}** and **${challenge.challengedTeam.name}** was scheduled to begin ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"} `} ago.`, channel);
                }
            } else if (difference > 0) {
                await Discord.queue(`${member}, this match is scheduled to begin in ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}`}.`, channel);
            } else {
                await Discord.queue(`${member}, this match was scheduled to begin ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"} `} ago.`, channel);
            }
        } else {
            await Discord.queue(`${member}, this match has not yet been scheduled.`, channel);
        }

        return true;
    }

    //    #                 #  ##     #
    //    #                 #   #
    //  ###   ##    ###   ###   #    ##    ###    ##
    // #  #  # ##  #  #  #  #   #     #    #  #  # ##
    // #  #  ##    # ##  #  #   #     #    #  #  ##
    //  ###   ##    # #   ###  ###   ###   #  #   ##
    /**
     * Gets the challenge's clock deadline in the pilot's local time zone.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async deadline(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        if (!await Commands.checkNoParameters(message, member, "Use `!deadline` by itself to get the match's clock deadline in your local time zone.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);

        if (challenge.details.dateClockDeadline) {
            await Discord.queue(`${member}, the clock deadline ${challenge.details.dateClockDeadline > new Date() ? "expires" : "expired"} ${challenge.details.dateClockDeadline.toLocaleString("en-US", {timeZone: await member.getTimezone(), weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, channel);
        } else {
            await Discord.queue(`${member}, this match has not yet been put on the clock.`, channel);
        }

        return true;
    }

    //    #                 #  ##     #                                         #       #
    //    #                 #   #                                               #       #
    //  ###   ##    ###   ###   #    ##    ###    ##    ##    ##   #  #  ###   ###    ###   ##   #  #  ###
    // #  #  # ##  #  #  #  #   #     #    #  #  # ##  #     #  #  #  #  #  #   #    #  #  #  #  #  #  #  #
    // #  #  ##    # ##  #  #   #     #    #  #  ##    #     #  #  #  #  #  #   #    #  #  #  #  ####  #  #
    //  ###   ##    # #   ###  ###   ###   #  #   ##    ##    ##    ###  #  #    ##   ###   ##   ####  #  #
    /**
     * Gets the amount of time until the clock deadline.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async deadlinecountdown(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        if (!await Commands.checkNoParameters(message, member, "Use `!deadlinecountdown` by itself to get the time remaining until the match's clock deadline.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);

        if (challenge.details.dateClockDeadline) {
            const difference = challenge.details.dateClockDeadline.getTime() - new Date().getTime(),
                days = Math.floor(Math.abs(difference) / (24 * 60 * 60 * 1000)),
                hours = Math.floor(Math.abs(difference) / (60 * 60 * 1000) % 24),
                minutes = Math.floor(Math.abs(difference) / (60 * 1000) % 60 % 60),
                seconds = Math.floor(Math.abs(difference) / 1000 % 60);

            if (difference > 0) {
                await Discord.queue(`${member}, this match's clock deadline expires in ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"},`}.`, channel);
            } else {
                await Discord.queue(`${member}, this match's clock deadline expired ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}, `} ago.`, channel);
            }
        } else {
            await Discord.queue(`${member}, this match has not yet been put on the clock.`, channel);
        }

        return true;
    }

    //  #           #     #          #
    //  #                 #          #
    // ###   #  #  ##    ###    ##   ###
    //  #    #  #   #     #    #     #  #
    //  #    ####   #     #    #     #  #
    //   ##  ####  ###     ##   ##   #  #
    /**
     * Adds a pilot's Twitch channel to their profile.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async twitch(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        if (!await Commands.checkHasParameters(message, member, "To link your Twitch channel, add the name of your channel after the command, for example `!twitch roncli`.", channel)) {
            return false;
        }

        try {
            await member.addTwitchName(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your Twitch channel is now linked as https://twitch.tv/${message}.  If you wish to unlik your channel, use the \`!removetwitch\` command.`, channel);

        return true;
    }

    //                                      #           #     #          #
    //                                      #                 #          #
    // ###    ##   # #    ##   # #    ##   ###   #  #  ##    ###    ##   ###
    // #  #  # ##  ####  #  #  # #   # ##   #    #  #   #     #    #     #  #
    // #     ##    #  #  #  #  # #   ##     #    ####   #     #    #     #  #
    // #      ##   #  #   ##    #     ##     ##  ####  ###     ##   ##   #  #
    /**
     * Removes a pilot's Twitch channel from their profile.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async removetwitch(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        if (!await Commands.checkNoParameters(message, member, "Use `!removetwitch` by itself to unlink your Twitch channel.", channel)) {
            return false;
        }

        try {
            await member.removeTwitchName();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your Twitch channel is now unlinked.`, channel);

        return true;
    }

    //         #
    //         #
    //  ###   ###   ###    ##    ###  # #
    // ##      #    #  #  # ##  #  #  ####
    //   ##    #    #     ##    # ##  #  #
    // ###      ##  #      ##    # #  #  #
    /**
     * Alias for streaming.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    stream(member, channel, message) {
        console.log("stream");
        return this.streaming(member, channel, message);
    }

    //         #                             #
    //         #
    //  ###   ###   ###    ##    ###  # #   ##    ###    ###
    // ##      #    #  #  # ##  #  #  ####   #    #  #  #  #
    //   ##    #    #     ##    # ##  #  #   #    #  #   ##
    // ###      ##  #      ##    # #  #  #  ###   #  #  #
    //                                                   ###
    /**
     * Indicates that a pilot will be streaming their match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async streaming(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        if (!await Commands.checkNoParameters(message, member, "Use `!streaming` by itself to indicate that you will be streaming this match.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        const twitchName = await Commands.checkMemberHasTwitchName(member, channel);

        try {
            await challenge.addStreamer(member, twitchName);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //              #            #                             #
    //              #            #
    // ###    ##   ###    ###   ###   ###    ##    ###  # #   ##    ###    ###
    // #  #  #  #   #    ##      #    #  #  # ##  #  #  ####   #    #  #  #  #
    // #  #  #  #   #      ##    #    #     ##    # ##  #  #   #    #  #   ##
    // #  #   ##     ##  ###      ##  #      ##    # #  #  #  ###   #  #  #
    //                                                                     ###
    /**
     * Indicates that a pilot will not be streaming their match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async notstreaming(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        if (!await Commands.checkNoParameters(message, member, "Use `!notstreaming` by itself to indicate that you will not be streaming the match.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        try {
            await challenge.removeStreamer(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #
    //                     #
    //  ##    ###   ###   ###
    // #     #  #  ##      #
    // #     # ##    ##    #
    //  ##    # #  ###      ##
    /**
     * Indicates that a pilot will cast a race.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async cast(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        if (!await Commands.checkHasParameters(message, member, "To cast a match, use the command along with the challenge ID of the match you wish to cast, for example `!cast 1`.", channel)) {
            return false;
        }

        await Commands.checkMemberHasTwitchName(member, channel);

        if (message.toLowerCase() === "next") {
            const matches = (await Otl.upcomingMatches()).filter((m) => !m.twitchName);

            if (matches.length === 0) {
                await Discord.queue("There are no matches without a caster currently scheduled.", channel);
            } else {
                await Discord.queue(`The next match is **${matches[0].challengingTeamName}** vs **${matches[0].challengedTeamName}** at ${matches[0].matchTime.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.  If you wish to cast this match, enter \`!cast ${matches[0].challengeId}\`.  To see other upcoming matches, enter \`!next\`.`, channel);
            }

            return true;
        }

        if (!numberMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must use \`!cast\` along with the challenge ID of the match you wish to cast, for example \`!cast 1\`.`, channel);
            return false;
        }

        const challengeId = +message || 0,
            challenge = await Commands.checkChallengeIdExists(challengeId, member, channel);

        if (!challenge) {
            await Discord.queue(`Sorry, ${member}, but I can't find an active challenge with that ID.`, channel);
            throw new Warning("Invalid challenge.");
        }

        await Commands.checkChallengeDetails(challenge, member, channel);

        if (challenge.details.caster) {
            await Discord.queue(`Sorry, ${member}, but ${challenge.details.caster} is already scheduled to cast this match.`, channel);
            throw new Warning("Caster is already set.");
        }

        if (!challenge.details.matchTime) {
            await Discord.queue(`Sorry, ${member}, but this match has not been scheduled yet.`, channel);
            throw new Warning("Match not scheduled.");
        }

        try {
            await challenge.addCaster(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you are now scheduled to cast the match between **${challenge.challengingTeam.name}** and **${challenge.challengedTeam.name}**!  Use ${challenge.channel} to coordinate with the pilots who will be streaming the match.  Be sure to use http://otl.gg/cast/${challenge.id} to help you cast this match.  If you no longer wish to cast this match, use the \`!uncast\` command in ${challenge.channel}.`, member);

        return true;
    }

    //                                 #
    //                                 #
    // #  #  ###    ##    ###   ###   ###
    // #  #  #  #  #     #  #  ##      #
    // #  #  #  #  #     # ##    ##    #
    //  ###  #  #   ##    # #  ###      ##
    /**
     * Indicates that a pilot will not cast a race.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async uncast(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        if (!await Commands.checkNoParameters(message, member, "Use `!uncast` by itself to indicate that you will not be casting the match.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        try {
            await challenge.removeCaster(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you are no longer scheduled to cast the match, and have been removed from ${challenge.channel}.`, member);

        return true;
    }

    //                                #
    //                                #
    // ###    ##   ###    ##   ###   ###
    // #  #  # ##  #  #  #  #  #  #   #
    // #     ##    #  #  #  #  #      #
    // #      ##   ###    ##   #       ##
    //             #
    /**
     * Reports a match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async report(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkHasParameters(message, member, "To report a completed match, enter the commnad followed by the score, using a space to separate the scores, for example `!report 49 27`.  Note that only the losing team should report the score.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);
        await Commands.checkChallengeMapIsSet(challenge, member, channel);
        await Commands.checkChallengeTeamSizeIsSet(challenge, member, channel);
        await Commands.checkChallengeMatchTimeIsSet(challenge, member, channel);

        if (!scoreMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but to report a completed match, enter the commnad followed by the score, using a space to separate the scores, for example \`!report 49 27\`.  Note that only the losing team should report the score.`, channel);
            return false;
        }

        const matches = scoreMatch.exec(message);
        let score1 = +matches[1],
            score2 = +matches[2];

        if (score2 > score1) {
            [score1, score2] = [score2, score1];
        }

        try {
            await challenge.reportMatch(team, score1, score2);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #
    //                    # #
    //  ##    ##   ###    #    ##    ###   # #
    // #     #  #  #  #  ###    #    #  #  ####
    // #     #  #  #  #   #     #    #     #  #
    //  ##    ##   #  #   #    ###   #     #  #
    /**
     * Confirms a match report.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async confirm(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkNoParameters(message, member, "Use `!confirm` by itself to confirm your opponent's match report.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        if (!challenge.details.dateReported) {
            await Discord.queue(`Sorry, ${member}, but this match hasn't been reported yet.  Use the \`!report\` command if you meant to report the score of the match.`, channel);
            throw new Warning("Match not reported.");
        }

        if (team.id === challenge.details.reportingTeam.id) {
            await Discord.queue(`Sorry, ${member}, but you can't confirm your own team's report.`, channel);
            throw new Warning("Can't confirm own report.");
        }

        await challenge.confirmMatch();

        return true;
    }

    //                          #          #
    //                          #          #
    // ###    ##   # #    ###  ###    ##   ###
    // #  #  # ##  ####  #  #   #    #     #  #
    // #     ##    #  #  # ##   #    #     #  #
    // #      ##   #  #   # #    ##   ##   #  #
    /**
     * Issues a rematch request.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async rematch(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsCaptainOrFounder(member, channel);

        if (!await Commands.checkNoParameters(message, member, "Use `!rematch` by itself to request a rematch.", channel)) {
            return false;
        }

        const team = await Commands.checkMemberOnTeam(member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsConfirmed(challenge, member, channel);

        if (challenge.details.dateRematched) {
            await Discord.queue(`Sorry, ${member}, but a rematch for this challenge has already been created.`, channel);
            throw new Warning("Already rematched.");
        }

        if (challenge.details.rematchTeam && team.id === challenge.details.rematchTeam.id) {
            await Discord.queue(`Sorry, ${member}, but your team already requested a rematch, the other team must also request a \`!rematch\` for the new challenge to be created.`, channel);
            throw new Warning("Can't confirm own report.");
        }

        if (challenge.details.dateRematchRequested) {
            await challenge.createRematch(team);
        } else {
            await challenge.requestRematch(team);
        }

        return true;
    }

    //  #                       #     #
    //  #                       #
    // ###    ##    ###  # #   ###   ##    # #    ##   ####   ##   ###    ##
    //  #    # ##  #  #  ####   #     #    ####  # ##    #   #  #  #  #  # ##
    //  #    ##    # ##  #  #   #     #    #  #  ##     #    #  #  #  #  ##
    //   ##   ##    # #  #  #    ##  ###   #  #   ##   ####   ##   #  #   ##
    /**
     * Confirms a match report.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async teamtimezone(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsFounder(member, channel);

        const team = await Commands.checkMemberOnTeam(member, channel);

        if (!await Commands.checkHasParameters(message, member, "You must specify a time zone with this command.", channel)) {
            return false;
        }

        await Commands.checkTimezoneIsValid(message, member, channel);

        try {
            await team.setTimezone(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team's time zone is now set.`, channel);

        return true;
    }

    //         #           #
    //         #           #
    //  ###   ###    ###  ###    ###
    // ##      #    #  #   #    ##
    //   ##    #    # ##   #      ##
    // ###      ##   # #    ##  ###
    /**
     * Displays a player's stats.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async stats(member, channel, message) {
        let pilot;
        if (message) {
            pilot = await Commands.checkPilotExists(message, member, channel);
        } else {
            if (!member) {
                Discord.queue("Sorry, but you have not played any games on the OTL this season.", channel);
                return true;
            }
            pilot = member;
        }

        const stats = await pilot.getStats();

        if (stats) {
            Discord.richQueue(Discord.richEmbed({
                title: `Season Stats for ${Common.normalizeName(pilot.displayName, stats.tag)}`,
                description: `${((stats.kills + stats.assists) / (stats.deaths < 1 ? 1 : stats.deaths)).toFixed(3)} KDA, ${stats.games} Games, ${stats.kills} Kills, ${stats.assists} Assists, ${stats.deaths} Deaths`,
                fields: [
                    {
                        name: "For more details, visit:",
                        value: `http://otl.gg/player/${stats.playerId}/${Common.normalizeName(pilot.displayName, stats.tag)}`
                    }
                ]
            }), channel);
        } else {
            Discord.queue(`Sorry, ${member ? `${member}, ` : ""}but ${pilot} has not played any games on the OTL this season.`, channel);
        }

        return true;
    }

    // ###    ##   ###    ###  # #    ##
    // #  #  # ##  #  #  #  #  ####  # ##
    // #     ##    #  #  # ##  #  #  ##
    // #      ##   #  #   # #  #  #   ##
    /**
     * Renames a team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async rename(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "You must specify the team tag followed by the new team name to rename a team, for example `!rename CF Juno Offworld Automation`.", channel)) {
            return false;
        }

        if (!teamTagTeamNameMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must specify the team tag followed by the new team name to rename a team, for example \`!rename CF Juno Offworld Automation\`.`, channel);
            throw new Warning("Invalid parameters.");
        }

        const {1: teamTag, 2: teamName} = teamTagTeamNameMatch.exec(message),
            team = await Commands.checkTeamExists(teamTag, member, channel);
        if (Team.nameExists(teamName)) {
            await Discord.queue(`Sorry, ${member}, but there is already a team named ${teamName}.`, channel);
            throw new Warning("Team name already exists.");
        }

        try {
            await team.rename(teamName, member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.`, channel);
            throw err;
        }

        return true;
    }

    //              #
    //              #
    // ###    ##   ###    ###   ###
    // #  #  # ##   #    #  #  #  #
    // #     ##     #    # ##   ##
    // #      ##     ##   # #  #
    //                          ###
    /**
     * Renames a team tag.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async retag(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "You must specify the old team tag followed by the new team tag to rename a team tag, for example `!retag CF JOA`.", channel)) {
            return false;
        }

        if (!twoTeamTagMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must specify the old team tag followed by the new team tag to rename a team tag, for example \`!rename CF JOA\`.`, channel);
            throw new Warning("Invalid parameters.");
        }

        const {1: oldTeamTag, 2: newTeamTag} = twoTeamTagMatch.exec(message),
            team = await Commands.checkTeamExists(oldTeamTag, member, channel);

        const tag = newTeamTag.toUpperCase();

        if (Team.tagExists(tag)) {
            await Discord.queue(`Sorry, ${member}, but there is already a team with a tag of ${tag}.`, channel);
            throw new Warning("Team tag already exists.");
        }

        try {
            await team.retag(tag, member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.`, channel);
            throw err;
        }

        return true;
    }

    //                   ##                        #                        #
    //                    #                       # #                       #
    // ###    ##   ###    #     ###   ##    ##    #     ##   #  #  ###    ###   ##   ###
    // #  #  # ##  #  #   #    #  #  #     # ##  ###   #  #  #  #  #  #  #  #  # ##  #  #
    // #     ##    #  #   #    # ##  #     ##     #    #  #  #  #  #  #  #  #  ##    #
    // #      ##   ###   ###    # #   ##    ##    #     ##    ###  #  #   ###   ##   #
    //             #
    /**
     * Replaces a team founder.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async replacefounder(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "You must specify the team and mention the pilot, for example, `!replacefounder CF @roncli`.", channel)) {
            return false;
        }

        if (!teamPilotMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must specify the team and mention the pilot, for example, \`!replacefounder CF @roncli\`.`, channel);
            throw new Warning("Invalid parameters.");
        }

        const {1: teamName, 2: id} = teamPilotMatch.exec(message);

        const team = await Commands.checkTeamExists(teamName, member, channel),
            pilot = await Commands.checkPilotExists(id, member, channel);

        await Commands.checkPilotOnTeam(team, pilot, member, channel);

        const captainCount = team.captainCount();
        if (captainCount === 2 && !pilot.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but this team already has ${captainCount} captains, and the limit is 2.`, channel);
            throw new Warning("Captain count limit reached.");
        }

        await Commands.checkPilotCanBeCaptain(pilot, member, channel);

        try {
            await team.replaceFounder(pilot, member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.`, channel);
            throw err;
        }

        return true;
    }

    //         #                #                       #           #
    //                          #                       #
    //  ##     #    ##    ##   ###    ##    ###  ###   ###    ###  ##    ###
    // # ##    #   # ##  #      #    #     #  #  #  #   #    #  #   #    #  #
    // ##      #   ##    #      #    #     # ##  #  #   #    # ##   #    #  #
    //  ##   # #    ##    ##     ##   ##    # #  ###     ##   # #  ###   #  #
    //        #                                  #
    /**
     * Ejects a captain from their role.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async ejectcaptain(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "You must specify the captain to eject with this command.", channel)) {
            return false;
        }

        const captain = await Commands.checkPilotExists(message, member, channel),
            isCaptain = captain.isCaptainOrFounder(),
            isFounder = captain.isFounder();
        if (isFounder || !isCaptain) {
            await Discord.queue(`Sorry, ${member}, but ${captain.displayName} is not a captain!`, channel);
            throw new Warning("Pilot is not a captain.");
        }

        const team = await captain.getTeam();

        try {
            await team.removeCaptain(member, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, ${captain.displayName} has been removed as a captain.`, channel);

        return true;
    }

    //         #                #           #    ##           #
    //                          #                 #           #
    //  ##     #    ##    ##   ###   ###   ##     #     ##   ###
    // # ##    #   # ##  #      #    #  #   #     #    #  #   #
    // ##      #   ##    #      #    #  #   #     #    #  #   #
    //  ##   # #    ##    ##     ##  ###   ###   ###    ##     ##
    //        #                      #
    /**
     * Ejects a captain from their team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async ejectpilot(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "You must specify the pilot to eject with this command.", channel)) {
            return false;
        }

        const pilot = await Commands.checkPilotExists(message, member, channel),
            team = await pilot.getTeam();
        if (!team) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} is not on a team!`, channel);
            throw new Warning("Pilot is not on a team.");
        }

        const isFounder = pilot.isFounder();
        if (isFounder) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} is the founder.  Use the \`!replacefounder\` command for this team before ejecting this pilot.`, channel);
            throw new Warning("Pilot is the team's founder.");
        }

        try {
            await team.removePilot(member, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, ${pilot.displayName} has been removed from their team.`, channel);

        return true;
    }

    //                          #                       #          #
    //                          #                       #          #
    //  ##   ###    ##    ###  ###    ##   # #    ###  ###    ##   ###
    // #     #  #  # ##  #  #   #    # ##  ####  #  #   #    #     #  #
    // #     #     ##    # ##   #    ##    #  #  # ##   #    #     #  #
    //  ##   #      ##    # #    ##   ##   #  #   # #    ##   ##   #  #
    /**
     * Creates a match between two teams.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async creatematch(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "You must specify the two teams to create a match for.", channel)) {
            return false;
        }

        if (!twoTeamTagMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must specify the two teams to create a match for.`, channel);
            throw new Warning("Invalid parameters.");
        }

        const {1: teamTag1, 2: teamTag2} = twoTeamTagMatch.exec(message);

        const team1 = await Commands.checkTeamExists(teamTag1, member, channel);

        if (team1.disbanded) {
            await Discord.queue(`Sorry, ${member}, but **${team1.name}** is disbanded.`, channel);
            throw new Warning("Team disbanded.");
        }

        let team1PilotCount;
        try {
            team1PilotCount = await team1.getPilotCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (team1PilotCount < 2) {
            await Discord.queue(`Sorry, ${member}, but **${team1.name}** must have 2 or more pilots to be in a match.`, channel);
            throw new Warning("Team only has one member.");
        }

        let team1HomeMaps;
        try {
            team1HomeMaps = await team1.getHomeMaps();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (team1HomeMaps.length !== 3) {
            await Discord.queue(`Sorry, ${member}, but **${team1.name}** must have 3 home maps set to be in a match.`, channel);
            throw new Warning("Team does not have 3 home maps set.");
        }

        const team2 = await Commands.checkTeamExists(teamTag2, member, channel);

        if (team2.disbanded) {
            await Discord.queue(`Sorry, ${member}, but **${team2.name}** is disbanded.`, channel);
            throw new Warning("Team disbanded.");
        }

        let team2PilotCount;
        try {
            team2PilotCount = await team2.getPilotCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (team2PilotCount < 2) {
            await Discord.queue(`Sorry, ${member}, but **${team2.name}** must have 2 or more pilots to be in a match.`, channel);
            throw new Warning("Team only has one member.");
        }

        let team2HomeMaps;
        try {
            team2HomeMaps = await team2.getHomeMaps();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (team2HomeMaps.length !== 3) {
            await Discord.queue(`Sorry, ${member}, but **${team2.name}** must have 3 home maps set to be in a match.`, channel);
            throw new Warning("Team does not have 3 home maps set.");
        }

        try {
            await Challenge.create(team1, team2, true, team1, team1);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    // ##                #                  #          #
    //  #                #                  #          #
    //  #     ##    ##   # #   # #    ###  ###    ##   ###
    //  #    #  #  #     ##    ####  #  #   #    #     #  #
    //  #    #  #  #     # #   #  #  # ##   #    #     #  #
    // ###    ##    ##   #  #  #  #   # #    ##   ##   #  #
    /**
     * Locks a challenge so that only the admin may set match parameters.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async lockmatch(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkNoParameters(message, member, "Use `!lockmatch` by itself to lock a challenge.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);

        if (challenge.details.adminCreated) {
            await Discord.queue(`Sorry, ${member}, but this match is already locked.`, channel);
            throw new Warning("Match already locked.");
        }

        try {
            await challenge.lock(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //             ##                #                  #          #
    //              #                #                  #          #
    // #  #  ###    #     ##    ##   # #   # #    ###  ###    ##   ###
    // #  #  #  #   #    #  #  #     ##    ####  #  #   #    #     #  #
    // #  #  #  #   #    #  #  #     # #   #  #  # ##   #    #     #  #
    //  ###  #  #  ###    ##    ##   #  #  #  #   # #    ##   ##   #  #
    /**
     * Unlocks a challenge so that the teams may set match parameters.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async unlockmatch(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkNoParameters(message, member, "Use `!unlockmatch` by itself to lock a challenge.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);

        if (!challenge.details.adminCreated) {
            await Discord.queue(`Sorry, ${member}, but this match is already unlocked.`, channel);
            throw new Warning("Match already unlocked.");
        }

        try {
            await challenge.unlock(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //   #                           #                                          #
    //  # #                          #                                          #
    //  #     ##   ###    ##    ##   ###    ##   # #    ##   # #    ###  ###   ###    ##    ###  # #
    // ###   #  #  #  #  #     # ##  #  #  #  #  ####  # ##  ####  #  #  #  #   #    # ##  #  #  ####
    //  #    #  #  #     #     ##    #  #  #  #  #  #  ##    #  #  # ##  #  #   #    ##    # ##  #  #
    //  #     ##   #      ##    ##   #  #   ##   #  #   ##   #  #   # #  ###     ##   ##    # #  #  #
    //                                                                   #
    /**
     * Forces a team to be the home map team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async forcehomemapteam(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "Use `!forcehomemapteam` along with the team you want to be the home map team.", channel)) {
            return false;
        }

        const team = await Commands.checkTeamExists(message, member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);

        try {
            await challenge.setHomeMapTeam(member, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //   #
    //  # #
    //  #     ##   ###    ##    ##   # #    ###  ###
    // ###   #  #  #  #  #     # ##  ####  #  #  #  #
    //  #    #  #  #     #     ##    #  #  # ##  #  #
    //  #     ##   #      ##    ##   #  #   # #  ###
    //                                           #
    /**
     * Forces a map for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async forcemap(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "Use `!forcemap` with either the letter of the home map to use or with a neutral home map.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);

        if (["a", "b", "c"].indexOf(message) !== -1) {
            try {
                await challenge.pickMap(message.charCodeAt(0) - 96);
            } catch (err) {
                await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
                throw err;
            }

            return true;
        }

        const map = await Commands.checkMapIsValid(message, member, channel);

        try {
            await challenge.setMap(member, map);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //   #                                              #                ##
    //  # #                                             #                 #
    //  #     ##   ###    ##    ##   ###    ##   #  #  ###   ###    ###   #     ###    ##   ###   # #    ##   ###
    // ###   #  #  #  #  #     # ##  #  #  # ##  #  #   #    #  #  #  #   #    ##     # ##  #  #  # #   # ##  #  #
    //  #    #  #  #     #     ##    #  #  ##    #  #   #    #     # ##   #      ##   ##    #     # #   ##    #
    //  #     ##   #      ##    ##   #  #   ##    ###    ##  #      # #  ###   ###     ##   #      #     ##   #
    /**
     * Forces a neutral server for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async forceneutralserver(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkNoParameters(message, member, "Use `!forceneutralserver` by itself to force this match to be played on a neutral server.", channel)) {
            return false;
        }

        try {
            await challenge.setNeutralServer(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //   #                           #                                                             #
    //  # #                          #                                                             #
    //  #     ##   ###    ##    ##   ###    ##   # #    ##    ###    ##   ###   # #    ##   ###   ###    ##    ###  # #
    // ###   #  #  #  #  #     # ##  #  #  #  #  ####  # ##  ##     # ##  #  #  # #   # ##  #  #   #    # ##  #  #  ####
    //  #    #  #  #     #     ##    #  #  #  #  #  #  ##      ##   ##    #     # #   ##    #      #    ##    # ##  #  #
    //  #     ##   #      ##    ##   #  #   ##   #  #   ##   ###     ##   #      #     ##   #       ##   ##    # #  #  #
    /**
     * Forces a team to be the home map team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async forcehomeserverteam(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "Use `!forcehomeserverteam` along with the team you want to be the home server team.", channel)) {
            return false;
        }

        const team = await Commands.checkTeamExists(message, member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);

        try {
            await challenge.setHomeServerTeam(member, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //   #                            #                              #
    //  # #                           #
    //  #     ##   ###    ##    ##   ###    ##    ###  # #    ###   ##    ####   ##
    // ###   #  #  #  #  #     # ##   #    # ##  #  #  ####  ##      #      #   # ##
    //  #    #  #  #     #     ##     #    ##    # ##  #  #    ##    #     #    ##
    //  #     ##   #      ##    ##     ##   ##    # #  #  #  ###    ###   ####   ##
    /**
     * Forces the team size for a match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async forceteamsize(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!message || ["2", "3", "4", "2v2", "3v3", "4v4", "2V2", "3V3", "4V4"].indexOf(message) === -1) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To suggest a team size, use \`!suggestteamsize 2\`, \`!suggestteamsize 3\`, or \`!suggestteamsize 4\`.`, channel);
            throw new Warning("Missing team size.");
        }

        try {
            await challenge.setTeamSize(+message.charAt(0));
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //   #                            #     #
    //  # #                           #
    //  #     ##   ###    ##    ##   ###   ##    # #    ##
    // ###   #  #  #  #  #     # ##   #     #    ####  # ##
    //  #    #  #  #     #     ##     #     #    #  #  ##
    //  #     ##   #      ##    ##     ##  ###   #  #   ##
    /**
     * Forces the time for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async forcetime(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "To force a time, use `!forcetime` along with the date and time.", channel)) {
            return false;
        }

        let date;
        if (message.toLowerCase() === "now") {
            date = new Date();
            date = new Date(date.getTime() + (300000 - date.getTime() % 300000));
        } else {
            try {
                date = new Date(new tz.Date(message, await member.getTimezone()).getTime());
            } catch (err) {
                await Discord.queue(`Sorry, ${member}, but I couldn't parse that date and time.`, channel);
                throw new Warning("Invalid date.");
            }

            if (!date || isNaN(date.valueOf())) {
                await Discord.queue(`Sorry, ${member}, but I couldn't parse that date and time.`, channel);
                throw new Warning("Invalid date.");
            }

            if (date.getFullYear() === 2001 && message.indexOf("2001") === -1) {
                date = new Date(new tz.Date(`${message} ${new Date().getFullYear()}`, await member.getTimezone()).getTime());
                if (date < new Date()) {
                    date = new Date(new tz.Date(`${message} ${new Date().getFullYear() + 1}`, await member.getTimezone()).getTime());
                }
            }

            if (date.getTime() - new Date().getTime() < -28 * 24 * 60 * 60 * 1000) {
                await Discord.queue(`Sorry, ${member}, but you cannot schedule a match that far into the past.`, channel);
                throw new Warning("Date too far into the past.");
            }

            if (date.getTime() - new Date().getTime() > 28 * 24 * 60 * 60 * 1000) {
                await Discord.queue(`Sorry, ${member}, but you cannot schedule a match that far into the future.`, channel);
                throw new Warning("Date too far into the future.");
            }
        }

        try {
            await challenge.setTime(member, date);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //       ##                       #     #
    //        #                       #
    //  ##    #     ##    ###  ###   ###   ##    # #    ##
    // #      #    # ##  #  #  #  #   #     #    ####  # ##
    // #      #    ##    # ##  #      #     #    #  #  ##
    //  ##   ###    ##    # #  #       ##  ###   #  #   ##
    /**
     * Clears the time for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async cleartime(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkNoParameters(message, member, "Use `!cleartime` by itself to clear the match time.", channel)) {
            return false;
        }

        try {
            await challenge.clearTime(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //   #                                                          #
    //  # #                                                         #
    //  #     ##   ###    ##    ##   ###    ##   ###    ##   ###   ###
    // ###   #  #  #  #  #     # ##  #  #  # ##  #  #  #  #  #  #   #
    //  #    #  #  #     #     ##    #     ##    #  #  #  #  #      #
    //  #     ##   #      ##    ##   #      ##   ###    ##   #       ##
    //                                           #
    /**
     * Forces the score of a match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async forcereport(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "To force a score, use `!forcereport` followed by the score of the challenging team, and then the score of the challenged team.  Separate the scores with a space.", channel)) {
            return false;
        }

        if (!scoreMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but to report a completed match, enter the commnad followed by the score, using a space to separate the scores, for example \`!report 49 27\`.  Note that only the losing team should report the score.`, channel);
            throw new Warning("Invalid parameters.");
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeMapIsSet(challenge, member, channel);
        await Commands.checkChallengeTeamSizeIsSet(challenge, member, channel);
        await Commands.checkChallengeMatchTimeIsSet(challenge, member, channel);

        const matches = scoreMatch.exec(message),
            score1 = +matches[1],
            score2 = +matches[2];

        try {
            await challenge.setScore(score1, score2);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //          #    #            #   #                 #
    //          #                 #                     #
    //  ###   ###    #   #  #   ###  ##     ##    ###  ###    ##
    // #  #  #  #    #   #  #  #  #   #    #     #  #   #    # ##
    // # ##  #  #    #   #  #  #  #   #    #     # ##   #    ##
    //  # #   ###  # #    ###   ###  ###    ##    # #    ##   ##
    //              #
    /**
     * Adjudicates a match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async adjudicate(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "Use the `!adjudicate` command followed by how you wish to adjudicate this match, either `cancel`, `extend`, or `penalize`.  If you penalize a team, include the name of the team.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsNotConfirmed(challenge, member, channel);

        if (!adjudicateMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must use the \`!adjudicate\` command followed by how you wish to adjudicate this match, either \`cancel\`, \`extend\`, or \`penalize\`.  If you penalize a team, include the name of the team.`, channel);
            throw new Warning("Invalid parameters.");
        }

        await Commands.checkChallengeDetails(challenge, member, channel);

        if (!challenge.details.matchTime && !challenge.details.dateClockDeadline) {
            await Discord.queue(`Sorry, ${member}, but you cannot adjudicate an unscheduled match that's not on the clock.`, channel);
            throw new Warning("Match unscheduled and not on the clock.");
        }

        if (challenge.details.matchTime && challenge.details.matchTime > new Date()) {
            await Discord.queue(`Sorry, ${member}, but you cannot adjudicate a scheduled match when the scheduled time hasn't passed yet.`, channel);
            throw new Warning("Match time not passed yet.");
        }

        if (challenge.details.dateClockDeadline && challenge.details.dateClockDeadline > new Date()) {
            await Discord.queue(`Sorry, ${member}, but you cannot adjudicate a match that's on the clock when the deadline hasn't passed yet.  The current clock deadline is ${challenge.details.dateClockDeadline.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, channel);
            throw new Warning("Match clock deadline not passed yet.");
        }

        const {1: decision, 2: teamTag} = adjudicateMatch.exec(message);

        let teams;
        if (decision === "penalize") {
            if (teamTag === "both") {
                teams = [challenge.challengingTeam, challenge.challengedTeam];
            } else if (teamTag) {
                const team = await Commands.checkTeamExists(teamTag, member, channel);

                await Commands.checkTeamIsInChallenge(challenge, team, member, channel);

                teams = [team];
            } else {
                await Discord.queue(`Sorry, ${member}, but you must specify a team to penalize.`, channel);
                throw new Warning("Team to penalize not included.");
            }
        }

        try {
            await challenge.adjudicate(member, decision, teams);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //          #     #          #           #
    //          #     #          #           #
    //  ###   ###   ###   ###   ###    ###  ###
    // #  #  #  #  #  #  ##      #    #  #   #
    // # ##  #  #  #  #    ##    #    # ##   #
    //  # #   ###   ###  ###      ##   # #    ##
    /**
     * Add a stat for a pilot to a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async addstat(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "Use the `!addstat` command followed by the pilot you are recording the stat for, along with the kills, assists, and deaths.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsConfirmed(challenge, member, channel);

        if (!statMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must use the \`!addstat\` command followed by the pilot you are recording the stat for, along with the kills, assists, and deaths.`, channel);
            throw new Warning("Invalid parameters.");
        }

        const {1: pilotName, 2: teamName, 3: kills, 4: assists, 5: deaths} = statMatch.exec(message),
            pilot = await Commands.checkPilotExists(pilotName, member, channel),
            team = await Commands.checkTeamExists(teamName, member, channel);

        await Commands.checkTeamIsInChallenge(challenge, team, member, channel);
        await Commands.checkChallengeTeamStats(challenge, pilot, team, member, channel);

        try {
            await challenge.addStat(team, pilot, +kills, +assists, +deaths);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                             #           #
    //                                             #           #
    // ###    ##   # #    ##   # #    ##    ###   ###    ###  ###
    // #  #  # ##  ####  #  #  # #   # ##  ##      #    #  #   #
    // #     ##    #  #  #  #  # #   ##      ##    #    # ##   #
    // #      ##   #  #   ##    #     ##   ###      ##   # #    ##
    /**
     * Removes a stat for a pilot from a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async removestat(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "Use the `!removestat` command followed by the pilot whose stat you are removing.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);
        await Commands.checkChallengeIsNotVoided(challenge, member, channel);
        await Commands.checkChallengeIsConfirmed(challenge, member, channel);

        const pilot = await Commands.checkPilotExists(message, member, channel),
            stats = {};

        try {
            stats.challengingTeamStats = await challenge.getStatsForTeam(challenge.challengingTeam);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        try {
            stats.challengedTeamStats = await challenge.getStatsForTeam(challenge.challengedTeam);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!stats.challengingTeamStats.find((s) => s.pilot.id === pilot.id) && !stats.challengedTeamStats.find((s) => s.pilot.id === pilot.id)) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} does not have a recorded stat for this match.`, channel);
            throw new Warning("No stat for pilot.");
        }

        try {
            await challenge.removeStat(pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //              #       #
    //                      #
    // # #    ##   ##     ###   ###   ###  # #    ##
    // # #   #  #   #    #  #  #  #  #  #  ####  # ##
    // # #   #  #   #    #  #   ##   # ##  #  #  ##
    //  #     ##   ###    ###  #      # #  #  #   ##
    //                          ###
    /**
     * Voids a game.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async voidgame(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        let challenge = await Commands.checkChannelIsChallengeRoom(channel, member);

        if (challenge) {
            if (!await Commands.checkNoParameters(message, member, "Use the `!voidgame` command by itself in a challenge channel to void the match.", channel)) {
                return false;
            }

            try {
                await challenge.void(member);
            } catch (err) {
                await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
                throw err;
            }
        } else {
            if (!await Commands.checkHasParameters(message, member, "Use the `!voidgame` command with the team tags of the two teams for which you wish to look up a match to void.", channel)) {
                return false;
            }

            if (twoTeamTagMatch.test(message)) {
                const {1: team1Tag, 2: team2Tag} = twoTeamTagMatch.exec(message),
                    team1 = await Commands.checkTeamExists(team1Tag, member, channel),
                    team2 = await Commands.checkTeamExists(team2Tag, member, channel),
                    challenges = await Challenge.getAllByTeams(team1, team2),
                    results = [];

                if (challenges.length === 0) {
                    await Discord.queue(`Sorry, ${member}, but no games have been scheduled between **${team1.name}** and **${team2.name}**.`, channel);
                    throw new Warning("No games played between specified teams.");
                }

                for (challenge of challenges) {
                    await Commands.checkChallengeDetails(challenge, member, channel);

                    if (challenge.details.dateConfirmed) {
                        results.push(`${challenge.id}) ${challenge.challengingTeam.tag} ${challenge.details.challengingTeamScore}, ${challenge.challengedTeam.tag} ${challenge.details.challengedTeamScore}, ${challenge.details.map}, ${challenge.details.matchTime.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`);
                    } else {
                        results.push(`${challenge.id}) ${challenge.challengingTeam.tag} vs ${challenge.challengedTeam.tag}, ${challenge.details.map || "Map not set"}, ${challenge.details.matchTime ? challenge.details.matchTime.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"}) : "Time not set"}`);
                    }
                }

                await Discord.queue(`Use \`!voidgame\` along with the challenge ID from the list below to void a specific game.\n${results.join("\n")}`, member);
            } else if (numberMatch.test(message)) {
                challenge = await Commands.checkChallengeIdExists(+message, member, channel);

                try {
                    await challenge.void(member);
                } catch (err) {
                    await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
                    throw err;
                }

                await Discord.queue(`${member}, the specified challenge has been voided.`, channel);
            } else {
                await Discord.queue(`Sorry, ${member}, but you must use the \`!voidgame\` command with the team tags of the two teams for which you wish to look up a match to void.`, channel);
                throw new Warning("Invalid parameters.");
            }
        }

        return true;
    }

    //                          #       #
    //                                  #
    // #  #  ###   # #    ##   ##     ###   ###   ###  # #    ##
    // #  #  #  #  # #   #  #   #    #  #  #  #  #  #  ####  # ##
    // #  #  #  #  # #   #  #   #    #  #   ##   # ##  #  #  ##
    //  ###  #  #   #     ##   ###    ###  #      # #  #  #   ##
    //                                      ###
    /**
     * Unvoids a game.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async unvoidgame(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkHasParameters(message, member, "Use the `!unvoidgame` command with the challenge ID of the challenge you wish to unvoid.", channel)) {
            return false;
        }

        if (!numberMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must use the \`!unvoidgame\` command with the challenge ID of the challenge you wish to unvoid.`, channel);
            throw new Warning("Invalid parameters.");
        }

        const challenge = await Commands.checkChallengeIdExists(+message, member, channel);

        await Commands.checkChallengeDetails(challenge, member, channel);

        if (!challenge.details.dateConfirmed && !challenge.channel) {
            await Discord.queue(`Sorry, ${member}, but this incomplete challenge no longer exists.  Have the teams simply challenge each other again.`, channel);
            throw new Warning("Challenge channel deleted already.");
        }

        try {
            await challenge.unvoid(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, the specified challenge has been unvoided.`, channel);

        return true;
    }

    //       ##
    //        #
    //  ##    #     ##    ###    ##    ###   ###  # #    ##
    // #      #    #  #  ##     # ##  #  #  #  #  ####  # ##
    // #      #    #  #    ##   ##     ##   # ##  #  #  ##
    //  ##   ###    ##   ###     ##   #      # #  #  #   ##
    //                                 ###
    /**
     * Closes a game.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async closegame(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkNoParameters(message, member, "Use the `!closegame` command by itself to close a channel where the match has been completed or voided.", channel)) {
            return false;
        }

        await Commands.checkChallengeDetails(challenge, member, channel);

        let stats;
        if (!challenge.details.dateVoided) {
            await Commands.checkChallengeIsConfirmed(challenge, member, channel);
            stats = await Commands.checkChallengeStatsComplete(challenge, member, channel);
        }

        try {
            await challenge.close(member, stats);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //  #     #     #    ##
    //  #           #     #
    // ###   ##    ###    #     ##
    //  #     #     #     #    # ##
    //  #     #     #     #    ##
    //   ##  ###     ##  ###    ##
    /**
     * Assigns a title to a game.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async title(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        try {
            await challenge.title(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #
    //                     #
    // ###    ##    ###   ###    ###    ##    ###   ###    ##   ###
    // #  #  #  #  ##      #    ##     # ##  #  #  ##     #  #  #  #
    // #  #  #  #    ##    #      ##   ##    # ##    ##   #  #  #  #
    // ###    ##   ###      ##  ###     ##    # #  ###     ##   #  #
    // #
    /**
     * Sets a match to be a postseason match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async postseason(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkNoParameters(message, member, "Use the `!postseason` command by itself to set this challenge as a postseason match.", channel)) {
            return false;
        }

        try {
            await challenge.setPostseason();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.`, channel);
            throw err;
        }

        return true;
    }

    //                         ##
    //                          #
    // ###    ##    ###  #  #   #     ###  ###    ###    ##    ###   ###    ##   ###
    // #  #  # ##  #  #  #  #   #    #  #  #  #  ##     # ##  #  #  ##     #  #  #  #
    // #     ##     ##   #  #   #    # ##  #       ##   ##    # ##    ##   #  #  #  #
    // #      ##   #      ###  ###    # #  #     ###     ##    # #  ###     ##   #  #
    //              ###
    /**
     * Sets a match to be a regular season match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async regularseason(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        const challenge = await Commands.checkChannelIsChallengeRoom(channel, member);
        if (!challenge) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!await Commands.checkNoParameters(message, member, "Use the `!regularseason` command by itself to set this challenge as a regular season match.", channel)) {
            return false;
        }

        try {
            await challenge.setRegularSeason();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.`, channel);
            throw err;
        }

        return true;
    }

    //          #     #                           #
    //          #     #                           #
    //  ###   ###   ###   ##   # #    ##   ###   ###
    // #  #  #  #  #  #  # ##  # #   # ##  #  #   #
    // # ##  #  #  #  #  ##    # #   ##    #  #   #
    //  # #   ###   ###   ##    #     ##   #  #    ##
    /**
     * Adds an event for the !next command.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async addevent(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        if (!eventParse.test(message)) {
            return false;
        }

        const {1: title, 2: dateStartStr, 3: dateEndStr} = eventParse.exec(message);

        let dateStart;
        try {
            dateStart = new Date(new tz.Date(dateStartStr, await member.getTimezone()).getTime());
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but I couldn't parse the start date and time.`, channel);
            throw new Warning("Invalid start date.");
        }

        if (!dateStart || isNaN(dateStart.valueOf())) {
            await Discord.queue(`Sorry, ${member}, but I couldn't parse the start date and time.`, channel);
            throw new Warning("Invalid start date.");
        }

        let dateEnd;
        try {
            dateEnd = new Date(new tz.Date(dateEndStr, await member.getTimezone()).getTime());
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but I couldn't parse the end date and time.`, channel);
            throw new Warning("Invalid end date.");
        }

        if (!dateEnd || isNaN(dateEnd.valueOf())) {
            await Discord.queue(`Sorry, ${member}, but I couldn't parse the end date and time.`, channel);
            throw new Warning("Invalid end date.");
        }

        if (dateStart.getTime() - new Date().getTime() < -180 * 24 * 60 * 60 * 1000) {
            await Discord.queue(`Sorry, ${member}, but you cannot schedule an event that far into the past.`, channel);
            throw new Warning("Date too far into the past.");
        }

        if (dateEnd.getTime() - new Date().getTime() < -180 * 24 * 60 * 60 * 1000) {
            await Discord.queue(`Sorry, ${member}, but you cannot schedule an event that far into the past.`, channel);
            throw new Warning("Date too far into the past.");
        }

        if (dateStart.getTime() - new Date().getTime() > 180 * 24 * 60 * 60 * 1000) {
            await Discord.queue(`Sorry, ${member}, but you cannot schedule an event that far into the future.`, channel);
            throw new Warning("Date too far into the future.");
        }

        if (dateEnd.getTime() - new Date().getTime() > 180 * 24 * 60 * 60 * 1000) {
            await Discord.queue(`Sorry, ${member}, but you cannot schedule an event that far into the future.`, channel);
            throw new Warning("Date too far into the future.");
        }

        try {
            await Otl.addEvent(title, dateStart, dateEnd);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, the event **${title}** has been added.  Use the \`!next\` command to see upcoming events.`, channel);
        return true;
    }

    //                                                              #
    //                                                              #
    // ###    ##   # #    ##   # #    ##    ##   # #    ##   ###   ###
    // #  #  # ##  ####  #  #  # #   # ##  # ##  # #   # ##  #  #   #
    // #     ##    #  #  #  #  # #   ##    ##    # #   ##    #  #   #
    // #      ##   #  #   ##    #     ##    ##    #     ##   #  #    ##
    /**
     * Removes an event for the !next command.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise<boolean>} A promise that resolves with whether the command completed successfully.
     */
    async removeevent(member, channel, message) {
        if (!Commands.checkChannelIsOnServer(channel)) {
            return false;
        }

        await Commands.checkMemberIsOwner(member);

        try {
            await Otl.removeEvent(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, the event **${message}** has been removed.  Use the \`!next\` command to see upcoming events.`, channel);
        return true;
    }
}

module.exports = Commands;
