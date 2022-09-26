/**
 * @license
 * Copyright 2020 Weiming Wu, Modifications Copyright 2022 Ronald M. Clifford
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

//   ###                               #
//  #   #                              #
//  #       ###   ## #    ###   # ##   # ##    ###   # ##    ###
//   ###   #   #  # # #      #  ##  #  ##  #  #   #  ##  #  #   #
//      #  #####  # # #   ####  ##  #  #   #  #   #  #      #####
//  #   #  #      # # #  #   #  # ##   #   #  #   #  #      #
//   ###    ###   #   #   ####  #      #   #   ###   #       ###
//                              #
//                              #
/**
 * A class that provides a semaphore.
 */
class Semaphore {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a semaphore that limits the number of concurrent Promises being handled
     * @param {number} maxConcurrentRequests max number of concurrent promises being handled at any time
     */
    constructor(maxConcurrentRequests = 1) {
        /**
         * @type {{resolve: (value: any) => void, reject: (reason?: any) => void, fnToCall: function, args: any[]}[]}
         */
        this.currentRequests = [];
        this.runningRequests = 0;
        this.maxConcurrentRequests = maxConcurrentRequests;
    }

    //             ##    ##    ####                     #     #
    //              #     #    #                        #
    //  ##    ###   #     #    ###   #  #  ###    ##   ###   ##     ##   ###
    // #     #  #   #     #    #     #  #  #  #  #      #     #    #  #  #  #
    // #     # ##   #     #    #     #  #  #  #  #      #     #    #  #  #  #
    //  ##    # #  ###   ###   #      ###  #  #   ##     ##  ###    ##   #  #
    /**
     * Returns a Promise that will eventually return the result of the function passed in
     * Use this to limit the number of concurrent function executions
     * @template T The return type of fnToCall.
     * @param {function(): T|Promise<T>} fnToCall function that has a cap on the number of concurrent executions
     * @param  {...any} args any arguments to be passed to fnToCall
     * @returns {Promise<T>} Promise that will resolve with the resolved value as if the function passed in was directly called
     */
    callFunction(fnToCall, ...args) {
        return new Promise((resolve, reject) => {
            this.currentRequests.push({
                resolve,
                reject,
                fnToCall,
                args
            });
            this.tryNext();
        });
    }

    //  #                #  #               #
    //  #                ## #               #
    // ###   ###   #  #  ## #   ##   #  #  ###
    //  #    #  #  #  #  # ##  # ##   ##    #
    //  #    #      # #  # ##  ##     ##    #
    //   ##  #       #   #  #   ##   #  #    ##
    //              #
    /**
     * Tries the next function.
     * @returns {void}
     */
    tryNext() {
        if (!this.currentRequests.length) {
            return;
        }
        if (this.runningRequests < this.maxConcurrentRequests) {
            const {resolve, reject, fnToCall, args} = this.currentRequests.shift();
            this.runningRequests++;
            const req = fnToCall(...args);
            req.then((res) => resolve(res))
                .catch((err) => reject(err))
                .finally(() => {
                    this.runningRequests--;
                    this.tryNext();
                });
        }
    }
}

module.exports = Semaphore;
