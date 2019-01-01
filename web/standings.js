const {minify} = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Team = require("../team");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   ###    #                       #    #
//  #   #   #                       #
//  #      ####    ###   # ##    ## #   ##    # ##    ## #   ###
//   ###    #         #  ##  #  #  ##    #    ##  #  #  #   #
//      #   #      ####  #   #  #   #    #    #   #   ##     ###
//  #   #   #  #  #   #  #   #  #  ##    #    #   #  #          #
//   ###     ##    ####  #   #   ## #   ###   #   #   ###   ####
//                                                   #   #
//                                                    ###
/**
 * A class that represents the standings page.
 */
class Standings {
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
         * @typedef {{team?: Team, teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}} Standing
         * @type {Standing[]}
         */
        const standings = await Db.seasonStandings();

        standings.forEach((standing) => {
            standing.team = new Team({
                id: standing.teamId,
                name: standing.name,
                tag: standing.tag,
                disbanded: standing.disbanded,
                locked: standing.locked
            });
        });

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/standings.css">
        `, /* html */`
            <div id="body">
                <div class="section">Season Standings</div>
                <div id="standings">
                    <div class="header">Pos</div>
                    <div class="header">Tag</div>
                    <div class="header">Team Name</div>
                    <div class="header">Rating</div>
                    <div class="header">Record</div>
                    ${standings.filter((s) => !s.disbanded).map((s, index) => /* html */`
                        <div>${s.wins > 0 || s.losses > 0 || s.ties > 0 ? index + 1 : ""}</div>
                        <div class="tag"><div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> ${s.team.tag}</div>
                        <div>${s.team.name}</div>
                        <div ${s.wins + s.losses + s.ties < 10 ? "class=\"provisional\"" : ""}>${s.rating ? Math.round(s.rating) : ""}</div>
                        <div>${s.wins > 0 || s.losses > 0 || s.ties > 0 ? `${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}` : ""}</div>
                    `).join("")}
                </div>
                ${standings.filter((s) => s.disbanded).length > 0 ? /* html */`
                    <div class="section">Disbanded Teams</div>
                    <div id="disbanded">
                        <div class="header">Tag</div>
                        <div class="header">Team Name</div>
                        <div class="header">Rating</div>
                        <div class="header">Record</div>
                        ${standings.filter((s) => s.disbanded).map((s) => /* html */`
                            <div>${s.team.tag}</div>
                            <div>${s.team.name}</div>
                            <div ${s.wins + s.losses + s.ties < 10 ? "class=\"provisional\"" : ""}>${s.rating ? Math.round(s.rating) : ""}</div>
                            <div>${s.wins > 0 || s.losses > 0 || s.ties > 0 ? `${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}` : ""}</div>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
        `);

        res.status(200).send(minify(html, settings.htmlMinifier));
    }
}

module.exports = Standings.get;
