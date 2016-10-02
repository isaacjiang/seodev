import models
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

    def budget(self):
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

    def negotiate1(self):
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


    def negotiate2(self):
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

    def actions(self):
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

    def project(self):
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