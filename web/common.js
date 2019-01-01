const pjson = require("../package.json");

//   ###
//  #   #
//  #       ###   ## #   ## #    ###   # ##
//  #      #   #  # # #  # # #  #   #  ##  #
//  #      #   #  # # #  # # #  #   #  #   #
//  #   #  #   #  # # #  # # #  #   #  #   #
//   ###    ###   #   #  #   #   ###   #   #
/**
 * A class that handles common web functions.
 */
class Common {
    // ###    ###   ###   ##
    // #  #  #  #  #  #  # ##
    // #  #  # ##   ##   ##
    // ###    # #  #      ##
    // #            ###
    /**
     * Generates a webpage from the provided HTML using a common template.
     * @param {string} head The HTML to insert into the header.
     * @param {string} html The HTML to make a full web page from.
     * @returns {string} The HTML of the full web page.
     */
    static page(head, html) {
        const year = new Date().getFullYear();

        return /* html */`
            <html>
                <head>
                    <title>Overload Teams League</title>
                    <link rel="stylesheet" href="/css/reset.css">
                    <link rel="stylesheet" href="/css/common.css">
                    <script src="/js/common.js"></script>
                    ${head}
                </head>
                <body>
                    <div id="page">
                        <div id="menu">
                            <ul>
                                <li><a href="/">Home</a></li>
                                <li><a href="/standings">Standings</a></li>
                                <li><a href="/matches">Matches</a></li>
                                <li><a href="/teams">Teams</a></li>
                                <li><a href="/players">Players</a></li>
                                <li><a href="/about">About</a></li>
                            </ul>
                        </div>
                        <div id="header">
                            <div id="logo"></div>
                            <div id="title">Overload Teams League</div>
                        </div>
                        <script>document.getElementById("header").style.backgroundImage = "url(/images/" + randomBackground() + ")";</script>
                        ${html}
                        <div id="copyright">
                            <div class="left">
                                Version ${pjson.version}, &copy;${+year > 2019 ? "2019-" : ""}${year} roncli Productions
                            </div>
                            <div class="right">
                                Bugs?  <a href="https://github.com/roncli/otl-bot/issues">Report on GitHub</a>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }
}

module.exports = Common;
