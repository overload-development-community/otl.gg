const {minify} = require("html-minifier"),

    settings = require("../settings");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   #   #
//   #   #
//   #   #   ###   ## #    ###
//   #####  #   #  # # #  #   #
//   #   #  #   #  # # #  #####
//   #   #  #   #  # # #  #
//   #   #   ###   #   #   ###
/**
 * A class that represents the home page.
 */
class Home {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Processes the request.
     * @param {Express.Request} req The request.
     * @param {Express.Response} res The response.
     * @returns {void}
     */
    static get(req, res) {
        const html = /* html */`
            <html>
                <head>
                    <link rel="stylesheet" href="/css/reset.css">
                </head>
                <body>
                    <h1>Overload Teams League</h1>
                </body>
            </html>
        `;

        res.status(200).send(minify(html, settings.htmlMinifier));
    }
}

module.exports = Home.get;
