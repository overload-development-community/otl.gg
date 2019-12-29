/**
 * @typedef {import("../../src/models/team")} Team
 * @typedef {{homes: {map: string, gameType: string}[], members: {playerId: number, name: string, role: string}[], requests: {name: string, date: Date}[], invites: {name: string, date: Date}[], penaltiesRemaining: number}} TeamInfo
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
     * @param {{pageTeam: Team, teamInfo: TeamInfo, timezone: string, seasonList: number[], teamData: {records: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, winsTA: number, lossesTA: number, tiesTA: number, winsCTF: number, lossesCTF: number, tiesCTF: number, winsHomeTA: number, lossesHomeTA: number, tiesHomeTA: number, winsAwayTA: number, lossesAwayTA: number, tiesAwayTA: number, winsNeutralTA: number, lossesNeutralTA: number, tiesNeutralTA: number, winsHomeCTF: number, lossesHomeCTF: number, tiesHomeCTF: number, winsAwayCTF: number, lossesAwayCTF: number, tiesAwayCTF: number, winsNeutralCTF: number, lossesNeutralCTF: number, tiesNeutralCTF: number, wins2v2TA: number, losses2v2TA: number, ties2v2TA: number, wins3v3TA: number, losses3v3TA: number, ties3v3TA: number, wins4v4TA: number, losses4v4TA: number, ties4v4TA: number, wins2v2CTF: number, losses2v2CTF: number, ties2v2CTF: number, wins3v3CTF: number, losses3v3CTF: number, ties3v3CTF: number, wins4v4CTF: number, losses4v4CTF: number, ties4v4CTF: number}, opponents: {teamId: number, name: string, tag: string, wins: number, losses: number, ties: number, gameType: string}[], maps: {map: string, wins: number, losses: number, ties: number, gameType: string}[], statsTA: {playerId: number, name: string, games: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number, teamId: number, teamName: string, teamTag: string, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, map: string, matchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number, bestDamage: number}[], statsCTF: {playerId: number, name: string, games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, overtimePeriods: number, teamId: number, teamName: string, teamTag: string, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, map: string, matchTime: Date, bestCaptures: number, bestPickups: number, bestCarrierKills: number, bestReturns: number, bestKills: number, bestAssists: number, bestDeaths: number, bestDamage: number}[]}, season: number, postseason: boolean, teams: Teams}} data The team data.
     * @returns {string} An HTML string of the team.
     */
    static get(data) {
        const {pageTeam, teamInfo, timezone, seasonList, teamData, season, postseason, teams} = data;
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
                        <div class="member"><a href="/player/${m.playerId}/${encodeURIComponent(TeamView.Common.normalizeName(m.name, pageTeam.tag))}">${TeamView.Common.htmlEncode(TeamView.Common.normalizeName(m.name, pageTeam.tag))}</a><span class="grey">${m.role ? ` - ${m.role}` : ""}</span></div>
                    `).join("")}
                </div>
                <div id="homes-ta">
                    <div class="section">Team Anarchy<br />Home Maps</div>
                    ${teamInfo.homes.filter((h) => h.gameType === "TA").map((h) => /* html */`
                        <div>${h.map}</div>
                    `).join("")}
                </div>
                <div id="homes-ctf">
                    <div class="section">Capture the Flag<br />Home Maps</div>
                    ${teamInfo.homes.filter((h) => h.gameType === "CTF").map((h) => /* html */`
                        <div>${h.map}</div>
                    `).join("")}
                </div>
                <div id="timezone">
                    <div class="section">Primary Time Zone</div>
                    <div>${timezone}</div>
                </div>
            </div>
            <div class="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/team/${encodeURI(pageTeam.tag)}?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/team/${encodeURI(pageTeam.tag)}?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/team/${encodeURI(pageTeam.tag)}?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/team/${encodeURI(pageTeam.tag)}${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
            </div>
            <div class="section">Season Records</div>
            <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
            <div id="gamelog">View the <a href="/team/${encodeURIComponent(pageTeam.tag)}/gamelog${isNaN(season) ? `${postseason ? "?postseason=yes" : ""}` : `?season=${season}${postseason ? "&postseason=yes" : ""}`}">Game Log</a></div>
            ${teamData.records && (teamData.records.wins > 0 || teamData.records.losses > 0 || teamData.records.ties > 0) ? /* html */`
                <div id="records">
                    <div class="overall">Overall: <span class="numeric">${teamData.records.wins}-${teamData.records.losses}${teamData.records.ties ? `-${teamData.records.ties}` : ""}</span></div>
                    <div class="overall">
                        ${postseason ? "" : /* html */`
                            Rating: <span class="numeric ${teamData.records.wins + teamData.records.losses + teamData.records.ties < 10 ? "provisional" : ""}">${Math.round(teamData.records.rating)}</span>
                        `}
                    </div>
                    <div class="section">Team Anarchy</div>
                    <div class="section">Capture the Flag</div>
                    <div class="splits">
                        Home Record: <span class="numeric">${teamData.records.winsHomeTA}-${teamData.records.lossesHomeTA}${teamData.records.tiesHomeTA ? `-${teamData.records.tiesHomeTA}` : ""}</span><br />
                        Away Record: <span class="numeric">${teamData.records.winsAwayTA}-${teamData.records.lossesAwayTA}${teamData.records.tiesAwayTA ? `-${teamData.records.tiesAwayTA}` : ""}</span><br />
                        Neutral Record: <span class="numeric">${teamData.records.winsNeutralTA}-${teamData.records.lossesNeutralTA}${teamData.records.tiesNeutralTA ? `-${teamData.records.tiesNeutralTA}` : ""}</span>
                    </div>
                    <div class="splits">
                        Home Record: <span class="numeric">${teamData.records.winsHomeCTF}-${teamData.records.lossesHomeCTF}${teamData.records.tiesHomeCTF ? `-${teamData.records.tiesHomeCTF}` : ""}</span><br />
                        Away Record: <span class="numeric">${teamData.records.winsAwayCTF}-${teamData.records.lossesAwayCTF}${teamData.records.tiesAwayCTF ? `-${teamData.records.tiesAwayCTF}` : ""}</span><br />
                        Neutral Record: <span class="numeric">${teamData.records.winsNeutralCTF}-${teamData.records.lossesNeutralCTF}${teamData.records.tiesNeutralCTF ? `-${teamData.records.tiesNeutralCTF}` : ""}</span>
                    </div>
                    <div class="splits">
                        2v2 Record: <span class="numeric">${teamData.records.wins2v2TA}-${teamData.records.losses2v2TA}${teamData.records.ties2v2TA ? `-${teamData.records.ties2v2TA}` : ""}</span><br />
                        3v3 Record: <span class="numeric">${teamData.records.wins3v3TA}-${teamData.records.losses3v3TA}${teamData.records.ties3v3TA ? `-${teamData.records.ties3v3TA}` : ""}</span><br />
                        4v4+ Record: <span class="numeric">${teamData.records.wins4v4TA}-${teamData.records.losses4v4TA}${teamData.records.ties4v4TA ? `-${teamData.records.ties4v4TA}` : ""}</span>
                    </div>
                    <div class="splits">
                        2v2 Record: <span class="numeric">${teamData.records.wins2v2CTF}-${teamData.records.losses2v2CTF}${teamData.records.ties2v2CTF ? `-${teamData.records.ties2v2CTF}` : ""}</span><br />
                        3v3 Record: <span class="numeric">${teamData.records.wins3v3CTF}-${teamData.records.losses3v3CTF}${teamData.records.ties3v3CTF ? `-${teamData.records.ties3v3CTF}` : ""}</span><br />
                        4v4+ Record: <span class="numeric">${teamData.records.wins4v4CTF}-${teamData.records.losses4v4CTF}${teamData.records.ties4v4CTF ? `-${teamData.records.ties4v4CTF}` : ""}</span>
                    </div>
                    <div class="opponents">
                        ${teamData.opponents.filter((o) => o.gameType === "TA").length === 0 ? "" : /* html */`
                            <div class="header">Tag</div>
                            <div class="header">Opponent</div>
                            <div class="header">Record</div>
                            ${teamData.opponents.filter((o) => o.gameType === "TA").map((opponent) => /* html */`
                                <div class="tag"><div class="diamond${(team = teams.getTeam(opponent.teamId, opponent.name, opponent.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                <div><a href="/team/${team.tag}">${team.name}</a></div>
                                <div class="numeric">${opponent.wins}-${opponent.losses}${opponent.ties ? `-${opponent.ties}` : ""}</div>
                            `).join("")}
                        `}
                    </div>
                    <div class="opponents">
                        ${teamData.opponents.filter((o) => o.gameType === "CTF").length === 0 ? "" : /* html */`
                            <div class="header">Tag</div>
                            <div class="header">Opponent</div>
                            <div class="header">Record</div>
                            ${teamData.opponents.filter((o) => o.gameType === "CTF").map((opponent) => /* html */`
                                <div class="tag"><div class="diamond${(team = teams.getTeam(opponent.teamId, opponent.name, opponent.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                <div><a href="/team/${team.tag}">${team.name}</a></div>
                                <div class="numeric">${opponent.wins}-${opponent.losses}${opponent.ties ? `-${opponent.ties}` : ""}</div>
                            `).join("")}
                        `}
                    </div>
                    <div class="maps">
                        ${teamData.maps.filter((o) => o.gameType === "TA").length === 0 ? "" : /* html */`
                            <div class="header">Map</div>
                            <div class="header">Record</div>
                            ${teamData.maps.filter((o) => o.gameType === "TA").map((map) => /* html */`
                                <div class="map">${map.map}</div>
                                <div class="numeric">${map.wins}-${map.losses}${map.ties ? `-${map.ties}` : ""}</div>
                            `).join("")}
                        `}
                    </div>
                    <div class="maps">
                        ${teamData.maps.filter((o) => o.gameType === "CTF").length === 0 ? "" : /* html */`
                            <div class="header">Map</div>
                            <div class="header">Record</div>
                            ${teamData.maps.filter((o) => o.gameType === "CTF").map((map) => /* html */`
                                <div class="map">${map.map}</div>
                                <div class="numeric">${map.wins}-${map.losses}${map.ties ? `-${map.ties}` : ""}</div>
                            `).join("")}
                        `}
                    </div>
                </div>
                ${teamData.statsTA.length === 0 && teamData.statsCTF.length === 0 ? "" : /* html */ `
                    <div class="section">Season Player Stats</div>
                    <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                    ${teamData.statsTA.length === 0 ? "" : /* html */ `
                        <div class="section">Team Anarchy</div>
                        <div class="stats stats-ta">
                            <div class="header">Player</div>
                            <div class="header">G</div>
                            <div class="header">KDA</div>
                            <div class="header totals">K</div>
                            <div class="header totals">A</div>
                            <div class="header totals">D</div>
                            <div class="header totals">Dmg</div>
                            <div class="header">KPG</div>
                            <div class="header">APG</div>
                            <div class="header">DPG</div>
                            <div class="header">DmgPG</div>
                            <div class="header">DmgPD</div>
                            <div class="header best">Best Performance Vs.</div>
                            ${teamData.statsTA.map((s) => /* html */`
                                <div><a href="/player/${s.playerId}/${encodeURIComponent(TeamView.Common.normalizeName(s.name, team.tag))}">${TeamView.Common.htmlEncode(TeamView.Common.normalizeName(s.name, team.tag))}</a></div>
                                <div class="numeric">${s.games}</div>
                                <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                                <div class="numeric totals">${s.kills}</div>
                                <div class="numeric totals">${s.assists}</div>
                                <div class="numeric totals">${s.deaths}</div>
                                <div class="numeric totals">${s.damage ? s.damage.toFixed(0) : ""}</div>
                                <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${s.damage ? (s.damage / (s.games + 0.15 * s.overtimePeriods)).toFixed(2) : ""}</div>
                                <div class="numeric">${s.damage ? (s.damage / s.deaths).toFixed(2) : ""}</div>
                                <div class="tag best"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.teamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                <div class="best">${s.map}</div>
                                <div class="best"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.matchTime}")));</script></a></div>
                                <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg (<span class="numeric">${(s.bestDamage / s.bestDeaths).toFixed(2)}</span> DmgPD)` : ""}</div>
                            `).join("")}
                        </div>
                    `}
                    ${teamData.statsCTF.length === 0 ? "" : /* html */ `
                        <div class="section">Capture the Flag</div>
                        <div class="stats stats-ctf">
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
                            ${teamData.statsCTF.map((s) => /* html */`
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
                                <div class="best"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.matchTime}")));</script></a></div>
                                <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg (<span class="numeric">${(s.bestDamage / s.bestDeaths).toFixed(2)}</span> DmgPD)` : ""}</div>
                            `).join("")}
                        </div>
                    `}
                `}
            ` : ""}
        `;
    }
}

/**
 * @type {typeof import("../../web/includes/common")}
 */
// @ts-ignore
TeamView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = TeamView; // eslint-disable-line no-undef
}
