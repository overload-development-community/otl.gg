const Challenge = require("./challenge"),
    Db = require("./database"),
    Log = require("./log");

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
    static async notify() {
        await Notify.notifyExpiredClocks();
        await Notify.notifyStartingMatches();
        await Notify.notifyMissedMatches();
    }

    //              #     #      #         ####               #                   #   ##   ##                #
    //              #           # #        #                                      #  #  #   #                #
    // ###    ##   ###   ##     #    #  #  ###   #  #  ###   ##    ###    ##    ###  #      #     ##    ##   # #    ###
    // #  #  #  #   #     #    ###   #  #  #      ##   #  #   #    #  #  # ##  #  #  #      #    #  #  #     ##    ##
    // #  #  #  #   #     #     #     # #  #      ##   #  #   #    #     ##    #  #  #  #   #    #  #  #     # #     ##
    // #  #   ##     ##  ###    #      #   ####  #  #  ###   ###   #      ##    ###   ##   ###    ##    ##   #  #  ###
    //                                #                #
    /**
     * Notifies the bot alerts channel when a challenge's clock has expired.
     * @returns {Promise} A promise that resolves when expired clock notifications are sent.
     */
    static async notifyExpiredClocks() {
        const challengeIds = await Db.getUnnotifiedExpiredClocks();

        for (const challengeId of challengeIds) {
            try {
                const challenge = await Challenge.getById(challengeId);

                await challenge.notifyClockExpired();
            } catch (err) {
                Log.exception("There was an error notifying that a challenge clock expired.", err);
            }
        }
    }

    //              #     #      #          ##    #                 #     #                #  #         #          #
    //              #           # #        #  #   #                 #                      ####         #          #
    // ###    ##   ###   ##     #    #  #   #    ###    ###  ###   ###   ##    ###    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  #  #   #     #    ###   #  #    #    #    #  #  #  #   #     #    #  #  #  #  #  #  #  #   #    #     #  #  # ##  ##
    // #  #  #  #   #     #     #     # #  #  #   #    # ##  #      #     #    #  #   ##   #  #  # ##   #    #     #  #  ##      ##
    // #  #   ##     ##  ###    #      #    ##     ##   # #  #       ##  ###   #  #  #     #  #   # #    ##   ##   #  #   ##   ###
    //                                #                                               ###
    /**
     * Notifies the challenge channel when a match is about to start.
     * @returns {Promise} A promise that resolves when starting match notifications are sent.
     */
    static async notifyStartingMatches() {
        const challengeIds = await Db.getUnnotifiedStartingMatches();

        for (const challengeId of challengeIds) {
            try {
                const challenge = await Challenge.getById(challengeId);

                await challenge.notifyMatchStarting();
            } catch (err) {
                Log.exception("There was an error notifying that a challenge match is about to start.", err);
            }
        }
    }

    //              #     #      #         #  #   #                           #  #  #         #          #
    //              #           # #        ####                               #  ####         #          #
    // ###    ##   ###   ##     #    #  #  ####  ##     ###    ###    ##    ###  ####   ###  ###    ##   ###    ##    ###
    // #  #  #  #   #     #    ###   #  #  #  #   #    ##     ##     # ##  #  #  #  #  #  #   #    #     #  #  # ##  ##
    // #  #  #  #   #     #     #     # #  #  #   #      ##     ##   ##    #  #  #  #  # ##   #    #     #  #  ##      ##
    // #  #   ##     ##  ###    #      #   #  #  ###   ###    ###     ##    ###  #  #   # #    ##   ##   #  #   ##   ###
    //                                #
    /**
     * Notifies the bot alerts channel when a challenge's match was missed.
     * @returns {Promise} A promise that returns when missed match notifications are sent.
     */
    static async notifyMissedMatches() {
        const challengeIds = await Db.getUnnotifiedMissedMatches();

        for (const challengeId of challengeIds) {
            try {
                const challenge = await Challenge.getById(challengeId);

                await challenge.notifyMatchMissed();
            } catch (err) {
                Log.exception("There was an error notifying that a challenge match was missed.", err);
            }
        }
    }
}

module.exports = Notify;
