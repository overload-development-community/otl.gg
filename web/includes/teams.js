const Team = require("../../src/team");

//  #####
//    #
//    #     ###    ###   ## #    ###
//    #    #   #      #  # # #  #
//    #    #####   ####  # # #   ###
//    #    #      #   #  # # #      #
//    #     ###    ####  #   #  ####
/**
 * A class that caches teams.
 */
class Teams {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new instance of the team caching class.
     */
    constructor() {
        this.teams = {};
    }

    //              #    ###
    //              #     #
    //  ###   ##   ###    #     ##    ###  # #
    // #  #  # ##   #     #    # ##  #  #  ####
    //  ##   ##     #     #    ##    # ##  #  #
    // #      ##     ##   #     ##    # #  #  #
    //  ###
    /**
     * Returns the team, from cache if available.
     * @param {number} id The team ID.
     * @param {string} name The name of the team.
     * @param {string} tag The team's tag.
     * @param {boolean} [disbanded] Whether the team is disbanded.
     * @param {boolean} [locked] Whether the team's roster is locked.
     * @returns {Team} The requested team.
     */
    getTeam(id, name, tag, disbanded, locked) {
        if (!id) {
            return void 0;
        }

        if (!this.teams[id]) {
            this.teams[id] = new Team({id, name, tag, disbanded, locked});
        }

        return this.teams[id];
    }
}

Teams.route = {
    include: true
};

module.exports = Teams;
