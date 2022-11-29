/**
 * @typedef {import("../../types/viewTypes").OpponentViewParameters} ViewTypes.OpponentViewParameters
 */

//   ###                                              #     #   #    #
//  #   #                                             #     #   #
//  #   #  # ##   # ##    ###   # ##    ###   # ##   ####   #   #   ##     ###   #   #
//  #   #  ##  #  ##  #  #   #  ##  #  #   #  ##  #   #      # #     #    #   #  #   #
//  #   #  ##  #  ##  #  #   #  #   #  #####  #   #   #      # #     #    #####  # # #
//  #   #  # ##   # ##   #   #  #   #  #      #   #   #  #   # #     #    #      # # #
//   ###   #      #       ###   #   #   ###   #   #    ##     #     ###    ###    # #
//         #      #
//         #      #
/**
 * A class that represents the opponent view.
 */
class OpponentView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the team template.
     * @param {ViewTypes.OpponentViewParameters} data The team data.
     * @returns {string} An HTML string of the team.
     */
    static get(data) {
        const {team1, team2, seasonList, season, postseason, records, stats, matches, statistics} = data;
        let team;

        return /* html */`
            <div id="opponent">
                <div class="teams">
                    <div class="team">
                        <div class="tag"><div class="diamond${team1.role && team1.role.color ? "" : "-empty"}" ${team1.role && team1.role.color ? `style="background-color: ${team1.role.hexColor};"` : ""}></div> ${team1.tag}</div>
                        <div class="name">${team1.name}</div>
                    </div>
                    <div class="team">
                        <div class="tag"><div class="diamond${team2.role && team2.role.color ? "" : "-empty"}" ${team2.role && team2.role.color ? `style="background-color: ${team2.role.hexColor};"` : ""}></div> ${team2.tag}</div>
                        <div class="name">${team2.name}</div>
                    </div>
                </div>
                <div class="options">
                    <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                        ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/team/${encodeURI(team1.tag)}/opponent/${encodeURI(team2.tag)}?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                    `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/team/${encodeURI(team1.tag)}/opponent/${encodeURI(team2.tag)}?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}<br />
                    <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/team/${encodeURI(team1.tag)}/opponent/${encodeURI(team2.tag)}?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/team/${encodeURI(team1.tag)}/opponent/${encodeURI(team2.tag)}${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
                </div>
                <div class="records">
                    ${records.filter((r) => r.team1wins + r.team2wins + r.ties > 0).map((record) => /* html */`
                        ${record.section ? /* html */`
                            <div class="section">${record.section}</div>
                        ` : ""}
                        <div class="title">${record.title || (record.section === "Overall" ? "" : "Overall")}</div>
                        <div class="team1wins">${record.team1wins > record.team2wins ? `<div class="diamond${team1.role && team1.role.color ? "" : "-empty"}" ${team1.role && team1.role.color ? `style="background-color: ${team1.role.hexColor};"` : ""}></div>` : ""} <a href="/team/${team1.tag}">${team1.tag}</a> <span class="numeric">${record.team1wins}</span></div>
                        <div class="ties">${record.ties === 0 ? "" : /* html */`<span class="numeric">${record.ties}</span> Tie${record.ties === 1 ? "" : "s"}`}</div>
                        <div class="team2wins"><span class="numeric">${record.team2wins}</span> <a href="/team/${team2.tag}">${team2.tag}</a> ${record.team1wins < record.team2wins ? `<div class="diamond${team2.role && team2.role.color ? "" : "-empty"}" ${team2.role && team2.role.color ? `style="background-color: ${team2.role.hexColor};"` : ""}></div>` : ""}</div>
                        <div></div>
                    `).join("")}
                    ${matches.length === 0 ? "" : /* html */`
                        <div class="section">Odds</div>
                        <div class="title">Projected Score</div>
                        <div class="team1wins">${statistics.team1Score > statistics.team2Score ? `<div class="diamond${team1.role && team1.role.color ? "" : "-empty"}" ${team1.role && team1.role.color ? `style="background-color: ${team1.role.hexColor};"` : ""}></div>` : ""} <a href="/team/${team1.tag}">${team1.tag}</a> <span class="numeric">${statistics.team1Score.toFixed(1)}</span></div>
                        <div class="ties">+/- <span class="numeric">${statistics.marginOfError.toFixed(1)}</span></div>
                        <div class="team2wins"><span class="numeric">${statistics.team2Score.toFixed(1)}</span> <a href="/team/${team2.tag}">${team2.tag}</a> ${statistics.team1Score < statistics.team2Score ? `<div class="diamond${team2.role && team2.role.color ? "" : "-empty"}" ${team2.role && team2.role.color ? `style="background-color: ${team2.role.hexColor};"` : ""}></div>` : ""}</div>
                        <div></div>
                        <div class="title">Chance of Winning</div>
                        <div class="team1wins">${statistics.team1Score > statistics.team2Score ? `<div class="diamond${team1.role && team1.role.color ? "" : "-empty"}" ${team1.role && team1.role.color ? `style="background-color: ${team1.role.hexColor};"` : ""}></div>` : ""} <a href="/team/${team1.tag}">${team1.tag}</a> <span class="numeric">${(100 * statistics.chance).toFixed(2)}</span>%</div>
                        <div class="ties"></div>
                        <div class="team2wins"><span class="numeric">${(100 * (1 - statistics.chance)).toFixed(2)}</span>% <a href="/team/${team2.tag}">${team2.tag}</a> ${statistics.team1Score < statistics.team2Score ? `<div class="diamond${team2.role && team2.role.color ? "" : "-empty"}" ${team2.role && team2.role.color ? `style="background-color: ${team2.role.hexColor};"` : ""}></div>` : ""}</div>
                        <div></div>
                    `}
                </div>
                ${stats.team1.statsTA.length === 0 && stats.team1.statsCTF.length === 0 ? "" : /* html */ `
                    <div class="players">
                        <div class="section">Player Stats</div>
                        <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                        ${stats.team1.statsTA.length === 0 && stats.team2.statsTA.length === 0 ? "" : /* html */ `
                            <div class="ta">
                                <div class="section">Team Anarchy</div>
                                <div class="team1">
                                    <div class="title">${team1.name} Players</div>
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
                                        <div class="header best">Best Performance Vs. ${team2.tag}</div>
                                        ${stats.team1.statsTA.map((s) => /* html */`
                                            <div class="player"><a href="/player/${s.playerId}/${encodeURIComponent(OpponentView.Common.normalizeName(s.name, team1.tag))}">${OpponentView.Common.htmlEncode(OpponentView.Common.normalizeName(s.name, team1.tag))}</a></div>
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
                                            <div class="best map">${s.map}</div>
                                            <div class="best"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.matchTime}")));</script></a></div>
                                            <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg (<span class="numeric">${(s.bestDamage / Math.max(s.bestDeaths, 1)).toFixed(2)}</span> DmgPD)` : ""}</div>
                                        `).join("")}
                                    </div>
                                </div>
                                <div class="team2">
                                    <div class="title">${team2.name} Players</div>
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
                                        <div class="header best">Best Performance Vs. ${team1.tag}</div>
                                        ${stats.team2.statsTA.map((s) => /* html */`
                                            <div class="player"><a href="/player/${s.playerId}/${encodeURIComponent(OpponentView.Common.normalizeName(s.name, team2.tag))}">${OpponentView.Common.htmlEncode(OpponentView.Common.normalizeName(s.name, team2.tag))}</a></div>
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
                                            <div class="best map">${s.map}</div>
                                            <div class="best"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.matchTime}")));</script></a></div>
                                            <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg (<span class="numeric">${(s.bestDamage / Math.max(s.bestDeaths, 1)).toFixed(2)}</span> DmgPD)` : ""}</div>
                                        `).join("")}
                                    </div>
                                </div>
                            </div>
                        `}
                        ${stats.team1.statsCTF.length === 0 && stats.team2.statsCTF.length === 0 ? "" : /* html */ `
                            <div class="ctf">
                                <div class="section">Capture the Flag</div>
                                <div class="team1">
                                    <div class="title">${team1.name} Players</div>
                                    <div class="stats stats-ctf">
                                        <div class="header">Player</div>
                                        <div class="header">G</div>
                                        <div class="header totals">C</div>
                                        <div class="header totals">P</div>
                                        <div class="header totals">CK</div>
                                        <div class="header totals">R</div>
                                        <div class="header">KDA</div>
                                        <div class="header totals">K</div>
                                        <div class="header totals">A</div>
                                        <div class="header totals">D</div>
                                        <div class="header totals">Dmg</div>
                                        <div class="header">CPG</div>
                                        <div class="header">PPG</div>
                                        <div class="header">CKPG</div>
                                        <div class="header">RPG</div>
                                        <div class="header">KPG</div>
                                        <div class="header">APG</div>
                                        <div class="header">DPG</div>
                                        <div class="header best">Best Performance Vs. ${team2.tag}</div>
                                        ${stats.team1.statsCTF.map((s) => /* html */`
                                            <div class="player"><a href="/player/${s.playerId}/${encodeURIComponent(OpponentView.Common.normalizeName(s.name, team1.tag))}">${OpponentView.Common.htmlEncode(OpponentView.Common.normalizeName(s.name, team1.tag))}</a></div>
                                            <div class="numeric">${s.games}</div>
                                            <div class="numeric totals">${s.captures}</div>
                                            <div class="numeric totals">${s.pickups}</div>
                                            <div class="numeric totals">${s.carrierKills}</div>
                                            <div class="numeric totals">${s.returns}</div>
                                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                                            <div class="numeric totals">${s.kills}</div>
                                            <div class="numeric totals">${s.assists}</div>
                                            <div class="numeric totals">${s.deaths}</div>
                                            <div class="numeric totals">${s.damage ? s.damage.toFixed(0) : ""}</div>
                                            <div class="numeric">${(s.captures / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.pickups / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.carrierKills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.returns / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="best map">${s.map}</div>
                                            <div class="best"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.matchTime}")));</script></a></div>
                                            <div class="best-stats"><span class="numeric">${s.bestCaptures}</span> C/<span class="numeric">${s.bestPickups}</span> P, <span class="numeric">${s.bestCarrierKills}</span> CK, <span class="numeric">${s.bestReturns}</span> R, <span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg` : ""}</div>
                                        `).join("")}
                                    </div>
                                </div>
                                <div class="team2">
                                    <div class="title">${team2.name} Players</div>
                                    <div class="stats stats-ctf">
                                        <div class="header">Player</div>
                                        <div class="header">G</div>
                                        <div class="header totals">C</div>
                                        <div class="header totals">P</div>
                                        <div class="header totals">CK</div>
                                        <div class="header totals">R</div>
                                        <div class="header">KDA</div>
                                        <div class="header totals">K</div>
                                        <div class="header totals">A</div>
                                        <div class="header totals">D</div>
                                        <div class="header totals">Dmg</div>
                                        <div class="header">CPG</div>
                                        <div class="header">PPG</div>
                                        <div class="header">CKPG</div>
                                        <div class="header">RPG</div>
                                        <div class="header">KPG</div>
                                        <div class="header">APG</div>
                                        <div class="header">DPG</div>
                                        <div class="header best">Best Performance Vs. ${team1.tag}</div>
                                        ${stats.team2.statsCTF.map((s) => /* html */`
                                            <div class="player"><a href="/player/${s.playerId}/${encodeURIComponent(OpponentView.Common.normalizeName(s.name, team2.tag))}">${OpponentView.Common.htmlEncode(OpponentView.Common.normalizeName(s.name, team2.tag))}</a></div>
                                            <div class="numeric">${s.games}</div>
                                            <div class="numeric totals">${s.captures}</div>
                                            <div class="numeric totals">${s.pickups}</div>
                                            <div class="numeric totals">${s.carrierKills}</div>
                                            <div class="numeric totals">${s.returns}</div>
                                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                                            <div class="numeric totals">${s.kills}</div>
                                            <div class="numeric totals">${s.assists}</div>
                                            <div class="numeric totals">${s.deaths}</div>
                                            <div class="numeric totals">${s.damage ? s.damage.toFixed(0) : ""}</div>
                                            <div class="numeric">${(s.captures / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.pickups / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.carrierKills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.returns / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                            <div class="best map">${s.map}</div>
                                            <div class="best"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.matchTime}")));</script></a></div>
                                            <div class="best-stats"><span class="numeric">${s.bestCaptures}</span> C/<span class="numeric">${s.bestPickups}</span> P, <span class="numeric">${s.bestCarrierKills}</span> CK, <span class="numeric">${s.bestReturns}</span> R, <span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg` : ""}</div>
                                        `).join("")}
                                    </div>
                                </div>
                            </div>
                        `}
                    </div>
                `}
                ${matches.length === 0 ? "" : /* html */ `
                    <div class="games">
                        <div class="section">Game Log</div>
                        <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                        <div id="matches">
                            <div class="header team">Winner</div>
                            <div class="header result">Result</div>
                            <div class="header">Map</div>
                            <div class="header date">Date</div>
                            <div class="header player">Top Performer</div>
                            ${matches.map((m) => /* html */`
                                ${m.challengingTeamScore === m.challengedTeamScore ? /* html */`
                                    <div class="tag">Tie</div>
                                    <div class="team-name"></div>
                                ` : /* html */`
                                    <div class="tag"><div class="diamond${(team = (m.challengingTeamScore > m.challengedTeamScore ? m.challengingTeamId : m.challengedTeamId) === team1.id ? team1 : team2).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                `}
                                <div><span class="numeric">${m.challengingTeamScore > m.challengedTeamScore ? m.challengingTeamScore : m.challengedTeamScore}-${m.challengingTeamScore > m.challengedTeamScore ? m.challengedTeamScore : m.challengingTeamScore}</span></div>
                                <div>${!season || season >= 7 ? "" : /* html */`${typeof m.ratingChange === "number" ? /* html */`
                                    ${Math.round(m.ratingChange) > 0 ? /* html */`
                                        <span class="plus">+</span>` : ""}<span class="numeric">${Math.round(m.ratingChange)}</span>
                                ` : ""}`}</div>
                                <div>${m.gameType} ${m.map}</div>
                                <div class="date"><a href="/match/${m.challengeId}/${m.challengingTeamTag}/${m.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${m.matchTime}")));</script></a></div>
                                <div class="tag player">${m.playerId ? /* html */`
                                    <div class="diamond${(team = m.statTeamId === team1.id ? team1 : team2).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                ` : ""}</div>
                                <div class="player">${m.playerId ? /* html */`
                                    <a href="/player/${m.playerId}/${encodeURIComponent(OpponentView.Common.normalizeName(m.name, team.tag))}">${OpponentView.Common.htmlEncode(OpponentView.Common.normalizeName(m.name, team.tag))}</a>
                                ` : ""}</div>
                                <div class="best-stats">${m.playerId ? /* html */`
                                    ${m.gameType === "TA" ? /* html */`
                                        <span class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${m.kills}</span> K, <span class="numeric">${m.assists}</span> A, <span class="numeric">${m.deaths}</span> D)${m.damage > 0 ? /* html */`, <span class="numeric">${m.damage.toFixed(0)}</span> Dmg (<span class="numeric">${(m.damage / Math.max(m.deaths, 1)).toFixed(2)}</span> DmgPD)` : ""}
                                    ` : ""}
                                    ${m.gameType === "CTF" ? /* html */`
                                        <span class="numeric">${m.captures}</span> C/<span class="numeric">${m.pickups}</span> P, <span class="numeric">${m.carrierKills}</span> CK, <span class="numeric">${m.returns}</span> R, <span class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${m.kills}</span> K, <span class="numeric">${m.assists}</span> A, <span class="numeric">${m.deaths}</span> D)${m.damage > 0 ? /* html */` <span class="numeric">${m.damage.toFixed(0)}</span> Dmg` : ""}
                                    ` : ""}
                                ` : ""}</div>
                            `).join("")}
                        </div>
                    </div>
                `}
            </div>
        `;
    }
}

/** @type {typeof import("../../web/includes/common")} */
// @ts-ignore
OpponentView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = OpponentView; // eslint-disable-line no-undef
}
