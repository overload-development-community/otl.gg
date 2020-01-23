/**
 * @typedef {import("../../types/viewTypes").RecordsViewParameters} ViewTypes.RecordsViewParameters
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
     * @param {ViewTypes.RecordsViewParameters} data The records data.
     * @returns {string} An HTML string of the records.
     */
    static get(data) {
        const {seasonList, records, season, postseason, gameType, gameTypeName, recordType, teams} = data;
        let team;

        return /* html */`
            <div id="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${!isNaN(season) && season !== seasonNumber || isNaN(season) && index + 1 !== seasonList.length ? /* html */`<a href="/records?gameType=${gameType}&recordType=${recordType}&season=${seasonNumber}${postseason ? "&postseason=yes" : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")} | ${season === 0 ? "All Time" : /* html */`<a href="/records?gameType=${gameType}&recordType=${recordType}&season=0${postseason ? "&postseason=yes" : ""}">All Time</a>`}<br />
                <span class="grey">Postseason:</span> ${postseason ? "Yes" : /* html */`<a href="/records?gameType=${gameType}&recordType=${recordType}&postseason=yes${isNaN(season) ? "" : `&season=${season}`}">Yes</a>`} | ${postseason ? /* html */`<a href="/records?gameType=${gameType}&recordType=${recordType}${isNaN(season) ? "" : `&season=${season}`}">No</a>` : "No"}<br />
                <span class="grey">Game Type:</span> ${gameType === "TA" ? "Team Anarchy" : /* html */`<a href="/records?gameType=TA&recordType=${recordType}${isNaN(season) ? "" : `&season=${season}${postseason ? "&postseason=yes" : ""}`}">Team Anarchy</a>`} | ${gameType === "CTF" ? "Capture the Flag" : /* html */`<a href="/records?gameType=CTF&recordType=${recordType}${isNaN(season) ? "" : `&season=${season}${postseason ? "&postseason=yes" : ""}`}">Capture the Flag</a>`}<br />
                <span class="grey">Records:</span> ${recordType === "team" ? "Team" : /* html */`<a href="/records?gameType=${gameType}&recordType=team${isNaN(season) ? "" : `&season=${season}${postseason ? "&postseason=yes" : ""}`}">Team</a>`} | ${recordType === "player" ? "Player" : /* html */`<a href="/records?gameType=${gameType}&recordType=player${isNaN(season) ? "" : `&season=${season}${postseason ? "&postseason=yes" : ""}`}">Player</a>`}
            </div>
            <div class="section">Records</div>
            <div class="subsection">for ${isNaN(season) ? `Season ${Math.max(...seasonList)}` : season === 0 ? "All Time" : `Season ${season}`} during the ${postseason ? "postseason" : "regular season"} for ${gameTypeName}</div>
            <div id="records">
                <div class="header category">Category</div>
                <div class="header holder">Holder</div>
                <div class="header">Record</div>
                <div class="header opponent">Opponent</div>
                <div class="header date">Date</div>
                <div class="header map">Map</div>
                ${gameType === "TA" ? /* html */`
                    ${recordType === "team" ? /* html */ `
                        ${records.teamKda.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamKda.length};">Team Anarchy:<br />Team KDA</div>
                            ${records.teamKda.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamKda.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamKda.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(3)}</span> &nbsp;KDA</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamScore.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamScore.length};">Team Anarchy:<br />Team Score</div>
                            ${records.teamScore.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamScore.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamScore.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Points</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamAssists.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamAssists.length};">Team Anarchy:<br />Team Assists</div>
                            ${records.teamAssists.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamAssists.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamAssists.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Assists</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamDeaths.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamDeaths.length};">Team Anarchy:<br />Team Fewest Deaths</div>
                            ${records.teamDeaths.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamDeaths.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamDeaths.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Deaths</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamDamage.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamDamage.length};">Team Anarchy:<br />Team Total Damage</div>
                            ${records.teamDamage.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamDamage.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamDamage.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(0)}</span> &nbsp;Damage</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamDamagePerDeath.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamDamagePerDeath.length};">Team Anarchy:<br />Team Damage Per Death</div>
                            ${records.teamDamagePerDeath.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamDamagePerDeath.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamDamagePerDeath.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(2)}</span> &nbsp;DmPD</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                    ` : ""}
                    ${recordType === "player" ? /* html */ `
                        ${records.kda.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.kda.length};">Team Anarchy:<br />KDA</div>
                            ${records.kda.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.kda.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.kda.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(3)}</span> &nbsp;KDA</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.kills.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.kills.length};">Team Anarchy:<br />Kills</div>
                            ${records.kills.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.kills.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.kills.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Kills</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.assists.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.assists.length};">Team Anarchy:<br />Assists</div>
                            ${records.assists.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.assists.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.assists.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Assists</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.deaths.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.deaths.length};">Team Anarchy:<br />Fewest Deaths</div>
                            ${records.deaths.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.deaths.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.deaths.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Deaths</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.damage.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.damage.length};">Team Anarchy:<br />Total Damage</div>
                            ${records.damage.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.damage.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.damage.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(0)}</span> &nbsp;Damage</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.damagePerDeath.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.damagePerDeath.length};">Team Anarchy:<br />Damage Per Death</div>
                            ${records.damagePerDeath.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.damagePerDeath.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.damagePerDeath.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(2)}</span> &nbsp;DmPD</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                    ` : ""}
                ` : ""}
                ${gameType === "CTF" ? /* html */`
                    ${recordType === "team" ? /* html */ `
                        ${records.teamScore.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamScore.length};">Capture the Flag:<br />Team Score</div>
                            ${records.teamScore.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamScore.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamScore.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Points</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamPickups.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamPickups.length};">Capture the Flag:<br />Team Pickups</div>
                            ${records.teamPickups.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamPickups.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamPickups.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Pickups</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamCarrierKills.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamCarrierKills.length};">Capture the Flag:<br />Flag Carrier Kills</div>
                            ${records.teamCarrierKills.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamCarrierKills.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamCarrierKills.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Carrier Kills</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamReturns.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamReturns.length};">Capture the Flag:<br />Team Returns</div>
                            ${records.teamReturns.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamReturns.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamReturns.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Returns</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamDamage.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamDamage.length};">Capture the Flag:<br />Team Total Damage</div>
                            ${records.teamDamage.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamDamage.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamDamage.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(0)}</span> &nbsp;Damage</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.teamKda.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.teamKda.length};">Capture the Flag:<br />Team KDA</div>
                            ${records.teamKda.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.teamKda.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.teamKda.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(3)}</span> &nbsp;KDA</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                    ` : ""}
                    ${recordType === "player" ? /* html */ `
                        ${records.captures.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.captures.length};">Capture the Flag:<br />Captures</div>
                            ${records.captures.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.captures.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.captures.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;captures</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.pickups.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.pickups.length};">Capture the Flag:<br />Pickups</div>
                            ${records.pickups.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.pickups.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.pickups.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Pickups</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.carrierKills.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.carrierKills.length};">Capture the Flag:<br />Carrier Kills</div>
                            ${records.carrierKills.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.carrierKills.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.carrierKills.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Carrier Kills</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.returns.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.returns.length};">Capture the Flag:<br />Returns</div>
                            ${records.returns.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.returns.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.returns.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record}</span> &nbsp;Returns</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.damage.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.damage.length};">Capture the Flag:<br />Total Damage</div>
                            ${records.damage.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.damage.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.damage.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(0)}</span> &nbsp;Damage</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                        ${records.kda.length === 0 ? "" : /* html */`
                            <div class="record-header" style="grid-row-end: span ${records.kda.length};">Capture the Flag:<br />KDA</div>
                            ${records.kda.map((r) => r.teamSize).filter((r, index, a) => a.indexOf(r) === index).sort((a, b) => a - b).map((teamSize) => /* html */`
                                <div style="grid-row-end: span ${records.kda.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                                ${records.kda.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                                    <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div><a href="/player/${r.playerId}/${encodeURIComponent(RecordsView.Common.normalizeName(r.name, r.tag))}">${RecordsView.Common.htmlEncode(RecordsView.Common.normalizeName(r.name, r.tag))}</a></div>
                                    <div><span class="numeric">${r.record.toFixed(3)}</span> &nbsp;KDA</div>
                                    <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                                    <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                                    <div class="date"><a href="/match/${r.challengeId}/${r.tag}/${r.opponentTag}"><script>document.write(Common.formatDate(new Date("${r.matchTime}")));</script></a></div>
                                    <div class="map">${r.map}${r.overtimePeriods > 0 ? `, ${r.overtimePeriods > 1 ? r.overtimePeriods : ""}OT` : ""}</div>
                                `).join("")}
                            `).join("")}
                        `}
                    ` : ""}
                ` : ""}
            </div>
        `;
    }
}

/** @type {typeof import("../../web/includes/common")} */
// @ts-ignore
RecordsView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = RecordsView; // eslint-disable-line no-undef
}
