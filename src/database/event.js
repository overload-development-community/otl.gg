const Db = require("node-database"),
    db = require("./index");

//  #####                        #     ####   #
//  #                            #      #  #  #
//  #      #   #   ###   # ##   ####    #  #  # ##
//  ####   #   #  #   #  ##  #   #      #  #  ##  #
//  #       # #   #####  #   #   #      #  #  #   #
//  #       # #   #      #   #   #  #   #  #  ##  #
//  #####    #     ###   #   #    ##   ####   # ##
/**
 * A class that handles calls to the database for events.
 */
class EventDb {
    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Adds an event.
     * @param {string} title The title of the event.
     * @param {Date} dateStart The start of the event.
     * @param {Date} dateEnd The end of the event.
     * @returns {Promise} A promise that resolves when the event is added.
     */
    static async create(title, dateStart, dateEnd) {
        await db.query(/* sql */`
            INSERT INTO tblEvent (Title, DateStart, DateEnd) VALUES (@title, @dateStart, @dateEnd)
        `, {
            title: {type: Db.VARCHAR(200), value: title},
            dateStart: {type: Db.DATETIME, value: dateStart},
            dateEnd: {type: Db.DATETIME, value: dateEnd}
        });
    }

    //              #    #  #                           #
    //              #    #  #
    //  ###   ##   ###   #  #  ###    ##    ##   # #   ##    ###    ###
    // #  #  # ##   #    #  #  #  #  #     #  #  ####   #    #  #  #  #
    //  ##   ##     #    #  #  #  #  #     #  #  #  #   #    #  #   ##
    // #      ##     ##   ##   ###    ##    ##   #  #  ###   #  #  #
    //  ###                    #                                    ###
    /**
     * Gets the upcoming scheduled events.
     * @returns {Promise<{title: string, dateStart: Date, dateEnd: Date}[]>} A promise that resolves with the upcoming events.
     */
    static async getUpcoming() {
        /**
         * @type {{recordsets: [{Title: string, DateStart: Date, DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Title, DateStart, DateEnd
            FROM tblEvent
            WHERE (DateStart >= GETUTCDATE() AND DateStart <= DATEADD(DAY, 28, GETUTCDATE())) OR (DateStart < GETUTCDATE() AND DateEnd > GETUTCDATE())
            ORDER BY
                CASE WHEN DateStart < GETUTCDATE() THEN 0 ELSE 1 END,
                CASE WHEN DateStart < GETUTCDATE() THEN DateStart ELSE DateEnd END
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => ({
            title: row.Title,
            dateStart: row.DateStart,
            dateEnd: row.DateEnd
        })) || [];
    }

    // ###    ##   # #    ##   # #    ##
    // #  #  # ##  ####  #  #  # #   # ##
    // #     ##    #  #  #  #  # #   ##
    // #      ##   #  #   ##    #     ##
    /**
     * Removes an event from the databse.
     * @param {string} title The title of the event.
     * @returns {Promise} A promise that resolves when the event has been removed.
     */
    static async remove(title) {
        await db.query(/* sql */`
            DELETE FROM tblEvent WHERE Title = @title
        `, {
            title: {type: Db.VARCHAR(200), value: title}
        });
    }
}

module.exports = EventDb;
