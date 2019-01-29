const compression = require("compression"),
    express = require("express"),
    minify = require("express-minify"),
    tz = require("timezone-js"),
    tzdata = require("tzdata"),

    Discord = require("./discord"),
    Log = require("./log"),
    Notify = require("./notify"),
    settings = require("./settings"),
    Web = require("./web"),

    app = express();

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

    // Begin notifications.
    setInterval(Notify.notify, 60 * 1000);

    // Web server routes.
    app.use(compression());
    app.use(minify());
    app.use(express.static("public"));

    app.get("/", Web.home);
    app.get("/about", Web.about);
    app.get("/cast/:challengeId", Web.cast);
    app.get("/discord", (req, res) => {
        res.redirect("http://ronc.li/otl-discord");
    });
    app.get("/matches", Web.matches);
    app.get("/players", Web.players);
    app.get("/records", Web.records);
    app.get("/standings", Web.standings);
    app.get("/team/:tag", Web.team);

    // Startup web server.
    const port = process.env.PORT || settings.express.port;

    app.listen(port);
    console.log(`Web server listening on port ${port}.`);
}());

process.on("unhandledRejection", (reason) => {
    Log.exception("Unhandled promise rejection caught.", reason);
});
