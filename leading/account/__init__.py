from flask import Blueprint
import controller, models

blueprint = Blueprint(__name__, __name__, url_prefix='/api/account')
blueprint.add_url_rule('/getaccountinfo', view_func=controller.AccountService().query_account)
blueprint.add_url_rule('/accountbudget', methods=['GET', 'POST'],
                       view_func=controller.AccountBudgetService().accountbudget)
