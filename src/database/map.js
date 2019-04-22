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
