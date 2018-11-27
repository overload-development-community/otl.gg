import Team from "./team";

declare module 'discord.js' {
    interface GuildMember {
        bannedFromTeamUntil(team: Team): Promise<Date>;
        canBeCaptain(): Promise<boolean>;
        canRemovePilot(pilot: GuildMember): Promise<boolean>;
        getRequestedOrInvitedTeams(): Promise<Team[]>;
        hasBeenInvitedToTeam(team: Team): Promise<boolean>;
        hasRequestedTeam(team: Team): Promise<boolean>;
        isCaptainOrFounder(): boolean;
        isFounder(): boolean;
        joinTeamDeniedUntil(): Promise<Date>;
        leftDiscord(): Promise<void>;
        requestTeam(team: Team): Promise<void>;
        updateName(oldMember: GuildMember): Promise<void>;
        wasPreviousCaptainOrFounderOfTeam(team: Team): Promise<boolean>;
    }
}
