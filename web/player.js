const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Teams = require("./teams");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  ####    ##
//  #   #    #
//  #   #    #     ###   #   #   ###   # ##
//  ####     #        #  #   #  #   #  ##  #
//  #        #     ####  #  ##  #####  #
//  #        #    #   #   ## #  #      #
//  #       ###    ####      #   ###   #
//                       #   #
//                        ###
/**
 * A class that represents the player page.
 */
class Player {
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
        const playerId = req.params.id,
            player = await Db.getCareer(playerId);

        if (player) {
            const teams = new Teams();
            let team;

            const html = Common.page(/* html */`
                <link rel="stylesheet" href="/css/player.css" />
            `, /* html */`
                <div id="player">
                    <div id="name">${Common.htmlEncode(Common.normalizeName(player.player.name, player.player.tag))}</div>
                    ${player.player.twitchName ? /* html */`
                        <div id="twitch"><div id="glitch"></div> <a href="https://twitch.tv/${encodeURIComponent(player.player.twitchName)}">https://twitch.tv/${Common.htmlEncode(player.player.twitchName)}</a></div>
                    ` : ""}
                    ${player.player.teamId ? /* html */`
                        <div id="team">
                            <div class="section">Current Team</div>
                            <div>
                                <div class="tag"><div class="diamond${(team = teams.getTeam(player.player.teamId, player.player.teamName, player.player.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                <div class="name"><a href="/team/${team.tag}">${team.name}</a></div>
                            </div>
                        </div>
                    ` : ""}
                    ${player.player.timezone ? /* html */`
                        <div id="timezone">
                            <div class="section">Time Zone</div>
                            <div>${player.player.timezone}</div>
                        </div>
                    ` : ""}
                </div>
                <div class="section">Career Stats</div>
                <div id="stats">
                    <div class="header">Season</div>
                    <div class="header team">Team</div>
                    <div class="header">G</div>
                    <div class="header">KDA</div>
                    <div class="header totals">K</div>
                    <div class="header totals">A</div>
                    <div class="header totals">D</div>
                    <div class="header">KPG</div>
                    <div class="header">APG</div>
                    <div class="header">DPG</div>
                    ${player.career.map((s) => /* html */`
                        <div class="season">${s.season}</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${s.games}</div>
                        <div>${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                        <div class="totals">${s.kills}</div>
                        <div class="totals">${s.assists}</div>
                        <div class="totals">${s.deaths}</div>
                        <div>${(s.kills / s.games).toFixed(2)}</div>
                        <div>${(s.assists / s.games).toFixed(2)}</div>
                        <div>${(s.deaths / s.games).toFixed(2)}</div>
                    `).join("")}
                </div>
                <div class="section">Season Matches</div>
                <div id="matches">
                    <div class="header team">Team</div>
                    <div class="header team">Opponent</div>
                    <div class="header">Result</div>
                    <div class="header date">Date</div>
                    <div class="header map">Map</div>
                    <div class="header">KDA</div>
                    <div class="header">K</div>
                    <div class="header">A</div>
                    <div class="header">D</div>
                    ${player.matches.map((m) => /* html */`
                        <div class="tag"><div class="diamond${(team = teams.getTeam(m.teamId, m.name, m.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(m.opponentTeamId, m.opponentName, m.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${m.teamScore > m.opponentScore ? "W" : m.teamScore < m.opponentScore ? "L" : "T"} <span ${m.teamScore > m.opponentScore ? "class=\"winner\"" : ""}>${m.teamScore}</span>-<span ${m.teamScore < m.opponentScore ? "class=\"winner\"" : ""}>${m.opponentScore}</span></div>
                        <div class="date"><script>document.write(formatDate(new Date("${m.matchTime}")));</script></div>
                        <div class="map">${m.map}</div>
                        <div>${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(2)}</div>
                        <div>${m.kills}</div>
                        <div>${m.assists}</div>
                        <div>${m.deaths}</div>
                    `).join("")}
                </div>
            `, req);

            res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
        } else {
            const html = Common.page("", /* html */`
                <div class="section">Player Not Found</div>
            `, req);

            res.status(404).send(HtmlMinifier.minify(html, settings.htmlMinifier));
        }
    }
}

module.exports = Player.get;