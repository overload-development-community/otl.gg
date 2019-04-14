//   #                            #    ###    #
//  # #                           #     #
//  #     ##   ###   # #    ###  ###    #    ##    # #    ##
// ###   #  #  #  #  ####  #  #   #     #     #    ####  # ##
//  #    #  #  #     #  #  # ##   #     #     #    #  #  ##
//  #     ##   #     #  #   # #    ##   #    ###   #  #   ##
/**
 * Formats the time portion of the date.
 * @param {Date} time The time to display.
 * @returns {string} The formatted time.
 */
window.formatTime = function(time) {
    "use strict";

    return (time.getHours() === 0 ? "12" : time.getHours() > 12 ? (time.getHours() - 12).toString() : time.getHours().toString()) + ":" + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes().toString() + " " + (time.getHours() < 12 ? "AM" : "PM");
};

//   #                            #    ###          #
//  # #                           #    #  #         #
//  #     ##   ###   # #    ###  ###   #  #   ###  ###    ##
// ###   #  #  #  #  ####  #  #   #    #  #  #  #   #    # ##
//  #    #  #  #     #  #  # ##   #    #  #  # ##   #    ##
//  #     ##   #     #  #   # #    ##  ###    # #    ##   ##
/**
 * Formats the date to show in the user's time zone.
 * @param {Date} time The date and time to display.
 * @returns {string} The formatted date and time.
 */
window.formatDate = function(time) {
    "use strict";

    const now = new Date(),
        today = new Date(now);

    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);

    const date = new Date(time);

    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    date.setHours(0);

    switch (date.getTime() - today.getTime()) {
        case 0:
            return "Today " + window.formatTime(time);
        case 86400000:
            return "Tomorrow " + window.formatTime(time);
        case -86400000:
            return "Yesterday " + window.formatTime(time);
        default:
            return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][time.getMonth()] + " " + time.getDate().toString() + " " + time.getFullYear().toString() + " " + window.formatTime(time);
    }
};

//                      #              ###               #                                      #
//                      #              #  #              #                                      #
// ###    ###  ###    ###   ##   # #   ###    ###   ##   # #    ###  ###    ##   #  #  ###    ###
// #  #  #  #  #  #  #  #  #  #  ####  #  #  #  #  #     ##    #  #  #  #  #  #  #  #  #  #  #  #
// #     # ##  #  #  #  #  #  #  #  #  #  #  # ##  #     # #    ##   #     #  #  #  #  #  #  #  #
// #      # #  #  #   ###   ##   #  #  ###    # #   ##   #  #  #     #      ##    ###  #  #   ###
//                                                              ###
/**
 * Gives a random background.
 * @return {string} The random background.
 */
window.randomBackground = function() {
    "use strict";

    return ["backfire", "blizzard", "burning indika", "centrifuge", "foundry", "hive", "keg party", "labyrinth", "roundabout", "sub rosa", "syrinx", "terminal", "vault", "wraith"][Math.floor(Math.random() * 11)] + ".jpg";
};
