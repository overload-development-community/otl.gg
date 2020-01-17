/**
 * @typedef {import("../../types/viewTypes").PlayersViewParameters} ViewTypes.PlayersViewParameters
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
     * @param {ViewTypes.PlayersViewParameters} data The players data.
     * @returns {string} An HTML string of the players.
     */
    static get(data) {
        const {freeAgents, seasonList, stats, averages, season, postseason, gameType, gameTypeName, all, teams} = data;
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
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/players?gameType=${gameType}&season=${seasonNumber}${postseason ? "&postseason=yes" : ""}${all ? "&all=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/players?gameType=${gameType}&season=0${postseason ? "&postseason=yes" : ""}${all ? "&all=yes" : ""}">All Time</a>`}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/players?gameType=${gameType}&postseason=yes${isNaN(season) ? "" : `&season=${season}`}${all ? "&all=yes" : ""}">Yes</a>`} | ${postseason ? /* html */`<a href="/players?gameType=${gameType}${isNaN(season) ? "" : `&season=${season}`}${all ? "&all=yes" : ""}">No</a>` : "No"}<br />
                <span class="grey">Game Type:</span> ${gameType === "TA" ? "Team Anarchy" : /* html */`<a href="/players?gameType=TA${isNaN(season) ? "" : `&season=${season}${postseason ? "&postseason=yes" : ""}${all ? "&all=yes" : ""}`}">Team Anarchy</a>`} | ${gameType === "CTF" ? "Capture the Flag" : /* html */`<a href="/players?gameType=CTF${isNaN(season) ? "" : `&season=${season}${postseason ? "&postseason=yes" : ""}${all ? "&all=yes" : ""}`}">Capture the Flag</a>`}
                ${postseason ? "" : /* html */`
                    <br /><span class="grey">Players:</span> ${all ? /* html */`<a href="/players?gameType=${gameType}${isNaN(season) ? "" : `&season=${season}`}${postseason ? "&postseason=yes" : ""}">Active</a>` : "Active"} | ${all ? "All" : `<a href="/players?gameType=${gameType}${isNaN(season) ? "" : `&season=${season}`}${postseason ? "&postseason=yes" : ""}&all=yes">All</a>`}
                `}
            </div>
            <div class="section">Player Stats</div>
            <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"} for ${gameTypeName}</div>
            ${gameType === "TA" ? /* html */`
                ${stats.length === 0 ? /* html */`
                    <div id="no-results">No Team Anarchy stats avialable.</div>
                ` : /* html */`
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
                        ${(season || Math.max(...seasonList)) >= 3 ? /* html */`
                            <div id="damage-per-game">
                                <div class="section">Most Damage Per Game</div>
                                <div class="stats">
                                    <div class="average">League Average: <span class="numeric">${averages.damagePerGame.toFixed(0)}</span></div>
                                    <div class="header">Pos</div>
                                    <div class="header">Team</div>
                                    <div class="header">Name</div>
                                    <div class="header">DmgPG</div>
                                    ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgDamagePerGame - a.avgDamagePerGame).map((s, index, sortedStats) => /* html */`
                                        <div class="numeric pos">${index + 1}</div>
                                        <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                            <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                        `}</div>
                                        <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                        <div class="numeric value">${s.avgDamagePerGame.toFixed(0)}</div>
                                        ${sortedStats[index + 1] && sortedStats[index + 1].avgDamagePerGame < averages.damagePerGame && sortedStats[index].avgDamagePerGame >= averages.damagePerGame ? /* html */`
                                            <div class="separator"></div>
                                        ` : ""}
                                    `).join("")}
                                </div>
                            </div>
                            <div id="damage-per-death">
                                <div class="section">Most Damage Per Death</div>
                                <div class="stats">
                                    <div class="average">League Average: <span class="numeric">${averages.damagePerDeath.toFixed(0)}</span></div>
                                    <div class="header">Pos</div>
                                    <div class="header">Team</div>
                                    <div class="header">Name</div>
                                    <div class="header">DmgPD</div>
                                    ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgDamagePerDeath - a.avgDamagePerDeath).map((s, index, sortedStats) => /* html */`
                                        <div class="numeric pos">${index + 1}</div>
                                        <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                            <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                        `}</div>
                                        <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                        <div class="numeric value">${s.avgDamagePerDeath.toFixed(0)}</div>
                                        ${sortedStats[index + 1] && sortedStats[index + 1].avgDamagePerDeath < averages.damagePerDeath && sortedStats[index].avgDamagePerDeath >= averages.damagePerDeath ? /* html */`
                                            <div class="separator"></div>
                                        ` : ""}
                                    `).join("")}
                                </div>
                            </div>
                        ` : ""}
                    </div>
                `}
            ` : ""}
            ${gameType === "CTF" ? /* html */`
                ${stats.length === 0 ? /* html */`
                    <div id="no-results">No Capture the Flag stats avialable.</div>
                ` : /* html */`
                    <div id="stats">
                        <div id="captures">
                            <div class="section">Most Captures Per Game</div>
                            <div class="stats">
                                <div class="average">League Average: <span class="numeric">${averages.captures.toFixed(2)}</span></div>
                                <div class="header">Pos</div>
                                <div class="header">Team</div>
                                <div class="header">Name</div>
                                <div class="header">CPG</div>
                                ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgCaptures - a.avgCaptures).map((s, index, sortedStats) => /* html */`
                                    <div class="numeric pos">${index + 1}</div>
                                    <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                        <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    `}</div>
                                    <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                    <div class="numeric value">${s.avgCaptures.toFixed(2)}</div>
                                    ${sortedStats[index + 1] && sortedStats[index + 1].avgCaptures < averages.captures && sortedStats[index].avgCaptures >= averages.captures ? /* html */`
                                        <div class="separator"></div>
                                    ` : ""}
                                `).join("")}
                            </div>
                        </div>
                        <div id="pickups">
                            <div class="section">Most Pickups Per Game</div>
                            <div class="stats">
                                <div class="average">League Average: <span class="numeric">${averages.pickups.toFixed(2)}</span></div>
                                <div class="header">Pos</div>
                                <div class="header">Team</div>
                                <div class="header">Name</div>
                                <div class="header">PPG</div>
                                ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgPickups - a.avgPickups).map((s, index, sortedStats) => /* html */`
                                    <div class="numeric pos">${index + 1}</div>
                                    <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                        <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    `}</div>
                                    <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                    <div class="numeric value">${s.avgPickups.toFixed(2)}</div>
                                    ${sortedStats[index + 1] && sortedStats[index + 1].avgPickups < averages.pickups && sortedStats[index].avgPickups >= averages.pickups ? /* html */`
                                        <div class="separator"></div>
                                    ` : ""}
                                `).join("")}
                            </div>
                        </div>
                        <div id="carrier-kills">
                            <div class="section">Most Carrier Kills Per Game</div>
                            <div class="stats">
                                <div class="average">League Average: <span class="numeric">${averages.carrierKills.toFixed(2)}</span></div>
                                <div class="header">Pos</div>
                                <div class="header">Team</div>
                                <div class="header">Name</div>
                                <div class="header">CKPG</div>
                                ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgCarrierKills - a.avgCarrierKills).map((s, index, sortedStats) => /* html */`
                                    <div class="numeric pos">${index + 1}</div>
                                    <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                        <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    `}</div>
                                    <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                    <div class="numeric value">${s.avgCarrierKills.toFixed(2)}</div>
                                    ${sortedStats[index + 1] && sortedStats[index + 1].avgCarrierKills < averages.carrierKills && sortedStats[index].avgCarrierKills >= averages.carrierKills ? /* html */`
                                        <div class="separator"></div>
                                    ` : ""}
                                `).join("")}
                            </div>
                        </div>
                        <div id="returns">
                            <div class="section">Most Returns Per Game</div>
                            <div class="stats">
                                <div class="average">League Average: <span class="numeric">${averages.returns.toFixed(2)}</span></div>
                                <div class="header">Pos</div>
                                <div class="header">Team</div>
                                <div class="header">Name</div>
                                <div class="header">RPG</div>
                                ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgReturns - a.avgReturns).map((s, index, sortedStats) => /* html */`
                                    <div class="numeric pos">${index + 1}</div>
                                    <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                        <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    `}</div>
                                    <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                    <div class="numeric value">${s.avgReturns.toFixed(2)}</div>
                                    ${sortedStats[index + 1] && sortedStats[index + 1].avgReturns < averages.returns && sortedStats[index].avgReturns >= averages.returns ? /* html */`
                                        <div class="separator"></div>
                                    ` : ""}
                                `).join("")}
                            </div>
                        </div>
                        <div id="damage-per-game">
                            <div class="section">Most Damage Per Game</div>
                            <div class="stats">
                                <div class="average">League Average: <span class="numeric">${averages.damagePerGame.toFixed(0)}</span></div>
                                <div class="header">Pos</div>
                                <div class="header">Team</div>
                                <div class="header">Name</div>
                                <div class="header">DmgPG</div>
                                ${stats.sort((a, b) => a === b ? a.name.localeCompare(b.name) : b.avgDamagePerGame - a.avgDamagePerGame).map((s, index, sortedStats) => /* html */`
                                    <div class="numeric pos">${index + 1}</div>
                                    <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === void 0 ? "" : /* html */`
                                        <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    `}</div>
                                    <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}">${PlayersView.Common.htmlEncode(PlayersView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                                    <div class="numeric value">${s.avgDamagePerGame.toFixed(0)}</div>
                                    ${sortedStats[index + 1] && sortedStats[index + 1].avgDamagePerGame < averages.damagePerGame && sortedStats[index].avgDamagePerGame >= averages.damagePerGame ? /* html */`
                                        <div class="separator"></div>
                                    ` : ""}
                                `).join("")}
                            </div>
                        </div>
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
                    </div>
                `}
            ` : ""}
        `;
    }
}

/** @type {typeof import("../../web/includes/common")} */
// @ts-ignore
PlayersView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = PlayersView; // eslint-disable-line no-undef
}
