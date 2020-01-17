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
