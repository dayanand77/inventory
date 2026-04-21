from datetime import date, datetime

from bson import ObjectId


def serialize_document(document):
    if isinstance(document, list):
        return [serialize_document(item) for item in document]

    if isinstance(document, dict):
        serialized = {}
        for key, value in document.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, (datetime, date)):
                serialized[key] = value.isoformat()
            elif isinstance(value, dict):
                serialized[key] = serialize_document(value)
            elif isinstance(value, list):
                serialized[key] = [serialize_document(item) for item in value]
            else:
                serialized[key] = value
        return serialized

    return document
