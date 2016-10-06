from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb
from bson import ObjectId
from flask import json


class WorkFlow():
    def __init__(self, processName=None):
        self.db = leadingdb
        self.processName = processName

    def get_all(self, processName=None):
        workflows = []
        workflowTemp = self.db.workflow.find({"processName": processName}, {"_id": 0}).sort(
            "taskID", 1)
        if workflowTemp.count() != 0:
            for w in workflowTemp:
                workflows.append(w)
        return json.dumps(workflows)

    def update_task(self, processName,taskID, setValues):
        self.db.workflow.update_one({"processName": processName, "taskID": taskID},
                                    {"$set": setValues})

