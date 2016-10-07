from pymongo import ASCENDING, DESCENDING
from leading.config import leadingdb,leadingfiledb, DATABASE_DOMAIN, DATABASE_PORT,APPLICATION_DATA
from datetime import datetime
import subprocess
from flask import json
from openpyxl import Workbook,load_workbook
import os
import gridfs
from bson.objectid import ObjectId

class DatabaseBackup():
    def __init__(self):
        self.sourcedb_host = DATABASE_DOMAIN
        self.sourcedb_port = str(DATABASE_PORT)
        self.backupdb_host = "localhost"
        self.backupdb_port = "27017"
        self.backup_databse = ['leadingdb', 'leadingfiledb']
        self.createDate = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.temp_folder = '/tmp/'
        self.download_folder = '/tmp/'

    def backup(self, **kwargs):
        subprocess.check_call(['/bin/mkdir', '-p', self.temp_folder + 'backup'])
        # subprocess.check_call(['sudo','chown', 'mvrt', 'backup'])
        filenames = []
        for db in self.backup_databse:
            subprocess.check_call(
                ['/usr/local/bin/mongodump', "--host", self.sourcedb_host, "--port", self.sourcedb_port, "-d", db,
                 "--archive=" + self.temp_folder + "backup/" + db + "_backup"])
            subprocess.check_call(
                ['/usr/local/bin/mongofiles', "--host", self.backupdb_host, "--port", self.backupdb_port, "-d",
                 "dbbackup",
                 "--local",
                 self.temp_folder + "backup/" + db + "_backup", "--replace", "put", db + "_backup_" + self.createDate])
            filenames.append(db + "_backup_" + self.createDate)
        leadingdb.backup.update_one({"backupDate": self.createDate}, {
            "$set": {"backupName": "LEADING_BACKUP_" + self.createDate, "database": self.backup_databse,
                     "filenames": filenames, "backupHost": self.backupdb_host, "backupPort": self.backupdb_port,
                     "username": kwargs['username']}}, upsert=True)
        return self.get_list()

    def get_list(self):
        backups = leadingdb.backup.find({}, {"_id": 0}).sort("backupDate", DESCENDING)
        result = []
        for backup in backups:
            result.append(backup)
        return result

    def delete(self, data):
        data = json.loads(data)
        if len(data.keys()) > 0:
            if len(data['filenames']) > 0:
                for file in data['filenames']:
                    subprocess.check_call(
                        ['/usr/local/bin/mongofiles', "--host", data['backupHost'], "--port", data['backupPort'], "-d",
                         'dbbackup',
                         "delete", file])
                leadingdb.backup.delete_one({"backupDate": data['backupDate']})
        return self.get_list()

    def restore(self, data):
        data = json.loads(data)
        if len(data.keys()) > 0:
            if len(data['filenames']) > 0:
                subprocess.check_call(['/bin/mkdir', '-p', self.temp_folder + 'backup'])
                for file in data['filenames']:
                    subprocess.check_call(
                        ['/usr/local/bin/mongofiles', "--host", data['backupHost'], "--port", data['backupPort'],
                         "--local",
                         self.temp_folder + "backup/" + file, "-d", 'dbbackup', "get", file])
                    ss = subprocess.check_call(
                        ['/usr/local/bin/mongorestore', "--host", self.sourcedb_host, "--port", self.sourcedb_port,
                         "--drop",
                         "--archive=" + self.temp_folder + "backup/" + file])
        return self.get_list()

    def download(self, data):
        data = json.loads(data)
        if len(data.keys()) > 0:
            if len(data['filenames']) > 0:
                # subprocess.check_call(['/bin/mkdir', '-p', self.temp_folder + 'backup'])
                for file in data['filenames']:
                    subprocess.check_call(
                        ['/usr/local/bin/mongofiles', "--host", data['backupHost'], "--port", data['backupPort'],
                         "--local",
                         self.download_folder + file, "-d", 'dbbackup', "get", file])
        return self.get_list()


class SystemSetting():
    def __init__(self, settingId=None, userName=None):
        self.db = leadingdb
        self._id = settingId
        self.userName = userName

    def get_all(self):
        results = []
        result = self.db.settings.find().sort('group', ASCENDING)

        for res in result:
            res['_id'] = str(res['_id'])
            results.append(res)
        return results

    def update_id(self, **kwargs):
        exist_data = self.db.settings.find_one({'group': kwargs['group']})
        if exist_data != None:
            self._id = exist_data['_id']

    def set(self, **kwargs):
        self.update_id(group=kwargs['group'])
        self.db.settings.update_one({"_id": self._id}, {"$set": kwargs}, upsert=True)

class DataInitialization():
    def __init__(self):
        self.db = leadingdb

    def set_data_config(self,dataConf):
        self.db.data_conf_def.update_one({'item':dataConf['item']},{"$set":dataConf},upsert=True)
        return self.get_data_config()

    def get_data_config(self):
        result = self.db.data_conf_def.find({},{"_id":0})
        return list(result)

    def export_db_to_excel(self,list):

        wb = Workbook()

        ws0 = wb.active
        ws0.title='task_list'
        source_data = sdb.sys_tasks_list.find({'period':{"$gt":0}}, {"_id": 0,"preProcess":0}).sort([('companyName',pymongo.ASCENDING)
                                                                                                        ,('period',pymongo.ASCENDING),('processNo',pymongo.ASCENDING)])
        keys=['companyName','period','processNo','taskID','taskName','comment']
        for index1,sd in enumerate(source_data):
            if index1 == 0:
                for index2,key in enumerate(keys):
                    ws0.cell(column=index2+1, row=1, value=key)
            for index3,key in enumerate(keys):
                ws0.cell(column=index3+1, row=index1+2, value=sd[key])

    def save_file_tmp(self,file,filename):
        if os.path.isfile(os.path.join(APPLICATION_DATA,filename)):
            os.remove(os.path.join(APPLICATION_DATA,filename))
        f = open(os.path.join(APPLICATION_DATA,filename), 'w')
        f.write(file)
        f.close()

    def init_db_from_excel(self,dataConf):
        wb = load_workbook(os.path.join(APPLICATION_DATA,dataConf['filename']))
        print wb.get_sheet_names()
        sheetsList = wb.get_sheet_names()
        if dataConf['sheetname'] not in sheetsList:
            return {'error': 'Can not find the Sheet Name in the file.'}

        # if 'account_desc' in sheetsList:
        #     ws1 = wb['account_desc']
        #     title=[]
        #     for c in range(1,len(ws1.columns)+1):
        #         title.append(ws1.cell(row=1,column=c).value)
        #     for r in range(2,len(ws1.rows)+1):
        #         row_value = {}
        #         for c in range(1,len(ws1.columns)+1):
        #             row_value[title[c-1]] = ws1.cell(row=r,column=c).value
        #         sdb.account_desc.update_one({"accountDescID":row_value['accountDescID']},{"$set":row_value},upsert=True)