/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

const Challenge = require("../../src/models/challenge"),
    Common = require("../includes/common"),
    NotFoundView = require("../../public/views/404"),
    PlayerModel = require("../../src/models/player"),
    PlayerView = require("../../public/views/player"),
    Season = require("../../src/models/season"),
    Teams = require("../includes/teams");

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
        const queryGameType = req.query.gameType && req.query.gameType.toString() || void 0,
            querySeason = req.query.season && req.query.season.toString() || void 0,
            playerId = isNaN(Number.parseInt(req.params.id, 10)) ? 0 : Number.parseInt(req.params.id, 10),
            postseason = !!req.query.postseason,
            gameType = !queryGameType || ["TA", "CTF"].indexOf(queryGameType.toUpperCase()) === -1 ? "TA" : queryGameType.toUpperCase(),
            all = !!req.query.all,
            validSeasonNumbers = await Season.getSeasonNumbers();

        let season = isNaN(+querySeason) ? void 0 : Number.parseInt(querySeason, 10);

        validSeasonNumbers.push(0);
        if (validSeasonNumbers.indexOf(season) === -1) {
            season = void 0;
        }

        const career = await PlayerModel.getCareer(playerId, season, postseason, gameType, all);

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

            const totals = {
                games: career.career.reduce((sum, stat) => sum + stat.games, 0),
                captures: career.career.reduce((sum, stat) => sum + stat.captures, 0),
                pickups: career.career.reduce((sum, stat) => sum + stat.pickups, 0),
                carrierKills: career.career.reduce((sum, stat) => sum + stat.carrierKills, 0),
                returns: career.career.reduce((sum, stat) => sum + stat.returns, 0),
                kills: career.career.reduce((sum, stat) => sum + stat.kills, 0),
                assists: career.career.reduce((sum, stat) => sum + stat.assists, 0),
                deaths: career.career.reduce((sum, stat) => sum + stat.deaths, 0),
                damage: career.career.reduce((sum, stat) => sum + stat.damage, 0),
                gamesWithDamage: career.career.reduce((sum, stat) => sum + stat.gamesWithDamage, 0),
                deathsInGamesWithDamage: career.career.reduce((sum, stat) => sum + stat.deathsInGamesWithDamage, 0),
                overtimePeriods: career.career.reduce((sum, stat) => sum + stat.overtimePeriods, 0),
                primaries: (career.damage.Impulse || 0) + (career.damage.Cyclone || 0) + (career.damage.Reflex || 0) + (career.damage.Crusher || 0) + (career.damage.Driller || 0) + (career.damage.Flak || 0) + (career.damage.Thunderbolt || 0) + (career.damage.Lancer || 0),
                secondaries: (career.damage.Falcon || 0) + (career.damage["Missile Pod"] || 0) + (career.damage.Hunter || 0) + (career.damage.Creeper || 0) + (career.damage.Nova || 0) + (career.damage.Devastator || 0) + (career.damage["Time Bomb"] || 0) + (career.damage.Vortex || 0),
                totalDamage: Object.keys(career.damage).reduce((sum, weapon) => sum + career.damage[weapon], 0)
            };

            res.status(200).send(await Common.page(
                `<meta name="description" content="${Challenge.getGameTypeName(gameType)} player stats for ${Common.attributeEncode(Common.normalizeName(career.player.name, career.player.tag))}${season ? ` for season ${season}` : ""}${postseason ? " in the postseason" : ""}." />`,
                {css: ["/css/player.css"]},
                PlayerView.get({
                    playerId,
                    player: career.player,
                    career: career.career,
                    totals,
                    careerTeams: career.careerTeams,
                    seasonList,
                    season,
                    postseason,
                    all,
                    gameType,
                    opponents: career.opponents,
                    maps: career.maps,
                    damage: career.damage,
                    teams
                }),
                req
            ));
        } else {
            res.status(404).send(await Common.page(
                "",
                {css: ["/css/error.css"]},
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
