from flask import Blueprint
import controller, models

blueprint = Blueprint(__name__, __name__, url_prefix='/api/account')
blueprint.add_url_rule('/getaccountinfo', view_func=controller.AccountService().query_account)
