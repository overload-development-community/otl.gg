const Db = require("../database/event"),
    Exception = require("../logging/exception");

//  #####                        #
//  #                            #
//  #      #   #   ###   # ##   ####
//  ####   #   #  #   #  ##  #   #
//  #       # #   #####  #   #   #
//  #       # #   #      #   #   #  #
//  #####    #     ###   #   #    ##
/**
 * A class that handles event-related functions.
 */
class Event {
    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Adds an event to the database.
     * @param {string} title The title of the event.
     * @param {Date} dateStart The start of the event.
     * @param {Date} dateEnd The end of the event.
     * @returns {Promise} A promise that resolves then the event has been added.
     */
    static async create(title, dateStart, dateEnd) {
        try {
            await Db.create(title, dateStart, dateEnd);
        } catch (err) {
            throw new Exception("There was a database error adding an event.", err);
        }
    }

    //              #    #  #                           #
    //              #    #  #
    //  ###   ##   ###   #  #  ###    ##    ##   # #   ##    ###    ###
    // #  #  # ##   #    #  #  #  #  #     #  #  ####   #    #  #  #  #
    //  ##   ##     #    #  #  #  #  #     #  #  #  #   #    #  #   ##
    // #      ##     ##   ##   ###    ##    ##   #  #  ###   #  #  #
    //  ###                    #                                    ###
    /**
     * Gets the list of upcoming events.
     * @returns {Promise<{title: string, dateStart: Date, dateEnd: Date}[]>} A promise that resolves with the upcoming events.
     */
    static async getUpcoming() {
        let events;
        try {
            events = await Db.getUpcoming();
        } catch (err) {
            throw new Exception("There was a database error getting the upcoming events.", err);
        }

        return events;
    }

    // ###    ##   # #    ##   # #    ##
    // #  #  # ##  ####  #  #  # #   # ##
    // #     ##    #  #  #  #  # #   ##
    // #      ##   #  #   ##    #     ##
    /**
     * Removes an event from the database.
     * @param {string} title The title of the event.
     * @returns {Promise} A promise that resolves then the event has been removed.
     */
    static async remove(title) {
        try {
            await Db.remove(title);
        } catch (err) {
            throw new Exception("There was a database error removing an event.", err);
        }
    }
}

module.exports = Event;
