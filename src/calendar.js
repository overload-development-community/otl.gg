/**
 * @typedef {import("@googleapis/calendar").calendar_v3.Schema$Event} Google.Calendar.SchemaEvent
 */

const Log = require("./logging/log"),
    path = require("path"),
    settings = require("../settings").google,

    auth = require("@googleapis/calendar").auth,
    calendar = require("@googleapis/calendar").calendar({
        auth: new auth.GoogleAuth({
            keyFile: path.join(__dirname, "../settings.google.json"),
            scopes: ["https://www.googleapis.com/auth/calendar.events"]
        }),
        version: "v3"
    });

//   ###           ##                      #
//  #   #           #                      #
//  #       ###     #     ###   # ##    ## #   ###   # ##
//  #          #    #    #   #  ##  #  #  ##      #  ##  #
//  #       ####    #    #####  #   #  #   #   ####  #
//  #   #  #   #    #    #      #   #  #  ##  #   #  #
//   ###    ####   ###    ###   #   #   ## #   ####  #
/**
 * A class that handles calls to Google Calendar.
 */
class Calendar {
    //          #     #
    //          #     #
    //  ###   ###   ###
    // #  #  #  #  #  #
    // # ##  #  #  #  #
    //  # #   ###   ###
    /**
     * Adds a Google Calendar event.
     * @param {Google.Calendar.SchemaEvent} event The event.
     * @returns {Promise} A promise that returns the calendar event.
     */
    static async add(event) {
        try {
            const res = await calendar.events.insert({
                calendarId: settings.calendarId,
                requestBody: event
            });

            if (res.status !== 200) {
                Log.exception("Error while creating a Google Calendar entry.", res.statusText);
                return void 0;
            }

            return res.data;
        } catch (err) {
            Log.exception("Error while creating a Google Calendar entry.", err);
            return void 0;
        }
    }

    //    #        ##           #
    //    #         #           #
    //  ###   ##    #     ##   ###    ##
    // #  #  # ##   #    # ##   #    # ##
    // #  #  ##     #    ##     #    ##
    //  ###   ##   ###    ##     ##   ##
    /**
     * Deletes a Goolge Calendar event.
     * @param {Google.Calendar.SchemaEvent} event The event.
     * @returns {Promise} A promise that resolves when the event has been deleted.
     */
    static async delete(event) {
        try {
            const res = await calendar.events.delete({
                calendarId: settings.calendarId,
                eventId: event.id
            });

            if ([200, 204].indexOf(res.status) === -1) {
                Log.exception("Error while deleting a Google Calendar entry.", res.statusText);
            }
        } catch (err) {
            Log.exception("Error while deleting a Google Calendar entry.", err);
        }
    }

    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets a Google Calendar event by its ID.
     * @param {string} id The event ID.
     * @returns {Promise<Google.Calendar.SchemaEvent>} A promise that returns the calendar event.
     */
    static async get(id) {
        try {
            const res = await calendar.events.get({
                calendarId: settings.calendarId,
                eventId: id
            });

            if (res.status !== 200) {
                Log.exception("Error while retrieving a Google Calendar entry.", res.statusText);
                return void 0;
            }

            return res.data;
        } catch (err) {
            Log.exception("Error while retrieving a Google Calendar entry.", err);
            return void 0;
        }
    }

    //                #         #
    //                #         #
    // #  #  ###    ###   ###  ###    ##
    // #  #  #  #  #  #  #  #   #    # ##
    // #  #  #  #  #  #  # ##   #    ##
    //  ###  ###    ###   # #    ##   ##
    //       #
    /**
     * Adds a Google Calendar event.
     * @param {string} id The event ID.
     * @param {Google.Calendar.SchemaEvent} event The event.
     * @returns {Promise} A promise that resolves when the event has been updated.
     */
    static async update(id, event) {
        try {
            const res = await calendar.events.patch({
                calendarId: settings.calendarId,
                eventId: id,
                requestBody: event
            });

            if (res.status !== 200) {
                Log.exception("Error while updating a Google Calendar entry.", res.statusText);
            }
        } catch (err) {
            Log.exception("Error while updating a Google Calendar entry.", err);
        }
    }
}

module.exports = Calendar;
