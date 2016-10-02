from datetime import datetime
from flask import json
import leading.config as config


class Logging():
    def __init__(self, source=None, alarm=None):
        self.source = source
        self.alarm = alarm
        self.date_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.date = datetime.today().strftime('%Y-%m-%d')  # '2016-01' + '-' + str(random.randrange(10, 28))#
        self.status = 'init'
        self.db = config.DBlog

    def save(self):
        if self.date not in self.db.collection_names():
            self.db.create_collection(self.date)
        collection = self.db.get_collection(self.date)
        collection.insert_one(
            {"source": self.source, "alarm": self.alarm, "date_time": self.date_time, 'status': self.status})

    def query_today(self):
        collection = self.db.get_collection(self.date)
        cursor = collection.find({}, {"source": 1, "alarm": 1, "date_time": 1, 'status': 1, '_id': 0})
        alarms = []
        for alarm in cursor:
            alarms.append({"source": alarm['source'], "alarm": alarm['alarm'], "date_time": alarm['date_time'],
                           'status': alarm['status']})
        return json.dumps(alarms)

    def query_today_limit(self, number):
        collection = self.db.get_collection(self.date)
        cursor = collection.find({}, {"source": 1, "alarm": 1, "date_time": 1, 'status': 1, '_id': 0}).limit(number)
        alarms = []
        for alarm in cursor:
            alarms.append({"source": alarm['source'], "alarm": alarm['alarm'], "date_time": alarm['date_time'],
                           'status': alarm['status']})
        return json.dumps(alarms)

    def query_period(self, start_date, end_date):
        def compare(d):
            return (d >= start_date) & (d <= end_date)

        collections = filter(compare, self.db.collection_names())
        # print collections
        alarms = []
        for col in collections:
            collection = self.db.get_collection(col)
            cursor = collection.find({}, {"source": 1, "alarm": 1, "date_time": 1, 'status': 1, '_id': 0})
            for alarm in cursor:
                alarms.append({"source": alarm['source'], "alarm": alarm['alarm'], "date_time": alarm['date_time'],
                               'status': alarm['status']})
        return json.dumps(alarms)

    def query_today_summary(self):
        collection = self.db.get_collection(self.date)
        cursor = collection.aggregate([{"$group": {"_id": "$source", "count": {"$sum": 1}}}])
        alarms = []
        for alarm in cursor:
            alarms.append({"source": alarm['_id'], "count": alarm['count']})
        return json.dumps(alarms)

    def query_period_summary(self, start_date, end_date):
        def compare(d):
            return (d >= start_date) & (d <= end_date)

        collections = filter(compare, self.db.collection_names())
        # print collections
        alarms = {}
        for col in collections:
            # print col
            collection = self.db.get_collection(col)
            cursor = collection.aggregate([{"$group": {"_id": "$source", "count": {"$sum": 1}}}])
            for alarm in cursor:
                if alarm['_id'] in alarms:
                    alarms[alarm['_id']] += alarm['count']
                else:
                    alarms[alarm['_id']] = alarm['count']
            alarms_output = [{'source': key, 'count': value} for key, value in alarms.items()]
        return json.dumps(alarms_output)
