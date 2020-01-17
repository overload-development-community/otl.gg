/**
 * @typedef {import("../../types/viewTypes").StandingsViewParameters} ViewTypes.StandingsViewParameters
 */

//   ###    #                       #    #                         #   #    #
//  #   #   #                       #                              #   #
//  #      ####    ###   # ##    ## #   ##    # ##    ## #   ###   #   #   ##     ###   #   #
//   ###    #         #  ##  #  #  ##    #    ##  #  #  #   #       # #     #    #   #  #   #
//      #   #      ####  #   #  #   #    #    #   #   ##     ###    # #     #    #####  # # #
//  #   #   #  #  #   #  #   #  #  ##    #    #   #  #          #   # #     #    #      # # #
//   ###     ##    ####  #   #   ## #   ###   #   #   ###   ####     #     ###    ###    # #
//                                                   #   #
//                                                    ###
/**
 * A class that represents the standings view.
 */
class StandingsView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the standings template.
     * @param {ViewTypes.StandingsViewParameters} data The standings data.
     * @returns {string} An HTML string of the standings.
     */
    static get(data) {
        const {seasonList, maps, standings, season, records, recordsTitle, records1, records2, records3, map, teams} = data;
        let team;

        return /* html */`
            <div id="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/standings?season=${seasonNumber}${records ? `&records=${records}` : ""}${map ? `&map=${map}` : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")}<br />
                <span class="grey">Record Splits:</span> ${recordsTitle === "Map Records" ? "Map Records" : /* html */`<a href="/standings?records=map${season ? `&season=${season}` : ""}${map ? `&map=${map}` : ""}">Map Records</a>`} | ${recordsTitle === "Team Size Records" ? "Team Size" : /* html */`<a href="/standings?records=size${season ? `&season=${season}` : ""}${map ? `&map=${map}` : ""}">Team Size</a>`} | ${recordsTitle === "Game Type Records" ? "Game Type" : /* html */`<a href="/standings?records=type${season ? `&season=${season}` : ""}${map ? `&map=${map}` : ""}">Game Type</a>`}<br />
                ${maps.length > 0 ? /* html */`
                    <span class="grey">Map:</span> ${map ? /* html */`<a href="/standings?map=none${season ? `&season=${season}` : ""}${records ? `&records=${records}` : ""}">None</a>` : "None"} | ${maps.map((mapName) => /* html */`
                        ${map === mapName ? mapName : /* html */`<a href="/standings?map=${mapName}${season ? `&season=${season}` : ""}${records ? `&records=${records}` : ""}">${mapName}</a>`}
                    `).join(" | ")}
                ` : ""}
            </div>
            <div id="body">
                <div class="section">Season Standings</div>
                <div class="subsection">for Season ${season || Math.max(...seasonList)} with ${recordsTitle} ${map ? `and ${map} records` : ""}</div>
                <div id="standings">
                    <div class="header before"></div>
                    <div class="header records">${recordsTitle}</div>
                    <div class="header after"></div>
                    <div class="header pos">Pos</div>
                    <div class="header">Tag</div>
                    <div class="header team-name">Team Name</div>
                    <div class="header">Rating</div>
                    <div class="header">Record</div>
                    <div class="header">${records1}</div>
                    <div class="header">${records2}</div>
                    <div class="header">${records3}</div>
                    <div class="header">${map || ""}</div>
                    ${standings.filter((s) => !s.disbanded).map((s, index) => /* html */`
                        <div class="pos numeric">${s.wins > 0 || s.losses > 0 || s.ties > 0 ? index + 1 : ""}</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.name, s.tag, s.disbanded, s.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="numeric ${s.wins + s.losses + s.ties < 10 ? "provisional" : ""}">${s.rating ? Math.round(s.rating) : ""}</div>
                        <div class="numeric">${s.wins > 0 || s.losses > 0 || s.ties > 0 ? `${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}` : ""}</div>
                        <div class="numeric">${s.wins1 > 0 || s.losses1 > 0 || s.ties1 > 0 ? `${s.wins1}-${s.losses1}${s.ties1 === 0 ? "" : `-${s.ties1}`}` : ""}</div>
                        <div class="numeric">${s.wins2 > 0 || s.losses2 > 0 || s.ties2 > 0 ? `${s.wins2}-${s.losses2}${s.ties2 === 0 ? "" : `-${s.ties2}`}` : ""}</div>
                        <div class="numeric">${s.wins3 > 0 || s.losses3 > 0 || s.ties3 > 0 ? `${s.wins3}-${s.losses3}${s.ties3 === 0 ? "" : `-${s.ties3}`}` : ""}</div>
                        <div class="numeric">${s.winsMap > 0 || s.lossesMap > 0 || s.tiesMap > 0 ? `${s.winsMap}-${s.lossesMap}${s.tiesMap === 0 ? "" : `-${s.tiesMap}`}` : ""}</div>
                    `).join("")}
                </div>
                ${standings.filter((s) => s.disbanded).length > 0 ? /* html */`
                    <div class="section">Disbanded Teams</div>
                    <div id="disbanded">
                        <div class="header before"></div>
                        <div class="header records">${recordsTitle}</div>
                        <div class="header after"></div>
                        <div class="header">Tag</div>
                        <div class="header">Team Name</div>
                        <div class="header">Rating</div>
                        <div class="header">Record</div>
                        <div class="header">${records1}</div>
                        <div class="header">${records2}</div>
                        <div class="header">${records3}</div>
                        <div class="header">${map || ""}</div>
                        ${standings.filter((s) => s.disbanded).map((s) => /* html */`
                            <div><a href="/team/${s.tag}">${s.tag}</a></div>
                            <div><a href="/team/${s.tag}">${s.name}</a></div>
                            <div class="numeric ${s.wins + s.losses + s.ties < 10 ? "provisional" : ""}">${s.rating ? Math.round(s.rating) : ""}</div>
                            <div class="numeric">${s.wins > 0 || s.losses > 0 || s.ties > 0 ? `${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}` : ""}</div>
                            <div class="numeric">${s.wins1 > 0 || s.losses1 > 0 || s.ties1 > 0 ? `${s.wins1}-${s.losses1}${s.ties1 === 0 ? "" : `-${s.ties1}`}` : ""}</div>
                            <div class="numeric">${s.wins2 > 0 || s.losses2 > 0 || s.ties2 > 0 ? `${s.wins2}-${s.losses2}${s.ties2 === 0 ? "" : `-${s.ties2}`}` : ""}</div>
                            <div class="numeric">${s.wins3 > 0 || s.losses3 > 0 || s.ties3 > 0 ? `${s.wins3}-${s.losses3}${s.ties3 === 0 ? "" : `-${s.ties3}`}` : ""}</div>
                            <div class="numeric">${s.winsMap > 0 || s.lossesMap > 0 || s.tiesMap > 0 ? `${s.winsMap}-${s.lossesMap}${s.tiesMap === 0 ? "" : `-${s.tiesMap}`}` : ""}</div>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
        `;
    }
}

if (typeof module !== "undefined") {
    module.exports = StandingsView; // eslint-disable-line no-undef
}
