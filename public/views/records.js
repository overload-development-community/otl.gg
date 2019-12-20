/**
 * @typedef {import("../../web/includes/teams")} Teams
 */

//  ####                                   #         #   #    #
//  #   #                                  #         #   #
//  #   #   ###    ###    ###   # ##    ## #   ###   #   #   ##     ###   #   #
//  ####   #   #  #   #  #   #  ##  #  #  ##  #       # #     #    #   #  #   #
//  # #    #####  #      #   #  #      #   #   ###    # #     #    #####  # # #
//  #  #   #      #   #  #   #  #      #  ##      #   # #     #    #      # # #
//  #   #   ###    ###    ###   #       ## #  ####     #     ###    ###    # #
/**
 * A class that represents the records view.
 */
class RecordsView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the records template.
     * @param {{seasonList: number[], records: {teamKda: {teamSize: number, teamKda: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], teamScore: {teamSize: number, score: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], teamAssists: {teamSize: number, assists: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], teamDeaths: {teamSize: number, deaths: number, teamId: number, tag: string, teamName: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], kda: {teamSize: number, kda: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], kills: {teamSize: number, kills: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], assists: {teamSize: number, assists: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[], deaths: {teamSize: number, deaths: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, opponentTeamId: number, opponentTag: string, opponentTeamName: string, challengeId: number, matchTime: Date, map: string, overtimePeriods: number}[]}, season: number, postseason: boolean, teams: Teams}} data The records data.
     * @returns {string} An HTML string of the records.
     */
    static get(data) {
        const {seasonList, records, season, postseason, teams} = data;
        let team;

        return /* html */`
            <div id="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/records?season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/records?season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/records?postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/records${isNaN(season) ? "" : `?season=${season}`}">No</a>` : "No"}
            </div>
            <div class="section">Records</div>
            <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"}</div>
            <div id="records">
                <div class="header category">Category</div>
                <div class="header holder">Holder</div>
                <div class="header">Record</div>
                <div class="header opponent">Opponent</div>
                <div class="header date">Date</div>
                <div class="header map">Map</div>
                ${records.teamKda.length === 0 ? "" : /* html */`
                    <div class="record-header" style="grid-row-end: span ${records.teamKda.length};">Team KDA</div>
                    ${records.teamKda.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                        <div style="grid-row-end: span ${records.teamKda.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                        ${records.teamKda.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                            <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div><span class="numeric">${r.teamKda.toFixed(3)}</span> &nbsp;KDA</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                            <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                        `).join("")}
                    `).join("")}
                `}
                ${records.teamScore.length === 0 ? "" : /* html */`
                    <div class="record-header" style="grid-row-end: span ${records.teamScore.length};">Team Score</div>
                    ${records.teamScore.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                        <div style="grid-row-end: span ${records.teamScore.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                        ${records.teamScore.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                            <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div><span class="numeric">${r.score}</span> &nbsp;Points</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                            <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                        `).join("")}
                    `).join("")}
                `}
                ${records.teamAssists.length === 0 ? "" : /* html */`
                    <div class="record-header" style="grid-row-end: span ${records.teamAssists.length};">Team Assists</div>
                    ${records.teamAssists.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                        <div style="grid-row-end: span ${records.teamAssists.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                        ${records.teamAssists.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                            <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div><span class="numeric">${r.assists}</span> &nbsp;Assists</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                            <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                        `).join("")}
                    `).join("")}
                `}
                ${records.teamDeaths.length === 0 ? "" : /* html */`
                    <div class="record-header" style="grid-row-end: span ${records.teamDeaths.length};">Team Fewest Deaths</div>
                    ${records.teamDeaths.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                        <div style="grid-row-end: span ${records.teamDeaths.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                        ${records.teamDeaths.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                            <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div><span class="numeric">${r.deaths}</span> &nbsp;Deaths</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                            <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                        `).join("")}
                    `).join("")}
                `}
                ${records.kda.length === 0 ? "" : /* html */`
                    <div class="record-header" style="grid-row-end: span ${records.kda.length};">KDA</div>
                    ${records.kda.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                        <div style="grid-row-end: span ${records.kda.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                        ${records.kda.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                            <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                            <div><span class="numeric">${r.kda.toFixed(3)}</span> &nbsp;KDA</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                            <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                        `).join("")}
                    `).join("")}
                `}
                ${records.kills.length === 0 ? "" : /* html */`
                    <div class="record-header" style="grid-row-end: span ${records.kills.length};">Kills</div>
                    ${records.kills.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                        <div style="grid-row-end: span ${records.kills.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                        ${records.kills.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                            <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                            <div><span class="numeric">${r.kills}</span> &nbsp;Kills</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                            <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                        `).join("")}
                    `).join("")}
                `}
                ${records.assists.length === 0 ? "" : /* html */`
                    <div class="record-header" style="grid-row-end: span ${records.assists.length};">Assists</div>
                    ${records.assists.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                        <div style="grid-row-end: span ${records.assists.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                        ${records.assists.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                            <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                            <div><span class="numeric">${r.assists}</span> &nbsp;Assists</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                            <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                        `).join("")}
                    `).join("")}
                `}
                ${records.deaths.length === 0 ? "" : /* html */`
                    <div class="record-header" style="grid-row-end: span ${records.deaths.length};">Fewest Deaths</div>
                    ${records.deaths.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                        <div style="grid-row-end: span ${records.deaths.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                        ${records.deaths.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                            <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                            <div><span class="numeric">${r.deaths}</span> &nbsp;Deaths</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                            <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                        `).join("")}
                    `).join("")}
                `}
            </div>
        `;
    }
}

/**
 * @type {typeof import("../../web/includes/common")}
 */
// @ts-ignore
RecordsView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = RecordsView; // eslint-disable-line no-undef
}
