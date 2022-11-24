/**
 * @typedef {import("../../types/viewTypes").TeamTAMapViewParameters} ViewTypes.TeamTAMapViewParameters
 */

//  #####                       #####    #    #   #                #   #    #
//    #                           #     # #   #   #                #   #
//    #     ###    ###   ## #     #    #   #  ## ##   ###   # ##   #   #   ##     ###   #   #
//    #    #   #      #  # # #    #    #   #  # # #      #  ##  #   # #     #    #   #  #   #
//    #    #####   ####  # # #    #    #####  #   #   ####  ##  #   # #     #    #####  # # #
//    #    #      #   #  # # #    #    #   #  #   #  #   #  # ##    # #     #    #      # # #
//    #     ###    ####  #   #    #    #   #  #   #   ####  #        #     ###    ###    # #
//                                                          #
//                                                          #
/**
 * A class that represents the team view.
 */
class TeamTAMapView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the team template.
     * @param {ViewTypes.TeamTAMapViewParameters} data The team data.
     * @returns {string} An HTML string of the team.
     */
    static get(data) {
        const {pageTeam, map, seasonList, teamData, season, postseason, teams} = data;
        let team;

        return /* html */`
            <div id="team">
                <div id="teamname">
                    <div class="tag"><div class="diamond${pageTeam.role && pageTeam.role.color ? "" : "-empty"}" ${pageTeam.role && pageTeam.role.color ? `style="background-color: ${pageTeam.role.hexColor};"` : ""}></div> <a href="/team/${pageTeam.tag}">${pageTeam.tag}</a></div>
                    <div class="name"><a href="/team/${pageTeam.tag}">${pageTeam.name}</a></div>
                    <div class="map">Game Performance in ${map} for Team Anarchy</div>
                </div>
            </div>
            <div class="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/team/${encodeURI(pageTeam.tag)}/map/ta-${map}?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/team/${encodeURI(pageTeam.tag)}/map/ta-${map}?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/team/${encodeURI(pageTeam.tag)}/map/ta-${map}?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/team/${encodeURI(pageTeam.tag)}/map/ta-${map}${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
            </div>
            ${teamData.records && (teamData.records.wins > 0 || teamData.records.losses > 0 || teamData.records.ties > 0) ? /* html */`
                <div class="section">Records</div>
                <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                <div id="records" style="grid-template-columns: auto;">
                    <div class="overall">Overall: <span class="numeric">${teamData.records.wins}-${teamData.records.losses}${teamData.records.ties ? `-${teamData.records.ties}` : ""}</span></div>
                    <div class="splits">
                        Home Record: <span class="numeric">${teamData.records.winsHome}-${teamData.records.lossesHome}${teamData.records.tiesHome ? `-${teamData.records.tiesHome}` : ""}</span><br />
                        Away Record: <span class="numeric">${teamData.records.winsAway}-${teamData.records.lossesAway}${teamData.records.tiesAway ? `-${teamData.records.tiesAway}` : ""}</span><br />
                        Neutral Record: <span class="numeric">${teamData.records.winsNeutral}-${teamData.records.lossesNeutral}${teamData.records.tiesNeutral ? `-${teamData.records.tiesNeutral}` : ""}</span>
                    </div>
                    <div class="splits">
                        2v2 Record: <span class="numeric">${teamData.records.wins2v2}-${teamData.records.losses2v2}${teamData.records.ties2v2 ? `-${teamData.records.ties2v2}` : ""}</span><br />
                        3v3 Record: <span class="numeric">${teamData.records.wins3v3}-${teamData.records.losses3v3}${teamData.records.ties3v3 ? `-${teamData.records.ties3v3}` : ""}</span><br />
                        4v4+ Record: <span class="numeric">${teamData.records.wins4v4}-${teamData.records.losses4v4}${teamData.records.ties4v4 ? `-${teamData.records.ties4v4}` : ""}</span>
                    </div>
                    <div class="opponents">
                        ${teamData.opponents.length === 0 ? "" : /* html */`
                            <div class="header">Tag</div>
                            <div class="header opponent">Opponent</div>
                            <div class="header">Record</div>
                            ${teamData.opponents.map((opponent) => /* html */`
                                <div class="tag"><div class="diamond${(team = teams.getTeam(opponent.teamId, opponent.name, opponent.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                <div class="opponent"><a href="/team/${team.tag}">${team.name}</a></div>
                                <div class="numeric">${opponent.wins}-${opponent.losses}</div>
                            `).join("")}
                        `}
                    </div>
                </div>
                ${teamData.stats.length === 0 ? "" : /* html */ `
                    <div class="section">Player Stats</div>
                    <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "all time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season vs. upper league teams"}</div>
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
                        ${teamData.stats.map((s) => /* html */`
                            <div class="player"><a href="/player/${s.playerId}/${encodeURIComponent(TeamTAMapView.Common.normalizeName(s.name, team.tag))}">${TeamTAMapView.Common.htmlEncode(TeamTAMapView.Common.normalizeName(s.name, team.tag))}</a></div>
                            <div class="numeric">${s.games}</div>
                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            <div class="numeric totals">${s.kills}</div>
                            <div class="numeric totals">${s.assists}</div>
                            <div class="numeric totals">${s.deaths}</div>
                            <div class="numeric totals">${s.damage ? s.damage.toFixed(0) : ""}</div>
                            <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${s.damage ? (s.damage / (s.gamesWithDamage + 0.15 * s.overtimePeriods)).toFixed(2) : ""}</div>
                            <div class="numeric">${s.damage ? (s.damage / Math.max(s.deathsInGamesWithDamage, 1)).toFixed(2) : ""}</div>
                            <div class="tag best"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.teamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="best map"></div>
                            <div class="best"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.matchTime}")));</script></a></div>
                            <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg (<span class="numeric">${(s.bestDamage / Math.max(s.bestDeaths, 1)).toFixed(2)}</span> DmgPD)` : ""}</div>
                        `).join("")}
                    </div>
                `}
                ${teamData.gameLog.length === 0 ? "" : /* html */ `
                    <div class="games">
                        <div class="section">Game Log</div>
                        <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                        <div id="matches">
                            <div class="header team">Team</div>
                            <div class="header team">Opponent</div>
                            <div class="header result">Result</div>
                            <div class="header date">Date</div>
                            <div class="header map"></div>
                            <div class="header">Stats</div>
                            ${teamData.gameLog.map((m) => /* html */`
                                <div class="tag"><div class="diamond${(team = m.challengingTeamTag === pageTeam.tag ? teams.getTeam(m.challengedTeamId, m.challengedTeamName, m.challengedTeamTag) : teams.getTeam(m.challengingTeamId, m.challengingTeamName, m.challengingTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                <div>${m.challengingTeamTag === pageTeam.tag ? m.challengingTeamScore > m.challengedTeamScore ? "W" : m.challengingTeamScore < m.challengedTeamScore ? "L" : "T" : m.challengedTeamScore > m.challengingTeamScore ? "W" : m.challengedTeamScore < m.challengingTeamScore ? "L" : "T"} <span class="numeric">${m.challengingTeamTag === pageTeam.tag ? m.challengingTeamScore : m.challengedTeamScore}-${m.challengingTeamTag === pageTeam.tag ? m.challengedTeamScore : m.challengingTeamScore}</span></div>
                                <div>${!season || season >= 7 ? "" : /* html */`${typeof m.ratingChange === "number" ? /* html */`
                                    ${Math.round(m.ratingChange) > 0 ? /* html */`
                                        <span class="plus">+</span>` : ""}<span class="numeric">${Math.round(m.ratingChange)}</span>
                                ` : ""}`}</div>
                                <div></div>
                                <div class="date"><a href="/match/${m.challengeId}/${m.challengingTeamTag}/${m.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${m.matchTime}")));</script></a></div>
                                <div class="tag player">${m.playerId ? /* html */`
                                    <div class="diamond${(team = teams.getTeam(m.statTeamId, m.statTeamName, m.statTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                ` : ""}</div>
                                <div class="player">${m.playerId ? /* html */`
                                    <a href="/player/${m.playerId}/${encodeURIComponent(TeamTAMapView.Common.normalizeName(m.name, team.tag))}">${TeamTAMapView.Common.htmlEncode(TeamTAMapView.Common.normalizeName(m.name, team.tag))}</a>
                                ` : ""}</div>
                                <div class="best-stats">${m.playerId ? /* html */`
                                    <span class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${m.kills}</span> K, <span class="numeric">${m.assists}</span> A, <span class="numeric">${m.deaths}</span> D)${m.damage > 0 ? /* html */`, <span class="numeric">${m.damage.toFixed(0)}</span> Dmg (<span class="numeric">${(m.damage / Math.max(m.deaths, 1)).toFixed(2)}</span> DmgPD)` : ""}
                                ` : ""}</div>
                            `).join("")}
                        </div>
                    </div>
                `}
            ` : /* html */`
                <div class="section">No games found.</div>
            `}
        `;
    }
}

/** @type {typeof import("../../web/includes/common")} */
// @ts-ignore
TeamTAMapView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = TeamTAMapView; // eslint-disable-line no-undef
}
