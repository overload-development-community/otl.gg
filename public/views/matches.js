/**
 * @typedef {{teamId: number, name: string, tag: string, color: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}} TeamRecord
 */

//  #   #          #            #                    #   #    #
//  #   #          #            #                    #   #
//  ## ##   ###   ####    ###   # ##    ###    ###   #   #   ##     ###   #   #
//  # # #      #   #     #   #  ##  #  #   #  #       # #     #    #   #  #   #
//  #   #   ####   #     #      #   #  #####   ###    # #     #    #####  # # #
//  #   #  #   #   #  #  #   #  #   #  #          #   # #     #    #      # # #
//  #   #   ####    ##    ###   #   #   ###   ####     #     ###    ###    # #
/**
 * A class that represents the matches view.
 */
class MatchesView {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Gets the matches template.
     * @param {{seasonList: number[], season: number, pending: {challengeId: number, title: string, challengingTeam: TeamRecord, challengedTeam: TeamRecord, matchTime: Date, map: string, twitchName: string, timeRemaining: number}[], totalCompleted: number, completed: {match: {challengeId: number, title: string, challengingTeam: TeamRecord, challengedTeam: TeamRecord, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date, overtimePeriods: number}, stats: {teamId: number, tag: string, playerId: number, name: string, kda: number, kills: number, deaths: number, assists: number}[]}[], matchesPerPage: number}} data The matches data.
     * @returns {string} An HTML string of the matches.
     */
    static get(data) {
        const {seasonList, season, pending, totalCompleted, completed, matchesPerPage} = data;

        return /* html */`
            <div id="options">
                <span class="grey">Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${season && season !== seasonNumber || index + 1 !== seasonList.length ? /* html */`<a href="/matches?season=${seasonNumber}">${seasonNumber}</a>` : `<span id="season">${seasonNumber}</span>`}
                `).join(" | ")}
            </div>
            <div id="matches">
                ${pending.length === 0 ? "" : /* html */`
                    <div id="pending">
                        <div class="section">Pending Matches</div>
                        <div class="subsection">for Season ${season || Math.max(...seasonList)}</div>
                        <div class="matches">
                            ${pending.map((m) => /* html */`
                                <div class="match">
                                    ${m.title ? /* html */`
                                        <div class="title">${m.title}</div>
                                    ` : ""}
                                    <div class="tag1">
                                        <div class="diamond${m.challengingTeam.color ? "" : "-empty"}" ${m.challengingTeam.color ? `style="background-color: ${m.challengingTeam.color};"` : ""}></div> <a href="/team/${m.challengingTeam.tag}">${m.challengingTeam.tag}</a>
                                    </div>
                                    <div class="team1">
                                        <a href="/team/${m.challengingTeam.tag}">${m.challengingTeam.name}</a>
                                    </div>
                                    <div class="numeric record1">
                                        ${m.challengingTeam.rating ? `${Math.round(m.challengingTeam.rating)},` : ""} ${m.challengingTeam.wins}-${m.challengingTeam.losses}${m.challengingTeam.ties === 0 ? "" : `-${m.challengingTeam.ties}`}
                                    </div>
                                    <div class="tag2">
                                        <div class="diamond${m.challengedTeam.color ? "" : "-empty"}" ${m.challengedTeam.color ? `style="background-color: ${m.challengedTeam.color};"` : ""}></div> <a href="/team/${m.challengedTeam.tag}">${m.challengedTeam.tag}</a>
                                    </div>
                                    <div class="team2">
                                        <a href="/team/${m.challengedTeam.tag}">${m.challengedTeam.name}</a>
                                    </div>
                                    <div class="numeric record2">
                                        ${m.challengedTeam.rating ? `${Math.round(m.challengedTeam.rating)},` : ""} ${m.challengedTeam.wins}-${m.challengedTeam.losses}${m.challengedTeam.ties === 0 ? "" : `-${m.challengedTeam.ties}`}
                                    </div>
                                    ${m.map ? /* html */`
                                        <div class="map">
                                            ${m.map}
                                        </div>
                                    ` : ""}
                                    <div class="date">
                                        <script>document.write(Common.formatDate(new Date("${m.matchTime}")));</script>
                                    </div>
                                    <div class="countdown">
                                        <script>new Countdown(${m.timeRemaining});</script>
                                    </div>
                                    ${m.twitchName ? /* html */`
                                        <div class="caster">
                                            Watch at <a href="https://twitch.tv/${encodeURIComponent(m.twitchName)}" target="_blank">https://twitch.tv/${MatchesView.Common.htmlEncode(m.twitchName)}</a>
                                        </div>
                                    ` : m.map ? /* html */`
                                        <div class="caster">
                                            Watch at <a href="https://otl.gg/cast/${m.challengeId}" target="_blank">https://otl.gg/cast/${m.challengeId}</a>
                                        </div>
                                    ` : ""}
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `}
                ${totalCompleted === 0 ? "" : /* html */`
                    <div id="completed">
                        <div class="section">Completed Matches</div>
                        <div class="subsection">for Season ${season || Math.max(...seasonList)}</div>
                        ${totalCompleted > matchesPerPage ? /* html */`
                            <div class="paginator">
                                <div class="paginator-text">
                                    <div>Page:</div>
                                </div>
                                <div id="select-prev" class="paginator-page">
                                    <div>&lt;&lt;</div>
                                </div>
                                ${Array.from(new Array(Math.ceil(totalCompleted / matchesPerPage))).map((_, index) => /* html */`
                                    <div class="paginator-page select-page select-page-${index + 1} ${index === 0 ? "active" : ""}">
                                        <div class="numeric">${index + 1}</div>
                                    </div>
                                `).join("")}
                                <div id="select-next" class="paginator-page">
                                    <div>&gt;&gt;</div>
                                </div>
                            </div>
                        ` : ""}
                        <div class="matches" id="completed-matches">
                            ${completed.map((m) => MatchesView.MatchView.get(m)).join("")}
                        </div>
                    </div>
                `}
            </div>
        `;
    }
}

// @ts-ignore
MatchesView.Common = typeof Common === "undefined" ? require("../../web/includes/common") : Common; // eslint-disable-line no-undef
// @ts-ignore
MatchesView.MatchView = typeof MatchView === "undefined" ? require("./matches/match") : MatchView; // eslint-disable-line no-undef

if (typeof module !== "undefined") {
    module.exports = MatchesView; // eslint-disable-line no-undef
}
