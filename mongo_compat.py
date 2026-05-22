from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from bson import ObjectId


def _normalize_id(doc_id):
    try:
        if ObjectId.is_valid(doc_id):
            return ObjectId(doc_id)
    except Exception:
        pass
    return doc_id


@dataclass
class Doc:
    _data: Dict[str, Any]

    @property
    def id(self):
        return str(self._data.get("_id"))

    def to_dict(self):
        return {k: v for k, v in self._data.items() if k != "_id"}


class DocRef:
    def __init__(self, collection, doc_id):
        self.collection = collection
        self.doc_id = _normalize_id(doc_id)

    def update(self, data: Dict[str, Any]):
        return self.collection._col.update_one({"_id": self.doc_id}, {"$set": data})


class Query:
    def __init__(self, collection, filters=None, limit_val: Optional[int] = None):
        self.collection = collection
        self.filters = filters or []
        self.limit_val = limit_val

    def where(self, field, op, value):
        return Query(self.collection, self.filters + [(field, op, value)], self.limit_val)

    def limit(self, n: int):
        return Query(self.collection, self.filters, n)

    def _build_filter(self):
        query = {}
        for field, op, value in self.filters:
            if op == "==":
                query[field] = value
            elif op == "!=":
                query[field] = {"$ne": value}
            elif op == ">":
                query[field] = {"$gt": value}
            elif op == ">=":
                query[field] = {"$gte": value}
            elif op == "<":
                query[field] = {"$lt": value}
            elif op == "<=":
                query[field] = {"$lte": value}
            elif op == "in":
                query[field] = {"$in": value if isinstance(value, list) else [value]}
            elif op == "array-contains":
                query[field] = value
            elif op == "array-contains-any":
                query[field] = {"$in": value if isinstance(value, list) else [value]}
            else:
                query[field] = value
        return query

    def get(self) -> List[Doc]:
        cursor = self.collection._col.find(self._build_filter())
        if self.limit_val is not None:
            cursor = cursor.limit(self.limit_val)
        return [Doc(doc) for doc in cursor]

    def stream(self) -> List[Doc]:
        return self.get()


class Collection:
    def __init__(self, mongo_collection):
        self._col = mongo_collection

    def where(self, field, op, value):
        return Query(self, [(field, op, value)])

    def get(self):
        return [Doc(doc) for doc in self._col.find({})]

    def stream(self):
        return self.get()

    def document(self, doc_id):
        return DocRef(self, doc_id)

    def add(self, data: Dict[str, Any]):
        result = self._col.insert_one(data)
        return result.inserted_id


class MongoCompatDB:
    def __init__(self, database):
        self._db = database

    def collection(self, name: str):
        return Collection(self._db[name])
