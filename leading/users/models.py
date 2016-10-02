from flask_login import UserMixin
from pymongo import  ASCENDING, DESCENDING
from werkzeug.security import check_password_hash, generate_password_hash
from leading.config import leadingdb
from datetime import datetime
from flask import json

class User(UserMixin):
    def __init__(self, username, password='', permission=None, email=None):
        self.username = username
        userinfo = leadingdb.user.find_one({"username": username},
                                          {"username": 1, "createDate": 1, "password": 1, "permission": 1, "email": 1,
                                           "_id": 0})
        if userinfo:
            self.createDate = userinfo["createDate"]
            self.password = userinfo["password"]
            self.permission = userinfo["permission"]
            self.email = userinfo["email"]
            self.operationStatus = "update"
            self.exist = True
        else:
            self.createDate = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            # self.password = password
            self.set_password(password)
            self.permission = permission
            self.email = email
            self.operationStatus = "insert"
            self.exist = False

    def set(self, **kwargs):
        # self.collection.update_one({"_id": self._id}, {"$set": kwargs}, upsert=True)
        result = str(self._id)
        return result

    def update_id(self, **kwargs):
        exist_user = self.collection.find_one({'username': kwargs['username']})
        if exist_user != None:
            self._id = exist_user['_id']

    def get_all_users(self):
        results = []
        result = leadingdb.user.find({}, {"_id": 0}).sort('userName', ASCENDING)
        for res in result:
            results.append(res)
        return results

    def get_id(self):
        return self.username

    def save(self):
        leadingdb.user.update_one({"username": self.username}, {
            "$set": {"createDate": self.createDate, "password": self.password, "permission": self.permission,
                     "email": self.email,"status":'Init'}},upsert=True)
        # print "update", result
        return True

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def license_check(self):
        superuser_count = leadingdb.user.find({"permission": '0'}).count()
        user1_count = leadingdb.user.find({"permission": '1'}).count()
        user2_count = leadingdb.user.find({"permission": '2'}).count()
        if (superuser_count > 1) & (user1_count + user2_count > 2):
            return False
        return True

    def get_user_list(self):
        cursor = leadingdb.user.find({}, {"_id": 0})
        result = []
        for user in cursor:
            result.append(user)
        return result

    def delete_user(self):
        result = leadingdb.user.find_one_and_delete({'username': self.username}, {"_id": 0})
        # print result
        return result

    def update_user(self, **kwargs):
        # print kwargs
        # print self.username
        leadingdb.user.update_one({'username': self.username}, {"$set": kwargs})
        result = {"status": "success"}
        return json.dumps(result)

    @staticmethod
    def validate_login(password_hash, password):
        return check_password_hash(password_hash, password)