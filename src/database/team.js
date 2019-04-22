/**
 * @typedef {import("../challenge")} Challenge
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {{member?: DiscordJs.GuildMember, id: number, name: string, tag: string, isFounder?: boolean, disbanded?: boolean, locked?: boolean}} TeamData
 */

const Db = require("node-database"),

    settings = require("../../settings"),

    db = new Db(settings.database);

//  #####                       ####   #
//    #                          #  #  #
//    #     ###    ###   ## #    #  #  # ##
//    #    #   #      #  # # #   #  #  ##  #
//    #    #####   ####  # # #   #  #  #   #
//    #    #      #   #  # # #   #  #  ##  #
//    #     ###    ####  #   #  ####   # ##
/**
 * A class that handles calls to the database for teams.
 */
class TeamDb {
    //              #    ###         ###    #    ##           #
    //              #    #  #        #  #         #           #
    //  ###   ##   ###   ###   #  #  #  #  ##     #     ##   ###
    // #  #  # ##   #    #  #  #  #  ###    #     #    #  #   #
    //  ##   ##     #    #  #   # #  #      #     #    #  #   #
    // #      ##     ##  ###     #   #     ###   ###    ##     ##
    //  ###                     #
    /**
     * Gets the team for the pilot.
     * @param {DiscordJs.GuildMember} member The pilot to get the team for.
     * @returns {Promise<TeamData>} A promise that resolves with the retrieved team.  Returns nothing if the team is not found.
     */
    static async getByPilot(member) {
        /**
         * @type {{recordsets: [{TeamId: number, Name: string, Tag: string, IsFounder: boolean, Locked: boolean}[]]}}
         */
        const data = await db.query(/* sql */`
            DECLARE @playerId INT

            SELECT @playerId = PlayerId FROM tblPlayer WHERE DiscordId = @discordId

            SELECT TeamId, Name, Tag, CASE WHEN EXISTS(SELECT TOP 1 1 FROM tblRoster WHERE Founder = 1 AND PlayerId = @playerId) THEN 1 ELSE 0 END IsFounder, Locked
            FROM tblTeam
            WHERE TeamId IN (SELECT TeamId FROM tblRoster WHERE PlayerId = @playerId)
        `, {discordId: {type: Db.VARCHAR(24), value: member.id}});
        return data && data.recordsets && data.recordsets[0] && data.recordsets[0][0] && {member, id: data.recordsets[0][0].TeamId, name: data.recordsets[0][0].Name, tag: data.recordsets[0][0].Tag, isFounder: !!data.recordsets[0][0].IsFounder, locked: !!data.recordsets[0][0].Locked} || void 0;
    }

    //                #         #          ###          #     #                       ####               ##                                  ####                     ##   #           ##    ##
    //                #         #          #  #         #                             #                 #  #                                 #                       #  #  #            #     #
    // #  #  ###    ###   ###  ###    ##   #  #   ###  ###   ##    ###    ###   ###   ###    ##   ###    #     ##    ###   ###    ##   ###   ###   ###    ##   # #   #     ###    ###   #     #     ##   ###    ###   ##
    // #  #  #  #  #  #  #  #   #    # ##  ###   #  #   #     #    #  #  #  #  ##     #     #  #  #  #    #   # ##  #  #  ##     #  #  #  #  #     #  #  #  #  ####  #     #  #  #  #   #     #    # ##  #  #  #  #  # ##
    // #  #  #  #  #  #  # ##   #    ##    # #   # ##   #     #    #  #   ##     ##   #     #  #  #     #  #  ##    # ##    ##   #  #  #  #  #     #     #  #  #  #  #  #  #  #  # ##   #     #    ##    #  #   ##   ##
    //  ###  ###    ###   # #    ##   ##   #  #   # #    ##  ###   #  #  #     ###    #      ##   #      ##    ##    # #  ###     ##   #  #  #     #      ##   #  #   ##   #  #   # #  ###   ###    ##   #  #  #      ##
    //       #                                                            ###                                                                                                                                   ###
    /**
     * Updates the ratins for the season based on the challenge supplied.
     * @param {Challenge} challenge The challenge in the season to update ratings for.
     * @param {Object<number, number>} ratings The ratings.
     * @returns {Promise} A promise that resolves when the ratings are updated.
     */
    static async updateRatingsForSeasonFromChallenge(challenge, ratings) {
        let sql = /* sql */`
            DECLARE @matchTime DATETIME
            DECLARE @season INT

            SELECT @matchTime = MatchTime FROM tblChallenge WHERE ChallengeId = @challengeId

            IF @matchTime < (SELECT TOP 1 DateStart FROM tblSeason ORDER BY Season)
            BEGIN
                SELECT TOP 1 @matchTime = DateStart FROM tblSeason ORDER BY Season
            END

            SELECT @season = Season FROM tblSeason WHERE DateStart <= @matchTime And DateEnd >= @matchTime

            DELETE FROM tblTeamRating WHERE Season = @season
        `;

        const params = {
            challengeId: {type: Db.INT, value: challenge.id}
        };

        for (const {teamId, rating, index} of Object.keys(ratings).map((r, i) => ({teamId: r, rating: ratings[r], index: i}))) {
            sql = /* sql */`
                ${sql}

                INSERT INTO tblTeamRating
                (Season, TeamId, Rating)
                VALUES
                (@season, @team${index}Id, @rating${index})
            `;

            params[`team${index}id`] = {type: Db.INT, value: teamId};
            params[`rating${index}`] = {type: Db.FLOAT, value: rating};
        }

        await db.query(sql, params);
    }
}

module.exports = TeamDb;
