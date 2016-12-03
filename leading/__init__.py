# blueprint
import config
import users, sessions, syssetting, workflow,pages
import account, desisiontools, entities, general
import syslogging,administration,files

from flask import Flask
from users.models import User
from users.controller import login_manager
from sessions import MongoSessionInterface
from socket import socketio

app = Flask(__name__)

app.config.from_object(config)
#
socketio.init_app(app)


app.register_blueprint(blueprint=sessions.blueprint)
app.register_blueprint(blueprint=syssetting.blueprint)
app.register_blueprint(blueprint=users.blueprint)
app.register_blueprint(blueprint=workflow.blueprint)
app.register_blueprint(blueprint=files.blueprint)

app.register_blueprint(blueprint=administration.blueprint)
app.register_blueprint(blueprint=pages.blueprint)
app.register_blueprint(blueprint=account.blueprint)
app.register_blueprint(blueprint=desisiontools.blueprint)
app.register_blueprint(blueprint=entities.blueprint)
app.register_blueprint(blueprint=general.blueprint)


login_manager.init_app(app)
# # session init
app.session_interface = MongoSessionInterface()
