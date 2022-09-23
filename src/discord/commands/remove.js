/**
 * @typedef {import("../../models/team")} Team
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1),
    commandSemaphore = new Semaphore(1);

//  ####
//  #   #
//  #   #   ###   ## #    ###   #   #   ###
//  ####   #   #  # # #  #   #  #   #  #   #
//  # #    #####  # # #  #   #   # #   #####
//  #  #   #      # # #  #   #   # #   #
//  #   #   ###   #   #   ###     #     ###
/**
 * A command to remove a player from your team.
 */
class Remove {
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
            .addUserOption((option) => option
                .setName("pilot")
                .setDescription("The pilot to remove.")
                .setRequired(true))
            .setName("remove")
            .setDescription("Remove a pilot from your team.");
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
        Remove.builder(builder);
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
    static handle(interaction, user) {
        return commandSemaphore.callFunction(async () => {
            const response = await interaction.deferReply({ephemeral: true});

            const member = Discord.findGuildMemberById(user.id);

            const {team: checkTeam, pilot: checkPilot} = await Remove.validate(interaction, member);

            const customId = `remove-${user.id}-${checkPilot.id}-${checkTeam.tag}-${Date.now()}`;

            const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
                .addComponents(new DiscordJs.ButtonBuilder()
                    .setCustomId(customId)
                    .setLabel(`Yes, remove ${checkPilot.displayName} from your team`)
                    .setStyle(DiscordJs.ButtonStyle.Danger)));

            await interaction.editReply({
                embeds: [
                    Discord.embedBuilder({
                        description: `${member}, are you sure you want to remove ${checkPilot} from **${checkTeam.name}**?`,
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

                const {team, pilot} = await Remove.validate(interaction, member);

                try {
                    await team.removePilot(member, pilot);
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

                await interaction.editReply({components: []});
                await interaction.followUp({
                    embeds: [
                        Discord.embedBuilder({
                            description: `${member}, you have removed ${pilot.displayName} from your team.`,
                            color: team.role.color
                        })
                    ]
                });

                collector.stop();
            }));

            collector.on("end", async () => {
                await interaction.editReply({components: []});
            });

            return true;
        });
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
     * @returns {Promise<{team: Team, pilot: DiscordJs.GuildMember}>} A promise that returns the team to join.
     */
    static async validate(interaction, member) {
        await Validation.memberShouldBeCaptainOrFounder(interaction, member);
        const team = await Validation.memberShouldBeOnATeam(interaction, member),
            pilot = await Validation.pilotShouldBeOnServer(interaction, member);
        await Validation.pilotShouldBeDifferentThanMember(interaction, pilot, member);
        const pilotTeam = await pilot.getTeam();
        if (pilotTeam) {
            await Validation.pilotShouldBeOnTeam(interaction, pilot, team, member);
            if (!member.isFounder()) {
                await Validation.pilotShouldNotBeCaptainOrFounder(interaction, pilot, member);
            }
        }
        await Validation.pilotShouldBeRemovable(interaction, pilot, member);

        return {team, pilot};
    }
}

module.exports = Remove;
