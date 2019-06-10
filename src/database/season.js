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
        // TODO: Redis
        // Key: otl.gg:db:season:getSeasonNumbers
        // Expiration: End of season
        // Invalidation: otl.gg:invalidate:season:added
        /**
         * @type {{recordsets: [{Season: number}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Season
            FROM tblSeason
            WHERE DateStart < GETUTCDATE()
            ORDER BY Season
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Season) || [];
    }
}

module.exports = SeasonDb;
