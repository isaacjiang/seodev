from flask import Blueprint
import controller
import models

blueprint = Blueprint('adminitration', __name__, url_prefix='/app/system')

blueprint.add_url_rule('/register', view_func=controller.userRegister)
blueprint.add_url_rule('/login', view_func=controller.userLogin)
blueprint.add_url_rule('/backupsetting', view_func=controller.backupSetting)
blueprint.add_url_rule('/datainit', view_func=controller.datainit)
blueprint.add_url_rule('/vcinit', view_func=controller.init_visionary_competition)
blueprint.add_url_rule('/systeminit', view_func=controller.init_system)
