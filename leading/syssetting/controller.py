__author__ = 'isaac'
from datetime import datetime, timedelta
from flask import json, request, send_file, make_response
from leading.config import APPLICATION_DATA
import os
from threading import Timer

import models

class SystemService():

    def __init__(self):
        self.model = models

    def backup_start(self):
        result = self.model.DatabaseBackup().backup(username=request.args['username'])
        return json.dumps(result)

    def backup_list(self):
        res = self.model.DatabaseBackup().get_list()
        return json.dumps(res)

    def backup_delete(self):
        res = self.model.DatabaseBackup().delete(request.data)
        return json.dumps(res)

    def backup_restore(self):
        res = self.model.DatabaseBackup().restore(request.data)
        return json.dumps(res)

    def backup_restore_latest(self):
        res = self.model.DatabaseBackup().restore_latest()
        return json.dumps(res)

    def backup_download(self):
        # print request.data
        res = self.model.DatabaseBackup().download(request.data)
        return json.dumps(res)

    def backup_setting(self):
        data = json.loads(request.data)
        # print data

        if data["repeat"] == "day":
            seconds = 60 * 60 * 24
        elif data["repeat"] == "week":
            seconds = 60 * 60 * 24 * 7
        elif data["repeat"] == "biweek":
            seconds = 60 * 60 * 24 * 14
        elif data["repeat"] == "month":
            seconds = 60 * 60 * 24 * 30
        else:
            seconds = 60 * 60 * 24 * 365
        # seconds = 5
        first_date = data["startDate"].split("T")[0].split("-")
        first_datetime = datetime(int(first_date[0]), int(first_date[1]), int(first_date[2]), int(data["starthour"]),
                                  int(data["startminute"]), 0)
        print first_datetime, datetime.now()
        first_seconds = int(timedelta.total_seconds(first_datetime - datetime.now()))
        print first_seconds
        if first_seconds < 0:
            first_seconds = 1

        # res = modelsSystem.DatabaseBackup()(request.data)
        def scheduler(seconds):
            print seconds
            result = self.model.DatabaseBackup().backup(username=data['username'])
            t = Timer(seconds, scheduler, [seconds])
            t.start()

            return result

        t1 = Timer(first_seconds, scheduler, [seconds])
        t1.start()
        # t1.cancel()

        return json.dumps('Backup tasks are scheduled.')

    def get_all_setting(self):
        result = self.model.SystemSetting().get_all()
        return json.dumps(result)

    def set_system_setting(self):
        if request.method == 'POST':
            data = json.loads(request.data)
            # print data['_id']
            result = self.model.SystemSetting(data['_id']).set(group=data['group'], content=data['content'])
        return json.dumps('Setting changed!')

    def set_data_config(self):
        dataConf = json.loads(request.data)
        result = self.model.DataInitialization().set_data_config(dataConf=dataConf)
        return json.dumps(result)

    def get_data_config(self):
        result = self.model.DataInitialization().get_data_config()
        return json.dumps(result)

    def save_file_tmp(self):
        dataConf = {}
        if len(request.files) > 0:
            file = request.files['files[0]'].read()
            filename=request.files['files[0]'].filename
            content_type = request.files['files[0]'].content_type,
            self.model.DataInitialization().save_file_tmp(file=file, filename=filename, content_type=content_type)
            dataConf['status'] = 'Updated'
            dataConf['filename'] = filename
            dataConf['content_type'] = content_type
            dataConf['upload_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
           #self.model.DataInitialization().set_data_config(dataConf)
        return json.dumps(dataConf)

    def get_file_tmp(self):
        filename = request.args['filename']
        return send_file(os.path.join(APPLICATION_DATA, filename), as_attachment=True, attachment_filename=filename)

    def data_initialize(self):
        dataConf =json.loads(request.data)
        result = self.model.DataInitialization().init_db_from_excel(dataConf=dataConf)
        self.model.DataInitialization().set_data_config(dataConf)
        return json.dumps(result)

    def generate_file(self):
        dataConf = json.loads(request.data)
        print dataConf
        filename = dataConf['filename']
        # content_type = dataConf['content_type']
        #objectID = dataConf['objectID']
        dataConf = self.model.DataInitialization().export_db_to_excel(dataConf)
        # .update_file(objectID)
        return json.dumps(dataConf)

