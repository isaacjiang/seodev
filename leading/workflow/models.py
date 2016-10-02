from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb
from bson import ObjectId
from flask import json


#####

class WorkFlow():
    def __init__(self, processName=None, userName=None):
        self.db = leadingdb
        self.processName = processName
        self.userName = userName
        self.status = 'normal'
        workflowTemp = self.db.workflow.find({"processName": processName, "userName": userName}, {"_id": 0})
        if workflowTemp.count() == 0:
            workflowTemp = self.db.workflowTemp.find({"processName": processName}, {"_id": 0})
            for workflow in workflowTemp:
                if userName != None:
                    workflow['userName'] = userName
                    self.db.workflow.update_one(
                        {"processName": processName, "userName": userName, "taskID": workflow['taskID']},
                        {"$set": workflow}, upsert=True)

    def get_all(self, processName=None, userName=None):
        workflows = []
        workflowTemp = self.db.workflow.find({"processName": processName, "userName": userName}, {"_id": 0}).sort(
            "taskID", 1)
        if workflowTemp.count() == 0:
            self.__init__(processName, userName)
        for w in workflowTemp:
            workflows.append(w)
        return json.dumps(workflows)

    def update_task(self, processName, userName, taskID, setValues):
        self.db.workflow.update_one({"processName": processName, "userName": userName, "taskID": taskID},
                                    {"$set": setValues})

    def clear_user_all_task(self, processName, userName):
        workflows = []
        workflowTemp = self.db.workflow.find({"processName": processName, "userName": userName}, {"_id": 0}).sort(
            "taskID", 1)
        if workflowTemp.count() == 0:
            self.__init__(processName, userName)
        for w in workflowTemp:
            workflows.append(w)
        for workflow in workflows:
            self.db.workflow.delete_one(
                {"$and": [{"processName": workflow['processName']}, {"userName": workflow['userName']}]})
