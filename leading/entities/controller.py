from models import EntitiesModel
from flask import json, request
from datetime import datetime
from leading.config import leadingdb


class EntitiesService():
    def __init__(self):
        self.db = leadingdb

    def getUserInfo(self):
        result = {}
        username = request.args["username"]
        result['userInfo'] = EntitiesModel(username=username).get_user_by_username()
        if 'teamName' in result['userInfo'].keys():
            result['teamInfo'] = EntitiesModel(username=username).get_team_by_username()
            #print username
            if 'companyName' in result['userInfo'].keys():
                result['companyInfo'] = EntitiesModel(username=username).get_company_by_username()
        return json.dumps(result)

    def get_user_info(self, username):
        result = {}
        result['userInfo'] = EntitiesModel(username=username).get_user_by_username()
        if 'teamName' in result['userInfo'].keys():
            result['teamInfo'] = EntitiesModel(username=username).get_team_by_username()
            # print username
            if 'companyName' in result['userInfo'].keys():
                result['companyInfo'] = EntitiesModel(username=username).get_company_by_username()

        return result

    def get_users_list(self):
        result = EntitiesModel().get_users_list()
        for res in result:
            res['teamName']=EntitiesModel(username=res['username']).get_team_by_username()['teamName']
            res['companyName'] = EntitiesModel(username=res['username']).get_company_by_username()['companyName']
        return json.dumps(result)