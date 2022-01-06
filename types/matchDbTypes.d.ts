import PlayerDbTypes from "./playerDbTypes"
import TeamDbTypes from "./teamDbTypes"

declare namespace MatchDbTypes {
    type GetConfirmedRecordsets = {
        recordsets: [
            {
                ChallengeId: number
                Title: string
                ChallengingTeamId: number
                ChallengedTeamId: number
                ChallengingTeamScore: number
                ChallengedTeamScore: number
                MatchTime: Date
                Map: string
                DateClosed: Date
                OvertimePeriods: number
                VoD: string
                RatingChange: number
                ChallengingTeamRating: number
                ChallengedTeamRating: number
                GameType: string
            }[],
            (PlayerDbTypes.GameStats & PlayerDbTypes.CTFStats & {
                ChallengeId: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                NetDamage: number
            })[],
            TeamDbTypes.TeamData[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetCurrentRecordsets = {
        recordsets: [
            {
                ChallengeId: number
                ChallengingTeamId: number
                ChallengedTeamId: number
                ChallengingTeamScore: number
                ChallengedTeamScore: number
                MatchTime: Date
                Postseason: boolean
                Map: string
                DateClosed: Date
                OvertimePeriods: number
                GameType: string
            }[],
            TeamDbTypes.TeamData[],
            TeamDbTypes.TeamData[]
        ]
    }

    type GetPendingRecordsets = {
        recordsets: [
            {
                ChallengeId: number
                Title: string
                ChallengingTeamId: number
                ChallengedTeamId: number
                MatchTime: Date
                Map: string
                Postseason: boolean
                TwitchName: string
                GameType: string
            }[],
            TeamDbTypes.TeamData[],
            TeamDbTypes.TeamData[],
            {
                Completed: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetSeasonDataFromChallengeRecordsets = {
        recordsets: [
            {
                ChallengeId: number
                Season: number
                ChallengingTeamId: number
                ChallengedTeamId: number
                ChallengingTeamScore: number
                ChallengedTeamScore: number
                GameType: string
            }[],
            {
                K: number
                SeasonAdded: boolean
                Season: number
            }[],
            {
                TeamId: number
            }[]
        ]
    }

    type GetUpcomingRecordsets = {
        recordsets: [
            {
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengingTeamName: string
                ChallengedTeamTag: string
                ChallengedTeamName: string
                MatchTime: Date
                Map: string
                TwitchName: string
                GameType: string
                DiscordEventId: string
            }[]
        ]
    }
}

export = MatchDbTypes
