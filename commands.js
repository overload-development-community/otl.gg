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
     * Initializes the class.
     */
    constructor() {
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
    static async ownerPromise(user, fx) {
        if (typeof user === "string" || !Discord.isOwner(user)) {
            throw new Error("Owner permission required to perform this command.");
        }

        if (fx) {
            await fx();
        }
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
    async website(user, channel, message) {
        if (message) {
            return false;
        }

        await Discord.queue("Visit http://overloadteamsleague.org for standings, stats, and more!", channel);

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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async version(user, channel, message) {
        if (message) {
            return false;
        }

        await Discord.queue(`We are The Fourth Sovereign, we are trillions.  By roncli, Version ${pjson.version}`, channel);

        return true;
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
    async help(user, channel, message) {
        if (message) {
            return false;
        }

        await Discord.queue(`${user}, see the documentation at http://overloadteamsleague.org/bot.`, channel);

        return true;
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
    async createteam(user, channel, message) {
        if (message) {
            await Discord.queue(`Sorry, ${user}, but this command does not take any parameters.  Use \`!createteam\` by itself to begin the process of creating a team.`, channel);
            return false;
        }

        const isStarting = Discord.userIsStartingTeam(user);
        if (isStarting) {
            await Discord.queue(`Sorry, ${user}, but you are already in the process of starting a team!  Visit #new-team-${user.id} to get started.`, channel);
            throw new Error("User is already in the process of starting a team.");
        }

        let team;
        try {
            team = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (team) {
            await Discord.queue(`Sorry, ${user}, but you are already on **${team.name}**!  Visit your team channel at #${team.channelName.toLowerCase()} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Error("User is already on a team.");
        }

        let canBeCaptain;
        try {
            canBeCaptain = await Db.canBeCaptain(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a user can become a captain.", err);
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${user}, but due to past penalties, you cannot create a team.`, channel);
            throw new Error("User is not able to create a team.");
        }

        let deniedUntil;
        try {
            deniedUntil = await Db.joinTeamDeniedUntil(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting when a user has to wait to accept an invite.", err);
        }

        if (deniedUntil) {
            await Discord.queue(`Sorry, ${user}, but you have accepted an invitation in the past 28 days.  You will be able to create a new team on ${deniedUntil.toUTCString()}`, channel);
            throw new Error("User not allowed to create a new team.");
        }

        try {
            await Discord.startCreateTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a Discord error starting a new team for the user.", err);
        }

        await Discord.queue(`${user}, you have begun the process of creating a team.  Visit #new-team-${user.id} to set up your new team.`, channel);
        return true;
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
    async name(user, channel, message) {
        if (!message) {
            await Discord.queue(`Sorry, ${user}, but this command cannot be used by itself.  To name your team, add the team name after the command, for example \`!name Cronus Frontier\`.`, channel);
            return false;
        }

        const isStarting = Discord.userIsStartingTeam(user);
        if (!isStarting) {
            await Discord.queue(`Sorry, ${user}, but you cannot name a team when you're not in the process of creating one.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
            throw new Error("User is not in the process of starting a team.");
        }

        if (!teamNameMatch.test(message)) {
            await Discord.queue(`Sorry, ${user}, but to prevent abuse, you can only use alphanumeric characters and spaces and are limited to 25 characters.  In the event you need to use other characters, please name your team within the rules for now, and then contact an admin after your team is created.`, channel);
            throw new Error("User used non-alphanumeric characters in their team name.");
        }

        const exists = Discord.teamNameExists(message);
        if (exists) {
            await Discord.queue(`Sorry, ${user}, but this team name already exists!`, channel);
            throw new Error("Team name already exists.");
        }

        try {
            await Discord.applyTeamName(user, message);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a Discord error naming a team.", err);
        }

        await Discord.queue(`${user}, your team name is now set to ${message}.  Note that proper casing may be applied to your name by an admin.`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async tag(user, channel, message) {
        if (!message) {
            await Discord.queue(`Sorry, ${user}, but this command cannot be used by itself.  To assign a tag to your team, add the tag after the command, for example \`!tag CF\` for a team named Cronus Frontier.`, channel);
            return false;
        }

        const isStarting = Discord.userIsStartingTeam(user);
        if (!isStarting) {
            await Discord.queue(`Sorry, ${user}, but you cannot name a team when you're not in the process of creating one.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
            throw new Error("User is not in the process of starting a team.");
        }

        message = message.toUpperCase();

        if (!teamTagMatch.test(message)) {
            await Discord.queue(`Sorry, ${user}, but you can only use alphanumeric characters, and are limited to 5 characters.`, channel);
            throw new Error("User used non-alphanumeric characters in their team tag.");
        }

        let exists;
        try {
            exists = await Db.teamTagExists(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if the team name exists.", err);
        }

        if (exists) {
            await Discord.queue(`Sorry, ${user}, but this team tag already exists!`, channel);
            throw new Error("Team tag already exists.");
        }

        try {
            await Discord.applyTeamTag(user, message);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a Discord error naming a team.", err);
        }

        await Discord.queue(`${user}, your team tag is now set to ${message}.`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async cancel(user, channel, message) {
        const isStarting = Discord.userIsStartingTeam(user);
        if (!isStarting) {
            await Discord.queue(`Sorry, ${user}, but you cannot cancel new team creation when you're not in the process of creating one.`, channel);
            throw new Error("User is not in the process of starting a team.");
        }

        if (!message) {
            await Discord.queue(`${user}, are you sure you want to cancel your new team request?  There is no undoing this action!  Type \`!cancel confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${user}, but you must type \`!cancel confirm\` to confirm that you wish to cancel your request to create a team.`, channel);
            return false;
        }

        try {
            await Discord.cancelCreateTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a Discord error cancelling the create team process.", err);
        }

        await Discord.queue("Your request to create a team has been cancelled.", user);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async complete(user, channel, message) {
        const isStarting = Discord.userIsStartingTeam(user);
        if (!isStarting) {
            await Discord.queue(`Sorry, ${user}, but you cannot complete creating a team when you're not in the process of creating one.`, channel);
            throw new Error("User is not in the process of starting a team.");
        }

        const [isReady, name, tag] = Discord.readyToCreateTeam(user);

        if (!isReady) {
            await Discord.queue(`Sorry, ${user}, but you must use the \`!name\` and \`!tag\` commands to give your team a name and a tag before completing your request to create a team.`, channel);
            throw new Error("User is not in the process of starting a team.");
        }

        if (!message) {
            await Discord.queue(`${user}, are you sure you want to complete your request to create a team?  There is no undoing this action!  Type \`!complete confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${user}, but you must type \`!complete confirm\` to confirm that you wish to complete your request to create a team.`, channel);
            return false;
        }

        let teamNameExists, tagNameExists;
        try {
            [teamNameExists, tagNameExists] = await Db.teamNameOrTagExists(name, tag);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if the team name exists.", err);
        }

        if (teamNameExists) {
            await Discord.queue(`Sorry, ${user}, but this team name already exists!  You'll need to use the \`!name\` command to try another.`, channel);
            throw new Error("Team name already exists.");
        }

        if (tagNameExists) {
            await Discord.queue(`Sorry, ${user}, but this team tag already exists!  You'll need to use the \`!tag\` command to try another.`, channel);
            throw new Error("Team tag already exists.");
        }

        try {
            await Db.createTeam(user, name, tag);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error creating a team.", err);
        }

        try {
            await Discord.createTeam(user, name, tag);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error creating a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`Congratulations, ${user}!  Your team has been created!  You may now visit #team-${tag.toLowerCase()} for team chat, and #team-${tag.toLowerCase()}-captains for private chat with your team captains as well as system notifications for your team.`, user);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async color(user, channel, message) {
        const isFounder = Discord.userIsFounder(user);
        if (!isFounder) {
            await Discord.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
            throw new Error("User is not a founder.");
        }

        if (!message) {
            await Discord.queue("You can use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter `!color dark green`.", channel);
            return true;
        }

        if (!colorMatch.test(message)) {
            await Discord.queue(`Sorry, ${user}, but you can only use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter \`!color dark green\`.`, channel);
            throw new Error("Invalid color.");
        }

        let team;
        try {
            team = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (!team) {
            await Discord.queue(`Sorry, ${user}, but you must be on a team to use this command.`, channel);
            throw new Error("User not on a team.");
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

        try {
            await Discord.changeTeamColor(user, color);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a Discord error changing a team's color.", err);
        }

        await Discord.queue(`${user}, your team's color has been updated.`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async addcaptain(user, channel, message) {
        const isFounder = Discord.userIsFounder(user);
        if (!isFounder) {
            await Discord.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
            throw new Error("User is not a founder.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${user}, but you must mention the pilot on your team that you wish to add as a captain.`, channel);
            return false;
        }

        const captainCount = Discord.captainCountOnUserTeam(user);
        if (captainCount >= 2) {
            await Discord.queue(`Sorry, ${user}, but you already have ${captainCount} captains, and the limit is 2.`, channel);
            throw new Error("Captain count limit reached.");
        }

        let captain;
        if (idParse.test(message)) {
            const {1: userId} = idParse.exec(message);

            captain = Discord.findGuildMemberById(userId);
        } else {
            captain = Discord.findGuildMemberByDisplayName(message);
        }

        if (!captain) {
            await Discord.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to add as a captain.`, channel);
            throw new Error("User not found.");
        }

        if (captain.id === user.id) {
            await Discord.queue(`Sorry, ${user}, but you can't promote yourself to captain!`, channel);
            throw new Error("User can't promote themselves.");
        }

        let sameTeam;
        try {
            sameTeam = Discord.usersAreOnTheSameTeam(user, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a Discord error checking whether two users are on the same team.", err);
        }

        if (!sameTeam) {
            await Discord.queue(`Sorry, ${user}, but you can only add a captain if they are on your team.`, channel);
            throw new Error("Users are not on the same team.");
        }

        const isCaptain = Discord.userIsCaptainOrFounder(captain);
        if (isCaptain) {
            await Discord.queue(`Sorry, ${user}, but ${captain.displayName} is already a captain!`, channel);
            throw new Error("Pilot is already a captain.");
        }

        let canBeCaptain;
        try {
            canBeCaptain = await Db.canBeCaptain(captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a user can become a captain.", err);
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${user}, but due to past penalties, ${captain.displayName} is not a pilot you can add as a captain.`, channel);
            throw new Error("User is not able to become a captain.");
        }

        try {
            await Db.addCaptain(user, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error adding a captain.", err);
        }

        try {
            await Discord.addCaptain(user, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error adding a captain.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, ${captain.displayName} is now a team captain!`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async removecaptain(user, channel, message) {
        const isFounder = Discord.userIsFounder(user);
        if (!isFounder) {
            await Discord.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
            throw new Error("User is not a founder.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${user}, but you must mention the pilot on your team that you wish to remove as a captain.`, channel);
            return false;
        }

        let captain;
        if (idParse.test(message)) {
            const {1: userId} = idParse.exec(message);

            captain = Discord.findGuildMemberById(userId);
        } else {
            captain = Discord.findGuildMemberByDisplayName(message);
        }

        if (!captain) {
            await Discord.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to remove as a captain.`, channel);
            throw new Error("User not found.");
        }

        let sameTeam;
        try {
            sameTeam = Discord.usersAreOnTheSameTeam(user, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a Discord error checking whether two users are on the same team.", err);
        }

        if (!sameTeam) {
            await Discord.queue(`Sorry, ${user}, but you can only remove a captain if they are on your team.`, channel);
            throw new Error("Users are not on the same team.");
        }

        const isCaptain = Discord.userIsCaptainOrFounder(captain);
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${user}, but ${captain.displayName} is not a captain!`, channel);
            throw new Error("Pilot is already a captain.");
        }

        try {
            await Db.removeCaptain(user, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error removing a captain.", err);
        }

        try {
            await Discord.removeCaptain(user, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error removing a captain.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, ${captain.displayName} is no longer a team captain.`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async disband(user, channel, message) {
        const isFounder = Discord.userIsFounder(user);
        if (!isFounder) {
            await Discord.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
            throw new Error("User is not a founder.");
        }

        if (!message) {
            await Discord.queue(`${user}, are you sure you want to disband your team?  There is no undoing this action!  Type \`!disband confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${user}, but you must type \`!disband confirm\` to confirm that you wish to disband your team.`, channel);
            return false;
        }

        try {
            await Db.disbandTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error disbanding a team.", err);
        }

        try {
            await Discord.disbandTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error disbanding a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue("You have successfully disbanded your team.  Note that you or anyone else who has been founder or captain of your team in the past may `!reinstate` your team.", user);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    static async makefounder(user, channel, message) {
        const isFounder = Discord.userIsFounder(user);
        if (!isFounder) {
            await Discord.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
            throw new Error("User is not a founder.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${user}, but you must mention the pilot you wish to make founder.`, channel);
            return false;
        }

        let pilot, confirm;
        if (idConfirmParse.test(message)) {
            const {1: userId, 2: confirmed} = idConfirmParse.exec(message);

            pilot = Discord.findGuildMemberById(userId);
            confirm = confirmed;
        } else {
            const {1: name, 2: confirmed} = nameConfirmParse.exec(message);

            pilot = Discord.findGuildMemberByDisplayName(name);
            confirm = confirmed;
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to make founder.`, channel);
            throw new Error("User not found.");
        }

        if (pilot.id === user.id) {
            await Discord.queue(`Sorry, ${user}, you can't make yourself the team's founder, you already *are* the founder!`, channel);
            throw new Error("User already the team's founder.");
        }

        let sameTeam;
        try {
            sameTeam = Discord.usersAreOnTheSameTeam(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a Discord error checking whether two users are on the same team.", err);
        }

        if (!sameTeam) {
            await Discord.queue(`Sorry, ${user}, but ${pilot.displayName} isn't on your team!`, channel);
            throw new Error("Users are not on the same team.");
        }

        const captainCount = Discord.captainCountOnUserTeam(user),
            pilotIsCaptain = Discord.userIsCaptainOrFounder(pilot);
        if (captainCount === 2 || pilotIsCaptain) {
            await Discord.queue(`Sorry, ${user}, but this action would increase your team's captain count to 3.  You must remove an existing captain with the \`!removecaptain\` command before making ${pilot.displayName} the team's founder.`, channel);
            throw new Error("Captain count limit reached.");
        }

        let canBeCaptain;
        try {
            canBeCaptain = await Db.canBeCaptain(pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a user can become a captain.", err);
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${user}, but due to past penalties, ${pilot.displayName} is not a pilot you can make the team's founder.`, channel);
            throw new Error("User is not able to become the team's founder.");
        }

        if (!confirm) {
            await Discord.queue(`${user}, are you sure you want to make ${pilot.displayName} your team's founder?  Type \`!makefounder ${pilot.displayName} confirm\` to confirm.`, channel);
            return true;
        }

        try {
            await Db.makeFounder(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error transfering a team founder to another user.", err);
        }

        try {
            await Discord.makeFounder(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error transfering a team founder to another user.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, you have transferred team ownership to ${pilot.displayName}.  You remain a team captain.`, user);
        return true;
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
    async reinstate(user, channel, message) {
        if (!message) {
            await Discord.queue("You must include the name of the team you wish to reinstate.", channel);
            return false;
        }

        let currentTeam;
        try {
            currentTeam = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the team the user is on.", err);
        }

        if (currentTeam) {
            await Discord.queue(`Sorry, ${user}, but you are already on **${currentTeam.name}**!  Visit your team channel at #${currentTeam.channelName.toLowerCase()} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Error("User is already on a team.");
        }

        let team;
        try {
            team = await Db.getTeamByTagOrName(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting a team.", err);
        }

        if (!team) {
            await Discord.queue(`Sorry, ${user}, but I have no record of that team ever existing.`, channel);
            throw new Error("Team does not exist.");
        }

        if (!team.disbanded) {
            await Discord.queue(`Sorry, ${user}, but you can't reinstate a team that isn't disbanded.`, channel);
            throw new Error("Team is not disbanded.");
        }

        let wasCaptain;
        try {
            wasCaptain = await Db.userWasPreviousCaptainOrFounderOfTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if the user was a captain or founder of a team.", err);
        }

        if (!wasCaptain) {
            await Discord.queue(`Sorry, ${user}, but you must have been a captain or founder of the team you are trying to reinstate.`, channel);
            throw new Error("Team does not exist.");
        }

        let canBeCaptain;
        try {
            canBeCaptain = await Db.canBeCaptain(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a user can become a captain.", err);
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${user}, but due to past penalties, you cannot reinstate a team.`, channel);
            throw new Error("User is not able to reinstate a team.");
        }

        let deniedUntil;
        try {
            deniedUntil = await Db.joinTeamDeniedUntil(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting when a user has to wait to accept an invite.", err);
        }

        if (deniedUntil) {
            await Discord.queue(`Sorry, ${user}, but you have accepted an invitation in the past 28 days.  You will be able to reinstate this team on ${deniedUntil.toUTCString()}`, channel);
            throw new Error("User not allowed to create a new team.");
        }

        try {
            await Db.reinstateTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error reinstating a team.", err);
        }

        try {
            await Discord.reinstateTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error reinstating a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`Congratulations, ${user}!  Your team has been reinstated!  You may now visit #team-${team.tag.toLowerCase()} for team chat, and #team-${team.tag.toLowerCase()}-captains for private chat with your team captains as well as system notifications for your team.`, user);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async home(user, channel, message) {
        const isCaptain = Discord.userIsCaptainOrFounder(user);
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${user}, but you must be a team captain or founder to use this command.`, channel);
            throw new Error("User is not a founder or captain.");
        }

        if (!message) {
            await Discord.queue("To set one of your three home maps, you must include the home number you wish to set, followed by the name of the map.  For instance, to set your second home map to Vault, enter the following command: `!home 2 Vault`", channel);
            return true;
        }

        if (!mapMatch.test(message)) {
            await Discord.queue(`Sorry, ${user}, but you must include the home number you wish to set, followed by the name of the map, such as \`!home 2 Vault\`.`, channel);
            throw new Error("User is not a founder or captain.");
        }

        const {1: number, 2: map} = mapMatch.exec(message);
        let homes;
        try {
            homes = await Db.getTeamHomeMaps(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the home maps for the team the user is on.", err);
        }

        if (homes.indexOf(map) !== -1) {
            await Discord.queue(`Sorry, ${user}, but you already have this map set as your home.`, channel);
            throw new Error("Team already has this home map set.");
        }

        try {
            await Db.applyHomeMap(user, number, map);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error setting a home map for the team the user is on.", err);
        }

        try {
            await Discord.applyHomeMap(user, number, map);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error setting a home map for the team the user is on.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, your home map has been set.  Note this only applies to future challenges, any current challenges you have will use the home maps you had at the time of the challenge.`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async request(user, channel, message) {
        let currentTeam;
        try {
            currentTeam = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the team the user is on.", err);
        }

        if (currentTeam) {
            await Discord.queue(`Sorry, ${user}, but you are already on **${currentTeam.name}**!  Visit your team channel at #${currentTeam.channelName.toLowerCase()} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Error("User is already on a team.");
        }

        if (!message) {
            await Discord.queue("You must include the name of the team you want to send a join request to.", channel);
            return false;
        }

        let team;
        try {
            team = await Db.getTeamByTagOrName(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting a team.", err);
        }

        if (!team) {
            await Discord.queue(`Sorry, ${user}, but I have no record of that team ever existing.`, channel);
            throw new Error("Team does not exist.");
        }

        if (team.disbanded) {
            await Discord.queue(`Sorry, ${user}, but that team has disbanded.  A former captain or founder may reinstate the team with the \`!reinstate ${team.tag}\` command.`, channel);
            throw new Error("Team is disbanded.");
        }

        let hasRequested;
        try {
            hasRequested = await Db.userHasAlreadyRequestedTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a user has already requested to join a team.", err);
        }

        if (hasRequested) {
            await Discord.queue(`Sorry, ${user}, but to prevent abuse, you may only requeset to join a team once.`, channel);
            throw new Error("Request already exists.");
        }

        try {
            await Db.requestTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error requesting to join a team.", err);
        }

        try {
            await Discord.requestTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error requesting to join a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, your request has been sent to join ${team.name}.  The team's leadership has been notified of this request.`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async invite(user, channel, message) {
        const isCaptain = Discord.userIsCaptainOrFounder(user);
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${user}, but you must be a team captain or founder to use this command.`, channel);
            throw new Error("User is not a founder or captain.");
        }

        let pilotCount;
        try {
            pilotCount = await Db.getTeamPilotAndInvitedCount(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the number of pilots on and invited to a user's team.", err);
        }

        if (pilotCount >= 8) {
            await Discord.queue(`Sorry, ${user}, but there is a maximum of 8 pilots per roster, and your team currently has ${pilotCount}.`, channel);
            throw new Error("Roster is full.");
        }

        let pilot;
        if (idParse.test(message)) {
            const {1: userId} = idParse.exec(message);

            pilot = Discord.findGuildMemberById(userId);
        } else {
            pilot = Discord.findGuildMemberByDisplayName(message);
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to invite.`, channel);
            throw new Error("User not found.");
        }

        let invited;
        try {
            invited = await Db.userTeamHasInvitedPilot(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a pilot was already invited to a team.", err);
        }

        if (invited) {
            await Discord.queue(`Sorry, ${user}, but to prevent abuse you can only invite a pilot to your team once.  If ${pilot.displayName} has not responded yet, ask them to \`!accept\` the invitation.`, channel);
            throw new Error("Pilot already invited.");
        }

        let team;
        try {
            team = await Db.getTeam(pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (team) {
            await Discord.queue(`Sorry, ${user}, but ${pilot.displayName} is already on another team!`, channel);
            throw new Error("Pilot already on another team.");
        }

        try {
            await Db.invitePilotToTeam(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error inviting a pilot to a team.", err);
        }

        try {
            await Discord.invitePilotToTeam(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error inviting a pilot to a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, ${pilot.displayName} has been invited to your team.`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async accept(user, channel, message) {
        let currentTeam;
        try {
            currentTeam = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (currentTeam) {
            await Discord.queue(`Sorry, ${user}, but you are already on **${currentTeam.name}**!  Visit your team channel at #${currentTeam.channelName.toLowerCase()} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Error("User is already on a team.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${user}, but you must include the name or tag of the team you wish to accept an invitation from.  For example, if you wish to accept an invitation from Cronus Frontier, use either \`!accept Cronus Frontier\` or \`!accept CF\`.`, channel);
            return false;
        }

        const {1: name, 2: confirm} = nameConfirmParse.exec(message);
        let team;
        try {
            team = await Db.userIsInvitedToTeam(user, name);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting what team a user is invited to.", err);
        }

        if (!team) {
            await Discord.queue(`Sorry, ${user}, but you don't have a pending invitation to ${name}.`, channel);
            throw new Error("User does not have an invitation to accept.");
        }

        let deniedUntil;
        try {
            deniedUntil = await Db.joinTeamDeniedUntil(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting when a user has to wait to accept an invite.", err);
        }

        if (deniedUntil) {
            await Discord.queue(`Sorry, ${user}, but you have accepted an invitation in the past 28 days.  You will be able to join a new team on ${deniedUntil.toUTCString()}`, channel);
            throw new Error("User not allowed to accept an invite.");
        }

        let bannedUntil;
        try {
            bannedUntil = await Db.userBannedFromTeamUntil(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting when a user has to wait to accept an invite for this team.", err);
        }

        if (bannedUntil) {
            await Discord.queue(`Sorry, ${user}, but you have left this team within the past 28 days.  You will be able to join this team again on ${bannedUntil.toUTCString()}`, channel);
            throw new Error("User not allowed to accept an invite from this team.");
        }

        if (!confirm) {
            await Discord.queue(`${user}, are you sure you want to join **${team.name}**?  Type \`!accept confirm\` to confirm.  Note that you will not be able to accept another invitation or create a team for 28 days.`, channel);
            return true;
        }

        try {
            await Db.addUserToTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error adding a user to a team.", err);
        }

        try {
            await Discord.addUserToTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error adding a user to a team.  Please resolve this manually as soon as possible.", err);
        }

        let requestedTeams;
        try {
            requestedTeams = await Db.getRequestedOrInvitedTeams(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical database error getting a user's team invites and requests.  Please resolve this manually as soon as possible.", err);
        }

        requestedTeams.forEach(async (requestedTeam) => {
            try {
                await Db.removeUserFromTeam(user, requestedTeam);
            } catch (err) {
                await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
                throw new Exception("There was a critical database removing a user's team invite or request.  Please resolve this manually as soon as possible.", err);
            }

            await Discord.updateTeam(requestedTeam);
        });

        await Discord.queue(`${user}, you are now a member of **${team.name}**!  Visit your team channel at #${team.channelName.toLowerCase()} to talk with your teammates.  Best of luck flying in the OTL!`, channel);
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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async leave(user, channel, message) {
        let team;
        try {
            team = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (team) {
            await Discord.queue(`Sorry, ${user}, but you can't leave a team when you aren't on one!`, channel);
            throw new Error("User is not on a team.");
        }

        const isFounder = Discord.userIsFounder(user);
        if (isFounder) {
            await Discord.queue(`Sorry, ${user}, but you are the team founder.  You must either \`!disband\` the team or choose another teammate to \`!makefounder\`.`, channel);
            throw new Error("User is the team founder.");
        }

        if (!message) {
            await Discord.queue(`${user}, are you sure you want to leave **${team.name}**?  Type \`!accept confirm\` to confirm.  Note that you will not be able to rejoin this team for 28 days.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${user}, but you must type \`!accept confirm\` to confirm that you wish to leave **${team.name}**.  Note that you will not be able to rejoin this team for 28 days.`, channel);
            return false;
        }

        try {
            await Db.removeUserFromTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error removing a user from a team.", err);
        }

        try {
            await Discord.removeUserFromTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error removing a user from a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, you have left **${team.name}**.`, user);
        return true;
    }

    // ###    ##   # #    ##   # #    ##
    // #  #  # ##  ####  #  #  # #   # ##
    // #     ##    #  #  #  #  # #   ##
    // #      ##   #  #   ##    #     ##

    /**
     * Removes a pilot from a team, rejects a pilot requesting to join the team, or revokes an invitation to join the team.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async remove(user, channel, message) {
        const isCaptain = Discord.userIsCaptainOrFounder(user);
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${user}, but you must be a team captain or founder to use this command.`, channel);
            throw new Error("User is not a founder or captain.");
        }

        let pilot, confirm;
        if (idConfirmParse.test(message)) {
            const {1: userId, 2: confirmed} = idConfirmParse.exec(message);

            pilot = Discord.findGuildMemberById(userId);
            confirm = confirmed;
        } else {
            const {1: name, 2: confirmed} = nameConfirmParse.exec(message);

            pilot = Discord.findGuildMemberByDisplayName(name);
            confirm = confirmed;
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to remove.`, channel);
            throw new Error("User not found.");
        }

        if (pilot.id === user.id) {
            await Discord.queue(`Sorry, ${user}, you can't remove yourself with this command.  If you wish to leave the server, use the \`!leave\` command.`, channel);
            throw new Error("User cannot remove themselves.");
        }

        let removable;
        try {
            removable = await Db.canRemovePilot(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a user can remove another user.", err);
        }

        if (!removable) {
            await Discord.queue(`Sorry, ${user}, but ${pilot.displayName} is not a pilot you can remove.`, channel);
            throw new Error("User is not removable.");
        }

        if (!confirm) {
            await Discord.queue(`${user}, are you sure you want to remove ${pilot.displayName}?  Type \`!remove ${pilot.displayName} confirm\` to confirm.`, channel);
            return true;
        }

        try {
            await Db.removePilot(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error removing a user from a team.", err);
        }

        try {
            await Discord.removePilot(user, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error removing a user from a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, you have removed ${pilot.displayName}.`, user);
        return true;
    }

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
    // !removepilot
    // !forcereport
    // !adjudicate
    // !pilotstat
    // !voidgame
}

module.exports = Commands;
