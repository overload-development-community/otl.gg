const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Team = require("../team");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  #####                       ####
//    #                         #   #
//    #     ###    ###   ## #   #   #   ###    ## #   ###
//    #    #   #      #  # # #  ####       #  #  #   #   #
//    #    #####   ####  # # #  #       ####   ##    #####
//    #    #      #   #  # # #  #      #   #  #      #
//    #     ###    ####  #   #  #       ####   ###    ###
//                                            #   #
//                                             ###
/**
 * A class that represents the team page.
 */
class TeamPage {
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
        const tag = req.params.tag,
            team = await Team.getByNameOrTag(tag);

        if (team) {
            const teamInfo = await team.getInfo(),
                seasonList = await Db.seasonList(),
                season = Number.parseInt(req.query.season, 10) || void 0;

            /**
             * @type {{records: {teamId: number, name: string, tag: string, disbanded: boolean, locked: boolean, rating: number, wins: number, losses: number, ties: number, winsMap1: number, lossesMap1: number, tiesMap1: number, winsMap2: number, lossesMap2: number, tiesMap2: number, winsMap3: number, lossesMap3: number, tiesMap3: number, winsServer1: number, lossesServer1: number, tiesServer1: number, winsServer2: number, lossesServer2: number, tiesServer2: number, winsServer3: number, lossesServer3: number, tiesServer3: number, wins2v2: number, losses2v2: number, ties2v2: number, wins3v3: number, losses3v3: number, ties3v3: number, wins4v4: number, losses4v4: number, ties4v4: number}, opponents: {team?: Team, teamId: number, name: string, tag: string, wins: number, losses: number, ties: number}[], maps: {map: string, wins: number, losses: number, ties: number}[], matches: {challengingTeam?: Team, challengedTeam?: Team, statTeam?: Team, challengingTeamId: number, challengingTeamName: string, challengingTeamTag: string, challengingTeamScore: number, challengedTeamId: number, challengedTeamName: string, challengedTeamTag: string, challengedTeamScore: number, map: string, matchTime: Date, statTeamId: number, statTeamName: string, statTeamTag: string, playerId: number, name: string, kills: number, deaths: number, assists: number}[], stats: {team?: Team, playerId: number, name: string, games: number, kills: number, assists: number, deaths: number, teamId: number, teamName: string, teamTag: string, map: string, matchTime: Date, bestKills: number, bestAssists: number, bestDeaths: number}[]}}
             */
            const teamData = await Db.getTeamData(team, season);

            teamData.opponents.forEach((opponent) => {
                opponent.team = new Team({
                    id: opponent.teamId,
                    name: opponent.name,
                    tag: opponent.tag
                });
            });

            teamData.matches.forEach((match) => {
                match.challengingTeam = new Team({
                    id: match.challengingTeamId,
                    name: match.challengingTeamName,
                    tag: match.challengingTeamTag
                });
                match.challengedTeam = new Team({
                    id: match.challengedTeamId,
                    name: match.challengedTeamName,
                    tag: match.challengedTeamTag
                });
                match.statTeam = new Team({
                    id: match.statTeamId,
                    name: match.statTeamName,
                    tag: match.statTeamTag
                });
            });

            teamData.stats.forEach((stat) => {
                stat.team = new Team({
                    id: stat.teamId,
                    name: stat.teamName,
                    tag: stat.teamTag
                });
            });

            teamInfo.members.sort((a, b) => {
                if (a.role !== b.role) {
                    return ["Founder", "Captain", void 0].indexOf(a.role) - ["Founder", "Captain", void 0].indexOf(b.role);
                }
                return Common.normalizeName(a.name, team.tag).localeCompare(Common.normalizeName(b.name, team.tag));
            });

            teamData.stats.sort((a, b) => Common.normalizeName(a.name, team.tag).localeCompare(Common.normalizeName(b.name, team.tag)));

            const html = Common.page(/* html */`
                <link rel="stylesheet" href="/css/team.css">
            `, /* html */`
                <div id="team">
                    <div id="teamname">
                        <div id="tag"><div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> ${team.tag}</div>
                        <div id="name">${team.name}</div>
                    </div>
                    <div id="roster">
                        <div class="section">Current Roster</div>
                        ${teamInfo.members.map((m) => /* html */`
                            <div class="member">${Common.htmlEncode(Common.normalizeName(m.name, team.tag))} <span class="grey">${m.role ? `- ${m.role}` : ""}</span></div>
                        `).join("")}
                    </div>
                    <div id="homes">
                        <div class="section">Home Maps</div>
                        ${teamInfo.homes.map((h) => /* html */`
                            <div>${h}</div>
                        `).join("")}
                    </div>
                    <div id="timezone">
                        <div class="section">Primary Time Zone</div>
                        <div>${await team.getTimezone()}</div>
                    </div>
                </div>
                <div class="section">Season Records</div>
                <div id="options">
                    <div class="season">
                        <span class="grey">Standings for Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                            ${season && season !== seasonNumber || index + 1 !== seasonList.length ? /* html */`<a href="/team/${team.tag}?season=${seasonNumber}">${seasonNumber}</a>` : seasonNumber}
                        `).join(" | ")}
                    </div>
                </div>
                ${teamData.records && (teamData.records.wins > 0 || teamData.records.losses > 0 || teamData.records.ties > 0) ? /* html */`
                    <div id="records">
                        <div class="overall">
                            <div>Overall: ${teamData.records.wins}-${teamData.records.losses}${teamData.records.ties ? `-${teamData.records.ties}` : ""}</div>
                            <div>Rating: <span ${teamData.records.wins + teamData.records.losses + teamData.records.ties < 10 ? "class=\"provisional\"" : ""}>${Math.round(teamData.records.rating)}</span></div>
                        </div>
                        <div class="splits">
                            <div>Home Map Record: ${teamData.records.winsMap1}-${teamData.records.lossesMap1}${teamData.records.tiesMap1 ? `-${teamData.records.tiesMap1}` : ""}</div>
                            <div>Home Server Record: ${teamData.records.winsServer1}-${teamData.records.lossesServer1}${teamData.records.tiesServer1 ? `-${teamData.records.tiesServer1}` : ""}</div>
                            <div>2v2 Record: ${teamData.records.wins2v2}-${teamData.records.losses2v2}${teamData.records.ties2v2 ? `-${teamData.records.ties2v2}` : ""}</div>
                            <div>Away Map Record: ${teamData.records.winsMap2}-${teamData.records.lossesMap2}${teamData.records.tiesMap2 ? `-${teamData.records.tiesMap2}` : ""}</div>
                            <div>Away Server Record: ${teamData.records.winsServer2}-${teamData.records.lossesServer2}${teamData.records.tiesServer2 ? `-${teamData.records.tiesServer2}` : ""}</div>
                            <div>3v3 Record: ${teamData.records.wins3v3}-${teamData.records.losses3v3}${teamData.records.ties3v3 ? `-${teamData.records.ties3v3}` : ""}</div>
                            <div>Neutral Map Record: ${teamData.records.winsMap3}-${teamData.records.lossesMap3}${teamData.records.tiesMap3 ? `-${teamData.records.tiesMap3}` : ""}</div>
                            <div>Neutral Server Record: ${teamData.records.winsServer3}-${teamData.records.lossesServer3}${teamData.records.tiesServer3 ? `-${teamData.records.tiesServer3}` : ""}</div>
                            <div>4v4 Record: ${teamData.records.wins4v4}-${teamData.records.losses4v4}${teamData.records.ties4v4 ? `-${teamData.records.ties4v4}` : ""}</div>
                        </div>
                        <div class="breakdown">
                            <div class="opponents">
                                <div class="header">Tag</div>
                                <div class="header">Opponent</div>
                                <div class="header">Record</div>
                                ${teamData.opponents.map((opponent) => /* html */`
                                    <div class="tag"><div class="diamond${opponent.team.role && opponent.team.role.color ? "" : "-empty"}" ${opponent.team.role && opponent.team.role.color ? `style="background-color: ${opponent.team.role.hexColor};"` : ""}></div> <a href="/team/${opponent.team.tag}">${opponent.team.tag}</a></div>
                                    <div><a href="/team/${opponent.team.tag}">${opponent.team.name}</a></div>
                                    <div>${opponent.wins}-${opponent.losses}${opponent.ties ? `-${opponent.ties}` : ""}</div>
                                `).join("")}
                            </div>
                            <div class="maps">
                                <div class="header">Map</div>
                                <div class="header">Record</div>
                                ${teamData.maps.map((map) => /* html */`
                                    <div class="map">${map.map}</div>
                                    <div>${map.wins}-${map.losses}${map.ties ? `-${map.ties}` : ""}</div>
                                `).join("")}
                            </div>
                        </div>
                    </div>
                    <div class="section">Season Matches</div>
                    <div id="matches">
                        <div class="header team">Challenging Team</div>
                        <div class="header team">Challenged Team</div>
                        <div class="header">Map</div>
                        <div class="header">Date</div>
                        <div class="header player">Top Performer</div>
                        ${teamData.matches.map((m) => /* html */`
                            <div class="tag"><div class="diamond${m.challengingTeam.role && m.challengingTeam.role.color ? "" : "-empty"}" ${m.challengingTeam.role && m.challengingTeam.role.color ? `style="background-color: ${m.challengingTeam.role.hexColor};"` : ""}></div> <a href="/team/${m.challengingTeam.tag}">${m.challengingTeam.tag}</a></div>
                            <div><a href="/team/${m.challengingTeam.tag}">${m.challengingTeam.name}</a></div>
                            <div class="score ${m.challengingTeamScore > m.challengedTeamScore ? "winner" : ""}">${m.challengingTeamScore}</div>
                            <div class="tag"><div class="diamond${m.challengedTeam.role && m.challengedTeam.role.color ? "" : "-empty"}" ${m.challengedTeam.role && m.challengedTeam.role.color ? `style="background-color: ${m.challengedTeam.role.hexColor};"` : ""}></div> <a href="/team/${m.challengedTeam.tag}">${m.challengedTeam.tag}</a></div>
                            <div><a href="/team/${m.challengedTeam.tag}">${m.challengedTeam.name}</a></div>
                            <div class="score ${m.challengingTeamScore < m.challengedTeamScore ? "winner" : ""}">${m.challengedTeamScore}</div>
                            <div>${m.map}</div>
                            <div><script>document.write(formatDate(new Date("${m.matchTime}")));</script></div>
                            <div class="tag"><div class="diamond${m.statTeam.role && m.statTeam.role.color ? "" : "-empty"}" ${m.statTeam.role && m.statTeam.role.color ? `style="background-color: ${m.statTeam.role.hexColor};"` : ""}></div> <a href="/team/${m.statTeam.tag}">${m.statTeam.tag}</a></div>
                            <div>${Common.htmlEncode(Common.normalizeName(m.name, m.statTeam.tag))}</div>
                            <div>${((m.kills + m.assists) / Math.max(1, m.deaths)).toFixed(2)} KDA (${m.kills} K, ${m.assists} A, ${m.deaths} D)</div>
                        `).join("")}
                    </div>
                    <div class="section">Season Player Stats</div>
                    <div id="stats">
                        <div class="header">Player</div>
                        <div class="header">G</div>
                        <div class="header">KDA</div>
                        <div class="header">K</div>
                        <div class="header">A</div>
                        <div class="header">D</div>
                        <div class="header">KPG</div>
                        <div class="header">APG</div>
                        <div class="header">DPG</div>
                        <div class="header best">Best Performance Vs.</div>
                        ${teamData.stats.map((s) => /* html */`
                            <div>${Common.htmlEncode(Common.normalizeName(s.name, team.tag))}</div>
                            <div>${s.games}</div>
                            <div>${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(3)}</div>
                            <div>${s.kills}</div>
                            <div>${s.assists}</div>
                            <div>${s.deaths}</div>
                            <div>${(s.kills / s.games).toFixed(2)}</div>
                            <div>${(s.assists / s.games).toFixed(2)}</div>
                            <div>${(s.deaths / s.games).toFixed(2)}</div>
                            <div class="tag"><div class="diamond${s.team.role && s.team.role.color ? "" : "-empty"}" ${s.team.role && s.team.role.color ? `style="background-color: ${s.team.role.hexColor};"` : ""}></div> <a href="/team/${s.team.tag}">${s.team.tag}</a></div>
                            <div>${s.map}</div>
                            <div><script>document.write(formatDate(new Date("${s.matchTime}")));</script></div>
                            <div>${((s.kills + s.assists) / Math.max(1, s.deaths)).toFixed(2)} KDA (${s.kills} K, ${s.assists} A, ${s.deaths} D)</div>
                        `).join("")}
                    </div>
                ` : ""}
            `);

            res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
        } else {
            const html = Common.page("", /* html */`
                <div class="section">Team Not Found</div>
            `);

            res.status(404).send(HtmlMinifier.minify(html, settings.htmlMinifier));
        }
    }
}

module.exports = TeamPage.get;
