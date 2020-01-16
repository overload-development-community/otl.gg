declare namespace TeamTypes {
    type TeamInfo = {
        teamId: number
        name: string
        tag: string
        disbanded: boolean
        locked: boolean
        rating: number
        wins: number
        losses: number
        ties: number
    }
}

export = TeamTypes
