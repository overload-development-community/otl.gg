const Db = require("./database"),
    Exception = require("./exception"),
    pjson = require("./package.json"),

    colorMatch = /^(?:dark |light )?(?:red|orange|yellow|green|aqua|blue|purple)$/,
    idParse = /^<@!?([0-9]+)>$/,
    idConfirmParse = /^<@!?([0-9]+)>(?: (confirm))?$/,
    mapMatch = /^([123]) (.+)$/,
    nameConfirmParse = /^@?(.+)(?: (confirm))?$/,
    teamNameMatch = /^[0-9a-zA-Z ]{3,25}$/,
    teamTagMatch = /^[0-9A-Z]{1,5}$/;

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

            commands.service.queue(`We are The Fourth Sovereign, we are trillions.  By roncli, Version ${pjson.version}`, channel);
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

            Discord.userIsStartingTeam(user).then((isStarting) => {
                if (isStarting) {
                    commands.service.queue(`Sorry, ${user}, but you are already in the process of starting a team!  Visit #new-team-${user.id} to get started.`, channel);
                    reject(new Error("User is already in the process of starting a team."));
                    return;
                }

                Db.getTeam(user).then((team) => {
                    if (team) {
                        commands.service.queue(`Sorry, ${user}, but you are already on team **${team.name}**!  Visit your team channel at #${team.channelName.toLowerCase()} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
                        reject(new Error("User is already on a team."));
                        return;
                    }

                    Db.joinTeamDeniedUntil(user).then((deniedUntil) => {
                        if (deniedUntil) {
                            commands.service.queue(`Sorry, ${user}, but you have accepted an invitation in the past 28 days.  You will be able to create a new team on ${deniedUntil.toUTCString()}`, channel);
                            reject(new Error("User not allowed to create a new team."));
                            return;
                        }

                        Discord.startCreateTeam(user).then(() => {
                            commands.service.queue(`${user}, you have begun the process of creating a team.  Visit #new-team-${user.id} to set up your new team.`, channel);
                            resolve(true);
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a Discord error starting a new team for the user.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error getting when a user has to wait to accept an invite.", err));
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

            Discord.userIsStartingTeam(user).then((isStarting) => {
                if (!isStarting) {
                    commands.service.queue(`Sorry, ${user}, but you cannot name a team when you're not in the process of creating one.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
                    reject(new Error("User is not in the process of starting a team."));
                    return;
                }

                if (!teamNameMatch.test(message)) {
                    commands.service.queue(`Sorry, ${user}, but to prevent abuse, you can only use alphanumeric characters and spaces and are limited to 25 characters.  In the event you need to use other characters, please name your team within the rules for now, and then contact an admin after your team is created.`, channel);
                    reject(new Error("User used non-alphanumeric characters in their team name."));
                    return;
                }

                Discord.teamNameExists(message).then((exists) => {
                    if (exists) {
                        commands.service.queue(`Sorry, ${user}, but this team name already exists!`, channel);
                        reject(new Error("Team name already exists."));
                        return;
                    }

                    Discord.applyTeamName(user, message).then(() => {
                        commands.service.queue(`${user}, your team name is now set to ${message}.  Note that proper casing may be applied to your name by an admin.`, channel);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a Discord error naming a team.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a Discord error checking if the team name exists.", err));
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

            Discord.userIsStartingTeam(user).then((isStarting) => {
                if (!isStarting) {
                    commands.service.queue(`Sorry, ${user}, but you cannot name a team when you're not in the process of creating one.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
                    reject(new Error("User is not in the process of starting a team."));
                    return;
                }

                message = message.toUpperCase();

                if (!teamTagMatch.test(message)) {
                    commands.service.queue(`Sorry, ${user}, but you can only use alphanumeric characters, and are limited to 5 characters.`, channel);
                    reject(new Error("User used non-alphanumeric characters in their team tag."));
                    return;
                }

                Db.teamTagExists(message).then((exists) => {
                    if (exists) {
                        commands.service.queue(`Sorry, ${user}, but this team tag already exists!`, channel);
                        reject(new Error("Team tag already exists."));
                        return;
                    }

                    Discord.applyTeamTag(user, message).then(() => {
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

    //                               ##
    //                                #
    //  ##    ###  ###    ##    ##    #
    // #     #  #  #  #  #     # ##   #
    // #     # ##  #  #  #     ##     #
    //  ##    # #  #  #   ##    ##   ###
    /**
     * Cancels a new team request.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    cancel(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsStartingTeam(user).then((isStarting) => {
                if (!isStarting) {
                    commands.service.queue(`Sorry, ${user}, but you cannot cancel new team creation when you're not in the process of creating one.`, channel);
                    reject(new Error("User is not in the process of starting a team."));
                    return;
                }

                if (!message) {
                    commands.service.queue(`${user}, are you sure you want to cancel your new team request?  There is no undoing this action!  Type \`!cancel confirm\` to confirm.`, channel);
                    resolve(true);
                    return;
                }

                if (message !== "confirm") {
                    commands.service.queue(`Sorry, ${user}, but you must type \`!cancel confirm\` to confirm that you wish to cancel your request to create a team.`, channel);
                    resolve(false);
                    return;
                }

                Discord.cancelCreateTeam(user).then(() => {
                    commands.service.queue("Your request to create a team has been cancelled.", user);
                    resolve(true);
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a Discord error cancelling the create team process.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is starting a team.", err));
            });
        });
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    complete(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsStartingTeam(user).then((isStarting) => {
                if (!isStarting) {
                    commands.service.queue(`Sorry, ${user}, but you cannot complete creating a team when you're not in the process of creating one.`, channel);
                    reject(new Error("User is not in the process of starting a team."));
                    return;
                }

                Discord.readyToCreateTeam(user).then((isReady, name, tag) => {
                    if (!isReady) {
                        commands.service.queue(`Sorry, ${user}, but you must use the \`!name\` and \`!tag\` commands to give your team a name and a tag before completing your request to create a team.`, channel);
                        reject(new Error("User is not in the process of starting a team."));
                        return;
                    }

                    if (!message) {
                        commands.service.queue(`${user}, are you sure you want to complete your request to create a team?  There is no undoing this action!  Type \`!complete confirm\` to confirm.`, channel);
                        resolve(true);
                        return;
                    }

                    if (message !== "confirm") {
                        commands.service.queue(`Sorry, ${user}, but you must type \`!complete confirm\` to confirm that you wish to complete your request to create a team.`, channel);
                        resolve(false);
                        return;
                    }

                    Db.teamNameOrTagNameExists(name, tag).then((teamNameExists, tagNameExists) => {
                        if (teamNameExists) {
                            commands.service.queue(`Sorry, ${user}, but this team name already exists!  You'll need to use the \`!name\` command to try another.`, channel);
                            reject(new Error("Team name already exists."));
                            return;
                        }

                        if (tagNameExists) {
                            commands.service.queue(`Sorry, ${user}, but this team tag already exists!  You'll need to use the \`!tag\` command to try another.`, channel);
                            reject(new Error("Team tag already exists."));
                            return;
                        }

                        Db.createTeam(user, name, tag).then(() => {
                            Discord.createTeam(user, name, tag).then(() => {
                                commands.service.queue(`Congratulations, ${user}!  Your team has been created!  You may now visit #team-${tag.toLowerCase()} for team chat, and #team-${tag.toLowerCase()}-captains for private chat with your team captains as well as system notifications for your team.`, user);
                                resolve(true);
                            }).catch((err) => {
                                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                reject(new Exception("There was a critical Discord error creating a team.  Please resolve this manually as soon as possible.", err));
                            });
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a database error creating a team.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error checking if the team name exists.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a Discord error checking if the user is ready to create their team.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is starting a team.", err));
            });
        });
    }

    //             ##
    //              #
    //  ##    ##    #     ##   ###
    // #     #  #   #    #  #  #  #
    // #     #  #   #    #  #  #
    //  ##    ##   ###    ##   #
    /**
     * Assigns a color to the team's Discord role.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    color(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsFounder(user).then((isFounder) => {
                if (!isFounder) {
                    commands.service.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
                    reject(new Error("User is not a founder."));
                    return;
                }

                if (!message) {
                    commands.service.queue("You can use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter `!color dark green`.", channel);
                    resolve(true);
                    return;
                }

                if (!colorMatch.test(message)) {
                    commands.service.queue(`Sorry, ${user}, but you can only use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter \`!color dark green\`.`, channel);
                    reject(new Error("Invalid color."));
                    return;
                }

                Db.getTeam(user).then((team) => {
                    if (!team) {
                        commands.service.queue(`Sorry, ${user}, but you must be on a team to use this command.`, channel);
                        reject(new Error("User not on a team."));
                        return;
                    }

                    const colors = message.split(" ");
                    let color;

                    switch (colors[colors.length === 1 ? 0 : 1]) {
                        case "red":
                            switch (colors[0]) {
                                case "dark":
                                    color = "#800000";
                                    break;
                                case "light":
                                    color = "#FF8080";
                                    break;
                                default:
                                    color = "#FF0000";
                                    break;
                            }
                            break;
                        case "orange":
                            switch (colors[0]) {
                                case "dark":
                                    color = "#804000";
                                    break;
                                case "light":
                                    color = "#FFC080";
                                    break;
                                default:
                                    color = "#FF8000";
                                    break;
                            }
                            break;
                        case "yellow":
                            switch (colors[0]) {
                                case "dark":
                                    color = "#808000";
                                    break;
                                case "light":
                                    color = "#FFFF80";
                                    break;
                                default:
                                    color = "#FFFF00";
                                    break;
                            }
                            break;
                        case "green":
                            switch (colors[0]) {
                                case "dark":
                                    color = "#008000";
                                    break;
                                case "light":
                                    color = "#80FF80";
                                    break;
                                default:
                                    color = "#00FF00";
                                    break;
                            }
                            break;
                        case "aqua":
                            switch (colors[0]) {
                                case "dark":
                                    color = "#008080";
                                    break;
                                case "light":
                                    color = "#80FFFF";
                                    break;
                                default:
                                    color = "#00FFFF";
                                    break;
                            }
                            break;
                        case "blue":
                            switch (colors[0]) {
                                case "dark":
                                    color = "#000080";
                                    break;
                                case "light":
                                    color = "#8080FF";
                                    break;
                                default:
                                    color = "#0000FF";
                                    break;
                            }
                            break;
                        case "purple":
                            switch (colors[0]) {
                                case "dark":
                                    color = "#800080";
                                    break;
                                case "light":
                                    color = "#FF80FF";
                                    break;
                                default:
                                    color = "#FF00FF";
                                    break;
                            }
                            break;
                    }

                    Discord.changeTeamColor(user, color).then(() => {
                        commands.service.queue(`${user}, your team's color has been updated.`, channel);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a Discord error changing a team's color.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error getting the current team the user is on.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is a team founder.", err));
            });
        });
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    addcaptain(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsFounder(user).then((isFounder) => {
                if (!isFounder) {
                    commands.service.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
                    reject(new Error("User is not a founder."));
                    return;
                }

                if (!message) {
                    commands.service.queue(`Sorry, ${user}, but you must mention the pilot on your team that you wish to add as a captain.`, channel);
                    resolve(false);
                    return;
                }

                Discord.captainCountOnUserTeam(user).then((captainCount) => {
                    if (captainCount >= 2) {
                        commands.service.queue(`Sorry, ${user}, but you already have ${captainCount} captains, and the limit is 2.`, channel);
                        reject(new Error("Captain count limit reached."));
                        return;
                    }

                    let captain;

                    if (idParse.test(message)) {
                        const {1: userId} = idParse.exec(message);

                        captain = Discord.findGuildMemberById(userId);
                    } else {
                        captain = Discord.findGuildMemberByDisplayName(message);
                    }

                    if (!captain) {
                        commands.service.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to add as a captain.`, channel);
                        reject(new Error("User not found."));
                        return;
                    }

                    if (captain.id === user.id) {
                        commands.service.queue(`Sorry, ${user}, but you can't promote yourself to captain!`, channel);
                        reject(new Error("User can't promote themselves."));
                        return;
                    }

                    Discord.usersAreOnTheSameTeam(user, captain).then((sameTeam) => {
                        if (!sameTeam) {
                            commands.service.queue(`Sorry, ${user}, but you can only add a captain if they are on your team.`, channel);
                            reject(new Error("Users are not on the same team."));
                            return;
                        }

                        Discord.userIsCaptainOrFounder(captain).then((isCaptain) => {
                            if (isCaptain) {
                                commands.service.queue(`Sorry, ${user}, but ${captain.displayName} is already a captain!`, channel);
                                reject(new Error("Pilot is already a captain."));
                                return;
                            }

                            Db.addCaptain(user, captain).then(() => {
                                Discord.addCaptain(user, captain).then(() => {
                                    commands.service.queue(`${user}, ${captain.displayName} is now a team captain!`, channel);
                                    resolve(true);
                                }).catch((err) => {
                                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                    reject(new Exception("There was a critical Discord error adding a captain.  Please resolve this manually as soon as possible.", err));
                                });
                            }).catch((err) => {
                                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                reject(new Exception("There was a database error adding a captain.", err));
                            });
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a Discord error getting whether a user is a team founder or captin.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a Discord error checking whether two users are on the same team.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a Discord error getting the number of captains for the user's team.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is a team founder.", err));
            });
        });
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    removecaptain(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsFounder(user).then((isFounder) => {
                if (!isFounder) {
                    commands.service.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
                    reject(new Error("User is not a founder."));
                    return;
                }

                if (!message) {
                    commands.service.queue(`Sorry, ${user}, but you must mention the pilot on your team that you wish to remove as a captain.`, channel);
                    resolve(false);
                    return;
                }

                let captain;

                if (idParse.test(message)) {
                    const {1: userId} = idParse.exec(message);

                    captain = Discord.findGuildMemberById(userId);
                } else {
                    captain = Discord.findGuildMemberByDisplayName(message);
                }

                if (!captain) {
                    commands.service.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to remove as a captain.`, channel);
                    reject(new Error("User not found."));
                    return;
                }

                Discord.usersAreOnTheSameTeam(user, captain).then((sameTeam) => {
                    if (!sameTeam) {
                        commands.service.queue(`Sorry, ${user}, but you can only remove a captain if they are on your team.`, channel);
                        reject(new Error("Users are not on the same team."));
                        return;
                    }

                    Discord.userIsCaptainOrFounder(captain).then((isCaptain) => {
                        if (!isCaptain) {
                            commands.service.queue(`Sorry, ${user}, but ${captain.displayName} is not a captain!`, channel);
                            reject(new Error("Pilot is already a captain."));
                            return;
                        }

                        Db.removeCaptain(user, captain).then(() => {
                            Discord.removeCaptain(user, captain).then(() => {
                                commands.service.queue(`${user}, ${captain.displayName} is no longer a team captain.`, channel);
                                resolve(true);
                            }).catch((err) => {
                                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                reject(new Exception("There was a critical Discord error removing a captain.  Please resolve this manually as soon as possible.", err));
                            });
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a database error removing a captain.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a Discord error getting whether a user is a team founder or captin.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a Discord error checking whether two users are on the same team.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is a team founder.", err));
            });
        });
    }

    //    #   #           #                    #
    //    #               #                    #
    //  ###  ##     ###   ###    ###  ###    ###
    // #  #   #    ##     #  #  #  #  #  #  #  #
    // #  #   #      ##   #  #  # ##  #  #  #  #
    //  ###  ###   ###    ###    # #  #  #   ###
    /**
     * Disbands a team.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    disband(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsFounder(user).then((isFounder) => {
                if (!isFounder) {
                    commands.service.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
                    reject(new Error("User is not a founder."));
                    return;
                }

                if (!message) {
                    commands.service.queue(`${user}, are you sure you want to disband your team?  There is no undoing this action!  Type \`!disband confirm\` to confirm.`, channel);
                    resolve(true);
                    return;
                }

                if (message !== "confirm") {
                    commands.service.queue(`Sorry, ${user}, but you must type \`!disband confirm\` to confirm that you wish to disband your team.`, channel);
                    resolve(false);
                    return;
                }

                Db.disbandTeam(user).then(() => {
                    Discord.disbandTeam(user).then(() => {
                        commands.service.queue("You have successfully disbanded your team.  Note that you or anyone else who has been founder or captain of your team in the past may `!reinstate` your team.", user);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a critical Discord error disbanding a team.  Please resolve this manually as soon as possible.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error disbanding a team.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is a team founder.", err));
            });
        });
    }

    //              #                  #           #
    //                                 #           #
    // ###    ##   ##    ###    ###   ###    ###  ###    ##
    // #  #  # ##   #    #  #  ##      #    #  #   #    # ##
    // #     ##     #    #  #    ##    #    # ##   #    ##
    // #      ##   ###   #  #  ###      ##   # #    ##   ##
    /**
     * Sets a team's home map.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    reinstate(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            if (!message) {
                commands.service.queue("You must include the name of the team you wish to reinstate.", channel);
                resolve(false);
                return;
            }

            Db.getTeam(user).then((currentTeam) => {
                if (currentTeam) {
                    commands.service.queue(`Sorry, ${user}, but you are already on team **${currentTeam.name}**!  Visit your team channel at #${currentTeam.channelName.toLowerCase()} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
                    reject(new Error("User is already on a team."));
                    return;
                }

                Db.getTeamByTagOrName(message).then((team) => {
                    if (!team) {
                        commands.service.queue(`Sorry, ${user}, but I have no record of that team ever existing.`, channel);
                        reject(new Error("Team does not exist."));
                        return;
                    }

                    if (!team.disbanded) {
                        commands.service.queue(`Sorry, ${user}, but you can't reinstate a team that isn't disbanded.`, channel);
                        reject(new Error("Team is not disbanded."));
                        return;
                    }

                    Db.userWasPreviousCaptainOrFounderOfTeam(user, team).then((wasCaptain) => {
                        if (!wasCaptain) {
                            commands.service.queue(`Sorry, ${user}, but you must have been a captain or founder of the team you are trying to reinstate.`, channel);
                            reject(new Error("Team does not exist."));
                            return;
                        }

                        Db.reinstateTeam(team).then(() => {
                            Discord.reinstateTeam(team).then(() => {
                                commands.service.queue(`Congratulations, ${user}!  Your team has been reinstated!  You may now visit #team-${team.tag.toLowerCase()} for team chat, and #team-${team.tag.toLowerCase()}-captains for private chat with your team captains as well as system notifications for your team.`, user);
                                resolve(true);
                            }).catch((err) => {
                                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                reject(new Exception("There was a critical Discord error reinstating a team.  Please resolve this manually as soon as possible.", err));
                            });
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a database error reinstating a team.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error checking if the user was a captain or founder of a team.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error getting a team.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a database error getting the team the user is on.", err));
            });
        });
    }

    // #
    // #
    // ###    ##   # #    ##
    // #  #  #  #  ####  # ##
    // #  #  #  #  #  #  ##
    // #  #   ##   #  #   ##
    /**
     * Sets a team's home map.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    home(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsCaptainOrFounder(user).then((isCaptain) => {
                if (!isCaptain) {
                    commands.service.queue(`Sorry, ${user}, but you must be a team captain or founder to use this command.`, channel);
                    reject(new Error("User is not a founder or captain."));
                    return;
                }

                if (!message) {
                    commands.service.queue("To set one of your three home maps, you must include the home number you wish to set, followed by the name of the map.  For instance, to set your second home map to Vault, enter the following command: `!home 2 Vault`", channel);
                    resolve(true);
                    return;
                }

                if (!mapMatch.test(message)) {
                    commands.service.queue(`Sorry, ${user}, but you must include the home number you wish to set, followed by the name of the map, such as \`!home 2 Vault\`.`, channel);
                    reject(new Error("User is not a founder or captain."));
                    return;
                }

                const {1: number, 2: map} = mapMatch.exec(message);

                Db.getTeamHomeMaps(user).then((homes) => {
                    if (homes.indexOf(map) !== -1) {
                        commands.service.queue(`Sorry, ${user}, but you already have this map set as your home.`, channel);
                        reject(new Error("Team already has this home map set."));
                        return;
                    }

                    Db.applyHomeMap(user, number, map).then(() => {
                        Discord.updateUserTeam(user);
                        commands.service.queue(`${user}, your home map has been set.  Note this only applies to future challenges, any current challenges you have will use the home maps you had at the time of the challenge.`, channel);
                        resolve(true);
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error setting a home map for the team the user is on.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error getting the home maps for the team the user is on.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is a team founder or captin.", err));
            });
        });
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    request(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Db.getTeam(user).then((currentTeam) => {
                if (currentTeam) {
                    commands.service.queue(`Sorry, ${user}, but you are already on team **${currentTeam.name}**!  Visit your team channel at #${currentTeam.channelName.toLowerCase()} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
                    reject(new Error("User is already on a team."));
                    return;
                }

                if (!message) {
                    commands.service.queue("You must include the name of the team you want to send a join request to.", channel);
                    resolve(false);
                    return;
                }

                Db.getTeamByTagOrName(message).then((team) => {
                    if (!team) {
                        commands.service.queue(`Sorry, ${user}, but I have no record of that team ever existing.`, channel);
                        reject(new Error("Team does not exist."));
                        return;
                    }

                    if (team.disbanded) {
                        commands.service.queue(`Sorry, ${user}, but that team has disbanded.  A former captain or founder may reinstate the team with the \`!reinstate ${team.tag}\` command.`, channel);
                        reject(new Error("Team is disbanded."));
                        return;
                    }

                    Db.userHasAlreadyRequestedTeam(user, team).then((hasRequested) => {
                        if (hasRequested) {
                            commands.service.queue(`Sorry, ${user}, but to prevent abuse, you may only requeset to join a team once.`, channel);
                            reject(new Error("Request already exists."));
                            return;
                        }

                        Db.requestTeam(user, team).then(() => {
                            Discord.requestTeam(user, team).then(() => {
                                commands.service.queue(`${user}, your request has been sent to join ${team.name}.  The team's leadership has been notified of this request.`, channel);
                                resolve(true);
                            }).catch((err) => {
                                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                reject(new Exception("There was a critical Discord error requesting to join a team.  Please resolve this manually as soon as possible.", err));
                            });
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a database error requesting to join a team.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error checking if a player has already requested to join a team.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error getting a team.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a database error getting the team the user is on.", err));
            });
        });
    }

    //  #                 #     #
    //                          #
    // ##    ###   # #   ##    ###    ##
    //  #    #  #  # #    #     #    # ##
    //  #    #  #  # #    #     #    ##
    // ###   #  #   #    ###     ##   ##
    /**
     * Invites a player to a team.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    invite(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsCaptainOrFounder(user).then((isCaptain) => {
                if (!isCaptain) {
                    commands.service.queue(`Sorry, ${user}, but you must be a team captain or founder to use this command.`, channel);
                    reject(new Error("User is not a founder or captain."));
                    return;
                }

                Db.getTeamPlayerAndInvitedCount(user).then((playerCount) => {
                    if (playerCount >= 8) {
                        commands.service.queue(`Sorry, ${user}, but there is a maximum of 8 pilots per roster, and your team currently has ${playerCount}.`, channel);
                        reject(new Error("Roster is full."));
                        return;
                    }

                    let player;

                    if (idParse.test(message)) {
                        const {1: userId} = idParse.exec(message);

                        player = Discord.findGuildMemberById(userId);
                    } else {
                        player = Discord.findGuildMemberByDisplayName(message);
                    }

                    if (!player) {
                        commands.service.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to invite.`, channel);
                        reject(new Error("User not found."));
                        return;
                    }

                    Db.userTeamHasInvitedPlayer(user, player).then((invited) => {
                        if (invited) {
                            commands.service.queue(`Sorry, ${user}, but to prevent abuse you can only invite a pilot to your team once.  If ${player.displayName} has not responded yet, ask them to \`!accept\` the invitation.`, channel);
                            reject(new Error("Player already invited."));
                            return;
                        }

                        Db.getTeam(player).then((team) => {
                            if (team) {
                                commands.service.queue(`Sorry, ${user}, but ${player.displayName} is already on another team!`, channel);
                                reject(new Error("Player already on another team."));
                                return;
                            }

                            Db.invitePlayerToTeam(user, player).then(() => {
                                Discord.invitePlayerToTeam(user, player).then(() => {
                                    commands.service.queue(`${user}, ${player.displayName} has been invited to your team.`, channel);
                                    resolve(true);
                                }).catch((err) => {
                                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                    reject(new Exception("There was a critical Discord error inviting a player to a team.  Please resolve this manually as soon as possible.", err));
                                });
                            }).catch((err) => {
                                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                reject(new Exception("There was a database error inviting a player to a team.", err));
                            });
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a database error getting the current team the user is on.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error checking if a player was already invited to a team.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error getting the number of players on and invited to a user's team.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is a team founder or captin.", err));
            });
        });
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    accept(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Db.getTeam(user).then((currentTeam) => {
                if (currentTeam) {
                    commands.service.queue(`Sorry, ${user}, but you are already on team **${currentTeam.name}**!  Visit your team channel at #${currentTeam.channelName.toLowerCase()} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
                    reject(new Error("User is already on a team."));
                    return;
                }

                if (!message) {
                    commands.service.queue(`Sorry, ${user}, but you must include the name or tag of the team you wish to accept an invitation from.  For example, if you wish to accept an invitation from Cronus Frontier, use either \`!accept Cronus Frontier\` or \`!accept CF\`.`, channel);
                    resolve(false);
                    return;
                }

                const {1: name, 2: confirm} = nameConfirmParse.exec(message);

                Db.userIsInvitedToTeam(user, name).then((team) => {
                    if (!team) {
                        commands.service.queue(`Sorry, ${user}, but you don't have a pending invitation to ${name}.`, channel);
                        reject(new Error("User does not have an invitation to accept."));
                        return;
                    }

                    Db.joinTeamDeniedUntil(user).then((deniedUntil) => {
                        if (deniedUntil) {
                            commands.service.queue(`Sorry, ${user}, but you have accepted an invitation in the past 28 days.  You will be able to join a new team on ${deniedUntil.toUTCString()}`, channel);
                            reject(new Error("User not allowed to accept an invite."));
                            return;
                        }

                        Db.userBannedFromTeamUntil(user, team).then((bannedUntil) => {
                            if (bannedUntil) {
                                commands.service.queue(`Sorry, ${user}, but you have left this team within the past 28 days.  You will be able to join this team again on ${bannedUntil.toUTCString()}`, channel);
                                reject(new Error("User not allowed to accept an invite from this team."));
                                return;
                            }

                            if (!confirm) {
                                commands.service.queue(`${user}, are you sure you want to join **${team.name}**?  Type \`!accept confirm\` to confirm.  Note that you will not be able to accept another invitation or create a team for 28 days.`, channel);
                                resolve(true);
                                return;
                            }

                            Db.addUserToTeam(user, team).then(() => {
                                Discord.addUserToTeam(user, team).then(() => {
                                    commands.service.queue(`${user}, you are now a member of **${team.name}**!  Visit your team channel at #${team.channelName.toLowerCase()} to talk with your teammates.  Best of luck flying in the OTL!`, channel);
                                    resolve(true);
                                }).catch((err) => {
                                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                    reject(new Exception("There was a critical Discord error adding a user to a team.  Please resolve this manually as soon as possible.", err));
                                });
                            }).catch((err) => {
                                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                                reject(new Exception("There was a database error adding a user to a team.", err));
                            });
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a database error getting when a user has to wait to accept an invite for this team.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error getting when a user has to wait to accept an invite.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error getting what team a user is invited to.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a database error getting the current team the user is on.", err));
            });
        });
    }

    // ##
    //  #
    //  #     ##    ###  # #    ##
    //  #    # ##  #  #  # #   # ##
    //  #    ##    # ##  # #   ##
    // ###    ##    # #   #     ##
    /**
     * Leave a team.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    leave(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Db.getTeam(user).then((team) => {
                if (team) {
                    commands.service.queue(`Sorry, ${user}, but you can't leave a team when you aren't on one!`, channel);
                    reject(new Error("User is not on a team."));
                    return;
                }

                Discord.userIsFounder(user).then((isFounder) => {
                    if (isFounder) {
                        commands.service.queue(`Sorry, ${user}, but you are the team founder.  You must either \`!disband\` the team or choose another teammate to \`!makefounder\`.`, channel);
                        reject(new Error("User is the team founder."));
                        return;
                    }

                    if (!message) {
                        commands.service.queue(`${user}, are you sure you want to leave **${team.name}**?  Type \`!accept confirm\` to confirm.  Note that you will not be able to rejoin this team for 28 days.`, channel);
                        resolve(true);
                        return;
                    }

                    if (message !== "confirm") {
                        commands.service.queue(`Sorry, ${user}, but you must type \`!accept confirm\` to confirm that you wish to leave **${team.name}**.  Note that you will not be able to rejoin this team for 28 days.`, channel);
                        resolve(false);
                        return;
                    }

                    Db.removeUserFromTeam(user, team).then(() => {
                        Discord.removeUserFromTeam(user, team).then(() => {
                            commands.service.queue(`${user}, you have left **${team.name}**.`, user);
                            resolve(true);
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a critical Discord error removing a user from a team.  Please resolve this manually as soon as possible.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error removing a user from a team.", err));
                    });
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a database error getting the current team the user is on.", err));
            });
        });
    }

    // ###    ##   # #    ##   # #    ##
    // #  #  # ##  ####  #  #  # #   # ##
    // #     ##    #  #  #  #  # #   ##
    // #      ##   #  #   ##    #     ##

    /**
     * Removes a player from a team, rejects a player requesting to join the team, or revokes an invitation to join the team.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    remove(user, channel, message) {
        const commands = this;

        return new Promise((resolve, reject) => {
            Discord.userIsCaptainOrFounder(user).then((isCaptain) => {
                if (!isCaptain) {
                    commands.service.queue(`Sorry, ${user}, but you must be a team captain or founder to use this command.`, channel);
                    reject(new Error("User is not a founder or captain."));
                    return;
                }

                let player, confirm;

                if (idConfirmParse.test(message)) {
                    const {1: userId, 2: confirmed} = idConfirmParse.exec(message);

                    player = Discord.findGuildMemberById(userId);
                    confirm = confirmed;
                } else {
                    const {1: name, 2: confirmed} = nameConfirmParse.exec(message);

                    player = Discord.findGuildMemberByDisplayName(name);
                    confirm = confirmed;
                }

                if (!player) {
                    commands.service.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to remove.`, channel);
                    reject(new Error("User not found."));
                    return;
                }

                if (player.id === user.id) {
                    commands.service.queue(`Sorry, ${user}, you can't remove yourself with this command.  If you wish to leave the server, use the \`!leave\` command.`, channel);
                    reject(new Error("User cannot remove themselves."));
                    return;
                }

                Db.canRemovePlayer(user, player).then((removable) => {
                    if (!removable) {
                        commands.service.queue(`Sorry, ${user}, but ${player.displayName} is not a player you can remove.`, channel);
                        reject(new Error("User is not removable."));
                        return;
                    }

                    if (!confirm) {
                        commands.service.queue(`${user}, are you sure you want to remove ${player.displayName}?  Type \`!remove ${player.displayName} confirm\` to confirm.`, channel);
                        resolve(true);
                        return;
                    }

                    Db.removePlayer(user, player).then(() => {
                        Discord.removePlayer(user, player).then(() => {
                            commands.service.queue(`${user}, you have removed ${player.displayName}.`, user);
                            resolve(true);
                        }).catch((err) => {
                            commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                            reject(new Exception("There was a critical Discord error removing a user from a team.  Please resolve this manually as soon as possible.", err));
                        });
                    }).catch((err) => {
                        commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                        reject(new Exception("There was a database error removing a user from a team.", err));
                    });
                }).catch((err) => {
                    commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                    reject(new Exception("There was a database error checking if a user can remove another user.", err));
                });
            }).catch((err) => {
                commands.service.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                reject(new Exception("There was a Discord error getting whether a user is a team founder or captin.", err));
            });
        });
    }

    // !makefounder

    // !challenge
    // !clock
    // !pickmap
    // !suggestmap
    // !confirmmap
    // !suggestserver
    // !confirmserver
    // !suggestteamsize
    // !confirmteamsize
    // !suggesttime
    // !confirmtime
    // !report
    // !confirm

    // !rename
    // !retag
    // !replacefounder
    // !removeplayer
    // !forcereport
    // !adjudicate
    // !playerstat
    // !voidgame
}

module.exports = Commands;
