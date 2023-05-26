const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1),
    commandSemaphore = new Semaphore(1);

//   ###                                       #     #####                        ###     #
//  #   #                                      #       #                         #   #
//  #      #   #   ## #   ## #   ###    ###   ####     #     ###    ###   ## #   #       ##    #####   ###
//   ###   #   #  #  #   #  #   #   #  #       #       #    #   #      #  # # #   ###     #       #   #   #
//      #  #   #   ##     ##    #####   ###    #       #    #####   ####  # # #      #    #      #    #####
//  #   #  #  ##  #      #      #          #   #  #    #    #      #   #  # # #  #   #    #     #     #
//   ###    ## #   ###    ###    ###   ####     ##     #     ###    ####  #   #   ###    ###   #####   ###
//                #   #  #   #
//                 ###    ###
/**
 * A command to suggest the team size.
 */
class SuggestTeamSize {
    //         #                ##           #
    //                           #           #
    //  ###   ##    # #   #  #   #     ###  ###    ##
    // ##      #    ####  #  #   #    #  #   #    # ##
    //   ##    #    #  #  #  #   #    # ##   #    ##
    // ###    ###   #  #   ###  ###    # #    ##   ##
    /**
     * Indicates that this is a command that can be simulated.
     * @returns {string} The subcommand group for this command.
     */
    static get simulate() {
        return "challenge";
    }

    // #            #    ##       #
    // #                  #       #
    // ###   #  #  ##     #     ###   ##   ###
    // #  #  #  #   #     #    #  #  # ##  #  #
    // #  #  #  #   #     #    #  #  ##    #
    // ###    ###  ###   ###    ###   ##   #
    /**
     * The common command builder.
     * @param {DiscordJs.SlashCommandBuilder | DiscordJs.SlashCommandSubcommandBuilder} builder The command builder.
     * @returns {void}
     */
    static builder(builder) {
        builder
            .addStringOption((option) => option
                .setName("size")
                .setDescription("The team size.")
                .addChoices(
                    {name: "2v2", value: "2v2"},
                    {name: "3v3", value: "3v3"},
                    {name: "4v4", value: "4v4"},
                    {name: "5v5", value: "5v5"},
                    {name: "6v6", value: "6v6"},
                    {name: "7v7", value: "7v7"},
                    {name: "8v8", value: "8v8"}
                )
                .setRequired(true))
            .setName("suggestteamsize")
            .setDescription("Suggests a team size to play in the challenge.");
    }

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
        const builder = new DiscordJs.SlashCommandBuilder();
        SuggestTeamSize.builder(builder);
        return builder;
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

            const size = +interaction.options.getString("size", true).charAt(0);

            await Validation.memberShouldBeCaptainOrFounder(interaction, member);
            const checkTeam = await Validation.memberShouldBeOnATeam(interaction, member);
            await Validation.teamShouldBeInChallenge(interaction, checkTeam, challenge, member);
            await Validation.challengeShouldHaveDetails(interaction, challenge, member);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
            await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
            await Validation.challengeShouldBeScheduled(interaction, challenge, member);

            const otherTeam = challenge.challengingTeam.id === checkTeam.id ? challenge.challengedTeam : challenge.challengingTeam;

            const customId = `suggestteamsize-${user.id}-${challenge.id}-${size}-${Date.now()}`;

            const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
                .addComponents(new DiscordJs.ButtonBuilder()
                    .setCustomId(customId)
                    .setLabel(`${otherTeam.name}, confirm the team size ${size}v${size}`)
                    .setStyle(DiscordJs.ButtonStyle.Primary)));

            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `**${checkTeam.name}** is suggesting to play a **${size}v${size}**.  **${(checkTeam.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam).name}**, do you agree to this suggestion?`,
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

                    let team;
                    try {
                        await Validation.memberShouldBeCaptainOrFounder(interaction, buttonMember, true);
                        team = await Validation.memberShouldBeOnATeam(interaction, buttonMember);
                        await Validation.teamShouldBeInChallenge(interaction, team, challenge, buttonMember);
                        await Validation.challengeShouldHaveDetails(interaction, challenge, buttonMember);
                        await Validation.challengeShouldNotBeVoided(interaction, challenge, buttonMember);
                        await Validation.challengeShouldNotBeConfirmed(interaction, challenge, buttonMember);
                        await Validation.teamsShouldBeDifferent(interaction, team, checkTeam, buttonMember, "but someone from the other team has to confirm the suggested team size.", true);
                        await Validation.challengeShouldBeScheduled(interaction, challenge, buttonMember);
                    } catch (err) {
                        Validation.logButtonError(interaction, buttonInteraction, err);
                        return;
                    }

                    let homes;
                    try {
                        homes = await challenge.setTeamSize(size);
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
                                description: `The team size for this match has been set to **${challenge.details.teamSize}v${challenge.details.teamSize}**.  Either team may suggest changing this at any time with the \`/suggestteamsize\` command.${challenge.details.gameType === "TA" && (!challenge.details.map || homes.indexOf(challenge.details.map) === -1) ? `  **${(challenge.details.homeMapTeam.tag === challenge.challengingTeam.tag ? challenge.challengedTeam : challenge.challengingTeam).tag}** must now choose from one of the following home maps:\n\n${homes.map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}` : ""}`,
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

module.exports = SuggestTeamSize;
