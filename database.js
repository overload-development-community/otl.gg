const Db = require("node-database"),
    settings = require("./settings"),
    db = new Db(settings.database);

//  ####           #            #
//   #  #          #            #
//   #  #   ###   ####    ###   # ##    ###    ###    ###
//   #  #      #   #         #  ##  #      #  #      #   #
//   #  #   ####   #      ####  #   #   ####   ###   #####
//   #  #  #   #   #  #  #   #  ##  #  #   #      #  #
//  ####    ####    ##    ####  # ##    ####  ####    ###
/**
* Defines the database class.
*/
class Database {
    static getHomesForDiscordId(discordId) {
        return db.query("SELECT Home FROM tblHome WHERE DiscordID = @discordId", {discordId: {type: Db.VARCHAR(50), value: discordId}}).then((data) => data && data.recordsets && data.recordsets[0] && data.recordsets[0].map((row) => row.Home));
    }

    // addCaptain
    // addUserToTeam
    // applyHomeMap
    // canBeCaptain
    // canRemovePilot
    // createTeam
    // disbandTeam
    // getRequestedOrInvitedTeams
    // getTeam
    // getTeamByTagOrName
    // getTeamHomeMaps
    // getTeamInfo
    // getTeamPilotAndInvitedCount
    // invitePilotToTeam
    // joinTeamDeniedUntil
    // makeFounder
    // reinstateTeam
    // removeCaptain
    // removePilot
    // removeUserFromTeam
    // requestTeam
    // teamNameOrTagExists
    // teamTagExists
    // updateName
    // userBannedFromTeamUntil
    // userHasAlreadyRequstedTeam
    // userIsInvitedToTeam
    // userTeamHasInvitedPilot
    // userWasPreviousCaptainOrFounderOfTeam
}

module.exports = Database;
