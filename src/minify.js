const csso = require("csso"),
    fs = require("fs").promises,
    Log = require("./logging/log"),
    path = require("path"),
    settings = require("../settings").minify,
    terser = require("terser");

const nameCache = {};

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #   #    #             #      ##
//  #   #                        #  #
//  ## ##   ##    # ##    ##     #     #   #
//  # # #    #    ##  #    #    ####   #   #
//  #   #    #    #   #    #     #     #  ##
//  #   #    #    #   #    #     #      ## #
//  #   #   ###   #   #   ###    #         #
//                                     #   #
//                                      ###
/**
* Minifies and combines the specified files.
*/
class Minify {
    //                     #  #                 #  ##
    //                     #  #                 #   #
    //  ##    ###    ###   ####   ###  ###    ###   #     ##   ###
    // #     ##     ##     #  #  #  #  #  #  #  #   #    # ##  #  #
    // #       ##     ##   #  #  # ##  #  #  #  #   #    ##    #
    //  ##   ###    ###    #  #   # #  #  #   ###  ###    ##   #
    /**
     * The Express handler to return the minified version of the CSS file passed.
     * @param {Express.Request} req The request.
     * @param {Express.Response} res The response.
     * @param {function} next The next function.
     * @returns {Promise<void>} A promise that resolves when the handler has been run.
     */
    static async cssHandler(req, res, next) {
        if (!req.query.files || req.query.files === "") {
            return next();
        }

        /** @type {string[]} */
        const files = req.query.files.split(",");

        try {
            let str = "";

            try {
                for (const file of files) {
                    str = `${str}${await fs.readFile(path.join(__dirname, "..", "public", file), "utf8")}`;
                }
            } catch (err) {
                if (err.code === "ENOENT") {
                    return next();
                }

                return next(err);
            }

            const output = csso.minify(str);

            res.status(200).send(output.css);

            return void 0;
        } catch (err) {
            return next(err);
        }
    }

    //   #          #  #                 #  ##
    //              #  #                 #   #
    //   #    ###   ####   ###  ###    ###   #     ##   ###
    //   #   ##     #  #  #  #  #  #  #  #   #    # ##  #  #
    //   #     ##   #  #  # ##  #  #  #  #   #    ##    #
    // # #   ###    #  #   # #  #  #   ###  ###    ##   #
    //  #
    /**
     * The Express handler to return the minified version of the JavaScript file passed.
     * @param {Express.Request} req The request.
     * @param {Express.Response} res The response.
     * @param {function} next The next function.
     * @returns {Promise<void>} A promise that resolves when the handler has been run.
     */
    static async jsHandler(req, res, next) {
        if (!req.query.files || req.query.files === "") {
            return next();
        }

        /** @type {string[]} */
        const files = req.query.files.split(",");

        try {
            /** @type {Object<string, string>} */
            let code;

            try {
                code = await files.reduce(async (prev, cur) => {
                    const obj = await prev;

                    obj[cur] = await fs.readFile(path.join(__dirname, "..", "public", cur), "utf8");

                    return obj;
                }, Promise.resolve({}));
            } catch (err) {
                if (err.code === "ENOENT") {
                    return next();
                }

                return next(err);
            }

            const output = terser.minify(code, {nameCache});

            if (output.error) {
                Log.exception("An uglify-js error occurred.", output.error);

                next(output.error);
                return void 0;
            }

            res.status(200).send(output.code);

            return void 0;
        } catch (err) {
            return next(err);
        }
    }

    //                   #      #
    //                   #
    //  ##    ##   # #   ###   ##    ###    ##
    // #     #  #  ####  #  #   #    #  #  # ##
    // #     #  #  #  #  #  #   #    #  #  ##
    //  ##    ##   #  #  ###   ###   #  #   ##
    /**
     * Combines the specified filenames into a single filename.
     * @param {string[]} files The list of filenames to combine.
     * @param {"js" | "css"} type The file type to combine.
     * @returns {string} The combined filename.
     */
    static combine(files, type) {
        if (settings.enabled) {
            switch (type) {
                case "js":
                    return `<script src="/js?files=${files.join(",")}"></script>`;
                case "css":
                    return `<link rel="stylesheet" href="/css?files=${files.join(",")}" />`;
                default:
                    return "";
            }
        } else {
            switch (type) {
                case "js":
                    return files.map((f) => `<script src="${f}"></script>`).join("");
                case "css":
                    return files.map((f) => `<link rel="stylesheet" href="${f}" />`).join("");
                default:
                    return "";
            }
        }
    }
}

module.exports = Minify;
