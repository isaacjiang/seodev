from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb
from bson import ObjectId


class EntitiesModel():
    def __init__(self,teamName =None,companyName =None,period =None, username = None):
        self.dbc = leadingdb.companies
        self.dbu = leadingdb.user
        self.dbt = leadingdb.teams
        self.dbt.create_index('usernames')

        self.teamName = teamName
        self.companyName = companyName
        self.period = period
        self.username = username

    def get_user_by_username(self):
        result = self.dbu.find_one({"username":self.username},{"_id":0,"password":0,'createDate':0})
        return result

    def get_company_by_username(self):
        user = self.get_user_by_username()

        result = self.dbc.find_one({"teamName":user['teamName'],'companyName':user['companyName']},{"_id":0})
        return result

    def get_team_by_username(self):
        user = self.get_user_by_username()
        result = self.dbt.find_one({"teamName":user['teamName']},{"_id":0})
        return result

    def get_teams_list(self):
        result = self.dbt.find({},{"_id":0})
        return list(result)

    def get_users_list(self):
        result = self.dbu.find({},{"_id":0,"password":0})
        return list(result)


    def update_user_status(self,**kwargs):
        self.dbu.update_one({"username":self.username},{"$set":kwargs})


    def update_team_users(self,**kwargs):
        self.dbt.update_one({"teamName":self.teamName},{"$addToSet":kwargs})

    def update_company_info(self,**kwargs):
        self.dbc.update_one({"teamName":self.teamName,"companyName":self.companyName},{"$set":kwargs})




