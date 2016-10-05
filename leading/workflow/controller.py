__author__ = 'isaac'
import models
from flask import json, request
import importlib


class WorkflowService():
    def __init__(self):
        self.model = models

    def queryWorkflow(self):
        if request.method == 'GET':
            processName = request.args['processName']

            workflow = self.model.WorkFlow(processName).get_all(processName)
            return workflow

    def launchWorkflow(self):
        if request.method == 'POST':
            task = json.loads(request.data)

            workflow = self.model.WorkFlow(task['processName'])
            workflow.update_task(task['processName'], task['userName'], task['taskID'],
                                 {'data': task['data'], 'status': 'saved'})
            result = workflow.get_all(task['processName'], task['userName'])
            return result

    def clearworkflow(self):
        if request.method == 'POST':
            username = request.args['username']
            processname = request.args['processname']
            workflow = self.model.WorkFlow(processname, username)
            workflow.clear_user_all_task(processname, username)
            return json.dumps({"message": 'All Work Flows deleted.'})
