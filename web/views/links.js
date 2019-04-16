const HtmlMinifier = require("html-minifier"),

    Common = require("../includes/common"),

    settings = require("../../settings");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #        #           #
//  #                    #
//  #       ##    # ##   #   #   ###
//  #        #    ##  #  #  #   #
//  #        #    #   #  ###     ###
//  #        #    #   #  #  #       #
//  #####   ###   #   #  #   #  ####
/**
 * A class that represents the links page.
 */
class Links {
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
        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/links.css" />
        `, /* html */`
            <div id="about">
                <div class="section">Links</div>
                <div class="highlight">Buy Overload</div>
                <div class="text">On Steam: <a href="https://store.steampowered.com/app/448850/Overload/" target="_blank">https://store.steampowered.com/app/448850/Overload/</a></div>
                <div class="text">On GoG: <a href="https://www.gog.com/game/overload" target="_blank">https://www.gog.com/game/overload</a></div>
                <div class="text">On Playstation 4: <a href="https://www.playstation.com/en-us/games/overload-ps4/" target="_blank">https://www.playstation.com/en-us/games/overload-ps4/</a></div>
                <div class="text">On XBox One: <a href="https://www.microsoft.com/en-us/p/overload/bvcfs7l1x3th" target="_blank">https://www.microsoft.com/en-us/p/overload/bvcfs7l1x3th</a></div>
                <div class="highlight">Official Sites</div>
                <div class="text">Overload Home Page: <a href="https://playoverload.com/" target="_blank">https://playoverload.com/</a></div>
                <div class="text">Overload Wiki: <a href="https://overload.gamepedia.com/Overload_Wiki" target="_blank">https://overload.gamepedia.com/Overload_Wiki</a></div>
                <div class="text">Revival Productions: <a href="https://www.revivalprod.com/" target="_blank">https://www.revivalprod.com/</a></div>
                <div class="text">Overload on Twitter: <a href="https://twitter.com/playoverload" target="_blank">https://twitter.com/playoverload</a></div>
                <div class="text">Overload on Facebook: <a href="https://www.facebook.com/playoverload/" target="_blank">https://www.facebook.com/playoverload/</a></div>
                <div class="text">Revival Productions on Twitch: <a href="https://www.twitch.tv/revivalproductions" target="_blank">https://www.twitch.tv/revivalproductions</a></div>
                <div class="text">Overload Kickstarter: <a href="https://www.kickstarter.com/projects/revivalprod/overload-the-ultimate-six-degree-of-freedom-shoote" target="_blank">https://www.kickstarter.com/projects/revivalprod/overload-the-ultimate-six-degree-of-freedom-shoote</a></div>
                <div class="highlight">Fan Sites</div>
                <div class="text">Overload Maps: <a href="https://overloadmaps.com/" target="_blank">https://overloadmaps.com/</a></div>
                <div class="text">OL Proxy and game tracker: <a href="https://olproxy.otl.gg/" target="_blank">https://olproxy.otl.gg/</a></div>
            </div>
        `, req);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

Links.route = {
    path: "/links"
};

module.exports = Links;
