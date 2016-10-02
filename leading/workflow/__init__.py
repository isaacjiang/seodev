from flask import Blueprint
import controller

blueprint = Blueprint(__name__, __name__, url_prefix='/rest/workflow')
##System Data Service
blueprint.add_url_rule('/queryworkflow', view_func=controller.WorkflowService().queryWorkflow)
blueprint.add_url_rule('/clearworkflow', methods=['POST'],
                       view_func=controller.WorkflowService().clearworkflow)
blueprint.add_url_rule('/launchworkflow', methods=['POST'],
                       view_func=controller.WorkflowService().launchWorkflow)
