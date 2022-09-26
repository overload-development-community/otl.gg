/**
 * @typedef {import("../../models/newTeam")} NewTeam
 */

const Discord = require("../../discord"),
    DiscordJs = require("discord.js"),
    Semaphore = require("../../semaphore"),
    Validation = require("../validation"),

    buttonSemaphore = new Semaphore(1);

//   ###                         ##            #
//  #   #                         #            #
//  #       ###   ## #   # ##     #     ###   ####    ###
//  #      #   #  # # #  ##  #    #    #   #   #     #   #
//  #      #   #  # # #  ##  #    #    #####   #     #####
//  #   #  #   #  # # #  # ##     #    #       #  #  #
//   ###    ###   #   #  #       ###    ###     ##    ###
//                       #
//                       #
/**
 * A command that completes the team creation process.
 */
class Complete {
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
        return "newteam";
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
            .setName("complete")
            .setDescription("Completes the process of creating a team.");
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
        Complete.builder(builder);
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

        const checkNewTeam = await Complete.validate(interaction, member);

        const customId = `complete-${user.id}-${Date.now()}`;

        const row = /** @type {DiscordJs.ActionRowBuilder<DiscordJs.ButtonBuilder>} */(new DiscordJs.ActionRowBuilder() // eslint-disable-line no-extra-parens
            .addComponents(new DiscordJs.ButtonBuilder()
                .setCustomId(customId)
                .setLabel("Yes, create my new team")
                .setStyle(DiscordJs.ButtonStyle.Danger)));

        await interaction.editReply({
            embeds: [
                Discord.embedBuilder({
                    description: `${member}, are you sure you want to complete your request to create a new team?  Please review the details below.  There is no undoing this action!`,
                    fields: [
                        {
                            name: "Name",
                            value: checkNewTeam.name,
                            inline: true
                        },
                        {
                            name: "Tag",
                            value: checkNewTeam.tag,
                            inline: true
                        }
                    ],
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

            await buttonInteraction.deferUpdate();

            let newTeam;
            try {
                newTeam = await Complete.validate(interaction, member);
            } catch (err) {
                Validation.logButtonError(interaction, err);
                return;
            }

            let team;
            try {
                team = await newTeam.createTeam();
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
            await Discord.queue(`Congratulations, ${member}!  Your team has been created!  You may now visit ${team.teamChannel} for team chat, and ${team.captainsChannel} for private chat with your team captains as well as system notifications for your team.`, member);

            collector.stop();
        }));

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
     * @returns {Promise<NewTeam>} A promise that returns the new team to be created.
     */
    static async validate(interaction, member) {
        const newTeam = await Validation.memberShouldBeCreatingNewTeam(interaction, member);
        await Validation.newTeamShouldHaveName(interaction, newTeam, member);
        await Validation.newTeamShouldHaveTag(interaction, newTeam, member);
        await Validation.teamNameShouldBeUnique(interaction, newTeam.name, member);
        await Validation.teamTagShouldBeUnique(interaction, newTeam.tag, member);

        return newTeam;
    }
}

module.exports = Complete;
