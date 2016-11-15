from flask import Blueprint
import controller, models

blueprint = Blueprint(__name__, __name__, url_prefix='/api/general')

blueprint.add_url_rule('/querydashboarddata', view_func=controller.PerformanceService().queryDashboardData)
blueprint.add_url_rule('/querymarketdata', view_func=controller.PerformanceService().queryCurrentMarketData)
blueprint.add_url_rule('/instruction', view_func=controller.InstructionService().instruction, methods=['GET', 'POST'])
