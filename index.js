const tz = require("timezone-js"),
    tzdata = require("tzdata"),

    Discord = require("./discord"),
    Log = require("./log");

//         #                 #
//         #                 #
//  ###   ###    ###  ###   ###   #  #  ###
// ##      #    #  #  #  #   #    #  #  #  #
//   ##    #    # ##  #      #    #  #  #  #
// ###      ##   # #  #       ##   ###  ###
//                                      #
/**
 * Starts up the application.
 */
(function startup() {
    Log.log("Starting up...");

    tz.timezone.loadingScheme = tz.timezone.loadingSchemes.MANUAL_LOAD;
    tz.timezone.loadZoneDataFromObject(tzdata);

    if (process.platform === "win32") {
        process.title = "Overload Teams League";
    } else {
        process.stdout.write("\x1b]2;Overload Teams League\x1b\x5c");
    }

    // Startup Discord.
    Discord.startup();
    Discord.connect();
}());

process.on("unhandledRejection", (reason) => {
    Log.exception("Unhandled promise rejection caught.", reason);
});

// Begin notifications.
require("./notify");
