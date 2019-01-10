const pjson = require("../package.json"),

    nameAngledBracketTagStart = /^<.*> /,
    nameBraceTagStart = /^\{.*\} /,
    nameBracketTagStart = /^\[.*\] /,
    nameDesignaterEnd = / - .*$/,
    nameParenthesisTagStart = /^\(.*\) /;

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
                        <div id="discord">
                            <div class="title">Join the OTL on Discord!</div>
                            <div class="text">Interested in joining?  The Overload Teams League coordinates all of our matches and team communication via the OTL Discord server.  Join today and compete with pilots from all over the world.</div>
                            <div class="link"><a href="/discord" target="_blank"><img src="/images/discord.png" /></a></div>
                        </div>
                        <div id="copyright">
                            <div class="left">
                                Version ${pjson.version}, &copy;${+year > 2019 ? "2019-" : ""}${year} roncli Productions
                            </div>
                            <div class="right">
                                Bugs?  <a href="https://github.com/roncli/otl-bot/issues" target="_blank">Report on GitHub</a>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    // #      #          ##    ####                       #
    // #      #           #    #                          #
    // ###   ###   # #    #    ###   ###    ##    ##    ###   ##
    // #  #   #    ####   #    #     #  #  #     #  #  #  #  # ##
    // #  #   #    #  #   #    #     #  #  #     #  #  #  #  ##
    // #  #    ##  #  #  ###   ####  #  #   ##    ##    ###   ##
    /**
     * HTML-encodes a string.
     * @param {string} str The string.
     * @returns {string} The encoded string.
     */
    static htmlEncode(str) {
        return str.replace(/[\u0080-\uFFFF<>&]/gim, (i) => `&#${i.charCodeAt(0)};`);
    }

    //   #          ####                       #
    //              #                          #
    //   #    ###   ###   ###    ##    ##    ###   ##
    //   #   ##     #     #  #  #     #  #  #  #  # ##
    //   #     ##   #     #  #  #     #  #  #  #  ##
    // # #   ###    ####  #  #   ##    ##    ###   ##
    //  #
    /**
     * Javascript-encodes a string.
     * @param {*} str The string.
     * @returns {string} The encoded string.
     */
    static jsEncode(str) {
        return str.replace(/"/gim, "\\\"");
    }

    //                               ##     #                #  #
    //                                #                      ## #
    // ###    ##   ###   # #    ###   #    ##    ####   ##   ## #   ###  # #    ##
    // #  #  #  #  #  #  ####  #  #   #     #      #   # ##  # ##  #  #  ####  # ##
    // #  #  #  #  #     #  #  # ##   #     #     #    ##    # ##  # ##  #  #  ##
    // #  #   ##   #     #  #   # #  ###   ###   ####   ##   #  #   # #  #  #   ##
    /**
     * Normalizes a player name so that it doesn't start with a tag or end with a position designater.
     * @param {string} name The player's name.
     * @param {string} tag The player's team tag.
     * @returns {string} The normalized name.
     */
    static normalizeName(name, tag) {
        if (name.toLowerCase().startsWith(`${tag.toLowerCase()} `)) {
            name = name.substring(tag.length + 1);
        }

        return name.replace(nameParenthesisTagStart, "").replace(nameBracketTagStart, "").replace(nameBraceTagStart, "").replace(nameAngledBracketTagStart, "").replace(nameDesignaterEnd, "");
    }
}

module.exports = Common;
