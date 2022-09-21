const Challenge = require("../../models/challenge"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//   ###                         #            #   #          #            #
//  #   #                        #            #   #          #            #
//  #      # ##    ###    ###   ####    ###   ## ##   ###   ####    ###   # ##
//  #      ##  #  #   #      #   #     #   #  # # #      #   #     #   #  ##  #
//  #      #      #####   ####   #     #####  #   #   ####   #     #      #   #
//  #   #  #      #      #   #   #  #  #      #   #  #   #   #  #  #   #  #   #
//   ###   #       ###    ####    ##    ###   #   #   ####    ##    ###   #   #
/**
 * A command to create matches.
 */
class CreateMatch {
    //                                        #
    //                                        #
    //  ##    ##   # #   # #    ###  ###    ###
    // #     #  #  ####  ####  #  #  #  #  #  #
    // #     #  #  #  #  #  #  # ##  #  #  #  #
    //  ##    ##   #  #  #  #   # #  #  #   ###
    /**
     * The command data.
     * @returns {DiscordJs.SlashCommandBuilder} The command data.
     */
    static command() {
        return new DiscordJs.SlashCommandBuilder()
            .addStringOption((option) => option
                .setName("hometeam")
                .setDescription("The home team.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .addStringOption((option) => option
                .setName("awayteam")
                .setDescription("The away team.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .addStringOption((option) => option
                .setName("type")
                .setDescription("The game type.")
                .addChoices(
                    {name: "TA", value: "TA"},
                    {name: "CTF", value: "CTF"}
                )
                .setRequired(true))
            .addNumberOption((option) => option
                .setName("games")
                .setDescription("The number of games to play.")
                .setMinValue(1)
                .setRequired(true))
            .setName("creatematch")
            .setDescription("Creates new matches.")
            .setDefaultMemberPermissions("0");
    }

    // #                    #  ##
    // #                    #   #
    // ###    ###  ###    ###   #     ##
    // #  #  #  #  #  #  #  #   #    # ##
    // #  #  # ##  #  #  #  #   #    ##
    // #  #   # #  #  #   ###  ###    ##
    /**
     * The command handler.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {DiscordJs.User} user The user initiating the interaction.
     * @returns {Promise<boolean>} A promise that returns whether the interaction was successfully handled.
     */
    static async handle(interaction, user) {
        await interaction.deferReply({ephemeral: true});

        const member = Discord.findGuildMemberById(user.id),
            homeTeam = interaction.options.getString("hometeam", true),
            awayTeam = interaction.options.getString("awayteam", true),
            type = interaction.options.getString("type", true),
            games = interaction.options.getNumber("games", true);

        await Validation.memberShouldBeOwner(interaction, member);
        const team1 = await Validation.teamShouldExist(interaction, homeTeam, member),
            team2 = await Validation.teamShouldExist(interaction, awayTeam, member);
        await Validation.teamShouldNotBeDisbanded(interaction, team1, member);
        const team1PilotCount = await Validation.teamShouldHaveMinimumPlayers(interaction, team1, member);
        await Validation.teamShouldHaveEnoughHomes(interaction, team1, type, team1PilotCount, member);
        await Validation.teamShouldNotBeDisbanded(interaction, team2, member);
        const team2PilotCount = await Validation.teamShouldHaveMinimumPlayers(interaction, team2, member);
        await Validation.teamShouldHaveEnoughHomes(interaction, team2, type, team2PilotCount, member);

        try {
            await Challenge.create(team1, team2, {gameType: type, adminCreated: true, number: games});
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `Sorry, ${member}, but there was a server error.  An admin will be notified about this.`,
                        color: 0xff0000
                    })
                ]
            });
            throw err;
        }

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member}, the match${games === 1 ? "" : "es"} between ${team1.name} and ${team2.name} ${games === 1 ? "has" : "have"} been created.`
                })
            ]
        });

        return true;
    }
}

module.exports = CreateMatch;
