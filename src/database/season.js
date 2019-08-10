const Cache = require("../cache"),
    db = require("./index"),
    settings = require("../../settings");

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
        const key = `${settings.redisPrefix}:db:season:getSeasonNumbers`;
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /**
         * @type {{recordsets: [{Season: number}[], {DateEnd: Date}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Season
            FROM tblSeason
            WHERE DateStart < GETUTCDATE()
            ORDER BY Season

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `);
        cache = data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Season) || [];

        Cache.add(key, cache, data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:season:added`]);

        return cache;
    }
}

module.exports = SeasonDb;
