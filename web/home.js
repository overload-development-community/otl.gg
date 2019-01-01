const HtmlMinifier = require("html-minifier"),
    DiscordMarkdown = require("discord-markdown"),

    Common = require("./common"),

    Db = require("../database"),
    Discord = require("../discord"),
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
         * @type {{challengingTeamStandings?: Standing, challengedTeamStandings?: Standing, challengingTeamId: number, challengedTeamId: number, challengingTeamScore: number, challengedTeamScore: number, matchTime: Date, map: string, dateClosed: Date}[]}
         */
        const matches = await Db.upcomingMatches();

        matches.forEach((match) => {
            match.challengingTeamStandings = standings.find((s) => s.teamId === match.challengingTeamId);
            match.challengedTeamStandings = standings.find((s) => s.teamId === match.challengedTeamId);
        });

        const news = await Discord.announcementsChannel.fetchMessages({limit: 5});

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/home.css">
        `, /* html */`
            <div id="matches">
                ${matches.map((m) => /* html */`
                    <div class="match">
                        <div class="team1">
                            <div class="diamond${m.challengingTeamStandings.team.role && m.challengingTeamStandings.team.role.color ? "" : "-empty"}" ${m.challengingTeamStandings.team.role && m.challengingTeamStandings.team.role.color ? `style="background-color: ${m.challengingTeamStandings.team.role.hexColor};"` : ""}></div> <a href="/team/${m.challengingTeamStandings.team.tag}">${m.challengingTeamStandings.team.tag}</a>
                        </div>
                        <div class="team2">
                            <div class="diamond${m.challengedTeamStandings.team.role && m.challengedTeamStandings.team.role.color ? "" : "-empty"}" ${m.challengedTeamStandings.team.role && m.challengedTeamStandings.team.role.color ? `style="background-color: ${m.challengedTeamStandings.team.role.hexColor};"` : ""}></div> <a href="/team/${m.challengedTeamStandings.team.tag}">${m.challengedTeamStandings.team.tag}</a>
                        </div>
                        ${typeof m.challengingTeamScore === "number" ? /* html */`
                            <div class="score1 ${m.dateClosed && m.challengingTeamScore > m.challengedTeamScore ? "winner" : ""}">
                                ${m.challengingTeamScore}
                            </div>
                        ` : /* html */`
                            <div class="record1">
                                ${m.challengingTeamStandings.rating ? Math.round(m.challengingTeamStandings.rating) : ""} ${m.challengingTeamStandings.wins}-${m.challengingTeamStandings.losses}${m.challengingTeamStandings.ties === 0 ? "" : `-${m.challengingTeamStandings.ties}`}
                            </div>
                        `}
                        ${typeof m.challengedTeamScore === "number" ? /* html */`
                            <div class="score2 ${m.dateClosed && m.challengedTeamScore > m.challengingTeamScore ? "winner" : ""}">
                                ${m.challengedTeamScore}
                            </div>
                        ` : /* html */`
                            <div class="record2">
                                ${m.challengedTeamStandings.rating ? Math.round(m.challengedTeamStandings.rating) : ""} ${m.challengedTeamStandings.wins}-${m.challengedTeamStandings.losses}${m.challengedTeamStandings.ties === 0 ? "" : `-${m.challengedTeamStandings.ties}`}
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
                        <div class="tag"><div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> <a href="/team/${s.team.tag}">${s.team.tag}</a></div>
                        <div><a href="/team/${s.team.tag}">${s.team.name}</a></div>
                        <div ${s.wins + s.losses + s.ties < 10 ? "class=\"provisional\"" : ""}>${Math.round(s.rating)}</div>
                        <div>${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}</div>
                    `).slice(0, 5).join("")}
                </div>
            </div>
            <div id="news">
                <div class="section">News</div>
                <div id="articles">
                    ${news.map((n) => /* html */`
                        <div class="author">Posted by ${Common.htmlEncode(Discord.findGuildMemberById(n.author.id).displayName)}, <span><script>document.write(formatDate(new Date(${n.createdTimestamp})));</script></span></div>
                        <div class="body">${DiscordMarkdown.toHTML(n.content, {discordCallback: {user: (user) => `@${Discord.findGuildMemberById(user.id).displayName}`, channel: (channel) => `#${Discord.findChannelById(channel.id).name}`, role: (role) => `@${Discord.findRoleById(role.id).name}`, emoji: () => ""}})}</div>
                    `).join("")}
                </div>
            </div>
        `);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

module.exports = Home.get;
