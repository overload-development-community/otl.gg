const db = require("./index");

//   ###                                      ####   #
//  #   #                                      #  #  #
//  #       ###    ###    ###    ###   # ##    #  #  # ##
//   ###   #   #      #  #      #   #  ##  #   #  #  ##  #
//      #  #####   ####   ###   #   #  #   #   #  #  #   #
//  #   #  #      #   #      #  #   #  #   #   #  #  ##  #
//   ###    ###    ####  ####    ###   #   #  ####   # ##
/**
 * A class that handles calls to the database for seasons.
 */
class SeasonDb {
    //              #     ##                                  #  #              #
    //              #    #  #                                 ## #              #
    //  ###   ##   ###    #     ##    ###   ###    ##   ###   ## #  #  #  # #   ###    ##   ###    ###
    // #  #  # ##   #      #   # ##  #  #  ##     #  #  #  #  # ##  #  #  ####  #  #  # ##  #  #  ##
    //  ##   ##     #    #  #  ##    # ##    ##   #  #  #  #  # ##  #  #  #  #  #  #  ##    #       ##
    // #      ##     ##   ##    ##    # #  ###     ##   #  #  #  #   ###  #  #  ###    ##   #     ###
    //  ###
    /**
     * Gets the list of season numbers.
     * @returns {Promise<number[]>} A promise that resolves with the list of available seasons.
     */
    static async getSeasonNumbers() {
        /**
         * @type {{recordsets: [{Season: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Season FROM tblSeason ORDER BY Season
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Season) || [];
    }
}

module.exports = SeasonDb;
