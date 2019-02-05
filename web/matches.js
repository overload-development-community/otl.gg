const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Teams = require("./teams");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #   #          #            #
//  #   #          #            #
//  ## ##   ###   ####    ###   # ##    ###    ###
//  # # #      #   #     #   #  ##  #  #   #  #
//  #   #   ####   #     #      #   #  #####   ###
//  #   #  #   #   #  #  #   #  #   #  #          #
//  #   #   ####    ##    ###   #   #   ###   ####
/**
 * A class that represents the matches page.
 */
class Matches {
    //              #
    //              #
    //  ###   ##   ###
    // #  #  # ##   #
    //  ##   ##     #
    // #      ##     ##
    //  ###
    /**
     * Processes the request.
     * @param {Express.Request} req The request.
     * @param {Express.Response} res The response.
     * @returns {Promise} A promise that resolves when the request is complete.
     */
    static async get(req, res) {
        const matchesPerPage = 10,
            standings = await Db.seasonStandings(),
            teams = new Teams();
        let team;

        /**
         * @type {{completed: {challengingTeamStandings?: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}, challengedTeamStandings?: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}, challengeId: number, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date}[], pending: {challengingTeamStandings?: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}, challengedTeamStandings?: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}, timeRemaining?: number, challengeId: number, challengingTeamId: number, challengedTeamId: number, matchTime: Date, map: string, twitchName: string}[], stats: {challengeId: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, kills: number, assists: number, deaths: number, kda?: number}[]}}
         */
        const matches = await Db.seasonMatches();

        matches.completed.forEach((match) => {
            match.challengingTeamStandings = standings.find((s) => s.teamId === match.challengingTeamId);
            match.challengedTeamStandings = standings.find((s) => s.teamId === match.challengedTeamId);
        });

        matches.pending.forEach((match) => {
            match.challengingTeamStandings = standings.find((s) => s.teamId === match.challengingTeamId);
            match.challengedTeamStandings = standings.find((s) => s.teamId === match.challengedTeamId);
            match.timeRemaining = match.matchTime.getTime() - new Date().getTime();
        });

        matches.stats.forEach((stat) => {
            stat.kda = (stat.kills + stat.assists) / Math.max(1, stat.deaths);
        });

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/matches.css" />
            <script src="/js/countdown.js"></script>
            <script src="/js/matches.js"></script>
        `, /* html */`
            <div id="matches">
                ${matches.pending.length === 0 ? "" : /* html */`
                    <div id="pending">
                        <div class="section">Pending Matches</div>
                        <div class="matches">
                            ${matches.pending.map((m) => /* html */`
                                <div class="match">
                                    <div class="tag1">
                                        <div class="diamond${(team = teams.getTeam(m.challengingTeamId, m.challengingTeamStandings.name, m.challengingTeamStandings.tag, m.challengingTeamStandings.disbanded, m.challengingTeamStandings.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    </div>
                                    <div class="team1">
                                        <a href="/team/${team.tag}">${team.name}</a>
                                    </div>
                                    <div class="record1">
                                        ${m.challengingTeamStandings.rating ? Math.round(m.challengingTeamStandings.rating) : ""} ${m.challengingTeamStandings.wins}-${m.challengingTeamStandings.losses}${m.challengingTeamStandings.ties === 0 ? "" : `-${m.challengingTeamStandings.ties}`}
                                    </div>
                                    <div class="tag2">
                                        <div class="diamond${(team = teams.getTeam(m.challengedTeamId, m.challengedTeamStandings.name, m.challengedTeamStandings.tag, m.challengedTeamStandings.disbanded, m.challengedTeamStandings.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    </div>
                                    <div class="team2">
                                        <a href="/team/${team.tag}">${team.name}</a>
                                    </div>
                                    <div class="record2">
                                        ${m.challengedTeamStandings.rating ? Math.round(m.challengedTeamStandings.rating) : ""} ${m.challengedTeamStandings.wins}-${m.challengedTeamStandings.losses}${m.challengedTeamStandings.ties === 0 ? "" : `-${m.challengedTeamStandings.ties}`}
                                    </div>
                                    ${m.map ? /* html */`
                                        <div class="map">
                                            ${m.map}
                                        </div>
                                    ` : ""}
                                    <div class="date">
                                        <script>document.write(formatDate(new Date("${m.matchTime}")));</script>
                                    </div>
                                    <div class="countdown">
                                        <script>new Countdown(${m.timeRemaining});</script>
                                    </div>
                                    ${m.twitchName ? /* html */`
                                        <div class="caster">
                                            Watch at <a href="https://twitch.tv/${encodeURIComponent(m.twitchName)}" target="_blank">https://twitch.tv/${Common.htmlEncode(m.twitchName)}</a>
                                        </div>
                                    ` : m.map ? /* html */`
                                        <div class="caster">
                                            Watch at <a href="http://otl.gg/cast/${m.challengeId}" target="_blank">http://otl.gg/cast/${m.challengeId}</a>
                                        </div>
                                    ` : ""}
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `}
                <div id="completed">
                    <div class="section">Completed Matches</div>
                    ${matches.completed.length > matchesPerPage ? /* html */`
                        <div class="paginator">
                            <div class="paginator-text">
                                <div>Page:</div>
                            </div>
                            <div id="select-prev" class="paginator-page">
                                <div>&lt;&lt;</div>
                            </div>
                            ${Array.from(new Array(Math.ceil(matches.completed.length / matchesPerPage))).map((_, index) => /* html */`
                                <div class="paginator-page select-page select-page-${index} ${index === 0 ? "active" : ""}">
                                    <div>${index + 1}</div>
                                </div>
                            `).join("")}
                            <div id="select-next" class="paginator-page">
                                <div>&gt;&gt;</div>
                            </div>
                        </div>
                    ` : ""}
                    <div class="matches">
                        ${matches.completed.map((m, index) => /* html */`
                            <div class="page page-${Math.floor(index / matchesPerPage)} ${index >= matchesPerPage ? "hidden" : ""}">
                                <div class="match">
                                    <div class="tag1">
                                        <div class="diamond${(team = teams.getTeam(m.challengingTeamId, m.challengingTeamStandings.name, m.challengingTeamStandings.tag, m.challengingTeamStandings.disbanded, m.challengingTeamStandings.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    </div>
                                    <div class="team1">
                                        <a href="/team/${team.tag}">${team.name}</a>
                                    </div>
                                    <div class="record1">
                                        ${Math.round(m.challengingTeamStandings.rating)} ${m.challengingTeamStandings.wins}-${m.challengingTeamStandings.losses}${m.challengingTeamStandings.ties === 0 ? "" : `-${m.challengingTeamStandings.ties}`}
                                    </div>
                                    <div class="score1 ${m.dateClosed && m.challengingTeamScore > m.challengedTeamScore ? "winner" : ""}">
                                        ${m.challengingTeamScore}
                                    </div>
                                    <div class="tag2">
                                    <div class="diamond${(team = teams.getTeam(m.challengedTeamId, m.challengedTeamStandings.name, m.challengedTeamStandings.tag, m.challengedTeamStandings.disbanded, m.challengedTeamStandings.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                    </div>
                                    <div class="team2">
                                        <a href="/team/${team.tag}">${team.name}</a>
                                    </div>
                                    <div class="record2">
                                        ${Math.round(m.challengedTeamStandings.rating)} ${m.challengedTeamStandings.wins}-${m.challengedTeamStandings.losses}${m.challengedTeamStandings.ties === 0 ? "" : `-${m.challengedTeamStandings.ties}`}
                                    </div>
                                    <div class="score2 ${m.dateClosed && m.challengedTeamScore > m.challengingTeamScore ? "winner" : ""}">
                                        ${m.challengedTeamScore}
                                    </div>
                                    <div class="map">
                                        ${m.map}
                                    </div>
                                    <div class="date">
                                        <script>document.write(formatDate(new Date("${m.matchTime}")));</script>
                                    </div>
                                </div>
                                <div class="stats">
                                    <div class="header">Team</div>
                                    <div class="header">Name</div>
                                    <div class="header">KDA</div>
                                    <div class="header">Kills</div>
                                    <div class="header">Assists</div>
                                    <div class="header">Deaths</div>
                                    ${matches.stats.filter((s) => s.challengeId === m.challengeId).sort((a, b) => a.kda === b.kda ? a.kills === b.kills ? a.deaths - b.deaths : b.kills - a.kills : b.kda - a.kda).map((s) => /* html */ `
                                        <div class="tag">${(team = teams.getTeam(s.teamId, s.teamName, s.tag)) === null ? "" : /* html */`
                                            <div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a>
                                        `}</div>
                                        <div class="name"><a href="/player/${s.playerId}/${encodeURIComponent(Common.normalizeName(s.name, team.tag))}">${Common.htmlEncode(Common.normalizeName(s.name, team.tag))}</a></div>
                                        <div class="kda">${s.kda.toFixed(3)}</div>
                                        <div class="kills">${s.kills}</div>
                                        <div class="assists">${s.assists}</div>
                                        <div class="deaths">${s.deaths}</div>
                                    `).join("")}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        `, req);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

module.exports = Matches.get;
