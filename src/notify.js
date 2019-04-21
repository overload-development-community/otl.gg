const Challenge = require("./challenge"),
    Db = require("./database/challenge"),
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
        let notifications;
        try {
            notifications = await Db.getNotifications();
        } catch (err) {
            Log.exception("There was an error getting challenge notifications.", err);
        }

        await Notify.notifyExpiredClocks(notifications.expiredClocks);
        await Notify.notifyStartingMatches(notifications.startingMatches);
        await Notify.notifyMissedMatches(notifications.missedMatches);
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
     * @param {number[]} challengeIds The challenge IDs to notify for.
     * @returns {Promise} A promise that resolves when expired clock notifications are sent.
     */
    static async notifyExpiredClocks(challengeIds) {
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
     * @param {{challengeId: number, matchTime: Date}[]} challenges The challenges to notify for.
     * @returns {Promise} A promise that resolves when starting match notifications are sent.
     */
    static async notifyStartingMatches(challenges) {
        for (const challengeInfo of challenges) {
            try {
                const challenge = await Challenge.getById(challengeInfo.challengeId);

                await challenge.notifyMatchStarting(challengeInfo.matchTime);
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
     * @param {number[]} challengeIds The challenge IDs to notify for.
     * @returns {Promise} A promise that returns when missed match notifications are sent.
     */
    static async notifyMissedMatches(challengeIds) {
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
