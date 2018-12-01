import Team from "./team";

declare module 'discord.js' {
    /**
     * TypeScript definitions for discordJs.GuildMember.extensions.js.
     */
    interface GuildMember {
        bannedFromTeamUntil(team: Team): Promise<Date>;
        canBeCaptain(): Promise<boolean>;
        canRemovePilot(pilot: GuildMember): Promise<boolean>;
        getRequestedOrInvitedTeams(): Promise<Team[]>;
        getTimezone(): Promise<string>;
        hasBeenInvitedToTeam(team: Team): Promise<boolean>;
        hasRequestedTeam(team: Team): Promise<boolean>;
        isCaptainOrFounder(): boolean;
        isFounder(): boolean;
        joinTeamDeniedUntil(): Promise<Date>;
        leftDiscord(): Promise<void>;
        requestTeam(team: Team): Promise<void>;
        setTimezone(timezone: string): Promise<void>;
        updateName(oldMember: GuildMember): Promise<void>;
        wasPreviousCaptainOrFounderOfTeam(team: Team): Promise<boolean>;
    }

    /**
     * Correction to discord.js's index.d.ts file, the parameters of this function were updated between 11.3.0 and the latest version.
     */
    interface Role {
		setColor(color: ColorResolvable, reason?: string): Promise<Role>;
    }
}
