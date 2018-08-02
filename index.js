const Discord = require("./discord"),
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

    // Startup Discord.
    Discord.startup();
    Discord.connect();
}());

process.on("unhandledRejection", (err) => {
    Log.exception("Unhandled promise rejection caught.", err);
});
