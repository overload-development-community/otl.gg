/**
 * @typedef {import("../../types/seasonDbTypes").GetCurrentSeasonRecordset} SeasonDbTypes.GetCurrentSeasonRecordset
 * @typedef {import("../../types/seasonDbTypes").GetSeasonNumbersRecordset} SeasonDbTypes.GetSeasonNumbersRecordset
 */

const Cache = require("@roncli/node-redis").Cache,
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
    //              #     ##                                  #     ##
    //              #    #  #                                 #    #  #
    //  ###   ##   ###   #     #  #  ###   ###    ##   ###   ###    #     ##    ###   ###    ##   ###
    // #  #  # ##   #    #     #  #  #  #  #  #  # ##  #  #   #      #   # ##  #  #  ##     #  #  #  #
    //  ##   ##     #    #  #  #  #  #     #     ##    #  #   #    #  #  ##    # ##    ##   #  #  #  #
    // #      ##     ##   ##    ###  #     #      ##   #  #    ##   ##    ##    # #  ###     ##   #  #
    //  ###
    /**
     * Gets the current season number.
     * @return {Promise<number>} A promise that returns the current season number.
     */
    static async getCurrentSeason() {
        /** @type {SeasonDbTypes.GetCurrentSeasonRecordset} */
        const data = await db.query(/* sql */`
            SELECT MAX(Season) FROM tblSeason
        `);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && data.recordsets[0][0].Season || void 0;
    }

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

        /** @type {number[]} */
        let cache;

        if (!settings.disableRedis) {
            cache = await Cache.get(key);
        }

        if (cache) {
            return cache;
        }

        /** @type {SeasonDbTypes.GetSeasonNumbersRecordset} */
        const data = await db.query(/* sql */`
            SELECT Season
            FROM tblSeason
            WHERE DateStart < GETUTCDATE()
            ORDER BY Season

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `);
        cache = data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Season) || [];

        if (!settings.disableRedis) {
            await Cache.add(key, cache, data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:season:added`]);
        }

        return cache;
    }
}

module.exports = SeasonDb;
