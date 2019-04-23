const Db = require("node-database"),

    settings = require("../../settings"),

    db = new Db(settings.database);

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
        /**
         * @type {{recordsets: [{Map: string}[]]}}
         */
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
        `, {season: {type: Db.INT, value: season}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Map) || void 0;
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
     * @returns {Promise<{map: string, stock: boolean}>} A promise that resolves with the validated map.
     */
    static async validate(map) {
        /**
         * @type {{recordsets: [{Map: string, Stock: boolean}[]]}}
         */
        const data = await db.query(/* sql */`
            SELECT Map, Stock FROM tblAllowedMap WHERE Map = @map
        `, {map: {type: Db.VARCHAR(100), value: map}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {map: data.recordsets[0][0].Map, stock: data.recordsets[0][0].Stock} || void 0;
    }
}

module.exports = MapDb;
