const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1);

//   ###                                       #     #####    #
//  #   #                                      #       #
//  #      #   #   ## #   ## #   ###    ###   ####     #     ##    ## #    ###
//   ###   #   #  #  #   #  #   #   #  #       #       #      #    # # #  #   #
//      #  #   #   ##     ##    #####   ###    #       #      #    # # #  #####
//  #   #  #  ##  #      #      #          #   #  #    #      #    # # #  #
//   ###    ## #   ###    ###    ###   ####     ##     #     ###   #   #   ###
//                #   #  #   #
//                 ###    ###
/**
 * A command to suggest a time.
 */
class SuggestTime {
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
                .setName("datetime")
                .setDescription("The date and time.")
                .setRequired(true))
            .setName("suggesttime")
            .setDescription("Suggests a time for the challenge.");
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
        SuggestTime.builder(builder);
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
            datetime = interaction.options.getString("datetime", true);

        await Validation.memberShouldBeCaptainOrFounder(interaction, member);
        const checkTeam = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.teamShouldBeInChallenge(interaction, checkTeam, challenge, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
        const date = await Validation.dateShouldBeValid(interaction, datetime, member);

        const otherTeam = challenge.challengingTeam.id === checkTeam.id ? challenge.challengedTeam : challenge.challengingTeam;

        const customId = `suggesttime-${user.id}-${challenge.id}-${date.getTime()}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`${otherTeam.name}, confirm the time`)
                .setStyle(DiscordJs.ButtonStyle.Primary)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `**${checkTeam.name}** is suggesting to play at **<t:${Math.floor(date.getTime() / 1000)}:F>**.  **${(checkTeam.id === challenge.challengingTeam.id ? challenge.challengedTeam : challenge.challengingTeam).name}**, do you agree to this suggestion?`,
                    color: 0xffff00
                })
            ],
            components: [row]
        });

        const collector = response.createMessageComponentCollector({time: 890000});

        collector.on("collect", (buttonInteraction) => buttonSemaphore.callFunction(async () => {
            if (collector.ended || buttonInteraction.customId !== customId) {
                return;
            }

            const buttonUser = buttonInteraction.user,
                buttonMember = Discord.findGuildMemberById(buttonUser.id);
            await Validation.memberShouldBeCaptainOrFounder(interaction, buttonMember);
            const team = await Validation.memberShouldBeOnATeam(interaction, buttonMember);
            await Validation.teamShouldBeInChallenge(interaction, team, challenge, buttonMember);
            await Validation.challengeShouldHaveDetails(interaction, challenge, buttonMember);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, buttonMember);
            await Validation.challengeShouldNotBeConfirmed(interaction, challenge, buttonMember);

            try {
                await challenge.setTime(date);
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
                        description: "The time for this match has been set.",
                        fields: [{name: "Local Time", value: `<t:${Math.floor(date.getTime() / 1000)}:F>`}]
                    })
                ]
            });

            collector.stop();
        }));

        collector.on("end", async () => {
            await interaction.editReply({components: []});
        });

        return true;
    }
}

module.exports = SuggestTime;