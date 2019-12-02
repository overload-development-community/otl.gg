/**
 * @typedef {import("../../web/includes/teams")} Teams
 */

//  ####    ##                                       #   #    #
//  #   #    #                                       #   #
//  #   #    #     ###   #   #   ###   # ##    ###   #   #   ##     ###   #   #
//  ####     #        #  #   #  #   #  ##  #  #       # #     #    #   #  #   #
//  #        #     ####  #  ##  #####  #       ###    # #     #    #####  # # #
//  #        #    #   #   ## #  #      #          #   # #     #    #      # # #
//  #       ###    ####      #   ###   #      ####     #     ###    ###    # #
//                       #   #
//                        ###
/**
 * A class that represents the players view.
 */
class PlayersView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the players template.
     * @param {{freeAgents: {playerId: number, name: string, discordId: string, timezone: string}[], seasonList: number[], stats: {playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, avgKills: number, avgAssists: number, avgDeaths: number, kda: number}[], averages: {kda: number, kills: number, assists: number, deaths: number}, season: number, postseason: boolean, all: boolean, teams: Teams}} data The players data.
     * @returns {string} An HTML string of the players.
     */
    static get(data) {
        const {freeAgents, seasonList, stats, averages, season, postseason, all, teams} = data;
        let team;

        return /* html */`
            ${freeAgents && freeAgents.length > 0 ? /* html */ `
                <div id="free-agents">
                    <div class="section">Free Agents</div>
                    <div class="text">The following pilots are available free agents for you to recruit to your team.</div>
                    <div class="players">
                        ${freeAgents.map((f) => /* html */`
                            <div><a href="/player/${f.playerId}/${encodeURIComponent(f.name)}">${PlayersView.Common.htmlEncode(f.name)}</a></div>
                            <div>${f.timezone}</div>
                        `).join("")}
                    </div>
                </div>
            ` : ""}
            <div id="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/players?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}${all ? "&all=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/players?season=0${postseason ? "&postseason=yes" : ""}${all ? "&all=yes" : ""}">All Time</a>`}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/players?postseason=yes${isNaN(season) ? "" : `&season=${season}`}${all ? "&all=yes" : ""}">Yes</a>`} | ${postseason ? /* html */`<a href="/players${isNaN(season) ? `${all ? "?all=yes" : ""}` : `?season=${season}${all ? "&all=yes" : ""}`}">No</a>` : "No"}<br />
                <span class="grey">Players:</span> ${all ? /* html */`<a href="/players${isNaN(season) ? `${postseason ? "?postseason=yes" : ""}` : `?season=${season}${postseason ? "&postseason=yes" : ""}`}">Active</a>` : "Active"} | ${all ? "All" : `<a href="/players?all=yes${isNaN(season) ? "" : `&season=${season}`}${postseason ? "&postseason=yes" : ""}">All</a>`}
            </div>
            <div class="section">Player Stats</div>
            <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
            ${stats.length === 0 ? "<div id=\"no-results\">No stats avialable.</div>" : /* html */`
                <div id="stats">
                    <div id="kda">
                        <div class="section">Best KDA Ratio</div>
                        <div class="stats">
                            <div class="average">League Average: <span class="numeric">${averages.kda.toFixed(3)}</span></div>
                            <div class="header">Pos</div>
                            <div class="header">Team</div>
                            <div class="header">Name</div>
                            <div class="header">KDA</div>
                            ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.kda - a.kda).map((s, index, sortedStats) => /* html */`
                                <div class="numeric pos">${index + 1}</div>

                                <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                    <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                `}</div>
                                <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                <div class="numeric value">${s.kda.toFixed(3)}</div>
                                ${sortedStats[index + 1] && sortedStats[index + 1].kda < averages.kda && sortedStats[index].kda >= averages.kda ? /* html */`
                                    <div class="separator"></div>
                                ` : ""}
                            `).join("")}
                        </div>
                    </div>
                    <div id="kills">
                        <div class="section">Most Kills per Game</div>
                        <div class="stats">
                            <div class="average">League Average: <span class="numeric">${averages.kills.toFixed(2)}</span></div>
                            <div class="header">Pos</div>
                            <div class="header">Team</div>
                            <div class="header">Name</div>
                            <div class="header">KPG</div>
                            ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgKills - a.avgKills).map((s, index, sortedStats) => /* html */`
                                <div class="numeric pos">${index + 1}</div>
                                <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                    <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                `}</div>
                                <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                <div class="numeric value">${s.avgKills.toFixed(2)}</div>
                                ${sortedStats[index + 1] && sortedStats[index + 1].avgKills < averages.kills && sortedStats[index].avgKills >= averages.kills ? /* html */`
                                    <div class="separator"></div>
                                ` : ""}
                            `).join("")}
                        </div>
                    </div>
                    <div id="assists">
                        <div class="section">Most Assists per Game</div>
                        <div class="stats">
                            <div class="average">League Average: <span class="numeric">${averages.assists.toFixed(2)}</span></div>
                            <div class="header">Pos</div>
                            <div class="header">Team</div>
                            <div class="header">Name</div>
                            <div class="header">APG</div>
                            ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgAssists - a.avgAssists).map((s, index, sortedStats) => /* html */`
                                <div class="numeric pos">${index + 1}</div>
                                <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                    <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                `}</div>
                                <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                <div class="numeric value">${s.avgAssists.toFixed(2)}</div>
                                ${sortedStats[index + 1] && sortedStats[index + 1].avgAssists < averages.assists && sortedStats[index].avgAssists >= averages.assists ? /* html */`
                                    <div class="separator"></div>
                                ` : ""}
                            `).join("")}
                        </div>
                    </div>
                    <div id="deaths">
                        <div class="section">Least Deaths per Game</div>
                        <div class="stats">
                            <div class="average">League Average: <span class="numeric">${averages.deaths.toFixed(2)}</span></div>
                            <div class="header">Pos</div>
                            <div class="header">Team</div>
                            <div class="header">Name</div>
                            <div class="header">DPG</div>
                            ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : a.avgDeaths - b.avgDeaths).map((s, index, sortedStats) => /* html */`
                                <div class="numeric pos">${index + 1}</div>
                                <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                    <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                `}</div>
                                <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                <div class="numeric value">${s.avgDeaths.toFixed(2)}</div>
                                ${sortedStats[index + 1] && sortedStats[index + 1].avgDeaths > averages.deaths && sortedStats[index].avgDeaths <= averages.deaths ? /* html */`
                                    <div class="separator"></div>
                                ` : ""}
                            `).join("")}
                        </div>
                    </div>
                </div>
            `}
        `;
    }
}

// @ts-ignore
PlayersView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = PlayersView; // eslint-disable-line no-undef
}
