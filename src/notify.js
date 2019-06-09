const Challenge = require("./models/challenge");

let setup = false;

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

    //               #                #  #         #     #      #    #                 #     #
    //               #                ## #         #           # #                     #
    //  ###    ##   ###   #  #  ###   ## #   ##   ###   ##     #    ##     ##    ###  ###   ##     ##   ###    ###
    // ##     # ##   #    #  #  #  #  # ##  #  #   #     #    ###    #    #     #  #   #     #    #  #  #  #  ##
    //   ##   ##     #    #  #  #  #  # ##  #  #   #     #     #     #    #     # ##   #     #    #  #  #  #    ##
    // ###     ##     ##   ###  ###   #  #   ##     ##  ###    #    ###    ##    # #    ##  ###    ##   #  #  ###
    //                          #
    /**
     * Setup notifications.
     * @returns {void}
     */
    static setupNotifications() {
        if (setup) {
            return;
        }

        Challenge.notify();

        setup = true;
    }
}

module.exports = Notify;
