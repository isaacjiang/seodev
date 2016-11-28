from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb, leadingbase
from bson import ObjectId
from leading.account.models import Account


class PerformanceModel():
    def __init__(self):
        self.db = leadingdb

    def getCurrentPeriodbyTaskid(self, teamName, companyName, taskid):
        result = self.db.tasks_team.find_one({"teamName": teamName, "companyName": companyName, "taskID": taskid},
                                             {"companyName": 1, "teamName": 1, "period": 1, "_id": 0})
        return result

    # Does not use
    def calculateMarketShare(self, systemCurrentPeriod):
        def get_com_acc_value(accountDescID, teamName, companyName, period):
            accValue = 0
            condition = {"$and": [{"period": {"$lte": period}},
                                  {"period": {"$gt": period - 3}},
                                  {"accountDescID": accountDescID}, {"teamName": teamName},
                                  {"companyName": companyName}]}
            res = self.db.account_bookkeeping.find(condition, {"_id": 0})
            for r in res:
                accValue += r['value']
            return accValue

        def get_com_inx(indexName, teamName, companyName, period, accDescID):
            condition = {"indexName": indexName, "companyName": companyName, "teamName": teamName, "period": period,
                         "accDescID": accDescID}
            index_value = self.db.index_bookkeeping.find(condition, {"_id": 0})
            indexValue = 1
            for c in index_value:
                indexValue = indexValue * c['value']
            return indexValue

        #print "calculate"
        accountItem = ['AB010', 'AB011', 'AB012', 'AB013', 'AB014', 'AB015']
        weight = [0.1, 0.2, 0.1, 0.2, 0.3, 0.1]
        indexItem = ['competenceIndex', 'stressIndex', 'adaptabilityIndex', 'legitimacyIndex']
        selectedNiches = self.db.niches_cal.find({"period": systemCurrentPeriod})
        for selectedNiche in selectedNiches:
            # selectedNiche['_id'] = str(selectedNiche['_id'] )
            selectedNiche['companyValue'] = {}
            if 'selectedByCompany' in selectedNiche.keys():
                selected_com_total = 0
                for selectedByCom in selectedNiche['selectedByCompany']:
                    selectedNiche['companyValue'][selectedByCom] = {}
                    #print selectedNiche
                    company_total = 0

                    for i, accItem in enumerate(accountItem):
                        nc = selectedNiche['companyValue'][selectedByCom][accItem] = \
                            get_com_acc_value(accItem, selectedByCom, selectedNiche['company'], selectedNiche['period'])
                        # selectedNiche['companyValue'][selectedByCom]['weight']=weight[i]
                        competenceIndex = get_com_inx('competenceIndex', selectedByCom, selectedNiche['company'],
                                                      selectedNiche['period'], accItem)
                        company_total += nc * competenceIndex * weight[i]
                        # accitemIndex = accItem+'Index'
                        # # selectedNiche['companyValue'][selectedByCom][accitemIndex] ={}
                        # for inxItem in indexItem:
                        #     selectedNiche['companyValue'][selectedByCom][inxItem] ={} if indexItem not in selectedNiche['companyValue'][selectedByCom].keys() else selectedNiche['companyValue'][selectedByCom][inxItem]
                        #     indecValue =get_com_inx(inxItem, selectedByCom, selectedNiche['company'], selectedNiche['period'],accItem)
                        #
                        #     selectedNiche['companyValue'][selectedByCom][inxItem][accItem]={"index":indecValue,"accDescID":accItem,'weight':weight[i]}
                        #
                        #     selectedNiche['companyValue'][selectedByCom][inxItem]['subTotal'] = 1 if indexItem not in selectedNiche['companyValue'][selectedByCom][inxItem].keys()\
                        #         else selectedNiche['companyValue'][selectedByCom][inxItem]['subTotal']
                        #     selectedNiche['companyValue'][selectedByCom][inxItem]['subTotal'] = selectedNiche['companyValue'][selectedByCom][inxItem]['subTotal'] *indecValue
                    selectedNiche['companyValue'][selectedByCom]['company_total'] = company_total
                    selected_com_total += company_total
                selectedNiche['selected_com_total'] = selected_com_total

                for selectedByCom in selectedNiche['selectedByCompany']:
                    selectedNiche['companyValue'][selectedByCom]['shareRate'] = shareRate = \
                        selectedNiche['companyValue'][selectedByCom]['company_total'] / \
                        selectedNiche['selected_com_total'] if selectedNiche['selected_com_total'] != 0 else 1
                    selectedNiche['companyValue'][selectedByCom]['customersTotal'] = \
                        int(shareRate * selectedNiche['customersAvailable'])
                    selectedNiche['companyValue'][selectedByCom]['averageRecenuePPPC'] = selectedNiche[
                        'averageRecenuePPPC']
                    selectedNiche['companyValue'][selectedByCom]['sharedMarketValue'] = \
                        int(shareRate * selectedNiche['customersAvailable']) * selectedNiche['averageRecenuePPPC']
                selectedNiche['rankedCompany'] = sorted(selectedNiche['selectedByCompany'],
                                                        key=lambda x: selectedNiche['companyValue'][x]['shareRate']
                                                        , reverse=True)
                # selectedNiche['rankedCompetenceIndex'] = sorted(selectedNiche['selectedByCompany'],
                #                                         key=lambda x: selectedNiche['companyValue'][x]['competenceIndex']['subTotal']
                #                                         , reverse=True)
                # selectedNiche['rankedStressIndex'] = sorted(selectedNiche['selectedByCompany'],
                #                                         key=lambda x: selectedNiche['companyValue'][x]['stressIndex']['subTotal']
                #                                         , reverse=True)
                # selectedNiche['rankedLegitimacyIndex'] = sorted(selectedNiche['selectedByCompany'],
                #                                         key=lambda x: selectedNiche['companyValue'][x]['legitimacyIndex']['subTotal']
                #                                         , reverse=True)
                # selectedNiche['rankedAdaptabilityIndex'] = sorted(selectedNiche['selectedByCompany'],
                #                                         key=lambda x: selectedNiche['companyValue'][x]['adaptabilityIndex']['subTotal']
                #                                         , reverse=True)
                self.db.niches_cal.update_one({"_id": selectedNiche['_id']}, {"$set": selectedNiche})
                # pprint(selectedNiche)


    def marketingShare(self, teamName, companyName, period):


        #currentPeriod = self.getCurrentPeriodbyTaskid(teamName, companyName, taskID)

        # self.db.marketingshare_com.delete_many({"currentPeriod": period})
        # self.db.marketingshare_total.delete_many({"currentPeriod": period})
        # self.db.marketingshare_niche.delete_many({"currentPeriod": period})

        accountItem = ['AB010', 'AB011', 'AB012', 'AB013', 'AB014', 'AB015']
        weight = [0.1, 0.2, 0.1, 0.2, 0.3, 0.1]
        for index, item in enumerate(accountItem):
            # print teamName,companyName,period,item
            self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": period,
                                                   "accountDescID": item,
                                                   "teamName": teamName,
                                                   "companyName": companyName},
                                                  {"$set": {"competenceIndex": 1, "stressIndex": 1,
                                                            "adaptabilityIndex": 1, "legitimacyIndex": 1,
                                                            "weight": weight[index], "accValue": 0}}, upsert=True)

            condition = {"$and": [{"period": {"$lte": period}},
                                  {"period": {"$gt": period - 3}},
                                  {"accountDescID": item}, {"companyName": companyName}]}
            res = self.db.account_bookkeeping.find(condition, {"_id": 0})
            for r in res:
                self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": r['period'],
                                                       "accountDescID": r['accountDescID'],
                                                       "teamName": r['teamName'], "companyName": r['companyName']},
                                                      {"$inc": {"accValue": r['value']}})

            condition2 = {"period": period, "accDescID": item, "companyName": companyName}
            index_value = self.db.index_bookkeeping.find(condition2, {"_id": 0})

            for c in index_value:
                # print "index",c['indexName'],c['category'],c['value']
                if c['indexName'] == "competenceIndex":
                    self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": c['period'],
                                                           "accountDescID": c['accDescID'],
                                                           "teamName": c['teamName'],
                                                           "companyName": c['companyName']},
                                                          {"$mul": {"competenceIndex": c['value']}})
                if c['indexName'] == "stressIndex":
                    self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": c['period'],
                                                           "accountDescID": c['accDescID'],
                                                           "teamName": c['teamName'],
                                                           "companyName": c['companyName']},
                                                          {"$mul": {"stressIndex": c['value']}})
                if c['indexName'] == "adaptabilityIndex":
                    self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": c['period'],
                                                           "accountDescID": c['accDescID'],
                                                           "teamName": c['teamName'],
                                                           "companyName": c['companyName']},
                                                          {"$mul": {"adaptabilityIndex": c['value']}})
                if c['indexName'] == "legitimacyIndex":
                    self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": c['period'],
                                                           "accountDescID": c['accDescID'],
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

        companies = leadingbase.niches_def.find(
            {"period": period, "teamName": teamName, "company": companyName},
            {"_id": 0}).count()
        print companies
        companies = 1 if companies == 0 else companies

        totalvalue = \
        self.db.marketingshare_total.find_one({"flag": "#totalSum", "currentPeriod":period},
                                              {"_id": 0})['value'] / companies
        #
        # niches = ['B2B', 'B2C', 'Education', 'Government', 'Entertainment']
        #
        # for nicheName in niches:
        #     # print 'nicheName',nicheName
        #     selectedniches = self.db.niches_calculation.find(
        #         {"period": period, "niche": nicheName}, {"_id": 0})
        #     for n in selectedniches:
        #         if n != None:
        #             companyValue = self.db.marketingshare_total.find_one(
        #                 {'currentPeriod': n['period'], 'teamName': n['teamName'], 'companyName': n['company'],
        #                  "flag": "#comSum"}, {"_id": 0})
        #             # print 'companyValue', companyValue, companies
        #             if companyValue != None:
        #                 self.db.marketingshare_niche.update_one(
        #                     {"niche": n['niche'], 'currentPeriod': n['period'], 'teamName': n['teamName'],
        #                      'companyName': n['company'], "flag": "#nicheSum"},
        #                     {"$set": {'shareRate': companyValue['value'] / companies / totalvalue,
        #                               'totalCustomers': n['totalCustomers'] * companyValue[
        #                                   'value'] / companies / totalvalue,
        #                               "averageRecenuePPPC": n['averageRecenuePPPC'],
        #                               "sharedMarketValue": n['averageRecenuePPPC'] * n['totalCustomers'] *
        #                                                    companyValue[
        #                                                        'value'] / companies / totalvalue}}, upsert=True)
        #
        #                 # print 'totalCustomers', n['totalCustomers'], companyValue['value'], companies, totalvalue
        #                 if n['niche'] == "B2B":
        #                     accountDescID = 'AA011'
        #                     accountDescID2 = 'AA025'
        #                 elif n['niche'] == "B2C":
        #                     accountDescID = 'AA012'
        #                     accountDescID2 = 'AA026'
        #                 elif n['niche'] == "Education":
        #                     accountDescID = 'AA031'
        #                     accountDescID2 = 'AA131'
        #                 elif n['niche'] == "Government":
        #                     accountDescID = 'AA032'
        #                     accountDescID2 = 'AA132'
        #                 else:
        #                     accountDescID = 'AA033'
        #                     accountDescID2 = 'AA133'
        #
        #                     # Account(teamName=employee['HiredBy']['teamName'], companyName=employee['HiredBy']['companyName'],
        #                     #         period=self.systemCurrentPeriod).bookkeeping(objectID=employee["_id"],
        #                     #                                                      accountDescID=self.categoryToItem(
        #                     #                                                          employee['category']),
        #                     #                                                      value=employee['HiredBy']['salaryOffer'],
        #                     #                                                      comments=employee['employeeID'])
        #
        #                     Account(teamName=n['teamName'], companyName=n['company'], period=n['period']) \
        #                         .bookkeeping(accountDescID=accountDescID,
        #                                      value=n['averageRecenuePPPC'] * n['totalCustomers'] * companyValue[
        #                                          'value'] / companies / totalvalue, comments='Market Share')
        #
        #                     Account(teamName=n['teamName'], companyName=n['company'], period=n['period']) \
        #                         .bookkeeping(accountDescID=accountDescID2, value=(n['averageRecenuePPPC'] * n[
        #                         'totalCustomers'] * companyValue['value'] / companies / totalvalue) / 4,
        #                                      comments='Market Share')




class InstructionModel():
    def __init__(self):
        self.db = leadingdb

    def get_list(self):
        result = self.db.instruction_def.find({}, {"_id": 0})
        return list(result)

    def save(self, file):
        self.db.instruction_def.update_one({"_id": ObjectId(file['objectID'])}, {"$set": file}, upsert=True)
        return self.get_list()
