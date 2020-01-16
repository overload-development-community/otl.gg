import {GuildMember} from "discord.js"
import NewTeam from "../models/newTeam"
import Team from "../models/team"

declare module "discord.js" {
    interface GuildMember {
        /**
         * Adds a Twitch name to the member's account.
         * @param {string} name The Twitch name.
         * @returns {Promise} A promise that resolves when the Twitch name has been added.
         */
        addTwitchName(name: string): Promise<void>

        /**
         * Returns the date and time the pilot is banned from a team until.
         * @param {Team} team The team to check.
         * @returns {Promise<Date>} A promise that resolves with the date and time the pilot is banned from the team until.  Returns nothing if the pilot is not banned.
         */
        bannedFromTeamUntil(team: Team): Promise<Date>

        /**
         * Returns whether the pilot can be a captain.
         * @returns {Promise<boolean>} A promise that resolves with whether the pilot can be a captain.
         */
        canBeCaptain(): Promise<boolean>

        /**
         * Returns whether the pilot can remove another pilot from their team.
         * @param {DiscordJs.GuildMember} pilot The pilot to check.
         * @returns {Promise<boolean>} A promise that resolves with whether the pilot can remove another pilot from their team.
         */
        canRemovePilot(pilot: GuildMember): Promise<boolean>

        /**
         * Clears a pilot's timezone.
         * @returns {Promise<void>} A promise that resolves when the timezone is clear.
         */
        clearTimezone(): Promise<void>

        /**
         * Starts team creation for the pilot.
         * @returns {Promise<NewTeam>} A promise that resolves with a new team object.
         */
        createNewTeam(): Promise<NewTeam>

        /**
         * Returns the pilot's new team object.
         * @returns {Promise<NewTeam>} A promise that resolves with the new team object for the pilot.
         */
        getNewTeam(): Promise<NewTeam>

        /**
         * Gets the teams that the pilot has requested or has been invited to.
         * @returns {Promise<Team[]>} A promise that resolves with the teams that the pilot has requested or has been invited to.
         */
        getRequestedOrInvitedTeams(): Promise<Team[]>

        /**
         * Gets the current season stats for the pilot.
         * @returns {Promise<{ta: {games: number, kills: number, assists: number, deaths: number, damage: number, deathsInGamesWithDamage: number}, ctf: {games: number, captures: number, pickups: number, carrierKills: number, returns: number, kills: number, assists: number, deaths: number, damage: number}, damage: Object<string, number>, playerId: number, name: string, tag: string, season: number}>} A promise that resolves with the pilot's stats.
         */
        getStats(): Promise<{
            ta: {
                games: number
                kills: number
                assists: number
                deaths: number
                damage: number
                deathsInGamesWithDamage: number
            }
            ctf: {
                games: number
                captures: number
                pickups: number
                carrierKills: number
                returns: number
                kills: number
                assists: number
                deaths: number
                damage: number
            }
            damage: {
                [x: string]: number
            }
            playerId: number
            name: string
            tag: string
            season: number
        }>

        /**
         * Returns the pilot's team.
         * @returns {Promise<Team>} A promise that resolves with the pilot's team.
         */
        getTeam(): Promise<Team>

        /**
         * Gets a pilot's time zone.  Default to team's time zone if the pilot doesn't have one, or the default time zone if neither have a value.
         * @returns {Promise<string>} A promise that resolves with the pilot's time zone.
         */
        getTimezone(): Promise<string>

        /**
         * Gets a pilot's Twitch name.
         * @returns {Promise<string>} A promise that resolves with the pilot's Twitch name.
         */
        getTwitchName(): Promise<string>

        /**
         * Gets whether the pilot has been invited to a team.
         * @param {Team} team The team to check.
         * @returns {Promise<boolean>} A promise that resolves with whether the pilot has been invited to the team.
         */
        hasBeenInvitedToTeam(team: Team): Promise<boolean>

        /**
         * Gets whether the pilot has requested a team.
         * @param {Team} team The team requested.
         * @returns {Promise<boolean>} A promise that resolves with whether the pilot has requested the team.
         */
        hasRequestedTeam(team: Team): Promise<boolean>

        /**
         * Returns whether the pilot is a captain or a founder.
         * @returns {boolean} Whether the pilot is a captain or a founder.
         */
        isCaptainOrFounder(): boolean

        /**
         * Returns whether the pilot is a founder.
         * @returns {boolean} Whether the pilot is a founder.
         */
        isFounder(): boolean

        /**
         * Returns the date and time which the pilot is banned from joining teams.
         * @returns {Promise<Date>} A promise that resolves with the date and time which the pilot is banned from joining teams.  Returns nothing if the pilot is not banned.
         */
        joinTeamDeniedUntil(): Promise<Date>

        /**
         * Performs the required actions when a pilot leaves the Discord server.
         * @returns {Promise} A promise that resolves when a pilot leaves Discord.
         */
        leftDiscord(): Promise<void>

        /**
         * Removes a Twitch name from the member's account.
         * @returns {Promise} A promise that resolves when the Twitch name has been added.
         */
        removeTwitchName(): Promise<void>

        /**
         * Requests to join a team.
         * @param {Team} team The team to request joining.
         * @returns {Promise} A promise that resolves when the request to join the team has been sent.
         */
        requestTeam(team: Team): Promise<void>

        /**
         * Sets a pilot's time zone.
         * @param {string} timezone The time zone to set.
         * @returns {Promise} A promise that resolves when the time zone has been set.
         */
        setTimezone(timezone: string): Promise<void>

        /**
         * Updates the pilot's name.
         * @param {DiscordJs.GuildMember} oldMember The pilot with their previous name.
         * @returns {Promise} A promise that resolves when the pilot's name is updated.
         */
        updateName(oldMember: GuildMember): Promise<void>

        /**
         * Returns whether the pilot was a captain or founder of a team previously.
         * @param {Team} team The team to check.
         * @returns {Promise<boolean>} A promise that resolves with whether the pilot was a captain or founder previously.
         */
        wasPreviousCaptainOrFounderOfTeam(team: Team): Promise<boolean>
    }
}
