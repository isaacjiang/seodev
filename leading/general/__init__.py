from flask import Blueprint
import controller, models

blueprint = Blueprint(__name__, __name__, url_prefix='/api/general')

blueprint.add_url_rule('/querydashboarddata', view_func=controller.PerformanceService().queryDashboardData)

