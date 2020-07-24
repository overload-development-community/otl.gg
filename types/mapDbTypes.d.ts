declare namespace MapDbTypes {
    type GetPlayedBySeasonRecordsets = {
        recordsets: [
            {
                Map: string
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }

    type MapGameTypeRecordsets = {
        recordsets: [
            {
                Map: string
                GameType: string
            }[]
        ]
    }

    type ValidateRecordsets = {
        recordsets: [
            {
                Map: string
                Stock: boolean
            }[]
        ]
    }
}

export = MapDbTypes
