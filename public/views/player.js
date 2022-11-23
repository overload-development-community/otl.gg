/**
 * @typedef {import("../../types/viewTypes").PlayerViewParameters} ViewTypes.PlayerViewParameters
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
     * @param {ViewTypes.PlayerViewParameters} data The player data.
     * @returns {string} An HTML string of the player.
     */
    static get(data) {
        const {playerId, awards, player, career, totals, careerTeams, seasonList, season, postseason, all, gameType, opponents, maps, damage, teams} = data;
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
            ${awards.length === 0 ? "" : /* html */`
                <div id="awards">
                    <div class="section">Trophy Case</div>
                    ${awards.map((award) => /* html */`
                        <div class="award"><img src="/images/${{"MSI": "overdrive", "1st": "invulnerability", "2nd": "superupgrade", "3rd": "upgrade"}[award.award]}.png" title="${award.description}" /></div>
                    `).join("")}
                </div>
            `}
            <div class="options">
                <span class="grey">Game Type:</span> ${gameType === "TA" ? "Team Anarchy" : /* html */`<a href="${PlayerView.getLink(playerId, player.name, player.tag, "TA", all, season, postseason)}">Team Anarchy</a>`} | ${gameType === "CTF" ? "Capture the Flag" : /* html */`<a href="${PlayerView.getLink(playerId, player.name, player.tag, "CTF", all, season, postseason)}">Capture the Flag</a>`}<br />
                <span class="grey">Regular Season Stats:</span> ${all ? /* html */`<a href="${PlayerView.getLink(playerId, player.name, player.tag, gameType, false, season, postseason)}">vs. Upper League</a>` : "vs. Upper League"} | ${all ? "vs. All" : /* html */`<a href="${PlayerView.getLink(playerId, player.name, player.tag, gameType, true, season, postseason)}">vs. All</a>`}<br />
            </div>
            ${career.length === 0 ? /* html */`
                <div id="no-stats">There are no player stats available for this game type.</div>
            ` : /* html */`
                <div class="section">Career Stats by Season</div>
                <div id="stats" class="stats-${gameType}">
                    <div class="header">Season</div>
                    <div class="header team">Team</div>
                    <div class="header">G</div>
                    ${gameType === "CTF" ? /* html */`
                        <div class="header totals">C</div>
                        <div class="header totals">P</div>
                        <div class="header totals">CK</div>
                        <div class="header totals">R</div>
                    ` : ""}
                    <div class="header">KDA</div>
                    <div class="header totals">K</div>
                    <div class="header totals">A</div>
                    <div class="header totals">D</div>
                    <div class="header totals">Dmg</div>
                    ${gameType === "CTF" ? /* html */`
                        <div class="header">CPG</div>
                        <div class="header">PPG</div>
                        <div class="header">CKPG</div>
                        <div class="header">RPG</div>
                    ` : ""}
                    <div class="header">KPG</div>
                    <div class="header">APG</div>
                    <div class="header">DPG</div>
                    ${gameType === "TA" ? /* html */`
                        <div class="header">DmgPG</div>
                        <div class="header">DmgPD</div>
                    ` : ""}
                    ${career.map((s) => /* html */`
                        <div class="season">${s.season}${s.postseason ? "P" : ""}</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="numeric">${s.games}</div>
                        ${gameType === "CTF" ? /* html */`
                            <div class="numeric totals">${s.captures}</div>
                            <div class="numeric totals">${s.pickups}</div>
                            <div class="numeric totals">${s.carrierKills}</div>
                            <div class="numeric totals">${s.returns}</div>
                        ` : ""}
                        <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                        <div class="numeric totals">${s.kills}</div>
                        <div class="numeric totals">${s.assists}</div>
                        <div class="numeric totals">${s.deaths}</div>
                        <div class="numeric totals">${s.damage > 0 ? `${s.damage.toFixed(0)}` : ""}</div>
                        ${gameType === "CTF" ? /* html */`
                            <div class="numeric">${(s.captures / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.pickups / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.carrierKills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.returns / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        ` : ""}
                        <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        ${gameType === "TA" ? /* html */`
                            <div class="numeric">${s.damage > 0 ? `${(s.damage / (s.gamesWithDamage + 0.15 * s.overtimePeriods)).toFixed(2)}` : ""}</div>
                            <div class="numeric">${s.damage > 0 ? `${(s.damage / Math.max(s.deathsInGamesWithDamage, 1)).toFixed(2)}` : ""}</div>
                        ` : ""}
                    `).join("")}
                    <div class="lifetime">Lifetime</div>
                    <div class="numeric">${totals.games}</div>
                    ${gameType === "CTF" ? /* html */`
                        <div class="numeric totals">${totals.captures}</div>
                        <div class="numeric totals">${totals.pickups}</div>
                        <div class="numeric totals">${totals.carrierKills}</div>
                        <div class="numeric totals">${totals.returns}</div>
                    ` : ""}
                    <div class="numeric">${((totals.kills + totals.assists) / Math.max(1, totals.deaths)).toFixed(3)}</div>
                    <div class="numeric totals">${totals.kills}</div>
                    <div class="numeric totals">${totals.assists}</div>
                    <div class="numeric totals">${totals.deaths}</div>
                    <div class="numeric totals">${totals.damage > 0 ? `${totals.damage.toFixed(0)}` : ""}</div>
                    ${gameType === "CTF" ? /* html */`
                        <div class="numeric">${(totals.captures / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(totals.pickups / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(totals.carrierKills / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(totals.returns / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                    ` : ""}
                    <div class="numeric">${(totals.kills / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                    <div class="numeric">${(totals.assists / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                    <div class="numeric">${(totals.deaths / (totals.games + 0.15 * totals.overtimePeriods)).toFixed(2)}</div>
                    ${gameType === "TA" ? /* html */`
                        <div class="numeric">${totals.damage > 0 ? `${(totals.damage / (totals.gamesWithDamage + 0.15 * totals.overtimePeriods)).toFixed(2)}` : ""}</div>
                        <div class="numeric">${totals.damage > 0 ? `${(totals.damage / Math.max(totals.deathsInGamesWithDamage, 1)).toFixed(2)}` : ""}</div>
                    ` : ""}
                </div>
                <div class="section">Career Stats by Team</div>
                <div id="team-stats" class="team-stats-${gameType}">
                    <div class="header team">Team</div>
                    <div class="header">G</div>
                    ${gameType === "CTF" ? /* html */`
                        <div class="header totals">C</div>
                        <div class="header totals">P</div>
                        <div class="header totals">CK</div>
                        <div class="header totals">R</div>
                    ` : ""}
                    <div class="header">KDA</div>
                    <div class="header totals">K</div>
                    <div class="header totals">A</div>
                    <div class="header totals">D</div>
                    <div class="header totals">Dmg</div>
                    ${gameType === "CTF" ? /* html */`
                        <div class="header">CPG</div>
                        <div class="header">PPG</div>
                        <div class="header">CKPG</div>
                        <div class="header">RPG</div>
                    ` : ""}
                    <div class="header">KPG</div>
                    <div class="header">APG</div>
                    <div class="header">DPG</div>
                    ${gameType === "TA" ? /* html */`
                        <div class="header">DmgPG</div>
                        <div class="header">DmgPD</div>
                    ` : ""}
                    ${careerTeams.map((s) => /* html */`
                        <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="numeric">${s.games}</div>
                        ${gameType === "CTF" ? /* html */`
                            <div class="numeric totals">${s.captures}</div>
                            <div class="numeric totals">${s.pickups}</div>
                            <div class="numeric totals">${s.carrierKills}</div>
                            <div class="numeric totals">${s.returns}</div>
                        ` : ""}
                        <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                        <div class="numeric totals">${s.kills}</div>
                        <div class="numeric totals">${s.assists}</div>
                        <div class="numeric totals">${s.deaths}</div>
                        <div class="numeric totals">${s.damage > 0 ? `${s.damage.toFixed(0)}` : ""}</div>
                        ${gameType === "CTF" ? /* html */`
                            <div class="numeric">${(s.captures / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.pickups / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.carrierKills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            <div class="numeric">${(s.returns / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        ` : ""}
                        <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                        ${gameType === "TA" ? /* html */`
                            <div class="numeric">${s.damage > 0 ? `${(s.damage / (s.gamesWithDamage + 0.15 * s.overtimePeriods)).toFixed(2)}` : ""}</div>
                            <div class="numeric">${s.damage > 0 ? `${(s.damage / Math.max(s.deathsInGamesWithDamage, 1)).toFixed(2)}` : ""}</div>
                        ` : ""}
                    `).join("")}
                </div>
                <div class="options">
                    <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                        ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="${PlayerView.getLink(playerId, player.name, player.tag, gameType, all, seasonNumber, postseason)}">${seasonNumber}</a>` : seasonNumber}
                    `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="${PlayerView.getLink(playerId, player.name, player.tag, gameType, all, 0, postseason)}">All Time</a>`}<br />
                    <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="${PlayerView.getLink(playerId, player.name, player.tag, gameType, all, season, true)}">Yes</a>`} | ${postseason ? /* html */`<a href="${PlayerView.getLink(playerId, player.name, player.tag, gameType, all, season, false)}">No</a>` : "No"}
                </div>
                <div class="section">Performance</div>
                <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                <div id="gamelog">View the <a href="/player/${playerId}/${encodeURIComponent(PlayerView.Common.normalizeName(player.name, player.tag))}/gamelog${isNaN(season) ? `${postseason ? "?postseason=yes" : ""}` : `?season=${season}${postseason ? "&postseason=yes" : ""}`}">Game Log</a></div>
                <div id="performance">
                    <div id="opponents" class="opponents-${gameType}">
                        <div class="header team">Vs. Opponent</div>
                        <div class="header">G</div>
                        <div class="header">KDA</div>
                        ${gameType === "CTF" ? /* html */`
                            <div class="header">CPG</div>
                            <div class="header">PPG</div>
                            <div class="header">CKPG</div>
                            <div class="header">RPG</div>
                        ` : ""}
                        ${gameType === "TA" ? /* html */`
                            <div class="header">KPG</div>
                            <div class="header">APG</div>
                            <div class="header">DPG</div>
                        ` : ""}
                        <div class="header best">Best Game On</div>
                        ${opponents.map((s) => /* html */`
                            <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.teamName, s.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="numeric">${s.games}</div>
                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            ${gameType === "CTF" ? /* html */`
                                <div class="numeric">${(s.captures / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.pickups / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.carrierKills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.returns / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            ` : ""}
                            ${gameType === "TA" ? /* html */`
                                <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            ` : ""}
                            <div class="best-stats">${s.bestMap}</div>
                            <div class="match-time"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.bestMatchTime}")));</script></a></div>
                            <div class="best-stats">
                                ${gameType === "TA" ? /* html */`
                                    <span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */`, <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg (<span class="numeric">${(s.bestDamage / Math.max(s.bestDeaths, 1)).toFixed(2)}</span> DmgPD)` : ""}
                                ` : ""}
                                ${gameType === "CTF" ? /* html */`
                                    <span class="numeric">${s.bestCaptures}</span> C/<span class="numeric">${s.bestPickups}</span> P, <span class="numeric">${s.bestCarrierKills}</span> CK, <span class="numeric">${s.bestReturns}</span> R, <span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg` : ""}
                                ` : ""}
                            </div>
                        `).join("")}
                    </div>
                    <div id="maps" class="maps-${gameType}">
                        <div class="header">On Map</div>
                        <div class="header">G</div>
                        <div class="header">KDA</div>
                        ${gameType === "CTF" ? /* html */`
                            <div class="header">CPG</div>
                            <div class="header">PPG</div>
                            <div class="header">CKPG</div>
                            <div class="header">RPG</div>
                        ` : ""}
                        ${gameType === "TA" ? /* html */`
                            <div class="header">KPG</div>
                            <div class="header">APG</div>
                            <div class="header">DPG</div>
                        ` : ""}
                        <div class="header best">Best Game Vs.</div>
                        ${maps.map((s) => /* html */`
                            <div>${s.map}</div>
                            <div class="numeric">${s.games}</div>
                            <div class="numeric">${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            ${gameType === "CTF" ? /* html */`
                                <div class="numeric">${(s.captures / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.pickups / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.carrierKills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.returns / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            ` : ""}
                            ${gameType === "TA" ? /* html */`
                                <div class="numeric">${(s.kills / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.assists / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                                <div class="numeric">${(s.deaths / (s.games + 0.15 * s.overtimePeriods)).toFixed(2)}</div>
                            ` : ""}
                            <div class="tag best-stats"><div class="diamond${(team = teams.getTeam(s.bestOpponentTeamId, s.bestOpponentTeamName, s.bestOpponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="match-time"><a href="/match/${s.challengeId}/${s.challengingTeamTag}/${s.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${s.bestMatchTime}")));</script></a></div>
                            <div class="best-stats">
                                ${gameType === "TA" ? /* html */`
                                    <span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */`, <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg (<span class="numeric">${(s.bestDamage / Math.max(s.bestDeaths, 1)).toFixed(2)}</span> DmgPD)` : ""}
                                ` : ""}
                                ${gameType === "CTF" ? /* html */`
                                    <span class="numeric">${s.bestCaptures}</span> C/<span class="numeric">${s.bestPickups}</span> P, <span class="numeric">${s.bestCarrierKills}</span> CK, <span class="numeric">${s.bestReturns}</span> R, <span class="numeric">${((s.bestKills + s.bestAssists) / Math.max(1, s.bestDeaths)).toFixed(3)}</span> KDA (<span class="numeric">${s.bestKills}</span> K, <span class="numeric">${s.bestAssists}</span> A, <span class="numeric">${s.bestDeaths}</span> D)${s.bestDamage > 0 ? /* html */` <span class="numeric">${s.bestDamage.toFixed(0)}</span> Dmg` : ""}
                                ` : ""}
                            </div>
                        `).join("")}
                    </div>
                </div>
                ${totals.totalDamage > 0 ? /* html */`
                    <div id="damage">
                        <div class="section">Damage Breakdown</div>
                        <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
                        <div class="damage-grid">
                            <div><img src="/images/weapons/impulse.png" width="28" height="41" title="Impulse" /></div>
                            <div><img src="/images/weapons/cyclone.png" width="28" height="41" title="Cyclone" /></div>
                            <div><img src="/images/weapons/reflex.png" width="28" height="41" title="Reflex" /></div>
                            <div><img src="/images/weapons/crusher.png" width="28" height="41" title="Crusher" /></div>
                            <div><img src="/images/weapons/driller.png" width="28" height="41" title="Driller" /></div>
                            <div><img src="/images/weapons/flak.png" width="28" height="41" title="Flak" /></div>
                            <div><img src="/images/weapons/thunderbolt.png" width="28" height="41" title="Thunderbolt" /></div>
                            <div><img src="/images/weapons/lancer.png" width="28" height="41" title="Lancer" /></div>
                            <div class="numeric">${damage.Impulse ? damage.Impulse.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Cyclone ? damage.Cyclone.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Reflex ? damage.Reflex.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Crusher ? damage.Crusher.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Driller ? damage.Driller.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Flak ? damage.Flak.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Thunderbolt ? damage.Thunderbolt.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Lancer ? damage.Lancer.toFixed(0) : "0"}</div>
                            <div class="mixed"><span class="numeric">${damage.Impulse ? (100 * damage.Impulse / totals.primaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Cyclone ? (100 * damage.Cyclone / totals.primaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Reflex ? (100 * damage.Reflex / totals.primaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Crusher ? (100 * damage.Crusher / totals.primaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Driller ? (100 * damage.Driller / totals.primaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Flak ? (100 * damage.Flak / totals.primaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Thunderbolt ? (100 * damage.Thunderbolt / totals.primaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Lancer ? (100 * damage.Lancer / totals.primaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                        </div>
                        <div class="damage-grid">
                            <div><img src="/images/weapons/falcon.png" width="28" height="41" title="Falcon" /></div>
                            <div><img src="/images/weapons/missilepod.png" width="28" height="41" title="Missile Pod" /></div>
                            <div><img src="/images/weapons/hunter.png" width="28" height="41" title="Hunter" /></div>
                            <div><img src="/images/weapons/creeper.png" width="28" height="41" title="Creeper" /></div>
                            <div><img src="/images/weapons/nova.png" width="28" height="41" title="Nova" /></div>
                            <div><img src="/images/weapons/devastator.png" width="28" height="41" title="Devastator" /></div>
                            <div><img src="/images/weapons/timebomb.png" width="28" height="41" title="Time Bomb" /></div>
                            <div><img src="/images/weapons/vortex.png" width="28" height="41" title="Vortex" /></div>
                            <div class="numeric">${damage.Falcon ? damage.Falcon.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage["Missile Pod"] ? damage["Missile Pod"].toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Hunter ? damage.Hunter.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Creeper ? damage.Creeper.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Nova ? damage.Nova.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Devastator ? damage.Devastator.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage["Time Bomb"] ? damage["Time Bomb"].toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Vortex ? damage.Vortex.toFixed(0) : "0"}</div>
                            <div class="mixed"><span class="numeric">${damage.Falcon ? (100 * damage.Falcon / totals.secondaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage["Missile Pod"] ? (100 * damage["Missile Pod"] / totals.secondaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Hunter ? (100 * damage.Hunter / totals.secondaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Creeper ? (100 * damage.Creeper / totals.secondaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Nova ? (100 * damage.Nova / totals.secondaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Devastator ? (100 * damage.Devastator / totals.secondaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage["Time Bomb"] ? (100 * damage["Time Bomb"] / totals.secondaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${damage.Vortex ? (100 * damage.Vortex / totals.secondaries).toFixed(1) : "0.0"}</span><span class="percent">%</span></div>
                        </div>
                        <div class="damage-grid-small">
                            <div><img src="/images/weapons/flare.png" width="28" height="41" title="Flare" /></div>
                            <div><img src="/images/weapons/miscellaneous.png" width="28" height="41" title="Miscellaneous" /></div>
                            <div><img src="/images/weapons/unknown.png" width="28" height="41" title="Unknown" /></div>
                            <div class="numeric">${damage.Flare ? damage.Flare.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Miscellaneous ? damage.Miscellaneous.toFixed(0) : "0"}</div>
                            <div class="numeric">${damage.Unknown ? damage.Unknown.toFixed(0) : "0"}</div>
                        </div>
                        <div class="damage-grid-small">
                            <div id="total-primaries">Primaries</div>
                            <div id="total-secondaries">Secondaries</div>
                            <div id="total-damage">Total Damage</div>
                            <div class="numeric">${totals.primaries.toFixed(0)}</div>
                            <div class="numeric">${totals.secondaries.toFixed(0)}</div>
                            <div class="numeric">${totals.totalDamage.toFixed(0)}</div>
                            <div class="mixed"><span class="numeric">${(100 * totals.primaries / totals.totalDamage).toFixed(1)}</span><span class="percent">%</span></div>
                            <div class="mixed"><span class="numeric">${(100 * totals.secondaries / totals.totalDamage).toFixed(1)}</span><span class="percent">%</span></div>
                        </div>
                    </div>
                ` : ""}
            `}
        `;
    }

    //              #    #      #          #
    //              #    #                 #
    //  ###   ##   ###   #     ##    ###   # #
    // #  #  # ##   #    #      #    #  #  ##
    //  ##   ##     #    #      #    #  #  # #
    // #      ##     ##  ####  ###   #  #  #  #
    //  ###
    /**
     * Gets the link for the page based on the parameters.
     * @param {number} playerId The player ID.
     * @param {string} name The player name.
     * @param {string} tag The player tag.
     * @param {string} gameType The game type.
     * @param {boolean} all Whether to show all stats.
     * @param {number} season The season number.
     * @param {boolean} postseason Whether to show postseason stats.
     * @returns {string} The link.
     */
    static getLink(playerId, name, tag, gameType, all, season, postseason) {
        return /* html */`/player/${playerId}/${encodeURIComponent(PlayerView.Common.normalizeName(name, tag))}?gameType=${gameType || "TA"}${postseason ? "&postseason=yes" : ""}${all ? "&all=yes" : ""}${isNaN(season) ? "" : `&season=${season}`}`;
    }
}

/** @type {typeof import("../../web/includes/common")} */
// @ts-ignore
PlayerView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = PlayerView; // eslint-disable-line no-undef
}
