import Team from "./team";
import PlayerTypes from "./player.types";

type CTFStats = {
    captures: number,
    pickups: number,
    carrierKills: number,
    returns: number
}

type GameStats = KDAStats & {
    damage: number
}

type KDAStats = {
    kills: number,
    assists: number,
    deaths: number
}

type WeaponStats = {
    weapon: string,
    damage: number
}

export type ChallengeConstructor = {
    id?: number,
    challengingTeam: Team,
    challengedTeam: Team
}

export type ChallengeData = {
    id: number,
    challengingTeamId: number,
    challengedTeamId: number
};

export type CastData = {
    data: GameStats & CTFStats & {
        challengingTeamWins: number,
        challengingTeamLosses: number,
        challengingTeamTies: number,
        challengingTeamRating: number,
        challengedTeamWins: number,
        challengedTeamLosses: number,
        challengedTeamTies: number,
        challengedTeamRating: number,
        challengingTeamHeadToHeadWins: number,
        challengedTeamHeadToHeadWins: number,
        headToHeadTies: number,
        challengingTeamId: number,
        challengingTeamScore: number,
        challengedTeamId: number,
        challengedTeamScore: number,
        map: string,
        gameType: string,
        matchTime: Date,
        name: string,
        teamId: number
    },
    challengingTeamRoster: CastDataRoster[],
    challengedTeamRoster: CastDataRoster[]    
}

export type CastDataRoster = GameStats & CTFStats & {
    name: string,
    games: number,
    gamesWithDamage: number,
    deathsInGamesWithDamage: number,
    twitchName: string
}

export type ClockedData = {
    clocked: Date,
    clockDeadline: Date
};

export type CreateData = {
    id: number,
    orangeTeam: Team,
    blueTeam: Team,
    homeMapTeam: Team,
    team1Penalized: boolean,
    team2Penalized: boolean
}

export type DamageData = WeaponStats & {
    discordId: string,
    name: string,
    teamId: number,
    opponentDiscordId: string,
    opponentName: string
}

export type DetailsData = {
    title: string,
    orangeTeamId: number,
    blueTeamId: number,
    map: string,
    teamSize: number,
    matchTime: Date,
    postseason: boolean,
    homeMapTeamId: number,
    adminCreated: boolean,
    homesLocked: boolean,
    usingHomeMapTeam: boolean,
    challengingTeamPenalized: boolean,
    challengedTeamPenalized: boolean,
    suggestedMap: string,
    suggestedMapTeamId: number,
    suggestedTeamSize: number,
    suggestedTeamSizeTeamId: number,
    suggestedTime: Date,
    suggestedTimeTeamId: number,
    reportingTeamId: number,
    challengingTeamScore: number,
    challengedTeamScore: number,
    casterDiscordId: string,
    dateAdded: Date,
    dateClocked: Date,
    clockTeamId: number,
    dateClockDeadline: Date,
    dateClockDeadlineNotified: Date,
    dateReported: Date,
    dateConfirmed: Date,
    dateClosed: Date,
    dateRematchRequested: Date,
    rematchTeamId: number,
    dateRematched: Date,
    dateVoided: Date,
    overtimePeriods: number,
    vod: string,
    ratingChange: number,
    challengingTeamRating: number,
    challengedTeamRating: number,
    gameType: string,
    suggestedGameType: string,
    suggestedGameTypeTeamId: number,
    homeMaps: string[]
}

export type GameBoxScore = GamePlayerStatsByTeam & {
    scoreChanged: boolean
}

export type GamePlayerStats = GameStats & CTFStats & {
    pilot: PlayerTypes.UserOrGuildMember,
    name: string
}

export type GamePlayerStatsByTeam = {
    challengingTeamStats: GamePlayerStats[],
    challengedTeamStats: GamePlayerStats[]
}

export type NotificationsData = {
    expiredClocks: {
        challengeId: number,
        dateClockDeadline: Date
    }[],
    startingMatches: {
        challengeId: number,
        matchTime: Date
    }[],
    missedMatches: {
        challengeId: number,
        matchTime: Date
    }[]
}

export type PlayersByTeam = {
    [x: string]: {
        member: PlayerTypes.UserOrGuildMember,
        team: Team
    }
}

export type SetDamageData = WeaponStats & {
    team: Team,
    discordId: string,
    opponentTeam: Team,
    opponentDiscordId: string
}

export type StreamerData = {
    discordId: string,
    twitchName: string
}

export type TeamDetailsData = {
    teams: {
        teamId: number,
        name: string,
        tag: string,
        rating: number,
        wins: number,
        losses: number,
        ties: number
    }[],
    stats: (KDAStats & CTFStats & {
        playerId: number,
        name: string,
        teamId: number,
        twitchName: string
    })[],
    damage: (WeaponStats & {
        playerId: number,
        name: string,
        teamId: number,
        opponentName: string,
        opponentTeamId: number
    })[],
    season: {
        season: number,
        postseason: boolean
    }
}

export type TeamPenaltyData = {
    teamId: number,
    first: boolean
}

export type TeamStatsData = GameStats & CTFStats & {
    discordId: string,
    name: string
}
