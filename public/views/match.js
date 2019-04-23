/**
 * @typedef {{teamId: number, name: string, tag: string, color: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}} TeamRecord
 */

//  #   #          #            #
//  #   #          #            #
//  ## ##   ###   ####    ###   # ##
//  # # #      #   #     #   #  ##  #
//  #   #   ####   #     #      #   #
//  #   #  #   #   #  #  #   #  #   #
//  #   #   ####    ##    ###   #   #
/**
 * A class that represents the match template.
 */
class Match {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the match.
     * @param {{match: {challengeId: number, title: string, challengingTeam: TeamRecord, challengedTeam: TeamRecord, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number}, stats: {teamId: number, tag: string, playerId: number, name: string, kda: number, kills: number, deaths: number, assists: number}[]}} data The match data.
     * @returns {string} An HTML string of the match.
     */
    static get(data) {
        let team;

        const {match, stats} = data;

        return /* html */`
            <div>
                <div class="match">
                    ${match.title ? /* html */`
                        <div class="title">${match.title}</div>
                    ` : ""}
                    <div class="tag1">
                        <div class="diamond${match.challengingTeam.color ? "" : "-empty"}" ${match.challengingTeam.color ? `style="background-color: ${match.challengingTeam.color};"` : ""}></div> <a href="/team/${match.challengingTeam.tag}">${match.challengingTeam.tag}</a>
                    </div>
                    <div class="team1">
                        <a href="/team/${match.challengingTeam.tag}">${match.challengingTeam.name}</a>
                    </div>
                    <div class="numeric record1">
                        ${match.challengingTeam.rating ? `${Math.round(match.challengingTeam.rating)},` : ""} ${match.challengingTeam.wins}-${match.challengingTeam.losses}${match.challengingTeam.ties === 0 ? "" : `-${match.challengingTeam.ties}`}
                    </div>
                    <div class="numeric score1 ${match.dateClosed && match.challengingTeamScore > match.challengedTeamScore ? "winner" : ""}">
                        ${match.challengingTeamScore}
                    </div>
                    <div class="tag2">
                        <div class="diamond${match.challengedTeam.color ? "" : "-empty"}" ${match.challengedTeam.color ? `style="background-color: ${match.challengedTeam.color};"` : ""}></div> <a href="/team/${match.challengedTeam.tag}">${match.challengedTeam.tag}</a>
                    </div>
                    <div class="team2">
                        <a href="/team/${match.challengedTeam.tag}">${match.challengedTeam.name}</a>
                    </div>
                    <div class="numeric record2">
                        ${match.challengedTeam.rating ? `${Math.round(match.challengedTeam.rating)},` : ""} ${match.challengedTeam.wins}-${match.challengedTeam.losses}${match.challengedTeam.ties === 0 ? "" : `-${match.challengedTeam.ties}`}
                    </div>
                    <div class="numeric score2 ${match.dateClosed && match.challengedTeamScore > match.challengingTeamScore ? "winner" : ""}">
                        ${match.challengedTeamScore}
                    </div>
                    <div class="map">
                        ${match.map}${match.overtimePeriods > 0 ? `, ${match.overtimePeriods > 1 ? match.overtimePeriods : ""}OT` : ""}
                    </div>
                    <div class="date">
                        <script>document.write(Match.Common.formatDate(new Date("${match.matchTime}")));</script>
                    </div>
                </div>
                <div class="stats">
                    <div class="header">Team</div>
                    <div class="header">Name</div>
                    <div class="header">KDA</div>
                    <div class="header">Kills</div>
                    <div class="header">Assists</div>
                    <div class="header">Deaths</div>
                    ${stats.sort((a, b) => a.kda === b.kda ? a.kills === b.kills ? a.deaths - b.deaths : b.kills - a.kills : b.kda - a.kda).map((s) => /* html */ `
                        <div class="tag">${(team = match.challengingTeam.teamId === s.teamId ? match.challengingTeam : match.challengedTeam) === null ? "" : /* html */`
                            <div class="diamond${team.color ? "" : "-empty"}" ${team.color ? `style="background-color: ${team.color};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                        `}</div>
                        <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(s.name)}">${Match.Common.htmlEncode(s.name)}</a></div>
                        <div class="numeric kda">${s.kda.toFixed(3)}</div>
                        <div class="numeric kills">${s.kills}</div>
                        <div class="numeric assists">${s.assists}</div>
                        <div class="numeric deaths">${s.deaths}</div>
                    `).join("")}
                </div>
            </div>
        `;
    }
}

// @ts-ignore
Match.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common;

if (typeof module !== "undefined") {
    module.exports = Match;
}
