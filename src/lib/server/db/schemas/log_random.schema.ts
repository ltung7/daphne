export default {
    fields: [
        {
            "name": "log_id",
            "type": "STRING",
            "mode": "REQUIRED",
            "description": "Id of the log_random",
        },
        {
            "name": "description",
            "type": "STRING",
            "mode": "REQUIRED",
            "description": "Description of the log_random",
        },
        {
            "name": "data",
            "type": "STRING",
            "mode": "REQUIRED",
            "description": "Data of the log_random",
        },
        {
            "name": "timestamp",
            "type": "INTEGER",
            "mode": "REQUIRED",
            "description": "Date of event",
        }
    ],
    index: ["description"],
    editable: 'log_id',
    jsonable: 'data'
}