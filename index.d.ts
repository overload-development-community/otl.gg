import NewTeam from "./src/models/newTeam";
import Team from "./src/models/team";

type GameRecord = {
    teamSize: number,
    record: number,
    playerId?: number,
    name?: string,
    teamId: number,
    tag: string,
    teamName: string,
    opponentTeamId: number,
    opponentTag: string,
    opponentTeamName: string,
    challengeId: number,
    matchTime: Date,
    map: string,
    overtimePeriods: number
};

declare module "discord.js" {
    /**
     * TypeScript definitions for discordJs.GuildMember.extensions.js.
     */
    interface GuildMember {
        addTwitchName(name: string): Promise<void>;
        bannedFromTeamUntil(team: Team): Promise<Date>;
        canBeCaptain(): Promise<boolean>;
        canRemovePilot(pilot: GuildMember): Promise<boolean>;
        clearTimezone(): Promise<void>;
        createNewTeam(): Promise<NewTeam>;
        getNewTeam(): Promise<NewTeam>;
        getRequestedOrInvitedTeams(): Promise<Team[]>;
        getStats(): Promise<{playerId: number, name: string, tag: string, games: number, kills: number, assists: number, deaths: number, damage: number, deathsInGamesWithDamage: number, season: number}>;
        getTeam(): Promise<Team>;
        getTimezone(): Promise<string>;
        getTwitchName(): Promise<string>;
        hasBeenInvitedToTeam(team: Team): Promise<boolean>;
        hasRequestedTeam(team: Team): Promise<boolean>;
        isCaptainOrFounder(): boolean;
        isFounder(): boolean;
        joinTeamDeniedUntil(): Promise<Date>;
        leftDiscord(): Promise<void>;
        removeTwitchName(): Promise<void>;
        requestTeam(team: Team): Promise<void>;
        setTimezone(timezone: string): Promise<void>;
        updateName(oldMember: GuildMember): Promise<void>;
        wasPreviousCaptainOrFounderOfTeam(team: Team): Promise<boolean>;
    }

    /**
     * TypeScript definitions for discordJs.User.extensions.js.
     */
    interface User {
        getStats(): Promise<{playerId: number, name: string, tag: string, games: number, kills: number, assists: number, deaths: number, damage: number, deathsInGamesWithDamage: number, season: number}>;
    }

    /**
     * Correction to discord.js's index.d.ts file, the parameters of this function were updated between 11.3.0 and the latest version.
     */
    interface Role {
		setColor(color: ColorResolvable, reason?: string): Promise<Role>;
    }

    /**
     * Correction to discord.js's index.d.ts file to add a new property to ChannelData.
     */
	type ChannelDataWithReason = {
		type?: "category" | "text" | "voice" | "news" | "store";
		name?: string;
		position?: number;
		topic?: string;
		nsfw?: boolean;
		bitrate?: number;
		userLimit?: number;
		parent?: ChannelResolvable;
		permissionOverwrites?: PermissionOverwrites[] | ChannelCreationOverwrites[];
        rateLimitPerUser?: number;
        reason?: string;
    };
    interface Guild {
        createChannel(name: string, options?: ChannelDataWithReason): Promise<CategoryChannel | TextChannel | VoiceChannel>;
    }
}
