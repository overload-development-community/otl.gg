export type GetPlayedBySeasonRecordsets = {
    recordsets: [
        {
            Map: string
        }[],
        {
            DateEnd: Date
        }[]
    ]
}

export type ValidateRecordsets = {
    recordsets: [
        {
            Map: string,
            Stock: boolean
        }[]
    ]
}
