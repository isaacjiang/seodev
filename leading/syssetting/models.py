from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb, DATABASE_DOMAIN, DATABASE_PORT
from datetime import datetime
import subprocess
from flask import json


#####
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
