from models import ThreadWorker
from datetime import datetime
from flask_socketio import SocketIO, emit, join_room, leave_room

socketio = SocketIO()


@socketio.on('connect', namespace='/ipc')
def handle_connect():
    print "Socket connected ipc..."
    return {"status": 'Connected root'}


@socketio.on('disconnect', namespace='/ipc')
def handle_disconnect():
    print "Socket disconnected ipc..."
    return {"status": 'disConnected root'}


@socketio.on('join', namespace='/ipc')
def hande_messaging(data):
    # print "join" + str(data)
    room = data["teamInfo"]["teamName"]
    join_room(room)
    emit('message', str(datetime.now().strftime("%I:%M") + ": " + data['userInfo']["username"] + " join room: " + room),
         room=room)


@socketio.on('notification', namespace='/ipc')
def hande_messaging(data):
    print "request" + str(data)
    room = data["room"]
    username = data['username']
    message = data['message']
    emit('message', str(datetime.now().strftime("%I:%M") + " " + username + ' : ' + message), room=room)


@socketio.on('connect', namespace='/root')
def handle_connect():
    print "Socket connected root..."
    return {"status": 'Connected root'}


@socketio.on('disconnect', namespace='/root')
def handle_disconnect():
    print "Socket disconnected root..."
    return {"status": 'disConnected root'}


@socketio.on('startTasks', namespace='/root')
def startTasks(params):
    print 'startTasks', params
    t1 = ThreadWorker(startTasksCtrl)
    t1.start(0, params)
    result = t1.result.get()

    return result


def startTasksCtrl(params):
    result = {}

    return result
