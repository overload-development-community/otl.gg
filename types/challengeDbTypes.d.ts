import {CTFStats, GameStats, KDAStats} from "./playerDbTypes"

declare namespace ChallengeDbTypes {
    type ChallengeData = {
        ChallengeId: number
        ChallengingTeamId: number
        ChallengedTeamId: number
    }

    type PlayerCastData = GameStats & CTFStats & {
        Name: string
        Games: number
        GamesWithDamage: number
        DeathsInGamesWithDamage: number
        TwitchName: string
    }

    type ClockRecordsets = {
        recordsets: [
            {
                DateClocked: Date
                DateClockDeadline: Date
            }[]
        ]
    }

    type CloseRecordsets = {
        recordsets: [
            {
                PlayerId: number
            }[]
        ]
    }

    type ConfirmGameTypeRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type ConfirmTeamSizeRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type CreateRecordsets = {
        recordsets: [
            {
                ChallengeId: number
                OrangeTeamId: number
                BlueTeamId: number
                HomeMapTeamId: number
                Team1Penalized: boolean
                Team2Penalized: boolean
            }[]
        ]
    }

    type ExtendRecordsets = {
        recordsets: [
            {
                DateClockDeadline: Date
            }[]
        ]
    }

    type GetAllByTeamRecordsets = {
        recordsets: [
            ChallengeData[]
        ]
    }

    type GetAllByTeamsRecordsets = {
        recordsets: [
            ChallengeData[]
        ]
    }

    type GetByIdRecordsets = {
        recordsets: [
            ChallengeData[]
        ]
    }

    type GetByTeamsRecordsets = {
        recordsets: [
            ChallengeData[]
        ]
    }

    type GetCastDataRecordsets = {
        recordsets: [
            (GameStats & CTFStats & {
                ChallengingTeamWins: number
                ChallengingTeamLosses: number
                ChallengingTeamTies: number
                ChallengingTeamRating: number
                ChallengedTeamWins: number
                ChallengedTeamLosses: number
                ChallengedTeamTies: number
                ChallengedTeamRating: number
                ChallengingTeamHeadToHeadWins: number
                ChallengedTeamHeadToHeadWins: number
                HeadToHeadTies: number
                ChallengingTeamId: number
                ChallengingTeamScore: number
                ChallengedTeamId: number
                ChallengedTeamScore: number
                Map: string
                GameType: string
                MatchTime: Date
                OvertimePeriods: number,
                Name: string
                TeamId: number
            })[],
            PlayerCastData[],
            PlayerCastData[]
        ]
    }

    type GetDamageRecordsets = {
        recordsets: [
            {
                DiscordId: string
                Name: string
                TeamId: number
                OpponentDiscordId: string
                OpponentName: string
                Weapon: string
                Damage: number
            }[]
        ]
    }

    type GetDetailsRecordsets = {
        recordsets: [
            {
                Title: string
                OrangeTeamId: number
                BlueTeamId: number
                Map: string
                TeamSize: number
                MatchTime: Date
                Postseason: boolean
                HomeMapTeamId: number
                AdminCreated: boolean
                UsingHomeMapTeam: boolean
                ChallengingTeamPenalized: boolean
                ChallengedTeamPenalized: boolean
                SuggestedMap: string
                SuggestedMapTeamId: number
                SuggestedTeamSize: number
                SuggestedTeamSizeTeamId: number
                SuggestedTime: Date
                SuggestedTimeTeamId: number
                ReportingTeamId: number
                ChallengingTeamScore: number
                ChallengedTeamScore: number
                DateAdded: Date
                DateClocked: Date
                ClockTeamId: number
                DiscordId: string
                DateClockDeadline: Date
                DateClockDeadlineNotified: Date
                DateReported: Date
                DateConfirmed: Date
                DateClosed: Date
                DateRematchRequested: Date
                RematchTeamId: number
                DateRematched: Date
                OvertimePeriods: number
                DateVoided: Date
                VoD: string
                RatingChange: number
                ChallengingTeamRating: number
                ChallengedTeamRating: number
                GameType: string
                SuggestedGameType: string
                SuggestedGameTypeTeamId: number
            }[],
            {
                Map: string
            }[]
        ]
    }

    type GetMatchingNeutralsForChallengeRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type GetNotificationsRecordsets = {
        recordsets: [
            {
                ChallengeId: number
                DateClockDeadline: Date
            }[],
            {
                ChallengeId: number
                MatchTime: Date
            }[],
            {
                ChallengeId: number
                MatchTime: Date
            }[]
        ]
    }

    type GetRandomMapRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type GetStatsForTeamRecordsets = {
        recordsets: [
            (GameStats & CTFStats & {
                DiscordId: string
                Name: string
            })[]
        ]
    }

    type GetStreamersRecordsets = {
        recordsets: [
            {
                DiscordId: string
                TwitchName: string
            }[]
        ]
    }

    type GetTeamDetailsRecordsets = {
        recordsets: [
            {
                TeamId: number
                Name: string
                Tag: string
                Rating: number
                Wins: number
                Losses: number
                Ties: number
            }[],
            (KDAStats & CTFStats & {
                PlayerId: number
                Name: string
                TeamId: number
                TwitchName: string
            })[],
            {
                PlayerId: number
                Name: string
                TeamId: number
                OpponentName: string
                OpponentTeamId: number
                Weapon: string
                Damage: number
            }[],
            {
                Season: number
                Postseason: boolean
            }[]
        ]
    }

    type PickMapRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type ReportRecordsets = {
        recordsets: [
            {
                DateReported: Date
            }[]
        ]
    }

    type SetConfirmedRecordsets = {
        recordsets: [
            {
                DateConfirmed: Date
            }[]
        ]
    }

    type SetHomeMapTeamRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type SetScoreRecordsets = {
        recordsets: [
            {
                DateConfirmed: Date
            }[]
        ]
    }

    type SetTeamSizeRecordsets = {
        recordsets: [
            {
                Map: string
            }[]
        ]
    }

    type UnvoidRecordsets = {
        recordsets: [
            {
                PlayerId: number
            }[]
        ]
    }

    type VoidRecordsets = {
        recordsets: [
            {
                PlayerId: number
            }[]
        ]
    }

    type VoidWithPenaltiesRecordsets = {
        recordsets: [
            {
                TeamId: number
                First: boolean
            }[],
            {
                PlayerId: number
            }[]
        ]
    }
}

export = ChallengeDbTypes
