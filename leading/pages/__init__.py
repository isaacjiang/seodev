from flask import Blueprint
import controller

# Application /
blueprint = Blueprint('website',__name__)

blueprint.add_url_rule('/',view_func = controller.index)
blueprint.add_url_rule('/dashboard',view_func = controller.dashboard)
blueprint.add_url_rule('/market',view_func = controller.market)
blueprint.add_url_rule('/finance',view_func = controller.finance)
blueprint.add_url_rule('/settings',view_func = controller.settings)
blueprint.add_url_rule('/help',view_func = controller.help)



