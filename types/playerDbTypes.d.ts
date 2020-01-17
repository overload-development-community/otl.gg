declare namespace PlayerDbTypes {
    type BannedFromTeamUntilRecordsets = {
        recordsets: [
            {
                DateExpires: Date
            }[]
        ]
    }

    type ClearTimezoneRecordsets = {
        recordsets: [
            {
                PlayerId: number
            }[]
        ]
    }

    type CTFStats = {
        Captures: number
        Pickups: number
        CarrierKills: number
        Returns: number
    }

    type GameStats = KDAStats & {
        Damage: number
    }

    type GetCareerRecordsets = {
        recordsets: [
            {
                Name: string
                TwitchName: string
                Timezone: string
                TeamId: number
                Tag: string
                TeamName: string
            }[],
            (GameStats & CTFStats & {
                Season: number
                Postseason: boolean
                TeamId: number
                Tag: string
                TeamName: string
                Games: number
                GamesWithDamage: number
                DeathsInGamesWithDamage: number
                OvertimePeriods: number
            })[],
            (GameStats & CTFStats & {
                TeamId: number
                Tag: string
                TeamName: string
                Games: number
                GamesWithDamage: number
                DeathsInGamesWithDamage: number
                OvertimePeriods: number
            })[],
            (KDAStats & CTFStats & {
                TeamId: number
                Tag: string
                TeamName: string
                Games: number
                OvertimePeriods: number
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                BestMatchTime: Date
                BestMap: string
                BestCaptures: number
                BestPickups: number
                BestCarrierKills: number
                BestReturns: number
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            })[],
            (KDAStats & CTFStats & {
                Map: string
                Games: number
                OvertimePeriods: number
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                BestOpponentTeamId: number
                BestOpponentTag: string
                BestOpponentTeamName: string
                BestMatchTime: Date
                BestCaptures: number
                BestPickups: number
                BestCarrierKills: number
                BestReturns: number
                BestKills: number
                BestAssists: number
                BestDeaths: number
                BestDamage: number
            })[],
            {
                Weapon: string
                Damage: string
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetCastedChallengesRecordsets = {
        recordsets: [
            {
                ChallengeId: number
            }[]
        ]
    }

    type GetFreeAgentsRecordsets = {
        recordsets: [
            {
                PlayerId: number
                Name: string
                DiscordId: string
                Timezone: string
            }[]
        ]
    }

    type GetGameLogRecordsets = {
        recordsets: [
            {
                Name: string
                TeamId: number
                Tag: string
                TeamName: string
            }[],
            (GameStats & CTFStats & {
                ChallengeId: number
                ChallengingTeamTag: string
                ChallengedTeamTag: string
                TeamId: number
                Tag: string
                Name: string
                OvertimePeriods: number
                OpponentTeamId: number
                OpponentTag: string
                OpponentName: string
                TeamScore: number
                OpponentScore: number
                RatingChange: number
                TeamSize: number
                MatchTime: Date
                Map: string
                GameType: string
            })[],
            {
                Season: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetRecordsCTFPlayerRecordsets = {
        recordsets: [
            {
                TeamSize: number
                Captures: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Pickups: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                CarrierKills: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Returns: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Damage: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                KDA: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetRecordsCTFTeamRecordsets = {
        recordsets: [
            {
                TeamSize: number
                Score: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Pickups: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                CarrierKills: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Returns: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Damage: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                TeamKDA: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetRecordsTAPlayerRecordsets = {
        recordsets: [
            {
                TeamSize: number
                KDA: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Kills: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Assists: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Deaths: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Damage: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                DamagePerDeath: number
                TeamId: number
                Tag: string
                TeamName: string
                PlayerId: number
                Name: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetRecordsTATeamRecordsets = {
        recordsets: [
            {
                TeamSize: number
                TeamKDA: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Score: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Assists: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Deaths: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                Damage: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                TeamSize: number
                DamagePerDeath: number
                TeamId: number
                Tag: string
                TeamName: string
                OpponentTeamId: number
                OpponentTag: string
                OpponentTeamName: string
                ChallengeId: number
                MatchTime: Date
                Map: string
                OvertimePeriods: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetRequestedOrInvitedTeamsRecordsets = {
        recordsets: [
            {
                TeamId: number,
                Name: string,
                Tag: string
            }[]
        ]
    }

    type GetSeasonStatsRecordsets = {
        recordsets: [
            {
                PlayerId: number
                Name: string
                TeamId: number
                TeamName: string
                Tag: string
                Disbanded: boolean
                Locked: boolean
                AvgCaptures: number
                AvgPickups: number
                AvgCarrierKills: number
                AvgReturns: number
                AvgKills: number
                AvgAssists: number
                AvgDeaths: number
                AvgDamagePerGame: number
                AvgDamagePerDeath: number
                KDA: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetStatsRecordsets = {
        recordsets: [
            (GameStats & {
                Games: number
                DeathsInGamesWithDamage: number
            })[],
            (GameStats & CTFStats & {
                Games: number
            })[],
            {
                Weapon: string
                Damage: number
            }[],
            {
                PlayerId: number
                Name: string
                Tag: string
                Season: number
            }[]
        ]
    }

    type GetTopKdaRecordsets = {
        recordsets: [
            {
                PlayerId: number
                Name: string
                TeamId: number
                TeamName: string
                Tag: string
                Disbanded: boolean
                Locked: boolean
                KDA: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type GetTwitchNameRecordsets = {
        recordsets: [
            {
                TwitchName: string
            }[]
        ]
    }

    type GetTimezoneRecordsets = {
        recordsets: [
            {
                Timezone: string
            }[]
        ]
    }

    type JoinTeamDeniedUntilRecordsets = {
        recordsets: [
            {
                DateExpires: Date
            }[]
        ]
    }

    type KDAStats = {
        Kills: number
        Assists: number
        Deaths: number
    }

    type SetTimezoneRecordsets = {
        recordsets: [
            {
                PlayerId: number
            }[]
        ]
    }
}

export = PlayerDbTypes
