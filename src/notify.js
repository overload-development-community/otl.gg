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
