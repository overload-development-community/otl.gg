const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Team = require("../team");

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

        /**
         * @typedef {{team?: Team, teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number}} Standing
         * @type {Standing[]}
         */
        const standings = await Db.seasonStandings();

        standings.forEach((standing) => {
            standing.team = new Team({
                id: standing.teamId,
                name: standing.name,
                tag: standing.tag,
                disbanded: standing.disbanded,
                locked: standing.locked
            });
        });

        /**
         * @type {{completed: {challengingTeamStandings?: Standing, challengedTeamStandings?: Standing, challengeId: number, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date}[], pending: {challengingTeamStandings?: Standing, challengedTeamStandings?: Standing, challengeId: number, challengingTeamId: number, challengedTeamId: number, matchTime: Date, map: string, twitchName: string}[], stats: {team?: Team, challengeId: number, teamId: number, tag: string, teamName: string, playerId: number, name: string, kills: number, assists: number, deaths: number, kda?: number}[]}}
         */
        const matches = await Db.seasonMatches();

        matches.completed.forEach((match) => {
            match.challengingTeamStandings = standings.find((s) => s.teamId === match.challengingTeamId);
            match.challengedTeamStandings = standings.find((s) => s.teamId === match.challengedTeamId);
        });

        matches.pending.forEach((match) => {
            match.challengingTeamStandings = standings.find((s) => s.teamId === match.challengingTeamId);
            match.challengedTeamStandings = standings.find((s) => s.teamId === match.challengedTeamId);
        });

        matches.stats.forEach((stat) => {
            stat.team = standings.find((s) => s.teamId === stat.teamId).team;
            stat.kda = (stat.kills + stat.assists) / Math.max(1, stat.deaths);
        });

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/matches.css">
        `, /* html */`
            <div id="matches">
                <div id="completed">
                    <div class="section">Completed Matches</div>
                    ${matches.completed.map((m) => /* html */`
                        <div class="match">
                            <div class="tag1">
                                <div class="diamond${m.challengingTeamStandings.team.role && m.challengingTeamStandings.team.role.color ? "" : "-empty"}" ${m.challengingTeamStandings.team.role && m.challengingTeamStandings.team.role.color ? `style="background-color: ${m.challengingTeamStandings.team.role.hexColor};"` : ""}></div> <a href="/team/${m.challengingTeamStandings.team.tag}">${m.challengingTeamStandings.team.tag}</a>
                            </div>
                            <div class="team1">
                                <a href="/team/${m.challengingTeamStandings.team.tag}">${m.challengingTeamStandings.team.name}</a>
                            </div>
                            <div class="record1">
                                ${Math.round(m.challengingTeamStandings.rating)} ${m.challengingTeamStandings.wins}-${m.challengingTeamStandings.losses}${m.challengingTeamStandings.ties === 0 ? "" : `-${m.challengingTeamStandings.ties}`}
                            </div>
                            <div class="score1 ${m.dateClosed && m.challengingTeamScore > m.challengedTeamScore ? "winner" : ""}">
                                ${m.challengingTeamScore}
                            </div>
                            <div class="tag2">
                                <div class="diamond${m.challengedTeamStandings.team.role && m.challengedTeamStandings.team.role.color ? "" : "-empty"}" ${m.challengedTeamStandings.team.role && m.challengedTeamStandings.team.role.color ? `style="background-color: ${m.challengedTeamStandings.team.role.hexColor};"` : ""}></div> <a href="/team/${m.challengedTeamStandings.team.tag}">${m.challengedTeamStandings.team.tag}</a>
                            </div>
                            <div class="team2">
                                <a href="/team/${m.challengedTeamStandings.team.tag}">${m.challengedTeamStandings.team.name}</a>
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
                                <div class="tag">${s.team ? /* html */`
                                    <div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> <a href="/team/${s.team.tag}">${s.team.tag}</a>
                                ` : ""}</div>
                                <div class="name">${Common.htmlEncode(Common.normalizeName(s.name, s.team.tag))}</div>
                                <div class="kda">${s.kda.toFixed(3)}</div>
                                <div class="kills">${s.kills}</div>
                                <div class="assists">${s.assists}</div>
                                <div class="deaths">${s.deaths}</div>
                            `).join("")}
                        </div>
                    `).join("")}
                </div>
                <div id="pending">
                    <div class="section">Pending Matches</div>
                    ${matches.pending.map((m) => /* html */`
                        <div class="match">
                            <div class="tag1">
                                <div class="diamond${m.challengingTeamStandings.team.role && m.challengingTeamStandings.team.role.color ? "" : "-empty"}" ${m.challengingTeamStandings.team.role && m.challengingTeamStandings.team.role.color ? `style="background-color: ${m.challengingTeamStandings.team.role.hexColor};"` : ""}></div> <a href="/team/${m.challengingTeamStandings.team.tag}">${m.challengingTeamStandings.team.tag}</a>
                            </div>
                            <div class="team1">
                                <a href="/team/${m.challengingTeamStandings.team.tag}">${m.challengingTeamStandings.team.name}</a>
                            </div>
                            <div class="record1">
                                ${m.challengingTeamStandings.rating ? Math.round(m.challengingTeamStandings.rating) : ""} ${m.challengingTeamStandings.wins}-${m.challengingTeamStandings.losses}${m.challengingTeamStandings.ties === 0 ? "" : `-${m.challengingTeamStandings.ties}`}
                            </div>
                            <div class="tag2">
                                <div class="diamond${m.challengedTeamStandings.team.role && m.challengedTeamStandings.team.role.color ? "" : "-empty"}" ${m.challengedTeamStandings.team.role && m.challengedTeamStandings.team.role.color ? `style="background-color: ${m.challengedTeamStandings.team.role.hexColor};"` : ""}></div> <a href="/team/${m.challengedTeamStandings.team.tag}">${m.challengedTeamStandings.team.tag}</a>
                            </div>
                            <div class="team2">
                                <a href="/team/${m.challengedTeamStandings.team.tag}">${m.challengedTeamStandings.team.name}</a>
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
                            ${m.twitchName ? /* html */`
                                <div class="caster">
                                    Watch at <a href="https://twitch.tv/${encodeURIComponent(m.twitchName)}" target="_blank">https://twitch.tv/${Common.htmlEncode(m.twitchName)}</a>
                                </div>
                            ` : ""}
                        </div>
                    `).join("")}
                </div>
            </div>
        `, req);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

module.exports = Matches.get;
