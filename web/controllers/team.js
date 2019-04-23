const HtmlMinifier = require("html-minifier"),

    Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    Season = require("../../src/models/season"),
    settings = require("../../settings"),
    Team = require("../../src/models/team");

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
        const tag = req.params.tag.toUpperCase(),
            pageTeam = await Team.getByNameOrTag(tag);

        if (pageTeam) {
            const teamInfo = await pageTeam.getInfo(),
                seasonList = await Season.getSeasonNumbers(),
                season = isNaN(req.query.season) ? void 0 : Number.parseInt(req.query.season, 10),
                postseason = !!req.query.postseason,
                teamData = await Team.getData(pageTeam, season, postseason),
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
                <div id="options">
                    <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                        ${!isNaN(season) && season !== seasonNumber || index + 1 !== seasonList.length ? /* html */`<a href="/team/${encodeURI(pageTeam.tag)}?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber} | ${season === 0 ? "All Time" : /* html */`<a href="/team/${encodeURI(pageTeam.tag)}?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}
                    `).join(" | ")}<br />
                    <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/team/${encodeURI(pageTeam.tag)}?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/team/${encodeURI(pageTeam.tag)}${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
                </div>
                <div class="section">Season Records</div>
                <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                ${teamData.records && (teamData.records.wins > 0 || teamData.records.losses > 0 || teamData.records.ties > 0) ? /* html */`
                    <div id="records">
                        <div class="overall">
                            <div>Overall: <span class="numeric">${teamData.records.wins}-${teamData.records.losses}${teamData.records.ties ? `-${teamData.records.ties}` : ""}</span></div>
                            ${season === 0 ? "" : /* html */`
                                <div>Rating: <span class="numeric ${teamData.records.wins + teamData.records.losses + teamData.records.ties < 10 ? "provisional" : ""}">${Math.round(teamData.records.rating)}</span></div>
                            `}
                        </div>
                        <div class="splits">
                            <div>
                                Home Map Record: <span class="numeric">${teamData.records.winsMap1}-${teamData.records.lossesMap1}${teamData.records.tiesMap1 ? `-${teamData.records.tiesMap1}` : ""}</span><br />
                                Away Map Record: <span class="numeric">${teamData.records.winsMap2}-${teamData.records.lossesMap2}${teamData.records.tiesMap2 ? `-${teamData.records.tiesMap2}` : ""}</span><br />
                                Neutral Map Record: <span class="numeric">${teamData.records.winsMap3}-${teamData.records.lossesMap3}${teamData.records.tiesMap3 ? `-${teamData.records.tiesMap3}` : ""}</span>
                            </div>
                            <div>
                                Home Server Record: <span class="numeric">${teamData.records.winsServer1}-${teamData.records.lossesServer1}${teamData.records.tiesServer1 ? `-${teamData.records.tiesServer1}` : ""}</span><br />
                                Away Server Record: <span class="numeric">${teamData.records.winsServer2}-${teamData.records.lossesServer2}${teamData.records.tiesServer2 ? `-${teamData.records.tiesServer2}` : ""}</span><br />
                                Neutral Server Record: <span class="numeric">${teamData.records.winsServer3}-${teamData.records.lossesServer3}${teamData.records.tiesServer3 ? `-${teamData.records.tiesServer3}` : ""}</span>
                            </div>
                            <div>
                                2v2 Record: <span class="numeric">${teamData.records.wins2v2}-${teamData.records.losses2v2}${teamData.records.ties2v2 ? `-${teamData.records.ties2v2}` : ""}</span><br />
                                3v3 Record: <span class="numeric">${teamData.records.wins3v3}-${teamData.records.losses3v3}${teamData.records.ties3v3 ? `-${teamData.records.ties3v3}` : ""}</span><br />
                                4v4 Record: <span class="numeric">${teamData.records.wins4v4}-${teamData.records.losses4v4}${teamData.records.ties4v4 ? `-${teamData.records.ties4v4}` : ""}</span>
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
                                    <div class="numeric">${opponent.wins}-${opponent.losses}${opponent.ties ? `-${opponent.ties}` : ""}</div>
                                `).join("")}
                            </div>
                            <div class="maps">
                                <div class="header">Map</div>
                                <div class="header">Record</div>
                                ${teamData.maps.map((map) => /* html */`
                                    <div class="map">${map.map}</div>
                                    <div class="numeric">${map.wins}-${map.losses}${map.ties ? `-${map.ties}` : ""}</div>
                                `).join("")}
                            </div>
                        </div>
                    </div>
                    <div class="section">Season Matches</div>
                    <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                    <div id="matches">
                        <div class="header team">Oppenent</div>
                        <div class="header">Score</div>
                        <div class="header">Map</div>
                        <div class="header date">Date</div>
                        <div class="header player">Top Performer</div>
                        ${teamData.matches.map((m) => /* html */`
                            <div class="tag"><div class="diamond${(team = m.challengingTeamTag === tag ? teams.getTeam(m.challengedTeamId, m.challengedTeamName, m.challengedTeamTag) : teams.getTeam(m.challengingTeamId, m.challengingTeamName, m.challengingTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div>${m.challengingTeamTag === tag ? m.challengingTeamScore > m.challengedTeamScore ? "W" : m.challengingTeamScore < m.challengedTeamScore ? "L" : "T" : m.challengedTeamScore > m.challengingTeamScore ? "W" : m.challengedTeamScore < m.challengingTeamScore ? "L" : "T"} <span class="numeric">${m.challengingTeamTag === tag ? m.challengingTeamScore : m.challengedTeamScore}-${m.challengingTeamTag === tag ? m.challengedTeamScore : m.challengingTeamScore}</span></div>
                            <div>${m.map}</div>
                            <div class="date"><script>document.write(formatDate(new Date("${m.matchTime}")));</script></div>
                            <div class="tag player"><div class="diamond${(team = teams.getTeam(m.statTeamId, m.statTeamName, m.statTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="player"><a href="/player/${m.playerId}/${encodeURIComponent(Common.normalizeName(m.name, team.tag))}">${Common.htmlEncode(Common.normalizeName(m.name, team.tag))}</a></div>
                            <div class="best-stats"><span class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${m.kills}</span> K, <span class="numeric">${m.assists}</span> A, <span class="numeric">${m.deaths}</span> D)</div>
                        `).join("")}
                    </div>
                    <div class="section">Season Player Stats</div>
                    <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
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
                            <div class="numeric">${s.games}</div>
                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            <div class="numeric totals">${s.kills}</div>
                            <div class="numeric totals">${s.assists}</div>
                            <div class="numeric totals">${s.deaths}</div>
                            <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="tag best"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.teamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="best">${s.map}</div>
                            <div class="best"><script>document.write(formatDate(new Date("${s.matchTime}")));</script></div>
                            <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)</div>
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

TeamPage.route = {
    path: "/team/:tag"
};

module.exports = TeamPage;
