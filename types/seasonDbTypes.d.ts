declare namespace SeasonDbTypes {
    type GetCurrentSeasonRecordset = {
        recordsets: [
            {
                Season: number
            }[]
        ]
    }

    type GetSeasonNumbersRecordset = {
        recordsets: [
            {
                Season: number
            }[],
            {
                DateEnd: Date
            }[]
        ]
    }
}

export = SeasonDbTypes
