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
            name = req.params.name,
            season = isNaN(req.query.season) ? void 0 : Number.parseInt(req.query.season, 10),
            postseason = !!req.query.postseason,
            player = await Db.getCareer(playerId, season, postseason),
            seasonList = player.career.map((c) => c.season).filter((s, index, seasons) => seasons.indexOf(s) === index).sort();

        if (player) {
            const teams = new Teams();
            let team;

            let totals = {
                games: player.career.reduce((sum, stat) => sum + stat.games, 0),
                kills: player.career.reduce((sum, stat) => sum + stat.kills, 0),
                assists: player.career.reduce((sum, stat) => sum + stat.assists, 0),
                deaths: player.career.reduce((sum, stat) => sum + stat.deaths, 0)
            };

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
                ${player.career.length === 0 ? "" : /* html */`
                    <div class="section">Career Stats by Season</div>
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
                            <div class="season">${s.season} ${s.postseason ? "Postseason" : ""}</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="numeric">${s.games}</div>
                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            <div class="numeric totals">${s.kills}</div>
                            <div class="numeric totals">${s.assists}</div>
                            <div class="numeric totals">${s.deaths}</div>
                            <div class="numeric">${(s.kills / s.games).toFixed(2)}</div>
                            <div class="numeric">${(s.assists / s.games).toFixed(2)}</div>
                            <div class="numeric">${(s.deaths / s.games).toFixed(2)}</div>
                        `).join("")}
                        <div class="lifetime">Lifetime</div>
                        <div class="numeric">${totals.games}</div>
                        <div class="numeric">${((totals.kills + totals.assists) / Math.max(1, totals.deaths)).toFixed(3)}</div>
                        <div class="numeric totals">${totals.kills}</div>
                        <div class="numeric totals">${totals.assists}</div>
                        <div class="numeric totals">${totals.deaths}</div>
                        <div class="numeric">${(totals.kills / totals.games).toFixed(2)}</div>
                        <div class="numeric">${(totals.assists / totals.games).toFixed(2)}</div>
                        <div class="numeric">${(totals.deaths / totals.games).toFixed(2)}</div>
                    </div>
                    <div class="section">Career Stats by Team</div>
                    <div id="team-stats">
                        <div class="header team">Team</div>
                        <div class="header">G</div>
                        <div class="header">KDA</div>
                        <div class="header totals">K</div>
                        <div class="header totals">A</div>
                        <div class="header totals">D</div>
                        <div class="header">KPG</div>
                        <div class="header">APG</div>
                        <div class="header">DPG</div>
                        ${player.careerTeams.map((s) => /* html */`
                            <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="numeric">${s.games}</div>
                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            <div class="numeric totals">${s.kills}</div>
                            <div class="numeric totals">${s.assists}</div>
                            <div class="numeric totals">${s.deaths}</div>
                            <div class="numeric">${(s.kills / s.games).toFixed(2)}</div>
                            <div class="numeric">${(s.assists / s.games).toFixed(2)}</div>
                            <div class="numeric">${(s.deaths / s.games).toFixed(2)}</div>
                        `).join("")}
                    </div>
                    <div id="options">
                        <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                            ${!isNaN(season) && season !== seasonNumber || index + 1 !== seasonList.length ? /* html */`<a href="/player/${encodeURI(playerId)}/${encodeURI(name)}?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber} | ${season === 0 ? "All Time" : /* html */`<a href="/player/${encodeURI(playerId)}/${encodeURI(name)}?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}
                        `).join(" | ")}<br />
                        <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/player/${encodeURI(playerId)}/${encodeURI(name)}?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/player/${encodeURI(playerId)}/${encodeURI(name)}${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
                    </div>
                    <div class="section">Performance</div>
                    <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                    <div id="performance">
                        <div id="opponents">
                            <div class="header team">Vs. Opponent</div>
                            <div class="header">G</div>
                            <div class="header">KDA</div>
                            <div class="header">KPG</div>
                            <div class="header">APG</div>
                            <div class="header">DPG</div>
                            ${player.opponents.map((s) => /* html */`
                                <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                <div class="numeric">${s.games}</div>
                                <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                                <div class="numeric">${(s.kills / s.games).toFixed(2)}</div>
                                <div class="numeric">${(s.assists / s.games).toFixed(2)}</div>
                                <div class="numeric">${(s.deaths / s.games).toFixed(2)}</div>
                            `).join("")}
                        </div>
                        <div id="maps">
                            <div class="header">On Map</div>
                            <div class="header">G</div>
                            <div class="header">KDA</div>
                            <div class="header">KPG</div>
                            <div class="header">APG</div>
                            <div class="header">DPG</div>
                            ${player.maps.map((s) => /* html */`
                                <div>${s.map}</div>
                                <div class="numeric">${s.games}</div>
                                <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                                <div class="numeric">${(s.kills / s.games).toFixed(2)}</div>
                                <div class="numeric">${(s.assists / s.games).toFixed(2)}</div>
                                <div class="numeric">${(s.deaths / s.games).toFixed(2)}</div>
                            `).join("")}
                        </div>
                    </div>
                    <div class="section">Season Matches</div>
                    <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
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
                            <div>${m.teamScore > m.opponentScore ? "W" : m.teamScore < m.opponentScore ? "L" : "T"} <span class="numeric">${m.teamScore}</span>-<span class="numeric">${m.opponentScore}</span></div>
                            <div class="date"><script>document.write(formatDate(new Date("${m.matchTime}")));</script></div>
                            <div class="map">${m.map}</div>
                            <div class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</div>
                            <div class="numeric">${m.kills}</div>
                            <div class="numeric">${m.assists}</div>
                            <div class="numeric">${m.deaths}</div>
                        `).join("")}
                    </div>
                `}
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
