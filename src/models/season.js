const Db = require("../database/season"),
    Exception = require("../logging/exception");

//   ###
//  #   #
//  #       ###    ###    ###    ###   # ##
//   ###   #   #      #  #      #   #  ##  #
//      #  #####   ####   ###   #   #  #   #
//  #   #  #      #   #      #  #   #  #   #
//   ###    ###    ####  ####    ###   #   #
/**
 * A class that handles season-related functions.
 */
class Season {
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
        try {
            return await Db.getSeasonNumbers();
        } catch (err) {
            throw new Exception("There was a database error retrieving the season numbers.", err);
        }
    }
}

module.exports = Season;
