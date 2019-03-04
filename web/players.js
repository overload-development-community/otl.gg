const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Discord = require("../discord"),
    Db = require("../database"),
    settings = require("../settings"),
    Teams = require("./teams");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  ####    ##
//  #   #    #
//  #   #    #     ###   #   #   ###   # ##    ###
//  ####     #        #  #   #  #   #  ##  #  #
//  #        #     ####  #  ##  #####  #       ###
//  #        #    #   #   ## #  #      #          #
//  #       ###    ####      #   ###   #      ####
//                       #   #
//                        ###
/**
 * A class that represents the players page.
 */
class Players {
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
        const freeAgents = (await Db.freeAgents()).filter((f) => Discord.findGuildMemberById(f.discordId)),
            seasonList = await Db.seasonList(),
            season = Number.parseInt(req.query.season, 10) || void 0,
            postseason = !!req.query.postseason,
            stats = await Db.playerSeasonStats(isNaN(season) ? void 0 : season, postseason),
            averages = {
                kda: stats.reduce((acc, cur) => acc + cur.kda, 0) / stats.length,
                kills: stats.reduce((acc, cur) => acc + cur.avgKills, 0) / stats.length,
                assists: stats.reduce((acc, cur) => acc + cur.avgAssists, 0) / stats.length,
                deaths: stats.reduce((acc, cur) => acc + cur.avgDeaths, 0) / stats.length
            },
            teams = new Teams();
        let team;

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/players.css" />
        `, /* html */`
            ${freeAgents && freeAgents.length > 0 ? /* html */ `
                <div id="free-agents">
                    <div class="section">Free Agents</div>
                    <div class="text">The following pilots are available free agents for you to recruit to your team.</div>
                    <div class="players">
                        ${freeAgents.map((f) => /* html */`
                            <div><a href="/player/${f.playerId}/${encodeURIComponent(f.name)}">${Common.htmlEncode(f.name)}</a></div>
                            <div>${f.timezone}</div>
                        `).join("")}
                    </div>
                </div>
            ` : ""}
            <div id="options">
                <span class="grey">Matches for Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${season && season !== seasonNumber || index + 1 !== seasonList.length ? /* html */`<a href="/players?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/players?postseason=yes${season && !isNaN(season) ? `&season=${season}}` : ""}">Yes</a>`} | ${postseason ? /* html */`<a href="/players${season && !isNaN(season) ? `?season=${season}}` : ""}">No</a>` : "No"}
            </div>
            ${stats.length == 0 ? "" : /* html */`
                <div id="stats">
                    <div id="kda">
                        <div class="section">Best KDA Ratio</div>
                        <div class="stats">
                            <div class="average">League Average: <span class="numeric">${averages.kda.toFixed(3)}</span></div>
                            <div class="header">Pos</div>
                            <div class="header">Team</div>
                            <div class="header">Name</div>
                            <div class="header">KDA</div>
                            ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.kda - a.kda).map((s, index, sortedStats) => /* html */`
                                <div class="numeric pos">${index + 1}</div>

                                <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                    <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                `}</div>
                                <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(Common.normalizeName(s.name, team ? team.tag : ""))}">${Common.htmlEncode(Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                <div class="numeric value">${s.kda.toFixed(3)}</div>
                                ${sortedStats[index + 1] && sortedStats[index + 1].kda < averages.kda && sortedStats[index].kda >= averages.kda ? /* html */`
                                    <div class="separator"></div>
                                ` : ""}
                            `).join("")}
                        </div>
                    </div>
                    <div id="kills">
                        <div class="section">Most Kills per Game</div>
                        <div class="stats">
                            <div class="average">League Average: <span class="numeric">${averages.kills.toFixed(2)}</span></div>
                            <div class="header">Pos</div>
                            <div class="header">Team</div>
                            <div class="header">Name</div>
                            <div class="header">KPG</div>
                            ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgKills - a.avgKills).map((s, index, sortedStats) => /* html */`
                                <div class="numeric pos">${index + 1}</div>
                                <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                    <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                `}</div>
                                <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(Common.normalizeName(s.name, team ? team.tag : ""))}">${Common.htmlEncode(Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                <div class="numeric value">${s.avgKills.toFixed(2)}</div>
                                ${sortedStats[index + 1] && sortedStats[index + 1].avgKills < averages.kills && sortedStats[index].avgKills >= averages.kills ? /* html */`
                                    <div class="separator"></div>
                                ` : ""}
                            `).join("")}
                        </div>
                    </div>
                    <div id="assists">
                        <div class="section">Most Assists per Game</div>
                        <div class="stats">
                            <div class="average">League Average: <span class="numeric">${averages.assists.toFixed(2)}</span></div>
                            <div class="header">Pos</div>
                            <div class="header">Team</div>
                            <div class="header">Name</div>
                            <div class="header">APG</div>
                            ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgAssists - a.avgAssists).map((s, index, sortedStats) => /* html */`
                                <div class="numeric pos">${index + 1}</div>
                                <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                    <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                `}</div>
                                <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(Common.normalizeName(s.name, team ? team.tag : ""))}">${Common.htmlEncode(Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                <div class="numeric value">${s.avgAssists.toFixed(2)}</div>
                                ${sortedStats[index + 1] && sortedStats[index + 1].avgAssists < averages.assists && sortedStats[index].avgAssists >= averages.assists ? /* html */`
                                    <div class="separator"></div>
                                ` : ""}
                            `).join("")}
                        </div>
                    </div>
                    <div id="deaths">
                        <div class="section">Least Deaths per Game</div>
                        <div class="stats">
                            <div class="average">League Average: <span class="numeric">${averages.deaths.toFixed(2)}</span></div>
                            <div class="header">Pos</div>
                            <div class="header">Team</div>
                            <div class="header">Name</div>
                            <div class="header">DPG</div>
                            ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : a.avgDeaths - b.avgDeaths).map((s, index, sortedStats) => /* html */`
                                <div class="numeric pos">${index + 1}</div>
                                <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                    <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                `}</div>
                                <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(Common.normalizeName(s.name, team ? team.tag : ""))}">${Common.htmlEncode(Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                <div class="numeric value">${s.avgDeaths.toFixed(2)}</div>
                                ${sortedStats[index + 1] && sortedStats[index + 1].avgDeaths > averages.deaths && sortedStats[index].avgDeaths <= averages.deaths ? /* html */`
                                    <div class="separator"></div>
                                ` : ""}
                            `).join("")}
                        </div>
                    </div>
                </div>
            `}
        `, req);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

module.exports = Players.get;
