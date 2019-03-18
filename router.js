const fs = require("fs"),
    path = require("path"),
    promisify = require("util").promisify,

    express = require("express"),

    classes = {};

//  ####                  #
//  #   #                 #
//  #   #   ###   #   #  ####    ###   # ##
//  ####   #   #  #   #   #     #   #  ##  #
//  # #    #   #  #   #   #     #####  #
//  #  #   #   #  #  ##   #  #  #      #
//  #   #   ###    ## #    ##    ###   #
/**
 * A class that handles the router for the website.
 */
class Router {
    //       #                 #      ##               #
    //       #                 #     #  #              #
    //  ##   ###    ##    ##   # #   #      ###   ##   ###    ##
    // #     #  #  # ##  #     ##    #     #  #  #     #  #  # ##
    // #     #  #  ##    #     # #   #  #  # ##  #     #  #  ##
    //  ##   #  #   ##    ##   #  #   ##    # #   ##   #  #   ##
    /**
     * Checks the cache and refreshes it if necessary.
     * @param {string} file The name of the class.
     * @returns {Promise} A promise that resolves once the cache is checked.
     */
    static async checkCache(file) {
        const classInfo = classes[file];

        if (!classInfo) {
            throw new Error("Invald class name.");
        }

        const stats = await promisify(fs.stat)(require.resolve(classInfo.file));

        if (!classInfo.lastModified || classInfo.lastModified !== stats.mtime) {
            delete require.cache[require.resolve(classInfo.file)];
            classInfo.class = require(classInfo.file);
            classInfo.lastModified = stats.mtime;
        }
    }

    //              #     ##   ##
    //              #    #  #   #
    //  ###   ##   ###   #      #     ###   ###    ###    ##    ###
    // #  #  # ##   #    #      #    #  #  ##     ##     # ##  ##
    //  ##   ##     #    #  #   #    # ##    ##     ##   ##      ##
    // #      ##     ##   ##   ###    # #  ###    ###     ##   ###
    //  ###
    /**
     * Gets all of the available classes.
     * @param {string} dir The directory to get the classes for.
     * @returns {Promise} A promise that resolves when all the classes are retrieved.
     */
    static async getClasses(dir) {
        const list = await promisify(fs.readdir)(dir);

        for (const file of list) {
            const filename = path.resolve(dir, file);

            const stat = await promisify(fs.stat)(filename);

            if (stat && stat.isDirectory()) {
                await Router.getClasses(filename);
            } else {
                const classInfo = require(filename);
                classes[filename] = classInfo.route;
                if (!classInfo.route.includes) {
                    classes[filename].methods = Object.getOwnPropertyNames(classInfo).filter((p) => typeof classInfo[p] === "function");
                }
                classes[filename].file = filename;
            }
        }
    }

    //              #    ###                #
    //              #    #  #               #
    //  ###   ##   ###   #  #   ##   #  #  ###    ##   ###
    // #  #  # ##   #    ###   #  #  #  #   #    # ##  #  #
    //  ##   ##     #    # #   #  #  #  #   #    ##    #
    // #      ##     ##  #  #   ##    ###    ##   ##   #
    //  ###
    /**
     * Gets the router to use for the website.
     * @returns {Promise<express.Router>} A promise that resolves with the router to use for the website.
     */
    static async getRouter() {
        await Router.getClasses(`${__dirname}/web`);

        const router = express.Router(),
            filenames = Object.keys(classes),
            includes = filenames.filter((c) => classes[c].include),
            pages = filenames.filter((c) => !classes[c].include && classes[c].methods && classes[c].methods.length > 0);

        pages.forEach((filename) => {
            const classInfo = classes[filename];

            classInfo.methods.forEach((method) => {
                router[method](classInfo.path, async (req, res, next) => {
                    try {
                        for (const include of includes) {
                            await Router.checkCache(include);
                        }
                        await Router.checkCache(filename);
                    } catch (err) {
                        console.log(err);
                    }

                    return classInfo.class[req.method.toLowerCase()](req, res, next);
                });
            });
        });

        return router;
    }
}

module.exports = Router;
