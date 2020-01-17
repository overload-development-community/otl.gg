import Team from "./team";
import PlayerTypes from "./player.types";

declare namespace ChallengeTypes {
    type ChallengeConstructor = {
        id?: number
        challengingTeam: Team
        challengedTeam: Team
    }

    type ChallengeData = {
        id: number
        challengingTeamId: number
        challengedTeamId: number
    };

    type CastData = {
        data: PlayerTypes.GameStats & PlayerTypes.CTFStats & {
            challengingTeamWins: number
            challengingTeamLosses: number
            challengingTeamTies: number
            challengingTeamRating: number
            challengedTeamWins: number
            challengedTeamLosses: number
            challengedTeamTies: number
            challengedTeamRating: number
            challengingTeamHeadToHeadWins: number
            challengedTeamHeadToHeadWins: number
            headToHeadTies: number
            challengingTeamId: number
            challengingTeamScore: number
            challengedTeamId: number
            challengedTeamScore: number
            map: string
            gameType: string
            matchTime: Date
            name: string
            teamId: number
        }
        challengingTeamRoster: CastDataRoster[]
        challengedTeamRoster: CastDataRoster[]
    }

    type CastDataRoster = PlayerTypes.GameStats & PlayerTypes.CTFStats & {
        name: string
        games: number
        gamesWithDamage: number
        deathsInGamesWithDamage: number
        twitchName: string
    }

    type ClockedData = {
        clocked: Date
        clockDeadline: Date
    };

    type CreateData = {
        id: number
        orangeTeam: Team
        blueTeam: Team
        homeMapTeam: Team
        team1Penalized: boolean
        team2Penalized: boolean
    }

    type DamageData = PlayerTypes.WeaponStats & {
        discordId: string
        name: string
        teamId: number
        opponentDiscordId: string
        opponentName: string
    }

    type DetailsData = {
        title: string
        orangeTeamId: number
        blueTeamId: number
        map: string
        teamSize: number
        matchTime: Date
        postseason: boolean
        homeMapTeamId: number
        adminCreated: boolean
        homesLocked: boolean
        usingHomeMapTeam: boolean
        challengingTeamPenalized: boolean
        challengedTeamPenalized: boolean
        suggestedMap: string
        suggestedMapTeamId: number
        suggestedTeamSize: number
        suggestedTeamSizeTeamId: number
        suggestedTime: Date
        suggestedTimeTeamId: number
        reportingTeamId: number
        challengingTeamScore: number
        challengedTeamScore: number
        casterDiscordId: string
        dateAdded: Date
        dateClocked: Date
        clockTeamId: number
        dateClockDeadline: Date
        dateClockDeadlineNotified: Date
        dateReported: Date
        dateConfirmed: Date
        dateClosed: Date
        dateRematchRequested: Date
        rematchTeamId: number
        dateRematched: Date
        dateVoided: Date
        overtimePeriods: number
        vod: string
        ratingChange: number
        challengingTeamRating: number
        challengedTeamRating: number
        gameType: string
        suggestedGameType: string
        suggestedGameTypeTeamId: number
        homeMaps: string[]
    }

    type GameBoxScore = GamePlayerStatsByTeam & {
        scoreChanged: boolean
    }

    type GamePlayerStats = PlayerTypes.GameStats & PlayerTypes.CTFStats & {
        pilot: PlayerTypes.UserOrGuildMember
        name: string
    }

    type GamePlayerStatsByTeam = {
        challengingTeamStats: GamePlayerStats[]
        challengedTeamStats: GamePlayerStats[]
    }

    type GamesByChallengeId = {
        [x: number]: {
            challengingTeamRating: number
            challengedTeamRating: number
            change: number
        }
    }

    type NotificationsData = {
        expiredClocks: {
            challengeId: number
            dateClockDeadline: Date
        }[]
        startingMatches: {
            challengeId: number
            matchTime: Date
        }[]
        missedMatches: {
            challengeId: number
            matchTime: Date
        }[]
    }

    type PlayersByTeam = {
        [x: string]: {
            member: PlayerTypes.UserOrGuildMember
            team: Team
        }
    }

    type SetDamageData = PlayerTypes.WeaponStats & {
        team: Team
        discordId: string
        opponentTeam: Team
        opponentDiscordId: string
    }

    type StreamerData = {
        discordId: string
        twitchName: string
    }

    type TeamDetailsData = {
        teams: {
            teamId: number
            name: string
            tag: string
            rating: number
            wins: number
            losses: number
            ties: number
        }[]
        stats: (PlayerTypes.KDAStats & PlayerTypes.CTFStats & {
            playerId: number
            name: string
            teamId: number
            twitchName: string
        })[]
        damage: (PlayerTypes.WeaponStats & {
            playerId: number
            name: string
            teamId: number
            opponentName: string
            opponentTeamId: number
        })[]
        season: {
            season: number
            postseason: boolean
        }
    }

    type TeamPenaltyData = {
        teamId: number
        first: boolean
    }

    type TeamStatsData = PlayerTypes.GameStats & PlayerTypes.CTFStats & {
        discordId: string
        name: string
    }
}

export = ChallengeTypes
