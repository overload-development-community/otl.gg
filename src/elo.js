//  #####   ##
//  #        #
//  #        #     ###
//  ####     #    #   #
//  #        #    #   #
//  #        #    #   #
//  #####   ###    ###
/**
 * A class that handles Elo ratings.
 */
class Elo {
    //                                #             #
    //                                #             #
    //  ##   #  #  ###    ##    ##   ###    ##    ###
    // # ##   ##   #  #  # ##  #      #    # ##  #  #
    // ##     ##   #  #  ##    #      #    ##    #  #
    //  ##   #  #  ###    ##    ##     ##   ##    ###
    //             #
    /**
     * Get the expected result between two ratings.
     * @param {number} a The first rating.
     * @param {number} b The second rating.
     * @return {number} The expected result.
     */
    static expected(a, b) {
        return 1 / (1 + Math.pow(10, (b - a) / 400));
    }

    //              #                ##     ##   ###   ####
    //              #                 #    #  #   #    #
    //  ###   ##   ###   #  #   ###   #    #      #    ###
    // #  #  #      #    #  #  #  #   #    #      #    #
    // # ##  #      #    #  #  # ##   #    #  #   #    #
    //  # #   ##     ##   ###   # #  ###    ##    #    #
    /**
     * Get the actual result between two scores for capture the flag.
     * @param {number} a The first score.
     * @param {number} b The second score.
     * @returns {number} The actual result.
     */
    static actualCTF(a, b) {
        if (a <= 0 && b <= 0) {
            if (a > b) {
                return 1;
            }

            if (b > a) {
                return 0;
            }

            return 0.5;
        }

        if (a <= 0) {
            return 0;
        }

        if (b <= 0) {
            return 1;
        }

        if (a > b) {
            b = (b + a) / 2;
        }

        if (b > a) {
            a = (a + b) / 2;
        }

        return (Math.log2(Math.max(Math.min(a / b, 2), 0.5)) + 1) / 2;
    }

    //              #                ##    ###    ##
    //              #                 #     #    #  #
    //  ###   ##   ###   #  #   ###   #     #    #  #
    // #  #  #      #    #  #  #  #   #     #    ####
    // # ##  #      #    #  #  # ##   #     #    #  #
    //  # #   ##     ##   ###   # #  ###    #    #  #
    /**
     * Get the actual result between two scores for team anarchy.
     * @param {number} a The first score.
     * @param {number} b The second score.
     * @returns {number} The actual result.
     */
    static actualTA(a, b) {
        if (a <= 0 && b <= 0) {
            if (a > b) {
                return 1;
            }

            if (b > a) {
                return 0;
            }

            return 0.5;
        }

        if (a <= 0) {
            return 0;
        }

        if (b <= 0) {
            return 1;
        }

        return (Math.log2(Math.max(Math.min(a / b, 2), 0.5)) + 1) / 2;
    }

    //                #         #
    //                #         #
    // #  #  ###    ###   ###  ###    ##
    // #  #  #  #  #  #  #  #   #    # ##
    // #  #  #  #  #  #  # ##   #    ##
    //  ###  ###    ###   # #    ##   ##
    //       #
    /**
     * Updates a rating.
     * @param {number} expected The expected result.
     * @param {number} actual The actual result.
     * @param {number} rating The rating to update.
     * @param {number} k The K-Factor to use.
     * @return {number} The new rating.
     */
    static update(expected, actual, rating, k) {
        return rating + k * (actual - expected);
    }
}

module.exports = Elo;
