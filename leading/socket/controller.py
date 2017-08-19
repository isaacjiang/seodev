from models import ThreadWorker
from datetime import datetime
from flask_socketio import SocketIO, emit, join_room, leave_room
from ..desisiontools.models import VisionaryCompetitionModel

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
def handle_messaging(data):
    # print "join" + str(data)
    room = data["teamInfo"]["teamName"]
    join_room(room)
    emit('message', str(datetime.now().strftime("%I:%M") + ": " + data['userInfo']["username"] + " join room: " + room),
         room=room)


@socketio.on('notification', namespace='/ipc')
def handle_messaging(data):
    print "request" + str(data)
    room = data["room"]
    username = data['username']
    message = data['message']
    emit('message', str(datetime.now().strftime("%I:%M") + " " + username + ' : ' + message), room=room)


@socketio.on('vcregister', namespace='/ipc')
def handle_vcregister(data):
    print "register time:" + str(data)
    VisionaryCompetitionModel().register(data['teamName'], data['companyName'], data['startTime'])
    status = VisionaryCompetitionModel().get_status()
    status['currentTime'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    emit('visionarycompetition', status)


@socketio.on('visionarycompetition', namespace='/ipc')
def handle_visionarycompetition(data):
    # print "visionarycompetition" + str(data)
    status = VisionaryCompetitionModel().get_status()
    if status:
        status['currentTime'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        emit('visionarycompetition', status)
    else:
        print('emit stop.')

        emit('stopVisionarycompetition')

@socketio.on('vcbid', namespace='/ipc')
def handle_vcbid(data):
    # print "bid" + str(data)
    VisionaryCompetitionModel().bid(data, timeout=False)


@socketio.on('vcbidtimeout', namespace='/ipc')
def handle_vcbidtimeout(data):
    # print "bidtimeout" + str(data)
    VisionaryCompetitionModel().bid(data, timeout=True)
