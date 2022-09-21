const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Team = require("../../models/team"),
    Validation = require("../validation");

//    #        #     #              #    #                   #
//   # #       #                    #                        #
//  #   #   ## #    ##   #   #   ## #   ##     ###    ###   ####    ###
//  #   #  #  ##     #   #   #  #  ##    #    #   #      #   #     #   #
//  #####  #   #     #   #   #  #   #    #    #       ####   #     #####
//  #   #  #  ##     #   #  ##  #  ##    #    #   #  #   #   #  #  #
//  #   #   ## #  #  #    ## #   ## #   ###    ###    ####    ##    ###
//                #  #
//                 ##
/**
 * A command to adjudicate a match.
 */
class Adjudicate {
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
                .setName("decision")
                .setDescription("The adjudication decision.")
                .addChoices(
                    {name: "cancel", value: "cancel"},
                    {name: "extend", value: "extend"},
                    {name: "penalize", value: "penalize"}
                )
                .setRequired(true))
            .addStringOption((option) => option
                .setName("team")
                .setDescription("The team to penalize, or \"both\" to penalize both teams.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(false))
            .setName("adjudicate")
            .setDescription("Adjudicates a match.")
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
        const member = Discord.findGuildMemberById(user.id),
            challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);
        if (!challenge) {
            return false;
        }

        await interaction.deferReply({ephemeral: false});

        const decision = interaction.options.getString("decision", true),
            checkTeam = interaction.options.getString("team", true);

        await Validation.memberShouldBeOwner(interaction, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
        await Validation.challengeShouldBeOnTheClock(interaction, challenge, member);
        await Validation.challengeShouldNotBeScheduled(interaction, challenge, member);
        await Validation.challengeDeadlineShouldHavePassed(interaction, challenge, member);

        let teams;
        if (decision === "penalize") {
            if (checkTeam === "both") {
                teams = [challenge.challengingTeam, challenge.challengedTeam];
            } else {
                const team = await Validation.teamShouldExist(interaction, checkTeam, member);
                await Validation.teamShouldBeInChallenge(interaction, team, challenge, member);

                teams = [team];
            }
        }

        let penalizedTeams;
        try {
            penalizedTeams = await challenge.adjudicate(decision, teams);
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

        switch (decision) {
            case "cancel":
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `${member} has voided this challenge.  No penalties were assessed.  An admin will close this channel soon.`
                        })
                    ]
                });
                break;
            case "extend":
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `${member} has extended the deadline of this challenge.  You now have until <t:${Math.floor(challenge.details.dateClockDeadline.getTime() / 1000)}:F> to get the match scheduled.`
                        })
                    ]
                });
                break;
            case "penalize":
                await interaction.editReply({
                    embeds: [
                        Discord.embedBuilder({
                            description: `${member} has voided this challenge.  Penalties were assessed against **${teams.map((t) => t.name).join("** and **")}**.  An admin will close this channel soon.`
                        })
                    ]
                });

                for (const penalizedTeam of penalizedTeams) {
                    const team = await Team.getById(penalizedTeam.teamId);

                    if (penalizedTeam.first) {
                        await Discord.queue(`${member} voided the challenge against **${(team.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam).name}**.  Penalties were assessed against **${teams.map((t) => t.name).join("** and **")}**.  As this was your team's first penalty, that means your next three games will automatically give home map advantages to your opponent.  If you are penalized again within your next ten games, your team will be disbanded, and all current captains and founders will be barred from being a founder or captain of another team.`, team.captainsChannel);

                        await team.updateChannels();
                    } else {
                        const oldCaptains = team.role.members.filter((m) => !!m.roles.cache.find((r) => r.id === Discord.founderRole.id || r.id === Discord.captainRole.id));

                        await team.disband(member);

                        for (const captain of oldCaptains.values()) {
                            await Discord.queue(`${member} voided the challenge against **${(team.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam).name}**.  Penalties were assessed against **${teams.map((t) => t.name).join(" and ")}**.  As this was your team's second penalty, your team has been disbanded.  The founder and captains of your team are now barred from being a founder or captain of another team.`, captain);
                        }
                    }
                }

                break;
        }

        return true;
    }
}

module.exports = Adjudicate;
