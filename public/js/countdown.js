//   ###                         #         #
//  #   #                        #         #
//  #       ###   #   #  # ##   ####    ## #   ###   #   #  # ##
//  #      #   #  #   #  ##  #   #     #  ##  #   #  #   #  ##  #
//  #      #   #  #   #  #   #   #     #   #  #   #  # # #  #   #
//  #   #  #   #  #  ##  #   #   #  #  #  ##  #   #  # # #  #   #
//   ###    ###    ## #  #   #    ##    ## #   ###    # #   #   #
/**
 * A class that represents a countdown.
 */
class Countdown {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new countdown instance.
     * @param {number} timeRemaining The amount of time remaining, in milliseconds.
     */
    constructor(timeRemaining) {
        this.deadline = new Date(new Date().getTime() + timeRemaining);
        this.id = ++Countdown.id;

        document.write(`<span id="countdown-${this.id}"></span>`);

        this.update();
    }

    //                #         #
    //                #         #
    // #  #  ###    ###   ###  ###    ##
    // #  #  #  #  #  #  #  #   #    # ##
    // #  #  #  #  #  #  # ##   #    ##
    //  ###  ###    ###   # #    ##   ##
    //       #
    /**
     * Updates the countdown.
     * @returns {void}
     */
    update() {
        const countdown = document.getElementById(`countdown-${this.id}`),
            difference = this.deadline.getTime() - new Date().getTime(),
            days = Math.floor(Math.abs(difference) / (24 * 60 * 60 * 1000));

        if (difference > 0) {
            countdown.innerText = `Match begins in ${days > 0 ? `${days} day${days === 1 ? "" : "s"} ` : ""}${new Date(difference).toLocaleString("en-US", {timeZone: "GMT", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false})}`;

            setTimeout(() => {
                this.update();
            }, difference % 1000 + 1);
        } else {
            countdown.innerText = "Prepare for Overload!";
        }
    }
}

Countdown.id = 0;
