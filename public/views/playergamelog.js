/**
 * @typedef {import("../../web/includes/teams")} Teams
 */

//  ####    ##                                 ###                        #                    #   #    #
//  #   #    #                                #   #                       #                    #   #
//  #   #    #     ###   #   #   ###   # ##   #       ###   ## #    ###   #       ###    ## #  #   #   ##     ###   #   #
//  ####     #        #  #   #  #   #  ##  #  #          #  # # #  #   #  #      #   #  #  #    # #     #    #   #  #   #
//  #        #     ####  #  ##  #####  #      #  ##   ####  # # #  #####  #      #   #   ##     # #     #    #####  # # #
//  #        #    #   #   ## #  #      #      #   #  #   #  # # #  #      #      #   #  #       # #     #    #      # # #
//  #       ###    ####      #   ###   #       ###    ####  #   #   ###   #####   ###    ###     #     ###    ###    # #
//                       #   #                                                          #   #
//                        ###                                                            ###
/**
 * A class that represents the player game log view.
 */
class PlayerGameLogView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the player template.
     * @param {{playerId: number, player: {name: string, teamId: number, tag: string, teamName: string}, seasonList: number[], season: number, postseason: boolean, matches: {challengeId: number, challengingTeamTag: string, challengedTeamTag: string, teamId: number, tag: string, name: string, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number, overtimePeriods: number, opponentTeamId: number, opponentTag: string, opponentName: string, teamScore: number, opponentScore: number, ratingChange: number, teamSize: number, matchTime: Date, map: string, gameType: string}[], teams: Teams}} data The player data.
     * @returns {string} An HTML string of the player.
     */
    static get(data) {
        const {playerId, player, seasonList, season, postseason, matches, teams} = data;
        let team;

        return /* html */`
            <div id="player">
                <div id="name">Game Log for ${PlayerGameLogView.Common.htmlEncode(PlayerGameLogView.Common.normalizeName(player.name, player.tag))}</div>
            </div>
            <div id="gamelog">View the <a href="/player/${playerId}/${encodeURIComponent(PlayerGameLogView.Common.normalizeName(player.name, player.tag))}/gamelog${isNaN(season) ? `${postseason ? "?postseason=yes" : ""}` : `?season=${season}${postseason ? "&postseason=yes" : ""}`}">Career Stats</a></div>
            <div id="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/player/${playerId}/${encodeURIComponent(PlayerGameLogView.Common.normalizeName(player.name, player.tag))}/gamelog?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/player/${playerId}/${encodeURIComponent(PlayerGameLogView.Common.normalizeName(player.name, player.tag))}/gamelog?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/player/${playerId}/${encodeURIComponent(PlayerGameLogView.Common.normalizeName(player.name, player.tag))}/gamelog?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/player/${playerId}/${encodeURIComponent(PlayerGameLogView.Common.normalizeName(player.name, player.tag))}/gamelog${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
            </div>
            <div class="section">Matches</div>
            <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
            <div id="matches">
                <div class="header team">Team</div>
                <div class="header team">Opponent</div>
                <div class="header result">Result</div>
                <div class="header date">Date</div>
                <div class="header map">Map</div>
                <div class="header">Stats</div>
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
                    <div>
                        ${m.gameType === "TA" ? /* html */`
                            <span class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${m.kills}</span> K, <span class="numeric">${m.assists}</span> A, <span class="numeric">${m.deaths}</span> D)${m.damage > 0 ? /* html */`, <span class="numeric">${m.damage.toFixed(0)}</span> Dmg (<span class="numeric">${(m.damage / m.deaths).toFixed(2)}</span> DmgPD)` : ""}
                        ` : ""}
                        ${m.gameType === "CTF" ? /* html */`
                            <span class="numeric">${m.captures}</span> C/<span class="numeric">${m.pickups}</span> P, <span class="numeric">${m.carrierKills}</span> CK, <span class="numeric">${m.returns}</span> R, <span class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${m.kills}</span> K, <span class="numeric">${m.assists}</span> A, <span class="numeric">${m.deaths}</span> D)${m.damage > 0 ? /* html */`<span class="numeric">${m.damage.toFixed(0)}</span> Dmg` : ""}
                        ` : ""}
                    </div>
                `).join("")}
            </div>
        `;
    }
}

/**
 * @type {typeof import("../../web/includes/common")}
 */
// @ts-ignore
PlayerGameLogView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = PlayerGameLogView; // eslint-disable-line no-undef
}
