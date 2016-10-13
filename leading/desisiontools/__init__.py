from flask import Blueprint
import controller, models

blueprint = Blueprint(__name__, __name__, url_prefix='/api/dtools')

blueprint.add_url_rule('/taskslist', view_func=controller.TasksService().get_tasks_list)
blueprint.add_url_rule('/updatetaskfile', view_func=controller.TasksService().update_task_files,methods = ['POST'])

blueprint.add_url_rule('/getpage', view_func=controller.TasksService().get_page)

blueprint.add_url_rule('/jointeam', view_func=controller.TasksService().join_team,methods = ['GET','POST'])
blueprint.add_url_rule('/hiring', view_func=controller.TasksService().hiring,methods = ['GET','POST'])
blueprint.add_url_rule('/workforce', view_func=controller.TasksService().workforce,methods = ['GET','POST'])
blueprint.add_url_rule('/forecast', view_func=controller.TasksService().forecast,methods = ['GET','POST'])

blueprint.add_url_rule('/resource', view_func=controller.TasksService().resource,methods = ['GET','POST'])
blueprint.add_url_rule('/budget', view_func=controller.TasksService().budget,methods = ['GET','POST'])
blueprint.add_url_rule('/negotiate1', view_func=controller.TasksService().negotiate1,methods = ['GET','POST'])
blueprint.add_url_rule('/negotiate2', view_func=controller.TasksService().negotiate2,methods = ['GET','POST'])
blueprint.add_url_rule('/actions', view_func=controller.TasksService().actions,methods = ['GET','POST'])
blueprint.add_url_rule('/projects', view_func=controller.TasksService().projects,methods = ['GET','POST'])
blueprint.add_url_rule('/visionarycompetition', view_func=controller.TasksService().visionarycompetition,methods = ['GET','POST'])
blueprint.add_url_rule('/niches', view_func=controller.TasksService().niches,methods = ['GET','POST'])
blueprint.add_url_rule('/corporateacquisitions', view_func=controller.TasksService().corporateacquisitions,methods = ['GET','POST'])