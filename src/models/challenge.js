/**
 * @typedef {{id?: number, challengingTeam: Team, challengedTeam: Team}} ChallengeData
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 * @typedef {import("discord.js").User} DiscordJs.User
 * @typedef {DiscordJs.GuildMember|DiscordJs.User} DiscordJs.UserOrGuildMember
 */

const Cache = require("../cache"),
    Common = require("../../web/includes/common"),
    Db = require("../database/challenge"),
    Exception = require("../logging/exception"),
    Log = require("../logging/log"),
    schedule = require("node-schedule"),
    settings = require("../../settings"),
    Team = require("./team"),
    Tracker = require("../tracker"),

    channelParse = /^(?<challengingTeamTag>[0-9a-z]{1,5})-(?<challengedTeamTag>[0-9a-z]{1,5})-(?<id>[1-9][0-9]*)$/,
    timezoneParse = /^[1-9][0-9]*, (?<timezoneName>.*)$/;

/**
 * @type {Object.<number, schedule.Job>}
 */
const clockExpiredJobs = {};

/**
 * @type {Object.<number, schedule.Job>}
 */
const upcomingMatchJobs = {};

/**
 * @type {Object.<number, schedule.Job>}
 */
const missedMatchJobs = {};

/**
 * @type {typeof import("../discord")}
 */
let Discord;

setTimeout(() => {
    Discord = require("../discord");
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
     * @param {ChallengeData} data The data to load into the challenge.
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
     * @param {boolean} [adminCreated] Whether the match is being created by an admin.
     * @param {Team} [homeMapTeam] The home map team to set.  Leave undefined to let the server pick the home team.
     * @param {Team} [homeServerTeam] The home server team to set.  Use null for a neutral server, or leave undefined to let the server pick the home team.
     * @param {number} [teamSize] The team size to set.
     * @param {boolean} [startNow] Whether to start the match now.
     * @returns {Promise<Challenge>} A promise that resolves with the newly created challenge.
     */
    static async create(challengingTeam, challengedTeam, adminCreated, homeMapTeam, homeServerTeam, teamSize, startNow) {
        let data;
        try {
            data = await Db.create(challengingTeam, challengedTeam, !!adminCreated, homeMapTeam, homeServerTeam, teamSize, startNow);
        } catch (err) {
            throw new Exception("There was a database error creating a challenge.", err);
        }

        const challenge = new Challenge({id: data.id, challengingTeam, challengedTeam});

        try {
            if (challenge.channel) {
                throw new Error("Channel already exists.");
            }

            await Discord.createChannel(challenge.channelName, "text", [
                {
                    id: Discord.id,
                    deny: ["VIEW_CHANNEL"]
                }, {
                    id: challengingTeam.role.id,
                    allow: ["VIEW_CHANNEL"]
                }, {
                    id: challengedTeam.role.id,
                    allow: ["VIEW_CHANNEL"]
                }
            ], `${challengingTeam.name} challenged ${challengedTeam.name}.`);

            await challenge.channel.setParent(Discord.challengesCategory);

            const mapEmbed = Discord.richEmbed({
                title: "Challenge commands - Map",
                description: `**${data.homeMapTeam.tag}** is the home map team, so **${(data.homeMapTeam.tag === challengingTeam.tag ? challengedTeam : challengingTeam).tag}** must choose from one of the following home maps:\n${(await data.homeMapTeam.getHomeMaps()).map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}`,
                color: data.homeMapTeam.role.color,
                fields: [
                    {
                        name: "!pickmap <a|b|c|d|e>",
                        value: "Pick the map to play.  Locks the map for the match."
                    }
                ]
            });

            if (!data.team1Penalized && !data.team2Penalized && !adminCreated) {
                mapEmbed.fields.push({
                    name: "!suggestmap <map>",
                    value: "Suggest a neutral map to play."
                }, {
                    name: "!confirmmap",
                    value: "Confirms a neutral map suggested by the other team.  Locks the map for the match."
                });
            }

            const mapMsg = await Discord.richQueue(mapEmbed, challenge.channel);

            if (mapMsg) {
                await mapMsg.pin();
            }

            const serverEmbed = Discord.richEmbed({
                title: "Challenge commands - Server",
                description: `${homeServerTeam === null ? "The server home team has been set to be neutral." : `**${data.homeServerTeam.tag}** is the home server team, which means ${data.homeServerTeam.tag} chooses which two pilots start the match in an effort to select a specific server.`}`,
                color: data.homeServerTeam ? data.homeServerTeam.role.color : void 0,
                fields: []
            });

            if (!data.team1Penalized && !data.team2Penalized && !adminCreated) {
                serverEmbed.fields.push({
                    name: "!suggestneutralserver",
                    value: "Suggests a neutral server be played.  This allows both teams to decide who starts the match."
                }, {
                    name: "!confirmneutralserver",
                    value: "Confirms a neutral server suggested by the other team.  Locks the server selection for the match."
                });
            }

            const serverMsg = await Discord.richQueue(serverEmbed, challenge.channel);

            if (serverMsg) {
                await serverMsg.pin();
            }

            const optionsEmbed = Discord.richEmbed({
                title: "Challenge commands - Options",
                description: "Challenges must also have a team size and scheduled time to play.",
                fields: []
            });

            if (teamSize) {
                optionsEmbed.addField("Team size", `The team size has been set to be ${teamSize}v${teamSize}.`);
            }

            if (startNow) {
                optionsEmbed.addField("Match time", "The match time has been set to begin shortly.");
            }

            optionsEmbed.addField("!suggestteamsize <2|3|4|5|6|7|8>", "Suggests a team size for the match.");
            optionsEmbed.addField("!confirmteamsize", "Confirms a team size suggested by the other team.");

            if (!adminCreated) {
                optionsEmbed.fields.push({
                    name: "!suggesttime <month name> <day> <year>, <hh:mm> (AM|PM)",
                    value: "Suggests the date and time to play the match.  Time zone is assumed to be Pacific Time, unless the issuing pilot has used the `!timezone` command."
                }, {
                    name: "!confirmtime",
                    value: "Confirms the date and time to play the match as suggested by the other team."
                }, {
                    name: "!clock",
                    value: `Put this challenge on the clock.  Teams will have 28 days to get this match scheduled.  Intended for use when the other team is not responding to a challenge.  Limits apply, see ${Discord.findChannelByName("challenges")} for details.`
                });
            }

            optionsEmbed.fields.push({
                name: "!streaming",
                value: "Indicates that a pilot will be streaming the match live."
            }, {
                name: "!notstreaming",
                value: "Indicates that a pilot will not be streaming the match live, which is the default setting."
            });

            const optionsMsg = await Discord.richQueue(optionsEmbed, challenge.channel);

            if (optionsMsg) {
                await optionsMsg.pin();
            }

            const reportMsg = await Discord.richQueue(Discord.richEmbed({
                title: "Challenge commands - Reporting",
                description: "Upon completion of the match, the losing team reports the game.",
                fields: [
                    {
                        name: "!report <score> <score>",
                        value: "Reports the score for the match.  Losing team must report the match."
                    }, {
                        name: "!confirm",
                        value: "Confirms the reported score by the other team."
                    }, {
                        name: "Screenshot required!",
                        value: "At least one pilot must post a screenshot of the final score screen, which includes each pilot's individual performance.  Games reported without a screenshot will not be counted."
                    }
                ]
            }), challenge.channel);

            if (reportMsg) {
                await reportMsg.pin();
            }

            const otherMsg = await Discord.richQueue(Discord.richEmbed({
                title: "Challenge commands - Other",
                fields: [
                    {
                        name: "!matchtime",
                        value: "Get the match time in your local timezone."
                    },
                    {
                        name: "!countdown",
                        value: "Get the amount of time until the match begins."
                    },
                    {
                        name: "!deadline",
                        value: "Get the clock deadline time in your local timezone."
                    },
                    {
                        name: "!deadlinecountdown",
                        value: "Get the amount of time until the clock deadline."
                    },
                    {
                        name: "!streaming",
                        value: "Indicate that you will be streaming this match."
                    },
                    {
                        name: "!notstreaming",
                        value: "Use this command if you've previously indicated that you will be streaming this match but won't be."
                    }
                ]
            }), challenge.channel);

            if (otherMsg) {
                await otherMsg.pin();
            }

            if (data.team1Penalized && data.team2Penalized) {
                await Discord.queue("Penalties have been applied to both teams for this match.  Neutral map and server selection is disabled.", challenge.channel);
            } else if (data.team1Penalized) {
                await Discord.queue(`A penalty has been applied to **${challengingTeam.tag}** for this match.  Neutral map and server selection is disabled.`, challenge.channel);
            } else if (data.team2Penalized) {
                await Discord.queue(`A penalty has been applied to **${challengedTeam.tag}** for this match.  Neutral map and server selection is disabled.`, challenge.channel);
            }

            await challenge.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error creating a challenge.  Please resolve this manually as soon as possible.", err);
        }

        return challenge;
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
        let challenges;
        try {
            challenges = await Db.getAllByTeam(team);

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
        let challenges;
        try {
            challenges = await Db.getAllByTeams(team1, team2);

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
     * @param {DiscordJs.TextChannel} channel The channel.
     * @returns {Promise<Challenge>} The challenge.
     */
    static async getByChannel(channel) {
        if (!channelParse.test(channel.name)) {
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
     * @returns {Promise<Challenge>} The challenge.
     */
    static async getByTeams(team1, team2) {
        let data;
        try {
            data = await Db.getByTeams(team1, team2);
        } catch (err) {
            throw new Exception("There was a database error getting a challenge by teams.", err);
        }

        return data ? new Challenge({id: data.id, challengingTeam: await Team.getById(data.challengingTeamId), challengedTeam: await Team.getById(data.challengedTeamId)}) : void 0;
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

    //          #     #   ##    #           #
    //          #     #  #  #   #           #
    //  ###   ###   ###   #    ###    ###  ###
    // #  #  #  #  #  #    #    #    #  #   #
    // # ##  #  #  #  #  #  #   #    # ##   #
    //  # #   ###   ###   ##     ##   # #    ##
    /**
     * Adds a stat to the challenge.
     * @param {Team} team The team to add the stat for.
     * @param {DiscordJs.UserOrGuildMember} pilot The pilot to add the stat for.
     * @param {number} kills The number of kills the pilot had.
     * @param {number} assists The number of assists the pilot had.
     * @param {number} deaths The number of deaths the pilot had.
     * @returns {Promise} A promise that resolves when the stat has been added.
     */
    async addStat(team, pilot, kills, assists, deaths) {
        try {
            await Db.addStat(this, team, pilot, kills, assists, deaths);
        } catch (err) {
            throw new Exception("There was a database error adding a stat to a challenge.", err);
        }

        await Discord.queue(`Added stats for ${pilot}: ${((kills + assists) / Math.max(deaths, 1)).toFixed(3)} KDA (${kills} K, ${assists} A, ${deaths} D)`, this.channel);
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
     * @param {Object<string, string>} nameMap A lookup dictionary of names used in game to Discord IDs.
     * @returns {Promise<{challengingTeamStats: {pilot: DiscordJs.UserOrGuildMember, name: string, kills: number, assists: number, deaths: number}[], challengedTeamStats: {pilot: DiscordJs.UserOrGuildMember, name: string, kills: number, assists: number, deaths: number}[], scoreChanged: boolean}>} A promise that returns data about the game's stats and score.
     */
    async addStats(gameId, nameMap) {
        let game;
        try {
            game = await Tracker.getMatch(gameId);
        } catch (err) {
            throw new Error("That is not a valid game ID.");
        }

        if (!game) {
            throw new Error("That is not a valid game ID.");
        }

        if (game.settings.gameMode !== "TEAM ANARCHY") {
            throw new Error("Currently, only team anarchy games are supported.");
        }

        /** @type {Object<string, string>} */
        let map = await Cache.get(`${settings.redisPrefix}:nameMap`);

        if (!map) {
            map = {};
        }

        const notFound = [];

        Object.keys(nameMap).forEach((alias) => {
            map[alias] = nameMap[alias];
        });

        for (const player of game.players) {
            if (!nameMap[player.name]) {
                let found = false;

                // We guess at the name.
                for (const [id, member] of this.channel.members) {
                    if (member.displayName.toUpperCase().indexOf(player.name.toUpperCase()) !== -1) {
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

        await Cache.add(`${settings.redisPrefix}:nameMap`, map);

        let challengingTeamMembers = 0,
            challengedTeamMembers = 0;

        /** @type {Object<string, {member: DiscordJs.UserOrGuildMember, team: Team}>} */
        const playerTeam = {};

        await this.loadDetails();

        for (const player of game.players) {
            const member = Discord.findGuildMemberById(map[player.name]) || await Discord.findUserById(map[player.name]),
                team = player.team === "BLUE" ? this.details.blueTeam : this.details.orangeTeam;

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

        if (challengingTeamStats.length === 0 && challengedTeamStats.length === 0) {
            // Add all the stats to the database.
            for (const player of game.players) {
                try {
                    await Db.addStat(this, playerTeam[player.name].team, playerTeam[player.name].member, player.kills, player.assists, player.deaths);
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

                try {
                    await Db.setScore(this, this.details.challengingTeamScore, this.details.challengedTeamScore);
                } catch (err) {
                    throw new Exception("There was a database error setting the score for a challenge.", err);
                }
            }

            // Add damage stats.
            await Db.setDamage(this, game.damage.map((stat) => ({
                team: playerTeam[stat.attacker].team,
                discordId: map[stat.attacker],
                opponentDiscordId: map[stat.attacker],
                weapon: stat.weapon,
                damage: stat.damage
            })));

            // Get the new stats and return them.
            challengingTeamStats = await this.getStatsForTeam(this.challengingTeam);
            challengedTeamStats = await this.getStatsForTeam(this.challengedTeam);

            return {challengingTeamStats, challengedTeamStats, scoreChanged};
        }

        // Check that all the players exist.
        for (const player of game.players) {
            if (!challengingTeamStats.find((s) => s.pilot.id === map[player.name]) && !challengedTeamStats.find((s) => s.pilot.id === map[player.name])) {
                throw new Error(`${player} does not appear to have played in this match previously.  Please check that the pilots from all games are the same between every game.`);
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
                await Db.addStat(this, playerTeam[player.name].team, playerTeam[player.name].member, player.kills + playerStats.kills, player.assists + playerStats.assists, player.deaths + playerStats.deaths);
            } catch (err) {
                throw new Exception("There was a database error adding a stat to a challenge.", err);
            }
        }

        // Add new score to existing score.
        this.details.challengingTeamScore = (this.details.blueTeam.id === this.challengingTeam.id ? game.teamScore.BLUE : game.teamScore.ORANGE) + this.details.challengingTeamScore;
        this.details.challengedTeamScore = (this.details.blueTeam.id === this.challengedTeam.id ? game.teamScore.BLUE : game.teamScore.ORANGE) + this.details.challengedTeamScore;

        try {
            await Db.setScore(this, this.details.challengingTeamScore, this.details.challengedTeamScore);
        } catch (err) {
            throw new Exception("There was a database error setting the score for a challenge.", err);
        }

        // Get damage stats and add to them.
        const damageStats = await Db.getDamage(this);

        damageStats.forEach((stat) => {
            const damage = game.damage.find((d) => map[d.attacker] === stat.discordId && map[d.defender] === stat.opponentDiscordId && d.weapon === stat.weapon);

            if (damage) {
                damage.damage += stat.damage;
            } else {
                game.damage.push({
                    attacker: Object.keys(map).find((k) => map[k] === stat.discordId),
                    defender: Object.keys(map).find((k) => map[k] === stat.opponentDiscordId),
                    weapon: stat.weapon,
                    damage: stat.damage
                });
            }
        });

        await Db.setDamage(this, game.damage.map((stat) => ({
            team: playerTeam[stat.attacker].team,
            discordId: map[stat.attacker],
            opponentDiscordId: map[stat.attacker],
            weapon: stat.weapon,
            damage: stat.damage
        })));


        // Get the new stats and return them.
        challengingTeamStats = await this.getStatsForTeam(this.challengingTeam);
        challengedTeamStats = await this.getStatsForTeam(this.challengedTeam);

        return {challengingTeamStats, challengedTeamStats, scoreChanged: true};
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
     * @param {string} twitchName The Twitch channel name for the pilot.
     * @returns {Promise} A promise that resolves when the pilot has been updated to be streaming the challenge.
     */
    async addStreamer(member, twitchName) {
        try {
            await Db.addStreamer(this, member);
        } catch (err) {
            throw new Exception("There was a database error adding a pilot as a streamer for a challenge.", err);
        }

        try {
            await Discord.queue(`${member} has been setup to stream this match at https://twitch.tv/${twitchName}.`, this.channel);

            await this.updateTopic();
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
     * @param {DiscordJs.GuildMember} member The admin adjudicating the match.
     * @param {string} decision The decision.
     * @param {Team[]} teams The teams being adjudicated, if any.
     * @returns {Promise} A promise that resolves when the match has been adjudicated.
     */
    async adjudicate(member, decision, teams) {
        if (!this.details) {
            await this.loadDetails();
        }

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

                await Discord.queue(`${member} has voided this challenge.  No penalties were assessed.  An admin will close this channel soon.`, this.channel);

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
                this.details.suggestedTime = void 0;
                this.details.suggestedTimeTeam = void 0;

                this.setNotifyClockExpired(deadline);
                this.setNotifyMatchMissed();
                this.setNotifyMatchStarting();

                try {
                    if (deadline) {
                        await Discord.queue(`${member} has extended the deadline of this challenge.  You have 14 days to get the match scheduled.`, this.channel);
                    } else {
                        await Discord.queue(`${member} has cleared the match time of this challenge, please schedule a new time to play.`, this.channel);
                    }

                    await this.updateTopic();
                } catch (err) {
                    throw new Exception("There was a critical Discord error extending a challenge.  Please resolve this manually as soon as possible.", err);
                }

                break;
            }
            case "penalize":
            {
                let penalizedTeams;
                try {
                    penalizedTeams = await Db.voidWithPenalties(this, teams);
                } catch (err) {
                    throw new Exception("There was a database error penalizing a challenge.", err);
                }

                this.setNotifyClockExpired();
                this.setNotifyMatchMissed();
                this.setNotifyMatchStarting();

                try {
                    await Discord.queue(`${member} has voided this challenge.  Penalties were assessed against **${teams.map((t) => t.name).join(" and ")}**.  An admin will close this channel soon.`, this.channel);

                    for (const penalizedTeam of penalizedTeams) {
                        const team = await Team.getById(penalizedTeam.teamId);

                        if (penalizedTeam.first) {
                            await Discord.queue(`${member} voided the challenge against **${(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam).name}**.  Penalties were assessed against **${teams.map((t) => t.name).join(" and ")}**.  As this was your team's first penalty, that means your next three games will automatically give home map and home server advantages to your opponent.  If you are penalized again, your team will be disbanded, and all current captains and founders will be barred from being a founder or captain of another team.`, team.teamChannel);

                            await team.updateChannels();
                        } else {
                            const oldCaptains = team.role.members.filter((m) => !!m.roles.find((r) => r.id === Discord.founderRole.id || r.id === Discord.captainRole.id));

                            await team.disband(member);

                            for (const captain of oldCaptains.values()) {
                                await Discord.queue(`${member} voided the challenge against **${(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam).name}**.  Penalties were assessed against **${teams.map((t) => t.name).join(" and ")}**.  As this was your team's second penalty, your team has been disbanded.  The founder and captains of your team are now barred from being a founder or captain of another team.`, captain);
                            }
                        }
                    }
                } catch (err) {
                    throw new Exception("There was a critical Discord error penalizing a challenge.  Please resolve this manually as soon as possible.", err);
                }

                break;
            }
        }

        await this.updateTopic();
    }

    //       ##                      ###    #
    //        #                       #
    //  ##    #     ##    ###  ###    #    ##    # #    ##
    // #      #    # ##  #  #  #  #   #     #    ####  # ##
    // #      #    ##    # ##  #      #     #    #  #  ##
    //  ##   ###    ##    # #  #      #    ###   #  #   ##
    /**
     * Clears the time of the match.
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @returns {Promise} A promise that resolves when the time has been cleared.
     */
    async clearTime(member) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setTime(this);
        } catch (err) {
            throw new Exception("There was a database error setting the time for a challenge.", err);
        }

        this.details.matchTime = void 0;
        this.details.suggestedTime = void 0;
        this.details.suggestedTimeTeam = void 0;

        this.setNotifyMatchMissed();
        this.setNotifyMatchStarting();

        try {
            await Discord.queue(`${member} has cleared the match time for this match.`, this.channel);

            await this.updateTopic();
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
            await Discord.queue(`**${team.name}** has put this challenge on the clock!  Both teams have 28 days to get this match scheduled.  If the match is not scheduled within that time, this match will be adjudicated by an admin to determine if penalties need to be assessed.`, this.channel);

            await this.updateTopic();
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
     * @param {{challengingTeamStats: {pilot: DiscordJs.UserOrGuildMember, name: string, kills: number, assists: number, deaths: number}[], challengedTeamStats: {pilot: DiscordJs.UserOrGuildMember, name: string, kills: number, assists: number, deaths: number}[]}} stats The stats for the game.
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
            await this.channel.delete(`${member} closed the challenge.`);

            if (this.details.dateConfirmed && !this.details.dateVoided) {
                await Discord.richQueue(Discord.richEmbed({
                    title: `${this.challengingTeam.name} ${this.details.challengingTeamScore}, ${this.challengedTeam.name} ${this.details.challengedTeamScore}${this.details.overtimePeriods > 0 ? `${this.details.overtimePeriods > 1 ? this.details.overtimePeriods : ""}OT` : ""}`,
                    description: `Played ${this.details.matchTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})} in ${this.details.map}`,
                    color: this.details.challengingTeamScore > this.details.challengedTeamScore ? this.challengingTeam.role.color : this.details.challengedTeamScore > this.details.challengingTeamScore ? this.challengedTeam.role.color : void 0,
                    fields: stats.challengingTeamStats.length > 0 && stats.challengedTeamStats.length > 0 ? [
                        {
                            name: `${this.challengingTeam.name} Stats`,
                            value: `${stats.challengingTeamStats.sort((a, b) => {
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
                            }).map((stat) => `${stat.pilot}: ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)`).join("\n")}`
                        }, {
                            name: `${this.challengedTeam.name} Stats`,
                            value: `${stats.challengedTeamStats.sort((a, b) => {
                                if (a.kills !== b.kills) {
                                    return b.kills - a.kills;
                                }
                                if (a.assists !== b.assists) {
                                    return b.assists - a.assists;
                                }
                                if (a.deaths !== b.deaths) {
                                    return a.deaths - b.deaths;
                                }
                                return a.name.localeCompare(b.name);
                            }).map((stat) => `${stat.pilot}: ${((stat.kills + stat.assists) / Math.max(stat.deaths, 1)).toFixed(3)} KDA (${stat.kills} K, ${stat.assists} A, ${stat.deaths} D)`).join("\n")}`
                        }
                    ] : []
                }), Discord.matchResultsChannel);

                if (this.details.caster) {
                    await Discord.queue(`Thanks for casting the ${this.details.matchTime.toLocaleString("en-US", {timeZone: await this.details.caster.getTimezone(), month: "numeric", day: "numeric", year: "numeric"})} match between ${this.challengingTeam.name} and ${this.challengedTeam.name}!  The final score was ${this.challengingTeam.tag} ${this.details.challengingTeamScore} to ${this.challengedTeam.tag} ${this.details.challengedTeamScore}.  Use the command \`!vod ${this.id} <url>\` to add the VoD.`, this.details.caster);
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

    //                     #    #                #  #
    //                    # #                    ####
    //  ##    ##   ###    #    ##    ###   # #   ####   ###  ###
    // #     #  #  #  #  ###    #    #  #  ####  #  #  #  #  #  #
    // #     #  #  #  #   #     #    #     #  #  #  #  # ##  #  #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   # #  ###
    //                                                       #
    /**
     * Confirms a neutral map suggestion.
     * @returns {Promise} A promise that resolves when a neutral map has been confirmed.
     */
    async confirmMap() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.confirmMap(this);
        } catch (err) {
            throw new Exception("There was a database error confirming a suggested neutral map for a challenge.", err);
        }

        this.details.map = this.details.suggestedMap;
        this.details.usingHomeMapTeam = false;

        try {
            await Discord.queue(`The map for this match has been set to the neutral map of **${this.details.map}**.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error confirming a suggested neutral map for a challenge.  Please resolve this manually as soon as possible.", err);
        }
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
            const embed = Discord.richEmbed({
                title: "Match Confirmed",
                fields: [
                    {
                        name: "Post a screenshot",
                        value: "Remember, OTL matches are only official with pilot statistics from a screenshot.  Be sure that at least one pilot posts the screenshot showing full match details, including each pilots' kills, assists, and deaths."
                    },
                    {
                        name: "This channel is now closed",
                        value: "No further match-related commands will be accepted.  If you need to adjust anything in this match, please notify an admin immediately.  This channel will be closed once the stats have been posted."
                    }
                ]
            });

            const winningScore = Math.max(this.details.challengingTeamScore, this.details.challengedTeamScore),
                losingScore = Math.min(this.details.challengingTeamScore, this.details.challengedTeamScore),
                winningTeam = winningScore === this.details.challengingTeamScore ? this.challengingTeam : this.challengedTeam;

            if (winningScore === losingScore) {
                embed.setDescription(`This match has been confirmed as a **tie**, **${winningScore}** to **${losingScore}**.  Interested in playing another right now?  Use the \`!rematch\` command!`);
            } else {
                embed.setDescription(`This match has been confirmed as a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.  Interested in playing another right now?  Use the \`!rematch\` command!`);
                embed.setColor(winningTeam.role.color);
            }

            await Discord.richQueue(embed, this.channel);

            await Discord.queue(`The match at ${this.channel} has been confirmed.  Please add stats and close the channel.`, Discord.alertsChannel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error confirming a reported match.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                     #    #                #  #               #                ##     ##
    //                    # #                    ## #               #                 #    #  #
    //  ##    ##   ###    #    ##    ###   # #   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###
    // #     #  #  #  #  ###    #    #  #  ####  # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #
    // #     #  #  #  #   #     #    #     #  #  # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #
    /**
     * Confirms a neutral server suggestion.
     * @returns {Promise} A promise that resolves when a neutral server has been confirmed.
     */
    async confirmNeutralServer() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setNeutralServer(this);
        } catch (err) {
            throw new Exception("There was a database error confirming a suggested neutral server for a challenge.", err);
        }

        this.details.usingHomeServerTeam = false;

        try {
            await Discord.queue("The server for this match has been set to be neutral.", this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error confirming a suggested neutral server for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                     #    #                ###                      ##    #
    //                    # #                     #                      #  #
    //  ##    ##   ###    #    ##    ###   # #    #     ##    ###  # #    #    ##    ####   ##
    // #     #  #  #  #  ###    #    #  #  ####   #    # ##  #  #  ####    #    #      #   # ##
    // #     #  #  #  #   #     #    #     #  #   #    ##    # ##  #  #  #  #   #     #    ##
    //  ##    ##   #  #   #    ###   #     #  #   #     ##    # #  #  #   ##   ###   ####   ##
    /**
     * Confirms a team size suggestion.
     * @returns {Promise} A promise that resolves when a team size has been confirmed.
     */
    async confirmTeamSize() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.confirmTeamSize(this);
        } catch (err) {
            throw new Exception("There was a database error confirming a suggested team size for a challenge.", err);
        }

        this.details.teamSize = this.details.suggestedTeamSize;
        this.details.suggestedTeamSize = void 0;
        this.details.suggestedTeamSizeTeam = void 0;

        try {
            await Discord.queue(`The team size for this match has been set to **${this.details.teamSize}v${this.details.teamSize}**.  Either team may suggest changing this at any time with the \`!suggestteamsize\` command.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error confirming a suggested team size for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                     #    #                ###    #
    //                    # #                     #
    //  ##    ##   ###    #    ##    ###   # #    #    ##    # #    ##
    // #     #  #  #  #  ###    #    #  #  ####   #     #    ####  # ##
    // #     #  #  #  #   #     #    #     #  #   #     #    #  #  ##
    //  ##    ##   #  #   #    ###   #     #  #   #    ###   #  #   ##
    /**
     * Confirms a time suggestion.
     * @returns {Promise} A promise that resolves when a time has been confirmed.
     */
    async confirmTime() {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.confirmTime(this);
        } catch (err) {
            throw new Exception("There was a database error confirming a suggested time for a challenge.", err);
        }

        this.details.matchTime = this.details.suggestedTime;
        this.details.suggestedTime = void 0;
        this.details.suggestedTimeTeam = void 0;

        this.setNotifyMatchMissed(new Date(this.details.matchTime.getTime() + 3600000));
        this.setNotifyMatchStarting(new Date(this.details.matchTime.getTime() - 1800000));

        try {
            const times = {};
            for (const member of this.channel.members.values()) {
                const timezone = await member.getTimezone(),
                    yearWithTimezone = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {groups: {timezoneName}} = timezoneParse.exec(yearWithTimezone);

                    if (timezoneName) {
                        times[timezoneName] = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
                    }
                }
            }

            for (const team of [this.challengingTeam, this.challengedTeam]) {
                const timezone = await team.getTimezone(),
                    yearWithTimezone = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {groups: {timezoneName}} = timezoneParse.exec(yearWithTimezone);

                    if (timezoneName) {
                        times[timezoneName] = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
                    }
                }
            }

            const sortedTimes = Object.keys(times).map((tz) => ({timezone: tz, displayTime: times[tz], value: new Date(times[tz])})).sort((a, b) => {
                if (a.value.getTime() !== b.value.getTime()) {
                    return b.value.getTime() - a.value.getTime();
                }

                return a.timezone.localeCompare(b.timezone);
            });

            await Discord.richQueue(Discord.richEmbed({
                description: "The time for this match has been set.",
                fields: sortedTimes.map((t) => ({name: t.timezone, value: t.displayTime}))
            }), this.channel);

            await Discord.richQueue(Discord.richEmbed({
                title: `${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                description: `This match is scheduled for ${this.details.matchTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`,
                fields: [
                    {
                        name: "Match Time",
                        value: `Use \`!matchtime ${this.id}\` to get the time of this match in your own time zone, or \`!countdown ${this.id}\` to get the amount of time remaining until the start of the match.`
                    }, {
                        name: "Casting",
                        value: `Use \`!cast ${this.id}\` if you wish to cast this match.`
                    }
                ]
            }), Discord.scheduledMatchesChannel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error confirming a suggested time for a challenge.  Please resolve this manually as soon as possible.", err);
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
     * @returns {Promise} A promise that resolves when the rematch has been created.
     */
    async createRematch(team) {
        try {
            await Db.setRematched(this);
        } catch (err) {
            throw new Exception("There was a database error marking a challenge as rematched.", err);
        }

        const challenge = await Challenge.create(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam, team, false, void 0, this.details.usingHomeServerTeam ? this.details.homeServerTeam.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam : null, this.details.teamSize, true);

        challenge.setNotifyMatchMissed(new Date(new Date().getTime() + 3600000));
        challenge.setNotifyMatchStarting(new Date(new Date().getTime() + 5000));

        await Discord.queue(`The rematch has been created!  Visit ${challenge.channel} to get started.`, this.channel);
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
     * @returns {Promise<{data: {challengingTeamWins: number, challengingTeamLosses: number, challengingTeamTies: number, challengingTeamRating: number, challengedTeamWins: number, challengedTeamLosses: number, challengedTeamTies: number, challengedTeamRating: number, challengingTeamHeadToHeadWins: number, challengedTeamHeadToHeadWins: number, headToHeadTies: number, challengingTeamId: number, challengingTeamScore: number, challengedTeamId: number, challengedTeamScore: number, map: string, matchTime: Date, name: string, teamId: number, kills: number, assists: number, deaths: number}, challengingTeamRoster: {name: string, games: number, kills: number, assists: number, deaths: number, twitchName: string}[], challengedTeamRoster: {name: string, games: number, kills: number, assists: number, deaths: number, twitchName: string}[]}>} A promise that resolves with the challenge data.
     */
    async getCastData() {
        try {
            return await Db.getCastData(this);
        } catch (err) {
            throw new Exception("There was a database error loading cast data.", err);
        }
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
     * @return {Promise<{pilot: DiscordJs.UserOrGuildMember, name: string, kills: number, assists: number, deaths: number}[]>} A promise that resolves with an array of pilot stats for a team.
     */
    async getStatsForTeam(team) {
        try {
            return Promise.all((await Db.getStatsForTeam(this, team)).map(async (s) => ({pilot: Discord.findGuildMemberById(s.discordId) || await Discord.findUserById(s.discordId), name: s.name, kills: s.kills, assists: s.assists, deaths: s.deaths})));
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
     * @return {Promise<{teams: {teamId: number, name: string, tag: string, rating: number, wins: number, losses: number, ties: number}[], stats: {playerId: number, name: string, teamId: number, kills: number, assists: number, deaths: number, twitchName: string}[], season: {season: number, postseason: boolean}}>} A promise that resolves with the team details for the challenge.
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
            homeServerTeam: details.homeServerTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            adminCreated: details.adminCreated,
            homesLocked: details.homesLocked,
            usingHomeMapTeam: details.usingHomeMapTeam,
            usingHomeServerTeam: details.usingHomeServerTeam,
            challengingTeamPenalized: details.challengingTeamPenalized,
            challengedTeamPenalized: details.challengedTeamPenalized,
            suggestedMap: details.suggestedMap,
            suggestedMapTeam: details.suggestedMapTeamId ? details.suggestedMapTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam : void 0,
            suggestedNeutralServerTeam: details.suggestedNeutralServerTeamId ? details.suggestedNeutralServerTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam : void 0,
            suggestedTeamSize: details.suggestedTeamSize,
            suggestedTeamSizeTeam: details.suggestedTeamSizeTeamId ? details.suggestedTeamSizeTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam : void 0,
            suggestedTime: details.suggestedTime,
            suggestedTimeTeam: details.suggestedTimeTeamId ? details.suggestedTimeTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam : void 0,
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
            dateRematchRequested: details.dateRematchRequested,
            rematchTeam: details.rematchTeamId ? details.rematchTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam : void 0,
            dateRematched: details.dateRematched,
            dateVoided: details.dateVoided,
            overtimePeriods: details.overtimePeriods,
            homeMaps: details.homeMaps,
            vod: details.vod
        };
    }

    // ##                #
    //  #                #
    //  #     ##    ##   # #
    //  #    #  #  #     ##
    //  #    #  #  #     # #
    // ###    ##    ##   #  #
    /**
     * Locks a challenge.
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @returns {Promise} A promise that resolves when the challenge is locked.
     */
    async lock(member) {
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
            await Discord.queue(`This challenge has been locked by ${member}.  Match parameters can no longer be set.`, this.channel);

            await this.updateTopic();
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

        try {
            const msg = Discord.richEmbed({
                fields: []
            });
            if (Math.round((challenge.details.matchTime.getTime() - new Date().getTime()) / 300000) > 0) {
                msg.setTitle(`Polish your gunships, this match begins in ${Math.round((challenge.details.matchTime.getTime() - new Date().getTime()) / 300000) * 5} minutes!`);
            } else {
                msg.setTitle("Polish your gunships, this match begins NOW!");
            }

            if (!challenge.details.map) {
                msg.addField("Please select your map!", `**${challenge.challengingTeam.id === challenge.details.homeMapTeam.id ? challenge.challengedTeam.tag : challenge.challengingTeam.tag}** must still select from the home maps for this match.  Please check the pinned messages in this channel to see what your options are.`);
            }

            if (!challenge.details.teamSize) {
                msg.addField("Please select the team size!", "Both teams must agree on the team size the match should be played at.  This must be done before reporting the match.  Use `!suggestteamsize (2|3|4|5|6|7|8)` to suggest the team size, and your opponent can use `!confirmteamsize` to confirm the suggestion, or suggest their own.");
            }

            msg.addField("Are you streaming this match on Twitch?", "Don't forget to use the `!streaming` command to indicate that you are streaming to Twitch!  This will allow others to watch or cast this match on the website.");

            await Discord.richQueue(msg, challenge.channel);
        } catch (err) {
            throw new Exception("There was a critical Discord error notifying a match starting for a challenge.  Please resolve this manually as soon as possible.", err);
        }

        challenge.setNotifyMatchStarting();
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
            await Discord.queue(`The map for this match has been set to **${this.details.map}**.`, this.channel);

            await this.updateTopic();
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
     * @param {DiscordJs.UserOrGuildMember} pilot The pilot.
     * @returns {Promise} A promise that resolves when the stat has been removed.
     */
    async removeStat(pilot) {
        try {
            await Db.removeStat(this, pilot);
        } catch (err) {
            throw new Exception("There was a database error removing a stat from a challenge.", err);
        }

        await Discord.queue(`Removed stats for ${pilot}.`, this.channel);
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
            await Discord.queue(`${member} is no longer streaming this match.`, this.channel);

            await this.updateTopic();
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

        const winningTeam = losingTeam.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam;

        try {
            this.details.dateReported = await Db.report(this, losingTeam, losingTeam.id === this.challengingTeam.id ? losingScore : winningScore, losingTeam.id === this.challengingTeam.id ? winningScore : losingScore);
        } catch (err) {
            throw new Exception("There was a database error reporting a challenge.", err);
        }

        this.details.reportingTeam = losingTeam;
        this.details.challengingTeamScore = losingTeam.id === this.challengingTeam.id ? losingScore : winningScore;
        this.details.challengedTeamScore = losingTeam.id === this.challengingTeam.id ? winningScore : losingScore;

        try {
            if (winningScore === losingScore) {
                await Discord.queue(`This match has been reported as a **tie**, **${winningScore}** to **${losingScore}**.  If this is correct, **${winningTeam.name}** needs to \`!confirm\` the result.  If this was reported in error, the losing team may correct this by re-issuing the \`!report\` command with the correct score.`, this.channel);
            } else {
                await Discord.richQueue(Discord.richEmbed({
                    description: `This match has been reported as a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.  If this is correct, **${losingTeam.id === this.challengingTeam.id ? this.challengedTeam.name : this.challengingTeam.name}** needs to \`!confirm\` the result.  If this was reported in error, the losing team may correct this by re-issuing the \`!report\` command with the correct score.`,
                    color: winningTeam.role.color
                }), this.channel);
            }

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error reporting a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                                       #    ###                      #          #
    //                                       #    #  #                     #          #
    // ###    ##    ###  #  #   ##    ###   ###   #  #   ##   # #    ###  ###    ##   ###
    // #  #  # ##  #  #  #  #  # ##  ##      #    ###   # ##  ####  #  #   #    #     #  #
    // #     ##    #  #  #  #  ##      ##    #    # #   ##    #  #  # ##   #    #     #  #
    // #      ##    ###   ###   ##   ###      ##  #  #   ##   #  #   # #    ##   ##   #  #
    //                #
    /**
     * Requests a rematch for the challenge.
     * @param {Team} team The team requesting the rematch.
     * @returns {Promise} A promise that resolves when the rematch has been requested.
     */
    async requestRematch(team) {
        try {
            await Db.requestRematch(this, team);
        } catch (err) {
            throw new Exception("There was a database error requesting a rematch.", err);
        }

        await Discord.queue(`**${team.name}** is requesting a rematch!  **${(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam).name}**, do you accept?  The match will be scheduled immediately.  Use the \`!rematch\` command, and the new challenge will be created!`, this.channel);
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
                await this.channel.overwritePermissions(
                    member,
                    {"VIEW_CHANNEL": true},
                    `${member} is scheduled to cast this match.`
                );

                await this.updateTopic();

                await Discord.queue(`${member} is now scheduled to cast this match.  This match is scheduled to begin at ${this.details.matchTime.toLocaleString("en-US", {timeZone: await member.getTimezone(), weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, this.channel);
            } catch (err) {
                throw new Exception("There was a critical Discord error adding a pilot as a caster to a challenge.  Please resolve this manually as soon as possible.", err);
            }
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
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @param {Team} team The team to set as the home team.
     * @returns {Promise} A promise that resolves when the home map team has been set.
     */
    async setHomeMapTeam(member, team) {
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
            await Discord.queue(`${member} has made **${team.tag}** the home map team, so **${(team.tag === this.challengingTeam.tag ? this.challengedTeam : this.challengingTeam).tag}** must choose from one of the following home maps:\n${homes.map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a home map team for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    #  #                     ##                                 ###
    //               #    #  #                    #  #                                 #
    //  ###    ##   ###   ####   ##   # #    ##    #     ##   ###   # #    ##   ###    #     ##    ###  # #
    // ##     # ##   #    #  #  #  #  ####  # ##    #   # ##  #  #  # #   # ##  #  #   #    # ##  #  #  ####
    //   ##   ##     #    #  #  #  #  #  #  ##    #  #  ##    #     # #   ##    #      #    ##    # ##  #  #
    // ###     ##     ##  #  #   ##   #  #   ##    ##    ##   #      #     ##   #      #     ##    # #  #  #
    /**
     * Sets the home server team.
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @param {Team} team The team to set as the home team.
     * @returns {Promise} A promise that resolves when the home server team has been set.
     */
    async setHomeServerTeam(member, team) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setHomeServerTeam(this, team);
        } catch (err) {
            throw new Exception("There was a database error setting a home server team for a challenge.", err);
        }

        this.details.homeServerTeam = team;
        this.details.usingHomeServerTeam = true;

        try {
            await Discord.queue(`${member} has made **${team.tag}** the home server team.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a home server team for a challenge.  Please resolve this manually as soon as possible.", err);
        }
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
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @param {string} map The name of the map.
     * @returns {Promise} A promise that resolves when the map has been saved.
     */
    async setMap(member, map) {
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
            await Discord.queue(`${member} has set the map for this match to **${this.details.map}**.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a map for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    #  #               #                ##     ##
    //               #    ## #               #                 #    #  #
    //  ###    ##   ###   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###
    // ##     # ##   #    # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #
    //   ##   ##     #    # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #
    // ###     ##     ##  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #
    /**
     * Sets a neutral server for this match.
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @returns {Promise} A promise that resolves when the neutral server has been set.
     */
    async setNeutralServer(member) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setNeutralServer(this);
        } catch (err) {
            throw new Exception("There was a database error setting a neutral server for a challenge.", err);
        }

        this.details.usingHomeServerTeam = false;

        try {
            await Discord.queue(`${member} has set the server for this match to be neutral.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a neutral server for a challenge.  Please resolve this manually as soon as possible.", err);
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
     * @returns {Promise} A promise that resolves when the challenge is set as a postseason match.
     */
    async setPostseason() {
        try {
            await Db.setPostseason(this);
        } catch (err) {
            throw new Exception("There was a database error setting a challenge to be a postseason match.", err);
        }

        try {
            await Discord.queue("This challenge is now a postseason match.  All stats will count towards postseason stats for the previous season.", this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a challenge to be a postseason match.  Please resolve this manually as soon as possible.", err);
        }
    }

    //               #    ###                     ##                 ##
    //               #    #  #                     #                #  #
    //  ###    ##   ###   #  #   ##    ###  #  #   #     ###  ###    #     ##    ###   ###    ##   ###
    // ##     # ##   #    ###   # ##  #  #  #  #   #    #  #  #  #    #   # ##  #  #  ##     #  #  #  #
    //   ##   ##     #    # #   ##     ##   #  #   #    # ##  #     #  #  ##    # ##    ##   #  #  #  #
    // ###     ##     ##  #  #   ##   #      ###  ###    # #  #      ##    ##    # #  ###     ##   #  #
    //                                 ###
    /**
     * Sets a challenge to be a regular season match.
     * @returns {Promise} A promise that resolves when the challenge is set as a regular season match.
     */
    async setRegularSeason() {
        try {
            await Db.setRegularSeason(this);
        } catch (err) {
            throw new Exception("There was a database error setting a challenge to be a regular season match.", err);
        }

        try {
            await Discord.queue("This challenge is now a regular season match.  All stats will count towards the current season stats.", this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting a challenge to be a regular season match.  Please resolve this manually as soon as possible.", err);
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

        try {
            await Db.setScore(this, challengingTeamScore, challengedTeamScore);
        } catch (err) {
            throw new Exception("There was a database error setting the score for a challenge.", err);
        }

        this.details.challengingTeamScore = challengingTeamScore;
        this.details.challengedTeamScore = challengedTeamScore;

        this.setNotifyClockExpired();
        this.setNotifyMatchMissed();
        this.setNotifyMatchStarting();

        try {
            const embed = Discord.richEmbed({
                title: "Match Confirmed",
                fields: [
                    {
                        name: "Post a screenshot",
                        value: "Remember, OTL matches are only official with pilot statistics from a screenshot.  Be sure that at least one pilot posts the screenshot showing full match details, including each pilots' kills, assists, and deaths."
                    },
                    {
                        name: "This channel is now closed",
                        value: "No further match-related commands will be accepted.  If you need to adjust anything in this match, please notify an admin immediately.  This channel will be closed once the stats have been posted."
                    }
                ]
            });

            const winningScore = Math.max(this.details.challengingTeamScore, this.details.challengedTeamScore),
                losingScore = Math.min(this.details.challengingTeamScore, this.details.challengedTeamScore),
                winningTeam = winningScore === this.details.challengingTeamScore ? this.challengingTeam : this.challengedTeam;

            if (winningScore === losingScore) {
                embed.setDescription(`This match has been confirmed as a **tie**, **${winningScore}** to **${losingScore}**.  Interested in playing another right now?  Use the \`!rematch\` command!`);
            } else {
                embed.setDescription(`This match has been confirmed as a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.  Interested in playing another right now?  Use the \`!rematch\` command!`);
                embed.setColor(winningTeam.role.color);
            }

            await Discord.richQueue(embed, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error setting the score for a challenge.  Please resolve this manually as soon as possible.", err);
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

        try {
            await Db.setTeamSize(this, size);
        } catch (err) {
            throw new Exception("There was a database error setting the team size for a challenge.", err);
        }

        this.details.teamSize = size;
        this.details.suggestedTeamSize = void 0;
        this.details.suggestedTeamSizeTeam = void 0;

        try {
            await Discord.queue(`An admin has set the team size for this match to **${this.details.teamSize}v${this.details.teamSize}**.`, this.channel);

            await this.updateTopic();
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
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @param {Date} date The time of the match.
     * @returns {Promise} A promise that resolves when the time has been set.
     */
    async setTime(member, date) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.setTime(this, date);
        } catch (err) {
            throw new Exception("There was a database error setting the time for a challenge.", err);
        }

        this.details.matchTime = date;
        this.details.suggestedTime = void 0;
        this.details.suggestedTimeTeam = void 0;

        if (!this.details.dateConfirmed) {
            this.setNotifyMatchMissed(new Date(this.details.matchTime.getTime() + 3600000));
            this.setNotifyMatchStarting(new Date(this.details.matchTime.getTime() - 1800000));
        }

        try {
            const times = {};
            for (const pilot of this.channel.members.values()) {
                const timezone = await pilot.getTimezone(),
                    yearWithTimezone = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {groups: {timezoneName}} = timezoneParse.exec(yearWithTimezone);

                    if (timezoneName) {
                        times[timezoneName] = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
                    }
                }
            }

            for (const team of [this.challengingTeam, this.challengedTeam]) {
                const timezone = await team.getTimezone(),
                    yearWithTimezone = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {groups: {timezoneName}} = timezoneParse.exec(yearWithTimezone);

                    if (timezoneName) {
                        times[timezoneName] = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
                    }
                }
            }

            const sortedTimes = Object.keys(times).map((tz) => ({timezone: tz, displayTime: times[tz], value: new Date(times[tz])})).sort((a, b) => {
                if (a.value.getTime() !== b.value.getTime()) {
                    return b.value.getTime() - a.value.getTime();
                }

                return a.timezone.localeCompare(b.timezone);
            });

            await Discord.richQueue(Discord.richEmbed({
                description: `${member} has set the time for this match.`,
                fields: sortedTimes.map((t) => ({name: t.timezone, value: t.displayTime}))
            }), this.channel);

            await Discord.richQueue(Discord.richEmbed({
                title: `${this.challengingTeam.name} vs ${this.challengedTeam.name}`,
                description: `This match is scheduled for ${this.details.matchTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`,
                fields: [
                    {
                        name: "Match Time",
                        value: `Use \`!matchtime ${this.id}\` to get the time of this match in your own time zone, or \`!countdown ${this.id}\` to get the amount of time remaining until the start of the match.`
                    }, {
                        name: "Casting",
                        value: `Use \`!cast ${this.id}\` if you wish to cast this match.`
                    }
                ]
            }), Discord.scheduledMatchesChannel);

            await this.updateTopic();
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
                await Discord.queue(`The match between ${this.challengingTeam.name} and ${this.challengedTeam.name} on ${this.details.matchTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, month: "numeric", day: "numeric", year: "numeric"})} with the score ${this.challengingTeam.tag} ${this.details.challengingTeamScore} to ${this.challengedTeam.tag} ${this.details.challengedTeamScore} now has a VoD from ${this.details.caster} available at ${vod}`, Discord.vodsChannel);
            } catch (err) {
                throw new Exception("There was a Discord error adding a VoD to the VoDs channel.", err);
            }
        }
    }

    //                                        #    #  #
    //                                        #    ####
    //  ###   #  #   ###   ###   ##    ###   ###   ####   ###  ###
    // ##     #  #  #  #  #  #  # ##  ##      #    #  #  #  #  #  #
    //   ##   #  #   ##    ##   ##      ##    #    #  #  # ##  #  #
    // ###     ###  #     #      ##   ###      ##  #  #   # #  ###
    //               ###   ###                                 #
    /**
     * Suggests a map for the challenge.
     * @param {Team} team The team suggesting the map.
     * @param {string} map The map.
     * @returns {Promise} A promise that resolves when the map has been suggested.
     */
    async suggestMap(team, map) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.suggestMap(this, team, map);
        } catch (err) {
            throw new Exception("There was a database error suggesting a map for a challenge.", err);
        }

        this.details.suggestedMap = map;
        this.details.suggestedMapTeam = team;

        try {
            await Discord.queue(`**${team.name}** is suggesting to play a neutral map, **${map}**.  **${(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam).name}**, use \`!confirmmap\` to agree to this suggestion.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error suggesting a map for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                                        #    #  #               #                ##     ##
    //                                        #    ## #               #                 #    #  #
    //  ###   #  #   ###   ###   ##    ###   ###   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###
    // ##     #  #  #  #  #  #  # ##  ##      #    # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #
    //   ##   #  #   ##    ##   ##      ##    #    # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #
    // ###     ###  #     #      ##   ###      ##  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #
    //               ###   ###
    /**
     * Suggests a neutral server for the challenge.
     * @param {Team} team The team suggesting the neutral server.
     * @returns {Promise} A promise that resolves when the neutral server has been suggested.
     */
    async suggestNeutralServer(team) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.suggestNeutralServer(this, team);
        } catch (err) {
            throw new Exception("There was a database error suggesting a neutral server for a challenge.", err);
        }

        this.details.suggestedNeutralServerTeam = team;

        try {
            await Discord.queue(`**${team.name}** is suggesting to play a neutral server.  **${(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam).name}**, use \`!confirmneutralserver\` to agree to this suggestion.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error suggesting a neutral server for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                                        #    ###                      ##    #
    //                                        #     #                      #  #
    //  ###   #  #   ###   ###   ##    ###   ###    #     ##    ###  # #    #    ##    ####   ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #    # ##  #  #  ####    #    #      #   # ##
    //   ##   #  #   ##    ##   ##      ##    #     #    ##    # ##  #  #  #  #   #     #    ##
    // ###     ###  #     #      ##   ###      ##   #     ##    # #  #  #   ##   ###   ####   ##
    //               ###   ###
    /**
     * Suggests a team size for the challenge.
     * @param {Team} team The team suggesting the team size.
     * @param {number} size The team size.
     * @returns {Promise} A promise that resolves when the team size has been suggested.
     */
    async suggestTeamSize(team, size) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.suggestTeamSize(this, team, size);
        } catch (err) {
            throw new Exception("There was a database error suggesting a team size for a challenge.", err);
        }

        this.details.suggestedTeamSize = size;
        this.details.suggestedTeamSizeTeam = team;

        try {
            await Discord.queue(`**${team.name}** is suggesting to play a **${size}v${size}**.  **${(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam).name}**, use \`!confirmteamsize\` to agree to this suggestion.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error suggesting a team size for a challenge.  Please resolve this manually as soon as possible.", err);
        }
    }

    //                                        #    ###    #
    //                                        #     #
    //  ###   #  #   ###   ###   ##    ###   ###    #    ##    # #    ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #     #    ####  # ##
    //   ##   #  #   ##    ##   ##      ##    #     #     #    #  #  ##
    // ###     ###  #     #      ##   ###      ##   #    ###   #  #   ##
    //               ###   ###
    /**
     * Suggests a time for the challenge.
     * @param {Team} team The team suggesting the time.
     * @param {Date} date The time.
     * @returns {Promise} A promise that resolves when the team size has been suggested.
     */
    async suggestTime(team, date) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.suggestTime(this, team, date);
        } catch (err) {
            throw new Exception("There was a database error suggesting a time for a challenge.", err);
        }

        this.details.suggestedTime = date;
        this.details.suggestedTimeTeam = team;

        try {
            const times = {};
            for (const member of this.channel.members.values()) {
                const timezone = await member.getTimezone(),
                    yearWithTimezone = this.details.suggestedTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {groups: {timezoneName}} = timezoneParse.exec(yearWithTimezone);

                    if (timezoneName) {
                        times[timezoneName] = this.details.suggestedTime.toLocaleString("en-US", {timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
                    }
                }
            }

            for (const challengeTeam of [this.challengingTeam, this.challengedTeam]) {
                const timezone = await challengeTeam.getTimezone(),
                    yearWithTimezone = this.details.suggestedTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {groups: {timezoneName}} = timezoneParse.exec(yearWithTimezone);

                    if (timezoneName) {
                        times[timezoneName] = this.details.suggestedTime.toLocaleString("en-US", {timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
                    }
                }
            }

            const sortedTimes = Object.keys(times).map((tz) => ({timezone: tz, displayTime: times[tz], value: new Date(times[tz])})).sort((a, b) => {
                if (a.value.getTime() !== b.value.getTime()) {
                    return b.value.getTime() - a.value.getTime();
                }

                return a.timezone.localeCompare(b.timezone);
            });

            await Discord.richQueue(Discord.richEmbed({
                description: `**${team.name}** is suggesting to play the match at the time listed below.  **${(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam).name}**, use \`!confirmtime\` to agree to this suggestion.`,
                fields: sortedTimes.map((t) => ({name: t.timezone, value: t.displayTime}))
            }), this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error suggesting a time for a challenge.  Please resolve this manually as soon as possible.", err);
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
            if (this.details.title) {
                await Discord.queue(`The title of this match has been updated to **${title}**.`, this.channel);
            } else {
                await Discord.queue("The title of this match has been unset.", this.channel);
            }
            await this.updateTopic();
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
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @returns {Promise} A promise that resolves when the challenge is unlocked.
     */
    async unlock(member) {
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
            await Discord.queue(`This challenge has been unlocked by ${member}.  You may now use \`!suggestmap\` to suggest a neutral map, \`!suggestneutralserver\` to suggest the map be played on a neutral server, and \`!suggesttime\` to suggest the match time.`, this.channel);

            await this.updateTopic();
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
                    await this.channel.overwritePermissions(
                        member,
                        {"VIEW_CHANNEL": null},
                        `${member} is no longer scheduled to cast this match.`
                    );
                }

                await this.updateTopic();

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

                await this.updateTopic();
            }

            if (this.details.dateConfirmed && this.details.dateClosed) {
                await Discord.queue(`The following match from ${this.details.matchTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, month: "numeric", day: "numeric", year: "numeric"})} was restored: **${this.challengingTeam.name}** ${this.details.challengingTeamScore}, **${this.challengedTeam.name}** ${this.details.challengedTeamScore}`, Discord.matchResultsChannel);
            }
        } catch (err) {
            throw new Exception("There was a critical Discord error unvoiding a challenge.  Please resolve this manually as soon as possible.", err);
        }

        if (this.details.dateClosed) {
            await Team.updateRatingsForSeasonFromChallenge(this);
        }
    }

    //                #         #          ###                #
    //                #         #           #
    // #  #  ###    ###   ###  ###    ##    #     ##   ###   ##     ##
    // #  #  #  #  #  #  #  #   #    # ##   #    #  #  #  #   #    #
    // #  #  #  #  #  #  # ##   #    ##     #    #  #  #  #   #    #
    //  ###  ###    ###   # #    ##   ##    #     ##   ###   ###    ##
    //       #                                         #
    /**
     * Updates the topic of the channel with the latest challenge data.
     * @returns {Promise} A promise that resolves when the topic is updated.
     */
    async updateTopic() {
        const channel = this.channel;

        if (!channel) {
            return;
        }

        if (!this.details) {
            await this.loadDetails();
        }

        let streamers;
        try {
            streamers = await Db.getStreamers(this);
        } catch (err) {
            streamers = [];
        }

        const challengingTeamTimezone = await this.challengingTeam.getTimezone(),
            challengedTeamTimezone = await this.challengedTeam.getTimezone();

        let topic = `${this.details.title || `${this.challengingTeam.name} vs ${this.challengedTeam.name}`}${this.details.postseason ? " (Postseason Match)" : ""}\n\nhttps://otl.gg/match/${this.id}/${this.challengingTeam.tag}/${this.challengedTeam.tag}`;

        if (this.details.dateVoided) {
            topic = `${topic}\n\nThis match has been voided.`;
        } else {
            if (this.details.dateClockDeadline) {
                topic = `${topic}\n\nClock Deadline:\n${this.details.dateClockDeadline.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}${challengingTeamTimezone === challengedTeamTimezone ? "" : `\n${this.details.dateClockDeadline.toLocaleString("en-US", {timeZone: challengedTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`}\nClocked by: ${this.details.clockTeam.tag}`;
            }

            topic = `${topic}\n\nBlue Team: ${this.details.blueTeam.tag}\nOrange Team: ${this.details.orangeTeam.tag}`;

            topic = `${topic}\n\nHome Map Team: ${this.details.usingHomeMapTeam ? this.details.homeMapTeam.tag : "Neutral"}`;

            if (this.details.map) {
                topic = `${topic}\nChosen Map: ${this.details.map}`;
            } else if (this.details.suggestedMap) {
                topic = `${topic}\nSuggested Map: ${this.details.suggestedMap} by ${this.details.suggestedMapTeam.tag}`;
            }

            topic = `${topic}\n\nHome Server Team: ${this.details.usingHomeServerTeam ? this.details.homeServerTeam.tag : "Neutral"}`;

            if (this.details.usingHomeServerTeam && this.details.suggestedNeutralServerTeam) {
                topic = `${topic}\nNeutral Server Suggested by ${this.details.suggestedNeutralServerTeam.tag}`;
            }

            if (this.details.teamSize) {
                topic = `${topic}\n\nTeam Size: ${this.details.teamSize}v${this.details.teamSize}`;
                if (this.details.suggestedTeamSize) {
                    topic = `${topic}\nSuggested Team Size: ${this.details.suggestedTeamSize}v${this.details.suggestedTeamSize} by ${this.details.suggestedTeamSizeTeam.tag}`;
                }
            } else if (this.details.suggestedTeamSize) {
                topic = `${topic}\n\nSuggested Team Size: ${this.details.suggestedTeamSize}v${this.details.suggestedTeamSize} by ${this.details.suggestedTeamSizeTeam.tag}`;
            }

            if (this.details.matchTime) {
                topic = `${topic}\n\nMatch Time:\n${this.details.matchTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}${challengingTeamTimezone === challengedTeamTimezone ? "" : `\n${this.details.matchTime.toLocaleString("en-US", {timeZone: challengedTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`}`;
                if (this.details.suggestedTime) {
                    topic = `${topic}\nSuggested Time:\n${this.details.suggestedTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}${challengingTeamTimezone === challengedTeamTimezone ? "" : `\n${this.details.suggestedTime.toLocaleString("en-US", {timeZone: challengedTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`}`;
                }
            } else if (this.details.suggestedTime) {
                topic = `${topic}\nSuggested Time:\n${this.details.suggestedTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}${challengingTeamTimezone === challengedTeamTimezone ? "" : `\n${this.details.suggestedTime.toLocaleString("en-US", {timeZone: challengedTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`}`;
            }

            if (this.details.dateReported && !this.details.dateConfirmed) {
                topic = `${topic}\n\nReported Score: ${this.challengingTeam.tag} ${this.details.challengingTeamScore}, ${this.challengedTeam.tag} ${this.details.challengedTeamScore}${this.details.overtimePeriods > 0 ? ` ${this.details.overtimePeriods > 1 ? this.details.overtimePeriods : ""}OT` : ""}, reported by ${this.details.reportingTeam.tag}`;
            } else if (this.details.dateConfirmed) {
                topic = `${topic}\n\nFinal Score: ${this.challengingTeam.tag} ${this.details.challengingTeamScore}, ${this.challengedTeam.tag} ${this.details.challengedTeamScore}${this.details.overtimePeriods > 0 ? ` ${this.details.overtimePeriods > 1 ? this.details.overtimePeriods : ""}OT` : ""}`;
            }

            if (this.details.caster) {
                topic = `${topic}\n\nCaster: ${this.details.caster.displayName}`;
            }

            if (streamers.length > 0) {
                topic = `${topic}\n\nStreamers:\n${streamers.map((s) => `${Discord.findGuildMemberById(s.discordId).displayName} - https://twitch.tv/${s.twitchName}`).join("\n")}`;
            }
        }

        await channel.setTopic(topic);
    }

    //              #       #
    //                      #
    // # #    ##   ##     ###
    // # #   #  #   #    #  #
    // # #   #  #   #    #  #
    //  #     ##   ###    ###
    /**
     * Voids a match.
     * @param {DiscordJs.GuildMember} member The pilot issuing the command.
     * @param {Team} [teamDisbanding] The team that is disbanding.
     * @returns {Promise} A promise that resolves when the match is voided.
     */
    async void(member, teamDisbanding) {
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
                } else {
                    await Discord.queue(`${member} has voided this challenge.  No penalties were assessed.  An admin will close this channel soon.`, this.channel);
                }

                await Discord.queue(`The match at ${this.channel} has been voided.  Please close the channel.`, Discord.alertsChannel);

                if (this.channel) {
                    await this.updateTopic();
                }
            }

            if (this.details.dateConfirmed && this.details.dateClosed) {
                await Discord.queue(`The following match from ${this.details.matchTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, month: "numeric", day: "numeric", year: "numeric"})} was voided: **${this.challengingTeam.name}** ${this.details.challengingTeamScore}, **${this.challengedTeam.name}** ${this.details.challengedTeamScore}`, Discord.matchResultsChannel);
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
