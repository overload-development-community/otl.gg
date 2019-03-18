const compression = require("compression"),
    express = require("express"),
    minify = require("express-minify"),
    tz = require("timezone-js"),
    tzdata = require("tzdata"),

    Discord = require("./discord"),
    Log = require("./log"),
    Notify = require("./notify"),
    Router = require("./router"),
    settings = require("./settings"),

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
(async function startup() {
    Log.log("Starting up...");

    let router;
    try {
        router = await Router.getRouter();
    } catch (err) {
        console.log(err);
        return;
    }

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

    app.get("/discord", (req, res) => {
        res.redirect("http://ronc.li/otl-discord");
    });

    app.use("/", router);

    // Startup web server.
    const port = process.env.PORT || settings.express.port;

    app.listen(port);
    console.log(`Web server listening on port ${port}.`);
}());

process.on("unhandledRejection", (reason) => {
    Log.exception("Unhandled promise rejection caught.", reason);
});
