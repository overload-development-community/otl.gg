import PlayerTypes from "./player.types"
import TeamTypes from "./team.types"

declare namespace MatchTypes {
    type ConfirmedMatch = {
        match: {
            challengeId: number
            title: string
            challengingTeam: TeamTypes.TeamInfo & {
                color: string
            }
            challengedTeam: TeamTypes.TeamInfo & {
                color: string
            }
            challengingTeamScore: number
            challengedTeamScore: number
            matchTime: Date
            map: string
            dateClosed: Date
            overtimePeriods: number
            vod: string
            ratingChange: number
            challengingTeamRating: number
            challengedTeamRating: number
            gameType: string
        }
        stats: (PlayerTypes.GameStats & PlayerTypes.CTFStats & {
            teamId: number
            tag: string
            playerId: number
            name: string
            kda: number
        })[]
    }

    type ConfirmedMatchesData = {
        completed: {
            challengeId: number
            title: string
            challengingTeamId: number
            challengedTeamId: number
            challengingTeamScore: number
            challengedTeamScore: number
            matchTime: Date
            map: string
            dateClosed: Date
            overtimePeriods: number
            vod: string
            ratingChange: number
            challengingTeamRating: number
            challengedTeamRating: number
            gameType: string
        }[]
        stats: ConfirmedMatchStatData[]
        standings: TeamTypes.TeamInfo[]
    }

    type ConfirmedMatchStatData = PlayerTypes.GameStats & PlayerTypes.CTFStats & {
        challengeId: number
        teamId: number
        tag: string
        teamName: string
        playerId: number
        name: string
    }

    type CurrentMatch = {
        id: number
        challengingTeam: TeamTypes.TeamInfo
        challengedTeam: TeamTypes.TeamInfo
        challengingTeamScore: number
        challengedTeamScore: number
        matchTime: Date
        map: string
        dateClosed: Date
        overtimePeriods: number
        gameType: string
    }

    type CurrentMatchesData = {
        matches: {
            id: number
            challengingTeamId: number
            challengedTeamId: number
            challengingTeamScore: number
            challengedTeamScore: number
            matchTime: Date
            postseason: boolean
            map: string
            dateClosed: Date
            overtimePeriods: number
            gameType: string
        }[]
        standings: TeamTypes.TeamInfo[]
        previousStandings: TeamTypes.TeamInfo[]
    }

    type PendingMatches = {
        matches: {
            challengeId: number
            title: string
            challengingTeam: TeamTypes.TeamInfo & {
                color: string
            }
            challengedTeam: TeamTypes.TeamInfo & {
                color: string
            }
            matchTime: Date
            map: string
            twitchName: string
            timeRemaining: number
            gameType: string
        }[]
        completed: number
    }

    type PendingMatchesData = {
        matches: {
            challengeId: number
            title: string
            challengingTeamId: number
            challengedTeamId: number
            matchTime: Date
            map: string
            postseason: boolean
            twitchName: string
            gameType: string
        }[]
        standings: TeamTypes.TeamInfo[]
        previousStandings: TeamTypes.TeamInfo[]
        completed: number
    }

    type SeasonData = {
        matches: {
            id: number
            season: number
            challengingTeamId: number
            challengedTeamId: number
            challengingTeamScore: number
            challengedTeamScore: number
            gameType: string
        }[]
        k: number
    }

    type UpcomingMatch = {
        challengeId: number
        challengingTeamTag: string
        challengingTeamName: string
        challengedTeamTag: string
        challengedTeamName: string
        matchTime: Date
        map: string
        twitchName: string
        gameType: string
    }
}

export = MatchTypes
