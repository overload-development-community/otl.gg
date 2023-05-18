const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1),
    commandSemaphore = new Semaphore(1);

//   ###                                       #     ####                     #                #   #
//  #   #                                      #     #   #                    #                #   #
//  #      #   #   ## #   ## #   ###    ###   ####   #   #   ###   # ##    ## #   ###   ## #   ## ##   ###   # ##
//   ###   #   #  #  #   #  #   #   #  #       #     ####       #  ##  #  #  ##  #   #  # # #  # # #      #  ##  #
//      #  #   #   ##     ##    #####   ###    #     # #     ####  #   #  #   #  #   #  # # #  #   #   ####  ##  #
//  #   #  #  ##  #      #      #          #   #  #  #  #   #   #  #   #  #  ##  #   #  # # #  #   #  #   #  # ##
//   ###    ## #   ###    ###    ###   ####     ##   #   #   ####  #   #   ## #   ###   #   #  #   #   ####  #
//                #   #  #   #                                                                               #
//                 ###    ###                                                                                #
/**
 * A command to suggest a random map.
 */
class SuggestRandomMap {
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
                .setName("popularity")
                .setDescription("The popularity of the map.")
                .addChoices(
                    {name: "most", value: "most"},
                    {name: "least", value: "least"}
                )
                .setRequired(false))
            .addNumberOption((option) => option
                .setName("amount")
                .setDescription("The number of maps to choose from.")
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(false))
            .setName("suggestrandommap")
            .setDescription("Suggests a random map to play in a challenge.");
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
        const response = await interaction.deferReply({ephemeral: false});

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

            await Validation.memberShouldBeCaptainOrFounder(interaction, member);
            const checkTeam = await Validation.memberShouldBeOnATeam(interaction, member);
            await Validation.teamShouldBeInChallenge(interaction, checkTeam, challenge, member);
            await Validation.challengeShouldHaveDetails(interaction, challenge, member);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
            await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
            await Validation.challengeShouldNotBeLocked(interaction, challenge, member);
            await Validation.challengeShouldNotBePenalized(interaction, challenge, member);
            await Validation.challengeShouldHaveTeamSize(interaction, challenge, member);
            await Validation.challengeShouldBeScheduled(interaction, challenge, member);
            const checkMap = await Validation.randomMapShouldExist(interaction, challenge, member);

            const otherTeam = challenge.challengingTeam.id === checkTeam.id ? challenge.challengedTeam : challenge.challengingTeam;

            const customId = `suggestrandommap-${user.id}-${challenge.id}-${checkMap}-${Date.now()}`;

            const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
                .addComponents(new DiscordJs.ButtonBuilder()
                    .setCustomId(customId)
                    .setLabel(`${otherTeam.name}, confirm the map ${checkMap}`)
                    .setStyle(DiscordJs.ButtonStyle.Primary)));

            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `**${checkTeam.name}** is suggesting to play a random neutral map, **${checkMap}**.  **${(checkTeam.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam).name}**, do you agree to this suggestion?`,
                        color: 0xffff00
                    })
                ],
                components: [row]
            });

            const collector = response.createMessageComponentCollector({time: 890000});

            collector.on("collect", async (/** @type {DiscordJs.ButtonInteraction} */buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                return buttonSemaphore.callFunction(async () => {
                    if (collector.ended || buttonInteraction.customId !== customId) {
                        return;
                    }

                    const buttonUser = buttonInteraction.user,
                        buttonMember = Discord.findGuildMemberById(buttonUser.id);

                    let team, map;
                    try {
                        await Validation.memberShouldBeCaptainOrFounder(interaction, buttonMember);
                        team = await Validation.memberShouldBeOnATeam(interaction, buttonMember);
                        await Validation.teamShouldBeInChallenge(interaction, team, challenge, buttonMember);
                        await Validation.challengeShouldHaveDetails(interaction, challenge, buttonMember);
                        await Validation.challengeShouldNotBeVoided(interaction, challenge, buttonMember);
                        await Validation.challengeShouldNotBeConfirmed(interaction, challenge, buttonMember);
                        await Validation.challengeShouldNotBeLocked(interaction, challenge, buttonMember);
                        await Validation.challengeShouldNotBePenalized(interaction, challenge, buttonMember);
                        await Validation.challengeShouldBeScheduled(interaction, challenge, buttonMember);
                        map = await Validation.mapShouldBeValid(interaction, challenge.details.gameType, checkMap, buttonMember);
                        await Validation.teamsShouldBeDifferent(interaction, team, checkTeam, buttonMember, "but someone from the other team has to confirm the randomly suggested map.", true);
                    } catch (err) {
                        Validation.logButtonError(interaction, buttonInteraction, err);
                        return;
                    }

                    try {
                        await challenge.setMap(map.map);
                    } catch (err) {
                        await interaction.editReply({components: []});
                        await interaction.followUp({
                            embeds: [
                                Discord.embedBuilder({
                                    description: `Sorry, ${buttonMember}, but there was a server error.  An admin will be notified about this.`,
                                    color: 0xff0000
                                })
                            ]
                        });
                        collector.stop();
                        throw err;
                    }

                    await interaction.editReply({components: []});
                    await interaction.followUp({
                        embeds: [
                            Discord.embedBuilder({
                                description: `The map for this match has been set to the randomly chosen map of **${challenge.details.map}**.`,
                                color: team.role.color
                            })
                        ]
                    });

                    collector.stop();
                });
            });

            collector.on("end", async () => {
                try {
                    await interaction.editReply({components: []});
                } catch {}
            });

            return true;
        });
    }
}

module.exports = SuggestRandomMap;
