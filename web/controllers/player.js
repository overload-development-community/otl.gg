const HtmlMinifier = require("html-minifier"),

    Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    NotFoundView = require("../../public/views/404"),
    PlayerModel = require("../../src/models/player"),
    PlayerView = require("../../public/views/player"),
    settings = require("../../settings");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  ####    ##
//  #   #    #
//  #   #    #     ###   #   #   ###   # ##
//  ####     #        #  #   #  #   #  ##  #
//  #        #     ####  #  ##  #####  #
//  #        #    #   #   ## #  #      #
//  #       ###    ####      #   ###   #
//                       #   #
//                        ###
/**
 * A class that represents the player page.
 */
class Player {
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
        const playerId = isNaN(req.params.id) ? 0 : Number.parseInt(req.params.id, 10),
            season = isNaN(req.query.season) ? void 0 : Number.parseInt(req.query.season, 10),
            postseason = !!req.query.postseason,
            career = await PlayerModel.getCareer(playerId, season, postseason);

        if (career) {
            const seasonList = career.career.map((c) => c.season).filter((s, index, seasons) => seasons.indexOf(s) === index).sort(),
                teams = new Teams();

            teams.getTeam(career.player.teamId, career.player.teamName, career.player.tag);

            career.career.forEach((careerSeason) => {
                teams.getTeam(careerSeason.teamId, careerSeason.teamName, careerSeason.tag);
            });

            career.careerTeams.forEach((team) => {
                teams.getTeam(team.teamId, team.teamName, team.tag);
            });

            career.opponents.forEach((team) => {
                teams.getTeam(team.teamId, team.teamName, team.tag);
            });

            career.maps.forEach((map) => {
                teams.getTeam(map.bestOpponentTeamId, map.bestOpponentTeamName, map.bestOpponentTag);
            });

            career.matches.forEach((match) => {
                teams.getTeam(match.teamId, match.name, match.tag);
                teams.getTeam(match.opponentTeamId, match.opponentName, match.opponentTag);
            });

            const totals = {
                games: career.career.reduce((sum, stat) => sum + stat.games, 0),
                kills: career.career.reduce((sum, stat) => sum + stat.kills, 0),
                assists: career.career.reduce((sum, stat) => sum + stat.assists, 0),
                deaths: career.career.reduce((sum, stat) => sum + stat.deaths, 0),
                overtimePeriods: career.career.reduce((sum, stat) => sum + stat.overtimePeriods, 0)
            };

            res.status(200).send(Common.page(
                /* html */`
                    <link rel="stylesheet" href="/css/player.css" />
                `,
                PlayerView.get({
                    playerId,
                    player: career.player,
                    career: career.career,
                    totals,
                    careerTeams: career.careerTeams,
                    seasonList,
                    season,
                    postseason,
                    opponents: career.opponents,
                    maps: career.maps,
                    matches: career.matches,
                    teams
                }),
                req
            ));
        } else {
            res.status(404).send(Common.page(
                /* html */`
                    <link rel="stylesheet" href="/css/error.css" />
                `,
                NotFoundView.get({message: "This player does not exist."}),
                req
            ));
        }
    }
}

Player.route = {
    path: "/player/:id/:name"
};

module.exports = Player;
