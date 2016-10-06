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

