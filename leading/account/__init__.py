from flask import Blueprint
import controller, models

blueprint = Blueprint(__name__, __name__, url_prefix='/rest/general')

blueprint.add_url_rule('/veryfyip', view_func=controller.GeneralService().verifyIP)

