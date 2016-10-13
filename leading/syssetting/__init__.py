from flask import Blueprint
import controller

blueprint = Blueprint(__name__, __name__, url_prefix='/api/syssetting')
##System Data Service
blueprint.add_url_rule('/startbackup', view_func=controller.SystemService().backup_start)
blueprint.add_url_rule('/listbackup', view_func=controller.SystemService().backup_list)
blueprint.add_url_rule('/deletebackup', methods=['POST'],
                       view_func=controller.SystemService().backup_delete)

blueprint.add_url_rule('/restore', methods=['POST'], view_func=controller.SystemService().backup_restore)
blueprint.add_url_rule('/downloadbackup', methods=['POST'],
                       view_func=controller.SystemService().backup_download)
blueprint.add_url_rule('/backupsetting', methods=['POST'],
                       view_func=controller.SystemService().backup_setting)

blueprint.add_url_rule('/getsettings', view_func=controller.SystemService().get_all_setting)
blueprint.add_url_rule('/setsystemsetting', methods=['POST'], view_func=controller.SystemService().set_system_setting)

blueprint.add_url_rule('/getdataconfig', view_func=controller.SystemService().get_data_config)
blueprint.add_url_rule('/setdataconfig', methods=['POST'], view_func=controller.SystemService().set_data_config)
blueprint.add_url_rule('/savefiletmp', methods=['POST'], view_func=controller.SystemService().save_file_tmp)
blueprint.add_url_rule('/datainitialize', methods=['POST'], view_func=controller.SystemService().data_initialize)
# blueprint.add_url_rule('/getfiletmp', methods=['POST'], view_func=controller.SystemService().save_file_tmp)
blueprint.add_url_rule('/generatefile', methods=['POST'], view_func=controller.SystemService().generate_file)
blueprint.add_url_rule('/getfiletmp', view_func=controller.SystemService().get_file_tmp)
