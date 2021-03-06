import models
from leading.config import leadingdb, leadingbase
from flask import json, request,render_template
from leading.entities.models import EntitiesModel
from leading.account.models import Account, Index, AccountBudget
from leading.general.models import PerformanceModel
from leading.syssetting.models import SystemSetting


class TasksService():
    def __init__(self):
        self.model = models

    def get_page(self):
        pagename = request.args["pagename"]
        return render_template('server/'+pagename+'.html')

    def update_task_files(self):
        data = json.loads(request.data)
        task_id = data['task_id']
        result = models.TasksModel().update_task_file(task_id,infoFile=data['infoFile'])
        return json.dumps(result)

    def upload_employee_photo(self):
        data = json.loads(request.data)
        # print data
        employeeid = data['employeeid']
        result = models.EmployeeModel().update_employees_photo(employeeid, photo=data["photo"], type=data['type'])
        return json.dumps(result)

    def upload_negotiation_photo(self):
        data = json.loads(request.data)
        employeeid = data['employeeid']
        result = models.Negotiate1Model().update_employees_photo(employeeid, photo=data["photo"])
        return json.dumps(result)

    def upload_resource_infofile(self):
        data = json.loads(request.data)
        # print data
        resourceid = data['resourceid']
        result = models.ResourceModel().update_info_file(resourceid, infoFile=data['infoFile'])
        return json.dumps(result)

    def upload_project_infofile(self):
        data = json.loads(request.data)
        print data
        projectid = data['projectid']
        result = models.ProjectsModel().update_info_file(projectid, infoFile=data['infoFile'])
        return json.dumps(result)

    def get_task_files(self):
        result = models.TasksModel().get_task_file(request.args['task_id'])
        return json.dumps(result)

    def get_tasks_list(self):
        username = request.args["username"]
        if username != 'null':
            result =[]
            eModel = EntitiesModel(username=username)
            tModel = models.TasksModel()
            userinfo = eModel.get_user_by_username()
            if userinfo['status'] != 'Init':
                companyinfo = eModel.get_company_by_username()
                result = tModel.get_tasks(companyinfo)

        return json.dumps(result)

    def join_team(self):
        if request.method =='GET':
            # taskID = request.args["taskID"]
            # companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            # teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            # period = request.args["period"] if 'period' in request.args.keys() else 0
            #tModel = models.TeamInitialization(taskID,companyName,teamName,period)
            result = EntitiesModel().get_teams_list()

            return json.dumps(result)
        if request.method == 'POST':
            data= json.loads(request.data)
            #taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data['data']["teamName"] if 'teamName' in data['data'].keys() else None
            #period = data["period"] if 'period' in data.keys() else 0

            tModel = models.TeamInitialization(companyName=companyName,teamName=teamName)
            #tModel.task_data_save(data['data'])
            tModel.task_init()
            tModel.company_init()

            models.PeriodModel(teamName=teamName,companyName=companyName).period_init()

            eModel = EntitiesModel(username=data['username'],teamName=teamName)
            eModel.update_user_status(teamName=teamName,companyName=data['data']['companyName'],status ='Active')
            eModel.update_team_users(users=data['username'])

            aModel = AccountBudget(teamName=teamName, companyName=companyName, period=0)
            aModel.account_init()
            aModel.account_budget_init()

            result = tModel.task_complete()
            return json.dumps(result)

    def hiring(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            result = models.EmployeeModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period).get_employees_list()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.EmployeeModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            tModel.task_data_save(data['offer'])
            for offeredEmployees in data['offer']:
                tModel.update_employees_offer(id=offeredEmployees['_id'],offer={'salaryOffer':offeredEmployees['salaryOffer']})
            result = tModel.task_complete()
            return json.dumps(result)

    def workforce(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            result = models.WorkforceModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period).get_init_value()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.WorkforceModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            tModel.task_data_save(data['workforce'])
            tModel.save(workforce=data['workforce'])
            result = tModel.task_complete()
            return json.dumps(result)

    def forecast(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            result = models.ForecastModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period).get_start_forecast()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.ForecastModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            tModel.task_data_save(data['forecast'])
            tModel.update_forecast(data['forecast'])

            result = tModel.task_complete()
            return json.dumps(result)

    def resource(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            result = models.ResourceModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period).get_init()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            print data
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0
            tModel = models.ResourceModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            tModel.task_data_save(data['selectedResources'])
            tModel.save(data['selectedResources'])
            result = tModel.task_complete()
            return json.dumps(result)

    def budget(self):
        # if request.method =='GET':
        #     taskID = request.args["taskID"]
        #     companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
        #     teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
        #     period = request.args["period"] if 'period' in request.args.keys() else 0
        #     print taskID
        #     result = models.ForecastModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period).get_start_forecast()
        #     return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.BudgetModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            tModel.task_data_save(data['acc_budgets'])
            tModel.save(data['acc_budgets'])

            result = tModel.task_complete()
            return json.dumps(result)

    def negotiate1(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            tModel = models.Negotiate1Model(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            result = tModel.get_init()
            result['taskdata']=tModel.get_saved_data()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.Negotiate1Model(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            #print companyName
            if companyName== "NewCo":
               tModel.save(data)
            else:
                if data['action']:
                    tModel.update_status('approved')

                    tModel.task_data_save(data)
                    result = tModel.task_complete()
                    models.Negotiate1Model(taskID=taskID, companyName='NewCo', teamName=teamName,
                                           period=period).task_complete()
                else:
                    tModel.update_status('returned')
                    result = {"currentPeriod": data["period"]}

            return json.dumps(result)

    def negotiate2(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            tModel = models.Negotiate2Model(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            result = tModel.get_saved_data()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            print data
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0
            result = {"currentPeriod": period}
            tModel = models.Negotiate2Model(taskID=taskID,companyName=companyName,teamName=teamName,period=period)

            if companyName== "NewCo":
                # if tModel.get_saved_data() and 'status' in tModel.get_saved_data().keys() and tModel.get_saved_data()[
                #     'status'] == 'approved':
                #     tModel.task_complete()
                # else:
                tModel.save(data)
            else:
                if data['action']:
                    tModel.update_status('approved')

                    tModel.task_data_save(data)
                    result = tModel.task_complete()
                    models.Negotiate2Model(taskID=taskID, companyName='NewCo', teamName=teamName,
                                           period=period).task_complete()
                else:
                    tModel.update_status('returned')
                    result = {"currentPeriod": data["period"]}

            return json.dumps(result)

    def actions(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            result = models.ActionsModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period).get_init()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.ActionsModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            tModel.task_data_save(data['actions'])
            tModel.save(data['actions'])

            result = tModel.task_complete()
            return json.dumps(result)

    def projects(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            result = models.ProjectsModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period).get_init()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.ProjectsModel(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            tModel.task_data_save(data['projects'])
            tModel.save(data['projects'])

            result = tModel.task_complete()
            return json.dumps(result)

    def niches(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"] if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            # print taskID
            result = models.NichesModel(taskID=taskID, companyName=companyName, teamName=teamName,
                                        period=period).get_init()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.NichesModel(taskID=taskID, companyName=companyName, teamName=teamName, period=period)
            tModel.task_data_save(data['niches'])
            tModel.save(data['niches'])

            result = tModel.task_complete()
            return json.dumps(result)

    def visionarycompetition(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            result = models.VisionaryCompetitionModel(taskID=taskID, companyName=companyName, teamName=teamName,
                                                      period=period).get_init()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.VisionaryCompetitionModel(taskID=taskID, companyName=companyName, teamName=teamName,
                                                      period=period)
            tModel.task_data_save(data)
            tModel.save(data)
            result = tModel.task_complete()
            return json.dumps(result)

    def visionarycompetition_backup(self):
        if request.method == 'GET':
            taskID = request.args["taskID"]
            companyName = request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"] if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            result = models.VisionaryCompetitionModel(taskID=taskID, companyName=companyName, teamName=teamName,
                                                      period=period).get_init()
            return json.dumps(result)

        if request.method == 'POST':
            data = json.loads(request.data)
            taskID = data["taskID"]
            companyName = data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.VisionaryCompetitionModel(taskID=taskID, companyName=companyName, teamName=teamName,
                                                      period=period)
            tModel.task_data_save(data)
            tModel.save(data)
            result = tModel.task_complete()
            return json.dumps(result)

    def corporateacquisitions(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            #print taskID
            result = models.CorporateAcquisitionsModel(taskID=taskID, companyName=companyName, teamName=teamName,
                                                       period=period).get_init()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            print data
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.CorporateAcquisitionsModel(taskID=taskID, companyName=companyName, teamName=teamName,
                                                       period=period)
            tModel.task_data_save(data['offer'])
            tModel.save(data['offer'])

            result = tModel.task_complete()
            return json.dumps(result)


class PeriodicTasksService():
    def __init__(self):
        self.db = leadingdb
        self.model = models
        self.systemCurrentPeriod = SystemSetting().get_system_current_period()

    def categoryToItem(self, category):
        category = category.lower()
        if category in ['marketing & advertizing', 'marketing&advertizing', 'marketing', 'ma']:
            accountDescID = 'AB011'
        elif category in ['sales & distribution', 'sales&distribution', 'sales', 'sa', "sales & dist'n"]:
            accountDescID = 'AB012'
        elif category in ['social media', 'support', 'su']:
            accountDescID = 'AB013'
        elif category in ['logistics & it', 'logisticsit', 'logistics', 'li']:
            accountDescID = 'AB015'
        elif category in ['product development', 'productdevelopment', 'pd', 'product devt']:
            accountDescID = 'AB014'
        else:
            accountDescID = 'AB010'
        return accountDescID


    def account_sum(self):
        companys = self.db.companies.find({"status": {"$in": ["Active", "Init"]}}, {"_id": 0})
        for com in companys:
            if com['currentPeriod'] == 1:
                Account(companyName=com['companyName'], teamName=com['teamName'], period=-2).sum()
                Account(companyName=com['companyName'], teamName=com['teamName'], period=-1).sum()
            else:
                Account(companyName=com['companyName'], teamName=com['teamName'],
                        period=self.systemCurrentPeriod - 1).sum()
            Account(companyName=com['companyName'], teamName=com['teamName'], period=self.systemCurrentPeriod).sum()



    def calculte_marketing_share(self):
        PerformanceModel().calculateMarketShare(self.systemCurrentPeriod)

    def calculte_account_performance(self):
        PerformanceModel().calculteAccountPerformance(self.systemCurrentPeriod)

    def marketing_share(self):
        companys  = self.db.companies.find({"status":"Active"},{"_id":0})
        for com in companys:
            # print com['companyName'],com['teamName']
            # if com['teamName'] == 'Team C':
            PerformanceModel().marketingShare(companyName=com['companyName'], teamName=com['teamName'],
                                              period=self.systemCurrentPeriod)

    def hiringDecision(self):
        tasks = leadingbase.task_list.find({'taskName': 'Hires', 'period': self.systemCurrentPeriod}, {'_id': 0})
        for task in tasks:
            if self.model.TasksModel().check_peer_status(taskID=task['taskID'], companyName=task['companyName']):
                employees = self.db.employees_com.find({"status": "Hiring", "companyName": task['companyName']},
                                                       {"_id": 0})
                for employee in employees:
                    if employee and 'offer' in employee.keys():
                        successed = max(employee['offer'], key=lambda x: x['salaryOffer'])
                        self.db.employees_com.update_one({"employeeID": employee['employeeID']},
                                                         {"$set": {"status": "Hired", "HiredBy": successed}})

    def employeesAccountBookkeeping(self):
        employees = self.db.employees_com.find({"status": "Hired"})
        for employee in employees:
            if employee['HiredBy']['period'] <= self.systemCurrentPeriod:
                Account(teamName=employee['HiredBy']['teamName'], companyName=employee['HiredBy']['companyName'],
                        period=self.systemCurrentPeriod).bookkeeping(objectID=employee["_id"],
                                                                     accountDescID=self.categoryToItem(
                                                                         employee['category']),
                                                                     value=employee['HiredBy']['salaryOffer'],
                                                                     comments=employee['employeeID'])

                if employee['competenceIndexEffect'] > 0: Index(teamName=employee['HiredBy']['teamName'],
                                                                companyName=employee['HiredBy']['companyName'],
                                                                period=employee['startAtPeriod']).bookkeeping(
                    objectID = employee["_id"],
                    accDescID=self.categoryToItem(employee['category']),
                    indexName="competenceIndex",
                    value=employee['competenceIndexEffect'],
                    comments=employee['employeeID'])
                if employee['legitimacy'] > 0: Index(teamName=employee['HiredBy']['teamName'],
                                                     companyName=employee['HiredBy']['companyName'],
                                                     period=employee['startAtPeriod']).bookkeeping(
                     objectID = employee["_id"],
                    accDescID=self.categoryToItem(employee['category']),
                    indexName="legitimacyIndex",
                    value=employee['legitimacy'],
                    comments=employee['employeeID'])
                if "stressIndexEffect" in employee.keys() and employee['stressIndexEffect'] > 0: Index(
                    teamName=employee['HiredBy']['teamName'],
                    companyName=employee['HiredBy']['companyName'],
                    period=employee['startAtPeriod']).bookkeeping(
                    objectID=employee["_id"],
                    accDescID=self.categoryToItem(employee['category']),
                    indexName="stressIndex",
                    value=employee['stressIndexEffect'],
                    comments=employee['employeeID'])
                if "adaptabilityIndexEffect" in employee.keys() and employee['adaptabilityIndexEffect'] > 0: Index(
                    teamName=employee['HiredBy']['teamName'],
                    companyName=employee['HiredBy']['companyName'],
                    period=employee['startAtPeriod']).bookkeeping(
                    objectID=employee["_id"],
                    accDescID=self.categoryToItem(employee['category']),
                    indexName="adaptabilityIndex",
                    value=employee['adaptabilityIndexEffect'],
                    comments=employee['employeeID'])
                if "platformIndexEffect" in employee.keys() and employee['platformIndexEffect'] > 0: Index(
                    teamName=employee['HiredBy']['teamName'],
                    companyName=employee['HiredBy']['companyName'],
                    period=employee['startAtPeriod']).bookkeeping(
                    objectID=employee["_id"],
                    accDescID=self.categoryToItem(employee['category']),
                    indexName="platformIndex",
                    value=employee['platformIndexEffect'],
                    comments=employee['employeeID'])

    def workforceAccountBookkeeping(self):
        workforces = self.db.workforce_com.find()
        for workforce in workforces:
            if workforce['period'] == self.systemCurrentPeriod:
                acc = Account(teamName=workforce['teamName'], companyName=workforce['companyName'],
                              period=workforce['period'])
                value1 = int(workforce['adjustmentcost_total'].replace(',', ''))
                # acc.bookkeeping(objectID=workforce["_id"],
                #                 accountDescID=self.categoryToItem(workforce['functions']),
                #                 value=value1, comments='Workforce adjustment' + workforce['functions'])
                value2 = int(workforce['adjustedworkforce_total'].replace(',', '')) * (
                workforce['avWage'] + workforce['avExpense'])
                # print(value1, value2)
                acc.bookkeeping(objectID=workforce["_id"],
                                accountDescID=self.categoryToItem(workforce['functions']),
                                value=value1 + value2, comments='Workforce' + workforce['functions'])

    def budgetAccountBookkeeping(self):
        budget = self.db.budget_com.find()
        for b in budget:
            acc = Account(teamName=b['teamName'], companyName=b['companyName'],
                          period=b['period'])
            value1 = (b['acc_budget']['B2C_AA'] if 'B2C_AA' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['B2B_AA'] if 'B2B_AA' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche1_AA'] if 'Niche1_AA' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche2_AA'] if 'Niche2_AA' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche3_AA'] if 'Niche3_AA' in b['acc_budget'].keys() else 0)
            acc.bookkeeping(objectID=b['_id'], accountDescID='AB011', value=value1, comments='AA')

            value2 = (b['acc_budget']['B2B_DM'] if 'B2B_DM' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['B2C_DM'] if 'B2C_DM' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche1_DM'] if 'Niche1_DM' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche2_DM'] if 'Niche2_DM' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche3_DM'] if 'Niche3_DM' in b['acc_budget'].keys() else 0)
            acc.bookkeeping(objectID=b['_id'], accountDescID='AB012', value=value2, comments='DM')

            value3 = (b['acc_budget']['B2B_PD'] if 'B2B_PD' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['B2C_PD'] if 'B2C_PD' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche1_PD'] if 'Niche1_PD' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche2_PD'] if 'Niche2_PD' in b['acc_budget'].keys() else 0) \
                     + (b['acc_budget']['Niche3_PD'] if 'Niche3_PD' in b['acc_budget'].keys() else 0)
            acc.bookkeeping(objectID=b['_id'], accountDescID='AB013', value=value3, comments='PD')

    def actionsAccountBookkeeping(self):
        actions = self.db.actions_com.find()
        for action in actions:
            a = action['action']
            accountDesc = self.categoryToItem(a['category'])
            if a["immediateIncrementalCost"] > 0:
                account = Account(teamName=action['teamName'], companyName=action['companyName'],
                                  period=a['periodStart'])
                account.bookkeeping(objectID=action['_id'], accountDescID=accountDesc,
                                    value=a["immediateIncrementalCost"],
                                    comments='action')
            if a["associatedCost"] > 0:
                account2 = Account(teamName=action['teamName'], companyName=action['companyName'],
                                   period=a['periodStart'] + 1)
                account2.bookkeeping(objectID=action['_id'], accountDescID=accountDesc, value=a["associatedCost"],
                                     comments='action2')
            if a["competenceIndex"] > 0:
                Index(teamName=action['teamName'], companyName=action['companyName'], period=a['periodStart']) \
                    .bookkeeping(objectID=action['_id'], indexName='competenceIndex',
                                 accDescID=accountDesc,
                                 value=a["competenceIndex"],
                                 comments=a['actionID'])

            if a["legitimacy"] > 0:
                Index(teamName=action['teamName'], companyName=action['companyName'], period=a['periodStart']) \
                    .bookkeeping(objectID=action['_id'], indexName='legitimacyIndex',
                                 accDescID=accountDesc,
                                 value=a["legitimacy"],
                                 comments=a['actionID'])

            if a["adaptabilityIndex"] > 0:
                Index(teamName=action['teamName'], companyName=action['companyName'], period=a['periodStart']) \
                    .bookkeeping(objectID=action['_id'], indexName='adaptabilityIndex',
                                 accDescID=accountDesc,
                                 value=a["adaptabilityIndex"],
                                 comments=a['actionID'])
            if a['stressIndex'] > 0:
                Index(teamName=action['teamName'], companyName=action['companyName'], period=a['periodStart']) \
                    .bookkeeping(objectID=action['_id'], indexName='stressIndex',
                                 accDescID=accountDesc,
                                 value=a["stressIndex"],
                                 comments=a['actionID'])

            if 'platformIndex' in a.keys() and a['platformIndex'] > 0:
                Index(teamName=action['teamName'], companyName=action['companyName'], period=a['periodStart']) \
                    .bookkeeping(objectID=action['_id'], indexName='platformIndex',
                                 accDescID=accountDesc,
                                 value=a["platformIndex"],
                                 comments=a['actionID'])

    def nichesCalculation(self):

        def get_teams():
            companies = self.db.companies.find({"status": "Active"}, {"_id": 0})
            teams = []
            for com in companies:
                if com['teamName'] not in teams:
                    teams.append(com['teamName'])
            return teams

        niche_ini = leadingbase.niches_def.find({"period": self.systemCurrentPeriod, "niche": {"$in": ['B2B', 'B2C']}},
                                                {"_id": 0})
        teams = get_teams()
        for niche in niche_ini:
            niche["selectedByCompany"] = teams
            self.db.niches_cal.update_one(
                {"company": niche['company'], "niche": niche['niche'], 'period': niche['period']},
                {"$set": niche}, upsert=True)

        niches = self.db.niches_com.find({}, {"_id": 0})
        periods = ['p4', 'p5', 'p6', 'p7', 'p8']
        #selectedNiches = []
        for niche in niches:
            for period in periods:
                if niche[period] != '' and 'selected' in niche[period].keys() and niche[period]['selected'] == True:
                    # niche[period]['selectedByCompany'] = [] if 'selectedByCompany' not in niche[period].keys() else \
                    # niche[period]['selectedByCompany']
                    self.db.niches_cal.update_one(
                        {"company": niche['companyName'], "period": niche[period]['period'],
                         "niche": niche[period]['niche']},
                        {"$set": niche[period], "$addToSet": {"selectedByCompany": niche['teamName']}},
                        upsert=True)

    def resourcesComplete(self):

        teams = self.db.resources_offers.find({"currentPeriod": self.systemCurrentPeriod}, {"_id": 0})
        successCom = {}
        for team in teams:
            team['accountDesc'] = self.categoryToItem(team['type'])

            team['maxcomptenceindex'] = Index(team["teamName"], team["companyName"], self.systemCurrentPeriod). \
                get_index_by_accdescid("competenceIndex", team['accountDesc'])

            resourceID = team['resource']['_id']
            if (resourceID in successCom.keys()):
                if (team['maxcomptenceindex'] > successCom[resourceID]['maxcomptenceindex']):
                    if team not in successCom.values():
                        successCom[resourceID] = team
            else:
                successCom[resourceID] = team
        for res in successCom.keys():
            self.db.resources_com.update_one({"_id": res}, {"$set": successCom[res]}, upsert=True)


            account = Account(successCom[res]['teamName'], successCom[res]['companyName'],
                              successCom[res]['currentPeriod'])
            account.bookkeeping(objectID=res, accountDescID=successCom[res]['accountDesc'],
                                value=successCom[res]['resource']["cost"] * 1000,
                                comments=successCom[res]['resource']['resourceName'])

            Index(successCom[res]['teamName'], successCom[res]['companyName'],
                  successCom[res]['currentPeriod']) \
                .bookkeeping(objectID=res, indexName='legitimacyIndex',
                             accDescID=successCom[res]['accountDesc'],
                             value=successCom[res]['resource']["legitimacy"],
                             comments=successCom[res]['resource']['resourceName'])
            if 'platform' in successCom[res]['resource'].keys():
                Index(successCom[res]['teamName'], successCom[res]['companyName'],
                      successCom[res]['currentPeriod']) \
                    .bookkeeping(objectID=res, indexName='platformIndex',
                                 accDescID=successCom[res]['accountDesc'],
                                 value=successCom[res]['resource']["platform"],
                                 comments=successCom[res]['resource']['resourceName'])
        return successCom

    def negotiation1AccountBookkeeping(self):
        # currentPeriod = getCurrentPeriodbyTaskid(teamName, companyName, taskID)
        negotiation1s = self.db.negotiation1_com.find({"status": "approved"})

        for negotiation1 in negotiation1s:
            print negotiation1['teamName']
            expense = 0
            for person in negotiation1['negotiation']['selectedEmployees']:
                expense += person['avgExpense'] + person['avgWage']
            print expense

            fundings = negotiation1['negotiation']['funding']['additinalProductDeveloperNumber'] * 170000 * 2 + \
                       negotiation1['negotiation']['funding']['additinalSalesNumber'] * 40000
            print fundings

            Account(teamName=negotiation1['teamName'], companyName='LegacyCo',
                    period=negotiation1['negotiation']['period']) \
                .bookkeeping(objectID=negotiation1['_id'], accountDescID='BA061', value=expense + fundings,
                             comments='Transfer to NewCo.')
            # accountBookkeeping(teamName, 'LegacyCo', currentPeriod['period'], 'BA032', 'Credit', expense + fundings,
            # 'Transfer to NewCo.')
            Account(teamName=negotiation1['teamName'], companyName='NewCo',
                    period=negotiation1['negotiation']['period']) \
                .bookkeeping(objectID=negotiation1['_id'], accountDescID='BB042', value=expense + fundings,
                             comments='Transfer from LegacyCo.')
            # accountBookkeeping(teamName, 'NewCo', currentPeriod['period'], 'BB142', 'Credit', expense + fundings,
            # 'Transfer from LegacyCo.')

    def negotiation2AccountBookkeeping(self):
        # currentPeriod = getCurrentPeriodbyTaskid(teamName, companyName, taskID)
        negotiation2 = self.db.negotiation2_com.find_one({"status": "approved"})
        # print negotiation2
        if negotiation2:
            if negotiation2['negotiation']:
                total_amount = 0
                # if negotiation2['negotiation']['costs']:
                #     for costs in negotiation2['negotiation']['costs']:
                #         total_amount += costs['total_cost']
                #         # if costs['period'] == 4:
                #         #     # expense = costs['marketing'] * 90000 + costs['sales'] * 100000 + costs['support'] * 60000 + \
                #         #     #           costs[
                #         #     #               'logisticsit'] * 90000 + \
                #         #     #           costs['development'] * 80000
                #         #     total_cost = costs['total_cost']
                #         #     Account(teamName=negotiation2['teamName'], companyName='LegacyCo',
                #         #             period=negotiation2['currentPeriod']) \
                #         #         .bookkeeping(objectID=negotiation2['_id'], accountDescID='BA061', value=total_cost,
                #         #                      comments='Transfer to NewCo.')
                #         #     Account(teamName=negotiation2['teamName'], companyName='NewCo',
                #         #             period=negotiation2['currentPeriod']) \
                #         #         .bookkeeping(objectID=negotiation2['_id'], accountDescID='BB042', value=total_cost,
                #         #                      comments='Transfer  from LegacyCo.')
                #         # if costs['period'] == 5:
                #         #     total_cost = costs['total_cost']
                #         #     # expense = costs['marketing'] * 90000 + costs['sales'] * 100000 + costs['support'] * 60000 + \
                #         #     #           costs[
                #         #     #               'logisticsit'] * 90000 + \
                #         #     #           costs['development'] * 80000
                #         #     Account(teamName=negotiation2['teamName'], companyName='LegacyCo',
                #         #             period=negotiation2['currentPeriod']) \
                #         #         .bookkeeping(objectID=negotiation2['_id'], accountDescID='BA061', value=total_cost,
                #         #                      comments='Transfer to NewCo.')
                #         #     Account(teamName=negotiation2['teamName'], companyName='NewCo',
                #         #             period=negotiation2['currentPeriod']) \
                #         #         .bookkeeping(objectID=negotiation2['_id'], accountDescID='BB042', value=total_cost,
                #         #                      comments='Transfer  from LegacyCo.')
                # if negotiation2['negotiation']['expenditure']:
                #     total_amount += negotiation2['negotiation']['expenditure'][0]['total']
                #     total_amount += negotiation2['negotiation']['expenditure'][1]['total']
                #     # Account(teamName=negotiation2['teamName'], companyName='LegacyCo',
                #     #         period=negotiation2['currentPeriod']) \
                #     #     .bookkeeping(objectID=negotiation2['_id'], accountDescID='BA061', value=expenditure0,
                #     #                  comments='Transfer to NewCo.')
                #     # Account(teamName=negotiation2['teamName'], companyName='NewCo',
                #     #         period=negotiation2['currentPeriod']) \
                #     #     .bookkeeping(objectID=negotiation2['_id'], accountDescID='BB042', value=expenditure0,
                #     #                  comments='Transfer  from LegacyCo.')
                # if negotiation2['negotiation']['estimatedIncome']:
                #     for income in negotiation2['negotiation']['estimatedIncome']:
                #         total_amount -= income['gross_margin']

                if 'grand_total1' in negotiation2['negotiation'].keys():
                    total_amount = negotiation2['negotiation']['grand_total1']
                if total_amount < 0:
                    total_amount = 0
                Account(teamName=negotiation2['teamName'], companyName='LegacyCo',
                        period=negotiation2['currentPeriod']) \
                    .bookkeeping(objectID=negotiation2['_id'], accountDescID='BA061', value=total_amount,
                                 comments='Transfer to NewCo.')
                Account(teamName=negotiation2['teamName'], companyName='NewCo',
                        period=negotiation2['currentPeriod']) \
                    .bookkeeping(objectID=negotiation2['_id'], accountDescID='BB042', value=total_amount,
                                 comments='Transfer  from LegacyCo.')

    def visionarycompetitionComplete(self):

        companies = self.db.visionarycompetition.find({"currentPeriod": self.systemCurrentPeriod}, {"_id": 0})
        successCom = {}
        for company in companies:
            for visionary in company['visionaries']:
                if visionary['visionary'] not in successCom.keys():
                    successCom[visionary['visionary']] = {}
                if 'bid' in visionary.keys():
                    if successCom[visionary['visionary']] == {} or visionary['bid'] * visionary['influence'] > \
                                    successCom[visionary['visionary']]['bid'] * successCom[visionary['visionary']][
                                'influence']:
                        successCom[visionary['visionary']] = {"companyName": company['companyName'],
                                                              "currentPeriod": company['currentPeriod'],
                                                              "teamName": company['teamName'],
                                                              "bid": visionary['bid'],
                                                              "influence": visionary['influence'],
                                                              "pitchCost": visionary['pitchCost']}
        for res in successCom.keys():
            if successCom[res]:
                self.db.visionarycompetition_result.update_one({"visionary": res}, {"$set": successCom[res]},
                                                               upsert=True)

# PeriodicTasksService().account_sum()
# PeriodicTasksService().workforceAccountBookkeeping()
