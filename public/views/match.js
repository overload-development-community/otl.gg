/**
 * @typedef {import("../../src/models/challenge")} Challenge
 */

//  #   #          #            #      #   #    #
//  #   #          #            #      #   #
//  ## ##   ###   ####    ###   # ##   #   #   ##     ###   #   #
//  # # #      #   #     #   #  ##  #   # #     #    #   #  #   #
//  #   #   ####   #     #      #   #   # #     #    #####  # # #
//  #   #  #   #   #  #  #   #  #   #   # #     #    #      # # #
//  #   #   ####    ##    ###   #   #    #     ###    ###    # #
/**
 * A class that represents the match view.
 */
class MatchView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the match template.
     * @param {{challenge: Challenge, details: {teams: {teamId: number, name: string, tag: string, rating: number, wins: number, losses: number, ties: number}[], stats: {playerId: number, name: string, teamId: number, kills: number, assists: number, deaths: number, twitchName: string}[], damage: {playerId: number, name: string, teamId: number, opponentName: string, weapon: string, damage: number}[], season: {season: number, postseason: boolean}}, weapons: string[]}} data The match data.
     * @returns {string} An HTML string of the match.
     */
    static get(data) {
        const {challenge, details, weapons} = data,
            challengingTeamRecord = details.teams.find((team) => team.teamId === challenge.challengingTeam.id),
            challengedTeamRecord = details.teams.find((team) => team.teamId === challenge.challengedTeam.id),
            unplayed = challenge.details.challengingTeamScore !== null && challenge.details.challengedTeamScore !== null;
        let team;

        return /* html */`
            <div id="data">
                <div id="match" ${unplayed ? "class=\"unplayed\"" : ""}>
                    ${challenge.details.title ? /* html */`
                        <div class="title">${challenge.details.title}</div>
                    ` : ""}
                    <div class="tag1">
                        <div class="diamond${challenge.challengingTeam.role && challenge.challengingTeam.role.hexColor ? "" : "-empty"}" ${challenge.challengingTeam.role && challenge.challengingTeam.role.hexColor ? `style="background-color: ${challenge.challengingTeam.role.hexColor};"` : ""}></div> <a href="/team/${challenge.challengingTeam.tag}">${challenge.challengingTeam.tag}</a>
                    </div>
                    <div class="team1">
                        <a href="/team/${challenge.challengingTeam.tag}">${challenge.challengingTeam.name}</a>
                        ${unplayed ? "" : /* html */`
                            <span class="numeric record1">
                                ${challengingTeamRecord.rating ? `${Math.round(challengingTeamRecord.rating)},` : ""} ${challengingTeamRecord.wins}-${challengingTeamRecord.losses}${challengingTeamRecord.ties === 0 ? "" : `-${challengingTeamRecord.ties}`}
                            </span>
                        `}
                    </div>
                    <div class="change1">
                        ${unplayed ? /* html */ `
                            <span class="numeric">
                                ${challengingTeamRecord.rating ? `${Math.round(challengingTeamRecord.rating)},` : ""} ${challengingTeamRecord.wins}-${challengingTeamRecord.losses}${challengingTeamRecord.ties === 0 ? "" : `-${challengingTeamRecord.ties}`}
                            </span>
                        ` : /* html */ `
                            ${challenge.details.ratingChange ? /* html */`
                                <span class="numeric">${Math.round(challenge.details.challengingTeamRating - challenge.details.ratingChange)}</span> &rarr; <span class="numeric">${Math.round(challenge.details.challengingTeamRating)}</span>
                            ` : ""}
                        `}
                    </div>
                    ${challenge.details.challengingTeamScore === null ? "" : /* html */`
                        <div class="numeric score1 ${challenge.details.dateClosed && challenge.details.challengingTeamScore > challenge.details.challengedTeamScore ? "winner" : ""}">
                            ${challenge.details.challengingTeamScore}
                        </div>
                    `}
                    <div class="tag2">
                        <div class="diamond${challenge.challengedTeam.role && challenge.challengedTeam.role.hexColor ? "" : "-empty"}" ${challenge.challengedTeam.role && challenge.challengedTeam.role.hexColor ? `style="background-color: ${challenge.challengedTeam.role.hexColor};"` : ""}></div> <a href="/team/${challenge.challengedTeam.tag}">${challenge.challengedTeam.tag}</a>
                    </div>
                    <div class="team2">
                        <a href="/team/${challenge.challengedTeam.tag}">${challenge.challengedTeam.name}</a>
                        ${unplayed ? "" : /* html */`
                            <span class="numeric record2">
                                ${challengedTeamRecord.rating ? `${Math.round(challengedTeamRecord.rating)},` : ""} ${challengedTeamRecord.wins}-${challengedTeamRecord.losses}${challengedTeamRecord.ties === 0 ? "" : `-${challengedTeamRecord.ties}`}
                            </span>
                        `}
                    </div>
                    <div class="change2">
                        ${unplayed ? /* html */ `
                            <span class="numeric">
                                ${challengedTeamRecord.rating ? `${Math.round(challengedTeamRecord.rating)},` : ""} ${challengedTeamRecord.wins}-${challengedTeamRecord.losses}${challengedTeamRecord.ties === 0 ? "" : `-${challengedTeamRecord.ties}`}
                            </span>
                        ` : /* html */ `
                            ${challenge.details.ratingChange ? /* html */`
                                <span class="numeric">${Math.round(challenge.details.challengedTeamRating + challenge.details.ratingChange)}</span> &rarr; <span class="numeric">${Math.round(challenge.details.challengedTeamRating)}</span>
                            ` : ""}
                        `}
                    </div>
                    ${challenge.details.challengedTeamScore === null ? "" : /* html */`
                        <div class="numeric score2 ${challenge.details.dateClosed && challenge.details.challengedTeamScore > challenge.details.challengingTeamScore ? "winner" : ""}">
                            ${challenge.details.challengedTeamScore}
                        </div>
                    `}
                    ${challenge.details.map ? /* html */`
                        <div class="map">
                            ${challenge.details.map}${challenge.details.overtimePeriods > 0 ? `, ${challenge.details.overtimePeriods > 1 ? challenge.details.overtimePeriods : ""}OT` : ""}
                        </div>
                    ` : ""}
                    <div class="date">
                        ${challenge.details.matchTime ? /* html */`
                            <script>document.write(Common.formatDate(new Date("${challenge.details.matchTime}")));</script>
                        ` : ""}
                        ${challenge.details.matchTime && details.season ? ", " : ""}
                        ${details.season ? /* html */`
                            Season ${details.season.season} ${details.season.postseason ? "Postseason" : ""}
                        ` : ""}
                    </div>
                </div>
                ${details.stats && details.stats.length > 0 ? /* html */`
                    <div id="stats">
                        <div class="header">Team</div>
                        <div class="header name">Name</div>
                        <div class="header">KDA</div>
                        <div class="header">Kills</div>
                        <div class="header">Assists</div>
                        <div class="header">Deaths</div>
                        ${details.stats.sort((a, b) => (a.kills + a.assists) / Math.max(a.deaths, 1) === (b.kills + b.assists) / Math.max(b.deaths, 1) ? a.kills === b.kills ? a.deaths - b.deaths : b.kills - a.kills : (b.kills + b.assists) / Math.max(b.deaths, 1) - (a.kills + a.assists) / Math.max(a.deaths, 1)).map((s) => /* html */ `
                            <div class="tag">${(team = challenge.challengingTeam.id === s.teamId ? challenge.challengingTeam : challenge.challengedTeam) === null ? "" : /* html */`
                                <div class="diamond${team.role && team.role.hexColor ? "" : "-empty"}" ${team.role && team.role.hexColor ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                            `}</div>
                            <div class="twitch">${s.twitchName ? /* html */`
                                <a href="https://twitch.tv/${encodeURIComponent(s.twitchName)}"><div class="twitch-image"></div></a>
                            ` : ""}</div>
                            <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(s.name)}">${MatchView.Common.htmlEncode(s.name)}</a></div>
                            <div class="numeric kda">${((s.kills + s.assists) / Math.max(s.deaths, 1)).toFixed(3)}</div>
                            <div class="numeric kills">${s.kills}</div>
                            <div class="numeric assists">${s.assists}</div>
                            <div class="numeric deaths">${s.deaths}</div>
                        `).join("")}
                    </div>
                ` : ""}
                ${details.damage && details.damage.length > 0 ? /* html */`
                    <div id="weapons">
                        ${weapons.map((weapon) => /* html */`
                            <a class="weapon" href="#" title="${weapon}"><img src="/images/weapons/${weapon.replace(/ /g, "").toLocaleLowerCase()}.png" width="28" height="41" alt="${weapon}" /></a>
                        `).join("")}
                    </div>
                    <div id="damage">
                        <div id="grid">
                            <div class="table" style="grid-template-columns: repeat(${3 + details.stats.length}, max-content)">
                                <div id="weapon-container">
                                    <div id="weapon">Select a weapon</div>
                                </div>
                                ${details.stats.sort((a, b) => MatchView.Common.htmlEncode(a.name).localeCompare(MatchView.Common.htmlEncode(b.name))).map((player) => /* html */`
                                    <div class="vertical header">${MatchView.Common.htmlEncode(player.name)}</div>
                                `).join("")}
                                <div class="vertical header">Total</div>
                                <div class="vertical header">All Weapons</div>
                                ${details.stats.map((player, index) => /* html */`
                                    <div class="header">${MatchView.Common.htmlEncode(player.name)}</div>
                                    ${details.stats.map((opponent, opponentIndex) => /* html */`
                                        <div id="damage-${index}-${opponentIndex}" class="numeric right ${index === opponentIndex || player.teamId && player.teamId === opponent.teamId ? "friendly" : ""}"></div>
                                    `).join("")}
                                    <div id="damage-${index}-total" class="numeric right"></div>
                                    <div class="numeric right">${details.damage.filter((d) => d.name === player.name && d.name !== d.opponentName && details.stats.find((p) => p.name === d.name).teamId !== details.stats.find((p) => p.name === d.opponentName).teamId).map((d) => d.damage).reduce((a, b) => a + b, 0).toFixed(0)}</div>
                                `).join("")}
                            </div>
                        </div>
                    </div>
                ` : ""}
                <div id="details">
                    <div>Blue team:</div>
                    <div class="tag">${(team = challenge.details.blueTeam) === null ? "" : /* html */`
                        <div class="diamond${team.role && team.role.hexColor ? "" : "-empty"}" ${team.role && team.role.hexColor ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                    `}</div>
                    <div>Home map team:</div>
                    <div class="tag">
                        ${challenge.details.usingHomeMapTeam ? /* html */`
                            ${(team = challenge.details.homeMapTeam) === null ? "" : /* html */`
                                <div class="diamond${team.role && team.role.hexColor ? "" : "-empty"}" ${team.role && team.role.hexColor ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                            `}
                        ` : "Neutral"}
                    </div>
                    <div>Caster:</div>
                    <div>${challenge.details.caster ? MatchView.Common.htmlEncode(challenge.details.caster.displayName) : "None"}</div>
                    <div>Orange team:</div>
                    <div class="tag">
                        ${(team = challenge.details.orangeTeam) === null ? "" : /* html */`
                            <div class="diamond${team.role && team.role.hexColor ? "" : "-empty"}" ${team.role && team.role.hexColor ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                        `}
                    </div>
                    <div></div>
                    <div></div>
                    <div>VoD:</div>
                    <div>${challenge.details.vod ? /* html */`
                        <a href="${encodeURI(challenge.details.vod)}" target="_blank">${MatchView.Common.htmlEncode(challenge.details.vod)}</a>
                    ` : "None"}</div>
                </div>
            </div>
            <script>
                MatchJs.players = ${JSON.stringify(details.stats && details.stats.map((p) => p.name) || [])}
                MatchJs.damage = ${JSON.stringify(details.damage || [])};
            </script>
        `;
    }
}

// @ts-ignore
MatchView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = MatchView; // eslint-disable-line no-undef
}
