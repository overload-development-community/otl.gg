/**
 * @typedef {import("../../models/challenge")} Challenge
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Validation = require("../validation");

//   ###    ##                  #
//  #   #    #                  #
//  #        #     ###    ###   #   #
//  #        #    #   #  #   #  #  #
//  #        #    #   #  #      ###
//  #   #    #    #   #  #   #  #  #
//   ###    ###    ###    ###   #   #
/**
 * A command to put a challenge on the clock.
 */
class Clock {
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
            .setName("clock")
            .setDescription("Put a challenge on the clock.");
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
        Clock.builder(builder);
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

        const response = await interaction.deferReply({ephemeral: true});

        await Clock.validate(interaction, challenge, member);

        const customId = `clock-${user.id}-${challenge.id}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel("Yes, put this challenge on the clock")
                .setStyle(DiscordJs.ButtonStyle.Danger)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member}, are you sure you wish to put this challenge on the clock?  This command should only be used if the opposing team is not responding to your challenge.  Note that you can only clock a challenge once every 28 days, you can only clock a team once every season, and you can have a maximum of two active challenges clocked at a time.`,
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

            const team = await Clock.validate(interaction, challenge, member);

            try {
                await challenge.clock(team);
            } catch (err) {
                await interaction.editReply({components: []});
                await interaction.followUp({
                    embeds: [
                        Discord.embedBuilder({
                            description: `Sorry, ${member}, but there was a server error.  An admin will be notified about this.`,
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
                        description: `**${team.name}** has put this challenge on the clock!  Both teams have 28 days to get this match scheduled.  If the match is not scheduled within that time, this match will be adjudicated by an admin to determine if penalties need to be assessed.`,
                        color: team.role.color
                    })
                ],
                ephemeral: false
            });

            collector.stop();
        });

        return true;
    }

    //             ##     #       #         #
    //              #             #         #
    // # #    ###   #    ##     ###   ###  ###    ##
    // # #   #  #   #     #    #  #  #  #   #    # ##
    // # #   # ##   #     #    #  #  # ##   #    ##
    //  #     # #  ###   ###    ###   # #    ##   ##
    /**
     * Performs command validation.
     * @param {DiscordJs.ChatInputCommandInteraction} interaction The interaction.
     * @param {Challenge} challenge The challenge.
     * @param {DiscordJs.GuildMember} member The guild member initiating the interaction.
     * @returns {Promise} A promise that returns when validation completes.
     */
    static async validate(interaction, challenge, member) {
        await Validation.memberShouldBeCaptainOrFounder(interaction, member);
        const team = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.teamShouldBeInChallenge(interaction, team, challenge, member);
        await Validation.challengeShouldHaveDetails(interaction, challenge, member);
        await Validation.challengeShouldNotBeVoided(interaction, challenge, member);
        await Validation.challengeShouldNotBeConfirmed(interaction, challenge, member);
        await Validation.challengeShouldNotBeOnTheClock(interaction, challenge, member);
        await Validation.challengeShouldNotBeScheduled(interaction, challenge, member);
        await Validation.challengeShouldNotBeLocked(interaction, challenge, member);
        await Validation.teamShouldNotHaveRecentlyClocked(interaction, team, member);
        await Validation.teamsShouldNotHaveTooManyClockedChallenges(interaction, challenge, member);
    }
}

module.exports = Clock;
