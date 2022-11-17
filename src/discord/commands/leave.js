/**
 * @typedef {import("../../models/team")} Team
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1);

//  #
//  #
//  #       ###    ###   #   #   ###
//  #      #   #      #  #   #  #   #
//  #      #####   ####   # #   #####
//  #      #      #   #   # #   #
//  #####   ###    ####    #     ###
/**
 * A command to leave a team.
 */
class Leave {
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
        return "player";
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
            .setName("leave")
            .setDescription("Leaves your team.");
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
        Leave.builder(builder);
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

        const checkTeam = await Leave.validate(interaction, member);

        const customId = `leave-${user.id}-${checkTeam.tag}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel(`Yes, leave ${checkTeam.name}`)
                .setStyle(DiscordJs.ButtonStyle.Danger)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member}, are you sure you want to leave **${checkTeam.name}**?  Note that you will not be able to rejoin this team for 28 days.`,
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
                    team = await Leave.validate(interaction, member);
                } catch (err) {
                    Validation.logButtonError(interaction, buttonInteraction, err);
                    return;
                }

                try {
                    await team.pilotLeft(member);
                } catch (err) {
                    try {
                        await interaction.editReply({components: []});
                    } catch {}
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
                    await interaction.editReply({components: []});
                } catch {}
                await interaction.followUp({
                    embeds: [
                        Discord.embedBuilder({
                            description: `${member}, you have left **${team.name}**.`
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
        const team = await Validation.memberShouldBeOnATeam(interaction, member);
        await Validation.memberShouldNotBeFounder(interaction, member);

        return team;
    }
}

module.exports = Leave;
