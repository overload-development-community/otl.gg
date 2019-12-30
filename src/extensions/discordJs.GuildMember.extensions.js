const DiscordJs = require("discord.js"),

    Challenge = require("../models/challenge"),
    Db = require("../database/player"),
    TeamDb = require("../database/team"),
    Exception = require("../logging/exception"),
    NewTeam = require("../models/newTeam"),
    settings = require("../../settings"),
    Team = require("../models/team");

/**
 * @type {typeof import("../discord")}
 */
let Discord;

setTimeout(() => {
    Discord = require("../discord");
}, 0);

//          #     #  ###          #     #          #     #  #
//          #     #   #                 #          #     ## #
//  ###   ###   ###   #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
// #  #  #  #  #  #   #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
// # ##  #  #  #  #   #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
//  # #   ###   ###   #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
/**
 * Adds a Twitch name to the member's account.
 * @param {string} name The Twitch name.
 * @returns {Promise} A promise that resolves when the Twitch name has been added.
 */
DiscordJs.GuildMember.prototype.addTwitchName = async function(name) {
    try {
        return await Db.setTwitchName(this, name);
    } catch (err) {
        throw new Exception("There was a database error adding a Twitch name.", err);
    }
};

// #                                #  ####                    ###                     #  #         #     #    ##
// #                                #  #                        #                      #  #         #           #
// ###    ###  ###   ###    ##    ###  ###   ###    ##   # #    #     ##    ###  # #   #  #  ###   ###   ##     #
// #  #  #  #  #  #  #  #  # ##  #  #  #     #  #  #  #  ####   #    # ##  #  #  ####  #  #  #  #   #     #     #
// #  #  # ##  #  #  #  #  ##    #  #  #     #     #  #  #  #   #    ##    # ##  #  #  #  #  #  #   #     #     #
// ###    # #  #  #  #  #   ##    ###  #     #      ##   #  #   #     ##    # #  #  #   ##   #  #    ##  ###   ###
/**
 * Returns the date and time the pilot is banned from a team until.
 * @param {Team} team The team to check.
 * @returns {Promise<Date>} A promise that resolves with the date and time the pilot is banned from the team until.  Returns nothing if the pilot is not banned.
 */
DiscordJs.GuildMember.prototype.bannedFromTeamUntil = async function(team) {
    try {
        return await Db.bannedFromTeamUntil(this, team);
    } catch (err) {
        throw new Exception("There was a database error checking when the pilot is banned from joinin a team until.", err);
    }
};

//                   ###          ##                #           #
//                   #  #        #  #               #
//  ##    ###  ###   ###    ##   #      ###  ###   ###    ###  ##    ###
// #     #  #  #  #  #  #  # ##  #     #  #  #  #   #    #  #   #    #  #
// #     # ##  #  #  #  #  ##    #  #  # ##  #  #   #    # ##   #    #  #
//  ##    # #  #  #  ###    ##    ##    # #  ###     ##   # #  ###   #  #
//                                           #
/**
 * Returns whether the pilot can be a captain.
 * @returns {Promise<boolean>} A promise that resolves with whether the pilot can be a captain.
 */
DiscordJs.GuildMember.prototype.canBeCaptain = async function() {
    try {
        return await Db.canBeCaptain(this);
    } catch (err) {
        throw new Exception("There was a database error checking whether the pilot can be a captain.", err);
    }
};

//                   ###                                 ###    #    ##           #
//                   #  #                                #  #         #           #
//  ##    ###  ###   #  #   ##   # #    ##   # #    ##   #  #  ##     #     ##   ###
// #     #  #  #  #  ###   # ##  ####  #  #  # #   # ##  ###    #     #    #  #   #
// #     # ##  #  #  # #   ##    #  #  #  #  # #   ##    #      #     #    #  #   #
//  ##    # #  #  #  #  #   ##   #  #   ##    #     ##   #     ###   ###    ##     ##
/**
 * Returns whether the pilot can remove another pilot from their team.
 * @param {DiscordJs.GuildMember} pilot The pilot to check.
 * @returns {Promise<boolean>} A promise that resolves with whether the pilot can remove another pilot from their team.
 */
DiscordJs.GuildMember.prototype.canRemovePilot = async function(pilot) {
    try {
        return await Db.canRemovePilot(this, pilot);
    } catch (err) {
        throw new Exception("There was a database error checking if the pilot can remove a pilot.", err);
    }
};

//       ##                      ###    #
//        #                       #
//  ##    #     ##    ###  ###    #    ##    # #    ##   ####   ##   ###    ##
// #      #    # ##  #  #  #  #   #     #    ####  # ##    #   #  #  #  #  # ##
// #      #    ##    # ##  #      #     #    #  #  ##     #    #  #  #  #  ##
//  ##   ###    ##    # #  #      #    ###   #  #   ##   ####   ##   #  #   ##
/**
 * Clears a pilot's timezone.
 * @returns {Promise<void>} A promise that resolves when the timezone is clear.
 */
DiscordJs.GuildMember.prototype.clearTimezone = async function() {
    try {
        return await Db.clearTimezone(this);
    } catch (err) {
        throw new Exception("There was a database error clearing a pilot's timezone.", err);
    }
};

//                          #          #  #              ###
//                          #          ## #               #
//  ##   ###    ##    ###  ###    ##   ## #   ##   #  #   #     ##    ###  # #
// #     #  #  # ##  #  #   #    # ##  # ##  # ##  #  #   #    # ##  #  #  ####
// #     #     ##    # ##   #    ##    # ##  ##    ####   #    ##    # ##  #  #
//  ##   #      ##    # #    ##   ##   #  #   ##   ####   #     ##    # #  #  #
/**
 * Starts team creation for the pilot.
 * @returns {Promise<NewTeam>} A promise that resolves with a new team object.
 */
DiscordJs.GuildMember.prototype.createNewTeam = function() {
    return NewTeam.create(this);
};

//              #    #  #              ###
//              #    ## #               #
//  ###   ##   ###   ## #   ##   #  #   #     ##    ###  # #
// #  #  # ##   #    # ##  # ##  #  #   #    # ##  #  #  ####
//  ##   ##     #    # ##  ##    ####   #    ##    # ##  #  #
// #      ##     ##  #  #   ##   ####   #     ##    # #  #  #
//  ###
/**
 * Returns the pilot's new team object.
 * @returns {Promise<NewTeam>} A promise that resolves with the new team object for the pilot.
 */
DiscordJs.GuildMember.prototype.getNewTeam = function() {
    return NewTeam.getByPilot(this);
};

//              #    ###                                   #             #   ##         ###                #     #             #  ###
//              #    #  #                                  #             #  #  #         #                       #             #   #
//  ###   ##   ###   #  #   ##    ###  #  #   ##    ###   ###    ##    ###  #  #  ###    #    ###   # #   ##    ###    ##    ###   #     ##    ###  # #    ###
// #  #  # ##   #    ###   # ##  #  #  #  #  # ##  ##      #    # ##  #  #  #  #  #  #   #    #  #  # #    #     #    # ##  #  #   #    # ##  #  #  ####  ##
//  ##   ##     #    # #   ##    #  #  #  #  ##      ##    #    ##    #  #  #  #  #      #    #  #  # #    #     #    ##    #  #   #    ##    # ##  #  #    ##
// #      ##     ##  #  #   ##    ###   ###   ##   ###      ##   ##    ###   ##   #     ###   #  #   #    ###     ##   ##    ###   #     ##    # #  #  #  ###
//  ###                             #
/**
 * Gets the teams that the pilot has requested or has been invited to.
 * @returns {Promise<Team[]>} A promise that resolves with the teams that the pilot has requested or has been invited to.
 */
DiscordJs.GuildMember.prototype.getRequestedOrInvitedTeams = async function() {
    let teams;
    try {
        teams = await Db.getRequestedOrInvitedTeams(this);
    } catch (err) {
        throw new Exception("There was a database error getting the requested or invited teams for the pilot.", err);
    }

    return teams.map((t) => new Team(t));
};

//              #     ##    #           #
//              #    #  #   #           #
//  ###   ##   ###    #    ###    ###  ###    ###
// #  #  # ##   #      #    #    #  #   #    ##
//  ##   ##     #    #  #   #    # ##   #      ##
// #      ##     ##   ##     ##   # #    ##  ###
//  ###
/**
 * Gets the current season stats for the pilot.
 * @returns {Promise<{playerId: number, name: string, tag: string, games: number, kills: number, assists: number, deaths: number, damage: number, deathsInGamesWithDamage: number, season: number}>} A promise that resolves with the pilot's stats.
 */
DiscordJs.GuildMember.prototype.getStats = async function() {
    try {
        return await Db.getStats(this);
    } catch (err) {
        throw new Exception("There was a database error getting the stats for a pilot.", err);
    }
};

//              #    ###
//              #     #
//  ###   ##   ###    #     ##    ###  # #
// #  #  # ##   #     #    # ##  #  #  ####
//  ##   ##     #     #    ##    # ##  #  #
// #      ##     ##   #     ##    # #  #  #
//  ###
/**
 * Returns the pilot's team.
 * @returns {Promise<Team>} A promise that resolves with the pilot's team.
 */
DiscordJs.GuildMember.prototype.getTeam = function() {
    return Team.getByPilot(this);
};

//              #    ###    #
//              #     #
//  ###   ##   ###    #    ##    # #    ##   ####   ##   ###    ##
// #  #  # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##
//  ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##
// #      ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##
//  ###
/**
 * Gets a pilot's time zone.  Default to team's time zone if the pilot doesn't have one, or the default time zone if neither have a value.
 * @returns {Promise<string>} A promise that resolves with the pilot's time zone.
 */
DiscordJs.GuildMember.prototype.getTimezone = async function() {
    try {
        const timezone = await Db.getTimezone(this);
        if (timezone) {
            return timezone;
        }

        const team = new Team(await TeamDb.getByPilot(this));
        if (team) {
            const teamTimezone = await team.getTimezone();
            if (teamTimezone) {
                return teamTimezone;
            }
        }

        return settings.defaultTimezone;
    } catch (err) {
        return settings.defaultTimezone;
    }
};

//              #    ###          #     #          #     #  #
//              #     #                 #          #     ## #
//  ###   ##   ###    #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
// #  #  # ##   #     #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
//  ##   ##     #     #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
// #      ##     ##   #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
//  ###
/**
 * Gets a pilot's Twitch name.
 * @returns {Promise<string>} A promise that resolves with the pilot's Twitch name.
 */
DiscordJs.GuildMember.prototype.getTwitchName = async function() {
    try {
        return await Db.getTwitchName(this);
    } catch (err) {
        throw new Exception("There was a database error getting a pilot's Twitch name.", err);
    }
};

// #                  ###                     ###                #     #             #  ###         ###
// #                  #  #                     #                       #             #   #           #
// ###    ###   ###   ###    ##    ##   ###    #    ###   # #   ##    ###    ##    ###   #     ##    #     ##    ###  # #
// #  #  #  #  ##     #  #  # ##  # ##  #  #   #    #  #  # #    #     #    # ##  #  #   #    #  #   #    # ##  #  #  ####
// #  #  # ##    ##   #  #  ##    ##    #  #   #    #  #  # #    #     #    ##    #  #   #    #  #   #    ##    # ##  #  #
// #  #   # #  ###    ###    ##    ##   #  #  ###   #  #   #    ###     ##   ##    ###   #     ##    #     ##    # #  #  #
/**
 * Gets whether the pilot has been invited to a team.
 * @param {Team} team The team to check.
 * @returns {Promise<boolean>} A promise that resolves with whether the pilot has been invited to the team.
 */
DiscordJs.GuildMember.prototype.hasBeenInvitedToTeam = async function(team) {
    try {
        return await Db.hasBeenInvitedToTeam(this, team);
    } catch (err) {
        throw new Exception("There was a database error checking whether the pilot has been invited to a team.", err);
    }
};

// #                  ###                                   #             #  ###
// #                  #  #                                  #             #   #
// ###    ###   ###   #  #   ##    ###  #  #   ##    ###   ###    ##    ###   #     ##    ###  # #
// #  #  #  #  ##     ###   # ##  #  #  #  #  # ##  ##      #    # ##  #  #   #    # ##  #  #  ####
// #  #  # ##    ##   # #   ##    #  #  #  #  ##      ##    #    ##    #  #   #    ##    # ##  #  #
// #  #   # #  ###    #  #   ##    ###   ###   ##   ###      ##   ##    ###   #     ##    # #  #  #
//                                   #
/**
 * Gets whether the pilot has requested a team.
 * @param {Team} team The team requested.
 * @returns {Promise<boolean>} A promise that resolves with whether the pilot has requested the team.
 */
DiscordJs.GuildMember.prototype.hasRequestedTeam = async function(team) {
    try {
        return await Db.hasRequestedTeam(this, team);
    } catch (err) {
        throw new Exception("There was a database error checking whether the pilot has requested a team.", err);
    }
};

//  #            ##                #           #           ##         ####                       #
//              #  #               #                      #  #        #                          #
// ##     ###   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###
//  #    ##     #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #
//  #      ##   #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #
// ###   ###     ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #
//                          #
/**
 * Returns whether the pilot is a captain or a founder.
 * @returns {boolean} Whether the pilot is a captain or a founder.
 */
DiscordJs.GuildMember.prototype.isCaptainOrFounder = function() {
    return !!Discord.founderRole.members.find((m) => m.id === this.id) || !!Discord.captainRole.members.find((m) => m.id === this.id);
};

//  #           ####                       #
//              #                          #
// ##     ###   ###    ##   #  #  ###    ###   ##   ###
//  #    ##     #     #  #  #  #  #  #  #  #  # ##  #  #
//  #      ##   #     #  #  #  #  #  #  #  #  ##    #
// ###   ###    #      ##    ###  #  #   ###   ##   #
/**
 * Returns whether the pilot is a founder.
 * @returns {boolean} Whether the pilot is a founder.
 */
DiscordJs.GuildMember.prototype.isFounder = function() {
    return !!Discord.founderRole.members.find((m) => m.id === this.id);
};

//   #          #          ###                     ###                #             #  #  #         #     #    ##
//                          #                      #  #                             #  #  #         #           #
//   #    ##   ##    ###    #     ##    ###  # #   #  #   ##   ###   ##     ##    ###  #  #  ###   ###   ##     #
//   #   #  #   #    #  #   #    # ##  #  #  ####  #  #  # ##  #  #   #    # ##  #  #  #  #  #  #   #     #     #
//   #   #  #   #    #  #   #    ##    # ##  #  #  #  #  ##    #  #   #    ##    #  #  #  #  #  #   #     #     #
// # #    ##   ###   #  #   #     ##    # #  #  #  ###    ##   #  #  ###    ##    ###   ##   #  #    ##  ###   ###
//  #
/**
 * Returns the date and time which the pilot is banned from joining teams.
 * @returns {Promise<Date>} A promise that resolves with the date and time which the pilot is banned from joining teams.  Returns nothing if the pilot is not banned.
 */
DiscordJs.GuildMember.prototype.joinTeamDeniedUntil = async function() {
    try {
        return await Db.joinTeamDeniedUntil(this);
    } catch (err) {
        throw new Exception("There was a database error checking when a pilot is banned from joining teams until.", err);
    }
};

// ##            #    #    ###    #                                #
//  #           # #   #    #  #                                    #
//  #     ##    #    ###   #  #  ##     ###    ##    ##   ###    ###
//  #    # ##  ###    #    #  #   #    ##     #     #  #  #  #  #  #
//  #    ##     #     #    #  #   #      ##   #     #  #  #     #  #
// ###    ##    #      ##  ###   ###   ###     ##    ##   #      ###
/**
 * Performs the required actions when a pilot leaves the Discord server.
 * @returns {Promise} A promise that resolves when a pilot leaves Discord.
 */
DiscordJs.GuildMember.prototype.leftDiscord = async function() {
    let team;
    try {
        team = await Team.getByPilot(this);
    } catch (err) {
        throw new Exception(`There was a database error getting a team for a pilot.  Please remove ${this.displayName} manually.`, err);
    }

    let castedChallengeIds;
    try {
        castedChallengeIds = await Db.getCastedChallenges(this);
    } catch (err) {
        throw new Exception("There was a database error getting a pilot's casted matches.", err);
    }

    for (const challengeId of castedChallengeIds) {
        const challenge = await Challenge.getById(challengeId);

        await challenge.unsetCaster(this);
        await challenge.updateTopic();
    }

    if (!team) {
        let requestedTeams;
        try {
            requestedTeams = await Db.getRequestedOrInvitedTeams(this);
        } catch (err) {
            throw new Exception(`There was a database error getting a pilot's team invites and requests.  Please remove ${this.displayName} manually.`, err);
        }

        for (const requestedTeam of requestedTeams.map((t) => new Team(t))) {
            try {
                await requestedTeam.pilotLeft(this);
            } catch (err) {
                throw new Exception(`There was an error removing a pilot from a team invite or request.  Please remove ${this.displayName} from ${requestedTeam.name} manually.`, err);
            }

            await requestedTeam.updateChannels();
        }

        const newTeam = await NewTeam.getByPilot(this);
        if (newTeam) {
            await newTeam.delete(`${this.displayName} left the server.`);
        }

        return;
    }

    await team.pilotLeft(this);
    await team.updateChannels();

    if (team.founder && team.founder.id === this.id) {
        if (await team.getPilotCount() === 0) {
            await team.disband(this);
        } else {
            Discord.queue(`${this.displayName} has left the server, but was the founder of ${team.name}.  Please resolve team ownership manually.`, Discord.alertsChannel);
        }
    }
};

//                                     ###          #     #          #     #  #
//                                      #                 #          #     ## #
// ###    ##   # #    ##   # #    ##    #    #  #  ##    ###    ##   ###   ## #   ###  # #    ##
// #  #  # ##  ####  #  #  # #   # ##   #    #  #   #     #    #     #  #  # ##  #  #  ####  # ##
// #     ##    #  #  #  #  # #   ##     #    ####   #     #    #     #  #  # ##  # ##  #  #  ##
// #      ##   #  #   ##    #     ##    #    ####  ###     ##   ##   #  #  #  #   # #  #  #   ##
/**
 * Removes a Twitch name from the member's account.
 * @returns {Promise} A promise that resolves when the Twitch name has been added.
 */
DiscordJs.GuildMember.prototype.removeTwitchName = async function() {
    try {
        return await Db.unsetTwitchName(this);
    } catch (err) {
        throw new Exception("There was a database error adding a Twitch name.", err);
    }
};

//                                       #    ###
//                                       #     #
// ###    ##    ###  #  #   ##    ###   ###    #     ##    ###  # #
// #  #  # ##  #  #  #  #  # ##  ##      #     #    # ##  #  #  ####
// #     ##    #  #  #  #  ##      ##    #     #    ##    # ##  #  #
// #      ##    ###   ###   ##   ###      ##   #     ##    # #  #  #
//                #
/**
 * Requests to join a team.
 * @param {Team} team The team to request joining.
 * @returns {Promise} A promise that resolves when the request to join the team has been sent.
 */
DiscordJs.GuildMember.prototype.requestTeam = async function(team) {
    try {
        await Db.requestTeam(this, team);
    } catch (err) {
        throw new Exception("There was a database error requesting to join a team.", err);
    }

    try {
        const captainsChannel = team.captainsChannel;
        if (!captainsChannel) {
            throw new Error("Captain's channel does not exist for the team.");
        }

        await Discord.queue(`${this.displayName} has requested to join the team.`, captainsChannel);

        await team.updateChannels();
    } catch (err) {
        throw new Exception("There was a critical Discord error requesting to join a team.  Please resolve this manually as soon as possible.", err);
    }
};

//               #    ###    #
//               #     #
//  ###    ##   ###    #    ##    # #    ##   ####   ##   ###    ##
// ##     # ##   #     #     #    ####  # ##    #   #  #  #  #  # ##
//   ##   ##     #     #     #    #  #  ##     #    #  #  #  #  ##
// ###     ##     ##   #    ###   #  #   ##   ####   ##   #  #   ##
/**
 * Sets a pilot's time zone.
 * @param {string} timezone The time zone to set.
 * @returns {Promise} A promise that resolves when the time zone has been set.
 */
DiscordJs.GuildMember.prototype.setTimezone = async function(timezone) {
    try {
        await Db.setTimezone(this, timezone);
    } catch (err) {
        throw new Exception("There was a database error setting a pilot's time zone.", err);
    }
};

//                #         #          #  #
//                #         #          ## #
// #  #  ###    ###   ###  ###    ##   ## #   ###  # #    ##
// #  #  #  #  #  #  #  #   #    # ##  # ##  #  #  ####  # ##
// #  #  #  #  #  #  # ##   #    ##    # ##  # ##  #  #  ##
//  ###  ###    ###   # #    ##   ##   #  #   # #  #  #   ##
//       #
/**
 * Updates the pilot's name.
 * @param {DiscordJs.GuildMember} oldMember The pilot with their previous name.
 * @returns {Promise} A promise that resolves when the pilot's name is updated.
 */
DiscordJs.GuildMember.prototype.updateName = async function(oldMember) {
    try {
        await Db.setName(this);
    } catch (err) {
        throw new Exception("There was a database error updating the pilot's name.", err);
    }

    let castedChallengeIds;
    try {
        castedChallengeIds = await Db.getCastedChallenges(this);
    } catch (err) {
        throw new Exception("There was a database error getting a pilot's casted matches.", err);
    }

    for (const challengeId of castedChallengeIds) {
        const challenge = await Challenge.getById(challengeId);

        await challenge.updateTopic();
    }

    const team = await Team.getByPilot(this);

    if (!team) {
        let requestedTeams;
        try {
            requestedTeams = await this.getRequestedOrInvitedTeams();
        } catch (err) {
            throw new Exception(`There was a database error getting a pilot's team invites and requests.  Please update ${this.displayName} manually.`, err);
        }

        for (const requestedTeam of requestedTeams) {
            await requestedTeam.updateChannels();
        }
        return;
    }

    await Discord.richQueue(Discord.richEmbed({
        title: `${team.name} (${team.tag})`,
        description: "Pilot Name Change",
        color: team.role.color,
        fields: [
            {
                name: "Old Name",
                value: `${oldMember.displayName}`
            },
            {
                name: "New Name",
                value: `${this.displayName}`
            }
        ],
        footer: {
            text: "pilot changed name"
        }
    }), Discord.rosterUpdatesChannel);

    const challenges = await Challenge.getAllByTeam(team);
    for (const challenge of challenges) {
        await challenge.updateTopic();
    }

    await team.updateChannels();
};

//                    ###                      #                        ##                #           #           ##         ####                       #               ##     #   ###
//                    #  #                                             #  #               #                      #  #        #                          #              #  #   # #   #
// #  #   ###   ###   #  #  ###    ##   # #   ##     ##   #  #   ###   #      ###  ###   ###    ###  ##    ###   #  #  ###   ###    ##   #  #  ###    ###   ##   ###   #  #   #     #     ##    ###  # #
// #  #  #  #  ##     ###   #  #  # ##  # #    #    #  #  #  #  ##     #     #  #  #  #   #    #  #   #    #  #  #  #  #  #  #     #  #  #  #  #  #  #  #  # ##  #  #  #  #  ###    #    # ##  #  #  ####
// ####  # ##    ##   #     #     ##    # #    #    #  #  #  #    ##   #  #  # ##  #  #   #    # ##   #    #  #  #  #  #     #     #  #  #  #  #  #  #  #  ##    #     #  #   #     #    ##    # ##  #  #
// ####   # #  ###    #     #      ##    #    ###    ##    ###  ###     ##    # #  ###     ##   # #  ###   #  #   ##   #     #      ##    ###  #  #   ###   ##   #      ##    #     #     ##    # #  #  #
//                                                                                 #
/**
 * Returns whether the pilot was a captain or founder of a team previously.
 * @param {Team} team The team to check.
 * @returns {Promise<boolean>} A promise that resolves with whether the pilot was a captain or founder previously.
 */
DiscordJs.GuildMember.prototype.wasPreviousCaptainOrFounderOfTeam = async function(team) {
    try {
        return await Db.wasPreviousCaptainOrFounderOfTeam(this, team);
    } catch (err) {
        throw new Exception("There was a database error checking if the pilot was a previous captain or founder of a team.", err);
    }
};
