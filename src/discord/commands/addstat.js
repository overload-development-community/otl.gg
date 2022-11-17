const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    commandSemaphore = new Semaphore(1);

//    #        #      #   ###    #             #
//   # #       #      #  #   #   #             #
//  #   #   ## #   ## #  #      ####    ###   ####
//  #   #  #  ##  #  ##   ###    #         #   #
//  #####  #   #  #   #      #   #      ####   #
//  #   #  #  ##  #  ##  #   #   #  #  #   #   #  #
//  #   #   ## #   ## #   ###     ##    ####    ##
/**
 * A command that adds a player's stat line for a match.
 */
class AddStat {
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
            .addUserOption((option) => option
                .setName("pilot")
                .setDescription("The pilot.")
                .setRequired(true))
            .addStringOption((option) => option
                .setName("team")
                .setDescription("The pilot's team.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .addNumberOption((option) => option
                .setName("kills")
                .setDescription("The number of kills.")
                .setRequired(true))
            .addNumberOption((option) => option
                .setName("assists")
                .setDescription("The number of assists.")
                .setMinValue(0)
                .setRequired(true))
            .addNumberOption((option) => option
                .setName("deaths")
                .setDescription("The number of deaths.")
                .setMinValue(0)
                .setRequired(true))
            .addNumberOption((option) => option
                .setName("captures")
                .setDescription("The number of flag captures in CTF.")
                .setMinValue(0)
                .setRequired(false))
            .addNumberOption((option) => option
                .setName("pickups")
                .setDescription("The number of flag pickups in CTF.")
                .setMinValue(0)
                .setRequired(false))
            .addNumberOption((option) => option
                .setName("carrierkills")
                .setDescription("The number of carrier kills in CTF.")
                .setMinValue(0)
                .setRequired(false))
            .addNumberOption((option) => option
                .setName("returns")
                .setDescription("The number of flag returns in CTF.")
                .setMinValue(0)
                .setRequired(false))
            .setName("addstat")
            .setDescription("Adds a player's stat line for a match.")
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
        await interaction.deferReply({ephemeral: false});

        return commandSemaphore.callFunction(async () => {
            const member = Discord.findGuildMemberById(user.id),
                challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);
            if (!challenge) {
                await interaction.deleteReply();
                await interaction.followUp({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but this command can only be used in a challenge channel.`,
                            color: 0xff0000
                        })
                    ],
                    ephemeral: true
                });
                return false;
            }

            const pilot = interaction.options.getUser("pilot", true),
                checkTeam = interaction.options.getString("team", true),
                kills = interaction.options.getNumber("kills", true),
                assists = interaction.options.getNumber("assists", true),
                deaths = interaction.options.getNumber("deaths", true),
                captures = interaction.options.getNumber("captures", false),
                pickups = interaction.options.getNumber("pickups", false),
                carrierKills = interaction.options.getNumber("carrierKills", false),
                returns = interaction.options.getNumber("returns", false);

            await Validation.memberShouldBeOwner(interaction, member);
            await Validation.challengeShouldHaveDetails(interaction, challenge, member);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
            await Validation.challengeShouldBeConfirmed(interaction, challenge, member);
            const team = await Validation.teamShouldExist(interaction, checkTeam, member);
            await Validation.pilotShouldBeAuthorized(interaction, pilot, challenge, member);
            await Validation.teamShouldBeInChallenge(interaction, team, challenge, member);
            await Validation.teamShouldNeedMoreStats(interaction, team, challenge, pilot, member);

            switch (challenge.details.gameType) {
                case "TA":
                    try {
                        await challenge.addStatTA(team, pilot, kills, assists, deaths);
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
                                description: `Added stats for ${pilot}: ${((kills + assists) / Math.max(deaths, 1)).toFixed(3)} KDA (${kills} K, ${assists} A, ${deaths} D)`
                            })
                        ]
                    });

                    break;
                case "CTF":
                    await Validation.statsShouldIncludeCTFStats(interaction, captures, pickups, carrierKills, returns, member);

                    try {
                        await challenge.addStatCTF(team, pilot, captures, pickups, carrierKills, returns, kills, assists, deaths);
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
                                description: `Added stats for ${pilot}: ${captures} C/${pickups} P, ${carrierKills} CK, ${returns} R, ${((kills + assists) / Math.max(deaths, 1)).toFixed(3)} KDA (${kills} K, ${assists} A, ${deaths} D)`
                            })
                        ]
                    });

                    break;
            }

            return true;
        });
    }
}

module.exports = AddStat;
