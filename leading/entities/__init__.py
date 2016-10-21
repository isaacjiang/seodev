from flask import Blueprint
import controller, models

blueprint = Blueprint(__name__, __name__, url_prefix='/api/entities')

blueprint.add_url_rule('/getuserinfo', view_func=controller.EntitiesService().getUserInfo)
blueprint.add_url_rule('/getuserslist', view_func=controller.EntitiesService().get_users_list)

