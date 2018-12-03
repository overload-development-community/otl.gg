/**
 * @typedef {{id?: number, challengingTeam: Team, challengedTeam: Team}} ChallengeData
 */

const DiscordJs = require("discord.js"),

    Db = require("./database"),
    Exception = require("./exception"),
    Log = require("./log"),
    Team = require("./team");

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
}

module.exports = Challenge;
