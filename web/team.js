const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Team = require("../team"),
    Teams = require("./teams");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #####                       ####
//    #                         #   #
//    #     ###    ###   ## #   #   #   ###    ## #   ###
//    #    #   #      #  # # #  ####       #  #  #   #   #
//    #    #####   ####  # # #  #       ####   ##    #####
//    #    #      #   #  # # #  #      #   #  #      #
//    #     ###    ####  #   #  #       ####   ###    ###
//                                            #   #
//                                             ###
/**
 * A class that represents the team page.
 */
class TeamPage {
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
        const tag = req.params.tag,
            pageTeam = await Team.getByNameOrTag(tag);

        if (pageTeam) {
            const teamInfo = await pageTeam.getInfo(),
                seasonList = await Db.seasonList(),
                season = Number.parseInt(req.query.season, 10) || void 0,
                teamData = await Db.getTeamData(pageTeam, season),
                teams = new Teams();
            let team;

            teamInfo.members.sort((a, b) => {
                if (a.role !== b.role) {
                    return ["Founder", "Captain", void 0].indexOf(a.role) - ["Founder", "Captain", void 0].indexOf(b.role);
                }
                return Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag));
            });

            teamData.stats.sort((a, b) => Common.normalizeName(a.name, pageTeam.tag).localeCompare(Common.normalizeName(b.name, pageTeam.tag)));

            const html = Common.page(/* html */`
                <link rel="stylesheet" href="/css/team.css" />
            `, /* html */`
                <div id="team">
                    <div id="teamname">
                        <div class="tag"><div class="diamond${pageTeam.role && pageTeam.role.color ? "" : "-empty"}" ${pageTeam.role && pageTeam.role.color ? `style="background-color: ${pageTeam.role.hexColor};"` : ""}></div> ${pageTeam.tag}</div>
                        <div class="name">${pageTeam.name}</div>
                    </div>
                    <div id="roster">
                        <div class="section">Current Roster</div>
                        ${teamInfo.members.map((m) => /* html */`
                            <div class="member">${Common.htmlEncode(Common.normalizeName(m.name, pageTeam.tag))} <span class="grey">${m.role ? `- ${m.role}` : ""}</span></div>
                        `).join("")}
                    </div>
                    <div id="homes">
                        <div class="section">Home Maps</div>
                        ${teamInfo.homes.map((h) => /* html */`
                            <div>${h}</div>
                        `).join("")}
                    </div>
                    <div id="timezone">
                        <div class="section">Primary Time Zone</div>
                        <div>${await pageTeam.getTimezone()}</div>
                    </div>
                </div>
                <div class="section">Season Records</div>
                <div id="options">
                    <div class="season">
                        <span class="grey">Standings for Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                            ${season && season !== seasonNumber || index + 1 !== seasonList.length ? /* html */`<a href="/team/${pageTeam.tag}?season=${seasonNumber}">${seasonNumber}</a>` : seasonNumber}
                        `).join(" | ")}
                    </div>
                </div>
                ${teamData.records && (teamData.records.wins > 0 || teamData.records.losses > 0 || teamData.records.ties > 0) ? /* html */`
                    <div id="records">
                        <div class="overall">
                            <div>Overall: ${teamData.records.wins}-${teamData.records.losses}${teamData.records.ties ? `-${teamData.records.ties}` : ""}</div>
                            <div>Rating: <span ${teamData.records.wins + teamData.records.losses + teamData.records.ties < 10 ? "class=\"provisional\"" : ""}>${Math.round(teamData.records.rating)}</span></div>
                        </div>
                        <div class="splits">
                            <div>
                                Home Map Record: ${teamData.records.winsMap1}-${teamData.records.lossesMap1}${teamData.records.tiesMap1 ? `-${teamData.records.tiesMap1}` : ""}<br />
                                Away Map Record: ${teamData.records.winsMap2}-${teamData.records.lossesMap2}${teamData.records.tiesMap2 ? `-${teamData.records.tiesMap2}` : ""}<br />
                                Neutral Map Record: ${teamData.records.winsMap3}-${teamData.records.lossesMap3}${teamData.records.tiesMap3 ? `-${teamData.records.tiesMap3}` : ""}
                            </div>
                            <div>
                                Home Server Record: ${teamData.records.winsServer1}-${teamData.records.lossesServer1}${teamData.records.tiesServer1 ? `-${teamData.records.tiesServer1}` : ""}<br />
                                Away Server Record: ${teamData.records.winsServer2}-${teamData.records.lossesServer2}${teamData.records.tiesServer2 ? `-${teamData.records.tiesServer2}` : ""}<br />
                                Neutral Server Record: ${teamData.records.winsServer3}-${teamData.records.lossesServer3}${teamData.records.tiesServer3 ? `-${teamData.records.tiesServer3}` : ""}
                            </div>
                            <div>
                                2v2 Record: ${teamData.records.wins2v2}-${teamData.records.losses2v2}${teamData.records.ties2v2 ? `-${teamData.records.ties2v2}` : ""}<br />
                                3v3 Record: ${teamData.records.wins3v3}-${teamData.records.losses3v3}${teamData.records.ties3v3 ? `-${teamData.records.ties3v3}` : ""}<br />
                                4v4 Record: ${teamData.records.wins4v4}-${teamData.records.losses4v4}${teamData.records.ties4v4 ? `-${teamData.records.ties4v4}` : ""}
                            </div>
                        </div>
                        <div class="breakdown">
                            <div class="opponents">
                                <div class="header">Tag</div>
                                <div class="header">Opponent</div>
                                <div class="header">Record</div>
                                ${teamData.opponents.map((opponent) => /* html */`
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(opponent.teamId, opponent.name, opponent.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div>${opponent.wins}-${opponent.losses}${opponent.ties ? `-${opponent.ties}` : ""}</div>
                                `).join("")}
                            </div>
                            <div class="maps">
                                <div class="header">Map</div>
                                <div class="header">Record</div>
                                ${teamData.maps.map((map) => /* html */`
                                    <div class="map">${map.map}</div>
                                    <div>${map.wins}-${map.losses}${map.ties ? `-${map.ties}` : ""}</div>
                                `).join("")}
                            </div>
                        </div>
                    </div>
                    <div class="section">Season Matches</div>
                    <div id="matches">
                        <div class="header team">Challenging Team</div>
                        <div class="header team">Challenged Team</div>
                        <div class="header">Map</div>
                        <div class="header date">Date</div>
                        <div class="header player">Top Performer</div>
                        ${teamData.matches.map((m) => /* html */`
                            <div class="tag"><div class="diamond${(team = teams.getTeam(m.challengingTeamId, m.challengingTeamName, m.challengingTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="score ${m.challengingTeamScore > m.challengedTeamScore ? "winner" : ""}">${m.challengingTeamScore}</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(m.challengedTeamId, m.challengedTeamName, m.challengedTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="score ${m.challengingTeamScore < m.challengedTeamScore ? "winner" : ""}">${m.challengedTeamScore}</div>
                            <div>${m.map}</div>
                            <div class="date"><script>document.write(formatDate(new Date("${m.matchTime}")));</script></div>
                            <div class="tag player"><div class="diamond${(team = teams.getTeam(m.statTeamId, m.statTeamName, m.statTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="player"><a href="/player/${m.playerId}/${encodeURIComponent(Common.normalizeName(m.name, team.tag))}">${Common.htmlEncode(Common.normalizeName(m.name, team.tag))}</a></div>
                            <div class="best-stats">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(2)} KDA (${m.kills} K, ${m.assists} A, ${m.deaths} D)</div>
                        `).join("")}
                    </div>
                    <div class="section">Season Player Stats</div>
                    <div id="stats">
                        <div class="header">Player</div>
                        <div class="header">G</div>
                        <div class="header">KDA</div>
                        <div class="header totals">K</div>
                        <div class="header totals">A</div>
                        <div class="header totals">D</div>
                        <div class="header">KPG</div>
                        <div class="header">APG</div>
                        <div class="header">DPG</div>
                        <div class="header best">Best Performance Vs.</div>
                        ${teamData.stats.map((s) => /* html */`
                            <div><a href="/player/${s.playerId}/${encodeURIComponent(Common.normalizeName(s.name, team.tag))}">${Common.htmlEncode(Common.normalizeName(s.name, team.tag))}</a></div>
                            <div>${s.games}</div>
                            <div>${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            <div class="totals">${s.kills}</div>
                            <div class="totals">${s.assists}</div>
                            <div class="totals">${s.deaths}</div>
                            <div>${(s.kills / s.games).toFixed(2)}</div>
                            <div>${(s.assists / s.games).toFixed(2)}</div>
                            <div>${(s.deaths / s.games).toFixed(2)}</div>
                            <div class="tag best"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.teamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="best">${s.map}</div>
                            <div class="best"><script>document.write(formatDate(new Date("${s.matchTime}")));</script></div>
                            <div class="best-stats">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(2)} KDA (${s.bestKills} K, ${s.bestAssists} A, ${s.bestDeaths} D)</div>
                        `).join("")}
                    </div>
                ` : ""}
            `, req);

            res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
        } else {
            const html = Common.page("", /* html */`
                <div class="section">Team Not Found</div>
            `, req);

            res.status(404).send(HtmlMinifier.minify(html, settings.htmlMinifier));
        }
    }
}

module.exports = TeamPage.get;
