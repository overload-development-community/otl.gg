const Challenge = require("../../models/challenge"),
    Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//   ###                                       #     #####
//  #   #                                      #       #
//  #      #   #   ## #   ## #   ###    ###   ####     #    #   #  # ##    ###
//   ###   #   #  #  #   #  #   #   #  #       #       #    #   #  ##  #  #   #
//      #  #   #   ##     ##    #####   ###    #       #    #  ##  ##  #  #####
//  #   #  #  ##  #      #      #          #   #  #    #     ## #  # ##   #
//   ###    ## #   ###    ###    ###   ####     ##     #        #  #       ###
//                #   #  #   #                              #   #  #
//                 ###    ###                                ###   #
/**
 * A command to suggest the game time.
 */
class SuggestType {
    //         #                ##           #
    //                           #           #
    //  ###   ##    # #   #  #   #     ###  ###    ##
    // ##      #    ####  #  #   #    #  #   #    # ##
    //   ##    #    #  #  #  #   #    # ##   #    ##
    // ###    ###   #  #   ###  ###    # #    ##   ##
    /**
     * Indicates that this is a command that can be simulated.
     * @returns {boolean} Whether this is a command that can be simulated.
     */
    static get simulate() {
        return true;
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
                .setName("type")
                .setDescription("The game type.")
                .addChoices(
                    {name: "TA", value: "TA"},
                    {name: "CTF", value: "CTF"}
                )
                .setRequired(true))
            .setName("suggesttype")
            .setDescription("Suggests a game type to play in the challenge.");
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
        SuggestType.builder(builder);
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
        const member = Discord.findGuildMemberById(user.id),
            challenge = await Validation.interactionShouldBeInChallengeChannel(interaction, member);
        if (!challenge) {
            return false;
        }

        const response = await interaction.deferReply({ephemeral: false}),
            type = interaction.options.getString("type", true);

        await Validation.memberShouldBeCaptainOrFounder(interaction, member);
        const checkTeam = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.teamShouldBeInChallenge(interaction, checkTeam, challenge, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeLocked(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
        await Validation.challengeHomesShouldHaveEnoughMaps(interaction, challenge, type, member);

        const otherTeam = challenge.challengingTeam.id === checkTeam.id ? challenge.challengedTeam : challenge.challengingTeam;

        const customId = `suggesttype-${user.id}-${challenge.id}-${type}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`${otherTeam}, confirm the game type ${Challenge.getGameTypeName(type)}`)
                .setStyle(DiscordJs.ButtonStyle.Primary)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `**${checkTeam.name}** is suggesting to play **${Challenge.getGameTypeName(type)}**.  **${(checkTeam.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam).name}**, do you agree to this suggestion?`,
                    color: 0xffff00
                })
            ],
            components: [row]
        });

        const collector = response.createMessageComponentCollector();

        collector.on("collect", async (buttonInteraction) => {
            if (buttonInteraction.customId !== customId) {
                return;
            }

            const buttonUser = buttonInteraction.user,
                buttonMember = Discord.findGuildMemberById(buttonUser.id);
            await Validation.memberShouldBeCaptainOrFounder(interaction, buttonMember);
            const team = await Validation.memberShouldBeOnATeam(interaction, buttonMember);
            await Validation.teamShouldBeInChallenge(interaction, team, challenge, buttonMember);
            await Validation.challengeShouldHaveDetails(interaction, challenge, buttonMember);
            await Validation.challengeShouldNotBeLocked(interaction, challenge, buttonMember);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, buttonMember);
            await Validation.challengeShouldNotBeConfirmed(interaction, challenge, buttonMember);
            await Validation.challengeHomesShouldHaveEnoughMaps(interaction, challenge, type, buttonMember);
            await Validation.teamsShouldBeDifferent(interaction, team, checkTeam, buttonMember, "but someone from the other team has to confirm the suggested game type.", true);

            let homes;
            try {
                homes = await challenge.setGameType(type);
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
                throw err;
            }

            await interaction.editReply({components: []});
            await interaction.followUp({
                embeds: [
                    Discord.embedBuilder({
                        description: `The game type for this match has been set to **${Challenge.getGameTypeName(type)}**.  Either team may suggest changing this at any time with the \`/suggestgametype\` command.  **${(challenge.details.homeMapTeam.tag === challenge.challengingTeam.tag ? challenge.challengedTeam : challenge.challengingTeam).tag}** must now choose from one of the following home maps:\n\n${homes.map((map, index) => `${String.fromCharCode(97 + index)}) ${map}`).join("\n")}`,
                        color: team.role.color
                    })
                ]
            });

            if (!challenge.details.challengingTeamPenalized && !challenge.details.challengedTeamPenalized && !challenge.details.adminCreated) {
                try {
                    await challenge.notifyMatchingNeutrals();
                } catch {}
            }

            collector.stop();
        });

        return true;
    }
}

module.exports = SuggestType;
