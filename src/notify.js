const Challenge = require("./models/challenge");

//  #   #          #       #      ##
//  #   #          #             #  #
//  ##  #   ###   ####    ##     #     #   #
//  # # #  #   #   #       #    ####   #   #
//  #  ##  #   #   #       #     #     #  ##
//  #   #  #   #   #  #    #     #      ## #
//  #   #   ###     ##    ###    #         #
//                                     #   #
//                                      ###
/**
 * A class that handles Discord notifications.
 */
class Notify {
    //              #     #      #
    //              #           # #
    // ###    ##   ###   ##     #    #  #
    // #  #  #  #   #     #    ###   #  #
    // #  #  #  #   #     #     #     # #
    // #  #   ##     ##  ###    #      #
    //                                #
    /**
     * Runs all notification functions.
     * @returns {Promise} A promise that resolves when all notifications are sent.
     */
    static notify() {
        return Challenge.notify();
    }
}

module.exports = Notify;
