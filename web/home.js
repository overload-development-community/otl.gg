const {minify} = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Team = require("../team");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   #   #
//   #   #
//   #   #   ###   ## #    ###
//   #####  #   #  # # #  #   #
//   #   #  #   #  # # #  #####
//   #   #  #   #  # # #  #
//   #   #   ###   #   #   ###
/**
 * A class that represents the home page.
 */
class Home {
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
         * @type {{challengingTeamStandings?: Standing, challengedTeamStandings?: Standing, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string}[]}
         */
        const matches = await Db.upcomingMatches();

        matches.forEach((match) => {
            match.challengingTeamStandings = standings.find((s) => s.teamId === match.challengingTeamId);
            match.challengedTeamStandings = standings.find((s) => s.teamId === match.challengedTeamId);
        });

        const html = Common.page(/* html */`
            <div id="header">
                <div id="logo"></div>
                <div id="title">Overload Teams League</div>
            </div>
            <div id="matches">
                ${matches.map((m) => /* html */`
                    <div class="match">
                        <div class="team1">
                            <div class="diamond${m.challengingTeamStandings.team.role && m.challengingTeamStandings.team.role.color ? "" : "-empty"}" ${m.challengingTeamStandings.team.role && m.challengingTeamStandings.team.role.color ? `style="background-color: ${m.challengingTeamStandings.team.role.hexColor};"` : ""}></div> ${m.challengingTeamStandings.team.tag}
                        </div>
                        <div class="team2">
                            <div class="diamond${m.challengedTeamStandings.team.role && m.challengedTeamStandings.team.role.color ? "" : "-empty"}" ${m.challengedTeamStandings.team.role && m.challengedTeamStandings.team.role.color ? `style="background-color: ${m.challengedTeamStandings.team.role.hexColor};"` : ""}></div> ${m.challengedTeamStandings.team.tag}
                        </div>
                        ${typeof m.challengingTeamScore === "number" ? /* html */`
                            <div class="score1 ${m.challengingTeamScore > m.challengedTeamScore ? "winner" : ""}">
                                ${m.challengingTeamScore}
                            </div>
                        ` : /* html */`
                            <div class="record1">
                                ${m.challengingTeamStandings.rating ? `${Math.round(m.challengingTeamStandings.rating)}` : ""} ${m.challengingTeamStandings.wins}-${m.challengingTeamStandings.losses}${m.challengingTeamStandings.ties === 0 ? "" : `-${m.challengingTeamStandings.ties}`}
                            </div>
                        `}
                        ${typeof m.challengedTeamScore === "number" ? /* html */`
                            <div class="score2 ${m.challengedTeamScore > m.challengingTeamScore ? "winner" : ""}">
                                ${m.challengedTeamScore}
                            </div>
                        ` : /* html */`
                            <div class="record2">
                                ${m.challengedTeamStandings.rating ? `${Math.round(m.challengedTeamStandings.rating)}` : ""} ${m.challengedTeamStandings.wins}-${m.challengedTeamStandings.losses}${m.challengedTeamStandings.ties === 0 ? "" : `-${m.challengedTeamStandings.ties}`}
                            </div>
                        `}
                        <div class="date">
                            ${m.matchTime ? /* html */`
                                <script>document.write(formatDate(new Date("${m.matchTime}")));</script>
                            ` : "Unscheduled"}
                        </div>
                        ${m.map ? /* html */`
                            <div class="map">${m.map}</div>
                        ` : ""}
                    </div>
                `).join("")}
            </div>
            <script>document.getElementById("header").style.backgroundImage = "url(/images/" + randomBackground() + ")";</script>
            <div id="body">
                <div class="section">Season Top Teams</div>
                <div id="standings">
                    <div class="header">Pos</div>
                    <div class="header">Tag</div>
                    <div class="header">Team Name</div>
                    <div class="header">Rating</div>
                    <div class="header">Record</div>
                    ${standings.filter((s) => !s.disbanded && (s.wins > 0 || s.losses > 0 || s.ties > 0)).map((s, index) => /* html */`
                        <div>${index + 1}</div>
                        <div class="tag"><div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> ${s.team.tag}</div>
                        <div>${s.team.name}</div>
                        <div ${s.wins + s.losses + s.ties < 10 ? "class=\"provisional\"" : ""}>${Math.round(s.rating)}</div>
                        <div>${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}</div>
                    `).slice(0, 5).join("")}
                </div>
            </div>
        `);

        res.status(200).send(minify(html, settings.htmlMinifier));
    }
}

module.exports = Home.get;
