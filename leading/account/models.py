from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb, leadingbase
from bson import ObjectId


class HumanResource():
    def __init__(self, teamName, comapanyName, period):
        self.data = leadingdb.human_resource
        self.teamName = teamName
        self.companyName = comapanyName
        self.period = period

    def bookkeeping(self, hrName, count, cost=0, type=None, startPeriod=None, comments=None):
        result = self.data.insert_one(
            {"teamName": self.teamName, "companyName": self.companyName, "period": self.period,
             "hrName": hrName, "count": count, 'cost': cost, "type": type, "startPeriod": startPeriod,
             "comments": comments})
        return result

    def get_total_number(self):
        condition = {"teamName": self.teamName, "companyName": self.companyName, "period": self.period}
        res = self.data.aggregate([{"$match": condition}, {"$group": {
            "_id": {"teamName": "$teamName", "companyName": "$companyName", "period": "$period"},
            "total_count": {"$sum": "$count"}}}])
        result = 0
        for r in res:
            result += r['total_count']
        return result

class Account():
    def __init__(self, teamName, companyName, period):
        self.db = leadingdb
        self.data = leadingdb.account_bookkeeping
        self.teamName = teamName
        self.companyName = companyName
        self.period = period

    def bookkeeping(self, accountDescID, value, objectID=None, type=None, comments=None):
        result = self.data.update_one(
            {"originID": str(objectID), "accountDescID": accountDescID, "teamName": self.teamName,
             "companyName": self.companyName,"period": self.period},
            {"$set": {"value": value, "comments": comments}}, upsert=True)
        return result

    def get_item_sum(self, accountDescID):
        if type(accountDescID) is not list:
            accountDescID = [accountDescID]
        condition = {"teamName": self.teamName, "companyName": self.companyName, "period": self.period,
                     "accountDescID": {"$in": accountDescID}}
        res = self.data.aggregate([{"$match": condition}, {"$group": {
            "_id": {"teamName": "$teamName", "companyName": "$companyName", "period": "$period",
                    "accountDescID": "$accountDescID"}, "value": {"$sum": "$value"}}}])
        result = 0
        for r in res:
            result += r['value']
        return result

    def get_period_sum(self):
        condition = {"teamName": self.teamName, "companyName": self.companyName, "period": self.period}
        res = self.data.aggregate([{"$match": condition}, {"$group": {
            "_id": {"teamName": "$teamName", "companyName": "$companyName", "period": "$period"},
            "value": {"$sum": "$value"}}}])
        result = 0
        for r in res:
            result += r['value']
        return result

    def subset_plus(self, itemList, destItem, rate):
        value = self.get_item_sum(itemList)
        self.bookkeeping(accountDescID=destItem, value=value * rate, type='SubSum', comments='sum' + destItem)

    def subset_minus(self, itemA, itemB, destItem, rate):
        valueA = self.get_item_sum(itemA)
        valueB = self.get_item_sum(itemB)
        self.bookkeeping(accountDescID=destItem, value=(valueA - valueB) * rate, type='Minus',
                         comments='sum' + destItem)

    def trans_item(self, sourceItem, destItem, destPeriod, rate=None):
        value = Account(self.teamName, self.companyName, destPeriod - 1).get_item_sum(sourceItem)
        destPeriod = 1 if destPeriod == 0 else destPeriod
        if rate is None:
            rate = 1
        Account(self.teamName, self.companyName, destPeriod).bookkeeping(accountDescID=destItem, value=value * rate,
                                                                         type='Trans',
                                                                         comments='trans' + destItem)

    def sum(self):
        # 1-14
        self.subset_plus(["AA011", "AA012"], "AA021", 1)
        self.subset_plus(["AA011"], "AA025", 0.32)
        self.subset_plus(["AA012"], "AA026", 0.32)
        self.subset_plus(["AA025", "AA026"], "AA029", 1)
        self.subset_plus(["AA031", "AA032", "AA033"], "AA041", 1)
        self.subset_plus(["AA031"], "AA131", 0.25)
        self.subset_plus(["AA032"], "AA132", 0.25)
        self.subset_plus(["AA033"], "AA133", 0.25)
        self.subset_plus(["AA131", "AA132", "AA133"], "AA141", 1)
        self.subset_plus(["AA021", "AA041"], "AA200", 1)
        self.subset_plus(["AA029", "AA141"], "AA201", 1)
        self.subset_minus("AA200", "AA201", "AA202", 1)
        self.subset_plus(["AA202", "AA210"], "AA211", 1)
        self.subset_plus(["AA021", "AA041"], "AB017", 0.05)
        self.subset_plus(["AB010", "AB011", "AB012", "AB013", "AB014", "AB015", "AB016", "AB017"], "AB021", 1)
        self.subset_minus("AA211", "AB021", "AB031", 1)

        # 15-36
        self.subset_plus(["AA011"], "BA012", 0.1)
        self.subset_plus(["AA012"], "BA013", 0.1)
        self.subset_plus(["AA041"], "BA014", 0.1)
        self.subset_plus(["AA025"], "BA015", 0.1)
        self.subset_plus(["AA026"], "BA016", 0.1)
        self.subset_plus(["AA141"], "BA017", 0.1)
        self.trans_item(["BA040", "BA041"], "BA040", self.period + 1)
        self.subset_plus(["BA040", 'BA041'], "BA042", 1)

        self.trans_item(["BA061", "BA062"], "BA061", self.period + 1)
        # self.subset_minus("BA061", "BA062", "BA061", 1)
        self.subset_plus(["BA061", 'BA062'], "BA063", 1)

        self.subset_plus(["AA025"], "BB011", 0.1)
        self.subset_plus(["AA026"], "BB012", 0.1)
        self.subset_plus(["AA141"], "BB013", 0.1)
        self.subset_plus(["AA011"], "BB014", 0.2)
        self.subset_plus(["AA012"], "BB015", 0.2)
        self.subset_plus(["AA041"], "BB016", 0.2)
        self.subset_plus(["BB011", "BB012", "BB013", "BB014", "BB015", "BB016"], "BB021", 1)

        self.trans_item(["BB031", "BB032"], "BB031", self.period + 1)
        self.trans_item("BB042", "BB042", self.period + 1)
        self.subset_plus(["BB041", "BB042"], "BB050", 1)
        self.subset_plus(["BB031", "BB032", "BB041", "BB042"], "BB060", 1)
        self.trans_item("BB111", "BB111", self.period + 1)

        # 37
        self.subset_plus(['AB061'], "CA022", 1)

        self.trans_item("BA012", "CA023", self.period)
        self.subset_minus("CA023", "BA012", "CA023", 1)
        self.trans_item("BA013", "CA024", self.period)
        self.subset_minus("CA024", "BA013", "CA024", 1)
        self.trans_item("BA014", "CA025", self.period)
        self.subset_minus("CA025", "BA014", "CA025", 1)
        self.trans_item("BA015", "CA026", self.period)
        self.subset_minus("CA026", "BA015", "CA026", 1)
        self.trans_item("BA016", "CA027", self.period)
        self.subset_minus("CA027", "BA016", "CA027", 1)
        self.trans_item("BA017", "CA028", self.period)
        self.subset_minus("CA028", "BA017", "CA028", 1)

        self.trans_item("BB011", "CA029", self.period)
        self.subset_minus("BB011", "CA029", "CA029", 1)
        self.trans_item("BB012", "CA030", self.period)
        self.subset_minus("BB012", "CA030", "CA030", 1)
        self.trans_item("BB013", "CA031", self.period)
        self.subset_minus("BB013", "CA031", "CA031", 1)
        self.trans_item("BB014", "CA032", self.period)
        self.subset_minus("BB014", "CA032", "CA032", 1)
        self.trans_item("BB015", "CA033", self.period)
        self.subset_minus("BB015", "CA033", "CA033", 1)
        self.trans_item("BB016", "CA034", self.period)
        self.subset_minus("BB016", "CA034", "CA034", 1)
        self.subset_plus(['BB032'], "CA053", 1)
        self.subset_plus(['BB112'], "CA054", 1)
        self.subset_plus(['BA061'], "CA071", -1)
        self.subset_plus(['BB042'], "CA081", 1)

        # 54
        self.subset_plus(['BB031'], "AB041", 0.05)
        self.subset_minus("AB031", 'AB041', "AB051", 1)
        self.subset_plus(["BA042"], "AB061", 0.12)
        self.subset_minus("AB051", "AB061", "AB071", 1)
        self.subset_plus(["AB071"], "AB081", 0.2)
        self.subset_plus(["AB071"], "AB100", 0.8)
        # 60
        self.trans_item("BA011", "CA011", self.period + 1)
        self.subset_plus(['AB100'], "CA021", 1)
        self.subset_plus(
            ['CA021', 'CA022', 'CA023', 'CA024', 'CA025', 'CA026', 'CA027', 'CA028', 'CA029', 'CA030', 'CA031', 'CA032',
             'CA033', 'CA034'], "CA041", 1)
        self.subset_plus("BA041", "CA051", -1)
        self.subset_plus(['CA011', 'CA041', 'CA051', 'CA053', 'CA054', 'CA071', 'CA081'], "CA091", 1)
        self.subset_minus('CA091', "CA071", "CA061", 1)

        # 66
        self.subset_plus("CA091", "BA011", 1)
        self.subset_plus(['BA011', 'BA012', 'BA013', 'BA014', 'BA015', 'BA016', 'BA017'], "BA021", 1)

        # 68
        self.trans_item("BA043", "BA043", self.period + 1)  # todo
        self.subset_plus(["AB061", "BA043"], "BA043", 1)
        self.subset_minus("BA042", "BA043", "BA051", 1)
        self.subset_minus("AB051", "AB061", "AB071", 1)
        self.subset_plus(["BA021", 'BA051', 'BA063'], "BA100", 1)

        self.trans_item("BB113", "BB113", self.period)
        self.subset_plus(["AB100", "BB113"], "BB113", 1)
        self.subset_plus(["BB111", "BB112", 'BB113'], "BB121", 1)
        self.subset_plus(["BB021", "BB060", 'BB121'], "BB131", 1)

    def query_all(self):
        result = []

        accounts_desc = leadingbase.account_def.find({}, {"_id": 0})
        for acc in accounts_desc:
            row_value = {'Account Description': acc['accountDescName'], 'Desc ID': acc['accountDescID'],
                         'accountDescType': acc['accountDescType'], 'summaryFLag': acc['summaryFLag']}
            periods = leadingbase.periods_def.find({"periodID": {"$lte": self.period}}, {'_id': 0})
            for p in periods:
                value = self.db.account_bookkeeping.aggregate(
                    [{"$match": {"teamName": self.teamName, "companyName": self.companyName,
                                 "period": p['periodID'], "accountDescID": acc['accountDescID']}},
                     {"$group": {"_id": {"teamName": "$teamName", "companyName": "$companyName",
                                         "period": "$period", "accountDescID": "$accountDescID"},
                                 "total_value": {"$sum": "$value"}}}
                     ])
                # value = sdb.account_bookkeeping.find({"teamName": userinfo["teamName"],"companyName":userinfo["companyName"],"period":p['periodID'],"accountDescID":acc['accountDescID']},{"_id":0})
                for v in value:
                    pID = str(p['periodID']) if p['periodID'] >= 0 else 'Pre' + str(-p['periodID'])
                    row_value['Period' + pID] = '{0:,.0f}'.format(v['total_value'])
            result.append(row_value)
            # print result
        return result

class Index():
    def __init__(self, teamName, companyName, period):
        self.db = leadingdb
        self.data = leadingdb.index_bookkeeping
        self.teamName = teamName
        self.companyName = companyName
        self.period = period

    def bookkeeping(self, indexName, value, objectID=None, accDescID=None, comments=None):
        result = self.data.update_one(
            {"originID": str(objectID), "indexName": indexName, "teamName": self.teamName,
             "companyName": self.companyName, "accDescID": accDescID, "period": self.period},
            {"$set": {"value": value, "comments": comments}}, upsert=True)
        return result

    def get_index_multi(self, indexName):
        condition = {"teamName": self.teamName, "companyName": self.companyName, "period": self.period,
                     "indexName": indexName}
        res = self.data.find(condition, {"_id": 0})
        result = 1
        for r in res:
            if r['value'] == 0:
                r['value'] = 1
            result = result * r['value']
        return result

    def get_index_by_accdescid(self, indexName, accDescID):
        condition = {"teamName": self.teamName, "companyName": self.companyName, "period": self.period,
                     "indexName": indexName, "accDescID": accDescID}
        res = self.data.find(condition, {"_id": 0})
        result = 1
        for r in res:
            if r['value'] == 0:
                r['value'] = 1
            result = result * r['value']
        return result


class AccountBudget():
    def __init__(self, teamName=None, companyName=None, period=None):
        self.db = leadingdb
        self.teamName = teamName
        self.companyName = companyName
        self.period = period

    def account_init(self):
        if self.companyName == 'LegacyCo':  # test
            acc = leadingbase.account_ini.find({})
            for b in acc:
                b['teamName'] = self.teamName
                b['companyName'] = self.companyName
                b['originID'] = str(b['_id'])
                del b['_id']
                self.db.account_bookkeeping.update_one(
                    {"teamName": b['teamName'], 'companyName': b['companyName'], "originID": b['originID']},
                    {"$set": b}, upsert=True)

    def account_budget_init(self):
        if self.db.account_budget_com.find(
                {"teamName": self.teamName, "companyName": self.companyName}).count() == 0:  # test
            budget = leadingbase.budget_def.find({}, {"_id": 0})
            for b in budget:
                b['teamName'] = self.teamName
                b['companyName'] = self.companyName
                b['status'] = 'Init'
                self.db.account_budget_com.insert_one(b)

    def get_all(self):
        result = []
        CASH_IN_HAND_AT_START = 0
        TOTAL_REVENUE = 0
        GROSS_MARGIN = 0
        FUNCTION_EXPENCES = 0
        TOTAL_EXPENCES = 0
        NET_MARGIN = 0
        CASH_IN_HAND_AT_END = 0
        req = self.db.account_budget_com.find({"teamName": self.teamName, "companyName": self.companyName})
        for r in req:
            r['_id'] = str(r['_id'])
            if r['accountDescID'] != '':
                if r['budgetDescID'] in ['BG100']:
                    if self.period == 1:
                        period = -1
                    else:
                        period = self.period - 1
                    r['currentValue'] = Account(self.teamName, self.companyName, period).get_item_sum(
                        r['accountDescID'])
                    CASH_IN_HAND_AT_START = r['currentValue']
                    # print ('CASH_IN_HAND_AT_START',CASH_IN_HAND_AT_START)
                else:
                    r['currentValue'] = Account(self.teamName, self.companyName, self.period).get_item_sum(
                        r['accountDescID'])


            if r['budgetDescID'] in ['BG200', 'BG300']:
                forecastingvalue = self.db.forecast_com.find_one(
                    {'teamName': self.teamName, 'companyName': self.companyName,
                     'period': self.period}, {"forecast": 1, "_id": 0})
                r['currentValue'] = 0
                if forecastingvalue != None:
                    if r['budgetDescID'] == 'BG200':
                        if 'b2b' in forecastingvalue['forecast'].keys():
                            r['currentValue'] = r['currentValue'] + forecastingvalue['forecast']['b2b']
                        if 'b2c' in forecastingvalue['forecast'].keys():
                            r['currentValue'] = r['currentValue'] + forecastingvalue['forecast']['b2c']
                        if 'newoffering' in forecastingvalue['forecast'].keys():
                            r['currentValue'] = r['currentValue'] + forecastingvalue['forecast']['newoffering']
                        TOTAL_REVENUE = r['currentValue']
                            # r['currentValue'] = forecastingvalue['forecast']['b2b'] + forecastingvalue['forecast'][
                            #     'b2c'] + forecastingvalue['forecast']['newoffering']
                    if r['budgetDescID'] == 'BG300':

                        if 'b2b' in forecastingvalue['forecast'].keys():
                            r['currentValue'] = r['currentValue'] + forecastingvalue['forecast']['b2b']
                        if 'b2c' in forecastingvalue['forecast'].keys():
                            r['currentValue'] = r['currentValue'] + forecastingvalue['forecast']['b2c']
                        if 'newoffering' in forecastingvalue['forecast'].keys():
                            r['currentValue'] = r['currentValue'] + forecastingvalue['forecast']['newoffering']
                        r['currentValue'] = r['currentValue'] * 0.5
                        GROSS_MARGIN = r['currentValue']
            if r['budgetDescID'] in ['BG400']: FUNCTION_EXPENCES = r['currentValue']
            if r['budgetDescID'] in ['BG500']: TOTAL_EXPENCES = r['currentValue']
            result.append(r)
        result = sorted(result, key=lambda k: k['budgetDescID'])
        NET_MARGIN = GROSS_MARGIN - TOTAL_EXPENCES
        # print(CASH_IN_HAND_AT_START,NET_MARGIN)
        for r in result:
            if r['budgetDescID'] in ['BG600']: r['currentValue'] = NET_MARGIN
            if r['budgetDescID'] in ['BG800']: r['currentValue'] = CASH_IN_HAND_AT_START + NET_MARGIN

        return result

    def set(self, objectID, value):
        self.db.account_budget_com.update_one({"_id": objectID}, {'$set': value})
