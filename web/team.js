const HtmlMinifier = require("html-minifier"),

    Common = require("./common"),

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
            const teamInfo = await team.getInfo();

            const html = Common.page(/* html */`
                <link rel="stylesheet" href="/css/team.css">
            `, /* html */`
                <div id="team">
                    <div id="teamname">
                        <div id="tag"><div class="diamond${team.role && team.role.color ? "" : "-empty"}" ${team.role && team.role.color ? `style="background-color: ${team.role.hexColor};"` : ""}></div> ${team.tag}</div>
                        <div id="name">${team.name}</div>
                    </div>
                    <div id="roster">
                        ${teamInfo.members.map((m) => /* html */`
                            <div class="member">${Common.htmlEncode(Common.normalizeName(m.name, team.tag))} ${m.role ? `- ${m.role}` : ""}</div>
                        `).join("")}
                    </div>
                </div>
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
