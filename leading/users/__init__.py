from flask import Blueprint
import controller

blueprint = Blueprint('users', __name__, url_prefix='/api/users')

##Useres Data Service
blueprint.add_url_rule('/userstatus', view_func=controller.UserService().userStatus)
blueprint.add_url_rule('/register', methods=['POST'], view_func=controller.UserService().register)

blueprint.add_url_rule('/deleteuser', methods=['POST'], view_func=controller.UserService().delete_user)
blueprint.add_url_rule('/modifieduser', methods=['POST'], view_func=controller.UserService().modified_user)

blueprint.add_url_rule('/login', methods=['POST'], view_func=controller.UserService().login)
blueprint.add_url_rule('/logout', view_func=controller.UserService().logout)

blueprint.add_url_rule('/getalluser', methods=['GET', 'POST'], view_func=controller.UserService().get_all)

blueprint.add_url_rule('/setuser', methods=['GET', 'POST'], view_func=controller.UserService().set_user)
blueprint.add_url_rule('/listallusers', view_func=controller.UserService().listallusers)
