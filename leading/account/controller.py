from flask import request, json
import models

from leading.entities.controller import EntitiesService


class AccountService():
    def __init__(self):
        self.model = models

    def query_account(self):
        username = request.args['username']
        userinfo = EntitiesService().get_user_info(username)
        # print userinfo
        result = self.model.Account(teamName=userinfo['teamInfo']['teamName'],
                                    companyName=userinfo['companyInfo']['companyName'],
                                    period=userinfo['companyInfo']['currentPeriod']).query_all()
        return json.dumps(result)