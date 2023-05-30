/**
 * @typedef {express.Router} Express.Router
 */

const Azure = require("./src/azure"),
    compression = require("compression"),
    express = require("express"),
    minify = require("./src/minify"),
    morgan = require("morgan"),
    morganExtensions = require("./src/extensions/morgan.extensions"),
    Redis = require("@roncli/node-redis"),

    Cache = Redis.Cache,
    Discord = require("./src/discord"),
    Log = require("./src/logging/log"),
    Router = require("./src/router"),
    settings = require("./settings");

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

    // Set title.
    if (process.platform === "win32") {
        process.title = "Overload Teams League";
    } else {
        process.stdout.write("\x1b]2;Overload Teams League\x1b\x5c");
    }

    // Setup Redis.
    if (!settings.disableRedis) {
        Redis.setup(settings.redis);
        Redis.eventEmitter.on("error", (err) => {
            Log.exception(`Redis error: ${err.message}`, {err: err.err});
        });
        await Cache.flush();
    }

    // Startup Azure.
    Azure.startup();

    // Startup Discord.
    Discord.startup();
    await Discord.connect();

    // Setup express app.
    const app = express();

    // Get the router.
    /** @type {Express.Router} */
    let router;
    try {
        router = await Router.getRouter();
    } catch (err) {
        console.log(err);
        return;
    }

    // Add morgan extensions.
    morganExtensions(morgan);

    // Initialize middleware stack.
    app.use(morgan(":colorstatus \x1b[30m\x1b[0m:method\x1b[0m :url\x1b[30m\x1b[0m:newline    Date :date[iso]    IP :realip    Time :colorresponse ms"));
    app.use(compression());

    // Setup public redirects.
    app.use(express.static("public"));

    // Setup Discord redirect.
    app.get("/discord", (req, res) => {
        res.redirect("https://ronc.li/otl-discord");
    });

    // Setup Google Calendar redirect.
    app.get("/calendar", (req, res) => {
        res.redirect("https://calendar.google.com/calendar/u/0?cid=cnJybmp2MzVrdHV1azI5NW43OGxkcGM3bm9AZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ");
    });

    // Setup JS/CSS handlers.
    app.get("/css", minify.cssHandler);
    app.get("/js", minify.jsHandler);

    // 500 is an internal route, 404 it if it's requested directly.
    app.use("/500", (req, res, next) => {
        req.method = "GET";
        req.url = "/404";
        router(req, res, next);
    });

    // Setup dynamic routing.
    app.use("/", router);

    // 404 remaining pages.
    app.use((req, res, next) => {
        req.method = "GET";
        req.url = "/404";
        router(req, res, next);
    });

    // 500 errors.
    app.use((err, req, res, next) => {
        Log.exception("Unhandled error has occurred.", err);
        req.method = "GET";
        req.url = "/500";
        router(req, res, next);
    });

    // Startup web server.
    const port = process.env.PORT || settings.express.port;

    app.listen(port);
    console.log(`Web server listening on port ${port}.`);
}());

process.on("unhandledRejection", (reason) => {
    Log.exception("Unhandled promise rejection caught.", reason);
});
