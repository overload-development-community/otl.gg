/**
 * @typedef {{id?: number, challengingTeam: Team, challengedTeam: Team}} ChallengeData
 */

const DiscordJs = require("discord.js"),

    Db = require("./database"),
    Exception = require("./exception"),
    Team = require("./team"),

    channelParse = /^([0-9A-Z]{1,5})-([0-9A-Z]{1,5})-([1-9][0-9]*)$/,
    timezoneParse = /^[1-9][0-9]*, (.*)$/;

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
                fields: [
                    {
                        name: "!suggestteamsize <2|3|4>",
                        value: "Suggests a team size for the match."
                    }, {
                        name: "!confirmteamsize",
                        value: "Confirms a team size suggested by the other team."
                    }, {
                        name: "!suggesttime <month name> <day> <year>, <hh:mm> [AM|PM]",
                        value: "Suggests the date and time to play the match.  Time zone is assumed to be Pacific Time, unless the issuing pilot has used the `!timezone` command."
                    }, {
                        name: "!confirmtime",
                        value: "Confirms the date and time to play the match as suggested by the other team."
                    }, {
                        name: "!clock",
                        value: `Put this challenge on the clock.  Teams will have 28 days to get this match scheduled.  Intended for use when the other team is not responding to a challenge.  Limits apply, see ${Discord.findChannelByName("challenges")} for details.`
                    }, {
                        name: "!streaming",
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

            const otherMsg = await Discord.richQueue(new DiscordJs.RichEmbed({
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
                        name: "!streaming <URL>",
                        value: "Indicate that you will be streaming this match with the specified URL."
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
        } catch (err) {
            throw new Exception("There was a critical Discord error setting up a challenge.  Please resolve this manually as soon as possible.", err);
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
            challenges = await Db.getChallengesByTeam(team);
        } catch (err) {
            throw new Exception("There was a database error getting a team's challenges.", err);
        }

        try {
            return Promise.all(challenges.map(async (c) => new Challenge({id: c.id, challengingTeam: await Team.getById(c.challengingTeamId), challengedTeam: await Team.getById(c.challengedTeamId)})));
        } catch (err) {
            throw new Exception("There was a database error loading a team's challenges.", err);
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

    //          #     #   ##                 #
    //          #     #  #  #                #
    //  ###   ###   ###  #      ###   ###   ###    ##   ###
    // #  #  #  #  #  #  #     #  #  ##      #    # ##  #  #
    // # ##  #  #  #  #  #  #  # ##    ##    #    ##    #
    //  # #   ###   ###   ##    # #  ###      ##   ##   #
    /**
     * Adds a caster to the challenge.
     * @param {DiscordJs.GuildMember} member The caster.
     * @returns {Promise} A promise that resolves when the caster has been added to the challenge.
     */
    async addCaster(member) {
        try {
            await Db.addCasterToChallenge(this, member);
        } catch (err) {
            throw new Exception("There was a database error adding a pilot as a caster to a challenge.", err);
        }

        this.details.caster = member;

        try {
            await this.channel.overwritePermissions(
                member,
                {"VIEW_CHANNEL": true},
                `${member} is scheduled to cast this match.`
            );

            await this.updateTopic();

            await Discord.queue(`${member} is now scheduled to cast this match.`, this.channel);
        } catch (err) {
            throw new Exception("There was a critical Discord error adding a pilot as a caster to a challenge.  Please resolve this manually as soon as possible.", err);
        }
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
            await Db.addStreamerToChallenge(this, member);
        } catch (err) {
            throw new Exception("There was a database error adding a pilot as a streamer to a challenge.", err);
        }

        await this.updateTopic();
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
            dates = await Db.clockChallenge(team, this);
        } catch (err) {
            throw new Exception("There was a database error clocking a challenge.", err);
        }

        this.details.dateClocked = dates.clocked;
        this.details.dateClockDeadline = dates.clockDeadline;

        try {
            await Discord.queue(`**${team.name}** has put this challenge on the clock!  Both teams have 28 days to get this match scheduled.  If the match is not scheduled within that time, this match will be adjudicated by an admin to determine if penalties need to be assessed.`, this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error confirming a suggested neutral map for a challenge.  Please resolve this manually as soon as possible.", err);
        }
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
            this.details.dateConfirmed = await Db.confirmMatch(this);
        } catch (err) {
            throw new Exception("There was a database error confirming a reported match.", err);
        }

        try {
            const embed = new DiscordJs.RichEmbed({
                title: "Match Confirmed",
                fields: [
                    {
                        name: "Post a screenshot",
                        value: "Remember, OTL matches are only official with player statistics from a screenshot.  Be sure that at least one player posts the screenshot showing full match details, including each players' kills, assists, and deaths."
                    },
                    {
                        name: "This channel is now closed",
                        value: "No further match-related commands will be accepted.  If you need to adjust anything in this match, please notify an administrator immediately.  This channel will be closed once the stats have been posted."
                    }
                ]
            });

            const winningScore = Math.max(this.details.challengingTeamScore, this.details.challengedTeamScore),
                losingScore = Math.min(this.details.challengingTeamScore, this.details.challengedTeamScore),
                winningTeam = winningScore === this.details.challengingTeamScore ? this.challengingTeam : this.challengedTeam;

            if (winningScore === losingScore) {
                embed.setDescription(`This match has been confirmed as a **tie**, **${winningScore}** to **${losingScore}**.`);
            } else {
                embed.setDescription(`This match has been confirmed as a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.`);
                embed.setColor(winningTeam.role.color);
            }

            await Discord.richQueue(embed, this.channel);

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
            await Db.confirmTeamSizeForChallenge(this);
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
            throw new Exception("There was a critical Discord error confirming a suggested neutral map for a challenge.  Please resolve this manually as soon as possible.", err);
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
            await Db.confirmTimeForChallenge(this);
        } catch (err) {
            throw new Exception("There was a database error confirming a suggested time for a challenge.", err);
        }

        this.details.matchTime = this.details.suggestedTime;
        this.details.suggestedTime = void 0;
        this.details.suggestedTimeTeam = void 0;

        try {
            const times = {};
            for (const member of this.channel.members.values()) {
                const timezone = await member.getTimezone(),
                    yearWithTimezone = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {1: timezoneName} = timezoneParse.exec(yearWithTimezone);

                    if (timezoneName) {
                        times[timezoneName] = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
                    }
                }
            }

            for (const team of [this.challengingTeam, this.challengedTeam]) {
                const timezone = await team.getTimezone(),
                    yearWithTimezone = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {1: timezoneName} = timezoneParse.exec(yearWithTimezone);

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

            await Discord.richQueue(new DiscordJs.RichEmbed({
                description: "The time for this match has been set.",
                fields: sortedTimes.map((t) => ({name: t.timezone, value: t.displayTime}))
            }), this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error confirming a suggested neutral map for a challenge.  Please resolve this manually as soon as possible.", err);
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

    //                                      ##                 #
    //                                     #  #                #
    // ###    ##   # #    ##   # #    ##   #      ###   ###   ###    ##   ###
    // #  #  # ##  ####  #  #  # #   # ##  #     #  #  ##      #    # ##  #  #
    // #     ##    #  #  #  #  # #   ##    #  #  # ##    ##    #    ##    #
    // #      ##   #  #   ##    #     ##    ##    # #  ###      ##   ##   #
    /**
     * Removes a caster from the challenge.
     * @param {DiscordJs.GuildMember} member The caster.
     * @returns {Promise} A promise that resolves when the caster has been removed from the challenge.
     */
    async removeCaster(member) {
        if (!this.details) {
            await this.loadDetails();
        }

        try {
            await Db.removeCasterFromChallenge(this);
        } catch (err) {
            throw new Exception("There was a database error removing a pilot as a caster from a challenge.", err);
        }

        this.details.caster = void 0;

        try {
            await this.channel.overwritePermissions(
                member,
                {"VIEW_CHANNEL": null},
                `${member} is no longer scheduled to cast this match.`
            );

            await this.updateTopic();

            await Discord.queue(`${member} is no longer scheduled to cast this match.`, this.channel);
        } catch (err) {
            throw new Exception("There was a critical Discord error removing a pilot as a caster from a challenge.  Please resolve this manually as soon as possible.", err);
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
            await Db.removeStreamerFromChallenge(this, member);
        } catch (err) {
            throw new Exception("There was a database error removing a pilot as a streamer from a challenge.", err);
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
            this.details.dateReported = await Db.reportMatch(this, losingTeam, losingTeam.id === this.challengingTeam.id ? losingScore : winningScore, losingTeam.id === this.challengingTeam.id ? winningScore : losingScore);
        } catch (err) {
            throw new Exception("There was a database error removing a pilot as a streamer from a challenge.", err);
        }

        this.details.reportingTeam = losingTeam;
        this.details.challengingTeamScore = losingTeam.id === this.challengingTeam.id ? losingScore : winningScore;
        this.details.challengedTeamScore = losingTeam.id === this.challengingTeam.id ? winningScore : losingScore;

        try {
            if (winningScore === losingScore) {
                await Discord.queue(`This match has been reported as a **tie**, **${winningScore}** to **${losingScore}**.  If this is correct, **${winningTeam.name}** needs to \`!confirm\` the result.  If this was reported in error, the losing team may correct this by re-issuing the \`!report\` command with the correct score.`, this.channel);
            } else {
                await Discord.richQueue(new DiscordJs.RichEmbed({
                    description: `This match has been reported as a win for **${winningTeam.name}** by the score of **${winningScore}** to **${losingScore}**.  If this is correct, **${losingTeam.id === this.challengingTeam.id ? this.challengedTeam.name : this.challengingTeam.name}** needs to \`!confirm\` the result.  If this was reported in error, the losing team may correct this by re-issuing the \`!report\` command with the correct score.`,
                    color: winningTeam.role.color
                }), this.channel);
            }

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error suggesting a map for a challenge.  Please resolve this manually as soon as possible.", err);
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
            await Db.suggestTeamSizeForChallenge(this, team, size);
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
            await Db.suggestTimeForChallenge(this, team, date);
        } catch (err) {
            throw new Exception("There was a database error suggesting a time for a challenge.", err);
        }

        this.details.suggestedTime = date;
        this.details.suggestedTimeTeam = team;

        try {
            const times = {};
            for (const member of this.channel.members.values()) {
                const timezone = await member.getTimezone(),
                    yearWithTimezone = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {1: timezoneName} = timezoneParse.exec(yearWithTimezone);

                    if (timezoneName) {
                        times[timezoneName] = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
                    }
                }
            }

            for (const challengeTeam of [this.challengingTeam, this.challengedTeam]) {
                const timezone = await challengeTeam.getTimezone(),
                    yearWithTimezone = this.details.matchTime.toLocaleString("en-US", {timeZone: timezone, year: "numeric", timeZoneName: "long"});

                if (timezoneParse.test(yearWithTimezone)) {
                    const {1: timezoneName} = timezoneParse.exec(yearWithTimezone);

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

            await Discord.richQueue(new DiscordJs.RichEmbed({
                description: `**${team.name}** is suggesting to play the match at the time listed below.  **${(team.id === this.challengingTeam.id ? this.challengedTeam : this.challengingTeam).name}**, use \`!confirmtime\` to agree to this suggestion.`,
                fields: sortedTimes.map((t) => ({name: t.timezone, value: t.displayTime}))
            }), this.channel);

            await this.updateTopic();
        } catch (err) {
            throw new Exception("There was a critical Discord error suggesting a time for a challenge.  Please resolve this manually as soon as possible.", err);
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
        // TODO: List who will be streaming and casting the match.
        if (!this.details) {
            await this.loadDetails();
        }

        const challengingTeamTimezone = await this.challengingTeam.getTimezone(),
            challengedTeamTimezone = await this.challengedTeam.getTimezone();

        let topic = `${this.challengingTeam.name} vs ${this.challengedTeam.name}`;

        if (this.details.dateClockDeadline) {
            topic = `${topic}\n\nClock Deadline:\n${this.details.dateClockDeadline.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}${challengingTeamTimezone === challengedTeamTimezone ? "" : `\n${this.details.dateClockDeadline.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`}\nClocked by: ${this.details.clockTeam}`;
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
            topic = `${topic}\n\nMatch Time: ${this.details.matchTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}${challengingTeamTimezone === challengedTeamTimezone ? "" : `\n${this.details.matchTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`}`;
            if (this.details.suggestedTime) {
                topic = `${topic}\nSuggested Time: ${this.details.suggestedTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}${challengingTeamTimezone === challengedTeamTimezone ? "" : `\n${this.details.suggestedTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`}`;
            }
        } else if (this.details.suggestedTime) {
            topic = `${topic}\nSuggested Time: ${this.details.suggestedTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}${challengingTeamTimezone === challengedTeamTimezone ? "" : `\n${this.details.suggestedTime.toLocaleString("en-US", {timeZone: challengingTeamTimezone, month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`}`;
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
