const Db = require("./database"),
    Exception = require("./exception"),
    pjson = require("./package.json"),

    teamNameMatch = /[0-9a-zA-Z ]{3,25}/,
    teamTagMatch = /[0-9A-Z]{1,5}/;

let Discord;

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
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Initializes the class with the service to use.
     * @param {Discord} service The service to use with the commands.
     */
    constructor(service) {
        this.service = service;

        if (!Discord) {
            Discord = require("./discord");
        }
    }

    //                               ###                      #
    //                               #  #
    //  ##   #  #  ###    ##   ###   #  #  ###    ##   # #   ##     ###    ##
    // #  #  #  #  #  #  # ##  #  #  ###   #  #  #  #  ####   #    ##     # ##
    // #  #  ####  #  #  ##    #     #     #     #  #  #  #   #      ##   ##
    //  ##   ####  #  #   ##   #     #     #      ##   #  #  ###   ###     ##
    /**
     * A promise that only proceeds if the user is the owner.
     * @param {User} user The user to check.
     * @param {function} fx The function to run with the promise.
     * @returns {Promise} A promise that resolves if the user is the owner.
     */
    static ownerPromise(user, fx) {
        return new Promise((resolve, reject) => {
            if (typeof user === "string" || !Discord.isOwner(user)) {
                reject(new Error("Owner permission required to perform this command."));
                return;
            }

            if (fx) {
                new Promise(fx).then(resolve).catch(reject);
            } else {
                resolve();
            }
        });
    }

    //             #             #     #
    //             #                   #
    // #  #   ##   ###    ###   ##    ###    ##
    // #  #  # ##  #  #  ##      #     #    # ##
    // ####  ##    #  #    ##    #     #    ##
    // ####   ##   ###   ###    ###     ##   ##
    /**
     * Replies with OTL's Website URL.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    website(user, channel, message) {
        const commands = this;

        return new Promise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue("Visit http://overloadteamsleague.org for standings, stats, and more!", channel);
            resolve(true);
        });
    }

    //                           #
    //
    // # #    ##   ###    ###   ##     ##   ###
    // # #   # ##  #  #  ##      #    #  #  #  #
    // # #   ##    #       ##    #    #  #  #  #
    //  #     ##   #     ###    ###    ##   #  #
    /**
     * Replies with the current version of the bot.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    version(user, channel, message) {
        const commands = this;

        return new Promise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue(`The 4th Sovereign by roncli, Version ${pjson.version}`, channel);
            resolve(true);
        });
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    help(user, channel, message) {
        const commands = this;

        return new Promise((resolve) => {
            if (message) {
                resolve(false);
                return;
            }

            commands.service.queue(`${user}, see the documentation at http://overloadteamsleague.org/bot.`, channel);
            resolve(true);
        });
    }

    //                          #           #
    //                          #           #
    //  ##   ###    ##    ###  ###    ##   ###    ##    ###  # #
    // #     #  #  # ##  #  #   #    # ##   #    # ##  #  #  ####
    // #     #     ##    # ##   #    ##     #    ##    # ##  #  #
    //  ##   #      ##    # #    ##   ##     ##   ##    # #  #  #
    /**
     * Allows a user who is not part of a team to create a new time.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    createteam(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            if (message) {
                commands.service.queue(`Sorry, ${user}, but this command does not take any parameters.  Use \`!createteam\` by itself to begin the process of creating a team.`, channel);
                resolve(false);
                return;
            }

            Discord.userIsStartingTeam(user.id).then((isStarting) => {
                if (isStarting) {
                    commands.service.queue(`Sorry, ${user}, but you are already in the process of starting a team!  Visit #new-team-${user.id} to get started.`, channel);
                    reject(new Error("User is already in the process of starting a team."));
                    return;
                }

                Db.getTeamByUserId(user.id).then((team) => {
                    if (team) {
                        commands.service.queue(`Sorry, ${user}, but you are already on team **${team.name}**!  Visit your team channel at #${team.channelName} to talk with your teammates, or use \`!leaveteam\` to leave your current team.`, channel);
                        reject(new Error("User is already on a team."));
                        return;
                    }

                    Discord.createTeamForUser(user.id).then(() => {
                        commands.service.queue(`${user}, you have begun the process of creating a team.  Visit #new-team-${user.id} to set up your new team.`, channel);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a Discord error starting a new team for the user.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error getting the current team the user is on.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is starting a team.", err));
            });
        });
    }

    // ###    ###  # #    ##
    // #  #  #  #  ####  # ##
    // #  #  # ##  #  #  ##
    // #  #   # #  #  #   ##
    /**
     * Names a new team that's being created.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    name(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            if (!message) {
                commands.service.queue(`Sorry, ${user}, but this command cannot be used by itself.  To name your team, add the team name after the command, for example \`!name Cronus Frontier\`.`, channel);
                resolve(false);
                return;
            }

            Discord.userIsStartingTeam(user.id).then((isStarting) => {
                if (!isStarting) {
                    commands.service.queue(`Sorry, ${user}, but you cannot name a team when you're not in the process of creating one.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
                    reject(new Error("User is not in the process of starting a team."));
                    return;
                }

                if (!teamNameMatch.test(message)) {
                    commands.service.queue(`Sorry, ${user}, but to prevent abuse, you can only use alphanumeric characters and spaces and are limited to 25 characters.  In the event you need to use other characters, please name your team within the rules for now, and then contact an admin after your team is created.`);
                    reject(new Error("User used non-alphanumeric characters in their team name."));
                    return;
                }

                Db.teamNameExists(message).then((exists) => {
                    if (exists) {
                        commands.service.queue(`Sorry, ${user}, but this team name already exists!`);
                        reject(new Error("Team name already exists."));
                        return;
                    }

                    Discord.applyTeamName(user.id, message).then(() => {
                        commands.service.queue(`${user}, your team name is now set to ${message}.  Note that proper casing may be applied to your name by an admin.`, channel);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a Discord error naming a team.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error checking if the team name exists.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is starting a team.", err));
            });
        });
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    tag(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            if (!message) {
                commands.service.queue(`Sorry, ${user}, but this command cannot be used by itself.  To assign a tag to your team, add the tag after the command, for example \`!tag CF\` for a team named Cronus Frontier.`, channel);
                resolve(false);
                return;
            }

            Discord.userIsStartingTeam(user.id).then((isStarting) => {
                if (!isStarting) {
                    commands.service.queue(`Sorry, ${user}, but you cannot name a team when you're not in the process of creating one.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
                    reject(new Error("User is not in the process of starting a team."));
                    return;
                }

                message = message.toUpperCase();

                if (!teamTagMatch.test(message)) {
                    commands.service.queue(`Sorry, ${user}, but you can only use alphanumeric characters, and are limited to 5 characters.`);
                    reject(new Error("User used non-alphanumeric characters in their team tag."));
                    return;
                }

                Db.teamTagExists(message).then((exists) => {
                    if (exists) {
                        commands.service.queue(`Sorry, ${user}, but this team tag already exists!`);
                        reject(new Error("Team tag already exists."));
                        return;
                    }

                    Discord.applyTeamTag(user.id, message).then(() => {
                        commands.service.queue(`${user}, your team tag is now set to ${message}.`, channel);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a Discord error naming a team.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error checking if the team name exists.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is starting a team.", err));
            });
        });
    }
}

module.exports = Commands;
