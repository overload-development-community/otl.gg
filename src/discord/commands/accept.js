/**
 * @typedef {import("../../models/team")} Team
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1);

//    #                                 #
//   # #                                #
//  #   #   ###    ###    ###   # ##   ####
//  #   #  #   #  #   #  #   #  ##  #   #
//  #####  #      #      #####  ##  #   #
//  #   #  #   #  #   #  #      # ##    #  #
//  #   #   ###    ###    ###   #        ##
//                              #
//                              #
/**
 * A command to accept an invitation to a team.
 */
class Accept {
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
        return "invitation";
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
                .setName("team")
                .setDescription("The team to accept the invitation from.")
                .setMinLength(1)
                .setMaxLength(25)
                .setRequired(true))
            .setName("accept")
            .setDescription("Accepts an invitation to join a team.");
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
        Accept.builder(builder);
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
        const response = await interaction.deferReply({ephemeral: true});

        const member = Discord.findGuildMemberById(user.id);

        const checkTeam = await Accept.validate(interaction, member);

        const customId = `accept-${user.id}-${checkTeam.tag}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`Yes, join ${checkTeam.name}`)
                .setStyle(DiscordJs.ButtonStyle.Danger)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member}, are you sure you want to join **${checkTeam.name}**?  Note that you will not be able to accept another invitation or create a team for 28 days.`,
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

                let team;
                try {
                    team = await Accept.validate(interaction, member);
                } catch (err) {
                    Validation.logButtonError(interaction, buttonInteraction, err);
                    return;
                }

                let requestedTeams;
                try {
                    requestedTeams = await member.getRequestedOrInvitedTeams();
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
                    collector.stop();
                    throw err;
                }

                try {
                    await team.addPilot(member);
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
                    collector.stop();
                    throw err;
                }

                requestedTeams.forEach(async (requestedTeam) => {
                    await requestedTeam.updateChannels();
                });

                await interaction.editReply({components: []});
                await interaction.followUp({
                    embeds: [
                        Discord.embedBuilder({
                            description: `${member}, you are now a member of **${team.name}**!  Visit your team channel at ${team.teamChannel} to talk with your teammates.  Best of luck flying in the OTL!`,
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
     * @param {DiscordJs.GuildMember} member The guild member initiating the interaction.
     * @returns {Promise<Team>} A promise that returns the team to join.
     */
    static async validate(interaction, member) {
        await Validation.memberShouldNotBeCreatingTeam(interaction, member);
        await Validation.memberShouldNotBeOnATeam(interaction, member);
        const team = await Validation.teamShouldExist(interaction, interaction.options.getString("team", true), member);
        await Validation.teamShouldNotBeDisbanded(interaction, team, member);
        await Validation.memberShouldHaveInviteFromTeam(interaction, team, member);
        await Validation.memberShouldBeAllowedToJoinATeam(interaction, member);
        await Validation.memberShouldNotBeBannedFromTeam(interaction, team, member);

        return team;
    }
}

module.exports = Accept;
