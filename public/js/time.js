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
function formatDate(time) {
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
            return "Today " + formatTime(time);
        case 86400000:
            return "Tomorrow " + formatTime(time);
        case -86400000:
            return "Yesterday " + formatTime(time);
        default:
            return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][time.getMonth()] + " " + time.getDate().toString() + " " + time.getFullYear().toString() + " " + formatTime(time);
    }
}

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
function formatTime(time) {
    return (time.getHours() === 0 ? "12" : time.getHours() > 12 ? (time.getHours() - 12).toString() : time.getHours().toString()) + ":" + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes().toString() + " " + (time.getHours() < 12 ? "AM" : "PM");
}
