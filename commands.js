const Db = require("./database"),
    Exception = require("./exception"),
    pjson = require("./package.json");

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
}

module.exports = Commands;
