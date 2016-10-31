import models
from leading.config import leadingdb
from flask import json, request,render_template
from leading.entities.models import EntitiesModel
from leading.account.models import Account, Index, HumanResource
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
        employeeid = data['employeeid']
        result = models.EmployeeModel().update_employees_photo(employeeid, photo=data["photo"])
        return json.dumps(result)

    def upload_negotiation_photo(self):
        data = json.loads(request.data)
        employeeid = data['employeeid']
        result = models.Negotiate1Model().update_employees_photo(employeeid, photo=data["photo"])
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

            tModel.task_complete()
            return json.dumps({"status":"success"})

    def hiring(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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
            tModel.task_complete()
            return json.dumps({"status":"success"})

    def workforce(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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
            tModel.task_complete()
            return json.dumps({"status":"success"})

    def forecast(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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

            tModel.task_complete()
            return json.dumps({"status":"success"})

    def resource(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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
            tModel.task_complete()
            return json.dumps({"status":"success"})

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

            tModel.task_complete()
            return json.dumps({"status":"success"})

    def negotiate1(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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
            print companyName
            if companyName== "NewCo":
               tModel.save(data)
            else:
                if data['action']:
                    tModel.update_status('approved')

                    tModel.task_data_save(data)
                    tModel.task_complete()
                    models.Negotiate1Model(taskID=taskID, companyName='NewCo', teamName=teamName,
                                           period=period).task_complete()
                else:
                    tModel.update_status('returned')

            return json.dumps({"status":"success"})

    def negotiate2(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
            tModel = models.Negotiate2Model(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            result = tModel.get_init()

            result['taskdata']=tModel.get_saved_data()
            return json.dumps(result)

        if request.method == 'POST':
            data= json.loads(request.data)
            taskID = data["taskID"]
            companyName =  data["companyName"] if 'companyName' in data.keys() else None
            teamName = data["teamName"] if 'teamName' in data.keys() else None
            period = data["period"] if 'period' in data.keys() else 0

            tModel = models.Negotiate2Model(taskID=taskID,companyName=companyName,teamName=teamName,period=period)
            print companyName
            if companyName== "NewCo":
                tModel.save(data)
            else:
                if data['action']:
                    tModel.update_status('approved')

                    tModel.task_data_save(data)
                    tModel.task_complete()
                else:
                    tModel.update_status('returned')

            return json.dumps({"status":"success"})

    def actions(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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

            tModel.task_complete()
            return json.dumps({"status":"success"})

    def projects(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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

            tModel.task_complete()
            return json.dumps({"status":"success"})

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
            tModel.task_complete()
            return json.dumps({"status":"success"})

    def niches(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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

            tModel.task_complete()
            return json.dumps({"status":"success"})

    def corporateacquisitions(self):
        if request.method =='GET':
            taskID = request.args["taskID"]
            companyName =  request.args["companyName"] if 'companyName' in request.args.keys() else None
            teamName = request.args["teamName"]  if 'teamName' in request.args.keys() else None
            period = request.args["period"] if 'period' in request.args.keys() else 0
            print taskID
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

            tModel.task_complete()
            return json.dumps({"status":"success"})


class PeriodicTasksService():
    def __init__(self):
        self.db = leadingdb
        self.model = models
        self.systemCurrentPeriod = SystemSetting().get_system_current_period()

    def categoryToItem(self, category):
        category = category.lower()
        if category in ['marketing & advertizing', 'marketing&advertizing', 'marketing']:
            accountDescID = 'AB012'
        elif category in ['sales & distribution', 'sales&distribution', 'sales']:
            accountDescID = 'AB011'
        elif category in ['social media', 'support']:
            accountDescID = 'AB013'
        elif category in ['logistics & it', 'logisticsit', 'logistics']:
            accountDescID = 'AB014'
        elif category in ['product development', 'productdevelopment']:
            accountDescID = 'AB015'
        else:
            accountDescID = 'AB010'
        return accountDescID

    def account_sum(self):
        companys  = self.db.companies.find({"status":"Active"},{"_id":0})
        for com in companys:
            Account(companyName=com['companyName'],teamName=com['teamName'],period=com['currentPeriod']).sum()

    def marketing_share(self):
        companys  = self.db.companies.find({"status":"Active"},{"_id":0})
        for com in companys:
            PerformanceModel().marketingShare(companyName=com['companyName'],teamName=com['teamName'],period=com['currentPeriod'])

    def hiringDecision(self):
        tasks = self.db.task_list.find({'taskName': 'Hires', 'period': self.systemCurrentPeriod}, {'_id': 0})
        for task in tasks:
            if self.model.TasksModel().check_peer_status(taskID=task['taskID'], companyName=task['companyName']):
                employees = self.db.employees_def.find({"status": "Hiring", "companyName": task['companyName']},
                                                       {"_id": 0})
                for employee in employees:
                    if employee and 'offer' in employee.keys():
                        successed = max(employee['offer'], key=lambda x: x['salaryOffer'])
                        self.db.employees_def.update_one({"employeeID": employee['employeeID']},
                                                         {"$set": {"status": "Hired", "HiredBy": successed}})

    def employeesAccountBookkeeping(self):
        employees = self.db.employees_def.find({"status": "Hired"})
        for employee in employees:
            if employee['HiredBy']['period'] <= self.systemCurrentPeriod:
                Account(teamName=employee['HiredBy']['teamName'], companyName=employee['HiredBy']['companyName'],
                        period=self.systemCurrentPeriod).bookkeeping(objectID=employee["_id"],
                                                                     accountDescID=self.categoryToItem(
                                                                         employee['category']),
                                                                     value=employee['HiredBy']['salaryOffer'],
                                                                     comments=employee['employeeID'])

                Index(teamName=employee['HiredBy']['teamName'], companyName=employee['HiredBy']['companyName'],
                      period=employee['startAtPeriod']).bookkeeping(
                    objectID = employee["_id"],
                    indexName="competenceIndex",
                    value=employee['competenceIndexEffect'],
                    comments=employee['employeeID'])
                Index(teamName=employee['HiredBy']['teamName'], companyName=employee['HiredBy']['companyName'],
                      period=employee['startAtPeriod']).bookkeeping(
                     objectID = employee["_id"],
                    indexName="legitimacyIndex",
                    value=employee['legitimacy'],
                    comments=employee['employeeID'])


                        #
                        #     period = getCurrentPeriodbyTaskid(teamName, companyName, taskID)
                        #     maxoffers = sdb.employees_offers.aggregate([{"$match": {"offeredEmployees.startAtPeriod": period['period']}},
                        #                                                 {"$group": {"_id": "$offeredEmployees.employeeID", "maxoffer": {
                        #                                                     "$max": "$offeredEmployees.salaryOffer"}}}])
                        #     for offer in maxoffers:
                        #         successoffer = sdb.employees_offers.find_one(
                        #             {"offeredEmployees.employeeID": offer["_id"], "offeredEmployees.salaryOffer": offer["maxoffer"]},
                        #             {"username": 1, "offeredEmployees": 1, "_id": 0})
                        #         userinfo = getCurrentPeriod(successoffer["username"])
                        #         successoffer["teamName"] = userinfo["teamName"]
                        #         successoffer["companyName"] = userinfo["companyName"]
                        #         # print successoffer
                        #         # save
                        #         # sdb.employees_hired.insert_one(successoffer)
                        #         setmessage(category='resource', teamName=teamName, companyName=companyName,
                        #                    message="Team :" + successoffer["teamName"] + "," + successoffer["companyName"] + ", hired : " +
                        #                            successoffer["offeredEmployees"]["employeeName"] + ",Offer:" + str(
                        #                        successoffer["offeredEmployees"]["salaryOffer"]))
                        #         # update
                        #         sdb.employees_def.find_one_and_update({"employeeID": successoffer["offeredEmployees"]["employeeID"]}, {
                        #             "$set": {"status": "employed", "teamName": successoffer["teamName"],
                        #                      "companyName": successoffer["companyName"]}})
                        #         for p in range(period['period'] + 1, 8):
                        #             Account(successoffer["teamName"], successoffer["companyName"], p).bookkeeping(
                        #                 categoryToItem(successoffer['offeredEmployees']['category']), offer["maxoffer"], 'Detail',
                        #                 successoffer["offeredEmployees"]["employeeID"])
                        #         Index(successoffer["teamName"], successoffer["companyName"], period['period']).bookkeeping(
                        #             "competenceIndex", categoryToItem(successoffer['offeredEmployees']['category']),
                        #             successoffer['offeredEmployees']["competenceIndexEffect"], 'Detail',
                        #             successoffer["offeredEmployees"]["employeeID"])
                        #         Index(successoffer["teamName"], successoffer["companyName"], period['period']).bookkeeping(
                        #             "legitimacyIndex", categoryToItem(successoffer['offeredEmployees']['category']),
                        #             successoffer['offeredEmployees']["legitimacy"], 'Detail',
                        #             successoffer["offeredEmployees"]["employeeID"])
                        #         HumanResource(successoffer["teamName"], successoffer["companyName"], period['period']).bookkeeping(
                        #             successoffer["offeredEmployees"]["employeeID"], 1, offer["maxoffer"],
                        #             categoryToItem(successoffer['offeredEmployees']['category']), period['period'] + 1,
                        #             successoffer["offeredEmployees"]["employeeID"])
                        #         # accountBookkeeping(successoffer["teamName"],successoffer["companyName"],p,'AB017',"Credit",offer["maxoffer"],successoffer["offeredEmployees"]["employeeID"])
                        #         # competenceIndex(successoffer["teamName"],successoffer["companyName"],p,'Hiring',"AB010",successoffer['offeredEmployees']["competenceIndexEffect"],successoffer['offeredEmployees']["employeeID"])
                        #     result = {"result": "success", "offers": successoffer}
                        #     # print result
                        # return result

    def workforceAccountBookkeeping(self):
        workforces = self.db.workforce_com.find()
        for workforce in workforces:
            if workforce['period'] <= self.systemCurrentPeriod:
                acc = Account(teamName=workforce['teamName'], companyName=workforce['companyName'],
                              period=self.systemCurrentPeriod)
                value = int(workforce['adjustmentcost_total'].replace(',', ''))
                acc.bookkeeping(objectID=workforce["_id"],
                                accountDescID=self.categoryToItem(workforce['functions']),
                                value=value, comments='Workforce ' + workforce['functions'])

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
            acc.bookkeeping(objectID=b['_id'], accountDescID='AB014', value=value3, comments='PD')

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
                    .bookkeeping(objectID=action['_id'], indexName='competenceIndex', value=a["competenceIndex"],
                                 comments=a['actionID'])

    def nichesComplete(teamName, companyName, taskID):
        currentPeriod = getCurrentPeriodbyTaskid(teamName, companyName, taskID)
        niches = sdb.niches_com.find({"teamName": teamName, "companyName": companyName}, {"_id": 0})
        selectedNiches = []
        for niche in niches:

            if niche['niche']['p4'] != '' and 'selected' in niche['niche']['p4'].keys() and niche['niche']['p4'][
                'selected'] == True:
                niche['niche']['p4']['teamName'] = niche['teamName']
                selectedNiches.append(niche['niche']['p4'])
            if niche['niche']['p5'] != '' and ('selected' in niche['niche']['p5'].keys()) and niche['niche']['p5'][
                'selected'] == True:
                niche['niche']['p5']['teamName'] = niche['teamName']
                selectedNiches.append(niche['niche']['p5'])
            if niche['niche']['p6'] != '' and ('selected' in niche['niche']['p6'].keys()) and niche['niche']['p6'][
                'selected'] == True:
                niche['niche']['p6']['teamName'] = niche['teamName']
                selectedNiches.append(niche['niche']['p6'])
            if niche['niche']['p7'] != '' and ('selected' in niche['niche']['p7'].keys()) and niche['niche']['p7'][
                'selected'] == True:
                niche['niche']['p7']['teamName'] = niche['teamName']
                selectedNiches.append(niche['niche']['p7'])
        for ni in selectedNiches:
            print ni
            sdb.niches_calculation.update_one(
                {"teamName": ni['teamName'], "companyName": ni['company'], "period": ni['period'],
                 "niche": ni['niche']},
                {"$set": ni}, upsert=True)
            # print selectedNiches

    def resourcesComplete(teamName, companyName, taskID):
        allteam = sdb.sys_tasks_team.find({"taskID": taskID, "status": "init"}).count()
        # print allteam
        if allteam < 0:
            result = {"result": "Not all companies are completed."}
        else:
            period = getCurrentPeriodbyTaskid(teamName, companyName, taskID)
            teams = sdb.resources_com.find({"currentPeriod": period['period']}, {"_id": 0})
            successCom = {}
            for team in teams:
                if team['type'] == "pd":
                    type = "AB015"
                elif team['type'] == "ma":
                    type = "AB011"
                elif team['type'] == "sa":
                    type = "AB012"
                elif team['type'] == "su":
                    type = "AB013"
                elif team['type'] == "li":
                    type = "AB014"
                else:
                    type = "AB010"
                team['maxcomptenceindex'] = getMaxComptenceIndex(team["teamName"], team["companyName"],
                                                                 period['period'],
                                                                 type)
                team['accountDesc'] = type
                resourcename = team['resource']['resourceName']
                if (resourcename in successCom.keys()):
                    if (team['maxcomptenceindex'] > successCom[resourcename]['maxcomptenceindex']):
                        if team not in successCom.values():
                            successCom[resourcename] = team
                else:
                    successCom[resourcename] = team
            for res in successCom.keys():
                sdb.resources_sucess.insert_one(successCom[res])
                account = Account(successCom[res]['teamName'], successCom[res]['companyName'],
                                  successCom[res]['currentPeriod'])
                account.bookkeeping(successCom[res]['accountDesc'], successCom[res]['resource']["cost"] * 1000,
                                    'Detail', successCom[res]['resource']['resourceName'])
                # accountBookkeeping(successCom[res]['teamName'], successCom[res]['companyName'],
                # successCom[res]['currentPeriod'], successCom[res]['accountDesc'], "Credit",
                # successCom[res]['resource']["cost"] * 1000, successCom[res]['resource']['resourceName'])

                # competenceIndex(successCom[res]['teamName'], successCom[res]['companyName'],
                # successCom[res]['currentPeriod'], "Resource", successCom[res]['accountDesc'],
                # successCom[res]['resource']["legitimacy"], successCom[res]['resource']['resourceName'])
                Index(successCom[res]['teamName'], successCom[res]['companyName'],
                      successCom[res]['currentPeriod']).bookkeeping(
                    "legitimacyIndex", successCom[res]['accountDesc'],
                    successCom[res]['resource']["legitimacy"], 'Detail',
                    successCom[res]['resource']['resourceName'])
                # print successCom[res]
        return successCom

    def negotiation1AccountBookkeeping(self):
        # currentPeriod = getCurrentPeriodbyTaskid(teamName, companyName, taskID)
        negotiation1s = self.db.negotiation1_com.find({"status": "approved"})
        for negotiation1 in negotiation1s:
            expense = 0
            for person in negotiation1['negotiation']['selectedEmployees']:
                expense += person['avgExpense'] + person['avgWage']

            fundings = negotiation1['negotiation']['funding']['additinalProductDeveloperNumber'] * 170000 + \
                       negotiation1['negotiation']['funding']['additinalSalesNumber'] * 40000

            Account(teamName=negotiation1['teamName'], companyName='LegacyCo',
                    period=negotiation1['negotiation']['startAtPeriod']) \
                .bookkeeping(objectID=negotiation1['_id'], accountDescID='BA032', value=expense,
                             comments='Transfer to NewCo.')
            # accountBookkeeping(teamName, 'LegacyCo', currentPeriod['period'], 'BA032', 'Credit', expense + fundings,
            # 'Transfer to NewCo.')
            Account(teamName=negotiation1['teamName'], companyName='NewCo',
                    period=negotiation1['negotiation']['startAtPeriod']) \
                .bookkeeping(objectID=negotiation1['_id'], accountDescID='BB142', value=expense,
                             comments='Transfer from LegacyCo.')
            # accountBookkeeping(teamName, 'NewCo', currentPeriod['period'], 'BB142', 'Credit', expense + fundings,
            # 'Transfer from LegacyCo.')

    def negotiation2Complete(teamName, companyName, taskID):
        currentPeriod = getCurrentPeriodbyTaskid(teamName, companyName, taskID)
        negotiation2 = sdb.negotiation2_com.find_one({"userTeam.teamName": teamName, "status": "approved"}, {"_id": 0})
        # print negotiation2
        for costs in negotiation2['negotiation']['costs']:
            if costs['period'] == 4:
                expense = costs['marketing'] * 90000 + costs['sales'] * 100000 + costs['support'] * 60000 + costs[
                                                                                                                'logisticsit'] * 90000 + \
                          costs['development'] * 80000
                accountBookkeeping(teamName, 'LegacyCo', 4, 'BA032', 'Credit', expense, 'Transfer to NewCo.')
                accountBookkeeping(teamName, 'NewCo', 4, 'BB142', 'Credit', expense, 'Transfer from LegacyCo.')
            if costs['period'] == 5:
                expense = costs['marketing'] * 90000 + costs['sales'] * 100000 + costs['support'] * 60000 + costs[
                                                                                                                'logisticsit'] * 90000 + \
                          costs['development'] * 80000
                accountBookkeeping(teamName, 'LegacyCo', 4, 'BA032', 'Credit', expense, 'Transfer to NewCo.')
                accountBookkeeping(teamName, 'NewCo', 4, 'BB142', 'Credit', expense, 'Transfer from LegacyCo.')
        expenditure0 = negotiation2['negotiation']['expenditure']['0']['dm'] + \
                       negotiation2['negotiation']['expenditure']['0']['ad'] + \
                       negotiation2['negotiation']['expenditure']['0']['pd']
        expenditure1 = negotiation2['negotiation']['expenditure']['1']['dm'] + \
                       negotiation2['negotiation']['expenditure']['1']['ad'] + \
                       negotiation2['negotiation']['expenditure']['1']['pd']

        Account(teamName, 'LegacyCo', 4).bookkeeping('BA032', expenditure0, 'Detail', 'Transfer to NewCo.')
        Account(teamName, 'NewCo', 4).bookkeeping('BB142', expenditure0, 'Detail', 'Transfer from LegacyCo.')
        Account(teamName, 'LegacyCo', 5).bookkeeping('BA032', expenditure1, 'Detail', 'Transfer to NewCo.')
        Account(teamName, 'NewCo', 5).bookkeeping('BB142', expenditure1, 'Detail', 'Transfer from LegacyCo.')
        # accountBookkeeping(teamName, 'LegacyCo', 4, 'BA032', 'Credit', expenditure0, 'Transfer to NewCo.')
        # accountBookkeeping(teamName, 'NewCo', 4, 'BB142', 'Credit', expenditure0, 'Transfer from LegacyCo.')
        # accountBookkeeping(teamName, 'LegacyCo', 5, 'BA032', 'Credit', expenditure1, 'Transfer to NewCo.')
        # accountBookkeeping(teamName, 'NewCo', 5, 'BB142', 'Credit', expenditure1, 'Transfer from LegacyCo.')


PeriodicTasksService().actionsAccountBookkeeping()
#Account(teamName="Team B", companyName='LegacyCo', period=1).sum()
