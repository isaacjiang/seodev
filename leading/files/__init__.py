import controller
from flask import Blueprint

blueprint = Blueprint('files', __name__, url_prefix='/files')

# filesystem


blueprint.add_url_rule('/download', view_func=controller.fileDownload)
blueprint.add_url_rule('/upload', view_func=controller.fileUpload, methods=['POST'])
