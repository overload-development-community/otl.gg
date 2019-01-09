const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Challenge = require("../challenge"),
    Db = require("../database"),
    settings = require("../settings"),
    Team = require("../team");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   ###                  #
//  #   #                 #
//  #       ###    ###   ####
//  #          #  #       #
//  #       ####   ###    #
//  #   #  #   #      #   #  #
//   ###    ####  ####     ##
/**
 * A class that represents the cast page.
 */
class Cast {
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
        const challengeId = Number.parseInt(req.params.challengeId, 10) || void 0,
            challenge = await Challenge.getById(challengeId);

        if (challenge) {
            await challenge.loadDetails();
        }

        if (challenge && challenge.details.map /* && !challenge.details.dateClosed */) {

            /**
             * @type {{data: {challengingTeamWins: number, challengingTeamLosses: number, challengingTeamTies: number, challengingTeamRating: number, challengedTeamWins: number, challengedTeamLosses: number, challengedTeamTies: number, challengedTeamRating: number, challengingTeamHeadToHeadWins: number, challengedTeamHeadToHeadWins: number, headToHeadTies: number, challengingTeamId: number, challengingTeamScore: number, challengedTeamId: number, challengedTeamScore: number, map: string, matchTime: Date, name: string, teamId: number, kills: number, assists: number, deaths: number}, challengingTeamRoster: {name: string, games: number, kills: number, assists: number, deaths: number}[], challengedTeamRoster: {name: string, games: number, kills: number, assists: number, deaths: number}[]}}
             */
            const data = await Db.getChallengeDataForCast(challenge),
                challengingTeamColor = challenge.challengingTeam.role && challenge.challengingTeam.role.color ? challenge.challengingTeam.role.hexColor : "white",
                challengedTeamColor = challenge.challengedTeam.role && challenge.challengedTeam.role.color ? challenge.challengedTeam.role.hexColor : "white";

            data.challengingTeamRoster.sort((a, b) => Common.normalizeName(a.name, challenge.challengingTeam.tag).localeCompare(Common.normalizeName(b.name, challenge.challengingTeam.tag)));
            data.challengedTeamRoster.sort((a, b) => Common.normalizeName(a.name, challenge.challengedTeam.tag).localeCompare(Common.normalizeName(b.name, challenge.challengedTeam.tag)));

            const html = /* html */`
                <html>
                    <head>
                        <title>${challenge.challengingTeam.name} vs ${challenge.challengedTeam.name}</title>
                        <script src="/js/common.js"></script>
                        <link rel="stylesheet" href="/css/reset.css">
                        <link rel="stylesheet" href="/css/cast.css">
                    <head>
                    <body style="background-image: url(/images/${challenge.details.map.toLowerCase()}.jpg);">
                        <div id="shade">
                            <div id="logo"></div>
                            <div id="title">Overload Teams League</div>
                            <div id="left-team" style="border-color: ${challengingTeamColor};">
                                <div class="tag"><div class="diamond${challenge.challengingTeam.role && challenge.challengingTeam.role.color ? "" : "-empty"}" ${challenge.challengingTeam.role && challenge.challengingTeam.role.color ? `style="background-color: ${challenge.challengingTeam.role.hexColor};"` : ""}></div> ${challenge.challengingTeam.tag}</div>
                                <div class="name">${challenge.challengingTeam.name}</div>
                            </div>
                            <div id="right-team" style="border-color: ${challengedTeamColor};">
                                <div class="tag"><div class="diamond${challenge.challengedTeam.role && challenge.challengedTeam.role.color ? "" : "-empty"}" ${challenge.challengedTeam.role && challenge.challengedTeam.role.color ? `style="background-color: ${challenge.challengedTeam.role.hexColor};"` : ""}></div> ${challenge.challengedTeam.tag}</div>
                                <div class="name">${challenge.challengedTeam.name}</div>
                            </div>
                            <div id="left-rating" style="border-color: ${challengingTeamColor};">
                                ${data.data.challengingTeamRating ? /* html */`
                                    <div class="rating">Season Rating: <span class="${data.data.challengingTeamWins + data.data.challengingTeamLosses + data.data.challengingTeamTies < 10 ? "provisional" : ""}">${data.data.challengingTeamRating.toFixed(0)}</span></div>
                                ` : ""}
                                <div class="record">Record: ${data.data.challengingTeamWins}-${data.data.challengingTeamLosses}${data.data.challengingTeamTies ? `-${data.data.challengingTeamTies}` : ""}</div>
                            </div>
                            <div id="right-rating" style="border-color: ${challengedTeamColor};">
                                ${data.data.challengedTeamRating ? /* html */`
                                    <div class="rating">Season Rating: <span class="${data.data.challengedTeamWins + data.data.challengedTeamLosses + data.data.challengedTeamTies < 10 ? "provisional" : ""}">${data.data.challengedTeamRating.toFixed(0)}</span></div>
                                ` : ""}
                                <div class="record">Record: ${data.data.challengedTeamWins}-${data.data.challengedTeamLosses}${data.data.challengedTeamTies ? `-${data.data.challengedTeamTies}` : ""}</div>
                            </div>
                            ${data.data.challengingTeamHeadToHeadWins + data.data.challengedTeamHeadToHeadWins + data.data.headToHeadTies > 0 ? /* html */`
                                <div id="head-to-head">
                                    Head to Head Record<br />
                                    <span class="record">${challenge.challengingTeam.tag} ${data.data.challengingTeamHeadToHeadWins}${data.data.headToHeadTies ? ` - Ties ${data.data.headToHeadTies}` : ""} - ${challenge.challengedTeam.tag} ${data.data.challengedTeamHeadToHeadWins}</span>
                                </div>
                            ` : ""}
                            ${data.data.challengingTeamId ? /* html */`
                                <div id="previous">
                                    <div class="grid">
                                        <div class="last">Last Match</div>
                                        ${challenge.challengingTeam.id === data.data.challengingTeamId ? /* html */`
                                            <div class="left-tag">${challenge.challengingTeam.tag}</div>
                                            <div class="left-score">${data.data.challengingTeamScore}</div>
                                            <div class="right-tag">${challenge.challengedTeam.tag}</div>
                                            <div class="right-score">${data.data.challengedTeamScore}</div>
                                        ` : /* html */ `
                                            <div class="left-tag">${challenge.challengingTeam.tag}</div>
                                            <div class="left-score">${data.data.challengedTeamScore}</div>
                                            <div class="right-tag">${challenge.challengedTeam.tag}</div>
                                            <div class="right-score">${data.data.challengingTeamScore}</div>
                                        `}
                                        <div class="map">${data.data.map}</div>
                                        <div class="date"><script>document.write(formatDate(new Date("${data.data.matchTime}")));</script></div>
                                        <div class="best">Best Performer</div>
                                        <div class="best-stats">${(data.data.teamId === challenge.challengingTeam.id ? challenge.challengingTeam : challenge.challengedTeam).tag} ${data.data.name}<br />${((data.data.kills + data.data.assists) / Math.max(1, data.data.deaths)).toFixed(2)} KDA (${data.data.kills} K, ${data.data.assists} A, ${data.data.deaths} D)</div>
                                    </div>
                                </div>
                            ` : ""}
                            <div id="left-roster">
                                <div class="header">Pilot</div>
                                <div class="header">G</div>
                                <div class="header">KDA</div>
                                <div class="header">KPG</div>
                                <div class="header">APG</div>
                                <div class="header">DPG</div>
                                ${data.challengingTeamRoster.map((p) => /* html */`
                                    <div>${Common.htmlEncode(Common.normalizeName(p.name, challenge.challengingTeam.tag))}</div>
                                    <div>${p.games}</div>
                                    <div>${p.games ? ((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(3) : ""}</div>
                                    <div>${p.games ? (p.kills / p.games).toFixed(2) : ""}</div>
                                    <div>${p.games ? (p.assists / p.games).toFixed(2) : ""}</div>
                                    <div>${p.games ? (p.deaths / p.games).toFixed(2) : ""}</div>
                                `).join("")}
                            </div>
                            <div id="right-roster">
                                <div class="header">Pilot</div>
                                <div class="header">G</div>
                                <div class="header">KDA</div>
                                <div class="header">KPG</div>
                                <div class="header">APG</div>
                                <div class="header">DPG</div>
                                ${data.challengedTeamRoster.map((p) => /* html */`
                                    <div>${Common.htmlEncode(Common.normalizeName(p.name, challenge.challengedTeam.tag))}</div>
                                    <div>${p.games}</div>
                                    <div>${p.games ? ((p.kills + p.assists) / Math.max(1, p.deaths)).toFixed(3) : ""}</div>
                                    <div>${p.games ? (p.kills / p.games).toFixed(2) : ""}</div>
                                    <div>${p.games ? (p.assists / p.games).toFixed(2) : ""}</div>
                                    <div>${p.games ? (p.deaths / p.games).toFixed(2) : ""}</div>
                                `).join("")}
                            </div>
                            <div id="left-frame" style="border-color: ${challengingTeamColor};">
                            </div>
                            <div id="right-frame" style="border-color: ${challengedTeamColor};">
                            </div>
                        </div>
                    </body>
                </html>
            `;

            res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
        } else {
            const html = Common.page("", /* html */`
                <div class="section">Challenge Not Found</div>
            `);

            res.status(404).send(HtmlMinifier.minify(html, settings.htmlMinifier));
        }
    }
}

module.exports = Cast.get;
