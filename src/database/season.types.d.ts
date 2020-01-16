declare namespace SeasonDbTypes {
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
