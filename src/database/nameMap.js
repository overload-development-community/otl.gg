/**
 * @typedef {import("../../types/nameMapDbTypes").GetAllRecordsets} NameMapDbTypes.GetAllRecordsets
 * @typedef {import("../../types/nameMapTypes").NameMaps} NameMapTypes.NameMaps
 */

const Db = require("@roncli/node-database"),

    db = require("./index");

//  #   #                       #   #                ####   #
//  #   #                       #   #                 #  #  #
//  ##  #   ###   ## #    ###   ## ##   ###   # ##    #  #  # ##
//  # # #      #  # # #  #   #  # # #      #  ##  #   #  #  ##  #
//  #  ##   ####  # # #  #####  #   #   ####  ##  #   #  #  #   #
//  #   #  #   #  # # #  #      #   #  #   #  # ##    #  #  ##  #
//  #   #   ####  #   #   ###   #   #   ####  #      ####   # ##
//                                            #
//                                            #
/**
 * A class that handles calls to the database for name maps.
 */
class NameMapDb {
    //          #     #
    //          #     #
    //  ###   ###   ###
    // #  #  #  #  #  #
    // # ##  #  #  #  #
    //  # #   ###   ###
    /**
     * Adds or updates a name map.
     * @param {string} name The name of the pilot.
     * @param {string} discordId The Discord ID of the pilot.
     * @returns {Promise} A promise that resolves when the name map has been added.
     */
    static async add(name, discordId) {
        await db.query(/* sql */`
            MERGE tblNameMap nm
                USING (VALUES (@name, @discordId)) AS v (Name, DiscordId)
                ON nm.PilotName = v.Name
            WHEN MATCHED THEN
                UPDATE SET DiscordId = v.DiscordId
            WHEN NOT MATCHED THEN
                INSERT (PilotName, DiscordId) VALUES (v.Name, v.DiscordId)
        `, {
            name: {type: Db.VARCHAR(64), value: name},
            discordId: {type: Db.VARCHAR(24), value: discordId}
        });
    }

    //              #     ##   ##    ##
    //              #    #  #   #     #
    //  ###   ##   ###   #  #   #     #
    // #  #  # ##   #    ####   #     #
    //  ##   ##     #    #  #   #     #
    // #      ##     ##  #  #  ###   ###
    //  ###
    /**
     * Gets all name maps.
     * @returns {Promise<NameMapTypes.NameMaps>} A promise that returns the name maps.
     */
    static async getAll() {
        /** @type {NameMapDbTypes.GetAllRecordsets} */
        const data = await db.query(/* sql */`
            SELECT PilotName, DiscordId FROM tblNameMap
        `);

        return data && data.recordsets && data.recordsets[0] && data.recordsets[0].reduce((obj, item) => ({
            ...obj,
            [item.PilotName]: item.DiscordId
        }), {}) || {};
    }
}

module.exports = NameMapDb;
