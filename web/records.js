const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Teams = require("./teams");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  ####                                   #
//  #   #                                  #
//  #   #   ###    ###    ###   # ##    ## #   ###
//  ####   #   #  #   #  #   #  ##  #  #  ##  #
//  # #    #####  #      #   #  #      #   #   ###
//  #  #   #      #   #  #   #  #      #  ##      #
//  #   #   ###    ###    ###   #       ## #  ####
/**
 * A class that represents the records page.
 */
class Records {
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
        const records = await Db.getRecords(),
            teams = new Teams();

        let team;

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/records.css" />
        `, /* html */`
            <div class="section">Records</div>
            <div id="records">
                <div class="header category">Category</div>
                <div class="header holder">Holder</div>
                <div class="header">Record</div>
                <div class="header opponent">Opponent</div>
                <div class="header date">Date</div>
                <div class="header map">Map</div>
                <div class="record-header" style="grid-row-end: span ${records.teamKda.length};">Team KDA</div>
                ${[2, 3, 4].map((teamSize) => /* html */`
                    <div style="grid-row-end: span ${records.teamKda.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                    ${records.teamKda.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                        <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${r.teamKda.toFixed(3)} KDA</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="date"><script>document.write(formatDate(new Date("${r.matchTime}")));</script></div>
                        <div class="map">${r.map}</div>
                    `).join("")}
                `).join("")}
                <div class="record-header" style="grid-row-end: span ${records.teamScore.length};">Team Score</div>
                ${[2, 3, 4].map((teamSize) => /* html */`
                    <div style="grid-row-end: span ${records.teamScore.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                    ${records.teamScore.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                        <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${r.score} Points</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="date"><script>document.write(formatDate(new Date("${r.matchTime}")));</script></div>
                        <div class="map">${r.map}</div>
                    `).join("")}
                `).join("")}
                <div class="record-header" style="grid-row-end: span ${records.teamAssists.length};">Team Assists</div>
                ${[2, 3, 4].map((teamSize) => /* html */`
                    <div style="grid-row-end: span ${records.teamAssists.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                    ${records.teamAssists.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                        <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${r.assists} Assists</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="date"><script>document.write(formatDate(new Date("${r.matchTime}")));</script></div>
                        <div class="map">${r.map}</div>
                    `).join("")}
                `).join("")}
                <div class="record-header" style="grid-row-end: span ${records.teamDeaths.length};">Team Fewest Deaths</div>
                ${[2, 3, 4].map((teamSize) => /* html */`
                    <div style="grid-row-end: span ${records.teamDeaths.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                    ${records.teamDeaths.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                        <div class="tag team-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${r.deaths} Deaths</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="date"><script>document.write(formatDate(new Date("${r.matchTime}")));</script></div>
                        <div class="map">${r.map}</div>
                    `).join("")}
                `).join("")}
                <div class="record-header" style="grid-row-end: span ${records.kda.length};">KDA</div>
                ${[2, 3, 4].map((teamSize) => /* html */`
                    <div style="grid-row-end: span ${records.kda.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                    ${records.kda.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                        <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${Common.htmlEncode(Common.normalizeName(r.name, r.tag))}</div>
                        <div>${r.kda.toFixed(2)} KDA</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="date"><script>document.write(formatDate(new Date("${r.matchTime}")));</script></div>
                        <div class="map">${r.map}</div>
                    `).join("")}
                `).join("")}
                <div class="record-header" style="grid-row-end: span ${records.kills.length};">Kills</div>
                ${[2, 3, 4].map((teamSize) => /* html */`
                    <div style="grid-row-end: span ${records.kills.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                    ${records.kills.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                        <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${Common.htmlEncode(Common.normalizeName(r.name, r.tag))}</div>
                        <div>${r.kills} Kills</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="date"><script>document.write(formatDate(new Date("${r.matchTime}")));</script></div>
                        <div class="map">${r.map}</div>
                    `).join("")}
                `).join("")}
                <div class="record-header" style="grid-row-end: span ${records.assists.length};">Assists</div>
                ${[2, 3, 4].map((teamSize) => /* html */`
                    <div style="grid-row-end: span ${records.assists.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                    ${records.assists.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                        <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${Common.htmlEncode(Common.normalizeName(r.name, r.tag))}</div>
                        <div>${r.assists} Assists</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="date"><script>document.write(formatDate(new Date("${r.matchTime}")));</script></div>
                        <div class="map">${r.map}</div>
                    `).join("")}
                `).join("")}
                <div class="record-header" style="grid-row-end: span ${records.deaths.length};">Fewest Deaths</div>
                ${[2, 3, 4].map((teamSize) => /* html */`
                    <div style="grid-row-end: span ${records.deaths.filter((r) => r.teamSize === teamSize).length}">${teamSize}v${teamSize}</div>
                    ${records.deaths.filter((r) => r.teamSize === teamSize).map((r) => /* html */`
                        <div class="tag player-tag"><div class="diamond${(team = teams.getTeam(r.teamId, r.teamName, r.tag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div>${Common.htmlEncode(Common.normalizeName(r.name, r.tag))}</div>
                        <div>${r.deaths} Deaths</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(r.opponentTeamId, r.opponentTeamName, r.opponentTag)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="date"><script>document.write(formatDate(new Date("${r.matchTime}")));</script></div>
                        <div class="map">${r.map}</div>
                    `).join("")}
                `).join("")}
            </div>
        `, req);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

module.exports = Records.get;
