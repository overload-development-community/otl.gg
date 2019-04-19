//   ###
//  #   #
//  #       ###   ## #   ## #    ###   # ##
//  #      #   #  # # #  # # #  #   #  ##  #
//  #      #   #  # # #  # # #  #   #  #   #
//  #   #  #   #  # # #  # # #  #   #  #   #
//   ###    ###   #   #  #   #   ###   #   #
/**
 * A class that provides common functions.
 */
class Common {
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
    static formatTime(time) {
        return (time.getHours() === 0 ? "12" : time.getHours() > 12 ? (time.getHours() - 12).toString() : time.getHours().toString()) + ":" + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes().toString() + " " + (time.getHours() < 12 ? "AM" : "PM");
    }

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
    static formatDate(time) {
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
                return "Today " + Common.formatTime(time);
            case 86400000:
                return "Tomorrow " + Common.formatTime(time);
            case -86400000:
                return "Yesterday " + Common.formatTime(time);
            default:
                return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][time.getMonth()] + " " + time.getDate().toString() + " " + time.getFullYear().toString() + " " + Common.formatTime(time);
        }
    }

    // #      #          ##    ####                       #
    // #      #           #    #                          #
    // ###   ###   # #    #    ###   ###    ##    ##    ###   ##
    // #  #   #    ####   #    #     #  #  #     #  #  #  #  # ##
    // #  #   #    #  #   #    #     #  #  #     #  #  #  #  ##
    // #  #    ##  #  #  ###   ####  #  #   ##    ##    ###   ##
    /**
     * HTML-encodes a string.
     * @param {string} str The string.
     * @returns {string} The encoded string.
     */
    static htmlEncode(str) {
        return str.replace(/[\u0080-\uFFFF<>&]/gim, (i) => `&#${i.charCodeAt(0)};`);
    }

    // ##                   #  ###          #          ###          #          ###                     ##           #
    //  #                   #  #  #         #           #           #           #                       #           #
    //  #     ##    ###   ###  #  #   ###  ###    ###   #    ###   ###    ##    #     ##   # #   ###    #     ###  ###    ##
    //  #    #  #  #  #  #  #  #  #  #  #   #    #  #   #    #  #   #    #  #   #    # ##  ####  #  #   #    #  #   #    # ##
    //  #    #  #  # ##  #  #  #  #  # ##   #    # ##   #    #  #   #    #  #   #    ##    #  #  #  #   #    # ##   #    ##
    // ###    ##    # #   ###  ###    # #    ##   # #  ###   #  #    ##   ##    #     ##   #  #  ###   ###    # #    ##   ##
    //                                                                                           #
    /**
     * Loads data from an API into an element.
     * @param {string} api The API to load data from.
     * @param {string} querySelector The query selector to fill the data into.
     * @param {function} template The template function.
     * @returns {Promise} A promise that resolves when the data has been loaded.
     */
    static loadDataIntoTemplate(api, querySelector, template) {
        var el = document.querySelector(querySelector);

        el.innerHTML = "<div class=\"loading\">Loading...</div>";

        return fetch(api).then((res) => res.json()).then((data) => {
            el.innerHTML = "";

            if (Array.isArray(data)) {
                data.forEach((item) => {
                    el.insertAdjacentHTML("beforeend", template(item));
                });
            } else {
                el.innerHTML = template(data);
            }
        });
    }

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
    static randomBackground() {
        return Common.backgrounds[Math.floor(Math.random() * Common.backgrounds.length)] + ".jpg";
    }
}

Common.backgrounds = [
    "backfire",
    "blizzard",
    "burning indika",
    "centrifuge",
    "foundry",
    "hive",
    "keg party",
    "labyrinth",
    "roundabout",
    "sub rosa",
    "syrinx",
    "terminal",
    "vault",
    "wraith"
];
