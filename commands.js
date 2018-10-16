const Db = require("./database"),
    Exception = require("./exception"),
    pjson = require("./package.json"),

    colorMatch = /^(?:dark |light )?(?:red|orange|yellow|green|aqua|blue|purple)$/,
    idParse = /^<@!?([0-9]+)>$/,
    idConfirmParse = /^<@!?([0-9]+)>(?: (confirm|[^ ]*))?$/,
    idMessageParse = /^<@!?([0-9]+)> ([^ ]+)(?: (.+))?$/,
    mapMatch = /^([123]) (.+)$/,
    nameConfirmParse = /^@?(.+?)(?: (confirm|[^ ]*))?$/,
    teamNameMatch = /^[0-9a-zA-Z ]{6,25}$/,
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

    //         #                ##           #
    //                           #           #
    //  ###   ##    # #   #  #   #     ###  ###    ##
    // ##      #    ####  #  #   #    #  #   #    # ##
    //   ##    #    #  #  #  #   #    # ##   #    ##
    // ###    ###   #  #   ###  ###    # #    ##   ##
    /**
     * Simulates other users making a command.
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async simulate(user, channel, message) {
        if (typeof user === "string" || !Discord.isOwner(user)) {
            throw new Exception("Owner permission required to perform this command.");
        }

        if (!idMessageParse.test(message)) {
            return false;
        }

        const {1: userId, 2: command, 3: newMessage} = idMessageParse.exec(message);
        if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(command) === -1) {
            return false;
        }

        const newUser = await Discord.findUserById(userId);
        if (!newUser) {
            throw new Exception("User does not exist.");
        }

        return await this[command](newUser, channel, newMessage) || void 0;
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

        await Discord.queue(`${user}, see the documentation at https://github.com/roncli/otl-bot/blob/master/README.md.`, channel);

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
     * @param {User} user The user initiating the command.
     * @param {TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async website(user, channel, message) {
        if (message) {
            return false;
        }

        await Discord.queue("Website pending!", channel);

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

        const guildMember = Discord.findGuildMemberById(user.id);
        if (!guildMember) {
            await Discord.queue(`Sorry, ${user}, but you are not part of the OTL!`, channel);
            throw new Exception("User is not on the server.");
        }

        const currentChannel = Discord.userStartingTeamChannel(user);
        if (currentChannel) {
            await Discord.queue(`Sorry, ${user}, but you are already in the process of starting a team!  Visit ${currentChannel} to get started.`, channel);
            throw new Exception("User is already in the process of starting a team.");
        }

        let team;
        try {
            team = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (team) {
            const currentGuildChannel = Discord.findChannelByName(`team-${team.tag.toLowerCase()}`);
            await Discord.queue(`Sorry, ${user}, but you are already on **${team.name}**!  Visit your team channel at ${currentGuildChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Exception("User is already on a team.");
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
            throw new Exception("User is not able to create a team.");
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
            throw new Exception("User not allowed to create a new team.");
        }

        try {
            await Db.startCreateTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error starting to create a team.", err);
        }

        let guildChannel;
        try {
            guildChannel = await Discord.startCreateTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error starting a new team for the user.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, you have begun the process of creating a team.  Visit ${guildChannel} to set up your new team.`, channel);
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
            throw new Exception("User is not in the process of starting a team.");
        }

        if (!teamNameMatch.test(message)) {
            await Discord.queue(`Sorry, ${user}, but to prevent abuse, you can only use alphanumeric characters and spaces, and names must be between 6 and 25 characters.  In the event you need to use other characters, please name your team within the rules for now, and then contact an admin after your team is created.`, channel);
            throw new Exception("User used non-alphanumeric characters in their team name.");
        }

        const exists = Discord.teamNameExists(message);
        if (exists) {
            await Discord.queue(`Sorry, ${user}, but this team name already exists!`, channel);
            throw new Exception("Team name already exists.");
        }

        let name, tag;
        try {
            ({name, tag} = await Db.applyTeamName(user, message));
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error applying a team name.", err);
        }

        try {
            await Discord.applyTeamNameAndTag(user, name, tag);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error naming a team.  Please resolve this manually as soon as possible.", err);
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
            await Discord.queue(`Sorry, ${user}, but you cannot provide a team tag when you're not in the process of creating a team.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
            throw new Exception("User is not in the process of starting a team.");
        }

        message = message.toUpperCase();

        if (!teamTagMatch.test(message)) {
            await Discord.queue(`Sorry, ${user}, but you can only use alphanumeric characters, and are limited to 5 characters.`, channel);
            throw new Exception("User used non-alphanumeric characters in their team tag.");
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
            throw new Exception("Team tag already exists.");
        }

        let name, tag;
        try {
            ({name, tag} = await Db.applyTeamTag(user, message));
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error applying a team name.", err);
        }

        try {
            await Discord.applyTeamNameAndTag(user, name, tag);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error naming a team.  Please resolve this manually as soon as possible.", err);
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
            throw new Exception("User is not in the process of starting a team.");
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
            await Db.cancelCreateTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error cancelling the create team process.", err);
        }

        try {
            await Discord.cancelCreateTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error cancelling the create team process.  Please resolve this manually as soon as possible.", err);
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
        const guildMember = Discord.findGuildMemberById(user.id);
        if (!guildMember) {
            await Discord.queue(`Sorry, ${user}, but you are not part of the OTL!`, channel);
            throw new Exception("User is not on the server.");
        }

        const isStarting = Discord.userIsStartingTeam(user);
        if (!isStarting) {
            await Discord.queue(`Sorry, ${user}, but you cannot complete creating a team when you're not in the process of creating one.`, channel);
            throw new Exception("User is not in the process of starting a team.");
        }

        let name, tag;
        try {
            ({name, tag} = await Db.getNewTeam(user));
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if the user is ready to create a team.", err);
        }

        if (!name) {
            await Discord.queue(`Sorry, ${user}, but you must use the \`!name\` and \`!tag\` commands to give your team a name and a tag before completing your request to create a team.`, channel);
            throw new Exception("Team not yet given a name.");
        }

        if (!tag) {
            await Discord.queue(`Sorry, ${user}, but you must use the \`!tag\` command to give your team a tag before completing your request to create a team.`, channel);
            throw new Exception("Team not yet given a tag.");
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
            [teamNameExists, tagNameExists] = await Db.teamNameOrTeamTagExists(name, tag);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if the team name exists.", err);
        }

        if (teamNameExists) {
            await Discord.queue(`Sorry, ${user}, but this team name already exists!  You'll need to use the \`!name\` command to try another.`, channel);
            throw new Exception("Team name already exists.");
        }

        if (tagNameExists) {
            await Discord.queue(`Sorry, ${user}, but this team tag already exists!  You'll need to use the \`!tag\` command to try another.`, channel);
            throw new Exception("Team tag already exists.");
        }

        try {
            await Db.createTeam(guildMember, name, tag);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error creating a team.", err);
        }

        let channels;
        try {
            channels = await Discord.createTeam(user, name, tag);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error creating a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`Congratulations, ${user}!  Your team has been created!  You may now visit ${channels.guildChannel} for team chat, and ${channels.captainChannel} for private chat with your team captains as well as system notifications for your team.`, user);
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
            throw new Exception("User is not a founder.");
        }

        if (!message) {
            await Discord.queue("You can use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter `!color dark green`.", channel);
            return true;
        }

        if (!colorMatch.test(message)) {
            await Discord.queue(`Sorry, ${user}, but you can only use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter \`!color dark green\`.`, channel);
            throw new Exception("Invalid color.");
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
            throw new Exception("User not on a team.");
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
            throw new Exception("User is not a founder.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${user}, but you must mention the pilot on your team that you wish to add as a captain.`, channel);
            return false;
        }

        const captainCount = Discord.captainCountOnUserTeam(user);
        if (captainCount >= 2) {
            await Discord.queue(`Sorry, ${user}, but you already have ${captainCount} captains, and the limit is 2.`, channel);
            throw new Exception("Captain count limit reached.");
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
            throw new Exception("User not found.");
        }

        if (captain.id === user.id) {
            await Discord.queue(`Sorry, ${user}, but you can't promote yourself to captain!`, channel);
            throw new Exception("User can't promote themselves.");
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
            throw new Exception("Users are not on the same team.");
        }

        const isCaptain = Discord.userIsCaptainOrFounder(captain);
        if (isCaptain) {
            await Discord.queue(`Sorry, ${user}, but ${captain.displayName} is already a captain!`, channel);
            throw new Exception("Pilot is already a captain.");
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
            throw new Exception("User is not able to become a captain.");
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
            throw new Exception("User is not a founder.");
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
            throw new Exception("User not found.");
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
            throw new Exception("Users are not on the same team.");
        }

        const isCaptain = Discord.userIsCaptainOrFounder(captain);
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${user}, but ${captain.displayName} is not a captain!`, channel);
            throw new Exception("Pilot is already a captain.");
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
            throw new Exception("User is not a founder.");
        }

        let team;
        try {
            team = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error disbanding a team.", err);
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${user}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Exception("Team rosters are locked.");
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
            await Discord.disbandTeam(user, team);
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
    async makefounder(user, channel, message) {
        const isFounder = Discord.userIsFounder(user);
        if (!isFounder) {
            await Discord.queue(`Sorry, ${user}, but you must be a team founder to use this command.`, channel);
            throw new Exception("User is not a founder.");
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
        } else if (nameConfirmParse.test(message)) {
            const {1: name, 2: confirmed} = nameConfirmParse.exec(message);

            pilot = Discord.findGuildMemberByDisplayName(name);
            confirm = confirmed;
        } else {
            await Discord.queue(`Sorry, ${user}, but you must mention the pilot you wish to make founder.`, channel);
            return false;
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to make founder.`, channel);
            throw new Exception("User not found.");
        }

        if (pilot.id === user.id) {
            await Discord.queue(`Sorry, ${user}, you can't make yourself the team's founder, you already *are* the founder!`, channel);
            throw new Exception("User already the team's founder.");
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
            throw new Exception("Users are not on the same team.");
        }

        const captainCount = Discord.captainCountOnUserTeam(user),
            pilotIsCaptain = Discord.userIsCaptainOrFounder(pilot);
        if (captainCount === 2 && !pilotIsCaptain) {
            await Discord.queue(`Sorry, ${user}, but this action would increase your team's captain count to 3.  You must remove an existing captain with the \`!removecaptain\` command before making ${pilot.displayName} the team's founder.`, channel);
            throw new Exception("Captain count limit reached.");
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
            throw new Exception("User is not able to become the team's founder.");
        }

        if (!confirm) {
            await Discord.queue(`${user}, are you sure you want to make ${pilot.displayName} your team's founder?  Type \`!makefounder ${pilot.displayName} confirm\` to confirm.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${user}, but you must type \`!makefounder ${pilot.displayName} confirm\` to confirm that you wish to transfer team ownership.`, channel);
            return false;
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
        const guildMember = Discord.findGuildMemberById(user.id);
        if (!guildMember) {
            await Discord.queue(`Sorry, ${user}, but you are not part of the OTL!`, channel);
            throw new Exception("User is not on the server.");
        }

        if (!message) {
            await Discord.queue("You must include the name of the team you wish to reinstate.", channel);
            return false;
        }

        const currentChannel = Discord.userStartingTeamChannel(user);
        if (currentChannel) {
            await Discord.queue(`Sorry, ${user}, but you are already in the process of starting a team!  Visit ${currentChannel} to get started, or \`!cancel\` to cancel your new team creation and try this command again.`, channel);
            throw new Exception("User is already in the process of starting a team.");
        }

        let currentTeam;
        try {
            currentTeam = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the team the user is on.", err);
        }

        if (currentTeam) {
            const currentGuildChannel = Discord.findChannelByName(`team-${currentTeam.tag.toLowerCase()}`);
            await Discord.queue(`Sorry, ${user}, but you are already on **${currentTeam.name}**!  Visit your team channel at ${currentGuildChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Exception("User is already on a team.");
        }

        let team;
        try {
            team = await Db.getAnyTeamByNameOrTag(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting a team.", err);
        }

        if (!team) {
            await Discord.queue(`Sorry, ${user}, but I have no record of that team ever existing.`, channel);
            throw new Exception("Team does not exist.");
        }

        if (!team.disbanded) {
            await Discord.queue(`Sorry, ${user}, but you can't reinstate a team that isn't disbanded.`, channel);
            throw new Exception("Team is not disbanded.");
        }

        let wasCaptain;
        try {
            wasCaptain = await Db.wasPreviousCaptainOrFounderOfTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if the user was a captain or founder of a team.", err);
        }

        if (!wasCaptain) {
            await Discord.queue(`Sorry, ${user}, but you must have been a captain or founder of the team you are trying to reinstate.`, channel);
            throw new Exception("Team does not exist.");
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
            throw new Exception("User is not able to reinstate a team.");
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
            throw new Exception("User not allowed to create a new team.");
        }

        try {
            await Db.reinstateTeam(guildMember, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error reinstating a team.", err);
        }

        let channels;
        try {
            channels = await Discord.reinstateTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error reinstating a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, your team has been reinstated!`, channel);
        await Discord.queue(`Congratulations, ${user}!  Your team has been reinstated!  You may now visit ${channels.guildChannel} for team chat, and ${channels.captainChannel} for private chat with your team captains as well as system notifications for your team.`, user);
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
            throw new Exception("User is not a founder or captain.");
        }

        if (!message) {
            await Discord.queue("To set one of your three home maps, you must include the home number you wish to set, followed by the name of the map.  For instance, to set your second home map to Vault, enter the following command: `!home 2 Vault`", channel);
            return true;
        }

        if (!mapMatch.test(message)) {
            await Discord.queue(`Sorry, ${user}, but you must include the home number you wish to set, followed by the name of the map, such as \`!home 2 Vault\`.`, channel);
            throw new Exception("User is not a founder or captain.");
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
            throw new Exception("Team already has this home map set.");
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
        const guildMember = Discord.findGuildMemberById(user.id);
        if (!guildMember) {
            await Discord.queue(`Sorry, ${user}, but you are not part of the OTL!`, channel);
            throw new Exception("User is not on the server.");
        }

        const currentChannel = Discord.userStartingTeamChannel(user);
        if (currentChannel) {
            await Discord.queue(`Sorry, ${user}, but you are already in the process of starting a team!  Visit ${currentChannel} to get started, or \`!cancel\` to cancel your new team creation and try this command again.`, channel);
            throw new Exception("User is already in the process of starting a team.");
        }

        let currentTeam;
        try {
            currentTeam = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the team the user is on.", err);
        }

        if (currentTeam) {
            const currentGuildChannel = Discord.findChannelByName(`team-${currentTeam.tag.toLowerCase()}`);
            await Discord.queue(`Sorry, ${user}, but you are already on **${currentTeam.name}**!  Visit your team channel at ${currentGuildChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Exception("User is already on a team.");
        }

        if (!message) {
            await Discord.queue("You must include the name of the team you want to send a join request to.", channel);
            return false;
        }

        let team;
        try {
            team = await Db.getAnyTeamByNameOrTag(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting a team.", err);
        }

        if (!team) {
            await Discord.queue(`Sorry, ${user}, but I have no record of that team ever existing.`, channel);
            throw new Exception("Team does not exist.");
        }

        if (team.disbanded) {
            await Discord.queue(`Sorry, ${user}, but that team has disbanded.  A former captain or founder may reinstate the team with the \`!reinstate ${team.tag}\` command.`, channel);
            throw new Exception("Team is disbanded.");
        }

        let hasRequested;
        try {
            hasRequested = await Db.hasRequestedTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a user has already requested to join a team.", err);
        }

        if (hasRequested) {
            await Discord.queue(`Sorry, ${user}, but to prevent abuse, you may only requeset to join a team once.`, channel);
            throw new Exception("Request already exists.");
        }

        let hasBeenInvited;
        try {
            hasBeenInvited = await Db.hasBeenInvitedToTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a user has already requested to join a team.", err);
        }

        if (hasBeenInvited) {
            await Discord.queue(`Sorry, ${user}, but you have already been invited to this team.  Type \`!accept ${team.tag.toLowerCase()}\` to join **${team.name}**.`, channel);
            throw new Exception("Invitation exists, request not necessary.");
        }

        try {
            await Db.requestTeam(guildMember, team);
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
            throw new Exception("User is not a founder or captain.");
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
            throw new Exception("Roster is full.");
        }

        let guildPilot;
        if (idParse.test(message)) {
            const {1: userId} = idParse.exec(message);

            guildPilot = Discord.findGuildMemberById(userId);
        } else {
            guildPilot = Discord.findGuildMemberByDisplayName(message);
        }

        if (!guildPilot) {
            await Discord.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to invite.`, channel);
            throw new Exception("User not found.");
        }

        const isStarting = Discord.userIsStartingTeam(guildPilot);
        if (isStarting) {
            await Discord.queue(`Sorry, ${user}, but ${guildPilot.displayName} is currently in the process of starting a team.`, channel);
            throw new Exception("Pilot is already in the process of starting a team.");
        }

        let invited;
        try {
            invited = await Db.teamHasInvitedPilot(user, guildPilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error checking if a pilot was already invited to a team.", err);
        }

        if (invited) {
            await Discord.queue(`Sorry, ${user}, but to prevent abuse you can only invite a pilot to your team once.  If ${guildPilot.displayName} has not responded yet, ask them to \`!accept\` the invitation.`, channel);
            throw new Exception("Pilot already invited.");
        }

        let team;
        try {
            team = await Db.getTeam(guildPilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (team) {
            await Discord.queue(`Sorry, ${user}, but ${guildPilot.displayName} is already on another team!`, channel);
            throw new Exception("Pilot already on another team.");
        }

        try {
            await Db.invitePilotToTeam(user, guildPilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error inviting a pilot to a team.", err);
        }

        try {
            await Discord.invitePilotToTeam(user, guildPilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical Discord error inviting a pilot to a team.  Please resolve this manually as soon as possible.", err);
        }

        await Discord.queue(`${user}, ${guildPilot.displayName} has been invited to your team.`, channel);
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
        const guildMember = Discord.findGuildMemberById(user.id);
        if (!guildMember) {
            await Discord.queue(`Sorry, ${user}, but you are not part of the OTL!`, channel);
            throw new Exception("User is not on the server.");
        }

        const currentChannel = Discord.userStartingTeamChannel(user);
        if (currentChannel) {
            await Discord.queue(`Sorry, ${user}, but you are already in the process of starting a team!  Visit ${currentChannel} to get started, or \`!cancel\` to cancel your new team creation and try this command again.`, channel);
            throw new Exception("User is already in the process of starting a team.");
        }

        let currentTeam;
        try {
            currentTeam = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (currentTeam) {
            const currentGuildChannel = Discord.findChannelByName(`team-${currentTeam.tag.toLowerCase()}`);
            await Discord.queue(`Sorry, ${user}, but you are already on **${currentTeam.name}**!  Visit your team channel at ${currentGuildChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Exception("User is already on a team.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${user}, but you must include the name or tag of the team you wish to accept an invitation from.  For example, if you wish to accept an invitation from Cronus Frontier, use either \`!accept Cronus Frontier\` or \`!accept CF\`.`, channel);
            return false;
        }

        if (!nameConfirmParse.test(message)) {
            await Discord.queue(`Sorry, ${user}, but you must include the name or tag of the team you wish to accept an invitation from.  For example, if you wish to accept an invitation from Cronus Frontier, use either \`!accept Cronus Frontier\` or \`!accept CF\`.`, channel);
            return false;
        }

        const {1: name, 2: confirm} = nameConfirmParse.exec(message);
        let team;
        try {
            team = await Db.getAnyTeamByNameOrTag(name);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the team the user is trying to accept an invite for.", err);
        }

        if (!team) {
            await Discord.queue(`Sorry, ${user}, but I can't find a team by that name.`, channel);
            throw new Exception("Invalid team name.");
        }

        if (team.disbanded) {
            await Discord.queue(`Sorry, ${user}, but that team has disbanded.  A former captain or founder may reinstate the team with the \`!reinstate ${team.tag}\` command.`, channel);
            throw new Exception("Team is disbanded.");
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${user}, but that team's roster is locked for the playoffs.  Roster changes will become available when that team is no longer participating.`, channel);
            throw new Exception("Team rosters are locked.");
        }

        let isInvited;
        try {
            isInvited = await Db.isInvitedToTeam(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting what team a user is invited to.", err);
        }

        if (!isInvited) {
            await Discord.queue(`Sorry, ${user}, but you don't have a pending invitation to ${team.name}.`, channel);
            throw new Exception("User does not have an invitation to accept.");
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
            throw new Exception("User not allowed to accept an invite.");
        }

        let bannedUntil;
        try {
            bannedUntil = await Db.bannedFromTeamUntil(user, team);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting when a user has to wait to accept an invite for this team.", err);
        }

        if (bannedUntil) {
            await Discord.queue(`Sorry, ${user}, but you have left this team within the past 28 days.  You will be able to join this team again on ${bannedUntil.toUTCString()}`, channel);
            throw new Exception("User not allowed to accept an invite from this team.");
        }

        if (!confirm) {
            await Discord.queue(`${user}, are you sure you want to join **${team.name}**?  Type \`!accept ${team.tag.toUpperCase()} confirm\` to confirm.  Note that you will not be able to accept another invitation or create a team for 28 days.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${user}, but you must type \`!accept ${team.tag.toUpperCase()} confirm\` to confirm that you wish to join this team.`, channel);
            return false;
        }

        let requestedTeams;
        try {
            requestedTeams = await Db.getRequestedOrInvitedTeams(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a critical database error getting a user's team invites and requests.  Please resolve this manually as soon as possible.", err);
        }

        try {
            await Db.addUserToTeam(guildMember, team);
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

        requestedTeams.forEach(async (requestedTeam) => {
            await Discord.updateTeam(requestedTeam);
        });

        const guildChannel = Discord.findChannelByName(`team-${team.tag.toLowerCase()}`);
        await Discord.queue(`${user}, you are now a member of **${team.name}**!  Visit your team channel at ${guildChannel} to talk with your teammates.  Best of luck flying in the OTL!`, channel);
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

        if (!team) {
            await Discord.queue(`Sorry, ${user}, but you can't leave a team when you aren't on one!`, channel);
            throw new Exception("User is not on a team.");
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${user}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Exception("Team rosters are locked.");
        }

        const isFounder = Discord.userIsFounder(user);
        if (isFounder) {
            await Discord.queue(`Sorry, ${user}, but you are the team founder.  You must either \`!disband\` the team or choose another teammate to \`!makefounder\`.`, channel);
            throw new Exception("User is the team founder.");
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
            throw new Exception("User is not a founder or captain.");
        }

        let team;
        try {
            team = await Db.getTeam(user);
        } catch (err) {
            await Discord.queue(`Sorry, ${user}, but there was a server error.  An admin will be notified about this.`, channel);
            throw new Exception("There was a database error getting the current team the user is on.", err);
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${user}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Exception("Team rosters are locked.");
        }

        let pilot, confirm;
        if (idConfirmParse.test(message)) {
            const {1: userId, 2: confirmed} = idConfirmParse.exec(message);

            pilot = Discord.findGuildMemberById(userId);
            confirm = confirmed;
        } else if (nameConfirmParse.test(message)) {
            const {1: name, 2: confirmed} = nameConfirmParse.exec(message);

            pilot = Discord.findGuildMemberByDisplayName(name);
            confirm = confirmed;
        } else {
            await Discord.queue(`Sorry, ${user}, but you must mention the pilot you wish to make founder.`, channel);
            return false;
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${user}, but I can't find ${message} on this server.  You must mention the pilot you wish to remove.`, channel);
            throw new Exception("User not found.");
        }

        if (pilot.id === user.id) {
            await Discord.queue(`Sorry, ${user}, you can't remove yourself with this command.  If you wish to leave the server, use the \`!leave\` command.`, channel);
            throw new Exception("User cannot remove themselves.");
        }

        const isFounder = Discord.userIsFounder(user),
            pilotIsCaptain = Discord.userIsCaptainOrFounder(pilot);
        if (!isFounder && pilotIsCaptain) {
            await Discord.queue(`Sorry, ${user}, but you must be the founder to remove this player.`, channel);
            throw new Exception("User cannot remove a captain.");
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
            throw new Exception("User is not removable.");
        }

        if (!confirm) {
            await Discord.queue(`${user}, are you sure you want to remove ${pilot.displayName}?  Type \`!remove ${pilot.displayName} confirm\` to confirm.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${user}, but you must type \`!remove ${pilot.displayName} confirm\` to confirm that you wish to remove this pilot.`, channel);
            return false;
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

    // !settimezone <timezone>
    /*
     * Player must be part of the OTL.
     * Timezone must be valid.
     *
     * Success:
     * 1) Write timezone to the database
     * 2) Post confirmation
     */

    // !challenge <team> <confirm>
    /*
     * Player must be a captain or founder of a team.
     * Team must have 3 home maps picked.
     * Challenged team must exist and be active.
     * Must not already have a challenge against the challenged team.
     * Challenged team must have 2 or more pilots.
     * Challenged team must have 3 home maps picked.
     * Must confirm.
     *
     * Success:
     * 1) Write challenge to database
     * 2) Create chat room and apply appropriate permissions
     * 3) Set topic
     * 4) Set pinned post
     */

    // !clock <team> <confirm>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Team must not have their roster locked. (This means the team is participating in a tournament.)
     * Challenged team must not have their roster locked. (This means the challenged team is participating in a tournament.)
     * Team must not already have put the challenged team on the clock this season.
     * Team must not already have put any team on the clock in the past 28 days.
     * Team must not have two challenges on the clock.
     * Challenged team must not have two challenges on the clock.
     * Must confirm.
     *
     * Success:
     * 1) Write clock to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !pickmap <team> <a|b|c>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Team must be the away team for picking the map.
     * Map must not have already been picked.
     *
     * Success:
     * 1) Write picked map to the database.
     * 2) Update topic
     * 3) Announce in channel
     */

    // !suggestmap <team> <map>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Penalty must not be active.
     * Map must be valid from map list.
     * Map must not have already been picked.
     *
     * Success:
     * 1) Write suggested map to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !confirmmap <team>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Map must not have already been picked.
     * Suggested map must have already been picked by the other team.
     *
     * Success:
     * 1) Write confirmed map to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !suggestneutralserver <team>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Penalty must not be active.
     * Team must be the server home team.
     * Neutral server must not have already been suggested.
     *
     * Success:
     * 1) Write suggested neutral server to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !confirmneutralserver <team>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Neutral server must have already been suggested by the other team.
     *
     * Success:
     * 1) Write confirmed neutral server to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !suggestteamsize <team> <2|3|4>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     *
     * Success:
     * 1) Write suggested team size to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !confirmteamsize <team>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Team size must have already been suggested by the other team.
     *
     * Success:
     * 1) Write confirmed team size to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !suggesttime <team> <time>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     *
     * Success:
     * 1) Write suggested time to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !confirmtime <team>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Time must have already been suggested by the other team.
     *
     * Success:
     * 1) Write confirmed time to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !report <team> <score1> <score2>
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * All challenge parameters must be confirmed.
     *
     * Success:
     * 1) Write reported score to the database
     * 2) Update topic
     * 3) Announce in channel
     */

    // !confirm
    /*
     * Player must be a captain or founder of a team.
     * Challenge must exist against challenged team.
     * Score must have already been reported by the other team.
     *
     * Success:
     * 1) Write confirmed score to the database
     * 2) Update topic
     * 3) Announce in channel
     * 4) Alert administrator
     */

    // !rename <team> <name>
    /*
     * Player must be an admin.
     * Team name must not already exist.
     *
     * Success:
     * 1) Update team name in database
     * 2) Update channel category
     * 3) Update challenges
     * 4) Announce in team channel
     */

    // !retag <team> <tag>
    /*
     * Player must be an admin.
     * Team tag must not already exist.
     *
     * Success:
     * 1) Update team tag in database
     * 2) Update channel category
     * 3) Update challenges
     * 4) Announce in team channel
     */

    // !replacefounder <team> <newfounder>
    /*
     * Player must be an admin.
     * Ensure this doesn't put players over 3 captains.
     *
     * Success:
     * 1) Update database
     * 2) Update team topics
     * 3) Update founder permissions
     * 4) Announce in team channel
     * 5) Announce in roster changes
     */

    // !ejectcaptain <captain>
    /*
     * Player must be an admin.
     * Captain must be a captain of a team.
     *
     * Success:
     * 1) Update database
     * 2) Update team topics
     * 3) Update captain permissions
     * 4) Announce in team channel
     * 5) Announce in roster changes
     */

    // !ejectpilot <pilot>
    /*
     * Player must be an admin.
     * Pilot must be on a team.
     *
     * Success:
     * 1) Update database
     * 2) Update team topics
     * 3) Update pilot permissions
     * 4) Announce in team channel
     * 5) Announce in roster changes
     */

    // !forcemap <team1> <team2> <a|b|c|map choice>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     * Map must be valid from map list.
     *
     * Success:
     * 1) Update database
     * 2) Update challenge topic
     * 3) Announce in challenge channel
     */

    // !forceneutralserver <team1> <team2>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     *
     * Success:
     * 1) Update database
     * 2) Update challenge topic
     * 3) Announce in challenge channel
     */

    // !forceteamsize <team1> <team2> <2|3|4>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     *
     * Success:
     * 1) Update database
     * 2) Update challenge topic
     * 3) Announce in challenge channel
     */

    // !forcetime <team1> <team2> <time>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     *
     * Success:
     * 1) Update database
     * 2) Update challenge topic
     * 3) Announce in challenge channel
     */

    // !forcereport <team1> <team2> <score1> <score2>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     * All challenge parameters must be confirmed.
     *
     * Success:
     * 1) Update database
     * 2) Update challenge topic
     * 3) Announce in challenge channel
     */

    // !adjudicate <team1> <team2> <cancel|extend|penalize> <team1|team2|both> <reason>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     * Either agreed challenge time must have passed, or a challenge on the clock has expired.
     *
     * Success (Cancel)
     * 1) Remove channel
     * 2) Set match to cancelled in the database
     * 3) Announce to both teams.
     *
     * Success (Extend)
     * 1) If challenge is on the clock, set deadline to 14 days from today.
     * 2) Announce to both teams.
     *
     * Success (Penalize)
     * 1) If 1st offense, assess penalty in database, with a 3 game penalty given.
     * 2) If 2nd offense, disband offending teams and blacklist leadership.
     */

    // !pilotstat <team1> <team2> <player> <K> <A> <D>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     * Challenge must have been reported and confirmed, or force reported.
     *
     * Success:
     * 1) Write stat to the database.
     * 2) Confirm with admin.
     */

    // !voidgame <team1> <team2> <#> <reason> <confirm>
    /*
     * Player must be an admin.
     * Must confirm.
     *
     * Success (Teams only)
     * 1) List games between the two teams.
     *
     * Success (With game number)
     * 1) Void game in database
     * 2) Announce to both teams.
     * 3) Post to match results.
     */

    // !closegame <team1> <team2>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     * Challenge must have been reported and confirmed, or force reported.
     * Sufficient stats must have been added to the game.
     *
     * Success:
     * Record match as official in the database.
     * Announce in #match-results
     * Close challenge channel
     */

    // Disband
    /*
     * Remove all challenges
     */

    // Automation
    /*
     * Alert administrator when 28 days have passed since a challenge was issued.
     */
}

module.exports = Commands;
