/**
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 */

const util = require("util");

/**
 * @type {{type: string, date: Date, obj?: object, message?: string}[]}
 */
const queue = [];

/**
 * @type {typeof import("../discord")}
 */
let Discord;

//  #
//  #
//  #       ###    ## #
//  #      #   #  #  #
//  #      #   #   ##
//  #      #   #  #
//  #####   ###    ###
//                #   #
//                 ###
/**
 * A class that handles logging.
 */
class Log {
    // ##
    //  #
    //  #     ##    ###
    //  #    #  #  #  #
    //  #    #  #   ##
    // ###    ##   #
    //              ###
    /**
     * Logs a message.
     * @param {string} message The message to log.
     * @returns {void}
     */
    static log(message) {
        queue.push({
            type: "log",
            date: new Date(),
            message
        });
        Log.output();
    }

    //                          #
    //
    // #  #   ###  ###   ###   ##    ###    ###
    // #  #  #  #  #  #  #  #   #    #  #  #  #
    // ####  # ##  #     #  #   #    #  #   ##
    // ####   # #  #     #  #  ###   #  #  #
    //                                      ###
    /**
     * Logs a warning.
     * @param {string} message The string to log.
     * @returns {void}
     */
    static warning(message) {
        queue.push({
            type: "warning",
            date: new Date(),
            message
        });
        Log.output();
    }

    //                                #     #
    //                                #
    //  ##   #  #   ##    ##   ###   ###   ##     ##   ###
    // # ##   ##   #     # ##  #  #   #     #    #  #  #  #
    // ##     ##   #     ##    #  #   #     #    #  #  #  #
    //  ##   #  #   ##    ##   ###     ##  ###    ##   #  #
    //                         #
    /**
     * Logs an exception.
     * @param {string} message The message describing the error.
     * @param {object} [obj] The object to log.
     * @returns {void}
     */
    static exception(message, obj) {
        queue.push({
            type: "exception",
            date: new Date(),
            message,
            obj
        });
        Log.output();
    }

    //              #                 #
    //              #                 #
    //  ##   #  #  ###   ###   #  #  ###
    // #  #  #  #   #    #  #  #  #   #
    // #  #  #  #   #    #  #  #  #   #
    //  ##    ###    ##  ###    ###    ##
    //                   #
    /**
     * Outputs the log queue.
     * @returns {Promise} A promise that resolves when the output has been completed.
     */
    static async output() {
        if (!Discord) {
            Discord = require("../discord");
        }

        if (Discord.isConnected()) {

            for (const log of queue) {
                if (log.obj) {
                    let value = util.inspect(log.obj),
                        continued = false;

                    while (value.length > 0) {
                        if (continued) {
                            await Discord.queue(value.substring(0, 1024), /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(log.type === "exception" ? "otlbot-errors" : "otlbot-log"))); // eslint-disable-line no-extra-parens
                        } else if (log.message) {
                            const message = Discord.richEmbed({
                                color: log.type === "log" ? 0x80FF80 : log.type === "warning" ? 0xFFFF00 : 0xFF0000,
                                fields: [],
                                timestamp: log.date
                            });

                            message.setDescription(log.message);

                            message.fields.push({
                                name: "Message",
                                value: value.substring(0, 1024)
                            });

                            continued = true;

                            await Discord.richQueue(message, /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(log.type === "exception" ? "otlbot-errors" : "otlbot-log"))); // eslint-disable-line no-extra-parens
                        }

                        value = value.substring(1024);
                    }
                } else {
                    const message = Discord.richEmbed({
                        color: log.type === "log" ? 0x80FF80 : log.type === "warning" ? 0xFFFF00 : 0xFF0000,
                        fields: [],
                        timestamp: log.date
                    });

                    if (log.message) {
                        message.setDescription(log.message);
                    }

                    await Discord.richQueue(message, /** @type {DiscordJs.TextChannel} */ (Discord.findChannelByName(log.type === "exception" ? "otlbot-errors" : "otlbot-log"))); // eslint-disable-line no-extra-parens
                }
            }

            queue.splice(0, queue.length);
        } else {
            console.log(queue[queue.length - 1]);
        }
    }
}

module.exports = Log;
