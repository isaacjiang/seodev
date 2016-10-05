from flask import Blueprint
import controller

blueprint = Blueprint(__name__, __name__, url_prefix='/api/workflow')
##System Data Service
blueprint.add_url_rule('/queryworkflow', view_func=controller.WorkflowService().queryWorkflow)

