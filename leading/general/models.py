from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb


class PerformanceModel():
    def __init__(self):
        self.db = leadingdb

    def getCurrentPeriodbyTaskid(self, teamName, companyName, taskid):
        result = self.db.tasks_team.find_one({"teamName": teamName, "companyName": companyName, "taskID": taskid},
                                             {"companyName": 1, "teamName": 1, "period": 1, "_id": 0})
        return result

    def marketingShare(self, teamName, companyName, taskID):

        allteam = self.db.tasks_team.find({"taskID": taskID, "companyName": companyName, "status": "Init"}).count()
        if allteam > 1:
            result = {"result": "Not all companies are completed."}
        else:
            currentPeriod = self.getCurrentPeriodbyTaskid(teamName, companyName, taskID)

            self.db.marketingshare_com.delete_many({"currentPeriod": currentPeriod['period']})
            self.db.marketingshare_total.delete_many({"currentPeriod": currentPeriod['period']})
            self.db.marketingshare_niche.delete_many({"currentPeriod": currentPeriod['period']})

            accountItem = ['AB010', 'AB011', 'AB012', 'AB013', 'AB014', 'AB015']
            weight = [0.1, 0.2, 0.1, 0.2, 0.3, 0.1]
            for index, item in enumerate(accountItem):
                self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": currentPeriod['period'],
                                                       "accountDescID": item,
                                                       "teamName": currentPeriod['teamName'],
                                                       "companyName": currentPeriod['companyName']},
                                                      {"$set": {"competenceIndex": 1, "stressIndex": 1,
                                                                "adaptabilityIndex": 1, "legitimacyIndex": 1,
                                                                "weight": weight[index], "accValue": 0}}, upsert=True)

                condition = {"$and": [{"period": {"$lte": currentPeriod['period']}},
                                      {"period": {"$gt": currentPeriod['period'] - 3}},
                                      {"accountDescID": item}, {"companyName": companyName}]}
                res = self.db.account_bookkeeping.find(condition, {"_id": 0})
                for r in res:
                    # print r
                    self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": r['period'],
                                                           "accountDescID": r['accountDescID'],
                                                           "teamName": r['teamName'], "companyName": r['companyName']},
                                                          {"$inc": {"accValue": r['value']}})

                condition2 = {"period": currentPeriod['period'], "category": item, "companyName": companyName}
                index_value = self.db.index_bookkeeping.find(condition2, {"_id": 0})

                for c in index_value:
                    # print "index",c['indexName'],c['category'],c['value']
                    if c['indexName'] == "competenceIndex":
                        self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": c['period'],
                                                               "accountDescID": c['category'],
                                                               "teamName": c['teamName'],
                                                               "companyName": c['companyName']},
                                                              {"$mul": {"competenceIndex": c['value']}})
                    if c['indexName'] == "stressIndex":
                        self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": c['period'],
                                                               "accountDescID": c['category'],
                                                               "teamName": c['teamName'],
                                                               "companyName": c['companyName']},
                                                              {"$mul": {"stressIndex": c['value']}})
                    if c['indexName'] == "adaptabilityIndex":
                        self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": c['period'],
                                                               "accountDescID": c['category'],
                                                               "teamName": c['teamName'],
                                                               "companyName": c['companyName']},
                                                              {"$mul": {"adaptabilityIndex": c['value']}})
                    if c['indexName'] == "legitimacyIndex":
                        self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": c['period'],
                                                               "accountDescID": c['category'],
                                                               "teamName": c['teamName'],
                                                               "companyName": c['companyName']},
                                                              {"$mul": {"legitimacyIndex": c['value']}})
            market = self.db.marketingshare_com.find({}, {"_id": 0})
            for m in market:
                self.db.marketingshare_total.update_one({"flag": "#comSum", "currentPeriod": m['currentPeriod'],
                                                         "teamName": m['teamName'], "companyName": m['companyName']},
                                                        {"$inc": {"value": m['accValue'] * m['competenceIndex'] * m[
                                                            'weight']}}, upsert=True)
                self.db.marketingshare_total.update_one({"flag": "#totalSum", "currentPeriod": m['currentPeriod'],
                                                         "teamName": '', "companyName": ''},
                                                        {"$inc": {"value": m['accValue'] * m['competenceIndex'] * m[
                                                            'weight']}}, upsert=True)

            companies = self.db.niches_calculation.find(
                {"period": currentPeriod['period'], "teamName": teamName, "company": companyName},
                {"_id": 0}).count()
            companies = 1 if companies == 0 else companies

            totalvalue = \
            self.db.marketingshare_total.find_one({"flag": "#totalSum", "currentPeriod": currentPeriod['period']},
                                                  {"_id": 0})['value'] / companies

            niches = ['B2B', 'B2C', 'Education', 'Government', 'Entertainment']

            for nicheName in niches:
                # print 'nicheName',nicheName
                selectedniches = self.db.niches_calculation.find(
                    {"period": currentPeriod['period'], "niche": nicheName}, {"_id": 0})
                for n in selectedniches:
                    if n != None:
                        companyValue = self.db.marketingshare_total.find_one(
                            {'currentPeriod': n['period'], 'teamName': n['teamName'], 'companyName': n['company'],
                             "flag": "#comSum"}, {"_id": 0})
                        # print 'companyValue', companyValue, companies
                        if companyValue != None:
                            self.db.marketingshare_niche.update_one(
                                {"niche": n['niche'], 'currentPeriod': n['period'], 'teamName': n['teamName'],
                                 'companyName': n['company'], "flag": "#nicheSum"},
                                {"$set": {'shareRate': companyValue['value'] / companies / totalvalue,
                                          'totalCustomers': n['totalCustomers'] * companyValue[
                                              'value'] / companies / totalvalue,
                                          "averageRecenuePPPC": n['averageRecenuePPPC'],
                                          "sharedMarketValue": n['averageRecenuePPPC'] * n['totalCustomers'] *
                                                               companyValue[
                                                                   'value'] / companies / totalvalue}}, upsert=True)

                            # print 'totalCustomers', n['totalCustomers'], companyValue['value'], companies, totalvalue
                            if n['niche'] == "B2B":
                                accountDescID = 'AA011'
                                accountDescID2 = 'AA025'
                            elif n['niche'] == "B2C":
                                accountDescID = 'AA012'
                                accountDescID2 = 'AA026'
                            elif n['niche'] == "Education":
                                accountDescID = 'AA031'
                                accountDescID2 = 'AA131'
                            elif n['niche'] == "Government":
                                accountDescID = 'AA032'
                                accountDescID2 = 'AA132'
                            else:
                                accountDescID = 'AA033'
                                accountDescID2 = 'AA133'

                                # Account(n['teamName'], n['company'], n['period']).bookkeeping( accountDescID,n['averageRecenuePPPC'] * n['totalCustomers'] * companyValue[
                                #     'value'] / companies / totalvalue,'Detail','Market Share')
                                #
                                # Account(n['teamName'], n['company'], n['period']).bookkeeping(accountDescID2,(
                                #     n['averageRecenuePPPC'] * n['totalCustomers'] * companyValue['value'] / companies / totalvalue) / 4,'Detail','Market Share')
