/**
 * @typedef {import("../../src/models/team")} Team
 * @typedef {{homes: string[], members: {name: string, role: string}[], requests: {name: string, date: Date}[], invites: {name: string, date: Date}[], penaltiesRemaining: number}} TeamInfo
 * @typedef {import("../../web/includes/teams")} Teams
 */

//  #####                       #   #    #
//    #                         #   #
//    #     ###    ###   ## #   #   #   ##     ###   #   #
//    #    #   #      #  # # #   # #     #    #   #  #   #
//    #    #####   ####  # # #   # #     #    #####  # # #
//    #    #      #   #  # # #   # #     #    #      # # #
//    #     ###    ####  #   #    #     ###    ###    # #
/**
 * A class that represents the team view.
 */
class TeamView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the team template.
     * @param {{pageTeam: Team, teamInfo: TeamInfo, timezone: string, seasonList: number[], teamData: {records: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, winsMap1: number, lossesMap1: number, tiesMap1: number, winsMap2: number, lossesMap2: number, tiesMap2: number, winsMap3: number, lossesMap3: number, tiesMap3: number, winsServer1: number, lossesServer1: number, tiesServer1: number, winsServer2: number, lossesServer2: number, tiesServer2: number, winsServer3: number, lossesServer3: number, tiesServer3: number, wins2v2: number, losses2v2: number, ties2v2: number, wins3v3: number, losses3v3: number, ties3v3: number, wins4v4: number, losses4v4: number, ties4v4: number}, opponents: {teamId: number, name: string, tag: string, wins: number, losses: number, ties: number}[], maps: {map: string, wins: number, losses: number, ties: number}[], matches: {challengingTeamId: number, challengingTeamName: string, challengingTeamTag: string, challengingTeamScore: number, challengedTeamId: number, challengedTeamName: string, challengedTeamTag: string, challengedTeamScore: number, map: string, matchTime: Date, statTeamId: number, statTeamName: string, statTeamTag: string, playerId: number, name: string, kills: number, deaths: number, assists: number}[], stats: {playerId: number, name: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, teamId: number, teamName: string, teamTag: string, map: string, matchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number}[]}, tag: string, season: number, postseason: boolean, teams: Teams}} data The team data.
     * @returns {string} An HTML string of the team.
     */
    static get(data) {
        const {pageTeam, teamInfo, timezone, seasonList, teamData, tag, season, postseason, teams} = data;
        let team;

        return /* html */`
            <div id="team">
                <div id="teamname">
                    <div class="tag"><div class="diamond${pageTeam.role && pageTeam.role.color ? "" : "-empty"}" ${pageTeam.role && pageTeam.role.color ? `style="background-color: ${pageTeam.role.hexColor};"` : ""}></div> ${pageTeam.tag}</div>
                    <div class="name">${pageTeam.name}</div>
                </div>
                <div id="roster">
                    <div class="section">Current Roster</div>
                    ${teamInfo.members.map((m) => /* html */`
                        <div class="member">${TeamView.Common.htmlEncode(TeamView.Common.normalizeName(m.name, pageTeam.tag))} <span class="grey">${m.role ? `- ${m.role}` : ""}</span></div>
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
                    <div>${timezone}</div>
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
                        <div class="date"><script>document.write(Common.formatDate(new Date("${m.matchTime}")));</script></div>
                        <div class="tag player"><div class="diamond${(team = teams.getTeam(m.statTeamId, m.statTeamName, m.statTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="player"><a href="/player/${m.playerId}/${encodeURIComponent(TeamView.Common.normalizeName(m.name, team.tag))}">${TeamView.Common.htmlEncode(TeamView.Common.normalizeName(m.name, team.tag))}</a></div>
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
                        <div><a href="/player/${s.playerId}/${encodeURIComponent(TeamView.Common.normalizeName(s.name, team.tag))}">${TeamView.Common.htmlEncode(TeamView.Common.normalizeName(s.name, team.tag))}</a></div>
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
                        <div class="best"><script>document.write(Common.formatDate(new Date("${s.matchTime}")));</script></div>
                        <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)</div>
                    `).join("")}
                </div>
            ` : ""}
        `;
    }
}

// @ts-ignore
TeamView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = TeamView; // eslint-disable-line no-undef
}
