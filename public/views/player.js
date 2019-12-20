/**
 * @typedef {import("../../web/includes/teams")} Teams
 */

//  ####    ##                                #   #    #
//  #   #    #                                #   #
//  #   #    #     ###   #   #   ###   # ##   #   #   ##     ###   #   #
//  ####     #        #  #   #  #   #  ##  #   # #     #    #   #  #   #
//  #        #     ####  #  ##  #####  #       # #     #    #####  # # #
//  #        #    #   #   ## #  #      #       # #     #    #      # # #
//  #       ###    ####      #   ###   #        #     ###    ###    # #
//                       #   #
//                        ###
/**
 * A class that represents the player view.
 */
class PlayerView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the player template.
     * @param {{playerId: number, player: {name: string, twitchName: string, timezone: string, teamId: number, tag: string, teamName: string}, career: {season: number, postseason: boolean, teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number}[], totals: {games: number, kills: number, assists: number, deaths: number, overtimePeriods: number}, careerTeams: {teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number}[], seasonList: number[], season: number, postseason: boolean, opponents: {teamId: number, tag: string, teamName: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestMatchTime: Date, bestMap: string, bestKills: number, bestAssists: number, bestDeaths: number}[], maps: {map: string, games: number, kills: number, assists: number, deaths: number, overtimePeriods: number, challengeId: number, challengingTeamTag: string, challengedTeamTag: string, bestOpponentTeamId: number, bestOpponentTag: string, bestOpponentTeamName: string, bestMatchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number}[], matches: {challengeId: number, challengingTeamTag: string, challengedTeamTag: string, teamId: number, tag: string, name: string, kills: number, assists: number, deaths: number, overtimePeriods: number, opponentTeamId: number, opponentTag: string, opponentName: string, teamScore: number, opponentScore: number, ratingChange: number, teamSize: number, matchTime: Date, map: string, gameType: string}[], teams: Teams}} data The player data.
     * @returns {string} An HTML string of the player.
     */
    static get(data) {
        const {playerId, player, career, totals, careerTeams, seasonList, season, postseason, opponents, maps, matches, teams} = data;
        let team;

        return /* html */`
            <div id="player">
                <div id="name">${PlayerView.Common.htmlEncode(PlayerView.Common.normalizeName(player.name, player.tag))}</div>
                ${player.twitchName ? /* html */`
                    <div id="twitch"><div id="glitch"></div> <a href="https://twitch.tv/${encodeURIComponent(player.twitchName)}">https://twitch.tv/${PlayerView.Common.htmlEncode(player.twitchName)}</a></div>
                ` : ""}
                ${player.teamId ? /* html */`
                    <div id="team">
                        <div class="section">Current Team</div>
                        <div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(player.teamId, player.teamName, player.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="name"><a href="/team/${team.tag}">${team.name}</a></div>
                        </div>
                    </div>
                ` : ""}
                ${player.timezone ? /* html */`
                    <div id="timezone">
                        <div class="section">Time Zone</div>
                        <div>${player.timezone}</div>
                    </div>
                ` : ""}
            </div>
            ${career.length === 0 ? "" : /* html */`
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
                    ${career.map((s) => /* html */`
                        <div class="season">${s.season} ${s.postseason ? "Postseason" : ""}</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="numeric">${s.games}</div>
                        <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                        <div class="numeric totals">${s.kills}</div>
                        <div class="numeric totals">${s.assists}</div>
                        <div class="numeric totals">${s.deaths}</div>
                        <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                    `).join("")}
                    <div class="lifetime">Lifetime</div>
                    <div class="numeric">${totals.games}</div>
                    <div class="numeric">${((totals.kills + totals.assists) / Math.max(1, totals.deaths)).toFixed(3)}</div>
                    <div class="numeric totals">${totals.kills}</div>
                    <div class="numeric totals">${totals.assists}</div>
                    <div class="numeric totals">${totals.deaths}</div>
                    <div class="numeric">${(totals.kills / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                    <div class="numeric">${(totals.assists / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                    <div class="numeric">${(totals.deaths / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
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
                    ${careerTeams.map((s) => /* html */`
                        <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="numeric">${s.games}</div>
                        <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                        <div class="numeric totals">${s.kills}</div>
                        <div class="numeric totals">${s.assists}</div>
                        <div class="numeric totals">${s.deaths}</div>
                        <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                    `).join("")}
                </div>
                <div id="options">
                    <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                        ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/player/${playerId}/${encodeURIComponent(PlayerView.Common.normalizeName(player.name, player.tag))}?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                    `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/player/${playerId}/${encodeURIComponent(PlayerView.Common.normalizeName(player.name, player.tag))}?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}<br />
                    <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/player/${playerId}/${encodeURIComponent(PlayerView.Common.normalizeName(player.name, player.tag))}?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/player/${playerId}/${encodeURIComponent(PlayerView.Common.normalizeName(player.name, player.tag))}${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
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
                        <div class="header best">Best Game On</div>
                        ${opponents.map((s) => /* html */`
                            <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="numeric">${s.games}</div>
                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="best-stats">${s.bestMap}</div>
                            <div class="match-time"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.bestMatchTime}")));</script></a></div>
                            <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)</div>
                        `).join("")}
                    </div>
                    <div id="maps">
                        <div class="header">On Map</div>
                        <div class="header">G</div>
                        <div class="header">KDA</div>
                        <div class="header">KPG</div>
                        <div class="header">APG</div>
                        <div class="header">DPG</div>
                        <div class="header best">Best Game Vs.</div>
                        ${maps.map((s) => /* html */`
                            <div>${s.map}</div>
                            <div class="numeric">${s.games}</div>
                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="tag best-stats"><div class="diamond${(team = teams.getTeam(s.bestOpponentTeamId, s.bestOpponentTeamName, s.bestOpponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="match-time"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.bestMatchTime}")));</script></a></div>
                            <div class="best-stats"><span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)</div>
                        `).join("")}
                    </div>
                </div>
                <div class="section">Season Matches</div>
                <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                <div id="matches">
                    <div class="header team">Team</div>
                    <div class="header team">Opponent</div>
                    <div class="header result">Result</div>
                    <div class="header date">Date</div>
                    <div class="header map">Map</div>
                    <div class="header">KDA</div>
                    <div class="header">K</div>
                    <div class="header">A</div>
                    <div class="header">D</div>
                    ${matches.map((m) => /* html */`
                        <div class="tag"><div class="diamond${(team = teams.getTeam(m.teamId, m.name, m.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(m.opponentTeamId, m.opponentName, m.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${m.teamScore > m.opponentScore ? "W" : m.teamScore < m.opponentScore ? "L" : "T"} <span class="numeric">${m.teamScore}</span>-<span class="numeric">${m.opponentScore}</span></div>
                        <div>${typeof m.ratingChange === "number" ? /* html */`
                            ${Math.round(m.ratingChange) > 0 ? /* html */`
                                <span class="plus">+</span>` : ""}<span class="numeric">${Math.round(m.ratingChange)}</span>
                        ` : ""}</div>
                        <div class="date"><a href="/match/${m.challengeId}/${m.challengingTeamTag}/${m.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${m.matchTime}")));</script></a></div>
                        <div class="map">${m.gameType} ${m.map}</div>
                        <div class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</div>
                        <div class="numeric">${m.kills}</div>
                        <div class="numeric">${m.assists}</div>
                        <div class="numeric">${m.deaths}</div>
                    `).join("")}
                </div>
            `}
        `;
    }
}

/**
 * @type {typeof import("../../web/includes/common")}
 */
// @ts-ignore
PlayerView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = PlayerView; // eslint-disable-line no-undef
}
