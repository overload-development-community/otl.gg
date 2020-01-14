/**
 * @typedef {import("./map.types").GetPlayedBySeasonRecordsets} MapDbTypes.GetPlayedBySeasonRecordsets
 * @typedef {import("./map.types").ValidateRecordsets} MapDbTypes.ValidateRecordsets
 * @typedef {import("../models/map.types").MapData} MapTypes.MapData
 */

const Db = require("node-database"),

    Cache = require("../cache"),
    db = require("./index"),
    settings = require("../../settings");

//  #   #                ####   #
//  #   #                 #  #  #
//  ## ##   ###   # ##    #  #  # ##
//  # # #      #  ##  #   #  #  ##  #
//  #   #   ####  ##  #   #  #  #   #
//  #   #  #   #  # ##    #  #  ##  #
//  #   #   ####  #      ####   # ##
//                #
//                #
/**
 * A class that handles calls to the database for maps.
 */
class MapDb {
    //                          #
    //                          #
    //  ##   ###    ##    ###  ###    ##
    // #     #  #  # ##  #  #   #    # ##
    // #     #     ##    # ##   #    ##
    //  ##   #      ##    # #    ##   ##
    /**
     * Adds a map to the database.
     * @param {string} map The map to add.
     * @param {boolean} [stock] Whether or not this is a stock map.
     * @returns {Promise} A promise that resolves when the map has been added.
     */
    static async create(map, stock) {
        await db.query(/* sql */`
            INSERT INTO tblAllowedMap (Map, Stock) VALUES (@map, @stock)
        `, {
            map: {type: Db.VARCHAR(100), value: map},
            stock: {type: Db.BIT, value: !!stock}
        });
    }

    //              #     ##   ##    ##     ##   ##    ##                         #
    //              #    #  #   #     #    #  #   #     #                         #
    //  ###   ##   ###   #  #   #     #    #  #   #     #     ##   #  #   ##    ###
    // #  #  # ##   #    ####   #     #    ####   #     #    #  #  #  #  # ##  #  #
    //  ##   ##     #    #  #   #     #    #  #   #     #    #  #  ####  ##    #  #
    // #      ##     ##  #  #  ###   ###   #  #  ###   ###    ##   ####   ##    ###
    //  ###
    /**
     * Gets the full list of allowed maps in the OTL.
     * @returns {Promise<string[]>} A promise that resolves with the list of maps allowed.
     */
    static async getAllAllowed() {
        /** @type {{recordsets: [{Map: string}[]]}} */
        const data = await db.query(/* sql */`
            SELECT Map FROM tblAllowedMap ORDER BY Map
        `);
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].length && data.recordsets[0].map((row) => row.Map) || [];
    }

    //              #    ###   ##                         #  ###          ##
    //              #    #  #   #                         #  #  #        #  #
    //  ###   ##   ###   #  #   #     ###  #  #   ##    ###  ###   #  #   #     ##    ###   ###    ##   ###
    // #  #  # ##   #    ###    #    #  #  #  #  # ##  #  #  #  #  #  #    #   # ##  #  #  ##     #  #  #  #
    //  ##   ##     #    #      #    # ##   # #  ##    #  #  #  #   # #  #  #  ##    # ##    ##   #  #  #  #
    // #      ##     ##  #     ###    # #    #    ##    ###  ###     #    ##    ##    # #  ###     ##   #  #
    //  ###                                 #                       #
    /**
     * Gets played maps for the season.
     * @param {number} [season] The season number, or void for the latest season.
     * @returns {Promise<string[]>} The list of maps played in a season.
     */
    static async getPlayedBySeason(season) {
        const key = `${settings.redisPrefix}:db:map:getPlayedBySeason:${season || "null"}`;

        /** @type {string[]} */
        let cache = await Cache.get(key);

        if (cache) {
            return cache;
        }

        /** @type {MapDbTypes.GetPlayedBySeasonRecordsets} */
        const data = await db.query(/* sql */`
            IF @season IS NULL
            BEGIN
                SELECT TOP 1
                    @season = Season
                FROM tblSeason
                WHERE DateStart <= GETUTCDATE()
                    AND DateEnd > GETUTCDATE()
                ORDER BY Season DESC
            END

            SELECT DISTINCT Map
            FROM vwCompletedChallenge
            WHERE MatchTime IS NOT NULL
                AND Season = @season
            ORDER BY Map

            SELECT TOP 1 DateEnd FROM tblSeason WHERE DateEnd > GETUTCDATE()
        `, {season: {type: Db.INT, value: season}});
        cache = data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || void 0;

        Cache.add(key, cache, !season && data && data.recordsets && data.recordsets[1] && data.recordsets[1][0] && data.recordsets[1][0].DateEnd || void 0, [`${settings.redisPrefix}:invalidate:challenge:closed`]);

        return cache;
    }

    // ###    ##   # #    ##   # #    ##
    // #  #  # ##  ####  #  #  # #   # ##
    // #     ##    #  #  #  #  # #   ##
    // #      ##   #  #   ##    #     ##
    /**
     * Removes a map from the database.
     * @param {string} map The map to remove.
     * @returns {Promise} A promise that resolves when the map has been removed.
     */
    static async remove(map) {
        await db.query(/* sql */`
            DELETE FROM tblAllowedMap WHERE Map = @map
        `, {map: {type: Db.VARCHAR(100), value: map}});
    }

    //             ##     #       #         #
    //              #             #         #
    // # #    ###   #    ##     ###   ###  ###    ##
    // # #   #  #   #     #    #  #  #  #   #    # ##
    // # #   # ##   #     #    #  #  # ##   #    ##
    //  #     # #  ###   ###    ###   # #    ##   ##
    /**
     * Validates a map.
     * @param {string} map The map.
     * @returns {Promise<MapTypes.MapData>} A promise that resolves with the validated map.
     */
    static async validate(map) {
        /** @type {MapDbTypes.ValidateRecordsets} */
        const data = await db.query(/* sql */`
            SELECT Map, Stock FROM tblAllowedMap WHERE Map = @map
        `, {map: {type: Db.VARCHAR(100), value: map}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {map: data.recordsets[0][0].Map, stock: data.recordsets[0][0].Stock} || void 0;
    }
}

module.exports = MapDb;
