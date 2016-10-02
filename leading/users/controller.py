
from flask_login import LoginManager
from flask_login import login_user, logout_user, current_user, current_app

import models
from flask import json, request, session
from models import User

# user_login init
login_manager = LoginManager()


@login_manager.user_loader
def load_user(username):
    return User(username)  # User(u['username'])

class UserService():
    def __init__(self):
        self.model = models

    def register(self):

        user_input = json.loads(request.data)
        userstatus = json.loads(self.userStatus())

        user = User(username=user_input['username'], password=user_input["password"],
                    permission=user_input["permission"] if ("permission" in user_input.keys()) else '1',
                    email=user_input["email"] if ("email" in user_input.keys()) else None)
        if user.license_check():
            register_status = user.save()
            # login user
            login_status = login_user(user)
            session['logged_in'] = True

            return json.dumps({"register_status": register_status, "userStatus": userstatus})
        else:
            return json.dumps(
                {"register_status": False,
                 "message": "Unable to create new user. The maximum number of users has been reached.",
                 "userStatus": userstatus})

    def login(self):

        user_input = json.loads(request.data)
        # print user_input
        user = User(username=user_input['username'])
        userstatus = json.loads(self.userStatus())
        if user.exist:
            password_check = user.check_password(user_input['password'])
            # print password_check
            if password_check:
                login_status = login_user(user)
                session['logged_in'] = True
                #session["settings"] = userstatus['settings']
                # if login_status:
                #     Alarms(source="login", alarm='User login ' + user.username + ' at ' + user.createDate).save()
                return json.dumps({"login_status": login_status, "message": "access sucess.", "userStatus": userstatus})
            else:
                return json.dumps(
                    {"login_status": False, "message": "The entered username and password do not match.",
                     "userStatus": userstatus})
        else:
            return json.dumps(
                {"login_status": False, "message": "The entered username and password could not be found.",
                 "userStatus": userstatus})

    def logout(self):
        # Alarms(source="logout", alarm=current_user.username + 'user logout. ').save()
        status = logout_user()
        userstatus = json.loads(self.userStatus())
        session.clear()
        return json.dumps({"logout_status": status, "userStatus": userstatus})

    def userStatus(self):
        userstatus = {}
        if current_user.is_anonymous:
            userstatus['username'] = None
            userstatus['permission'] = None
        else:
            userstatus['username'] = current_user.username
            userstatus['permission'] = current_user.permission

        userstatus['status'] = {"is_active": current_user.is_active, "is_authenticated": current_user.is_authenticated,
                                "is_anonymous": current_user.is_anonymous}
        return json.dumps(userstatus)

    def get_all(self):
        result = []
        userList = User().get_all_users()
        for user in userList:
            result.append({"username": user['username'], "password": user['password'], "email": user['email'],
                           "permission": user['permission'], "createDate": user['createDate']})
        return json.dumps(result)

    def set_user(self):
        if request.method == 'POST':
            data = json.loads(request.data)
            result = self.model.User(data['_id'] if '_id' in data.keys() else None).set(
                username=data['username'],
                password=data["password"],
                permission=data["permission"] if ("permission" in data.keys()) else '2',
                email=data["email"] if ("email" in data.keys()) else None)
        return 'Added'

    def listallusers(self):
        if request.args['params'] == 'all':
            result = User('').get_user_list()
            return json.dumps(result)

    def delete_user(self):
        username = json.loads(request.data)
        self.model.User(username['username']).delete_user()
        return json.dumps({"message": 'User ' + username['username'] + ' is deleted.'})

    def modified_user(self):
        if request.method == 'POST':
            user_input = json.loads(request.data)
            # print user_input
            if ("OriginName" in user_input.keys()):
                self.model.User(user_input['OriginName']).delete_user()
                user = User(username=user_input['username'], password=user_input["password"],
                            permission=user_input["permission"] if ("permission" in user_input.keys()) else '2',
                            email=user_input["email"] if ("email" in user_input.keys()) else None).save()
                return json.dumps({"message": 'User ' + user_input['OriginName'] + ' is modified.'})
            else:
                user = User(username=user_input['username']).update_user(
                    permission=user_input["permission"] if ("permission" in user_input.keys()) else '2',
                    email=user_input["email"] if ("email" in user_input.keys()) else None)
                return json.dumps({"message": 'User ' + user_input['username'] + ' is modified.'})