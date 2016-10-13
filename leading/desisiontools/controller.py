import models
from leading.config import leadingdb
from flask import json, request,render_template
from leading.entities.models import EntitiesModel
from datetime import datetime


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

    def hiringDecision(self):
        systemInfo = self.db.systeminfo.find_one({"group": "systemInfo"}, {"_id": 0})
        tasks = self.db.task_list.find({'taskName': 'Hires', 'period': systemInfo['content'][0]['value']}, {'_id': 0})
        for task in tasks:
            if self.model.TasksModel().check_peer_status(taskID=task['taskID'], companyName=task['companyName']):
                employees = self.db.employees_def.find({"status": "Hiring", "companyName": task['companyName']},
                                                       {"_id": 0})
                for employee in employees:
                    if employee and 'offer' in employee.keys():
                        successed = max(employee['offer'], key=lambda x: x['salaryOffer'])
                        self.db.employees_def.update_one({"employeeID": employee['employeeID']},
                                                         {"$set": {"status": "Hired", "HiredBy": successed}})
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


PeriodicTasksService().hiringDecision()
