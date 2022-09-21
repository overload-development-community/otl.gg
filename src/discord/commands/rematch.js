const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//  ####                         #            #
//  #   #                        #            #
//  #   #   ###   ## #    ###   ####    ###   # ##
//  ####   #   #  # # #      #   #     #   #  ##  #
//  # #    #####  # # #   ####   #     #      #   #
//  #  #   #      # # #  #   #   #  #  #   #  #   #
//  #   #   ###   #   #   ####    ##    ###   #   #
/**
 * A command to issue a rematch.
 */
class Rematch {
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
            .setName("rematch")
            .setDescription("Request a rematch.");
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
        Rematch.builder(builder);
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

        const response = await interaction.deferReply({ephemeral: false});

        await Validation.memberShouldBeCaptainOrFounder(interaction, member);
        const checkTeam = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.teamShouldBeInChallenge(interaction, checkTeam, challenge, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldBeConfirmed(interaction, challenge, member);
        await Validation.challengeShouldNotBeRematched(interaction, challenge, member);

        const otherTeam = challenge.challengingTeam.id === checkTeam.id ? challenge.challengedTeam : challenge.challengingTeam;

        const customId = `rematch-${user.id}-${challenge.id}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`${otherTeam.name}, confirm the rematch`)
                .setStyle(DiscordJs.ButtonStyle.Primary)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `**${checkTeam.name}** is requesting a rematch!  **${otherTeam.name}**, do you accept?  The match will be scheduled immediately.`,
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
            await Validation.teamsShouldBeDifferent(interaction, checkTeam, team, buttonMember, "but someone from the other team has to confirm the rematch.");
            await Validation.challengeShouldHaveDetails(interaction, challenge, buttonMember);
            await Validation.challengeShouldNotBeVoided(interaction, challenge, buttonMember);
            await Validation.challengeShouldBeConfirmed(interaction, challenge, buttonMember);
            await Validation.challengeShouldNotBeRematched(interaction, challenge, buttonMember);

            let rematch;
            try {
                rematch = await challenge.createRematch(team);
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
                        description: `The rematch has been created!  Visit ${rematch.channel} to get started.`
                    })
                ]
            });

            collector.stop();
        });

        return true;
    }
}

module.exports = Rematch;
