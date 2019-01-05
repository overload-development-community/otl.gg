const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Team = require("../team");

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

        /**
         * @type {{team?: Team, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, avgKills: number, avgAssists: number, avgDeaths: number, kda: number}[]}
         */
        const stats = await Db.playerSeasonStats();

        stats.forEach((stat) => {
            if (stat.teamId) {
                stat.team = new Team({
                    id: stat.teamId,
                    name: stat.teamName,
                    tag: stat.tag,
                    disbanded: stat.disbanded,
                    locked: stat.locked
                });
            }
        });

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/players.css">
        `, /* html */`
            <div id="stats">
                <div id="kills">
                    <div class="section">Most Kills per Game</div>
                    <div class="stats">
                        <div class="header">Pos</div>
                        <div class="header">Team</div>
                        <div class="header">Name</div>
                        <div class="header">KPG</div>
                        ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgKills - a.avgKills).map((s, index) => /* html */`
                            <div class="pos">${index + 1}</div>
                            <div class="tag">${s.team ? /* html */`
                                <div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> <a href="/team/${s.team.tag}">${s.team.tag}</a>
                            ` : ""}</div>
                            <div class="name">${Common.htmlEncode(Common.normalizeName(s.name))}</div>
                            <div class="value">${s.avgKills.toFixed(2)}</div>
                        `).join("")}
                    </div>
                </div>
                <div id="assists">
                    <div class="section">Most Assists per Game</div>
                    <div class="stats">
                        <div class="header">Pos</div>
                        <div class="header">Team</div>
                        <div class="header">Name</div>
                        <div class="header">APG</div>
                        ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgAssists - a.avgAssists).map((s, index) => /* html */`
                            <div class="pos">${index + 1}</div>
                            <div class="tag">${s.team ? /* html */`
                                <div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> <a href="/team/${s.team.tag}">${s.team.tag}</a>
                            ` : ""}</div>
                            <div class="name">${Common.htmlEncode(Common.normalizeName(s.name))}</div>
                            <div class="value">${s.avgAssists.toFixed(2)}</div>
                        `).join("")}
                    </div>
                </div>
                <div id="deaths">
                    <div class="section">Least Deaths per Game</div>
                    <div class="stats">
                        <div class="header">Pos</div>
                        <div class="header">Team</div>
                        <div class="header">Name</div>
                        <div class="header">DPG</div>
                        ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : a.avgDeaths - b.avgDeaths).map((s, index) => /* html */`
                            <div class="pos">${index + 1}</div>
                            <div class="tag">${s.team ? /* html */`
                                <div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> <a href="/team/${s.team.tag}">${s.team.tag}</a>
                            ` : ""}</div>
                            <div class="name">${Common.htmlEncode(Common.normalizeName(s.name))}</div>
                            <div class="value">${s.avgDeaths.toFixed(2)}</div>
                        `).join("")}
                    </div>
                </div>
                <div id="kda">
                    <div class="section">Best KDA Ratio</div>
                    <div class="stats">
                        <div class="header">Pos</div>
                        <div class="header">Team</div>
                        <div class="header">Name</div>
                        <div class="header">KDA</div>
                        ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.kda - a.kda).map((s, index) => /* html */`
                            <div class="pos">${index + 1}</div>
                            <div class="tag">${s.team ? /* html */`
                                <div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> <a href="/team/${s.team.tag}">${s.team.tag}</a>
                            ` : ""}</div>
                            <div class="name">${Common.htmlEncode(Common.normalizeName(s.name))}</div>
                            <div class="value">${s.kda.toFixed(2)}</div>
                        `).join("")}
                    </div>
                </div>
            </div>
        `);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

module.exports = Players.get;
