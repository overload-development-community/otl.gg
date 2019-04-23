const HtmlMinifier = require("html-minifier"),

    Common = require("../includes/common"),
    Match = require("../../src/models/match"),
    MatchView = require("../../public/views/match"),

    Db = require("../../src/database"),
    settings = require("../../settings");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #   #          #            #
//  #   #          #            #
//  ## ##   ###   ####    ###   # ##    ###    ###
//  # # #      #   #     #   #  ##  #  #   #  #
//  #   #   ####   #     #      #   #  #####   ###
//  #   #  #   #   #  #  #   #  #   #  #          #
//  #   #   ####    ##    ###   #   #   ###   ####
/**
 * A class that represents the matches page.
 */
class Matches {
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
     * @returns {Promise} A promise that resolves when the request is complete.
     */
    static async get(req, res) {
        const matchesPerPage = 10,
            season = Number.parseInt(req.query.season, 10) || void 0,
            seasonList = await Db.seasonList(),
            {matches: pending, completed: totalCompleted} = await Match.getUpcomingAndCompletedCount(isNaN(season) ? void 0 : season),
            completed = await Match.getBySeason(isNaN(season) ? void 0 : season);

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/matches.css" />
            <script src="/views/match.js"></script>
            <script src="/js/countdown.js"></script>
            <script src="/js/matches.js"></script>
        `, /* html */`
            <div id="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${season && season !== seasonNumber || index + 1 !== seasonList.length ? /* html */`<a href="/matches?season=${seasonNumber}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")}
            </div>
            <div id="matches">
                ${pending.length === 0 ? "" : /* html */`
                    <div id="pending">
                        <div class="section">Pending Matches</div>
                        <div class="subsection">for Season <span id="season">${season || Math.max(...seasonList)}</span></div>
                        <div class="matches">
                            ${pending.map((m) => /* html */`
                                <div class="match">
                                    ${m.title ? /* html */`
                                        <div class="title">${m.title}</div>
                                    ` : ""}
                                    <div class="tag1">
                                        <div class="diamond${m.challengingTeam.color ? "" : "-empty"}" ${m.challengingTeam.color ? `style="background-color: ${m.challengingTeam.color};"` : ""}></div> <a href="/team/${m.challengingTeam.tag}">${m.challengingTeam.tag}</a>
                                    </div>
                                    <div class="team1">
                                        <a href="/team/${m.challengingTeam.tag}">${m.challengingTeam.name}</a>
                                    </div>
                                    <div class="numeric record1">
                                        ${m.challengingTeam.rating ? `${Math.round(m.challengingTeam.rating)},` : ""} ${m.challengingTeam.wins}-${m.challengingTeam.losses}${m.challengingTeam.ties === 0 ? "" : `-${m.challengingTeam.ties}`}
                                    </div>
                                    <div class="tag2">
                                        <div class="diamond${m.challengedTeam.color ? "" : "-empty"}" ${m.challengedTeam.color ? `style="background-color: ${m.challengedTeam.color};"` : ""}></div> <a href="/team/${m.challengedTeam.tag}">${m.challengedTeam.tag}</a>
                                    </div>
                                    <div class="team2">
                                        <a href="/team/${m.challengedTeam.tag}">${m.challengedTeam.name}</a>
                                    </div>
                                    <div class="numeric record2">
                                        ${m.challengedTeam.rating ? `${Math.round(m.challengedTeam.rating)},` : ""} ${m.challengedTeam.wins}-${m.challengedTeam.losses}${m.challengedTeam.ties === 0 ? "" : `-${m.challengedTeam.ties}`}
                                    </div>
                                    ${m.map ? /* html */`
                                        <div class="map">
                                            ${m.map}
                                        </div>
                                    ` : ""}
                                    <div class="date">
                                        <script>document.write(Common.formatDate(new Date("${m.matchTime}")));</script>
                                    </div>
                                    <div class="countdown">
                                        <script>new Countdown(${m.timeRemaining});</script>
                                    </div>
                                    ${m.twitchName ? /* html */`
                                        <div class="caster">
                                            Watch at <a href="https://twitch.tv/${encodeURIComponent(m.twitchName)}" target="_blank">https://twitch.tv/${Common.htmlEncode(m.twitchName)}</a>
                                        </div>
                                    ` : m.map ? /* html */`
                                        <div class="caster">
                                            Watch at <a href="https://otl.gg/cast/${m.challengeId}" target="_blank">https://otl.gg/cast/${m.challengeId}</a>
                                        </div>
                                    ` : ""}
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `}
                ${totalCompleted === 0 ? "" : /* html */`
                    <div id="completed">
                        <div class="section">Completed Matches</div>
                        <div class="subsection">for Season ${season || Math.max(...seasonList)}</div>
                        ${totalCompleted > matchesPerPage ? /* html */`
                            <div class="paginator">
                                <div class="paginator-text">
                                    <div>Page:</div>
                                </div>
                                <div id="select-prev" class="paginator-page">
                                    <div>&lt;&lt;</div>
                                </div>
                                ${Array.from(new Array(Math.ceil(totalCompleted / matchesPerPage))).map((_, index) => /* html */`
                                    <div class="paginator-page select-page select-page-${index + 1} ${index === 0 ? "active" : ""}">
                                        <div class="numeric">${index + 1}</div>
                                    </div>
                                `).join("")}
                                <div id="select-next" class="paginator-page">
                                    <div>&gt;&gt;</div>
                                </div>
                            </div>
                        ` : ""}
                        <div class="matches" id="completed-matches">
                            ${completed.map((m) => MatchView.get(m)).join("")}
                        </div>
                    </div>
                `}
            </div>
        `, req);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

Matches.route = {
    path: "/matches"
};

module.exports = Matches;
