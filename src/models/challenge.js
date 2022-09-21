/**
 * @typedef {import("../../types/challengeTypes").AuthorizedPlayers} ChallengeTypes.AuthorizedPlayers
 * @typedef {import("../../types/challengeTypes").CastData} ChallengeTypes.CastData
 * @typedef {import("../../types/challengeTypes").ChallengeConstructor} ChallengeTypes.ChallengeConstructor
 * @typedef {import("../../types/challengeTypes").CreateData} ChallengeTypes.CreateData
 * @typedef {import("../../types/challengeTypes").CreateOptions} ChallengeTypes.CreateOptions
 * @typedef {import("../../types/challengeTypes").GameBoxScore} ChallengeTypes.GameBoxScore
 * @typedef {import("../../types/challengeTypes").GamePlayerStats} ChallengeTypes.GamePlayerStats
 * @typedef {import("../../types/challengeTypes").GamePlayerStatsByTeam} ChallengeTypes.GamePlayerStatsByTeam
 * @typedef {import("../../types/challengeTypes").PlayersByTeam} ChallengeTypes.PlayersByTeam
 * @typedef {import("../../types/challengeTypes").StreamerData} ChallengeTypes.StreamerData
 * @typedef {import("../../types/challengeTypes").TeamDetailsData} ChallengeTypes.TeamDetailsData
 * @typedef {import("../../types/challengeTypes").TeamPenaltyData} ChallengeTypes.TeamPenaltyData
 * @typedef {import("../../types/playerTypes").UserOrGuildMember} PlayerTypes.UserOrGuildMember
 */

const Calendar = require("../calendar"),
    Common = require("../../web/includes/common"),
    Db = require("../database/challenge"),
    DiscordJs = require("discord.js"),
    Exception = require("../logging/exception"),
    Log = require("../logging/log"),
    NameMapDb = require("../database/nameMap"),
    schedule = require("node-schedule"),
    settings = require("../../settings"),
    Team = require("./team"),
    Tracker = require("../tracker"),

    channelParse = /^(?<challengingTeamTag>[0-9a-z]{1,5})-(?<challengedTeamTag>[0-9a-z]{1,5})-(?<id>[1-9][0-9]*)$/,
    urlParse = /^https:\/\/www.twitch.tv\/(?<user>.+)$/;

/** @type {Object.<number, schedule.Job>} */
const clockExpiredJobs = {};

/** @type {Object.<number, schedule.Job>} */
const upcomingMatchJobs = {};

/** @type {Object.<number, schedule.Job>} */
const missedMatchJobs = {};

/** @type {Object.<string, string>} */
const lastCommand = {};

/** @type {typeof import("../discord")} */
let Discord;

setTimeout(() => {
    Discord = require("../discord");
}, 0);

/** @type {typeof import("../discord/validation")} */
let Validation;

setTimeout(() => {
    Validation = require("../discord/validation");
}, 0);

//   ###   #              ##     ##
//  #   #  #               #      #
//  #      # ##    ###     #      #     ###   # ##    ## #   ###
//  #      ##  #      #    #      #    #   #  ##  #  #  #   #   #
//  #      #   #   ####    #      #    #####  #   #   ##    #####
//  #   #  #   #  #   #    #      #    #      #   #  #      #
//   ###   #   #   ####   ###    ###    ###   #   #   ###    ###
//                                                   #   #
//                                                    ###
/**
 * A class that handles challenge-related functions.
 */
class Challenge {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * A constructor to create a challenge.
     * @param {ChallengeTypes.ChallengeConstructor} data The data to load into the challenge.
     */
    constructor(data) {
        this.id = data.id;
        this.challengingTeam = data.challengingTeam;
        this.challengedTeam = data.challengedTeam;
    }

    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Creates a challenge between two teams.
     * @param {Team} challengingTeam The challenging team.
     * @param {Team} challengedTeam The challenged team.
     * @param {ChallengeTypes.CreateOptions} options The options to create the match with.
     * @returns {Promise<Challenge>} A promise that resolves with the newly created challenge.
     */
    static async create(challengingTeam, challengedTeam, options) {

        const {adminCreated, teamSize, startNow} = options;
        let {blueTeam, gameType, number} = options;

        if (!gameType) {
            gameType = "TA";
        }

        if (!number) {
            number = 1;
        }

        let firstChallenge;

        for (let count = 0; count < number; count++) {
            let data;
            try {
                data = await Db.create(challengingTeam, challengedTeam, gameType, !!adminCreated, adminCreated ? challengingTeam : void 0, teamSize, startNow, blueTeam);
            } catch (err) {
                throw new Exception("There was a database error creating a challenge.", err);
            }

            const challenge = new Challenge({id: data.id, challengingTeam, challengedTeam});

            try {
                if (challenge.channel) {
                    throw new Error("Channel already exists.");
                }

                await Discord.createChannel(challenge.channelName, DiscordJs.ChannelType.GuildText, [
                    {
                        id: Discord.id,
                        deny: ["ViewChannel"]
                    }, {
                        id: challengingTeam.role.id,
                        allow: ["ViewChannel"]
                    }, {
                        id: challengedTeam.role.id,
                        allow: ["ViewChannel"]
                    }
                ], `${challengingTeam.name} challenged ${challengedTeam.name}.`);

                if (Discord.challengesCategory.children.cache.size >= 40) {
                    const oldPosition = Discord.challengesCategory.position;
                    await Discord.challengesCategory.setName("Old Challenges", "Exceeded 40 challenges.");
                    Discord.challengesCategory = /** @type {DiscordJs.CategoryChannel} */ (await Discord.createChannel("Challenges", DiscordJs.ChannelType.GuildCategory, [], "Exceeded 40 challenges.")); // eslint-disable-line no-extra-parens
                    await Discord.challengesCategory.setPosition(oldPosition + 1);
                }

                await challenge.channel.setParent(Discord.challengesCategory, {lockPermissions: false});
                await challenge.channel.setTopic(`${challengingTeam.name} vs ${challengedTeam.name} - View the pinned post for challenge information.`);

                await challenge.updatePinnedPost();

                let description;

                if (gameType === "TA" && !teamSize) {
                    description = `**${data.homeMapTeam.tag}** is the home map team, so **${(data.homeMapTeam.tag === challengingTeam.tag ? challengedTeam : challengingTeam).tag}** must choose one of from one of **${data.homeMapTeam.tag}**'s home maps.  To view the home maps, you must first agree to a team size.`;
                } else {
                    description = `**${data.homeMapTeam.tag}** is the home map team, so **${(data.homeMapTeam.tag === challengingTeam.tag ? challengedTeam : challengingTeam).tag}** must choose from one of the following home maps:\n\n${(await data.homeMapTeam.getHomeMaps(Challenge.getGameTypeForHomes(gameType, teamSize))).map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}`;
                }

                await Discord.richQueue(Discord.embedBuilder({
                    title: "Challenge commands - Map",
                    description,
                    color: data.homeMapTeam.role.color,
                    fields: []
                }), challenge.channel);

                if (data.team1Penalized && data.team2Penalized) {
                    await Discord.queue("Penalties have been applied to both teams for this match.  Neutral map selection is disabled.", challenge.channel);
                } else if (data.team1Penalized) {
                    await Discord.queue(`A penalty has been applied to **${challengingTeam.tag}** for this match.  Neutral map selection is disabled.`, challenge.channel);
                } else if (data.team2Penalized) {
                    await Discord.queue(`A penalty has been applied to **${challengedTeam.tag}** for this match.  Neutral map selection is disabled.`, challenge.channel);
                } else if (!adminCreated) {
                    const matches = await Db.getMatchingNeutralsForChallenge(challenge);

                    if (matches && matches.length > 0) {
                        await Discord.queue(`Both teams have ${matches.length === 1 ? "a matching preferred neutral map!" : "matching preferred neutral maps!"}\n\n${matches.map((m) => `**${m}**`).join("\n")}`, challenge.channel);
                    }
                }
            } catch (err) {
                throw new Exception("There was a critical Discord error creating a challenge.  Please resolve this manually as soon as possible.", err);
            }

            if (!firstChallenge) {
                firstChallenge = challenge;
            }

            if (!blueTeam) {
                if (!challenge.details) {
                    await challenge.loadDetails();
                }

                blueTeam = challenge.details.blueTeam;
            }

            [challengingTeam, challengedTeam] = [challengedTeam, challengingTeam];
        }

        return firstChallenge;
    }

    //          #     #  #  #                     #
    //          #     #  ####
    //  ###   ###   ###  ####   ###  ###   ###   ##    ###    ###
    // #  #  #  #  #  #  #  #  #  #  #  #  #  #   #    #  #  #  #
    // # ##  #  #  #  #  #  #  # ##  #  #  #  #   #    #  #   ##
    //  # #   ###   ###  #  #   # #  ###   ###   ###   #  #  #
    //                               #     #                  ###
    /**
     * Adds a pilot mapping.
     * @param {string} name The name of the pilot.
     * @param {DiscordJs.User} pilot The pilot.
     * @returns {Promise} A promise that resolves when the mapping has been added.
     */
    static async addMapping(name, pilot) {
        try {
            await NameMapDb.add(name, pilot.id);
        } catch (err) {
            throw new Exception("There was an error adding a pilot mapping.", err);
        }
    }

    //              #     ##   ##    ##    ###         ###                      ###    #     #    ##          ###           #                      ##
    //              #    #  #   #     #    #  #        #  #                      #           #     #          #  #         # #                    #  #
    //  ###   ##   ###   #  #   #     #    ###   #  #  ###    ###   ###    ##    #    ##    ###    #     ##   ###    ##    #     ##   ###    ##   #      ###  # #    ##
    // #  #  # ##   #    ####   #     #    #  #  #  #  #  #  #  #  ##     # ##   #     #     #     #    # ##  #  #  # ##  ###   #  #  #  #  # ##  # ##  #  #  ####  # ##
    //  ##   ##     #    #  #   #     #    #  #   # #  #  #  # ##    ##   ##     #     #     #     #    ##    #  #  ##     #    #  #  #     ##    #  #  # ##  #  #  ##
    // #      ##     ##  #  #  ###   ###   ###     #   ###    # #  ###     ##    #    ###     ##  ###    ##   ###    ##    #     ##   #      ##    ###   # #  #  #   ##
    //  ###                                       #
    /**
     * Gets all games in a series before the specified game number.
     * @param {string} title The base title.
     * @param {number} game The game number.
     * @returns {Promise<Challenge[]>} A promise that resolves with an array of earlier challenges in the series.
     */
    static async getAllByBaseTitleBeforeGame(title, game) {
        if (game === 1) {
            return [];
        }

        try {
            const challenges = await Db.getAllByBaseTitleBeforeGame(title, game);

            return Promise.all(challenges.map(async (c) => new Challenge({id: c.id, challengingTeam: await Team.getById(c.challengingTeamId), challengedTeam: await Team.getById(c.challengedTeamId)})));
        } catch (err) {
            throw new Exception("There was a database error getting a team's challenges.", err);
        }
    }

    //              #     ##   ##    ##    ###         ###
    //              #    #  #   #     #    #  #         #
    //  ###   ##   ###   #  #   #     #    ###   #  #   #     ##    ###  # #
    // #  #  # ##   #    ####   #     #    #  #  #  #   #    # ##  #  #  ####
    //  ##   ##     #    #  #   #     #    #  #   # #   #    ##    # ##  #  #
    // #      ##     ##  #  #  ###   ###   ###     #    #     ##    # #  #  #
    //  ###                                       #
    /**
     * Gets all of a team's currently active challenges.
     * @param {Team} team The team to check.
     * @returns {Promise<Challenge[]>} A promise that resolves with an array of the team's currently active challenges.
     */
    static async getAllByTeam(team) {
        try {
            const challenges = await Db.getAllByTeam(team);

            return Promise.all(challenges.map(async (c) => new Challenge({id: c.id, challengingTeam: await Team.getById(c.challengingTeamId), challengedTeam: await Team.getById(c.challengedTeamId)})));
        } catch (err) {
            throw new Exception("There was a database error getting a team's challenges.", err);
        }
    }

    //              #     ##   ##    ##    ###         ###
    //              #    #  #   #     #    #  #         #
    //  ###   ##   ###   #  #   #     #    ###   #  #   #     ##    ###  # #    ###
    // #  #  # ##   #    ####   #     #    #  #  #  #   #    # ##  #  #  ####  ##
    //  ##   ##     #    #  #   #     #    #  #   # #   #    ##    # ##  #  #    ##
    // #      ##     ##  #  #  ###   ###   ###     #    #     ##    # #  #  #  ###
    //  ###                                       #
    /**
     * Gets all of two teams' challenges.
     * @param {Team} team1 The first team to check.
     * @param {Team} team2 The second team to check.
     * @returns {Promise<Challenge[]>} A promise that resolves with an array of the team's challenges.
     */
    static async getAllByTeams(team1, team2) {
        try {
            const challenges = await Db.getAllByTeams(team1, team2);

            return Promise.all(challenges.map(async (c) => new Challenge({id: c.id, challengingTeam: await Team.getById(c.challengingTeamId), challengedTeam: await Team.getById(c.challengedTeamId)})));
        } catch (err) {
            throw new Exception("There was a database error getting the teams' challenges.", err);
        }
    }

    //              #    ###          ##   #                             ##
    //              #    #  #        #  #  #                              #
    //  ###   ##   ###   ###   #  #  #     ###    ###  ###   ###    ##    #
    // #  #  # ##   #    #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #
    //  ##   ##     #    #  #   # #  #  #  #  #  # ##  #  #  #  #  ##     #
    // #      ##     ##  ###     #    ##   #  #   # #  #  #  #  #   ##   ###
    //  ###                     #
    /**
     * Gets a challenge by its channel.
     * @param {DiscordJs.GuildTextBasedChannel} channel The channel.
     * @returns {Promise<Challenge>} The challenge.
     */
    static async getByChannel(channel) {
        if (!channel || !channel.name || !channelParse.test(channel.name)) {
            return void 0;
        }

        const {groups: {challengingTeamTag, challengedTeamTag, id}} = channelParse.exec(channel.name);

        let challengingTeam;
        try {
            challengingTeam = await Team.getByNameOrTag(challengingTeamTag);
        } catch (err) {
            throw new Exception("There was a database error getting the challenging team.", err);
        }

        if (!challengingTeam) {
            return void 0;
        }

        let challengedTeam;
        try {
            challengedTeam = await Team.getByNameOrTag(challengedTeamTag);
        } catch (err) {
            throw new Exception("There was a database error getting the challenged team.", err);
        }

        if (!challengedTeam) {
            return void 0;
        }

        return new Challenge({id: +id, challengingTeam, challengedTeam});
    }

    //              #    ###         ###      #
    //              #    #  #         #       #
    //  ###   ##   ###   ###   #  #   #     ###
    // #  #  # ##   #    #  #  #  #   #    #  #
    //  ##   ##     #    #  #   # #   #    #  #
    // #      ##     ##  ###     #   ###    ###
    //  ###                     #
    /**
     * Gets a challenge by its ID.
     * @param {number} id The challenge ID.
     * @returns {Promise<Challenge>} The challenge.
     */
    static async getById(id) {
        let data;
        try {
            data = await Db.getById(id);
        } catch (err) {
            throw new Exception("There was a database error getting a challenge by ID.", err);
        }

        return data ? new Challenge({id: data.id, challengingTeam: await Team.getById(data.challengingTeamId), challengedTeam: await Team.getById(data.challengedTeamId)}) : void 0;
    }

    //              #    ###         ###
    //              #    #  #         #
    //  ###   ##   ###   ###   #  #   #     ##    ###  # #    ###
    // #  #  # ##   #    #  #  #  #   #    # ##  #  #  ####  ##
    //  ##   ##     #    #  #   # #   #    ##    # ##  #  #    ##
    // #      ##     ##  ###     #    #     ##    # #  #  #  ###
    //  ###                     #
    /**
     * Gets a challenge by teams.
     * @param {Team} team1 The first team.
     * @param {Team} team2 The second team.
     * @param {boolean} [includePostseason] Whether to include postseason matches.
     * @returns {Promise<Challenge>} The challenge.
     */
    static async getByTeams(team1, team2, includePostseason) {
        let data;
        try {
            data = await Db.getByTeams(team1, team2, includePostseason);
        } catch (err) {
            throw new Exception("There was a database error getting a challenge by teams.", err);
        }

        return data ? new Challenge({id: data.id, challengingTeam: await Team.getById(data.challengingTeamId), challengedTeam: await Team.getById(data.challengedTeamId)}) : void 0;
    }

    //              #     ##                     ###                     #  #
    //              #    #  #                     #                      ## #
    //  ###   ##   ###   #      ###  # #    ##    #    #  #  ###    ##   ## #   ###  # #    ##
    // #  #  # ##   #    # ##  #  #  ####  # ##   #    #  #  #  #  # ##  # ##  #  #  ####  # ##
    //  ##   ##     #    #  #  # ##  #  #  ##     #     # #  #  #  ##    # ##  # ##  #  #  ##
    // #      ##     ##   ###   # #  #  #   ##    #      #   ###    ##   #  #   # #  #  #   ##
    //  ###                                             #    #
    /**
     * Gets the full game type name by game type.
     * @param {string} gameType The game type.
     * @returns {string} The game type name.
     */
    static getGameTypeName(gameType) {
        return {"2v2": "Team Anarchy 2v2", "3v3": "Team Anarchy 3v3", "4v4+": "Team Anarchy 4v4+", "TA": "Team Anarchy", "CTF": "Capture the Flag", "MB": "Monsterball"}[gameType];
    }

    //              #     ##                     ###                     ####              #  #
    //              #    #  #                     #                      #                 #  #
    //  ###   ##   ###   #      ###  # #    ##    #    #  #  ###    ##   ###    ##   ###   ####   ##   # #    ##    ###
    // #  #  # ##   #    # ##  #  #  ####  # ##   #    #  #  #  #  # ##  #     #  #  #  #  #  #  #  #  ####  # ##  ##
    //  ##   ##     #    #  #  # ##  #  #  ##     #     # #  #  #  ##    #     #  #  #     #  #  #  #  #  #  ##      ##
    // #      ##     ##   ###   # #  #  #   ##    #      #   ###    ##   #      ##   #     #  #   ##   #  #   ##   ###
    //  ###                                             #    #
    /**
     * Gets the game type for home maps.
     * @param {string} gameType The game type.
     * @param {number} teamSize The team size.
     * @returns {string} A string representing the game type for usage with home maps.
     */
    static getGameTypeForHomes(gameType, teamSize) {
        teamSize = Math.min(teamSize, 4);
        return gameType === "TA" ? `${teamSize}v${teamSize}${teamSize >= 4 ? "+" : ""}` : gameType;
    }

    //       #                             ##
    //       #                              #
    //  ##   ###    ###  ###   ###    ##    #
    // #     #  #  #  #  #  #  #  #  # ##   #
    // #     #  #  # ##  #  #  #  #  ##     #
    //  ##   #  #   # #  #  #  #  #   ##   ###
    /**
     * Gets the challenge channel.
     * @returns {DiscordJs.TextChannel} The challenge channel.
     */
    get channel() {
        return /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(this.channelName)); // eslint-disable-line no-extra-parens
    }

    //       #                             ##    #  #
    //       #                              #    ## #
    //  ##   ###    ###  ###   ###    ##    #    ## #   ###  # #    ##
    // #     #  #  #  #  #  #  #  #  # ##   #    # ##  #  #  ####  # ##
    // #     #  #  # ##  #  #  #  #  ##     #    # ##  # ##  #  #  ##
    //  ##   #  #   # #  #  #  #  #   ##   ###   #  #   # #  #  #   ##
    /**
     * Gets the challenge channel name.
     * @returns {string} The challenge channel name.
     */
    get channelName() {
        return `${this.challengingTeam.tag.toLocaleLowerCase()}-${this.challengedTeam.tag.toLocaleLowerCase()}-${this.id}`;
    }

    //          #     #   ##    #           #     ##   ###   ####
    //          #     #  #  #   #           #    #  #   #    #
    //  ###   ###   ###   #    ###    ###  ###   #      #    ###
    // #  #  #  #  #  #    #    #    #  #   #    #      #    #
    // # ##  #  #  #  #  #  #   #    # ##   #    #  #   #    #
    //  # #   ###   ###   ##     ##   # #    ##   ##    #    #
    /**
     * Adds a stat to the challenge for capture the flag.
     * @param {Team} team The team to add the stat for.
     * @param {PlayerTypes.UserOrGuildMember} pilot The pilot to add the stat for.
     * @param {number} captures The number of flag captures the pilot had.
     * @param {number} pickups The number of flag pickups the pilot had.
     * @param {number} carrierKills The number of flag carrier kills the pilot had.
     * @param {number} returns The number of flag returns the pilot had.
     * @param {number} kills The number of kills the pilot had.
     * @param {number} assists The number of assists the pilot had.
     * @param {number} deaths The number of deaths the pilot had.
     * @returns {Promise} A promise that resolves when the stat has been added.
     */
    async addStatCTF(team, pilot, captures, pickups, carrierKills, returns, kills, assists, deaths) {
        try {
            await Db.addStatCTF(this, team, pilot, captures, pickups, carrierKills, returns, kills, assists, deaths);
        } catch (err) {
            throw new Exception("There was a database error adding a stat to a CTF challenge.", err);
        }

        await this.updatePinnedPost();
    }

    //          #     #   ##    #           #    ###    ##
    //          #     #  #  #   #           #     #    #  #
    //  ###   ###   ###   #    ###    ###  ###    #    #  #
    // #  #  #  #  #  #    #    #    #  #   #     #    ####
    // # ##  #  #  #  #  #  #   #    # ##   #     #    #  #
    //  # #   ###   ###   ##     ##   # #    ##   #    #  #
    /**
     * Adds a stat to the challenge for team anarchy.
     * @param {Team} team The team to add the stat for.
     * @param {PlayerTypes.UserOrGuildMember} pilot The pilot to add the stat for.
     * @param {number} kills The number of kills the pilot had.
     * @param {number} assists The number of assists the pilot had.
     * @param {number} deaths The number of deaths the pilot had.
     * @returns {Promise} A promise that resolves when the stat has been added.
     */
    async addStatTA(team, pilot, kills, assists, deaths) {
        try {
            await Db.addStatTA(this, team, pilot, kills, assists, deaths);
        } catch (err) {
            throw new Exception("There was a database error adding a stat to a TA challenge.", err);
        }

        await this.updatePinnedPost();
    }

    //          #     #   ##    #           #
    //          #     #  #  #   #           #
    //  ###   ###   ###   #    ###    ###  ###    ###
    // #  #  #  #  #  #    #    #    #  #   #    ##
    // # ##  #  #  #  #  #  #   #    # ##   #      ##
    //  # #   ###   ###   ##     ##   # #    ##  ###
    /**
     * Adds stats to the challenge from the tracker.
     * @param {number} gameId The game ID from the tracker.
     * @param {boolean} [requireConfirmation] Whether to require confirmation of the report.
     * @param {number} [timestamp] The timestamp to discard data after.
     * @returns {Promise<ChallengeTypes.GameBoxScore>} A promise that returns data about the game's stats and score.
     */
    async addStats(gameId, requireConfirmation, timestamp) {
        let game;
        try {
            game = (await Tracker.getMatch(gameId)).body;
        } catch (err) {
            throw new Error("That is not a valid game ID.");
        }

        if (!game && !game.settings) {
            throw new Error("That is not a valid game ID.");
        }

        await this.loadDetails();

        if (this.details.gameType === "TA" && game.settings.matchMode !== "TEAM ANARCHY") {
            throw new Error("The specified match on the tracker is not a team anarchy match.");
        }

        if (this.details.gameType === "CTF" && game.settings.matchMode !== "CTF") {
            throw new Error("The specified match on the tracker is not a capture the flag match.");
        }

        let map = await NameMapDb.getAll();

        if (!map) {
            map = {};
        }

        const notFound = [];

        for (const player of game.players) {
            if (!map[player.name]) {
                let found = false;

                // We guess at the name.
                for (const [id, member] of this.channel.members) {
                    if (member.displayName.toUpperCase().indexOf(player.name.toUpperCase()) !== -1 || player.name.toUpperCase().indexOf(member.displayName.toUpperCase()) !== -1) {
                        await NameMapDb.add(player.name, id);

                        map[player.name] = id;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    notFound.push(player.name);
                }
            }
        }

        if (notFound.length > 0) {
            throw new Error(`Please add mappings for the following players: **${notFound.join("**, **")}**`);
        }

        const server = game.settings.server ? game.settings.server.name : void 0;

        if (this.details.server && this.details.server !== server) {
            this.details.server = "Multiple servers";
        } else {
            this.details.server = server;
        }

        this.setServer();

        // Remove events that happened after the timestamp.
        if (timestamp && game.kills) {
            for (const kill of game.kills.filter((k) => k.time >= timestamp)) {
                if (kill.attacker === kill.defender) {
                    if (this.details.gameType === "TA") {
                        game.teamScore[kill.attackerTeam]++;
                    }

                    const player = game.players.find((p) => p.name === kill.attacker && p.team === kill.attackerTeam);
                    if (player) {
                        player.kills++;
                        player.deaths--;
                    }
                } else {
                    if (this.details.gameType === "TA") {
                        game.teamScore[kill.attackerTeam]--;
                    }

                    const killer = game.players.find((p) => p.name === kill.attacker && p.team === kill.attackerTeam),
                        killed = game.players.find((p) => p.name === kill.defender && p.team === kill.defenderTeam),
                        assist = game.players.find((p) => p.name === kill.assisted && p.team === kill.assistedTeam);
                    if (killer) {
                        killer.kills--;
                    }
                    if (killed) {
                        killed.deaths--;
                    }
                    if (assist) {
                        assist.assists--;
                    }
                }
            }
        }

        if (timestamp && game.goals) {
            for (const goal of game.goals.filter((k) => k.time >= timestamp)) {
                const scorer = game.players.find((p) => p.name === goal.scorer && p.team === goal.scorerTeam),
                    assist = game.players.find((p) => p.name === goal.assisted && p.team === goal.scorerTeam);
                if (goal.blunder) {
                    game.teamScore[Object.keys(game.teamScore).find((t) => t !== goal.scorerTeam)]--;

                    if (scorer) {
                        scorer.blunders--;
                    }
                } else {
                    game.teamScore[goal.scorerTeam]--;

                    if (scorer) {
                        scorer.goals--;
                    }
                    if (assist) {
                        assist.goalAssists--;
                    }
                }
            }
        }

        if (timestamp && game.flagStats) {
            for (const stat of game.flagStats.filter((k) => k.time >= timestamp)) {
                const player = game.players.find((p) => p.name === stat.scorer && p.team === stat.scorerTeam);

                if (stat.event === "Capture") {
                    game.teamScore[stat.scorerTeam]--;
                }

                if (player) {
                    switch (stat.event) {
                        case "Capture":
                            player.captures--;
                            break;
                        case "Pickup":
                            player.pickups--;
                            break;
                        case "CarrierKill":
                            player.carrierKills--;
                            break;
                        case "Return":
                            player.returns--;
                    }
                }
            }
        }

        let challengingTeamMembers = 0,
            challengedTeamMembers = 0;

        /** @type {ChallengeTypes.PlayersByTeam} */
        const playerTeam = {};

        for (const player of game.players) {
            const member = Discord.findGuildMemberById(map[player.name]) || await Discord.findUserById(map[player.name]),
                team = ["BLUE", "BLEU", "BLAU", "AZUL"].indexOf(player.team) === -1 ? this.details.orangeTeam : this.details.blueTeam;

            if (team.id === this.challengingTeam.id) {
                challengingTeamMembers++;
            } else if (team.id === this.challengedTeam.id) {
                challengedTeamMembers++;
            } else {
                throw new Error(`It appears that ${player.name} is not on one of the teams in the challenge.  Please manually map their game name to a player.`);
            }

            playerTeam[player.name] = {member, team};
        }

        if (challengingTeamMembers !== this.details.teamSize || challengedTeamMembers !== this.details.teamSize) {
            throw new Error(`Please ensure that both teams fielded ${this.details.teamSize} members.  If they have, please manually map all of the players in this match.`);
        }

        let challengingTeamStats = await this.getStatsForTeam(this.challengingTeam),
            challengedTeamStats = await this.getStatsForTeam(this.challengedTeam);

        // Fix colors for known localized team names.
        game.teamScore.BLUE = game.teamScore.BLUE || game.teamScore.BLEU || game.teamScore.BLAU || game.teamScore.AZUL || game.teamScore.СИНИЙ || 0;
        game.teamScore.ORANGE = game.teamScore.ORANGE || game.teamScore.NARANJA || game.teamScore.АПЕЛЬСИН || 0;

        if (challengingTeamStats.length === 0 && challengedTeamStats.length === 0) {
            // Add all the stats to the database.
            for (const player of game.players) {
                try {
                    switch (this.details.gameType) {
                        case "TA":
                            await Db.addStatTA(this, playerTeam[player.name].team, playerTeam[player.name].member, player.kills, player.assists, player.deaths);
                            break;
                        case "CTF":
                            await Db.addStatCTF(this, playerTeam[player.name].team, playerTeam[player.name].member, player.captures, player.pickups, player.carrierKills, player.returns, player.kills, player.assists, player.deaths);
                            break;
                    }
                } catch (err) {
                    throw new Exception("There was a database error adding a stat to a challenge.", err);
                }
            }

            // If the score is different from the reported score, reset the score.
            let scoreChanged = false;

            if (this.details.challengingTeamScore !== (this.details.blueTeam.id === this.challengingTeam.id ? game.teamScore.BLUE : game.teamScore.ORANGE) || this.details.challengedTeamScore !== (this.details.blueTeam.id === this.challengedTeam.id ? game.teamScore.BLUE : game.teamScore.ORANGE)) {
                scoreChanged = true;

                this.details.challengingTeamScore = this.details.blueTeam.id === this.challengingTeam.id ? game.teamScore.BLUE : game.teamScore.ORANGE;
                this.details.challengedTeamScore = this.details.blueTeam.id === this.challengedTeam.id ? game.teamScore.BLUE : game.teamScore.ORANGE;

                let dateConfirmed;
                try {
                    dateConfirmed = await Db.setScore(this, this.details.challengingTeamScore, this.details.challengedTeamScore, !!requireConfirmation);
                } catch (err) {
                    throw new Exception("There was a database error setting the score for a challenge.", err);
                }

                this.details.dateConfirmed = dateConfirmed;
            }

            // Add damage stats.
            await Db.setDamage(this, game.damage.filter((stat) => playerTeam[stat.attacker] && playerTeam[stat.defender]).map((stat) => {
                stat.attacker = stat.attacker || stat.defender;

                return {
                    team: playerTeam[stat.attacker].team,
                    discordId: map[stat.attacker],
                    opponentTeam: playerTeam[stat.defender].team,
                    opponentDiscordId: map[stat.defender],
                    weapon: stat.weapon,
                    damage: stat.damage
                };
            }));

            // Get the new stats and return them.
            challengingTeamStats = await this.getStatsForTeam(this.challengingTeam);
            challengedTeamStats = await this.getStatsForTeam(this.challengedTeam);

            // Set game time if it's earlier than the specified time.
            const matchTime = new Date(Math.floor(new Date(game.start).getTime() / 300000 + 0.5) * 300000);
            let timeChanged = false;

            if (matchTime < this.details.matchTime) {
                try {
                    await Db.setTime(this, matchTime);
                } catch (err) {
                    throw new Exception("There was a database error setting the time for a challenge while adding stats.", err);
                }

                this.details.matchTime = matchTime;
                timeChanged = true;
            }

            await this.updatePinnedPost(timeChanged);

            return {challengingTeamStats, challengedTeamStats, scoreChanged, timeChanged};
        }

        // Check that all the players exist.
        for (const player of game.players) {
            if (!challengingTeamStats.find((s) => s.pilot.id === map[player.name]) && !challengedTeamStats.find((s) => s.pilot.id === map[player.name])) {
                throw new Error(`${player.name} does not appear to have played in this match previously.  Please check that the pilots from all games are the same between every game.`);
            }
        }

        // Add new stats to existing stats.
        for (const player of game.players) {
            try {
                await Db.removeStat(this, playerTeam[player.name].member);
            } catch (err) {
                throw new Exception("There was a database error removing a stat from a challenge.", err);
            }

            const playerStats = (playerTeam[player.name].team === this.challengingTeam ? challengingTeamStats : challengedTeamStats).find((s) => s.pilot.id === map[player.name]);

            try {
                switch (this.details.gameType) {
                    case "TA":
                        await Db.addStatTA(this, playerTeam[player.name].team, playerTeam[player.name].member, player.kills + playerStats.kills, player.assists + playerStats.assists, player.deaths + playerStats.deaths);
                        break;
                    case "CTF":
                        await Db.addStatCTF(this, playerTeam[player.name].team, playerTeam[player.name].member, player.captures + playerStats.captures, player.pickups + playerStats.pickups, player.carrierKills + playerStats.carrierKills, player.returns + playerStats.returns, player.kills + playerStats.kills, player.assists + playerStats.assists, player.deaths + playerStats.deaths);
                        break;
                }
            } catch (err) {
                throw new Exception("There was a database error adding a stat to a challenge.", err);
            }
        }

        // Add new score to existing score.
        this.details.challengingTeamScore = (this.details.blueTeam.id === this.challengingTeam.id ? game.teamScore.BLUE : game.teamScore.ORANGE) + this.details.challengingTeamScore;
        this.details.challengedTeamScore = (this.details.blueTeam.id === this.challengedTeam.id ? game.teamScore.BLUE : game.teamScore.ORANGE) + this.details.challengedTeamScore;

        let dateConfirmed;
        try {
            dateConfirmed = await Db.setScore(this, this.details.challengingTeamScore, this.details.challengedTeamScore, !!requireConfirmation);
        } catch (err) {
            throw new Exception("There was a database error setting the score for a challenge.", err);
        }

        this.details.dateConfirmed = dateConfirmed;

        // Get damage stats and add to them.
        const damageStats = await Db.getDamage(this);

        damageStats.forEach((stat) => {
            const damage = game.damage.find((d) => map[d.attacker] === stat.discordId && map[d.defender] === stat.opponentDiscordId && d.weapon === stat.weapon);

            if (damage) {
                damage.damage += stat.damage;
            } else {
                game.damage.push({
                    attacker: Object.keys(map).find((k) => map[k] === stat.discordId && game.players.find((p) => p.name === k)),
                    defender: Object.keys(map).find((k) => map[k] === stat.opponentDiscordId && game.players.find((p) => p.name === k)),
                    weapon: stat.weapon,
                    damage: stat.damage
                });
            }
        });

        await Db.setDamage(this, game.damage.filter((stat) => playerTeam[stat.attacker] && playerTeam[stat.defender]).map((stat) => ({
            team: playerTeam[stat.attacker].team,
            discordId: map[stat.attacker],
            opponentTeam: playerTeam[stat.defender].team,
            opponentDiscordId: map[stat.defender],
            weapon: stat.weapon,
            damage: stat.damage
        })));


        // Get the new stats and return them.
        challengingTeamStats = await this.getStatsForTeam(this.challengingTeam);
        challengedTeamStats = await this.getStatsForTeam(this.challengedTeam);

        // Set game time if it's earlier than the specified time.
        const matchTime = new Date(Math.floor(new Date(game.start).getTime() / 300000 + 0.5) * 300000);
        let timeChanged = false;

        if (matchTime < this.details.matchTime) {
            try {
                await Db.setTime(this, matchTime);
            } catch (err) {
                throw new Exception("There was a database error setting the time for a challenge while adding stats.", err);
            }

            this.details.matchTime = matchTime;
            timeChanged = true;
        }

        await this.updatePinnedPost(timeChanged);

        return {challengingTeamStats, challengedTeamStats, scoreChanged: true, timeChanged};
    }

    //          #     #   ##    #
    //          #     #  #  #   #
    //  ###   ###   ###   #    ###   ###    ##    ###  # #    ##   ###
    // #  #  #  #  #  #    #    #    #  #  # ##  #  #  ####  # ##  #  #
    // # ##  #  #  #  #  #  #   #    #     ##    # ##  #  #  ##    #
    //  # #   ###   ###   ##     ##  #      ##    # #  #  #   ##   #
    /**
     * Indicates that a pilot will be streaming the challenge.
     * @param {DiscordJs.GuildMember} member The pilot streaming the challenge.
     * @returns {Promise} A promise that resolves when the pilot has been updated to be streaming the challenge.
     */
    async addStreamer(member) {
        try {
            await Db.addStreamer(this, member);
        } catch (err) {
            throw new Exception("There was a database error adding a pilot as a streamer for a challenge.", err);
        }

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error adding a pilot as a streamer for a challenge.  Please resolve this manually as soon as possible.", err);
        }
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
     * @param {string} decision The decision.
     * @param {Team[]} teams The teams being adjudicated, if any.
     * @returns {Promise<ChallengeTypes.TeamPenaltyData[]>} A promise that resolves when the match has been adjudicated.
     */
    async adjudicate(decision, teams) {
        if (!this.details) {
            await this.loadDetails();
        }

        let penalizedTeams;
        switch (decision) {
            case "cancel":
                try {
                    await Db.void(this);
                } catch (err) {
                    throw new Exception("There was a database error voiding a challenge.", err);
                }

                this.details.dateVoided = new Date();

                this.setNotifyClockExpired();
                this.setNotifyMatchMissed();
                this.setNotifyMatchStarting();

                break;
            case "extend":
            {
                let deadline;
                try {
                    deadline = await Db.extend(this);
                } catch (err) {
                    throw new Exception("There was a database error extending a challenge.", err);
                }

                this.details.dateClockDeadline = deadline;
                this.details.dateClockDeadlineNotified = void 0;
                this.details.matchTime = void 0;

                this.setNotifyClockExpired(deadline);
                this.setNotifyMatchMissed();
                this.setNotifyMatchStarting();

                try {
                    await this.updatePinnedPost();
                } catch (err) {
                    throw new Exception("There was a critical Discord error extending a challenge.  Please resolve this manually as soon as possible.", err);
                }

                break;
            }
            case "penalize":
            {
                try {
                    penalizedTeams = await Db.voidWithPenalties(this, teams);
                } catch (err) {
                    throw new Exception("There was a database error penalizing a challenge.", err);
                }

                this.setNotifyClockExpired();
                this.setNotifyMatchMissed();
                this.setNotifyMatchStarting();

                break;
            }
        }

        await this.updatePinnedPost();

        return penalizedTeams;
    }

    //       ##                       ##    #           #
    //        #                      #  #   #           #
    //  ##    #     ##    ###  ###    #    ###    ###  ###    ###
    // #      #    # ##  #  #  #  #    #    #    #  #   #    ##
    // #      #    ##    # ##  #     #  #   #    # ##   #      ##
    //  ##   ###    ##    # #  #      ##     ##   # #    ##  ###
    /**
     * Clears all stats from a challenge.
     * @returns {Promise} A promise that returns when the stats have been cleared.
     */
    async clearStats() {
        try {
            await Db.clearStats(this);
        } catch (err) {
            throw new Exception("There was a database error clearing the stats for a challenge.", err);
        }
    }

    //       ##                      ###    #
    //        #                       #
    //  ##    #     ##    ###  ###    #    ##    # #    ##
    // #      #    # ##  #  #  #  #   #     #    ####  # ##
    // #      #    ##    # ##  #      #     #    #  #  ##
    //  ##   ###    ##    # #  #      #    ###   #  #   ##
    /**
     * Clears the time of the match.
     * @returns {Promise} A promise that resolves when the time has been cleared.
     */
    async clearTime() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setTime(this);
        } catch (err) {
            throw new Exception("There was a database error setting the time for a challenge.", err);
        }

        this.details.matchTime = void 0;

        this.setNotifyMatchMissed();
        this.setNotifyMatchStarting();

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting the time for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //       ##                #
    //        #                #
    //  ##    #     ##    ##   # #
    // #      #    #  #  #     ##
    // #      #    #  #  #     # #
    //  ##   ###    ##    ##   #  #
    /**
     * Puts a challenge on the clock.
     * @param {Team} team The team putting the challenge on the clock.
     * @returns {Promise} A promise that resolves when the challenge is put on the clock.
     */
    async clock(team) {
        if (!this.details) {
            await this.loadDetails();
        }

        let dates;
        try {
            dates = await Db.clock(team, this);
        } catch (err) {
            throw new Exception("There was a database error clocking a challenge.", err);
        }

        this.details.clockTeam = team;
        this.details.dateClocked = dates.clocked;
        this.details.dateClockDeadline = dates.clockDeadline;

        this.setNotifyClockExpired(dates.clockDeadline);

        try {
            await Discord.queue(`**${team.name}** has put ${this.channel} on the clock.  The clock deadline is <t:${Math.floor(this.details.dateClockDeadline.getTime() / 1000)}:F>.`, this.channel);

            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error clocking a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //       ##
    //        #
    //  ##    #     ##    ###    ##
    // #      #    #  #  ##     # ##
    // #      #    #  #    ##   ##
    //  ##   ###    ##   ###     ##
    /**
     * Closes a challenge.
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @param {ChallengeTypes.GamePlayerStatsByTeam} stats The stats for the game.
     * @returns {Promise} A promise that resolves when the challenge is closed.
     */
    async close(member, stats) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.close(this);
        } catch (err) {
            throw new Exception("There was a database error closing a challenge.", err);
        }

        try {
            delete lastCommand[this.channelName];

            await this.channel.delete(`${member} closed the challenge.`);

            if (this.details.dateConfirmed && !this.details.dateVoided) {
                await Discord.richQueue(Discord.embedBuilder({
                    title: `${this.challengingTeam.name} ${this.details.challengingTeamScore}, ${this.challengedTeam.name} ${this.details.challengedTeamScore}${this.details.overtimePeriods > 0 ? ` ${this.details.overtimePeriods > 1 ? this.details.overtimePeriods : ""}OT` : ""}`,
                    description: `Played <t:${Math.floor(this.details.matchTime.getTime() / 1000)}:F>\n${Challenge.getGameTypeName(this.details.gameType)} in ${this.details.map}`,
                    color: this.details.challengingTeamScore > this.details.challengedTeamScore ? this.challengingTeam.role.color : this.details.challengedTeamScore > this.details.challengingTeamScore ? this.challengedTeam.role.color : void 0,
                    fields: stats.challengingTeamStats.length > 0 && stats.challengedTeamStats.length > 0 ? [
                        {
                            name: `${this.challengingTeam.name} Stats`,
                            value: this.details.gameType === "TA" ? `${stats.challengingTeamStats.sort((a, b) => {
                                if ((a.kills + a.assists) / Math.max(a.deaths, 1) !== (b.kills + b.assists) / Math.max(b.deaths, 1)) {
                                    return (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1);
                                }
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
                            }).map((stat) => `${stat.pilot}: ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)`).join("\n")}` : `${stats.challengingTeamStats.sort((a, b) => {
                                if (a.captures !== b.captures) {
                                    return b.captures - a.captures;
                                }
                                if ((a.kills + a.assists) / Math.max(a.deaths, 1) !== (b.kills + b.assists) / Math.max(b.deaths, 1)) {
                                    return (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1);
                                }
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
                            }).map((stat) => `${stat.pilot}: ${stat.captures} C/${stat.pickups} P, ${stat.carrierKills} CK, ${stat.returns} R, ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)`).join("\n")}`
                        }, {
                            name: `${this.challengedTeam.name} Stats`,
                            value: this.details.gameType === "TA" ? `${stats.challengedTeamStats.sort((a, b) => {
                                if ((a.kills + a.assists) / Math.max(a.deaths, 1) !== (b.kills + b.assists) / Math.max(b.deaths, 1)) {
                                    return (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1);
                                }
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
                            }).map((stat) => `${stat.pilot}: ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)`).join("\n")}` : `${stats.challengedTeamStats.sort((a, b) => {
                                if (a.captures !== b.captures) {
                                    return b.captures - a.captures;
                                }
                                if ((a.kills + a.assists) / Math.max(a.deaths, 1) !== (b.kills + b.assists) / Math.max(b.deaths, 1)) {
                                    return (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1);
                                }
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
                            }).map((stat) => `${stat.pilot}: ${stat.captures} C/${stat.pickups} P, ${stat.carrierKills} CK, ${stat.returns} R, ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)`).join("\n")}`
                        }, {
                            name: "For match details, visit:",
                            value: `https://otl.gg/match/${this.id}/${this.challengingTeam.tag}/${this.challengedTeam.tag}`
                        }
                    ] : [
                        {
                            name: "For match details, visit:",
                            value: `https://otl.gg/match/${this.id}/${this.challengingTeam.tag}/${this.challengedTeam.tag}`
                        }
                    ]
                }), Discord.matchResultsChannel);

                if (this.details.caster) {
                    await Discord.queue(`Thanks for casting the <t:${Math.floor(this.details.matchTime.getTime() / 1000)}:D> match between ${this.challengingTeam.name} and ${this.challengedTeam.name}!  The final score was ${this.challengingTeam.tag} ${this.details.challengingTeamScore} to ${this.challengedTeam.tag} ${this.details.challengedTeamScore}.  Use the command \`/vod ${this.id} <url>\` to add the VoD.`, this.details.caster);
                }
            }

            if (!this.challengingTeam.disbanded) {
                await this.challengingTeam.updateChannels();
            }

            if (!this.challengedTeam.disbanded) {
                await this.challengedTeam.updateChannels();
            }
        } catch (err) {
            throw new Exception("There was a critical Discord error closing a challenge.  Please resolve this manually as soon as possible.", err);
        }

        await Team.updateRatingsForSeasonFromChallenge(this);
    }

    //                     #    #                #  #         #          #
    //                    # #                    ####         #          #
    //  ##    ##   ###    #    ##    ###   # #   ####   ###  ###    ##   ###
    // #     #  #  #  #  ###    #    #  #  ####  #  #  #  #   #    #     #  #
    // #     #  #  #  #   #     #    #     #  #  #  #  # ##   #    #     #  #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   # #    ##   ##   #  #
    /**
     * Confirms a reported match.
     * @returns {Promise} A promise that resolves when the match is confirmed.
     */
    async confirmMatch() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            this.details.dateConfirmed = await Db.setConfirmed(this);
        } catch (err) {
            throw new Exception("There was a database error confirming a reported match.", err);
        }

        this.setNotifyClockExpired();
        this.setNotifyMatchMissed();
        this.setNotifyMatchStarting();

        try {
            await Discord.queue(`The match at ${this.channel} has been confirmed with the final score **${this.challengingTeam.name}** ${this.details.challengingTeamScore} to **${this.challengedTeam.name}** ${this.details.challengedTeamScore}.  Please add stats and close the channel.`, Discord.alertsChannel);

            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error confirming a reported match.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                          #          ###                      #          #
    //                          #          #  #                     #          #
    //  ##   ###    ##    ###  ###    ##   #  #   ##   # #    ###  ###    ##   ###
    // #     #  #  # ##  #  #   #    # ##  ###   # ##  ####  #  #   #    #     #  #
    // #     #     ##    # ##   #    ##    # #   ##    #  #  # ##   #    #     #  #
    //  ##   #      ##    # #    ##   ##   #  #   ##   #  #   # #    ##   ##   #  #
    /**
     * Creates a rematch.
     * @param {Team} team The team responding to the rematch.
     * @returns {Promise<Challenge>} A promise that returns the new challenge.
     */
    async createRematch(team) {
        try {
            await Db.setRematched(this);
        } catch (err) {
            throw new Exception("There was a database error marking a challenge as rematched.", err);
        }

        const challenge = await Challenge.create(
            team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam,
            team,
            {
                gameType: this.details.gameType,
                adminCreated: false,
                teamSize: this.details.teamSize,
                startNow: true,
                blueTeam: this.details.blueTeam
            }
        );

        challenge.setNotifyMatchMissed(new Date(new Date().getTime() + 3600000));
        challenge.setNotifyMatchStarting(new Date(new Date().getTime() + 5000));

        return challenge;
    }

    //              #     ##          #    #                  #                   #  ###   ##
    //              #    #  #         #    #                                      #  #  #   #
    //  ###   ##   ###   #  #  #  #  ###   ###    ##   ###   ##    ####   ##    ###  #  #   #     ###  #  #   ##   ###    ###
    // #  #  # ##   #    ####  #  #   #    #  #  #  #  #  #   #      #   # ##  #  #  ###    #    #  #  #  #  # ##  #  #  ##
    //  ##   ##     #    #  #  #  #   #    #  #  #  #  #      #     #    ##    #  #  #      #    # ##   # #  ##    #       ##
    // #      ##     ##  #  #   ###    ##  #  #   ##   #     ###   ####   ##    ###  #     ###    # #    #    ##   #     ###
    //  ###                                                                                             #
    /**
     * Gets the list of authorized players.
     * @returns {Promise<ChallengeTypes.AuthorizedPlayers>} A promise that returns the authorized players.
     */
    async getAuthorizedPlayers() {
        try {
            return await Db.getAuthorizedPlayers(this);
        } catch (err) {
            throw new Exception("There was a database error loading authorized players.", err);
        }
    }

    //              #     ##                 #    ###          #
    //              #    #  #                #    #  #         #
    //  ###   ##   ###   #      ###   ###   ###   #  #   ###  ###    ###
    // #  #  # ##   #    #     #  #  ##      #    #  #  #  #   #    #  #
    //  ##   ##     #    #  #  # ##    ##    #    #  #  # ##   #    # ##
    // #      ##     ##   ##    # #  ###      ##  ###    # #    ##   # #
    //  ###
    /**
     * Gets the challenge data for the cast page.
     * @returns {Promise<ChallengeTypes.CastData>} A promise that resolves with the challenge data.
     */
    async getCastData() {
        try {
            return await Db.getCastData(this);
        } catch (err) {
            throw new Exception("There was a database error loading cast data.", err);
        }
    }

    //              #    #  #                    #  #
    //              #    #  #                    ####
    //  ###   ##   ###   ####   ##   # #    ##   ####   ###  ###    ###
    // #  #  # ##   #    #  #  #  #  ####  # ##  #  #  #  #  #  #  ##
    //  ##   ##     #    #  #  #  #  #  #  ##    #  #  # ##  #  #    ##
    // #      ##     ##  #  #   ##   #  #   ##   #  #   # #  ###   ###
    //  ###                                                  #
    /**
     * Gets the home maps for the challenge.
     * @param {string} gameType The game type to get the home maps for.
     * @returns {Promise<string[]>} A promise that resolves with the home maps.
     */
    async getHomeMaps(gameType) {
        let maps;
        try {
            maps = await Db.getHomeMaps(gameType, this);
        } catch (err) {
            throw new Exception("There was a database error getting home maps for a challenge.", err);
        }

        return maps;
    }

    //              #    ###                  #              #  #
    //              #    #  #                 #              ####
    //  ###   ##   ###   #  #   ###  ###    ###   ##   # #   ####   ###  ###
    // #  #  # ##   #    ###   #  #  #  #  #  #  #  #  ####  #  #  #  #  #  #
    //  ##   ##     #    # #   # ##  #  #  #  #  #  #  #  #  #  #  # ##  #  #
    // #      ##     ##  #  #   # #  #  #   ###   ##   #  #  #  #   # #  ###
    //  ###                                                              #
    /**
     * Gets a random map for the challenge.
     * @param {string} direction The direction, "top" or "bottom".
     * @param {number} count The number of maps to use from the pool.
     * @returns {Promise<string>} A promise that resolves with a random map.
     */
    async getRandomMap(direction, count) {
        await this.loadDetails();

        let map;
        try {
            map = await Db.getRandomMap(this, direction, count);
        } catch (err) {
            throw new Exception("There was a database error getting a random map.", err);
        }

        return map;
    }

    //              #     ##    #           #           ####              ###
    //              #    #  #   #           #           #                  #
    //  ###   ##   ###    #    ###    ###  ###    ###   ###    ##   ###    #     ##    ###  # #
    // #  #  # ##   #      #    #    #  #   #    ##     #     #  #  #  #   #    # ##  #  #  ####
    //  ##   ##     #    #  #   #    # ##   #      ##   #     #  #  #      #    ##    # ##  #  #
    // #      ##     ##   ##     ##   # #    ##  ###    #      ##   #      #     ##    # #  #  #
    //  ###
    /**
     * Gets the stats from a challenge for a team.
     * @param {Team} team The team to get stats for.
     * @return {Promise<ChallengeTypes.GamePlayerStats[]>} A promise that resolves with an array of pilot stats for a team.
     */
    async getStatsForTeam(team) {
        try {
            return Promise.all((await Db.getStatsForTeam(this, team)).map(async (s) => ({pilot: Discord.findGuildMemberById(s.discordId) || await Discord.findUserById(s.discordId), name: s.name, kills: s.kills, assists: s.assists, deaths: s.deaths, damage: s.damage, captures: s.captures, pickups: s.pickups, carrierKills: s.carrierKills, returns: s.returns})));
        } catch (err) {
            throw new Exception("There was a database error loading team stats for a challenge.", err);
        }
    }

    //              #    ###                     ###          #           #    ##
    //              #     #                      #  #         #                 #
    //  ###   ##   ###    #     ##    ###  # #   #  #   ##   ###    ###  ##     #     ###
    // #  #  # ##   #     #    # ##  #  #  ####  #  #  # ##   #    #  #   #     #    ##
    //  ##   ##     #     #    ##    # ##  #  #  #  #  ##     #    # ##   #     #      ##
    // #      ##     ##   #     ##    # #  #  #  ###    ##     ##   # #  ###   ###   ###
    //  ###
    /**
     * Gets the team details for a challenge.
     * @return {Promise<ChallengeTypes.TeamDetailsData>} A promise that resolves with the team details for the challenge.
     */
    async getTeamDetails() {
        let details;
        try {
            details = await Db.getTeamDetails(this);
        } catch (err) {
            throw new Exception("There was a database error getting team details for a challenge.", err);
        }

        details.stats.forEach((stat) => {
            stat.name = Common.normalizeName(stat.name, details.teams.find((team) => team.teamId === stat.teamId).tag);
        });

        details.damage.forEach((damage) => {
            damage.name = Common.normalizeName(damage.name, details.teams.find((team) => team.teamId === damage.teamId).tag);
            damage.opponentName = Common.normalizeName(damage.opponentName, details.teams.find((team) => team.teamId === damage.opponentTeamId).tag);
        });

        return details;
    }

    // ##                   #  ###          #           #    ##
    //  #                   #  #  #         #                 #
    //  #     ##    ###   ###  #  #   ##   ###    ###  ##     #     ###
    //  #    #  #  #  #  #  #  #  #  # ##   #    #  #   #     #    ##
    //  #    #  #  # ##  #  #  #  #  ##     #    # ##   #     #      ##
    // ###    ##    # #   ###  ###    ##     ##   # #  ###   ###   ###
    /**
     * Loads the details for the challenge.
     * @returns {Promise} A promise that resolves when the details are loaded.
     */
    async loadDetails() {
        let details;
        try {
            details = await Db.getDetails(this);
        } catch (err) {
            throw new Exception("There was a database error loading details for a challenge.", err);
        }

        this.details = {
            title: details.title,
            orangeTeam: details.orangeTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            blueTeam: details.blueTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            map: details.map,
            teamSize: details.teamSize,
            matchTime: details.matchTime,
            postseason: details.postseason,
            homeMapTeam: details.homeMapTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            adminCreated: details.adminCreated,
            usingHomeMapTeam: details.usingHomeMapTeam,
            challengingTeamPenalized: details.challengingTeamPenalized,
            challengedTeamPenalized: details.challengedTeamPenalized,
            reportingTeam: details.reportingTeamId ? details.reportingTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam : void 0,
            challengingTeamScore: details.challengingTeamScore,
            challengedTeamScore: details.challengedTeamScore,
            caster: Discord.findGuildMemberById(details.casterDiscordId),
            dateAdded: details.dateAdded,
            dateClocked: details.dateClocked,
            clockTeam: details.clockTeamId ? details.clockTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam : void 0,
            dateClockDeadline: details.dateClockDeadline,
            dateClockDeadlineNotified: details.dateClockDeadlineNotified,
            dateReported: details.dateReported,
            dateConfirmed: details.dateConfirmed,
            dateClosed: details.dateClosed,
            rematchTeam: details.rematchTeamId ? details.rematchTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam : void 0,
            dateRematched: details.dateRematched,
            dateVoided: details.dateVoided,
            overtimePeriods: details.overtimePeriods,
            homeMaps: details.homeMaps,
            vod: details.vod,
            ratingChange: details.ratingChange,
            challengingTeamRating: details.challengingTeamRating,
            challengedTeamRating: details.challengedTeamRating,
            gameType: details.gameType,
            discordEvent: details.discordEventId ? await Discord.findEventById(details.discordEventId) : void 0,
            googleEvent: details.googleEventId && settings.google.enabled ? await Calendar.get(details.googleEventId) : void 0,
            server: details.server,
            restricted: details.restricted
        };
    }

    // ##                #
    //  #                #
    //  #     ##    ##   # #9
    //  #    #  #  #     ##
    //  #    #  #  #     # #
    // ###    ##    ##   #  #
    /**
     * Locks a challenge.
     * @returns {Promise} A promise that resolves when the challenge is locked.
     */
    async lock() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setLock(this, true);
        } catch (err) {
            throw new Exception("There was a database error locking a challenge.", err);
        }

        this.details.adminCreated = true;

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error locking a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //              #     #      #
    //              #           # #
    // ###    ##   ###   ##     #    #  #
    // #  #  #  #   #     #    ###   #  #
    // #  #  #  #   #     #     #     # #
    // #  #   ##     ##  ###    #      #
    //                                #
    /**
     * Handle challenge notifications.
     * @returns {Promise} A promise that resolves when notifications have been handled.
     */
    static async notify() {
        let notifications;
        try {
            notifications = await Db.getNotifications();
        } catch (err) {
            Log.exception("There was an error getting challenge notifications.", err);
            return;
        }

        try {
            for (const challengeData of notifications.expiredClocks) {
                clockExpiredJobs[challengeData.challengeId] = schedule.scheduleJob(new Date(Math.max(challengeData.dateClockDeadline.getTime(), new Date().getTime() + 5000)), Challenge.notifyClockExpired.bind(null, challengeData.challengeId));
            }

            for (const challengeData of notifications.startingMatches) {
                upcomingMatchJobs[challengeData.challengeId] = schedule.scheduleJob(new Date(Math.max(challengeData.matchTime.getTime() - 1800000, new Date().getTime() + 5000)), Challenge.notifyMatchStarting.bind(null, challengeData.challengeId));
            }

            for (const challengeData of notifications.missedMatches) {
                missedMatchJobs[challengeData.challengeId] = schedule.scheduleJob(new Date(Math.max(challengeData.matchTime.getTime() + 3600000, new Date().getTime() + 5000)), Challenge.notifyMatchMissed.bind(null, challengeData.challengeId));
            }
        } catch (err) {
            Log.exception("There was an error issuing challenge notifications.", err);
        }
    }

    //              #     #      #          ##   ##                #     ####               #                   #
    //              #           # #        #  #   #                #     #                                      #
    // ###    ##   ###   ##     #    #  #  #      #     ##    ##   # #   ###   #  #  ###   ##    ###    ##    ###
    // #  #  #  #   #     #    ###   #  #  #      #    #  #  #     ##    #      ##   #  #   #    #  #  # ##  #  #
    // #  #  #  #   #     #     #     # #  #  #   #    #  #  #     # #   #      ##   #  #   #    #     ##    #  #
    // #  #   ##     ##  ###    #      #    ##   ###    ##    ##   #  #  ####  #  #  ###   ###   #      ##    ###
    //                                #                                                     #
    /**
     * Notifies an admin that the challenge's clock has expired.
     * @param {number} challengeId The challenge ID to notify an expired clock for.
     * @returns {Promise} A promise that resolves when the notification has been sent.
     */
    static async notifyClockExpired(challengeId) {
        let challenge;
        try {
            challenge = await Challenge.getById(challengeId);
        } catch (err) {
            throw new Exception("There was an error notifying that a challenge clock expired.", err);
        }

        try {
            await Db.setNotifyClockExpired(challenge);
        } catch (err) {
            throw new Exception("There was a database error notifying a clock expired for a challenge.", err);
        }

        try {
            await Discord.queue(`The clock deadline has been passed in ${challenge.channel}.`, Discord.alertsChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error notifying a clock expired for a challenge.  Please resolve this manually as soon as possible.", err);
        }

        challenge.setNotifyClockExpired();
    }

    //              #     #      #         #  #         #          #     #  #   #                           #
    //              #           # #        ####         #          #     ####                               #
    // ###    ##   ###   ##     #    #  #  ####   ###  ###    ##   ###   ####  ##     ###    ###    ##    ###
    // #  #  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #  #  #   #    ##     ##     # ##  #  #
    // #  #  #  #   #     #     #     # #  #  #  # ##   #    #     #  #  #  #   #      ##     ##   ##    #  #
    // #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #  #  #  ###   ###    ###     ##    ###
    //                                #
    /**
     * Notifies an admin that the challenge's match time was missed.
     * @param {number} challengeId The challenge ID to notify a match missed for.
     * @returns {Promise} A promise that resolves when the notification has been sent.
     */
    static async notifyMatchMissed(challengeId) {
        let challenge;
        try {
            challenge = await Challenge.getById(challengeId);
        } catch (err) {
            throw new Exception("There was an error notifying that a challenge match was missed.", err);
        }

        try {
            await Db.setNotifyMatchMissed(challenge);
        } catch (err) {
            throw new Exception("There was a database error notifying a match was missed for a challenge.", err);
        }

        try {
            await Discord.queue(`The match time was missed in ${challenge.channel}.`, Discord.alertsChannel);
        } catch (err) {
            throw new Exception("There was a critical Discord error notifying a match was missed for a challenge.  Please resolve this manually as soon as possible.", err);
        }

        challenge.setNotifyMatchMissed();
    }

    //              #     #      #         #  #         #          #      ##    #                 #     #
    //              #           # #        ####         #          #     #  #   #                 #
    // ###    ##   ###   ##     #    #  #  ####   ###  ###    ##   ###    #    ###    ###  ###   ###   ##    ###    ###
    // #  #  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #    #    #    #  #  #  #   #     #    #  #  #  #
    // #  #  #  #   #     #     #     # #  #  #  # ##   #    #     #  #  #  #   #    # ##  #      #     #    #  #   ##
    // #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #   ##     ##   # #  #       ##  ###   #  #  #
    //                                #                                                                             ###
    /**
     * Notifies the challenge channel that the match is about to start.
     * @param {number} challengeId The challenge ID to notify a match starting for.
     * @returns {Promise} A promise that resolves when the notification has been sent.
     */
    static async notifyMatchStarting(challengeId) {
        let challenge;
        try {
            challenge = await Challenge.getById(challengeId);
        } catch (err) {
            throw new Exception("There was an error notifying that a challenge match is about to start.", err);
        }

        try {
            await Db.setNotifyMatchStarting(challenge);
        } catch (err) {
            throw new Exception("There was a database error notifying a match starting for a challenge.", err);
        }

        if (!challenge.channel) {
            return;
        }

        await challenge.loadDetails();

        for (const member of challenge.channel.members) {
            const activity = member[1].presence ? member[1].presence.activities.find((p) => p.name === "Twitch") : void 0;

            if (activity && urlParse.test(activity.url)) {
                const {groups: {user}} = urlParse.exec(activity.url);

                await member[1].addTwitchName(user);

                if (activity.state.toLowerCase() === "overload") {
                    const team = await member[1].getTeam();
                    if (team && (team.id === challenge.challengingTeam.id || team.id === challenge.challengedTeam.id)) {
                        await member[1].setStreamer();
                    }
                }
            }
        }

        try {
            const msg = Discord.embedBuilder({
                fields: []
            });
            if (Math.round((challenge.details.matchTime.getTime() - new Date().getTime()) / 300000) > 0) {
                msg.setTitle(`Polish your gunships, this match begins in ${Math.round((challenge.details.matchTime.getTime() - new Date().getTime()) / 300000) * 5} minutes!`);
            } else {
                msg.setTitle("Polish your gunships, this match begins NOW!");
            }

            if (!challenge.details.map) {
                msg.addFields({
                    name: "Please select your map!",
                    value: `**${challenge.challengingTeam.id === challenge.details.homeMapTeam.id ? challenge.challengedTeam.tag : challenge.challengingTeam.tag}** must still select from the home maps for this match.  Please check the pinned post in this channel to see what your options are.`
                });
            }

            if (!challenge.details.teamSize) {
                msg.addFields({
                    name: "Please select the team size!",
                    value: "Both teams must agree on the team size the match should be played at.  This must be done before reporting the match.  Use `/suggestteamsize (2|3|4|5|6|7|8)` to suggest the team size, and your opponent can use `/confirmteamsize` to confirm the suggestion, or suggest their own."
                });
            }

            msg.addFields({
                name: "Are you streaming this match on Twitch?",
                value: "Don't forget to use the `/streaming` command to indicate that you are streaming to Twitch!  This will allow others to watch or cast this match on the website."
            });

            await Discord.richQueue(msg, challenge.channel);
        } catch (err) {
            throw new Exception("There was a critical Discord error notifying a match starting for a challenge.  Please resolve this manually as soon as possible.", err);
        }

        challenge.setNotifyMatchStarting();
    }

    //              #     #      #         #  #         #          #      #                #  #               #                ##
    //              #           # #        ####         #          #                       ## #               #                 #
    // ###    ##   ###   ##     #    #  #  ####   ###  ###    ##   ###   ##    ###    ###  ## #   ##   #  #  ###   ###    ###   #     ###
    // #  #  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #   #    #  #  #  #  # ##  # ##  #  #   #    #  #  #  #   #    ##
    // #  #  #  #   #     #     #     # #  #  #  # ##   #    #     #  #   #    #  #   ##   # ##  ##    #  #   #    #     # ##   #      ##
    // #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #  ###   #  #  #     #  #   ##    ###    ##  #      # #  ###   ###
    //                                #                                               ###
    /**
     * Notifies both teams if there are matching neutral maps.
     * @returns {Promise} A promise that resolves when the teams have been notified.
     */
    async notifyMatchingNeutrals() {
        if (!this.details.challengingTeamPenalized && !this.details.challengedTeamPenalized && !this.details.adminCreated) {
            const matches = await Db.getMatchingNeutralsForChallenge(this);

            if (matches && matches.length > 0) {
                await Discord.queue(`Both teams have ${matches.length === 1 ? "a matching preferred neutral map!" : "matching preferred neutral maps!"}\n\n${matches.map((m) => `**${m}**`).join("\n")}}`, this.channel);
            }
        }
    }

    //        #          #     #  #
    //                   #     ####
    // ###   ##     ##   # #   ####   ###  ###
    // #  #   #    #     ##    #  #  #  #  #  #
    // #  #   #    #     # #   #  #  # ##  #  #
    // ###   ###    ##   #  #  #  #   # #  ###
    // #                                   #
    /**
     * Picks the map for the challenge from the list of home maps.
     * @param {number} number The number of the map.
     * @returns {Promise} A promise that resolves when the picked map has been saved.
     */
    async pickMap(number) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            this.details.map = await Db.pickMap(this, number);
        } catch (err) {
            throw new Exception("There was a database error picking a map for a challenge.", err);
        }

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error picking a map for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                                      ##    #           #
    //                                     #  #   #           #
    // ###    ##   # #    ##   # #    ##    #    ###    ###  ###
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #   #
    // #     ##    #  #  #  #  # #   ##    #  #   #    # ##   #
    // #      ##   #  #   ##    #     ##    ##     ##   # #    ##
    /**
     * Removes a stat from a challenge for a pilot.
     * @param {PlayerTypes.UserOrGuildMember} pilot The pilot.
     * @returns {Promise} A promise that resolves when the stat has been removed.
     */
    async removeStat(pilot) {
        try {
            await Db.removeStat(this, pilot);
        } catch (err) {
            throw new Exception("There was a database error removing a stat from a challenge.", err);
        }
    }

    //                                      ##    #                                        ####                     ##   #           ##    ##
    //                                     #  #   #                                        #                       #  #  #            #     #
    // ###    ##   # #    ##   # #    ##    #    ###   ###    ##    ###  # #    ##   ###   ###   ###    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  # ##  ####  #  #  # #   # ##    #    #    #  #  # ##  #  #  ####  # ##  #  #  #     #  #  #  #  ####  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     ##    #  #  #  #  # #   ##    #  #   #    #     ##    # ##  #  #  ##    #     #     #     #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    // #      ##   #  #   ##    #     ##    ##     ##  #      ##    # #  #  #   ##   #     #     #      ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                                                                                                                                        ###
    /**
     * Indicates that a pilot will not be streaming the challenge.
     * @param {DiscordJs.GuildMember} member The pilot streaming the challenge.
     * @returns {Promise} A promise that resolves when the pilot has been updated to be streaming the challenge.
     */
    async removeStreamer(member) {
        try {
            await Db.removeStreamer(this, member);
        } catch (err) {
            throw new Exception("There was a database error removing a pilot as a streamer for a challenge.", err);
        }

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error removing a pilot as a streamer for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                                #    #  #         #          #
    //                                #    ####         #          #
    // ###    ##   ###    ##   ###   ###   ####   ###  ###    ##   ###
    // #  #  # ##  #  #  #  #  #  #   #    #  #  #  #   #    #     #  #
    // #     ##    #  #  #  #  #      #    #  #  # ##   #    #     #  #
    // #      ##   ###    ##   #       ##  #  #   # #    ##   ##   #  #
    //             #
    /**
     * Reports a completed match.
     * @param {Team} losingTeam The losing team.
     * @param {number} winningScore The winning score.
     * @param {number} losingScore The losing score.
     * @returns {Promise} A promise that resolves when the match has been reported.
     */
    async reportMatch(losingTeam, winningScore, losingScore) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            this.details.dateReported = await Db.report(this, losingTeam, losingTeam.id === this.challengingTeam.id ? losingScore : winningScore, losingTeam.id === this.challengingTeam.id ? winningScore : losingScore);
        } catch (err) {
            throw new Exception("There was a database error reporting a challenge.", err);
        }

        this.details.reportingTeam = losingTeam;
        this.details.challengingTeamScore = losingTeam.id === this.challengingTeam.id ? losingScore : winningScore;
        this.details.challengedTeamScore = losingTeam.id === this.challengingTeam.id ? winningScore : losingScore;

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error reporting a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #     ##                 #
    //               #    #  #                #
    //  ###    ##   ###   #      ###   ###   ###    ##   ###
    // ##     # ##   #    #     #  #  ##      #    # ##  #  #
    //   ##   ##     #    #  #  # ##    ##    #    ##    #
    // ###     ##     ##   ##    # #  ###      ##   ##   #
    /**
     * Adds a caster to the challenge.
     * @param {DiscordJs.GuildMember} member The caster.
     * @returns {Promise} A promise that resolves when the caster has been added to the challenge.
     */
    async setCaster(member) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setCaster(this, member);
        } catch (err) {
            throw new Exception("There was a database error adding a pilot as a caster to a challenge.", err);
        }

        this.details.caster = member;

        if (this.channel) {
            try {
                await this.channel.permissionOverwrites.edit(
                    member,
                    {ViewChannel: true},
                    {reason: `${member} is scheduled to cast this match.`}
                );

                await this.updatePinnedPost();

                await Discord.queue(`${member} is now scheduled to cast this match.  This match is scheduled to begin <t:${Math.floor(this.details.matchTime.getTime() / 1000)}:F>.`, this.channel);
            } catch (err) {
                throw new Exception("There was a critical Discord error adding a pilot as a caster to a challenge.  Please resolve this manually as soon as possible.", err);
            }
        }
    }

    //               #     ##                     ###
    //               #    #  #                     #
    //  ###    ##   ###   #      ###  # #    ##    #    #  #  ###    ##
    // ##     # ##   #    # ##  #  #  ####  # ##   #    #  #  #  #  # ##
    //   ##   ##     #    #  #  # ##  #  #  ##     #     # #  #  #  ##
    // ###     ##     ##   ###   # #  #  #   ##    #      #   ###    ##
    //                                                   #    #
    /**
     * Sets the game type.
     * @param {string} gameType The game type.
     * @returns {Promise<string[]>} A promise that returns the new list of home maps for the challenge.
     */
    async setGameType(gameType) {
        if (!this.details) {
            await this.loadDetails();
        }

        let homes;
        try {
            homes = await Db.setGameType(this, gameType);
        } catch (err) {
            throw new Exception("There was a database error setting a game type for a challenge.", err);
        }

        this.details.gameType = gameType;
        this.details.map = void 0;

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a game type for a challenge.  Please resolve this manually as soon as possible.", err);
        }

        return homes;
    }

    //               #    ####                     #
    //               #    #                        #
    //  ###    ##   ###   ###   # #    ##   ###   ###
    // ##     # ##   #    #     # #   # ##  #  #   #
    //   ##   ##     #    #     # #   ##    #  #   #
    // ###     ##     ##  ####   #     ##   #  #    ##
    /**
     * Sets the event in the database.
     * @returns {Promise} A promise that resolves when the event has been set.
     */
    async setEvent() {
        try {
            await Db.setEvent(this);
        } catch (err) {
            throw new Exception("There was a database error while setting an event.", err);
        }
    }

    //               #    #  #                    #  #              ###
    //               #    #  #                    ####               #
    //  ###    ##   ###   ####   ##   # #    ##   ####   ###  ###    #     ##    ###  # #
    // ##     # ##   #    #  #  #  #  ####  # ##  #  #  #  #  #  #   #    # ##  #  #  ####
    //   ##   ##     #    #  #  #  #  #  #  ##    #  #  # ##  #  #   #    ##    # ##  #  #
    // ###     ##     ##  #  #   ##   #  #   ##   #  #   # #  ###    #     ##    # #  #  #
    //                                                        #
    /**
     * Sets the home map team.
     * @param {Team} team The team to set as the home team.
     * @returns {Promise} A promise that resolves when the home map team has been set.
     */
    async setHomeMapTeam(team) {
        if (!this.details) {
            await this.loadDetails();
        }

        let homes;
        try {
            homes = await Db.setHomeMapTeam(this, team);
        } catch (err) {
            throw new Exception("There was a database error setting a home map team for a challenge.", err);
        }

        this.details.homeMapTeam = team;
        this.details.usingHomeMapTeam = true;
        this.details.map = void 0;

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a home map team for a challenge.  Please resolve this manually as soon as possible.", err);
        }

        return homes;
    }

    //               #    #  #
    //               #    ####
    //  ###    ##   ###   ####   ###  ###
    // ##     # ##   #    #  #  #  #  #  #
    //   ##   ##     #    #  #  # ##  #  #
    // ###     ##     ##  #  #   # #  ###
    //                                #
    /**
     * Sets the map for the challenge.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the map has been saved.
     */
    async setMap(map) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setMap(this, map);
        } catch (err) {
            throw new Exception("There was a database error setting a map for a challenge.", err);
        }

        this.details.map = map;
        this.details.usingHomeMapTeam = false;

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a map for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    #  #         #     #      #          ##   ##                #     ####               #                   #
    //               #    ## #         #           # #        #  #   #                #     #                                      #
    //  ###    ##   ###   ## #   ##   ###   ##     #    #  #  #      #     ##    ##   # #   ###   #  #  ###   ##    ###    ##    ###
    // ##     # ##   #    # ##  #  #   #     #    ###   #  #  #      #    #  #  #     ##    #      ##   #  #   #    #  #  # ##  #  #
    //   ##   ##     #    # ##  #  #   #     #     #     # #  #  #   #    #  #  #     # #   #      ##   #  #   #    #     ##    #  #
    // ###     ##     ##  #  #   ##     ##  ###    #      #    ##   ###    ##    ##   #  #  ####  #  #  ###   ###   #      ##    ###
    //                                                   #                                              #
    /**
     * Sets the notification for an expired clock.
     * @param {Date} [date] When to notify.
     * @returns {void}
     */
    setNotifyClockExpired(date) {
        if (clockExpiredJobs[this.id]) {
            clockExpiredJobs[this.id].cancel();
            delete clockExpiredJobs[this.id];
        }

        if (date) {
            clockExpiredJobs[this.id] = schedule.scheduleJob(new Date(Math.max(date.getTime(), new Date().getTime() + 5000)), Challenge.notifyClockExpired.bind(null, this.id));
        }
    }

    //               #    #  #         #     #      #         #  #         #          #     #  #   #                           #
    //               #    ## #         #           # #        ####         #          #     ####                               #
    //  ###    ##   ###   ## #   ##   ###   ##     #    #  #  ####   ###  ###    ##   ###   ####  ##     ###    ###    ##    ###
    // ##     # ##   #    # ##  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #  #  #   #    ##     ##     # ##  #  #
    //   ##   ##     #    # ##  #  #   #     #     #     # #  #  #  # ##   #    #     #  #  #  #   #      ##     ##   ##    #  #
    // ###     ##     ##  #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #  #  #  ###   ###    ###     ##    ###
    //                                                   #
    /**
     * Sets the notification for a match missed.
     * @param {Date} [date] When to notify.
     * @returns {void}
     */
    setNotifyMatchMissed(date) {
        if (missedMatchJobs[this.id]) {
            missedMatchJobs[this.id].cancel();
            delete missedMatchJobs[this.id];
        }

        if (date) {
            missedMatchJobs[this.id] = schedule.scheduleJob(new Date(Math.max(date.getTime(), new Date().getTime() + 5000)), Challenge.notifyMatchMissed.bind(null, this.id));
        }
    }

    //               #    #  #         #     #      #         #  #         #          #      ##    #                 #     #
    //               #    ## #         #           # #        ####         #          #     #  #   #                 #
    //  ###    ##   ###   ## #   ##   ###   ##     #    #  #  ####   ###  ###    ##   ###    #    ###    ###  ###   ###   ##    ###    ###
    // ##     # ##   #    # ##  #  #   #     #    ###   #  #  #  #  #  #   #    #     #  #    #    #    #  #  #  #   #     #    #  #  #  #
    //   ##   ##     #    # ##  #  #   #     #     #     # #  #  #  # ##   #    #     #  #  #  #   #    # ##  #      #     #    #  #   ##
    // ###     ##     ##  #  #   ##     ##  ###    #      #   #  #   # #    ##   ##   #  #   ##     ##   # #  #       ##  ###   #  #  #
    //                                                   #                                                                             ###
    /**
     * Sets the notification for a match starting.
     * @param {Date} [date] When to notify.
     * @returns {void}
     */
    setNotifyMatchStarting(date) {
        if (upcomingMatchJobs[this.id]) {
            upcomingMatchJobs[this.id].cancel();
            delete upcomingMatchJobs[this.id];
        }

        if (date) {
            upcomingMatchJobs[this.id] = schedule.scheduleJob(new Date(Math.max(date.getTime(), new Date().getTime() + 5000)), Challenge.notifyMatchStarting.bind(null, this.id));
        }
    }

    //               #     ##                      #     #                ###                #             #
    //               #    #  #                     #                      #  #                             #
    //  ###    ##   ###   #  #  # #    ##   ###   ###   ##    # #    ##   #  #   ##   ###   ##     ##    ###   ###
    // ##     # ##   #    #  #  # #   # ##  #  #   #     #    ####  # ##  ###   # ##  #  #   #    #  #  #  #  ##
    //   ##   ##     #    #  #  # #   ##    #      #     #    #  #  ##    #     ##    #      #    #  #  #  #    ##
    // ###     ##     ##   ##    #     ##   #       ##  ###   #  #   ##   #      ##   #     ###    ##    ###  ###
    /**
     * Sets the number of overtime periods for the challenge.
     * @param {number} overtimePeriods The number of overtime periods played.
     * @returns {Promise} A promise that resolves when the number of overtime periods has been set.
     */
    async setOvertimePeriods(overtimePeriods) {
        try {
            await Db.setOvertimePeriods(this, overtimePeriods);
        } catch (err) {
            throw new Exception("There was a database error setting the number of overtime periods played for a challenge.", err);
        }
    }

    //               #    ###                 #
    //               #    #  #                #
    //  ###    ##   ###   #  #   ##    ###   ###    ###    ##    ###   ###    ##   ###
    // ##     # ##   #    ###   #  #  ##      #    ##     # ##  #  #  ##     #  #  #  #
    //   ##   ##     #    #     #  #    ##    #      ##   ##    # ##    ##   #  #  #  #
    // ###     ##     ##  #      ##   ###      ##  ###     ##    # #  ###     ##   #  #
    /**
     * Sets a challenge to be a postseason match.
     * @param {boolean} postseason Whether this is a postseason match.
     * @returns {Promise} A promise that resolves when the challenge is set as a postseason match.
     */
    async setPostseason(postseason) {
        try {
            await Db.setPostseason(this, postseason);
        } catch (err) {
            throw new Exception("There was a database error setting a challenge's postseason status.", err);
        }

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a challenge's postseason status.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    ###                 #           #           #             #
    //               #    #  #                #                       #             #
    //  ###    ##   ###   #  #   ##    ###   ###   ###   ##     ##   ###    ##    ###
    // ##     # ##   #    ###   # ##  ##      #    #  #   #    #      #    # ##  #  #
    //   ##   ##     #    # #   ##      ##    #    #      #    #      #    ##    #  #
    // ###     ##     ##  #  #   ##   ###      ##  #     ###    ##     ##   ##    ###
    /**
     * Sets a challenge to be a restricted match.
     * @param {boolean} restricted Whether this is a restricted match.
     * @returns {Promise} A promise that resolves when the challenge is set as a restricted match.
     */
    async setRestricted(restricted) {
        try {
            await Db.setRestricted(this, restricted);
        } catch (err) {
            throw new Exception("There was a database error setting a challenge to be a restricted match.", err);
        }

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a challenge to be a restricted match.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #     ##
    //               #    #  #
    //  ###    ##   ###    #     ##    ##   ###    ##
    // ##     # ##   #      #   #     #  #  #  #  # ##
    //   ##   ##     #    #  #  #     #  #  #     ##
    // ###     ##     ##   ##    ##    ##   #      ##
    /**
     * Sets the score for a match.
     * @param {number} challengingTeamScore The challenging team's score.
     * @param {number} challengedTeamScore The challenged team's score.
     * @returns {Promise} A promise that resolves when the score has been set.
     */
    async setScore(challengingTeamScore, challengedTeamScore) {
        if (!this.details) {
            await this.loadDetails();
        }

        let dateConfirmed;
        try {
            dateConfirmed = await Db.setScore(this, challengingTeamScore, challengedTeamScore);
        } catch (err) {
            throw new Exception("There was a database error setting the score for a challenge.", err);
        }

        this.details.challengingTeamScore = challengingTeamScore;
        this.details.challengedTeamScore = challengedTeamScore;
        this.details.dateConfirmed = dateConfirmed;

        this.setNotifyClockExpired();
        this.setNotifyMatchMissed();
        this.setNotifyMatchStarting();

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting the score for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #     ##
    //               #    #  #
    //  ###    ##   ###    #     ##   ###   # #    ##   ###
    // ##     # ##   #      #   # ##  #  #  # #   # ##  #  #
    //   ##   ##     #    #  #  ##    #     # #   ##    #
    // ###     ##     ##   ##    ##   #      #     ##   #
    /**
     * Sets the server for the match.
     * @returns {Promise} A promise that resolves when the server has been set.
     */
    async setServer() {
        try {
            await Db.setServer(this);
        } catch (err) {
            throw new Exception("There was a database error setting the server for a challenge.", err);
        }
    }

    //               #    ###                      ##    #
    //               #     #                      #  #
    //  ###    ##   ###    #     ##    ###  # #    #    ##    ####   ##
    // ##     # ##   #     #    # ##  #  #  ####    #    #      #   # ##
    //   ##   ##     #     #    ##    # ##  #  #  #  #   #     #    ##
    // ###     ##     ##   #     ##    # #  #  #   ##   ###   ####   ##
    /**
     * Sets the team size.
     * @param {number} size The team size.
     * @returns {Promise} A promise that resolves when the team size has been set.
     */
    async setTeamSize(size) {
        if (!this.details) {
            await this.loadDetails();
        }

        let homes = await this.getHomeMaps(Challenge.getGameTypeForHomes(this.details.gameType, size));
        if (!homes || homes.length < Validation.MAXIMUM_MAPS_PER_GAME_TYPE) {
            Discord.queue(`${this.details.homeMapTeam.name} does not have enough home maps set up for this team size.`, this.channel);
            return;
        }

        try {
            homes = await Db.setTeamSize(this, size);
        } catch (err) {
            throw new Exception("There was a database error setting the team size for a challenge.", err);
        }

        this.details.teamSize = size;

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting the team size for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    ###    #
    //               #     #
    //  ###    ##   ###    #    ##    # #    ##
    // ##     # ##   #     #     #    ####  # ##
    //   ##   ##     #     #     #    #  #  ##
    // ###     ##     ##   #    ###   #  #   ##
    /**
     * Sets the time of the match.
     * @param {Date} date The time of the match.
     * @returns {Promise} A promise that resolves when the time has been set.
     */
    async setTime(date) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setTime(this, date);
        } catch (err) {
            throw new Exception("There was a database error setting the time for a challenge.", err);
        }

        this.details.matchTime = date;

        if (!this.details.dateConfirmed) {
            this.setNotifyMatchMissed(new Date(this.details.matchTime.getTime() + 3600000));
            this.setNotifyMatchStarting(new Date(this.details.matchTime.getTime() - 1800000));
        }

        try {
            await Discord.richQueue(Discord.embedBuilder({
                title: `${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                description: `This match is scheduled for <t:${Math.floor(this.details.matchTime.getTime() / 1000)}:F>.`,
                fields: [
                    {
                        name: "Match Time",
                        value: `Use \`/matchtime ${this.id}\` to get the time of this match in your own time zone, or \`/countdown ${this.id}\` to get the amount of time remaining until the start of the match.`
                    }, {
                        name: "Casting",
                        value: `Use \`/cast ${this.id}\` if you wish to cast this match.`
                    }
                ]
            }), Discord.scheduledMatchesChannel);

            await this.updatePinnedPost(true);
        } catch (err) {
            throw new Exception("There was a critical Discord error setting the time for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    #  #        ###
    //               #    #  #        #  #
    //  ###    ##   ###   #  #   ##   #  #
    // ##     # ##   #    #  #  #  #  #  #
    //   ##   ##     #     ##   #  #  #  #
    // ###     ##     ##   ##    ##   ###
    /**
     * Sets the VoD for a challenge.
     * @param {string} vod The URL of the VoD.
     * @returns {Promise} A promise that resolves when the VoD has been set.
     */
    async setVoD(vod) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setVoD(this, vod);
        } catch (err) {
            throw new Exception("There was a database error updating the VoD for a challenge.", err);
        }

        this.details.vod = vod && vod.length > 0 ? vod : void 0;

        if (this.details.vod) {
            try {
                await Discord.queue(`The match between ${this.challengingTeam.name} and ${this.challengedTeam.name} on <t:${Math.floor(this.details.matchTime.getTime() / 1000)}:F> with the score ${this.challengingTeam.tag} ${this.details.challengingTeamScore} to ${this.challengedTeam.tag} ${this.details.challengedTeamScore} now has a VoD from ${this.details.caster} available at ${vod}`, Discord.vodsChannel);
            } catch (err) {
                throw new Exception("There was a Discord error adding a VoD to the VoDs channel.", err);
            }
        }
    }

    //                           ##         ##
    //                          #  #         #
    //  ###   #  #   ###  ###   #      ##    #     ##   ###    ###
    // ##     #  #  #  #  #  #  #     #  #   #    #  #  #  #  ##
    //   ##   ####  # ##  #  #  #  #  #  #   #    #  #  #       ##
    // ###    ####   # #  ###    ##    ##   ###    ##   #     ###
    //                    #
    /**
     * Swaps the colors of a challenge.
     * @returns {Promise} A promise that resolves when the teams' colors have been swapped.
     */
    async swapColors() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.swapColors(this);
        } catch (err) {
            throw new Exception("There was a database error changing the title for a challenge.", err);
        }

        try {
            [this.details.blueTeam, this.details.orangeTeam] = [this.details.orangeTeam, this.details.blueTeam];

            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error swapping colors for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //  #     #     #    ##
    //  #           #     #
    // ###   ##    ###    #     ##
    //  #     #     #     #    # ##
    //  #     #     #     #    ##
    //   ##  ###     ##  ###    ##
    /**
     * Assigns a title to a game.
     * @param {string} title The title.
     * @returns {Promise} A promise that resolves when the title has been set.
     */
    async title(title) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setTitle(this, title);
        } catch (err) {
            throw new Exception("There was a database error changing the title for a challenge.", err);
        }

        this.details.title = title && title.length > 0 ? title : void 0;

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error changing the title for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //             ##                #
    //              #                #
    // #  #  ###    #     ##    ##   # #
    // #  #  #  #   #    #  #  #     ##
    // #  #  #  #   #    #  #  #     # #
    //  ###  #  #  ###    ##    ##   #  #
    /**
     * Unlocks a challenge.
     * @returns {Promise} A promise that resolves when the challenge is unlocked.
     */
    async unlock() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setLock(this, false);
        } catch (err) {
            throw new Exception("There was a database error unlocking a challenge.", err);
        }

        this.details.adminCreated = false;

        try {
            await this.updatePinnedPost();
        } catch (err) {
            throw new Exception("There was a critical Discord error unlocking a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                           #     ##                 #
    //                           #    #  #                #
    // #  #  ###    ###    ##   ###   #      ###   ###   ###    ##   ###
    // #  #  #  #  ##     # ##   #    #     #  #  ##      #    # ##  #  #
    // #  #  #  #    ##   ##     #    #  #  # ##    ##    #    ##    #
    //  ###  #  #  ###     ##     ##   ##    # #  ###      ##   ##   #
    /**
     * Removes a caster from the challenge.
     * @param {DiscordJs.GuildMember} member The caster.
     * @returns {Promise} A promise that resolves when the caster has been removed from the challenge.
     */
    async unsetCaster(member) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setCaster(this);
        } catch (err) {
            throw new Exception("There was a database error removing a pilot as a caster from a challenge.", err);
        }

        this.details.caster = void 0;

        if (this.channel) {
            try {
                if (Discord.findGuildMemberById(member.id)) {
                    await this.channel.permissionOverwrites.edit(
                        member,
                        {ViewChannel: null},
                        {reason: `${member} is no longer scheduled to cast this match.`}
                    );
                }

                await this.updatePinnedPost();

                await Discord.queue(`${member} is no longer scheduled to cast this match.`, this.channel);
            } catch (err) {
                throw new Exception("There was a critical Discord error removing a pilot as a caster from a challenge.  Please resolve this manually as soon as possible.", err);
            }
        }
    }

    //                          #       #
    //                                  #
    // #  #  ###   # #    ##   ##     ###
    // #  #  #  #  # #   #  #   #    #  #
    // #  #  #  #  # #   #  #   #    #  #
    //  ###  #  #   #     ##   ###    ###
    /**
     * Unvoids a match.
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @returns {Promise} A promise that resolves when the match is unvoided.
     */
    async unvoid(member) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.unvoid(this);
        } catch (err) {
            throw new Exception("There was a database error unvoiding a challenge.", err);
        }

        this.details.dateVoided = void 0;

        if (!this.details.dateClockDeadlineNotified) {
            this.setNotifyClockExpired(this.details.dateClockDeadline);
        }

        if (this.details.matchTime) {
            this.setNotifyMatchMissed(new Date(this.details.matchTime.getTime() + 3600000));
            this.setNotifyMatchStarting(new Date(this.details.matchTime.getTime() - 1800000));
        }

        try {
            if (this.channel) {
                await Discord.queue(`${member} has unvoided this challenge.`, this.channel);

                await this.updatePinnedPost();
            }

            if (this.details.dateConfirmed && this.details.dateClosed) {
                await Discord.queue(`The following match from <t:${Math.floor(this.details.matchTime.getTime() / 1000)}:F> was restored: **${this.challengingTeam.name}** ${this.details.challengingTeamScore}, **${this.challengedTeam.name}** ${this.details.challengedTeamScore}`, Discord.matchResultsChannel);
            }
        } catch (err) {
            throw new Exception("There was a critical Discord error unvoiding a challenge.  Please resolve this manually as soon as possible.", err);
        }

        if (this.details.dateClosed) {
            await Team.updateRatingsForSeasonFromChallenge(this);
        }
    }

    //                #         #          ###    #                         #  ###                 #
    //                #         #          #  #                             #  #  #                #
    // #  #  ###    ###   ###  ###    ##   #  #  ##    ###   ###    ##    ###  #  #   ##    ###   ###
    // #  #  #  #  #  #  #  #   #    # ##  ###    #    #  #  #  #  # ##  #  #  ###   #  #  ##      #
    // #  #  #  #  #  #  # ##   #    ##    #      #    #  #  #  #  ##    #  #  #     #  #    ##    #
    //  ###  ###    ###   # #    ##   ##   #     ###   #  #  #  #   ##    ###  #      ##   ###      ##
    //       #
    /**
     * Updates the pinned post in the channel.
     * @param {boolean} [matchTimeUpdate] Whether the time of the match has updated.
     * @returns {Promise} A promise that resolves when the pinned post is updated.
     */
    async updatePinnedPost(matchTimeUpdate) {
        const channel = this.channel;

        if (!channel) {
            return;
        }

        if (!this.details) {
            await this.loadDetails();
        }

        const embed = Discord.embedBuilder({
            title: this.details.title || `**${this.challengingTeam.name}** vs **${this.challengedTeam.name}**`,
            fields: []
        });

        const checklist = [];

        if (this.details.dateClocked && !this.details.dateConfirmed) {
            checklist.push(`- This match has been placed on the clock by **${this.details.clockTeam.tag}**.  Both teams must agree to all match parameters by <t:${Math.floor(this.details.dateClockDeadline.getTime() / 1000)}:F>`);
        }

        if (!this.details.teamSize) {
            checklist.push("- Agree to a team size.  Suggest a team size with `/suggestteamsize`.");
        }

        if (!this.details.map) {
            if (this.details.gameType === "TA" && !this.details.teamSize) {
                checklist.push(`- **${this.details.homeMapTeam.tag === this.challengingTeam.tag ? this.challengedTeam.tag : this.challengingTeam.tag}** to pick a map after the team size is agreed to.`);
            } else {
                const maps = await this.details.homeMapTeam.getHomeMaps(Challenge.getGameTypeForHomes(this.details.gameType, this.details.teamSize));

                checklist.push(`- **${this.details.homeMapTeam.tag === this.challengingTeam.tag ? this.challengedTeam.tag : this.challengingTeam.tag}** to pick a map with \`/pickmap\` from the following maps:`);
                maps.forEach((map, index) => {
                    checklist.push(`  ${String.fromCharCode(97 + index)}) ${map}`);
                });

                if (!this.details.dateConfirmed) {
                    if (!this.details.adminCreated) {
                        checklist.push("- To play a neutral map, suggest a map with `/suggestmap`.");
                    }
                }
            }
        }

        if (!this.details.matchTime) {
            checklist.push("- Agree to a match time.  Suggest a time with `/suggesttime`.");
        }

        if (this.details.teamSize && this.details.map && this.details.matchTime && !this.details.dateConfirmed) {
            if (!this.details.reportingTeam && !this.details.dateReported) {
                checklist.push("- Report the match with `/report` or `/reportscore`.");
            }
        }

        if (this.details.dateConfirmed) {
            const stats = await this.getStatsForTeam(this.challengingTeam);

            if (stats) {
                checklist.push("- Match complete!");
            } else {
                checklist.push("- Match complete!  Please post a link from https://tracker.otl.gg/gamelist of the archive page for this match.");
            }
        }

        if (this.details.dateConfirmed && !this.details.dateRematched) {
            checklist.push(`- Use \`/rematch\` to start a new ${this.details.teamSize}v${this.details.teamSize} ${Challenge.getGameTypeName(this.details.gameType)} game between the same teams.`);
        }

        embed.addFields({
            name: "Match Checklist:",
            value: checklist.join("\n")
        });

        const parameters = [];
        const eventParameters = [];
        const htmlParameters = [];

        if (this.details.dateConfirmed) {
            eventParameters.push(`Final Score: **${this.challengingTeam.tag}** ${this.details.challengingTeamScore}, **${this.challengedTeam.tag}** ${this.details.challengedTeamScore}${this.details.overtimePeriods ? `, ${this.details.overtimePeriods > 1 ? this.details.overtimePeriods : ""}OT` : ""}`);
            htmlParameters.push(`Final Score: <b>${this.challengingTeam.tag}</b> ${this.details.challengingTeamScore}, <b>${this.challengedTeam.tag}</b> ${this.details.challengedTeamScore}${this.details.overtimePeriods ? `, ${this.details.overtimePeriods > 1 ? this.details.overtimePeriods : ""}OT` : ""}`);
        }

        parameters.push(`Game Type: **${Challenge.getGameTypeName(this.details.gameType)}**`);
        eventParameters.push(`Game Type: **${Challenge.getGameTypeName(this.details.gameType)}**`);
        htmlParameters.push(`Game Type: <b>${Challenge.getGameTypeName(this.details.gameType)}</b>`);

        if (this.details.matchTime) {
            parameters.push(`Match Time: **<t:${Math.floor(this.details.matchTime.getTime() / 1000)}:F>**`);
        }

        if (this.details.teamSize) {
            parameters.push(`Team Size: **${this.details.teamSize}v${this.details.teamSize}**`);
            eventParameters.push(`Team Size: **${this.details.teamSize}v${this.details.teamSize}**`);
            htmlParameters.push(`Team Size: <b>${this.details.teamSize}v${this.details.teamSize}</b>`);
        }

        if (this.details.map) {
            parameters.push(`Map: **${this.details.map}**`);
            eventParameters.push(`Map: **${this.details.map}**`);
            htmlParameters.push(`Map: <b>${this.details.map}</b>`);
        }

        if (this.details.overtimePeriods) {
            parameters.push(`Overtime Periods: **${this.details.overtimePeriods}OT**`);
        }

        if (this.details.caster) {
            parameters.push(`Caster: **${this.details.caster}** at **https://twitch.tv/${await this.details.caster.getTwitchName()}**`);
            if (!this.details.dateConfirmed) {
                eventParameters.push(`Caster: **${this.details.caster}** at **https://twitch.tv/${await this.details.caster.getTwitchName()}**`);
                htmlParameters.push(`Caster: <b>${this.details.caster}</b> at <a target="_blank" href="https://twitch.tv/${await this.details.caster.getTwitchName()}">https://twitch.tv/${await this.details.caster.getTwitchName()}</a>`);
            }
        }

        if (this.details.postseason) {
            parameters.push("**Postseason Game**");
            eventParameters.push("**Postseason Game**");
            htmlParameters.push("<b>Postseason Game</b>");
        }

        embed.addFields({
            name: "Match Parameters:",
            value: parameters.join("\n")
        });

        const challengingTeam = [];

        if (this.details.dateConfirmed) {
            challengingTeam.push(`**${this.details.challengingTeamScore}**`);
        }

        if (this.challengingTeam.tag === this.details.blueTeam.tag) {
            challengingTeam.push("Blue/Team 1");
        } else {
            challengingTeam.push("Orange/Team 2");
        }

        if (!this.details.usingHomeMapTeam) {
            challengingTeam.push("Neutral");
        } else if (this.challengingTeam.tag === this.details.homeMapTeam.tag) {
            challengingTeam.push("Home");
        } else {
            challengingTeam.push("Away");
        }

        if (this.details.challengingTeamPenalized) {
            challengingTeam.push("*Penalized*");
        }

        if (this.details.dateConfirmed) {
            const stats = await this.getStatsForTeam(this.challengingTeam);

            switch (this.details.gameType) {
                case "CTF":
                    stats.sort((a, b) => b.captures - a.captures || (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1) || b.kills - a.kills || b.assists - a.assists || a.deaths - b.deaths || a.name.toString().localeCompare(b.name));
                    break;
                case "TA":
                    stats.sort((a, b) => (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1) || b.kills - a.kills || b.assists - a.assists || a.deaths - b.deaths || a.name.toString().localeCompare(b.name));
                    break;
            }

            stats.forEach((stat) => {
                switch (this.details.gameType) {
                    case "CTF":
                        challengingTeam.push(`**${stat.pilot}**: ${stat.captures} C/${stat.pickups} P, ${stat.carrierKills} CK, ${stat.returns} R, ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)${stat.damage ? ` ${stat.damage.toFixed(0)} Dmg` : ""}`);
                        break;
                    case "TA":
                        challengingTeam.push(`**${stat.pilot}**: ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)${stat.damage ? ` ${stat.damage.toFixed(0)} Dmg, ${(stat.damage / Math.max(stat.deaths, 1)).toFixed(2)} Dmg/D` : ""}`);
                        break;
                }
            });
        }

        embed.addFields({
            name: `**${this.challengingTeam.name}**`,
            value: challengingTeam.join("\n"),
            inline: true
        });

        const challengedTeam = [];

        if (this.details.dateConfirmed) {
            challengedTeam.push(`**${this.details.challengedTeamScore}**`);
        }

        if (this.challengedTeam.tag === this.details.blueTeam.tag) {
            challengedTeam.push("Blue/Team 1");
        } else {
            challengedTeam.push("Orange/Team 2");
        }

        if (!this.details.usingHomeMapTeam) {
            challengedTeam.push("Neutral");
        } else if (this.challengedTeam.tag === this.details.homeMapTeam.tag) {
            challengedTeam.push("Home");
        } else {
            challengedTeam.push("Away");
        }

        if (this.details.challengedTeamPenalized) {
            challengedTeam.push("*Penalized*");
        }

        if (this.details.dateConfirmed) {
            const stats = await this.getStatsForTeam(this.challengedTeam);

            switch (this.details.gameType) {
                case "CTF":
                    stats.sort((a, b) => b.captures - a.captures || (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1) || b.kills - a.kills || b.assists - a.assists || a.deaths - b.deaths || a.name.toString().localeCompare(b.name));
                    break;
                case "TA":
                    stats.sort((a, b) => (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1) || b.kills - a.kills || b.assists - a.assists || a.deaths - b.deaths || a.name.toString().localeCompare(b.name));
                    break;
            }

            stats.forEach((stat) => {
                switch (this.details.gameType) {
                    case "CTF":
                        challengedTeam.push(`**${stat.pilot}**: ${stat.captures} C/${stat.pickups} P, ${stat.carrierKills} CK, ${stat.returns} R, ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)${stat.damage ? ` ${stat.damage.toFixed(0)} Dmg` : ""}`);
                        break;
                    case "TA":
                        challengedTeam.push(`**${stat.pilot}**: ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)${stat.damage ? ` ${stat.damage.toFixed(0)} Dmg, ${(stat.damage / Math.max(stat.deaths, 1)).toFixed(2)} Dmg/D` : ""}`);
                        break;
                }
            });
        }

        embed.addFields({
            name: `**${this.challengedTeam.name}**`,
            value: challengedTeam.join("\n"),
            inline: true
        });

        embed.addFields({
            name: "Challenge Commands",
            value: "Visit https://otl.gg/about for a full list of available challenge commands."
        });

        const pinned = await this.channel.messages.fetchPinned(false);

        if (pinned.size === 1) {
            Discord.richEdit(pinned.first(), embed);
        } else {
            for (const message of pinned) {
                await message[1].unpin();
            }

            const message = await Discord.richQueue(embed, this.channel);

            await message.pin();
        }

        if (this.details.discordEvent && this.details.discordEvent.isCompleted()) {
            this.details.discordEvent = void 0;
        }

        try {
            if (this.details.discordEvent) {
                // Set Discord event.
                if (this.details.discordEvent.isCompleted()) {
                    this.details.discordEvent = void 0;
                } else if (!this.details.matchTime) {
                    await this.details.discordEvent.delete();

                    this.details.discordEvent = void 0;
                } else if (matchTimeUpdate) {
                    if (this.details.confirmed || this.details.matchTime < new Date()) {
                        await this.details.discordEvent.edit({
                            name: `${this.details.title ? `${this.details.title} - ` : ""}${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                            description: eventParameters.join("\n"),
                            reason: "Match update."
                        });
                    } else if (this.details.discordEvent.isScheduled()) {
                        await this.details.discordEvent.edit({
                            name: `${this.details.title ? `${this.details.title} - ` : ""}${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                            scheduledStartTime: this.details.matchTime,
                            scheduledEndTime: new Date(this.details.matchTime.getTime() + 60 * 60 * 1000),
                            description: eventParameters.join("\n"),
                            reason: "Match update."
                        });
                    } else {
                        await this.details.discordEvent.delete();

                        this.details.discordEvent = void 0;

                        this.details.discordEvent = await Discord.createEvent({
                            name: `${this.details.title ? `${this.details.title} - ` : ""}${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                            scheduledStartTime: this.details.matchTime,
                            scheduledEndTime: new Date(this.details.matchTime.getTime() + 60 * 60 * 1000),
                            privacyLevel: DiscordJs.GuildScheduledEventPrivacyLevel.GuildOnly,
                            entityType: DiscordJs.GuildScheduledEventEntityType.External,
                            description: eventParameters.join("\n"),
                            entityMetadata: {location: "OTL"},
                            reason: "Match update."
                        });
                    }
                } else {
                    await this.details.discordEvent.edit({
                        name: `${this.details.title ? `${this.details.title} - ` : ""}${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                        description: eventParameters.join("\n"),
                        reason: "Match update."
                    });
                }
            } else if (this.details.matchTime && this.details.matchTime > new Date()) {
                this.details.discordEvent = await Discord.createEvent({
                    name: `${this.details.title ? `${this.details.title} - ` : ""}${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                    scheduledStartTime: this.details.matchTime,
                    scheduledEndTime: new Date(this.details.matchTime.getTime() + 60 * 60 * 1000),
                    privacyLevel: DiscordJs.GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: DiscordJs.GuildScheduledEventEntityType.External,
                    description: eventParameters.join("\n"),
                    entityMetadata: {location: "OTL"},
                    reason: "Match update."
                });
            }
        } catch (err) {
            Log.exception("There was an error while trying to update a challenge's Discord event.", err);
        }

        // Set Google event.
        if (settings.google.enabled) {
            try {
                if (this.details.googleEvent) {
                    if (this.details.matchTime) {
                        await Calendar.update(this.details.googleEvent.id, {
                            summary: `${this.details.title ? `${this.details.title} - ` : ""}${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                            start: {
                                dateTime: this.details.matchTime.toISOString()
                            },
                            end: {
                                dateTime: new Date(this.details.matchTime.getTime() + 20 * 60 * 1000).toISOString()
                            },
                            description: htmlParameters.join("<br />")
                        });
                    } else {
                        await Calendar.delete(this.details.googleEvent);

                        this.details.googleEvent = void 0;
                    }
                } else if (this.details.matchTime) {
                    this.details.googleEvent = await Calendar.add({
                        summary: `${this.details.title ? `${this.details.title} - ` : ""}${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                        start: {
                            dateTime: this.details.matchTime.toISOString()
                        },
                        end: {
                            dateTime: new Date(this.details.matchTime.getTime() + 20 * 60 * 1000).toISOString()
                        },
                        description: htmlParameters.join("<br />")
                    });
                }
            } catch (err) {
                Log.exception("There was an error while trying to update a challenge's Google event.", err);
            }
        }

        try {
            await this.setEvent();
        } catch (err) {
            Log.exception("There was a critical database error setting the events.  Please clean up the events in the database, Discord, and Google calendar.", err);
        }
    }

    //              #       #
    //                      #
    // # #    ##   ##     ###
    // # #   #  #   #    #  #
    // # #   #  #   #    #  #
    //  #     ##   ###    ###
    /**
     * Voids a match.
     * @param {Team} [teamDisbanding] The team that is disbanding.
     * @returns {Promise} A promise that resolves when the match is voided.
     */
    async void(teamDisbanding) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.void(this);
        } catch (err) {
            throw new Exception("There was a database error voiding a challenge.", err);
        }

        this.details.dateVoided = new Date();

        this.setNotifyClockExpired();
        this.setNotifyMatchMissed();
        this.setNotifyMatchStarting();

        try {
            if (this.channel) {
                if (teamDisbanding) {
                    await Discord.queue(`${teamDisbanding.name} has disbanded, and thus this challenge has been automatically voided.  An admin will close this channel soon.`, this.channel);
                }

                await Discord.queue(`The match at ${this.channel} has been voided.  Please close the channel.`, Discord.alertsChannel);

                if (this.channel) {
                    await this.updatePinnedPost();
                }
            }

            if (this.details.dateConfirmed && this.details.dateClosed) {
                await Discord.queue(`The following match from <t:${Math.floor(this.details.matchTime.getTime() / 1000)}:F> was voided: **${this.challengingTeam.name}** ${this.details.challengingTeamScore}, **${this.challengedTeam.name}** ${this.details.challengedTeamScore}`, Discord.matchResultsChannel);
            }
        } catch (err) {
            throw new Exception("There was a critical Discord error voiding a challenge.  Please resolve this manually as soon as possible.", err);
        }

        if (this.details.dateClosed) {
            await Team.updateRatingsForSeasonFromChallenge(this);
        }
    }
}

module.exports = Challenge;
