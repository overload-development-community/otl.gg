/**
 * @typedef {{id?: number, challengingTeam: Team, challengedTeam: Team}} ChallengeData
 */

const DiscordJs = require("discord.js"),

    Db = require("./database"),
    Exception = require("./exception"),
    Team = require("./team"),
    settings = require("./settings"),

    channelParse = /^([0-9A-Z]{1,5})-([0-9A-Z]{1,5})-([1-9][0-9]*)$/;

/**
 * @type {typeof import("./discord")}
 */
let Discord;

setTimeout(() => {
    Discord = require("./discord");
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
     * @returns {Promise<Challenge>} A promise that resolves with the newly created challenge.
     */
    static async create(challengingTeam, challengedTeam) {
        let data;
        try {
            data = await Db.createChallenge(challengingTeam, challengedTeam);
        } catch (err) {
            throw new Exception("There was a database error getting a challenge by teams.", err);
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

            await challenge.channel.setTopic(`${challengingTeam.name} vs ${challengedTeam.name}\n\nOrange Team: ${data.orangeTeam.tag}\nBlue Team: ${data.blueTeam.tag}\n\nHome Map Team: ${data.homeMapTeam.tag}\nHome Server Team: ${data.homeServerTeam.tag}`);

            const mapEmbed = new DiscordJs.RichEmbed({
                title: "Challenge commands - Map",
                description: `**${data.homeMapTeam.tag}** is the home map team, so **${(data.homeMapTeam.tag === challengingTeam.tag ? challengedTeam : challengingTeam).tag}** must choose from one of the following home maps:\n${(await data.homeMapTeam.getHomeMaps()).map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}`,
                color: data.homeMapTeam.role.color,
                timestamp: new Date(),
                fields: [
                    {
                        name: "!pickmap <a|b|c>",
                        value: "Pick the map to play.  Locks the map for the match."
                    }
                ]
            });

            if (!data.team1Penalized && !data.team2Penalized) {
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

            const serverEmbed = new DiscordJs.RichEmbed({
                title: "Challenge commands - Server",
                description: `**${data.homeServerTeam.tag}** is the home server team, which means ${data.homeServerTeam.tag} chooses which two players start the match in an effort to select a specific server.`,
                color: data.homeServerTeam.role.color,
                timestamp: new Date(),
                fields: []
            });

            if (!data.team1Penalized && !data.team2Penalized) {
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

            const optionsMsg = await Discord.richQueue(new DiscordJs.RichEmbed({
                title: "Challenge commands - Options",
                description: "Challenges must also have a team size and scheduled time to play.",
                timestamp: new Date(),
                fields: [
                    {
                        name: "!suggestteamsize <2|3|4>",
                        value: "Suggests a team size for the match."
                    }, {
                        name: "!confirmteamsize",
                        value: "Confirms a team size suggested by the other team."
                    }, {
                        name: "!suggesttime <date> <time>",
                        value: "Suggests the date and time to play the match.  Time zone is assumed to be Pacific Time, unless the issuing pilot has used the `!timezone` command."
                    }, {
                        name: "!confirmtime",
                        value: "Confirms the date and time to play the match as suggested by the other team."
                    }, {
                        name: "!clock",
                        value: `Put this challenge on the clock.  Teams will have 28 days to get this match scheduled.  Intended for use when the other team is not responding to a challenge.  Limits apply, see ${Discord.findChannelByName("challenges")} for details.`
                    }, {
                        name: "!streaming <URL>",
                        value: "Indicates that a pilot will be streaming the match live."
                    }, {
                        name: "!notstreaming",
                        value: "Indicates that a pilot will not be streaming the match live, which is the default setting."
                    }
                ]
            }), challenge.channel);

            if (optionsMsg) {
                await optionsMsg.pin();
            }

            const reportMsg = await Discord.richQueue(new DiscordJs.RichEmbed({
                title: "Challenge commands - Reporting",
                description: "Upon completion of the match, the losing team reports the game.",
                timestamp: new Date(),
                fields: [
                    {
                        name: "!report <score> <score>",
                        value: "Reports the score for the match.  Losing team must report the match."
                    }, {
                        name: "!confirm",
                        value: "Confirms the reported score by the other team."
                    }, {
                        name: "Screenshot required!",
                        value: "At least one player must post a screenshot of the final score screen, which includes each player's individual performance.  Games reported without a screenshot will not be counted."
                    }
                ]
            }), challenge.channel);

            if (reportMsg) {
                await reportMsg.pin();
            }

            if (data.team1Penalized && data.team2Penalized) {
                await Discord.queue("Penalties have been applied to both teams for this match.  Neutral map and server selection is disabled.", challenge.channel);
            } else if (data.team1Penalized) {
                await Discord.queue(`A penalty has been applied to **${challengingTeam.tag}** for this match.  Neutral map and server selection is disabled.`, challenge.channel);
            } else if (data.team2Penalized) {
                await Discord.queue(`A penalty has been applied to **${challengedTeam.tag}** for this match.  Neutral map and server selection is disabled.`, challenge.channel);
            }
        } catch (err) {
            throw new Exception("There was a critical Discord error setting up a challenge.  Please resolve this manually as soon as possible.", err);
        }

        return challenge;
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

        const {1: challengingTeamTag, 2: challengedTeamTag, 3: id} = channelParse.exec(channel.name);

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
            data = await Db.getChallengeByTeams(team1, team2);
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
            await Db.confirmMapForChallenge(this);
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
            await Db.confirmNeutralServerForChallenge(this);
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
            details = await Db.getChallengeDetails(this);
        } catch (err) {
            throw new Exception("There was a database error loading details for a challenge.", err);
        }

        this.details = {
            orangeTeam: details.orangeTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            blueTeam: details.blueTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            map: details.map,
            teamSize: details.teamSize,
            matchTime: details.matchTime,
            homeMapTeam: details.homeMapTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            homeServerTeam: details.homeServerTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            adminCreated: details.adminCreated,
            homesLocked: details.homesLocked,
            usingHomeMapTeam: details.usingHomeMapTeam,
            usingHomeServerTeam: details.usingHomeServerTeam,
            challengingTeamPenalized: details.challengingTeamPenalized,
            challengedTeamPenalized: details.challengedTeamPenalized,
            suggestedMap: details.suggestedMap,
            suggestedMapTeam: details.suggestedMapTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            suggestedNeutralServerTeam: details.suggestedNeutralServerTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            suggestedTeamSize: details.suggestedTeamSize,
            suggestedTeamSizeTeam: details.suggestedTeamSizeTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            suggestedTime: details.suggestedTime,
            suggestedTimeTeam: details.suggestedTimeTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            reportingTeam: details.reportingTeamId === this.challengingTeam.id ? this.challengingTeam : this.challengedTeam,
            challengingTeamScore: details.challengingTeamScore,
            challengedTeamScore: details.challengedTeamScore,
            dateAdded: details.dateAdded,
            dateClocked: details.dateClocked,
            dateClockDeadline: details.dateClockDeadline,
            dateClockDeadlineNotified: details.dateClockDeadlineNotified,
            dateReported: details.dateReported,
            dateConfirmed: details.dateConfirmed,
            dateClosed: details.dateClosed,
            dateVoided: details.dateVoided,
            homeMaps: details.homeMaps
        };
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
            this.details.map = await Db.pickMapForChallenge(this, number);
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
            await Db.suggestMapForChallenge(this, team, map);
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
            await Db.suggestNeutralServerForChallenge(this, team);
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
        if (!this.details) {
            await this.loadDetails();
        }

        let topic = `${this.challengingTeam.name} vs ${this.challengedTeam.name}`;

        if (this.details.dateClockDeadline) {
            topic = `${topic}\n\nClock Deadline: ${this.details.dateClockDeadline.toLocaleString("en-US", {timeZone: settings.defaultTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`;
        }

        topic = `${topic}\n\nOrange Team: ${this.details.orangeTeam.tag}\nBlue Team: ${this.details.blueTeam.tag}`;

        topic = `${topic}\n\nHome Map Team: ${this.details.usingHomeMapTeam ? this.details.homeMapTeam.tag : "Neutral"}`;

        if (this.details.map) {
            topic = `${topic}\nChosen Map: ${this.details.map}`;
        } else if (this.details.suggestedMap) {
            topic = `${topic}\nSuggested Map: ${this.details.suggestedMap} by ${this.details.suggestedMapTeam.tag}`;
        }

        topic = `${topic}\n\nHome Server Team: ${this.details.usingHomeServerTeam ? this.details.homeServerTeam.tag : "Neutral"}`;

        if (this.details.suggestedNeutralServerTeam) {
            topic = `${topic}\nNeutral Server Suggested by ${this.details.suggestedNeutralServerTeam}`;
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
            topic = `${topic}\n\nMatch Time: ${this.details.matchTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`;
            if (this.details.suggestedTime) {
                topic = `${topic}\nSuggested Time: ${this.details.suggestedTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`;
            }
        } else if (this.details.suggestedTime) {
            topic = `${topic}\n\nSuggested Time: ${this.details.suggestedTime.toLocaleString("en-US", {timeZone: settings.defaultTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`;
        }

        if (this.details.dateReported && !this.details.dateConfirmed) {
            topic = `${topic}\n\nReported Score: ${this.challengingTeam.tag} ${this.details.challengingTeamScore}, ${this.challengedTeam.tag} ${this.details.challengedTeamScore}, reported by ${this.details.reportingTeam.tag}`;
        } else if (this.details.dateConfirmed) {
            topic = `${topic}\n\nFinal Score: ${this.challengingTeam.tag} ${this.details.challengingTeamScore}, ${this.challengedTeam.tag} ${this.details.challengedTeamScore}`;
        }

        await this.channel.setTopic(topic);
    }
}

module.exports = Challenge;
