/**
 * @typedef {import("discord.js").Message} DiscordJs.Message
 * @typedef {{teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, wins1: number, losses1: number, ties1: number, wins2: number, losses2: number, ties2: number, wins3: number, losses3: number, ties3: number, winsMap: number, lossesMap: number, tiesMap: number}} Standing
 * @typedef {import("../../web/includes/teams")} Teams
 */

//  #   #                       #   #    #
//  #   #                       #   #
//  #   #   ###   ## #    ###   #   #   ##     ###   #   #
//  #####  #   #  # # #  #   #   # #     #    #   #  #   #
//  #   #  #   #  # # #  #####   # #     #    #####  # # #
//  #   #  #   #  # # #  #       # #     #    #      # # #
//  #   #   ###   #   #   ###     #     ###    ###    # #
/**
 * A class that represents the home view.
 */
class HomeView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the rendered home template.
     * @param {{standings: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, wins1: number, losses1: number, ties1: number, wins2: number, losses2: number, ties2: number, wins3: number, losses3: number, ties3: number, winsMap: number, lossesMap: number, tiesMap: number}[], stats: {playerId: number, name: string, teamId: number, teamName: string, tag: string, disbanded: boolean, locked: boolean, kda: number}[], matches: {id: number, challengingTeam: Standing, challengedTeam: Standing, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number, gameType: string}[], news: DiscordJs.Message[], teams: Teams}} data The home page data.
     * @returns {string} An HTML string of the home page.
     */
    static get(data) {
        const {standings, stats, matches, news, teams} = data;

        let team;

        return /* html */`
            <div id="matches">
                ${matches.map((m) => /* html */`
                    <div class="match">
                        <div class="team1">
                            <div class="diamond${(team = teams.getTeam(m.challengingTeam.teamId, m.challengingTeam.name, m.challengingTeam.tag, m.challengingTeam.disbanded, m.challengingTeam.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                        </div>
                        <div class="team2">
                            <div class="diamond${(team = teams.getTeam(m.challengedTeam.teamId, m.challengedTeam.name, m.challengedTeam.tag, m.challengedTeam.disbanded, m.challengedTeam.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                        </div>
                        ${typeof m.challengingTeamScore === "number" ? /* html */`
                            <div class="numeric score1 ${m.dateClosed && m.challengingTeamScore > m.challengedTeamScore ? "winner" : ""}">
                                ${m.challengingTeamScore}
                            </div>
                        ` : /* html */`
                            <div class="numeric record1">
                                ${m.challengingTeam.rating ? `${Math.round(m.challengingTeam.rating)},` : ""} ${m.challengingTeam.wins}-${m.challengingTeam.losses}${m.challengingTeam.ties === 0 ? "" : `-${m.challengingTeam.ties}`}
                            </div>
                        `}
                        ${typeof m.challengedTeamScore === "number" ? /* html */`
                            <div class="numeric score2 ${m.dateClosed && m.challengedTeamScore > m.challengingTeamScore ? "winner" : ""}">
                                ${m.challengedTeamScore}
                            </div>
                        ` : /* html */`
                            <div class="numeric record2">
                                ${m.challengedTeam.rating ? `${Math.round(m.challengedTeam.rating)},` : ""} ${m.challengedTeam.wins}-${m.challengedTeam.losses}${m.challengedTeam.ties === 0 ? "" : `-${m.challengedTeam.ties}`}
                            </div>
                        `}
                        <div class="game-type game-type-${m.gameType.toLowerCase()}"></div>
                        <div class="date">
                            ${m.matchTime ? /* html */`
                                <a href="/match/${m.id}/${m.challengingTeam.tag}/${m.challengedTeam.tag}"><script>document.write(Common.formatDate(new Date("${m.matchTime}")));</script></a>
                            ` : "Unscheduled"}
                        </div>
                        ${m.map ? /* html */`
                            <div class="map">${m.map}${m.overtimePeriods > 0 ? `, ${m.overtimePeriods > 1 ? m.overtimePeriods : ""}OT` : ""}</div>
                        ` : ""}
                    </div>
                `).join("")}
            </div>
            <div id="body">
                <div>
                    <div class="section">Season Top Teams</div>
                    <div id="standings">
                        <div class="header">Pos</div>
                        <div class="header">Tag</div>
                        <div class="header team-name">Team Name</div>
                        <div class="header">Rating</div>
                        <div class="header">Record</div>
                        ${standings.filter((s) => !s.disbanded && (s.wins > 0 || s.losses > 0 || s.ties > 0)).map((s, index) => /* html */`
                            <div class="numeric">${index + 1}</div>
                            <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.name, s.tag, s.disbanded, s.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                            <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                            <div class="numeric ${s.wins + s.losses + s.ties < 10 ? "provisional" : ""}">${Math.round(s.rating)}</div>
                            <div class="numeric">${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}</div>
                        `).slice(0, 5).join("")}
                    </div>
                </div>
                <div>
                    <div class="section">Season Top Players</div>
                    <div id="players">
                        <div class="header">Pos</div>
                        <div class="header">Team</div>
                        <div class="header">Name</div>
                        <div class="header">TA KDA</div>
                        ${stats.map((s, index) => /* html */`
                            <div class="numeric pos">${index + 1}</div>
                            <div class="tag">${(team = teams.getTeam(s.teamId, s.name, s.tag, s.disbanded, s.locked)) === void 0 ? "" : /* html */`
                                <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                            `}</div>
                            <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(HomeView.Common.normalizeName(s.name, team ? team.tag : ""))}">${HomeView.Common.htmlEncode(HomeView.Common.normalizeName(s.name, team ? team.tag : ""))}</a></div>
                            <div class="numeric value">${s.kda.toFixed(3)}</div>
                        `).join("")}
                    </div>
                </div>
            </div>
            <div id="news">
                <div class="section">News</div>
                <div id="articles">
                    ${news.map((n) => /* html */`
                        <div class="author">Posted by ${HomeView.Common.htmlEncode(n.member.displayName)}, <span><script>document.write(Common.formatDate(new Date(${n.createdTimestamp})));</script></span></div>
                        <div class="body">${n.content}</div>
                    `).join("")}
                </div>
            </div>
        `;
    }
}

/**
 * @type {typeof import("../../web/includes/common")}
 */
// @ts-ignore
HomeView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = HomeView; // eslint-disable-line no-undef
}
