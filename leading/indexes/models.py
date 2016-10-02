from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb
from bson import ObjectId


class GeneralModel():
    def __init__(self, nodeID=None):

        self._id = ObjectId(nodeID)
