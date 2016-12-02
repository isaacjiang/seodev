from flask import request, json
from bson import ObjectId
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


class AccountBudgetService():
    def __init__(self):
        self.model = models

    def accountbudget(self):
        if request.method == 'GET':
            username = request.args['username']
            userinfo = EntitiesService().get_user_info(username)
            result = self.model.AccountBudget(teamName=userinfo['teamInfo']['teamName'],
                                              companyName=userinfo['companyInfo']['companyName'],
                                              period=userinfo['companyInfo']['currentPeriod']).get_all()
            return json.dumps(result)
        if request.method == 'POST':
            budget = json.loads(request.data)
            budget_id = ObjectId(budget['_id'])
            del budget['_id']
            self.model.AccountBudget().set(budget_id, budget)
            # sdb.account_budget_com.update_one({"_id":budget_id},{'$set':budget})
            return json.dumps({"status": "success"})
