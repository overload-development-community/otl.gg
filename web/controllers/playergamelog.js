const Common = require("../includes/common"),
    Teams = require("../includes/teams"),

    NotFoundView = require("../../public/views/404"),
    PlayerGameLogView = require("../../public/views/playergamelog"),
    PlayerModel = require("../../src/models/player");

/**
 * @typedef {import("express").Request} Express.Request
 * @typedef {import("express").Response} Express.Response
 */

//  ####    ##                                 ###                        #
//  #   #    #                                #   #                       #
//  #   #    #     ###   #   #   ###   # ##   #       ###   ## #    ###   #       ###    ## #
//  ####     #        #  #   #  #   #  ##  #  #          #  # # #  #   #  #      #   #  #  #
//  #        #     ####  #  ##  #####  #      #  ##   ####  # # #  #####  #      #   #   ##
//  #        #    #   #   ## #  #      #      #   #  #   #  # # #  #      #      #   #  #
//  #       ###    ####      #   ###   #       ###    ####  #   #   ###   #####   ###    ###
//                       #   #                                                          #   #
//                        ###                                                            ###
/**
 * A class that represents the player game log page.
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
        const playerId = isNaN(Number.parseInt(req.params.id, 10)) ? 0 : Number.parseInt(req.params.id, 10),
            season = isNaN(req.query.season) ? void 0 : Number.parseInt(req.query.season, 10),
            postseason = !!req.query.postseason,
            gameLog = await PlayerModel.getGameLog(playerId, season, postseason);

        if (gameLog) {
            const seasonList = gameLog.seasons,
                teams = new Teams();

            teams.getTeam(gameLog.player.teamId, gameLog.player.teamName, gameLog.player.tag);

            gameLog.matches.forEach((match) => {
                teams.getTeam(match.teamId, match.name, match.tag);
                teams.getTeam(match.opponentTeamId, match.opponentName, match.opponentTag);
            });

            res.status(200).send(Common.page(
                /* html */`
                    <link rel="stylesheet" href="/css/player.css" />
                `,
                PlayerGameLogView.get({
                    playerId,
                    player: gameLog.player,
                    seasonList,
                    season,
                    postseason,
                    matches: gameLog.matches,
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
    path: "/player/:id/:name/gamelog"
};

module.exports = Player;
