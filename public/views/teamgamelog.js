/**
 * @typedef {import("../../types/viewTypes").TeamGameLogViewParameters} ViewTypes.TeamGameLogViewParameters
 */


//  #####                        ###                        #                    #   #    #
//    #                         #   #                       #                    #   #
//    #     ###    ###   ## #   #       ###   ## #    ###   #       ###    ## #  #   #   ##     ###   #   #
//    #    #   #      #  # # #  #          #  # # #  #   #  #      #   #  #  #    # #     #    #   #  #   #
//    #    #####   ####  # # #  #  ##   ####  # # #  #####  #      #   #   ##     # #     #    #####  # # #
//    #    #      #   #  # # #  #   #  #   #  # # #  #      #      #   #  #       # #     #    #      # # #
//    #     ###    ####  #   #   ###    ####  #   #   ###   #####   ###    ###     #     ###    ###    # #
//                                                                        #   #
//                                                                         ###
/**
 * A class that represents the team game log view.
 */
class TeamGameLogView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the team game log template.
     * @param {ViewTypes.TeamGameLogViewParameters} data The team data.
     * @returns {string} An HTML string of the team game log.
     */
    static get(data) {
        const {pageTeam, seasonList, matches, season, postseason, teams} = data;
        let team;

        return /* html */`
            <div id="team">
                <div id="teamname">
                    <div class="tag"><div class="diamond${pageTeam.role && pageTeam.role.color ? "" : "-empty"}" ${pageTeam.role && pageTeam.role.color ? `style="background-color: ${pageTeam.role.hexColor};"` : ""}></div> ${pageTeam.tag}</div>
                    <div class="name">${pageTeam.name}</div>
                </div>
            </div>
            <div id="gamelog">View the <a href="/team/${encodeURIComponent(pageTeam.tag)}${isNaN(season) ? `${postseason ? "?postseason=yes" : ""}` : `?season=${season}${postseason ? "&postseason=yes" : ""}`}">Team Stats</a></div>
            <div class="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/team/${encodeURI(pageTeam.tag)}/gamelog?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/team/${encodeURI(pageTeam.tag)}/gamelog?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/team/${encodeURI(pageTeam.tag)}/gamelog?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/team/${encodeURI(pageTeam.tag)}/gamelog${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
            </div>
            <div class="section">Game Log</div>
            <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
            <div id="matches">
                <div class="header team">Opponent</div>
                <div class="header result">Result</div>
                <div class="header">Map</div>
                <div class="header date">Date</div>
                <div class="header player">Top Performer</div>
                ${matches.map((m) => /* html */`
                    <div class="tag"><div class="diamond${(team = m.challengingTeamTag === pageTeam.tag ? teams.getTeam(m.challengedTeamId, m.challengedTeamName, m.challengedTeamTag) : teams.getTeam(m.challengingTeamId, m.challengingTeamName, m.challengingTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                    <div>${m.challengingTeamTag === pageTeam.tag ? m.challengingTeamScore > m.challengedTeamScore ? "W" : m.challengingTeamScore < m.challengedTeamScore ? "L" : "T" : m.challengedTeamScore > m.challengingTeamScore ? "W" : m.challengedTeamScore < m.challengingTeamScore ? "L" : "T"} <span class="numeric">${m.challengingTeamTag === pageTeam.tag ? m.challengingTeamScore : m.challengedTeamScore}-${m.challengingTeamTag === pageTeam.tag ? m.challengedTeamScore : m.challengingTeamScore}</span></div>
                    <div>${typeof m.ratingChange === "number" ? /* html */`
                        ${Math.round(m.ratingChange) > 0 ? /* html */`
                            <span class="plus">+</span>` : ""}<span class="numeric">${Math.round(m.ratingChange)}</span>
                    ` : ""}</div>
                    <div>${m.gameType} ${m.map}</div>
                    <div class="date"><a href="/match/${m.challengeId}/${m.challengingTeamTag}/${m.challengedTeamTag}"><script>document.write(Common.formatDate(new Date("${m.matchTime}")));</script></a></div>
                    <div class="tag player">${m.playerId ? /* html */`
                        <div class="diamond${(team = teams.getTeam(m.statTeamId, m.statTeamName, m.statTeamTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                    ` : ""}</div>
                    <div class="player">${m.playerId ? /* html */`
                        <a href="/player/${m.playerId}/${encodeURIComponent(TeamGameLogView.Common.normalizeName(m.name, team.tag))}">${TeamGameLogView.Common.htmlEncode(TeamGameLogView.Common.normalizeName(m.name, team.tag))}</a>
                    ` : ""}</div>
                    <div class="best-stats">${m.playerId ? /* html */`
                        ${m.gameType === "TA" ? /* html */`
                            <span class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${m.kills}</span> K, <span class="numeric">${m.assists}</span> A, <span class="numeric">${m.deaths}</span> D)${m.damage > 0 ? /* html */`, <span class="numeric">${m.damage.toFixed(0)}</span> Dmg (<span class="numeric">${(m.damage / m.deaths).toFixed(2)}</span> DmgPD)` : ""}
                        ` : ""}
                        ${m.gameType === "CTF" ? /* html */`
                            <span class="numeric">${m.captures}</span> C/<span class="numeric">${m.pickups}</span> P, <span class="numeric">${m.carrierKills}</span> CK, <span class="numeric">${m.returns}</span> R, <span class="numeric">${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(3)}</span> KDA (<span class="numeric">${m.kills}</span> K, <span class="numeric">${m.assists}</span> A, <span class="numeric">${m.deaths}</span> D)${m.damage > 0 ? /* html */` <span class="numeric">${m.damage.toFixed(0)}</span> Dmg` : ""}
                        ` : ""}
                    ` : ""}</div>
                `).join("")}
            </div>
        `;
    }
}

/** @type {typeof import("../../web/includes/common")} */
// @ts-ignore
TeamGameLogView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = TeamGameLogView; // eslint-disable-line no-undef
}
