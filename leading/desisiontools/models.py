from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb
from bson import ObjectId
from leading.entities.models import EntitiesModel

class TasksModel():
    def __init__(self, taskID=None,companyName=None,teamName=None,period=0):
        self.db = leadingdb
        self.dbtask = leadingdb.tasks_team
        self.dbtaskdata = leadingdb.tasks_data
        self.taskID = taskID
        self.companyName = companyName
        self.teamName =  teamName
        self.period = int(period)

    def get_tasks(self,companyinfo):
        result =[]
        res = self.dbtask.find({"teamName":companyinfo['teamName'],"companyName":companyinfo['companyName'],
                                   "period":companyinfo['currentPeriod']}).sort([("taskID", ASCENDING)])
        for r in res:
            r['_id'] = str(r['_id'])
            result.append(r)
        return result

    def check_peer_status(self, taskID, companyName):
        res = self.dbtask.find({"taskID": taskID, "companyName": companyName, "status": "Init"}).count()
        return False if res > 0 else True

    def update_task_file(self,id,**kwargs):
        task= self.dbtask.find_one({"_id":ObjectId(id)},{"_id":0})

        self.db.task_list.update_one({'taskID': task['taskID'], 'companyName': task['companyName'],
                                          'period':task['period']}, {"$set":kwargs})
        return kwargs


    def task_data_save(self,data):
        result = self.dbtaskdata.update_one({"teamName":self.teamName,"companyName":self.companyName,
                                          "period":self.period},{"$set":{self.taskID:data}},upsert=True)

        return result

    def get_task_data(self):
        result = self.dbtaskdata.find_one({"teamName":self.teamName,"companyName":self.companyName,
                                             "period":self.period},{self.taskID:1,"_id":0})

        return result

    def auto_upgrade(self):
        result = self.dbtask.find({"teamName":self.teamName,"companyName":self.companyName,'period':self.period,'status':'Init'},{"_id":0})
        if result.count() ==0:
            EntitiesModel(teamName=self.teamName,companyName=self.companyName).update_company_info(currentPeriod = self.period+1,status='Active')


    def task_complete(self):
        # t = sdb.teamtasks.find_one({"teamName":team,"companyName":companyName,"taskID":taskID})

        self.dbtask.update_one({"teamName": self.teamName, "companyName": self.companyName, "taskID": self.taskID},
                                          {"$set": {"status": 'Completed'}})

        # if taskID in ['01001', "02001", "03001", "04001", "05001"]:
        #     hiringDecision(teamName, companyName, taskID)
        # elif taskID in ['01002', '02002', '03002', '04002', '05002', '06002', '07002']:
        #     workforceComplete(teamName, companyName, taskID)
        # elif taskID in ['01004', '02004', '03004', '04004', '05004', '06004', '07004']:
        #     budgetComplete(teamName, companyName, taskID)
        # elif taskID in ['01006', '02006', '03006', '04006', '05006', '06006', '07006']:
        #     actionsComplete(teamName, companyName, taskID)
        # elif taskID in ['01003', '02003', '03003', '04003', '05003', '06003', '07003']:
        #     resourcesComplete(teamName, companyName, taskID)
        # elif taskID in ['01100', '02100', '03100', '04100', '05100', '06100', '07100']:
        #     #marketShareCalculating(teamName, companyName, taskID)
        #     #nichesinitialization(teamName, companyName)
        #
        #     Account(teamName, companyName, getCurrentPeriodbyTaskid(teamName, companyName, taskID)['period']).sum()
        #     marketingShare(teamName, companyName, taskID)
        #
        # elif taskID in ['04008', '05008']:
        #     nichesComplete(teamName, companyName, taskID)
        # elif taskID in ['01005']:
        #     negotiation1Complete(teamName, companyName, taskID)
        #     negotiation1Complete(teamName, 'NewCo', taskID)
        # elif taskID in ['03005']:
        #     negotiation2Complete(teamName, companyName, taskID)
        #     negotiation2Complete(teamName, 'NewCo', taskID)
        # Alarms(source='task_complete', alarm=teamName + ' ' + companyName + ' ' + str(taskID) + " Completed")
        self.auto_upgrade()
        print self.teamName, self.companyName, self.taskID, "Completed"

class TeamInitialization(TasksModel):

    def task_init(self):
        if self.dbtask.find({"teamName": self.teamName}).count() == 0:  # test
            t = leadingdb.task_list.find({}, {"_id": 0}).sort([("taskID", ASCENDING)])
            for task in t:
                task['teamName'] = self.teamName
                task['status'] = 'Init'
                self.dbtask.insert_one(task)

    def company_init(self):
        if self.db.companies.find({"teamName": self.teamName}).count() == 0:  # test
            self.db.companies.insert_one(
                {"companyID":  self.teamName + "01", "teamName":  self.teamName, "companyName": 'LegacyCo', "status": "Init",
                 "currentPeriod": 0})
            self.db.companies.insert_one(
                {"companyID":  self.teamName + "02", "teamName":  self.teamName, "companyName": 'NewCo', "status": "Init",
                 "currentPeriod": 0})
            #Alarms(source='company_init', alarm="Company init complete:" + teamName)
        print "company init complete, team Name",  self.teamName

class EmployeeModel(TasksModel):

    def get_employees_list(self):
        result ={}
        conditions = {"status":"unemployed","companyName":self.companyName,"startAtPeriod":{"$gt":self.period}}
        res = self.db.employees_def.find(conditions)
        for r in res:
            r['_id'] = str(r['_id'])
            result[r['category']] = [] if r['category'] not in result.keys() else result[r['category']]
            result[r['category']].append(r)
        return result

    def update_employees_offer(self,id,offer):
        offer['teamName']=self.teamName
        offer['companyName']=self.companyName
        offer['period'] =self.period
        # s =  self.db.employees_def.find_one({"_id":ObjectId(id)})
        # if 'offer' not in s.keys():
        #     self.db.employees_def.update_one({"_id":ObjectId(id)},{"$set":{"offer":[]}})
        self.db.employees_def.update_one({"_id":ObjectId(id)},{"$set":{'status':"Hiring"},"$addToSet":{"offer":offer}})
        return id

class WorkforceModel(TasksModel):

    def get_init_value(self):
        result ={}
        valueatstart= self.db.workforce_com.find_one({"teamName":self.teamName,"companyName":self.companyName,
                                                            "period":self.period-1},{'_id':0})
        if valueatstart:
            result["valueatstart"] =  valueatstart['workforce']

        forecast = self.db.forecast_com.find_one({"teamName":self.teamName,"companyName":self.companyName,
                                                  "period":self.period},{"_id":0})
        if forecast != None:
            result["forecast"] = forecast["forecast"]
        else:
            result["forecast"] = {}

        workforce_def =  self.db.workforce_def.find({"period":self.period},{"_id":0})
        result['workforce_def']=[]
        for w in workforce_def:
            result['workforce_def'].append(w)

        return result

    def save(self,workforce):
        # workforce['teamName']=self.teamName
        # workforce['companyName']=self.companyName
        # workforce['period'] =self.period
        # s =  self.db.employees_def.find_one({"_id":ObjectId(id)})
        # if 'offer' not in s.keys():
        #     self.db.employees_def.update_one({"_id":ObjectId(id)},{"$set":{"offer":[]}})
        self.db.workforce_com.update_one({"teamName":self.teamName,"companyName":self.companyName,
                                          "period":self.period},{"$set":{'workforce':workforce}},upsert=True)
        return workforce


class ForecastModel(TasksModel):

    def get_start_forecast(self):
        forecast = self.db.forecast_com.find_one({"teamName":self.teamName,"companyName":self.companyName,
                                                    "period":self.period},{"_id":0})
        if forecast != None:
            result = forecast["forecast"]
        else:
            result = {}
        return result

    def update_forecast(self,forecast):
        self.db.forecast_com.update_one({"teamName":self.teamName,"companyName":self.companyName,
                                            "period":self.period},{"$set":{"forecast":forecast}},upsert=True)
        return forecast


class ResourceModel(TasksModel):

    def get_init(self):
        result = {}
        resources=[]
        cursor = self.db.resources_def.find({'companyName':self.companyName,'startPeriod':self.period,
                                             "status":"normal"},{"_id":0})
        for item in cursor:
            resources.append(item)
        result["data"]=resources
        result["status"] = "success"
        return result

    def save(self,resources):
        for type in resources:
            if len(resources[type]) > 0:
                for res in resources[type]:
                   self.db.resources_com.insert_one({"teamName":self.teamName,"companyName":self.companyName,'currentPeriod':self.teamName,'type':type,"resource":res})

        return resources


class BudgetModel(TasksModel):

    # def get_init(self):
    #     result = {}
    #     resources=[]
    #     cursor = self.db.resources_def.find({'companyName':self.companyName,'startPeriod':self.period,
    #                                          "status":"normal"},{"_id":0})
    #     for item in cursor:
    #         resources.append(item)
    #     result["data"]=resources
    #     result["status"] = "success"
    #     return result

    def save(self,acc_budget):
        self.db.budget_com.insert_one({"teamName":self.teamName,"companyName":self.companyName,
                                       "currentPeriod":self.period,"acc_budget":acc_budget})

        return acc_budget

class ActionsModel(TasksModel):

    def get_init(self):
        result = {}
        actions=[]
        cursor = self.db.actions_def.find({},{"_id":0})
        for item in cursor:
            actions.append(item)
        result["keyword"] = "allactions"
        result["data"]=actions
        return result

    def save(self,actions):
        for action in actions:
            self.db.actions_com.insert_one({"teamName":self.teamName,"companyName":self.companyName,
                                            "currentPeriod":self.period,"action":action})

        return actions


class ProjectsModel(TasksModel):

    def get_init(self):
        result = {}
        projects=[]
        cursor = self.db.projects_def.find({},{"_id":0})
        for item in cursor:
            projects.append(item)
        result["keyword"] = "allprojects"
        result["data"]=projects
        return result

    def save(self,projects):
        for project in projects:
            self.db.projects_com.update_one({"teamName":self.teamName,"companyName":self.companyName,
                                     "currentPeriod":self.period,
                                     'projectName':project['projectName']},{"$set":project},upsert=True)

        return projects


class Negotiate1Model(TasksModel):

    def get_init(self):
        result = {}
        negotiationhr=[]
        cursor = self.db.negotiation_def.find({},{"_id":0})
        for item in cursor:
            negotiationhr.append(item)
        result["data"]=negotiationhr
        return result

    def get_saved_data(self):
        taskdata = self.db.negotiation1_com.find_one({"teamName":self.teamName,
                                                "currentPeriod":self.period},{"_id":0})
        return taskdata

    def save(self,data):
        self.db.negotiation1_com.update_one({"teamName":self.teamName,
                                             "currentPeriod":self.period},{"$set":{"status":"applied","negotiation":data}},upsert=True)

        return data

    def update_status(self,status):
        self.db.negotiation1_com.update_one({"teamName":self.teamName,
                                             "currentPeriod":self.period},{"$set":{"status":status}})

class Negotiate2Model(TasksModel):

    def get_init(self):
        result = {}
        negotiationhr=[]
        cursor = self.db.negotiation_def.find({},{"_id":0})
        for item in cursor:
            negotiationhr.append(item)
        result["data"]=negotiationhr
        return result

    def get_saved_data(self):
        taskdata = self.db.negotiation2_com.find_one({"teamName":self.teamName,
                                                      "currentPeriod":self.period},{"_id":0})
        return taskdata

    def save(self,data):
        self.db.negotiation2_com.update_one({"teamName":self.teamName,
                                             "currentPeriod":self.period},{"$set":{"status":"applied","negotiation":data}},upsert=True)

        return data

    def update_status(self,status):
        self.db.negotiation2_com.update_one({"teamName":self.teamName,
                                             "currentPeriod":self.period},{"$set":{"status":status}})

class PeriodModel():
    def __init__(self, teamName=None,companyName=None):
        self.db = leadingdb
        self.dbperiod = leadingdb.periods_com
        self.teamName =  teamName
        self.companyName = companyName


    def period_init(self):
        if self.dbperiod.find({"teamName":  self.teamName, "companyName":  self.companyName}).count() == 0:  # test
            p = self.db.periods_def.find({}, {"periodID": 1, "description": 1, "_id": 0})
            for period in p:
                period['teamName'] =  self.teamName
                period['companyName'] =  self.companyName
                period['status'] = 'Init'
                self.dbperiod.insert_one(period)