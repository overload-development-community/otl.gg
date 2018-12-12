/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 */

const tz = require("timezone-js"),
    tzdata = require("tzdata"),

    Challenge = require("./challenge"),
    pjson = require("./package.json"),
    NewTeam = require("./newTeam"),
    Team = require("./team"),
    Warning = require("./warning"),

    colorMatch = /^(?:dark |light )?(?:red|orange|yellow|green|aqua|blue|purple)$/,
    idParse = /^<@!?([0-9]+)>$/,
    idConfirmParse = /^<@!?([0-9]+)>(?: (confirm|[^ ]*))?$/,
    idMessageParse = /^<@!?([0-9]+)> ([^ ]+)(?: (.+))?$/,
    mapMatch = /^([123]) (.+)$/,
    nameConfirmParse = /^@?(.+?)(?: (confirm|[^ ]*))?$/,
    teamNameMatch = /^[0-9a-zA-Z ]{6,25}$/,
    teamTagMatch = /^[0-9A-Z]{1,5}$/,
    twoTeamMatch = /^([^ ]+) ([^ ]+)$/;

/**
 * @type {typeof import("./discord")}
 */
let Discord;

setTimeout(() => {
    Discord = require("./discord");
}, 0);

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
    //         #                ##           #
    //                           #           #
    //  ###   ##    # #   #  #   #     ###  ###    ##
    // ##      #    ####  #  #   #    #  #   #    # ##
    //   ##    #    #  #  #  #   #    # ##   #    ##
    // ###    ###   #  #   ###  ###    # #    ##   ##
    /**
     * Simulates other users making a command.
     * @param {DiscordJs.GuildMember} member The guild member initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async simulate(member, channel, message) {
        if (!Discord.isOwner(member)) {
            throw new Warning("Owner permission required to perform this command.");
        }

        if (!idMessageParse.test(message)) {
            return false;
        }

        const {1: id, 2: command, 3: newMessage} = idMessageParse.exec(message);
        if (Object.getOwnPropertyNames(Commands.prototype).filter((p) => typeof Commands.prototype[p] === "function" && p !== "constructor").indexOf(command) === -1) {
            return false;
        }

        const newMember = await Discord.findGuildMemberById(id);
        if (!newMember) {
            throw new Warning("User does not exist on the server.");
        }

        return await this[command](newMember, channel, newMessage) || void 0;
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async help(member, channel, message) {
        if (message) {
            return false;
        }

        await Discord.queue(`${member}, see the documentation at https://github.com/roncli/otl-bot/blob/master/README.md.`, channel);

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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async version(member, channel, message) {
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async website(member, channel, message) {
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
     * Allows a pilot who is not part of a team to create a new time.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async createteam(member, channel, message) {
        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!createteam\` by itself to begin the process of creating a team.`, channel);
            return false;
        }

        let existingNewTeam;
        try {
            existingNewTeam = await NewTeam.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (existingNewTeam) {
            await Discord.queue(`Sorry, ${member}, but you are already in the process of starting a team!  Visit ${existingNewTeam.channel} to get started.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (team) {
            await Discord.queue(`Sorry, ${member}, but you are already on **${team.name}**!  Visit your team channel at ${team.teamChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Warning("Pilot is already on a team.");
        }

        let canBeCaptain;
        try {
            canBeCaptain = await member.canBeCaptain();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${member}, but due to past penalties, you cannot create a team.`, channel);
            throw new Warning("Pilot is not able to create a team.");
        }

        let deniedUntil;
        try {
            deniedUntil = await member.joinTeamDeniedUntil();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (deniedUntil) {
            await Discord.queue(`Sorry, ${member}, but you have accepted an invitation in the past 28 days.  You will be able to create a new team on ${deniedUntil.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`, channel);
            throw new Warning("Pilot not allowed to create a new team.");
        }

        let newTeam;
        try {
            newTeam = await NewTeam.create(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you have begun the process of creating a team.  Visit ${newTeam.channel} to set up your new team.`, channel);
        return true;
    }

    // ###    ###  # #    ##
    // #  #  #  #  ####  # ##
    // #  #  # ##  #  #  ##
    // #  #   # #  #  #   ##
    /**
     * Names a new team that's being created.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async name(member, channel, message) {
        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To name your team, add the team name after the command, for example \`!name Cronus Frontier\`.`, channel);
            return false;
        }

        let newTeam;
        try {
            newTeam = await NewTeam.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!newTeam) {
            await Discord.queue(`Sorry, ${member}, but you cannot name a team when you're not in the process of creating one.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        if (!teamNameMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but to prevent abuse, you can only use alphanumeric characters and spaces, and names must be between 6 and 25 characters.  In the event you need to use other characters, please name your team within the rules for now, and then contact an admin after your team is created.`, channel);
            throw new Warning("Pilot used non-alphanumeric characters in their team name.");
        }

        const exists = Team.nameExists(message);
        if (exists) {
            await Discord.queue(`Sorry, ${member}, but this team name already exists!`, channel);
            throw new Warning("Team name already exists.");
        }

        try {
            await newTeam.setName(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team name is now set to ${message}.  Note that proper casing may be applied to your name by an admin.`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async tag(member, channel, message) {
        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To assign a tag to your team, add the tag after the command, for example \`!tag CF\` for a team named Cronus Frontier.`, channel);
            return false;
        }

        let newTeam;
        try {
            newTeam = await NewTeam.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!newTeam) {
            await Discord.queue(`Sorry, ${member}, but you cannot provide a team tag when you're not in the process of creating a team.  If you need to rename your team due to a misspelling or typo, please contact an admin.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        message = message.toUpperCase();

        if (!teamTagMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you can only use alphanumeric characters, and are limited to 5 characters.`, channel);
            throw new Warning("Pilot used non-alphanumeric characters in their team tag.");
        }

        if (Team.tagExists(message)) {
            await Discord.queue(`Sorry, ${member}, but this team tag already exists!`, channel);
            throw new Warning("Team tag already exists.");
        }

        try {
            await newTeam.setTag(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team tag is now set to ${message}.`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async cancel(member, channel, message) {
        let newTeam;
        try {
            newTeam = await NewTeam.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!newTeam) {
            await Discord.queue(`Sorry, ${member}, but you cannot cancel new team creation when you're not in the process of creating one.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you want to cancel your new team request?  There is no undoing this action!  Type \`!cancel confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!cancel confirm\` to confirm that you wish to cancel your request to create a team.`, channel);
            return false;
        }

        try {
            await newTeam.delete(`${member.displayName} cancelled team creation.`);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue("Your request to create a team has been cancelled.", member);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async complete(member, channel, message) {
        let newTeam;
        try {
            newTeam = await NewTeam.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!newTeam) {
            await Discord.queue(`Sorry, ${member}, but you cannot complete creating a team when you're not in the process of creating one.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        if (!newTeam.name) {
            await Discord.queue(`Sorry, ${member}, but you must use the \`!name\` and \`!tag\` commands to give your team a name and a tag before completing your request to create a team.`, channel);
            throw new Warning("Team not yet given a name.");
        }

        if (!newTeam.tag) {
            await Discord.queue(`Sorry, ${member}, but you must use the \`!tag\` command to give your team a tag before completing your request to create a team.`, channel);
            throw new Warning("Team not yet given a tag.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you want to complete your request to create a team?  There is no undoing this action!  Type \`!complete confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!complete confirm\` to confirm that you wish to complete your request to create a team.`, channel);
            return false;
        }

        if (Team.nameExists(newTeam.name)) {
            await Discord.queue(`Sorry, ${member}, but this team name already exists!  You'll need to use the \`!name\` command to try another.`, channel);
            throw new Warning("Team name already exists.");
        }

        if (Team.tagExists(newTeam.tag)) {
            await Discord.queue(`Sorry, ${member}, but this team tag already exists!  You'll need to use the \`!tag\` command to try another.`, channel);
            throw new Warning("Team tag already exists.");
        }

        let team;
        try {
            team = await Team.create(newTeam);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`Congratulations, ${member}!  Your team has been created!  You may now visit ${team.teamChannel} for team chat, and ${team.captainsChannel} for private chat with your team captains as well as system notifications for your team.`, member);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async color(member, channel, message) {
        const isFounder = member.isFounder();
        if (!isFounder) {
            await Discord.queue(`Sorry, ${member}, but you must be a team founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder.");
        }

        if (!message) {
            await Discord.queue("You can use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter `!color dark green`.", channel);
            return true;
        }

        if (!colorMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you can only use the following colors: red, orange, yellow, green, aqua, blue, purple.  You can also request a light or dark variant.  For instance, if you want a dark green color for your team, enter \`!color dark green\`.`, channel);
            throw new Warning("Invalid color.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        const colors = message.split(" ");
        let color;

        switch (colors[colors.length === 1 ? 0 : 1]) {
            case "red":
                switch (colors[0]) {
                    case "dark":
                        color = 0x800000;
                        break;
                    case "light":
                        color = 0xFF8080;
                        break;
                    default:
                        color = 0xFF0000;
                        break;
                }
                break;
            case "orange":
                switch (colors[0]) {
                    case "dark":
                        color = 0x804000;
                        break;
                    case "light":
                        color = 0xFFC080;
                        break;
                    default:
                        color = 0xFF8000;
                        break;
                }
                break;
            case "yellow":
                switch (colors[0]) {
                    case "dark":
                        color = 0x808000;
                        break;
                    case "light":
                        color = 0xFFFF80;
                        break;
                    default:
                        color = 0xFFFF00;
                        break;
                }
                break;
            case "green":
                switch (colors[0]) {
                    case "dark":
                        color = 0x008000;
                        break;
                    case "light":
                        color = 0x80FF80;
                        break;
                    default:
                        color = 0x00FF00;
                        break;
                }
                break;
            case "aqua":
                switch (colors[0]) {
                    case "dark":
                        color = 0x008080;
                        break;
                    case "light":
                        color = 0x80FFFF;
                        break;
                    default:
                        color = 0x00FFFF;
                        break;
                }
                break;
            case "blue":
                switch (colors[0]) {
                    case "dark":
                        color = 0x000080;
                        break;
                    case "light":
                        color = 0x8080FF;
                        break;
                    default:
                        color = 0x0000FF;
                        break;
                }
                break;
            case "purple":
                switch (colors[0]) {
                    case "dark":
                        color = 0x800080;
                        break;
                    case "light":
                        color = 0xFF80FF;
                        break;
                    default:
                        color = 0xFF00FF;
                        break;
                }
                break;
        }

        try {
            await team.changeColor(member, color);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team's color has been updated.`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async addcaptain(member, channel, message) {
        const isFounder = member.isFounder();
        if (!isFounder) {
            await Discord.queue(`Sorry, ${member}, but you must be a team founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but you must mention the pilot on your team that you wish to add as a captain.`, channel);
            return false;
        }

        /**
         * @type {DiscordJs.GuildMember}
         */
        let captain;
        if (idParse.test(message)) {
            const {1: id} = idParse.exec(message);

            captain = Discord.findGuildMemberById(id);
        } else {
            captain = Discord.findGuildMemberByDisplayName(message);
        }

        if (!captain) {
            await Discord.queue(`Sorry, ${member}, but I can't find that pilot on this server.  You must mention the pilot you wish to add as a captain.`, channel);
            throw new Warning("Pilot not found.");
        }

        if (captain.id === member.id) {
            await Discord.queue(`Sorry, ${member}, but you can't promote yourself to captain!`, channel);
            throw new Warning("Pilot can't promote themselves.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team.role.members.find((m) => m.id === captain.id)) {
            await Discord.queue(`Sorry, ${member}, but you can only add a captain if they are on your team.`, channel);
            throw new Warning("Pilots are not on the same team.");
        }

        const captainCount = team.captainCount();
        if (captainCount >= 2) {
            await Discord.queue(`Sorry, ${member}, but you already have ${captainCount} captains, and the limit is 2.`, channel);
            throw new Warning("Captain count limit reached.");
        }

        const isCaptain = captain.isCaptainOrFounder();
        if (isCaptain) {
            await Discord.queue(`Sorry, ${member}, but ${captain.displayName} is already a captain!`, channel);
            throw new Warning("Pilot is already a captain.");
        }

        let canBeCaptain;
        try {
            canBeCaptain = await captain.canBeCaptain();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${member}, but due to past penalties, ${captain.displayName} is not a pilot you can add as a captain.`, channel);
            throw new Warning("Pilot is not able to become a captain.");
        }

        try {
            await team.addCaptain(member, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, ${captain.displayName} is now a team captain!`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async removecaptain(member, channel, message) {
        const isFounder = member.isFounder();
        if (!isFounder) {
            await Discord.queue(`Sorry, ${member}, but you must be a team founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but you must mention the pilot on your team that you wish to remove as a captain.`, channel);
            return false;
        }

        let captain;
        if (idParse.test(message)) {
            const {1: id} = idParse.exec(message);

            captain = Discord.findGuildMemberById(id);
        } else {
            captain = Discord.findGuildMemberByDisplayName(message);
        }

        if (!captain) {
            await Discord.queue(`Sorry, ${member}, but I can't find that pilot on this server.  You must mention the pilot you wish to remove as a captain.`, channel);
            throw new Warning("Pilot not found.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team.role.members.find((m) => m.id === captain.id)) {
            await Discord.queue(`Sorry, ${member}, but you can only remove a captain if they are on your team.`, channel);
            throw new Warning("Pilots are not on the same team.");
        }

        const isCaptain = captain.isCaptainOrFounder();
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${member}, but ${captain.displayName} is not a captain!`, channel);
            throw new Warning("Pilot is already a captain.");
        }

        try {
            await team.removeCaptain(member, captain);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, ${captain.displayName} is no longer a team captain.`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async disband(member, channel, message) {
        const isFounder = member.isFounder();
        if (!isFounder) {
            await Discord.queue(`Sorry, ${member}, but you must be a team founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${member}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Warning("Team rosters are locked.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you want to disband your team?  There is no undoing this action!  Type \`!disband confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!disband confirm\` to confirm that you wish to disband your team.`, channel);
            return false;
        }

        try {
            await team.disbandTeam(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue("You have successfully disbanded your team.  Note that you or anyone else who has been founder or captain of your team in the past may `!reinstate` your team.", member);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async makefounder(member, channel, message) {
        const isFounder = member.isFounder();
        if (!isFounder) {
            await Discord.queue(`Sorry, ${member}, but you must be a team founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but you must mention the pilot you wish to make founder.`, channel);
            return false;
        }

        let pilot, confirm;
        if (idConfirmParse.test(message)) {
            const {1: id, 2: confirmed} = idConfirmParse.exec(message);

            pilot = Discord.findGuildMemberById(id);
            confirm = confirmed;
        } else if (nameConfirmParse.test(message)) {
            const {1: name, 2: confirmed} = nameConfirmParse.exec(message);

            pilot = Discord.findGuildMemberByDisplayName(name);
            confirm = confirmed;
        } else {
            await Discord.queue(`Sorry, ${member}, but you must mention the pilot you wish to make founder.`, channel);
            return false;
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${member}, but I can't find that pilot on this server.  You must mention the pilot you wish to make founder.`, channel);
            throw new Warning("Pilot not found.");
        }

        if (pilot.id === member.id) {
            await Discord.queue(`Sorry, ${member}, you can't make yourself the team's founder, you already *are* the founder!`, channel);
            throw new Warning("Pilot is already the team's founder.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team.role.members.find((m) => m.id === pilot.id)) {
            await Discord.queue(`Sorry, ${member}, but you can only add a captain if they are on your team.`, channel);
            throw new Warning("Pilots are not on the same team.");
        }

        const captainCount = team.captainCount();
        if (captainCount === 2 && !pilot.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you already have ${captainCount} captains, and the limit is 2.`, channel);
            throw new Warning("Captain count limit reached.");
        }

        let canBeCaptain;
        try {
            canBeCaptain = await pilot.canBeCaptain();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${member}, but due to past penalties, ${pilot.displayName} is not a pilot you can make the team's founder.`, channel);
            throw new Warning("Pilot is not able to become the team's founder.");
        }

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you want to make ${pilot.displayName} your team's founder?  Type \`!makefounder ${pilot.displayName} confirm\` to confirm.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!makefounder ${pilot.displayName} confirm\` to confirm that you wish to transfer team ownership.`, channel);
            return false;
        }

        try {
            await team.makeFounder(member, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you have transferred team ownership to ${pilot.displayName}.  You remain a team captain.`, member);
        return true;
    }

    //              #                  #           #
    //                                 #           #
    // ###    ##   ##    ###    ###   ###    ###  ###    ##
    // #  #  # ##   #    #  #  ##      #    #  #   #    # ##
    // #     ##     #    #  #    ##    #    # ##   #    ##
    // #      ##   ###   #  #  ###      ##   # #    ##   ##
    /**
     * Reinstates a disbanded team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async reinstate(member, channel, message) {
        if (!message) {
            await Discord.queue("You must include the name of the team you wish to reinstate.", channel);
            return false;
        }

        let existingNewTeam;
        try {
            existingNewTeam = await NewTeam.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (existingNewTeam) {
            await Discord.queue(`Sorry, ${member}, but you are already in the process of starting a team!  Visit ${existingNewTeam.channel} to get started.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        let currentTeam;
        try {
            currentTeam = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (currentTeam) {
            await Discord.queue(`Sorry, ${member}, but you are already on **${currentTeam.name}**!  Visit your team channel at ${currentTeam.teamChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Warning("Pilot is already on a team.");
        }

        const {1: name, 2: confirm} = nameConfirmParse.exec(message);
        let team;
        try {
            team = await Team.getByNameOrTag(name);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but I have no record of that team ever existing.`, channel);
            throw new Warning("Team does not exist.");
        }

        if (!team.disbanded) {
            await Discord.queue(`Sorry, ${member}, but you can't reinstate a team that isn't disbanded.`, channel);
            throw new Warning("Team is not disbanded.");
        }

        let wasCaptain;
        try {
            wasCaptain = await member.wasPreviousCaptainOrFounderOfTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!wasCaptain) {
            await Discord.queue(`Sorry, ${member}, but you must have been a captain or founder of the team you are trying to reinstate.`, channel);
            throw new Warning("Team does not exist.");
        }

        let canBeCaptain;
        try {
            canBeCaptain = await member.canBeCaptain();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!canBeCaptain) {
            await Discord.queue(`Sorry, ${member}, but due to past penalties, you cannot reinstate a team.`, channel);
            throw new Warning("Pilot is not able to reinstate a team.");
        }

        let deniedUntil;
        try {
            deniedUntil = await member.joinTeamDeniedUntil();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (deniedUntil) {
            await Discord.queue(`Sorry, ${member}, but you have accepted an invitation in the past 28 days.  You will be able to reinstate this team on ${deniedUntil.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`, channel);
            throw new Warning("Pilot not allowed to create a new team.");
        }

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you wish to reinstate this team?  Type \`!reinstate ${name} confirm\` to confirm that you wish to reinstate this team.  Note that you will not be able to accept another invitation or create a team for 28 days.`, channel);
            return true;
        }

        try {
            await team.reinstate(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your team has been reinstated!`, channel);
        await Discord.queue(`Congratulations, ${member}!  Your team has been reinstated!  You may now visit ${team.teamChannel} for team chat, and ${team.captainsChannel} for private chat with your team captains as well as system notifications for your team.`, member);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async home(member, channel, message) {
        // TODO: Only allow home levels from a valid map list.
        const isCaptain = member.isCaptainOrFounder();
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (!message) {
            await Discord.queue("To set one of your three home maps, you must include the home number you wish to set, followed by the name of the map.  For instance, to set your second home map to Vault, enter the following command: `!home 2 Vault`", channel);
            return true;
        }

        if (!mapMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must include the home number you wish to set, followed by the name of the map, such as \`!home 2 Vault\`.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you are already on **${team.name}**!  Visit your team channel at ${team.teamChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Warning("Pilot is not on a team.");
        }

        const {1: number, 2: map} = mapMatch.exec(message);
        let homes;
        try {
            homes = await team.getHomeMaps();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (homes.indexOf(map) !== -1) {
            await Discord.queue(`Sorry, ${member}, but you already have this map set as your home.`, channel);
            throw new Warning("Team already has this home map set.");
        }

        try {
            await team.applyHomeMap(member, +number, map);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your home map has been set.  Note this only applies to future challenges, any current challenges you have will use the home maps you had at the time of the challenge.`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async request(member, channel, message) {
        let existingNewTeam;
        try {
            existingNewTeam = await NewTeam.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (existingNewTeam) {
            await Discord.queue(`Sorry, ${member}, but you are already in the process of starting a team!  Visit ${existingNewTeam.channel} to get started, or \`!cancel\` to cancel your new team creation and try this command again.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        let currentTeam;
        try {
            currentTeam = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (currentTeam) {
            await Discord.queue(`Sorry, ${member}, but you are already on **${currentTeam.name}**!  Visit your team channel at ${currentTeam.teamChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Warning("Pilot is already on a team.");
        }

        if (!message) {
            await Discord.queue("You must include the name of the team you want to send a join request to.", channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByNameOrTag(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but I can't find a team by that name.`, channel);
            throw new Warning("Team does not exist.");
        }

        if (team.disbanded) {
            await Discord.queue(`Sorry, ${member}, but that team has disbanded.  A former captain or founder may reinstate the team with the \`!reinstate ${team.tag}\` command.`, channel);
            throw new Warning("Team is disbanded.");
        }

        let hasRequested;
        try {
            hasRequested = await member.hasRequestedTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (hasRequested) {
            await Discord.queue(`Sorry, ${member}, but to prevent abuse, you may only requeset to join a team once.`, channel);
            throw new Warning("Request already exists.");
        }

        let hasBeenInvited;
        try {
            hasBeenInvited = await member.hasBeenInvitedToTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (hasBeenInvited) {
            await Discord.queue(`Sorry, ${member}, but you have already been invited to this team.  Type \`!accept ${team.tag.toLowerCase()}\` to join **${team.name}**.`, channel);
            throw new Warning("Invitation exists, request not necessary.");
        }

        try {
            await member.requestTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your request has been sent to join ${team.name}.  The team's leadership has been notified of this request.`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async invite(member, channel, message) {
        const isCaptain = member.isCaptainOrFounder();
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you are not on a team.`, channel);
            throw new Warning("Pilot already on another team.");
        }

        let pilotCount;
        try {
            pilotCount = await team.getPilotAndInvitedCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (pilotCount >= 8) {
            await Discord.queue(`Sorry, ${member}, but there is a maximum of 8 pilots per roster, and your team currently has ${pilotCount}, including invited players.`, channel);
            throw new Warning("Roster is full.");
        }

        /**
         * @type {DiscordJs.GuildMember}
         */
        let pilot;
        if (idParse.test(message)) {
            const {1: id} = idParse.exec(message);

            pilot = Discord.findGuildMemberById(id);
        } else {
            pilot = Discord.findGuildMemberByDisplayName(message);
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${member}, but I can't find that pilot on this server.  You must mention the pilot you wish to invite.`, channel);
            throw new Warning("Pilot not found.");
        }

        let existingNewTeam;
        try {
            existingNewTeam = await NewTeam.getByPilot(pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (existingNewTeam) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} is currently in the process of starting a team.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        let invited;
        try {
            invited = await pilot.hasBeenInvitedToTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (invited) {
            await Discord.queue(`Sorry, ${member}, but to prevent abuse you can only invite a pilot to your team once.  If ${pilot.displayName} has not responded yet, ask them to \`!accept\` the invitation.`, channel);
            throw new Warning("Pilot already invited.");
        }

        let currentTeam;
        try {
            currentTeam = await Team.getByPilot(pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (currentTeam) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} is already on another team!`, channel);
            throw new Warning("Pilot already on another team.");
        }

        try {
            await team.invitePilot(member, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, ${pilot.displayName} has been invited to your team.`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async accept(member, channel, message) {
        let existingNewTeam;
        try {
            existingNewTeam = await NewTeam.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (existingNewTeam) {
            await Discord.queue(`Sorry, ${member}, but you are already in the process of starting a team!  Visit ${existingNewTeam.channel} to get started.`, channel);
            throw new Warning("Pilot is already in the process of starting a team.");
        }

        let currentTeam;
        try {
            currentTeam = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (currentTeam) {
            await Discord.queue(`Sorry, ${member}, but you are already on **${currentTeam.name}**!  Visit your team channel at ${currentTeam.teamChannel} to talk with your teammates, or use \`!leave\` to leave your current team.`, channel);
            throw new Warning("Pilot is already on a team.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but you must include the name or tag of the team you wish to accept an invitation from.  For example, if you wish to accept an invitation from Cronus Frontier, use either \`!accept Cronus Frontier\` or \`!accept CF\`.`, channel);
            return false;
        }

        if (!nameConfirmParse.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must include the name or tag of the team you wish to accept an invitation from.  For example, if you wish to accept an invitation from Cronus Frontier, use either \`!accept Cronus Frontier\` or \`!accept CF\`.`, channel);
            return false;
        }

        const {1: name, 2: confirm} = nameConfirmParse.exec(message);
        let team;
        try {
            team = await Team.getByNameOrTag(name);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but I can't find a team by that name.`, channel);
            throw new Warning("Invalid team name.");
        }

        if (team.disbanded) {
            await Discord.queue(`Sorry, ${member}, but that team has disbanded.  A former captain or founder may reinstate the team with the \`!reinstate ${team.tag}\` command.`, channel);
            throw new Warning("Team is disbanded.");
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${member}, but that team's roster is locked for the playoffs.  Roster changes will become available when that team is no longer participating.`, channel);
            throw new Warning("Team rosters are locked.");
        }

        let isInvited;
        try {
            isInvited = await member.hasBeenInvitedToTeam(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!isInvited) {
            await Discord.queue(`Sorry, ${member}, but you don't have a pending invitation to ${team.name}.`, channel);
            throw new Warning("Pilot does not have an invitation to accept.");
        }

        let deniedUntil;
        try {
            deniedUntil = await member.joinTeamDeniedUntil();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (deniedUntil) {
            await Discord.queue(`Sorry, ${member}, but you have accepted an invitation in the past 28 days.  You will be able to join a new team on ${deniedUntil.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`, channel);
            throw new Warning("Pilot not allowed to accept an invite.");
        }

        let bannedUntil;
        try {
            bannedUntil = await member.bannedFromTeamUntil(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (bannedUntil) {
            await Discord.queue(`Sorry, ${member}, but you have left this team within the past 28 days.  You will be able to join this team again on ${bannedUntil.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}`, channel);
            throw new Warning("Pilot not allowed to accept an invite from this team.");
        }

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you want to join **${team.name}**?  Type \`!accept ${team.tag.toUpperCase()} confirm\` to confirm.  Note that you will not be able to accept another invitation or create a team for 28 days.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!accept ${team.tag.toUpperCase()} confirm\` to confirm that you wish to join this team.`, channel);
            return false;
        }

        let requestedTeams;
        try {
            requestedTeams = await member.getRequestedOrInvitedTeams();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        try {
            await team.addPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        requestedTeams.forEach(async (requestedTeam) => {
            await requestedTeam.updateChannels();
        });

        const teamChannel = team.teamChannel;
        await Discord.queue(`${member}, you are now a member of **${team.name}**!  Visit your team channel at ${teamChannel} to talk with your teammates.  Best of luck flying in the OTL!`, channel);
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
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async leave(member, channel, message) {
        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you can't leave a team when you aren't on one!`, channel);
            throw new Warning("Pilot is not on a team.");
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${member}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Warning("Team rosters are locked.");
        }

        const isFounder = member.isFounder();
        if (isFounder) {
            await Discord.queue(`Sorry, ${member}, but you are the team founder.  You must either \`!disband\` the team or choose another teammate to \`!makefounder\`.`, channel);
            throw new Warning("Pilot is the team founder.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you want to leave **${team.name}**?  Type \`!leave confirm\` to confirm.  Note that you will not be able to rejoin this team for 28 days.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!leave confirm\` to confirm that you wish to leave **${team.name}**.  Note that you will not be able to rejoin this team for 28 days.`, channel);
            return false;
        }

        try {
            await team.pilotLeft(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you have left **${team.name}**.`, member);
        return true;
    }

    // ###    ##   # #    ##   # #    ##
    // #  #  # ##  ####  #  #  # #   # ##
    // #     ##    #  #  #  #  # #   ##
    // #      ##   #  #   ##    #     ##
    /**
     * Removes a pilot from a team, rejects a pilot requesting to join the team, or revokes an invitation to join the team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async remove(member, channel, message) {
        const isCaptain = member.isCaptainOrFounder();
        if (!isCaptain) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (team.locked) {
            await Discord.queue(`Sorry, ${member}, but your team's roster is locked for the playoffs.  Roster changes will become available when your team is no longer participating.`, channel);
            throw new Warning("Team rosters are locked.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To remove a pilot, you must mention them as part of the \`!remove\` command.`, channel);
            return false;
        }

        /**
         * @type {DiscordJs.GuildMember}
         */
        let pilot;
        let confirm;
        if (idConfirmParse.test(message)) {
            const {1: id, 2: confirmed} = idConfirmParse.exec(message);

            pilot = Discord.findGuildMemberById(id);
            confirm = confirmed;
        } else if (nameConfirmParse.test(message)) {
            const {1: name, 2: confirmed} = nameConfirmParse.exec(message);

            pilot = Discord.findGuildMemberByDisplayName(name);
            confirm = confirmed;
        } else {
            await Discord.queue(`Sorry, ${member}, but you must mention the pilot you wish to make founder.`, channel);
            return false;
        }

        if (!pilot) {
            await Discord.queue(`Sorry, ${member}, but I can't find that pilot on this server.  You must mention the pilot you wish to remove.`, channel);
            throw new Warning("Pilot not found.");
        }

        if (pilot.id === member.id) {
            await Discord.queue(`Sorry, ${member}, you can't remove yourself with this command.  If you wish to leave the team, use the \`!leave\` command.`, channel);
            throw new Warning("Pilot cannot remove themselves.");
        }

        const isFounder = member.isFounder(),
            pilotIsCaptain = pilot.isCaptainOrFounder();
        if (!isFounder && pilotIsCaptain) {
            await Discord.queue(`Sorry, ${member}, but you must be the founder to remove this player.`, channel);
            throw new Warning("Pilot cannot remove a captain.");
        }

        let removable;
        try {
            removable = await member.canRemovePilot(pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!removable) {
            await Discord.queue(`Sorry, ${member}, but ${pilot.displayName} is not a pilot you can remove.`, channel);
            throw new Warning("Pilot is not removable.");
        }

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you want to remove ${pilot.displayName}?  Type \`!remove ${pilot.displayName} confirm\` to confirm.`, channel);
            return true;
        }

        if (confirm !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!remove ${pilot.displayName} confirm\` to confirm that you wish to remove this pilot.`, channel);
            return false;
        }

        try {
            await team.removePilot(member, pilot);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you have removed ${pilot.displayName}.`, member);
        return true;
    }

    //  #     #
    //  #
    // ###   ##    # #    ##   ####   ##   ###    ##
    //  #     #    ####  # ##    #   #  #  #  #  # ##
    //  #     #    #  #  ##     #    #  #  #  #  ##
    //   ##  ###   #  #   ##   ####   ##   #  #   ##
    /**
     * Sets a pilot's time zone.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async timezone(member, channel, message) {
        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  You must specify a time zone with this command.`, channel);
            return false;
        }

        if (!tzdata.zones[message]) {
            await Discord.queue(`Sorry, ${member}, but that time zone is not recognized.  Please note that this command is case sensitive.`, channel);
            throw new Warning("Invalid time zone.");
        }

        let time;
        try {
            time = new Date().toLocaleString("en-US", {timeZone: message, hour12: true, hour: "numeric", minute: "2-digit"});
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but that time zone is not recognized.  Please note that this command is case sensitive.`, channel);
            throw new Warning("Invalid time zone.");
        }

        try {
            await member.setTimezone(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your time zone has been set to ${message}, where the current local time is ${time}.`, channel);
        return true;
    }

    //       #           ##    ##
    //       #            #     #
    //  ##   ###    ###   #     #     ##   ###    ###   ##
    // #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #     #  #  # ##   #     #    ##    #  #   ##   ##
    //  ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //                                            ###
    /**
     * Issues a challenge to another team.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async challenge(member, channel, message) {
        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  You must specify the team you wish to challenge with this command.`, channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        let pilotCount;
        try {
            pilotCount = await team.getPilotCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (pilotCount < 2) {
            await Discord.queue(`Sorry, ${member}, but your team must have 2 or more pilots to challenge another team.  \`!invite\` some pilots to your team!`, channel);
            throw new Warning("Team only has one member.");
        }

        let homeMaps;
        try {
            homeMaps = await team.getHomeMaps();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (homeMaps.length !== 3) {
            await Discord.queue(`Sorry, ${member}, but your team must have 3 home maps set before you challenge another team.  Use the \`!home <number> <map>\` command to set your team's home maps.`, channel);
            throw new Warning("Team does not have 3 home maps set.");
        }

        const {1: name, 2: confirm} = nameConfirmParse.exec(message);
        let opponent;
        try {
            opponent = await Team.getByNameOrTag(name);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!opponent) {
            await Discord.queue(`Sorry, ${member}, but I have no record of that team ever existing.`, channel);
            throw new Warning("Team does not exist.");
        }

        if (opponent.disbandTeam) {
            await Discord.queue(`Sorry, ${member}, but that team is disbanded.`, channel);
            throw new Warning("Team is disbanded.");
        }

        let opponentHomeMaps;
        try {
            opponentHomeMaps = await opponent.getHomeMaps();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (opponentHomeMaps.length !== 3) {
            await Discord.queue(`Sorry, ${member}, but your opponents must have 3 home maps set before you can challenge them.`, channel);
            throw new Warning("Opponent does not have 3 home maps set.");
        }

        let opponentPilotCount;
        try {
            opponentPilotCount = await opponent.getPilotCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (opponentPilotCount < 2) {
            await Discord.queue(`Sorry, ${member}, but your opponents must have 2 or more pilots to be challenged.`, channel);
            throw new Warning("Opponent only has one member.");
        }

        let existingChallenge;
        try {
            existingChallenge = await Challenge.getByTeams(team, opponent);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (existingChallenge) {
            await Discord.queue(`Sorry, ${member}, but there is already a pending challenge between these two teams!  Visit ${existingChallenge.channel} for more information about this match.`, channel);
            throw new Warning("Challenge already exists.");
        }

        if (!confirm) {
            await Discord.queue(`${member}, are you sure you wish to challenge **${opponent.name}**?  Type \`!challenge ${name} confirm\` to confirm.`, channel);
            return true;
        }

        let challenge;
        try {
            challenge = await Challenge.create(team, opponent);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your challenge to **${opponent.name}** has been issued!  Visit ${challenge.channel} for match discussion and to set the parameters for your match.`, channel);
        return true;
    }

    //        #          #
    //                   #
    // ###   ##     ##   # #   # #    ###  ###
    // #  #   #    #     ##    ####  #  #  #  #
    // #  #   #    #     # #   #  #  # ##  #  #
    // ###   ###    ##   #  #  #  #   # #  ###
    // #                                   #
    /**
     * Picks a map for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async pickmap(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        if (challenge.details.homeMapTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team is the home team.  Your opponents must pick the map from your list of home maps.`, channel);
            throw new Warning("Wrong team.");
        }

        if (challenge.details.map) {
            await Discord.queue(`Sorry, ${member}, but the map for this match has already been locked in as **${challenge.details.map}**.`, channel);
            throw new Warning("Map already set.");
        }

        if (!message || ["a", "b", "c"].indexOf(message.toLowerCase()) === -1) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To pick from one of the three home maps, use \`!pickmap a\`, \`!pickmap b\`, or \`!pickmap c\`.`, channel);
            throw new Warning("Missing map selection.");
        }

        try {
            await challenge.pickMap(message.charCodeAt(0) - 96);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                        #
    //                                        #
    //  ###   #  #   ###   ###   ##    ###   ###   # #    ###  ###
    // ##     #  #  #  #  #  #  # ##  ##      #    ####  #  #  #  #
    //   ##   #  #   ##    ##   ##      ##    #    #  #  # ##  #  #
    // ###     ###  #     #      ##   ###      ##  #  #   # #  ###
    //               ###   ###                                 #
    /**
     * Suggests a neutral map for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async suggestmap(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To suggest a neutral map, use the \`!suggestmap\` command with the map you want to suggest.`, channel);
            throw new Warning("Missing map selection.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        if (challenge.details.adminCreated) {
            await Discord.queue(`Sorry, ${member}, but a neutral map may not be agreed to in a match created by an admin.`, channel);
            throw new Warning("Map is locked by admin.");
        }

        if (challenge.details.challengingTeamPenalized || challenge.details.challengedTeamPenalized) {
            await Discord.queue(`Sorry, ${member}, but due to penalties to ${challenge.details.challengingTeamPenalized || challenge.details.challengedTeamPenalized ? "both teams" : challenge.details.challengingTeamPenalized ? `**${challenge.challengingTeam.name}**` : `**${challenge.challengedTeam.name}**`}, a neutral map cannot be suggested.`, channel);
            throw new Warning("Penalties apply.");
        }

        if (challenge.details.map) {
            await Discord.queue(`Sorry, ${member}, but the map for this match has already been locked in as **${challenge.details.map}**.`, channel);
            throw new Warning("Map has already been set.");
        }

        if (challenge.details.homeMaps.indexOf(message) !== -1) {
            await Discord.queue(`Sorry, ${member}, but this is one of the home maps for the home map team, **${challenge.details.homeMapTeam.name}**, and cannot be used as a neutral map.`, channel);
            throw new Warning("Pilot suggested one of the home options.");
        }

        try {
            await challenge.suggestMap(team, message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #
    //                    # #
    //  ##    ##   ###    #    ##    ###   # #   # #    ###  ###
    // #     #  #  #  #  ###    #    #  #  ####  ####  #  #  #  #
    // #     #  #  #  #   #     #    #     #  #  #  #  # ##  #  #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   # #  ###
    //                                                       #
    /**
     * Confirms a suggested neutral map for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async confirmmap(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!confirmmap\` by itself to confirm a suggested neutral map.`, channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        if (challenge.details.map) {
            await Discord.queue(`Sorry, ${member}, but the map for this match has already been locked in as **${challenge.details.map}**.`, channel);
            throw new Warning("Map has already been set.");
        }

        if (!challenge.details.suggestedMap || challenge.details.suggestedMap.length === 0) {
            await Discord.queue(`Sorry, ${member}, but no one has suggested a neutral map for this match yet!  Use the \`!suggestmap\` command to do so.`, channel);
            throw new Warning("No map suggested yet.");
        }

        if (challenge.details.suggestedMapTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team suggested this map, the other team must confirm.`, channel);
            throw new Warning("Can't confirm own neutral map suggestion.");
        }

        try {
            await challenge.confirmMap();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                        #                       #                ##
    //                                        #                       #                 #
    //  ###   #  #   ###   ###   ##    ###   ###   ###    ##   #  #  ###   ###    ###   #     ###    ##   ###   # #    ##   ###
    // ##     #  #  #  #  #  #  # ##  ##      #    #  #  # ##  #  #   #    #  #  #  #   #    ##     # ##  #  #  # #   # ##  #  #
    //   ##   #  #   ##    ##   ##      ##    #    #  #  ##    #  #   #    #     # ##   #      ##   ##    #     # #   ##    #
    // ###     ###  #     #      ##   ###      ##  #  #   ##    ###    ##  #      # #  ###   ###     ##   #      #     ##   #
    //               ###   ###
    /**
     * Suggests a neutral server for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async suggestneutralserver(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!suggestneutralserver\` by itself to suggest a neutral server.`, channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        if (challenge.details.adminCreated) {
            await Discord.queue(`Sorry, ${member}, but a neutral server may not be agreed to in a match created by an admin.`, channel);
            throw new Warning("Server is locked by admin.");
        }

        if (challenge.details.challengingTeamPenalized || challenge.details.challengedTeamPenalized) {
            await Discord.queue(`Sorry, ${member}, but due to penalties to ${challenge.details.challengingTeamPenalized || challenge.details.challengedTeamPenalized ? "both teams" : challenge.details.challengingTeamPenalized ? `**${challenge.challengingTeam.name}**` : `**${challenge.challengedTeam.name}**`}, a neutral server cannot be suggested.`, channel);
            throw new Warning("Penalties apply.");
        }

        if (!challenge.details.usingHomeServerTeam) {
            await Discord.queue(`Sorry, ${member}, but the server for this match has already been locked in to be neutral.`, channel);
            throw new Warning("Neutral server has already been set.");
        }

        if (challenge.details.suggestedNeutralServerTeam) {
            await Discord.queue(`Sorry, ${member}, but **${challenge.details.suggestedNeutralServerTeam.name}** has already suggested for this game to be played on a neutral server.  The other team must use the \`!confirmneutralserver\` command to confirm.`, channel);
            throw new Warning("Map has already been set.");
        }

        try {
            await challenge.suggestNeutralServer(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #                #  #               #                ##     ##
    //                    # #                    ## #               #                 #    #  #
    //  ##    ##   ###    #    ##    ###   # #   ## #   ##   #  #  ###   ###    ###   #     #     ##   ###   # #    ##   ###
    // #     #  #  #  #  ###    #    #  #  ####  # ##  # ##  #  #   #    #  #  #  #   #      #   # ##  #  #  # #   # ##  #  #
    // #     #  #  #  #   #     #    #     #  #  # ##  ##    #  #   #    #     # ##   #    #  #  ##    #     # #   ##    #
    //  ##    ##   #  #   #    ###   #     #  #  #  #   ##    ###    ##  #      # #  ###    ##    ##   #      #     ##   #
    /**
     * Confirms a suggested neutral server for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async confirmneutralserver(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!confirmneutralserver\` by itself to confirm a suggested neutral server.`, channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        if (!challenge.details.suggestedNeutralServerTeam) {
            await Discord.queue(`Sorry, ${member}, but no one has suggested a neutral server for this match yet!  Use the \`!suggestneutralserver\` command to do so.`, channel);
            throw new Warning("Neutral server not suggested yet.");
        }

        if (challenge.details.suggestedNeutralServerTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team suggested a neutral server, the other team must confirm.`, channel);
            throw new Warning("Can't confirm own neutral server suggestion.");
        }

        try {
            await challenge.confirmNeutralServer();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                        #     #                              #
    //                                        #     #
    //  ###   #  #   ###   ###   ##    ###   ###   ###    ##    ###  # #    ###   ##    ####   ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #    # ##  #  #  ####  ##      #      #   # ##
    //   ##   #  #   ##    ##   ##      ##    #     #    ##    # ##  #  #    ##    #     #    ##
    // ###     ###  #     #      ##   ###      ##    ##   ##    # #  #  #  ###    ###   ####   ##
    //               ###   ###
    /**
     * Suggests the team size for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async suggestteamsize(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (!message || ["2", "3", "4", "2v2", "3v3", "4v4", "2V2", "3V3", "4V4"].indexOf(message) === -1) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To suggest a team size, use \`!suggestteamsize 2\`, \`!suggestteamsize 3\`, or \`!suggestteamsize 4\`.`, channel);
            throw new Warning("Missing team size.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        try {
            await challenge.suggestTeamSize(team, +message.charAt(0));
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #                 #                              #
    //                    # #                     #
    //  ##    ##   ###    #    ##    ###   # #   ###    ##    ###  # #    ###   ##    ####   ##
    // #     #  #  #  #  ###    #    #  #  ####   #    # ##  #  #  ####  ##      #      #   # ##
    // #     #  #  #  #   #     #    #     #  #   #    ##    # ##  #  #    ##    #     #    ##
    //  ##    ##   #  #   #    ###   #     #  #    ##   ##    # #  #  #  ###    ###   ####   ##
    /**
     * Confirms a suggested team size for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async confirmteamsize(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!confirmteamsize\` by itself to confirm a suggested team size.`, channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        if (!challenge.details.suggestedTeamSize) {
            await Discord.queue(`Sorry, ${member}, but no one has suggested a team size for this match yet!  Use the \`!suggestteamsize\` command to do so.`, channel);
            throw new Warning("Team size not yet suggested.");
        }

        if (challenge.details.suggestedTeamSizeTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team suggested this team size, the other team must confirm.`, channel);
            throw new Warning("Can't confirm own team size suggestion.");
        }

        try {
            await challenge.confirmTeamSize();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                                        #     #     #
    //                                        #     #
    //  ###   #  #   ###   ###   ##    ###   ###   ###   ##    # #    ##
    // ##     #  #  #  #  #  #  # ##  ##      #     #     #    ####  # ##
    //   ##   #  #   ##    ##   ##      ##    #     #     #    #  #  ##
    // ###     ###  #     #      ##   ###      ##    ##  ###   #  #   ##
    //               ###   ###
    /**
     * Suggests the time for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async suggesttime(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To suggest a time, use \`!suggesttime\` along with the date and time.  Timezone defaults to Pacific time, use the \`!timezone\` command to set your own time zone.`, channel);
            throw new Warning("Missing time.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.adminCreated) {
            await Discord.queue(`Sorry, ${member}, but a time may not be agreed to in a match created by an admin.`, channel);
            throw new Warning("Time is locked by admin.");
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        let date;
        try {
            date = new Date(new tz.Date(message, await member.getTimezone()).getTime());
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but I couldn't parse that date and time.`, channel);
            throw new Warning("Invalid date.");
        }

        if (!date) {
            await Discord.queue(`Sorry, ${member}, but I couldn't parse that date and time.`, channel);
            throw new Warning("Invalid date.");
        }

        if (date < new Date()) {
            await Discord.queue(`Sorry, ${member}, but that date is in the past.`, channel);
            throw new Warning("Date is in the past.");
        }

        try {
            await challenge.suggestTime(team, date);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //                     #    #                 #     #
    //                    # #                     #
    //  ##    ##   ###    #    ##    ###   # #   ###   ##    # #    ##
    // #     #  #  #  #  ###    #    #  #  ####   #     #    ####  # ##
    // #     #  #  #  #   #     #    #     #  #   #     #    #  #  ##
    //  ##    ##   #  #   #    ###   #     #  #    ##  ###   #  #   ##
    /**
     * Confirms a suggested time for a challenge.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async confirmtime(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!confirmtime\` by itself to confirm a suggested time.`, channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        if (!challenge.details.suggestedTime) {
            await Discord.queue(`Sorry, ${member}, but no one has suggested a time for this match yet!  Use the \`!suggesttime\` command to do so.`, channel);
            throw new Warning("Time not yet suggested.");
        }

        if (challenge.details.suggestedTimeTeam.id === team.id) {
            await Discord.queue(`Sorry, ${member}, but your team suggested this time, the other team must confirm.`, channel);
            throw new Warning("Can't confirm own time suggestion.");
        }

        try {
            await challenge.confirmTime();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //       ##                #
    //        #                #
    //  ##    #     ##    ##   # #
    // #      #    #  #  #     ##
    // #      #    #  #  #     # #
    //  ##   ###    ##    ##   #  #
    /**
     * Puts the challenge on the clock.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async clock(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (!member.isCaptainOrFounder()) {
            await Discord.queue(`Sorry, ${member}, but you must be a team captain or founder to use this command.`, channel);
            throw new Warning("Pilot is not a founder or captain.");
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateClocked) {
            await Discord.queue(`Sorry, ${member}, but this challenge is already on the clock!`, channel);
            throw new Warning("Match already clocked.");
        }

        if (challenge.challengingTeam.locked || challenge.challengedTeam.locked) {
            await Discord.queue(`Sorry, ${member}, but due to tournament participation, this match cannot be clocked.`, channel);
            throw new Warning("A team is in a tournament.");
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been reported.`, channel);
            throw new Warning("Match was already reported.");
        }

        let nextClockDate;
        try {
            nextClockDate = await team.getNextClockDate();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (nextClockDate && nextClockDate > new Date()) {
            await Discord.queue(`Sorry, ${member}, but your team cannot put another challenge on the clock until ${nextClockDate.toLocaleString("en-US", {timeZone: await member.getTimezone(), month: "numeric", day: "numeric", year: "numeric", hour12: true, hour: "numeric", minute: "2-digit", timeZoneName: "short"})}.`, channel);
            throw new Warning("Team has clocked a challenge in the last 28 days.");
        }

        let challengingTeamClockCount;
        try {
            challengingTeamClockCount = await challenge.challengingTeam.getClockedChallengeCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challengingTeamClockCount >= 2) {
            await Discord.queue(`Sorry, ${member}, but **${challenge.challengingTeam.name}** already has two challenges on the clock.`, channel);
            throw new Warning("Challenging team has the maximum number of clocked challenges.");
        }

        let challengedTeamClockCount;
        try {
            challengedTeamClockCount = await challenge.challengedTeam.getClockedChallengeCount();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challengedTeamClockCount >= 2) {
            await Discord.queue(`Sorry, ${member}, but **${challenge.challengedTeam.name}** already has two challenges on the clock.`, channel);
            throw new Warning("Challenged team has the maximum number of clocked challenges.");
        }

        let alreadyClocked;
        try {
            alreadyClocked = await team.hasClockedThisSeason(team.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (alreadyClocked) {
            await Discord.queue(`Sorry, ${member}, but your team has already put **${(team.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam).name}** on the clock this season.`, channel);
            throw new Warning("Team already clocked this season.");
        }

        if (!message) {
            await Discord.queue(`${member}, are you sure you wish to put this challenge on the clock?  This command should only be used if the opposing team is not responding to your challenge.  Note that you can only clock a challenge once every 28 days, you can only clock a team once every season, and you can have a maximum of two active challenges clocked at a time.  Use \`!clock confirm\` to confirm.`, channel);
            return true;
        }

        if (message !== "confirm") {
            await Discord.queue(`Sorry, ${member}, but you must type \`!clock confirm\` to confirm that you wish to put this challenge on the clock.`, channel);
            return false;
        }

        try {
            await challenge.clock(team);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        return true;
    }

    //              #          #      #     #
    //              #          #      #
    // # #    ###  ###    ##   ###   ###   ##    # #    ##
    // ####  #  #   #    #     #  #   #     #    ####  # ##
    // #  #  # ##   #    #     #  #   #     #    #  #  ##
    // #  #   # #    ##   ##   #  #    ##  ###   #  #   ##
    /**
     * Gets the challenge's match time in the pilot's local time zone.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async matchtime(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!matchtime\` by itself to get the match's time in your local time zone.`, channel);
            return false;
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.matchTime) {
            await Discord.queue(`${member}, this match ${challenge.details.matchTime > new Date() ? "is" : "was"} scheduled to take place ${challenge.details.matchTime.toLocaleString("en-US", {timeZone: await member.getTimezone(), weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"})}.`, channel);
        } else {
            await Discord.queue(`${member}, this match has not yet been scheduled.`, channel);
        }

        return true;
    }

    //                          #       #
    //                          #       #
    //  ##    ##   #  #  ###   ###    ###   ##   #  #  ###
    // #     #  #  #  #  #  #   #    #  #  #  #  #  #  #  #
    // #     #  #  #  #  #  #   #    #  #  #  #  ####  #  #
    //  ##    ##    ###  #  #    ##   ###   ##   ####  #  #
    /**
     * Gets the amount of time until the challenge begins.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async countdown(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!countdown\` by itself to get the time remaining until the match begins.`, channel);
            return false;
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.matchTime) {
            const difference = challenge.details.matchTime.getDate() - new Date().getDate(),
                days = Math.abs(difference) / (24 * 60 * 60 * 1000),
                hours = Math.abs(difference) / (60 * 60 * 1000) % 24,
                minutes = Math.abs(difference) / (60 * 1000) % 60 % 60,
                seconds = Math.abs(difference) / 1000 % 60;

            if (difference > 0) {
                await Discord.queue(`${member}, this match is scheduled to begin in ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}, `}.`, channel);
            } else {
                await Discord.queue(`${member}, this match was scheduled to begin ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}, `} ago.`, channel);
            }
        } else {
            await Discord.queue(`${member}, this match has not yet been scheduled.`, channel);
        }

        return true;
    }

    //    #                 #  ##     #
    //    #                 #   #
    //  ###   ##    ###   ###   #    ##    ###    ##
    // #  #  # ##  #  #  #  #   #     #    #  #  # ##
    // #  #  ##    # ##  #  #   #     #    #  #  ##
    //  ###   ##    # #   ###  ###   ###   #  #   ##
    /**
     * Gets the challenge's clock deadline in the pilot's local time zone.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async deadline(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!deadline\` by itself to get the match's clock deadline in your local time zone.`, channel);
            return false;
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateClockDeadline) {
            await Discord.queue(`${member}, the clock deadline ${challenge.details.dateClockDeadline > new Date() ? "expires" : "expired"} ${challenge.details.dateClockDeadline.toLocaleString("en-US", {timeZone: await member.getTimezone(), weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"})}.`, channel);
        } else {
            await Discord.queue(`${member}, this match has not yet been put on the clock.`, channel);
        }

        return true;
    }

    //    #                 #  ##     #                                         #       #
    //    #                 #   #                                               #       #
    //  ###   ##    ###   ###   #    ##    ###    ##    ##    ##   #  #  ###   ###    ###   ##   #  #  ###
    // #  #  # ##  #  #  #  #   #     #    #  #  # ##  #     #  #  #  #  #  #   #    #  #  #  #  #  #  #  #
    // #  #  ##    # ##  #  #   #     #    #  #  ##    #     #  #  #  #  #  #   #    #  #  #  #  ####  #  #
    //  ###   ##    # #   ###  ###   ###   #  #   ##    ##    ##    ###  #  #    ##   ###   ##   ####  #  #
    /**
     * Gets the amount of time until the clock deadline.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async deadlinecountdown(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!deadlinecountdown\` by itself to get the time remaining until the match's clock deadline.`, channel);
            return false;
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        if (challenge.details.dateClockDeadline) {
            const difference = challenge.details.dateClockDeadline.getDate() - new Date().getDate(),
                days = Math.abs(difference) / (24 * 60 * 60 * 1000),
                hours = Math.abs(difference) / (60 * 60 * 1000) % 24,
                minutes = Math.abs(difference) / (60 * 1000) % 60 % 60,
                seconds = Math.abs(difference) / 1000 % 60;

            if (difference > 0) {
                await Discord.queue(`${member}, this match's clock deadline expires in ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}, `}.`, channel);
            } else {
                await Discord.queue(`${member}, this match's clock deadline expired ${days > 0 ? `${days} day${days === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 ? `${hours} hour${hours === 1 ? "" : "s"}, ` : ""}${days > 0 || hours > 0 || minutes > 0 ? `${minutes} minute${minutes === 1 ? "" : "s"}, ` : ""}${`${seconds} second${seconds === 1 ? "" : "s"}, `} ago.`, channel);
            }
        } else {
            await Discord.queue(`${member}, this match has not yet been put on the clock.`, channel);
        }

        return true;
    }

    //  #           #     #          #
    //  #                 #          #
    // ###   #  #  ##    ###    ##   ###
    //  #    #  #   #     #    #     #  #
    //  #    ####   #     #    #     #  #
    //   ##  ####  ###     ##   ##   #  #
    /**
     * Adds a pilot's Twitch channel to their profile.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async twitch(member, channel, message) {
        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To link your Twitch channel, add the name of your channel after the command, for example \`!twitch roncli\`.`, channel);
            return false;
        }

        try {
            await member.addTwitchName(message);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your Twitch channel is now linked as https://twitch.tv/${message}.  If you wish to unlik your channel, use the \`!removetwitch\` command.`, channel);

        return true;
    }

    //                                      #           #     #          #
    //                                      #                 #          #
    // ###    ##   # #    ##   # #    ##   ###   #  #  ##    ###    ##   ###
    // #  #  # ##  ####  #  #  # #   # ##   #    #  #   #     #    #     #  #
    // #     ##    #  #  #  #  # #   ##     #    ####   #     #    #     #  #
    // #      ##   #  #   ##    #     ##     ##  ####  ###     ##   ##   #  #
    /**
     * Removes a pilot's Twitch channel from their profile.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async removetwitch(member, channel, message) {
        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!removetwitch\` by itself to unlink your Twitch channel.`, channel);
            return false;
        }

        try {
            await member.removeTwitchName();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, your Twitch channel is now unlinked.`, channel);

        return true;
    }

    //         #                             #
    //         #
    //  ###   ###   ###    ##    ###  # #   ##    ###    ###
    // ##      #    #  #  # ##  #  #  ####   #    #  #  #  #
    //   ##    #    #     ##    # ##  #  #   #    #  #   ##
    // ###      ##  #      ##    # #  #  #  ###   #  #  #
    //                                                   ###
    /**
     * Indicates that a pilot will be streaming their match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async streaming(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!streaming\` by itself to indicate that you will be streaming this match.`, channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been confirmed.`, channel);
            throw new Warning("Match has been confirmed.");
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        let twitchName;
        try {
            twitchName = await member.getTwitchName();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!twitchName) {
            await Discord.queue(`Sorry, ${member}, but you haven't linked your Twitch channel yet!  Use the \`!twitch\` command to link your Twitch channel.`, channel);
            throw new Warning("Twitch channel not linked.");
        }

        try {
            await challenge.addStreamer(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member} has been setup to stream this match at https://twitch.tv/${twitchName}!`, channel);

        return true;
    }

    //              #            #                             #
    //              #            #
    // ###    ##   ###    ###   ###   ###    ##    ###  # #   ##    ###    ###
    // #  #  #  #   #    ##      #    #  #  # ##  #  #  ####   #    #  #  #  #
    // #  #  #  #   #      ##    #    #     ##    # ##  #  #   #    #  #   ##
    // #  #   ##     ##  ###      ##  #      ##    # #  #  #  ###   #  #  #
    //                                                                     ###
    /**
     * Indicates that a pilot will not be streaming their match.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async notstreaming(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!notstreaming\` by itself to indicate that you will not be streaming the match.`, channel);
            return false;
        }

        let team;
        try {
            team = await Team.getByPilot(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!team) {
            await Discord.queue(`Sorry, ${member}, but you must be on a team to use this command.`, channel);
            throw new Warning("Pilot not on a team.");
        }

        if (challenge.challengingTeam.id !== team.id && challenge.challengedTeam.id !== team.id) {
            await Discord.queue(`Sorry, ${member}, but you are not on one of the teams in this challenge.`, channel);
            throw new Warning("Pilot not on a team in the challenge.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been confirmed.`, channel);
            throw new Warning("Match has been confirmed.");
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        try {
            await challenge.removeStreamer(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member} is no longer streaming this match.`, channel);

        return true;
    }

    //                     #
    //                     #
    //  ##    ###   ###   ###
    // #     #  #  ##      #
    // #     # ##    ##    #
    //  ##    # #  ###      ##
    /**
     * Indicates that a pilot will cast a race.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async cast(member, channel, message) {
        let twitchName;
        try {
            twitchName = member.getTwitchName();
        } catch (err) {
            throw err;
        }

        if (!twitchName) {
            await Discord.queue(`Sorry, ${member}, but you must link your Twitch channel before requesting to cast a match.  Use the \`!twitch\` command to link your Twitch channel.`, channel);
            throw new Warning("Pilot has not linked Twitch.");
        }

        if (!message) {
            await Discord.queue(`Sorry, ${member}, but this command cannot be used by itself.  To cast a match, use \`!cast\` along with the two tags of the teams in the match you wish to cast, for example \`!cast CF JO\`.`, channel);
            return false;
        }

        if (!twoTeamMatch.test(message)) {
            await Discord.queue(`Sorry, ${member}, but you must use \`!cast\` along with the two tags of the teams in the match you wish to cast, for example \`!cast CF JO\`.`, channel);
            return false;
        }

        const {1: tag1, 2: tag2} = twoTeamMatch.exec(message);

        let team1;
        try {
            team1 = await Team.getByNameOrTag(tag1);
        } catch (err) {
            throw err;
        }

        if (!team1) {
            await Discord.queue(`Sorry, ${member}, but I do not recognize **${tag1}** as a valid team tag.`, channel);
            throw new Warning("Invalid team tag.");
        }

        let team2;
        try {
            team2 = await Team.getByNameOrTag(tag1);
        } catch (err) {
            throw err;
        }

        if (!team2) {
            await Discord.queue(`Sorry, ${member}, but I do not recognize **${tag2}** as a valid team tag.`, channel);
            throw new Warning("Invalid team tag.");
        }

        let challenge;
        try {
            challenge = await Challenge.getByTeams(team1, team2);
        } catch (err) {
            throw err;
        }

        if (!challenge) {
            await Discord.queue(`Sorry, ${member}, but I can't find an active challenge between those two teams.`, channel);
            throw new Warning("Invalid team tag.");
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            throw err;
        }

        if (challenge.details.caster) {
            await Discord.queue(`Sorry, ${member}, but ${challenge.details.caster} is already scheduled to cast this match.`, channel);
            throw new Warning("");
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been confirmed.`, channel);
            throw new Warning("Match has been confirmed.");
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        try {
            await challenge.addCaster(member);
        } catch (err) {
            throw err;
        }

        await Discord.queue(`${member}, you are now scheduled to cast the match between **${team1.name}** and **${team2.name}**!  Use ${challenge.channel} to coordinate with the players who will be streaming the match.  If you no longer wish to cast this match, use the \`!uncast\` in ${challenge.channel}`, channel);

        return true;
    }

    //                                 #
    //                                 #
    // #  #  ###    ##    ###   ###   ###
    // #  #  #  #  #     #  #  ##      #
    // #  #  #  #  #     # ##    ##    #
    //  ###  #  #   ##    # #  ###      ##
    /**
     * Indicates that a pilot will not cast a race.
     * @param {DiscordJs.GuildMember} member The user initiating the command.
     * @param {DiscordJs.TextChannel} channel The channel the message was sent over.
     * @param {string} message The text of the command.
     * @returns {Promise} A promise that resolves when the command completes.
     */
    async uncast(member, channel, message) {
        let challenge;
        try {
            challenge = await Challenge.getByChannel(channel);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (!challenge) {
            return false;
        }

        if (message) {
            await Discord.queue(`Sorry, ${member}, but this command does not take any parameters.  Use \`!uncast\` by itself to indicate that you will not be casting the match.`, channel);
            return false;
        }

        try {
            await challenge.loadDetails();
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        if (challenge.details.dateConfirmed) {
            await Discord.queue(`Sorry, ${member}, but this match has already been confirmed.`, channel);
            throw new Warning("Match has been confirmed.");
        }

        if (challenge.details.dateVoided) {
            await Discord.queue(`Sorry, ${member}, but this match is voided.`, channel);
            throw new Warning("Match was voided.");
        }

        try {
            await challenge.removeCaster(member);
        } catch (err) {
            await Discord.queue(`Sorry, ${member}, but there was a server error.  An admin will be notified about this.`, channel);
            throw err;
        }

        await Discord.queue(`${member}, you are no longer scheduled to cast the match, and have been removed from ${challenge.channel}.`, member);

        return true;
    }

    // !report <score1> <score2>
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

    // !creatematch <team1> <team2>
    /*
     * Player must be an admin.
     * A challenge between the two teams must not exist.
     * Both teams must have 3 home maps picked.
     * Both team musts exist and be active.
     * Both teams must have 2 or more pilots.
     *
     * Success:
     * 1) Write locked challenge to database
     * 2) Create chat room and apply appropriate permissions
     * 3) Set topic
     * 4) Set pinned post
     */

    // !lockmatch
    /*
     * Player must be an admin.
     * A challenge between the two teams must exist.
     * Match must be unlocked.
     *
     * Success:
     * 1) Match locks in database.
     * 2) Announce in channel.
     */

    // !unlockmatch
    /*
     * Player must be an admin.
     * A challenge between the two teams must exist.
     * Match must be locked.
     *
     * Success:
     * 1) Match unlocks in database.
     * 2) Announce in channel.
     */

    // !forcehomemapteam <team1> <team2> <hometeam>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     * Home team must be one of the teams.
     *
     * Success:
     * 1) Update database
     * 2) Update team topics
     * 3) Announce in team channel
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

    // !forcehomeserverteam <team1> <team2> <hometeam>
    /*
     * Player must be an admin.
     * Teams must be involved in a challenge.
     * Home team must be one of the teams.
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

    // !adjudicate <team1> <team2> <cancel|extend|penalize> <team1|team2|both> <reason> <confirm>
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
     * 1) Clear agreed upon date.
     * 2) If challenge is on the clock, set deadline to 14 days from today.
     * 3) Announce to both teams.
     *
     * Success (Penalize)
     * 1) Remove channel.
     * 2) Set match to cancelled in the database.
     * 3) If 1st offense, assess penalty in database, with a 3 game penalty given. If 2nd offense, disband offending teams and blacklist leadership.
     * 4) Announce to both teams.
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

    // !teamtimezone <timezone>
    /*
     * Player must be a founder.
     * Timezone must be valid.
     *
     * Success:
     * Write timezone to database
     * Update team timezone
     * Update team's channel topics
     * Update team's challenge channel topics
     */

    // Disband
    /*
     * Remove all challenges
     */

    // Automation
    /*
     * Alert administrator when 28 days have passed since a challenge was clocked.
     * Alert administrator when an hour has passed since a challenge was supposed to be played.
     */
}

module.exports = Commands;
