/**
 * @typedef {import("../../types/viewTypes").IndexViewParameters} ViewTypes.IndexViewParameters
 */

//   ###              #                #   #    #
//    #               #                #   #
//    #    # ##    ## #   ###   #   #  #   #   ##     ###   #   #
//    #    ##  #  #  ##  #   #   # #    # #     #    #   #  #   #
//    #    #   #  #   #  #####    #     # #     #    #####  # # #
//    #    #   #  #  ##  #       # #    # #     #    #      # # #
//   ###   #   #   ## #   ###   #   #    #     ###    ###    # #
/**
 * A class that represents the general website template.
 */
class IndexView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the rendered page template.
     * @param {ViewTypes.IndexViewParameters} data The data to render the page with.
     * @returns {string} An HTML string of the page.
     */
    static get(data) {
        const {head, html, protocol, host, originalUrl, year, version} = data;

        return /* html */`
            <html>
                <head>
                    <title>Overload Teams League</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                    <meta name="og:image" content="${protocol}://otl.gg/images/otl.png" />
                    <meta name="og:title" content="Overload Teams League" />
                    <meta name="og:type" content="website" />
                    <meta name="og:url" content="${protocol}://${host}${originalUrl}" />
                    <meta name="twitter:card" content="summary" />
                    <meta name="twitter:creator" content="@roncli" />
                    ${IndexView.Common.favIcon()}
                    ${head}
                </head>
                <body>
                    <div id="page">
                        <div id="menu">
                            <ul>
                                <li><a href="/">Home</a></li>
                                <li><a href="/standings">Standings</a></li>
                                <li><a href="/matches">Matches</a></li>
                                <li><a href="https://challonge.com/communities/otlgg" target="_blank">Tournaments</a></li>
                                <li><a href="/players">Players</a></li>
                                <li><a href="/records">Records</a></li>
                                <li><a href="/about">About</a></li>
                                <li><a href="/links">Links</a></li>
                            </ul>
                        </div>
                        <div id="header">
                            <div id="logo"></div>
                            <div id="title">Overload Teams League</div>
                        </div>
                        <script>document.getElementById("header").style.backgroundImage = "url('/images/" + Common.randomBackground() + "')";</script>
                        ${html}
                        <div id="discord">
                            <div class="title">Join the OTL on Discord!</div>
                            <div class="text">Interested in joining?  The Overload Teams League coordinates all of our matches and team communication via the OTL Discord server.  Join today and compete with pilots from all over the world.</div>
                            <div class="link"><a href="/discord" target="_blank"><img src="/images/discord.png" /></a></div>
                        </div>
                        <div id="copyright">
                            <div class="left">
                                Version ${version}, &copy;${+year > 2019 ? "2019-" : ""}${year} roncli Productions
                            </div>
                            <div class="right">
                                Bugs?  <a href="https://github.com/overload-development-community/otl-bot/issues" target="_blank">Report on GitHub</a>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }
}

/** @type {typeof import("../../web/includes/common")} */
// @ts-ignore
IndexView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = IndexView; // eslint-disable-line no-undef
}
