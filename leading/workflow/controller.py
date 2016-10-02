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
            username = request.args['username']
            workflow = self.model.WorkFlow(processName, username).get_all(processName, username)
            return workflow

    def launchWorkflow(self):
        if request.method == 'POST':
            task = json.loads(request.data)
        if 'method' in task.keys():
            if task['method'] == 'edit':
                workflow = self.model.WorkFlow('addDevice', task['userName'])
                for i in range(1, 7, 1):
                    workflow.update_task('addDevice', task['userName'], i,
                                         {'data': task['data'], 'status': 'saved', 'canSetAddress': False})
                result = workflow.get_all(task['processName'], task['userName'])
                return result
            elif task['method'] == 'fromOpenAddress':
                workflow = self.model.WorkFlow('addDevice', task['userName'])
                workflow.clear_user_all_task('addDevice', task['userName'])
                self.model.WorkFlow('addDevice', task['userName']).__init__()
                workflow.update_task('addDevice', task['userName'], 1, {'data': task['data']})
                workflow.update_task('addDevice', task['userName'], 4,
                                     {'status': 'saved', 'canSetAddress': False, 'data': task['data'],
                                      'method': 'fromOpenAddress'})
                result = workflow.get_all(task['processName'], task['userName'])
                return result
        else:
            workflow = self.model.WorkFlow(task['processName'], task['userName'])
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
