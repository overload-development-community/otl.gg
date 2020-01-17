declare namespace EventDbTypes {
    type GetUpcomingRecordsets = {
        recordsets: [
            {
                Title: string
                DateStart: Date
                DateEnd: Date
            }[]
        ]
    }
}

export = EventDbTypes
