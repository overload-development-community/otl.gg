const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

    Db = require("../database"),
    settings = require("../settings"),
    Teams = require("./teams");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//   ###    #                       #    #
//  #   #   #                       #
//  #      ####    ###   # ##    ## #   ##    # ##    ## #   ###
//   ###    #         #  ##  #  #  ##    #    ##  #  #  #   #
//      #   #      ####  #   #  #   #    #    #   #   ##     ###
//  #   #   #  #  #   #  #   #  #  ##    #    #   #  #          #
//   ###     ##    ####  #   #   ## #   ###   #   #   ###   ####
//                                                   #   #
//                                                    ###
/**
 * A class that represents the standings page.
 */
class Standings {
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

        let records, records1, records2, records3;
        switch (req.query.records) {
            case "server":
                records = "Server Records";
                records1 = "Home";
                records2 = "Away";
                records3 = "Neutral";
                break;
            case "size":
                records = "Team Size";
                records1 = "2v2";
                records2 = "3v3";
                records3 = "4v4";
                break;
            default:
                records = "Map Records";
                records1 = "Home";
                records2 = "Away";
                records3 = "Neutral";
                break;
        }

        const seasonList = await Db.seasonList(),
            season = Number.parseInt(req.query.season, 10) || void 0,
            maps = await Db.playedMapsForSeason(season),
            teams = new Teams();

        let map, team;
        if (maps.indexOf(req.query.map) !== -1) {
            map = req.query.map;
        }

        const standings = await Db.seasonStandings(isNaN(season) ? void 0 : season, records, map);

        const html = Common.page(/* html */`
            <link rel="stylesheet" href="/css/standings.css" />
        `, /* html */`
            <div id="options">
                <span class="grey">Standings for Season:</span> ${seasonList.map((seasonNumber, index) => /* html */`
                    ${season && season !== seasonNumber || index + 1 !== seasonList.length ? /* html */`<a href="/standings?season=${seasonNumber}${req.query.records ? `&records=${req.query.records}` : ""}${map ? `&map=${map}` : ""}">${seasonNumber}</a>` : seasonNumber}
                `).join(" | ")}<br />
                <span class="grey">Record Splits:</span> ${records === "Map Records" ? "Map Records" : /* html */`<a href="/standings?records=map${req.query.season ? `&season=${req.query.season}` : ""}${map ? `&map=${map}` : ""}">Map Records</a>`} | ${records === "Server Records" ? "Server Records" : /* html */`<a href="/standings?records=server${req.query.season ? `&season=${req.query.season}` : ""}${map ? `&map=${map}` : ""}">Server Records</a>`} | ${records === "Team Size" ? "Team Size" : /* html */`<a href="/standings?records=size${req.query.season ? `&season=${req.query.season}` : ""}${map ? `&map=${map}` : ""}">Team Size</a>`}<br />
                ${maps.length > 0 ? /* html */`
                    <span class="grey">Map:</span> ${map ? /* html */`<a href="/standings?map=none${req.query.season ? `&season=${req.query.season}` : ""}${req.query.records ? `&records=${req.query.records}` : ""}">None</a>` : "None"} | ${maps.map((mapName) => /* html */`
                        ${map === mapName ? mapName : /* html */`<a href="/standings?map=${mapName}${req.query.season ? `&season=${req.query.season}` : ""}${req.query.records ? `&records=${req.query.records}` : ""}">${mapName}</a>`}
                    `).join(" | ")}
                ` : ""}
            </div>
            <div id="body">
                <div class="section">Season Standings</div>
                <div id="standings">
                    <div class="header before"></div>
                    <div class="header records">${records}</div>
                    <div class="header after"></div>
                    <div class="header pos">Pos</div>
                    <div class="header">Tag</div>
                    <div class="header team-name">Team Name</div>
                    <div class="header">Rating</div>
                    <div class="header">Record</div>
                    <div class="header">${records1}</div>
                    <div class="header">${records2}</div>
                    <div class="header">${records3}</div>
                    <div class="header">${map || ""}</div>
                ${standings.filter((s) => !s.disbanded).map((s, index) => /* html */`
                        <div class="pos numeric">${s.wins > 0 || s.losses > 0 || s.ties > 0 ? index + 1 : ""}</div>
                        <div class="tag"><div class="diamond${(team = teams.getTeam(s.teamId, s.name, s.tag, s.disbanded, s.locked)).role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> <a href="/team/${team.tag}">${team.tag}</a></div>
                        <div class="team-name"><a href="/team/${team.tag}">${team.name}</a></div>
                        <div class="numeric ${s.wins + s.losses + s.ties < 10 ? "provisional" : ""}">${s.rating ? Math.round(s.rating) : ""}</div>
                        <div class="numeric">${s.wins > 0 || s.losses > 0 || s.ties > 0 ? `${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}` : ""}</div>
                        <div class="numeric">${s.wins1 > 0 || s.losses1 > 0 || s.ties1 > 0 ? `${s.wins1}-${s.losses1}${s.ties1 === 0 ? "" : `-${s.ties1}`}` : ""}</div>
                        <div class="numeric">${s.wins2 > 0 || s.losses2 > 0 || s.ties2 > 0 ? `${s.wins2}-${s.losses2}${s.ties2 === 0 ? "" : `-${s.ties2}`}` : ""}</div>
                        <div class="numeric">${s.wins3 > 0 || s.losses3 > 0 || s.ties3 > 0 ? `${s.wins3}-${s.losses3}${s.ties3 === 0 ? "" : `-${s.ties3}`}` : ""}</div>
                        <div class="numeric">${s.winsMap > 0 || s.lossesMap > 0 || s.tiesMap > 0 ? `${s.winsMap}-${s.lossesMap}${s.tiesMap === 0 ? "" : `-${s.tiesMap}`}` : ""}</div>
                `).join("")}
                </div>
                ${standings.filter((s) => s.disbanded).length > 0 ? /* html */`
                    <div class="section">Disbanded Teams</div>
                    <div id="disbanded">
                        <div class="header before"></div>
                        <div class="header records">${records}</div>
                        <div class="header after"></div>
                        <div class="header">Tag</div>
                        <div class="header">Team Name</div>
                        <div class="header">Rating</div>
                        <div class="header">Record</div>
                        <div class="header">${records1}</div>
                        <div class="header">${records2}</div>
                        <div class="header">${records3}</div>
                        <div class="header">${map || ""}</div>
                        ${standings.filter((s) => s.disbanded).map((s) => /* html */`
                            <div><a href="/team/${s.tag}">${s.tag}</a></div>
                            <div><a href="/team/${s.tag}">${s.name}</a></div>
                            <div class="numeric ${s.wins + s.losses + s.ties < 10 ? "provisional" : ""}">${s.rating ? Math.round(s.rating) : ""}</div>
                            <div class="numeric">${s.wins > 0 || s.losses > 0 || s.ties > 0 ? `${s.wins}-${s.losses}${s.ties === 0 ? "" : `-${s.ties}`}` : ""}</div>
                            <div class="numeric">${s.wins1 > 0 || s.losses1 > 0 || s.ties1 > 0 ? `${s.wins1}-${s.losses1}${s.ties1 === 0 ? "" : `-${s.ties1}`}` : ""}</div>
                            <div class="numeric">${s.wins2 > 0 || s.losses2 > 0 || s.ties2 > 0 ? `${s.wins2}-${s.losses2}${s.ties2 === 0 ? "" : `-${s.ties2}`}` : ""}</div>
                            <div class="numeric">${s.wins3 > 0 || s.losses3 > 0 || s.ties3 > 0 ? `${s.wins3}-${s.losses3}${s.ties3 === 0 ? "" : `-${s.ties3}`}` : ""}</div>
                            <div class="numeric">${s.winsMap > 0 || s.lossesMap > 0 || s.tiesMap > 0 ? `${s.winsMap}-${s.lossesMap}${s.tiesMap === 0 ? "" : `-${s.tiesMap}`}` : ""}</div>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
        `, req);

        res.status(200).send(HtmlMinifier.minify(html, settings.htmlMinifier));
    }
}

module.exports = Standings.get;
