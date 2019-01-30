const fs = require("fs"),
    promisify = require("util").promisify,

    pages = {
        about: {file: "./about"},
        cast: {file: "./cast"},
        common: {file: "./common"},
        home: {file: "./home"},
        matches: {file: "./matches"},
        player: {file: "./player"},
        players: {file: "./players"},
        records: {file: "./records"},
        standings: {file: "./standings"},
        team: {file: "./team"},
        teams: {file: "./teams"}
    };

/**
 * @typedef {import("express").NextFunction} Express.NextFunction
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   ###              #
//    #               #
//    #    # ##    ## #   ###   #   #
//    #    ##  #  #  ##  #   #   # #
//    #    #   #  #   #  #####    #
//    #    #   #  #  ##  #       # #
//   ###   #   #   ## #   ###   #   #
/**
 * A cless representing an index of the website.
 */
class Index {
    //       #                 #      ##               #
    //       #                 #     #  #              #
    //  ##   ###    ##    ##   # #   #      ###   ##   ###    ##
    // #     #  #  # ##  #     ##    #     #  #  #     #  #  # ##
    // #     #  #  ##    #     # #   #  #  # ##  #     #  #  ##
    //  ##   #  #   ##    ##   #  #   ##    # #   ##   #  #   ##
    /**
     * Checks the cache and refreshes it if necessary.
     * @param {string} pageName The name of the page.
     * @returns {Promise} A promise that resolves once the cache is checked.
     */
    static async checkCache(pageName) {
        const page = pages[pageName];

        if (!page) {
            throw new Error("Invald page name.");
        }

        const stats = await promisify(fs.stat)(require.resolve(page.file));

        if (!page.lastModified || page.lastModified !== stats.mtime) {
            delete require.cache[require.resolve(page.file)];
            page.fx = require(page.file);
            page.lastModified = stats.mtime;
        }
    }
}

Object.keys(pages).forEach((pageName) => {
    const page = pages[pageName];

    if (pageName !== "common") {
        Index[pageName] = async (req, res, next) => {
            try {
                await Index.checkCache("common");
                await Index.checkCache("teams");
                await Index.checkCache(pageName);
            } catch (err) {
                console.log(err);
            }

            return page.fx(req, res, next);
        };
    }
});

module.exports = Index;
