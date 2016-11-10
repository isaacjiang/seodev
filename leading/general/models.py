from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb
from bson import ObjectId
from pprint import pprint


class PerformanceModel():
    def __init__(self):
        self.db = leadingdb

    def getCurrentPeriodbyTaskid(self, teamName, companyName, taskid):
        result = self.db.tasks_team.find_one({"teamName": teamName, "companyName": companyName, "taskID": taskid},
                                             {"companyName": 1, "teamName": 1, "period": 1, "_id": 0})
        return result

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

        def get_com_inx(indexName, teamName, companyName, period):
            condition = {"indexName": indexName, "companyName": companyName, "teamName": teamName, "period": period,}
            index_value = self.db.index_bookkeeping.find(condition, {"_id": 0})
            indexValue = 1
            for c in index_value:
                indexValue = indexValue * c['value']
            return indexValue

        print "calculate"
        accountItem = ['AB010', 'AB011', 'AB012', 'AB013', 'AB014', 'AB015']
        weight = [0.1, 0.2, 0.1, 0.2, 0.3, 0.1]
        indexItem = ['competenceIndex', 'stressIndex', 'adaptabilityIndex', 'legitimacyIndex']
        selectedNiches = self.db.niches_def.find({"period": systemCurrentPeriod})
        for selectedNiche in selectedNiches:
            # selectedNiche['_id'] = str(selectedNiche['_id'] )
            selectedNiche['companyValue'] = {}
            if 'selectedByCompany' in selectedNiche.keys():
                selected_com_total = 0
                for selectedByCom in selectedNiche['selectedByCompany']:
                    selectedNiche['companyValue'][selectedByCom] = {}
                    print selectedNiche
                    company_total = 0
                    competenceIndex = get_com_inx('competenceIndex', selectedByCom, selectedNiche['company'],
                                                  selectedNiche['period'])
                    for i, accItem in enumerate(accountItem):
                        nc = selectedNiche['companyValue'][selectedByCom][accItem] = \
                            get_com_acc_value(accItem, selectedByCom, selectedNiche['company'], selectedNiche['period'])
                        company_total += nc * competenceIndex * weight[i]
                    for inxItem in indexItem:
                        selectedNiche['companyValue'][selectedByCom][inxItem] = \
                            get_com_inx(inxItem, selectedByCom, selectedNiche['company'], selectedNiche['period'])
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
                self.db.niches_def.update_one({"_id": selectedNiche['_id']}, {"$set": selectedNiche})
            pprint(selectedNiche)



    def marketingShare(self, teamName, companyName, period):


        #currentPeriod = self.getCurrentPeriodbyTaskid(teamName, companyName, taskID)

        self.db.marketingshare_com.delete_many({"currentPeriod": period})
        self.db.marketingshare_total.delete_many({"currentPeriod": period})
        self.db.marketingshare_niche.delete_many({"currentPeriod": period})

        accountItem = ['AB010', 'AB011', 'AB012', 'AB013', 'AB014', 'AB015']
        weight = [0.1, 0.2, 0.1, 0.2, 0.3, 0.1]
        for index, item in enumerate(accountItem):
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
                # print r
                self.db.marketingshare_com.update_one({"flag": "#comSum", "currentPeriod": r['period'],
                                                       "accountDescID": r['accountDescID'],
                                                       "teamName": r['teamName'], "companyName": r['companyName']},
                                                      {"$inc": {"accValue": r['value']}})

            condition2 = {"period": period, "category": item, "companyName": companyName}
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

        companies = self.db.niches_def.find(
            {"period": period, "teamName": teamName, "company": companyName},
            {"_id": 0}).count()
        companies = 1 if companies == 0 else companies

        totalvalue = \
        self.db.marketingshare_total.find_one({"flag": "#totalSum", "currentPeriod":period},
                                              {"_id": 0})['value'] / companies

        niches = ['B2B', 'B2C', 'Education', 'Government', 'Entertainment']

        for nicheName in niches:
            # print 'nicheName',nicheName
            selectedniches = self.db.niches_calculation.find(
                {"period": period, "niche": nicheName}, {"_id": 0})
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

    def queryCurrentMarketData(self):
        username = request.args["username"]
        currentPeriod = models.getCurrentPeriod(username)
        result={}
        if "companyName" in currentPeriod.keys():

            niche_marketingshare = sdb.marketingshare_niche.find({"flag": "#nicheSum", "companyName": currentPeriod['companyName'], })
            marketPerformance = {}
            marketValue = {}
            for niche_v in niche_marketingshare:
                if niche_v['niche'] not in marketPerformance.keys():
                    marketPerformance[niche_v['niche']] = {'niche':niche_v['niche']}
                if niche_v['teamName'] not in marketPerformance[niche_v['niche']].keys():
                    marketPerformance[niche_v['niche']][niche_v['teamName']] = []

                #great Value
                if niche_v['teamName'] not in marketValue.keys():
                    marketValue[niche_v['teamName']] = {'teamName': niche_v['teamName']}
                if niche_v['currentPeriod'] not in marketValue[niche_v['teamName']].keys():
                    marketValue[niche_v['teamName']][niche_v['currentPeriod']] = 0

                if niche_v['niche'] =='B2B' and niche_v['currentPeriod'] <=4 and currentPeriod['companyName'] =='LegacyCo':
                    marketValue[niche_v['teamName']][niche_v['currentPeriod']] += niche_v['shareRate']* 0.7
                elif niche_v['niche'] == 'B2C' and niche_v['currentPeriod'] <= 4 and currentPeriod['companyName'] == 'LegacyCo':
                    marketValue[niche_v['teamName']][niche_v['currentPeriod']] += niche_v['shareRate'] * 0.3
                else:
                    marketValue[niche_v['teamName']][niche_v['currentPeriod']] += niche_v['totalCustomers']

                marketPerformance[niche_v['niche']][niche_v['teamName']].append({'x':niche_v['currentPeriod'],"y":niche_v['shareRate']*100})

            result["marketPerformance"] = marketPerformance
            result["marketValue"] = marketValue
            index_com = sdb.marketingshare_com.find({"flag": "#comSum", "companyName": currentPeriod['companyName']},{"_id": 0})

            managementPerformance_ci = {}
            managementPerformance_si = {}
            managementPerformance_ai = {}
            managementValue = {}
            for index in index_com:
                # print index
                if itemToCatogory(index['accountDescID']) not in managementPerformance_ci.keys():
                    managementPerformance_ci[itemToCatogory(index['accountDescID'])] = {'category':itemToCatogory(index['accountDescID']),'accItem':'c'+index['accountDescID']}
                    managementPerformance_si[itemToCatogory(index['accountDescID'])] = {'category': itemToCatogory(index['accountDescID']),'accItem':'s'+index['accountDescID']}
                    managementPerformance_ai[itemToCatogory(index['accountDescID'])] = {'category': itemToCatogory(index['accountDescID']),'accItem':'a'+index['accountDescID']}
                if index['teamName'] not in managementPerformance_ci[itemToCatogory(index['accountDescID'])].keys():
                    managementPerformance_ci[itemToCatogory(index['accountDescID'])][index['teamName']] = []
                    managementPerformance_si[itemToCatogory(index['accountDescID'])][index['teamName']] = []
                    managementPerformance_ai[itemToCatogory(index['accountDescID'])][index['teamName']] = []

                    managementPerformance_ci[itemToCatogory(index['accountDescID'])][index['teamName']].append(
                        {'x': index['currentPeriod'], "y": index['competenceIndex'] * 100})
                    managementPerformance_si[itemToCatogory(index['accountDescID'])][index['teamName']].append(
                        {'x': index['currentPeriod'],  "y": index['stressIndex'] * 100})
                    managementPerformance_ai[itemToCatogory(index['accountDescID'])][index['teamName']].append(
                        {'x': index['currentPeriod'],  "y": index['adaptabilityIndex'] * 100})

                    #great value

                if index['teamName'] not in managementValue.keys():
                    managementValue[index['teamName']] = {'teamName': index['teamName']}
                if index['currentPeriod'] not in managementValue[index['teamName']].keys():
                    managementValue[index['teamName']][index['currentPeriod']] = 1
                managementValue[index['teamName']][index['currentPeriod']] = managementValue[index['teamName']][index['currentPeriod']]*index['weight'] * index['competenceIndex'] * 100* 0.5 * index['stressIndex'] * 100 *0.3 * index['adaptabilityIndex'] * 100 *0.2

            result["managementPerformance_ci"] = managementPerformance_ci
            result["managementPerformance_si"] = managementPerformance_si
            result["managementPerformance_ai"] = managementPerformance_ai
            result["managementValue"] = managementValue

            financialPerformance={}
            financialValue = {}

            acc_ranking_com = sdb.account_ranking.find({"companyName": currentPeriod["companyName"]},{"_id": 0})

            for acc_com in acc_ranking_com:
                for item in ['ROA','ROS','NOCG']:
                    if item not in financialPerformance.keys():
                        financialPerformance[item] = {'item': item}
                    if acc_com['teamName'] not in financialPerformance[item].keys():
                        financialPerformance[item][acc_com['teamName']] = []

                        financialPerformance[item][acc_com['teamName']].append(
                            {'x': acc_com['period'], "y": acc_com[item]})

                        # great value

                if acc_com['teamName'] not in financialValue.keys():
                    financialValue[acc_com['teamName']] = {'teamName': acc_com['teamName']}
                if acc_com['period'] not in financialValue[acc_com['teamName']].keys():
                    financialValue[acc_com['teamName']][acc_com['period']] = {"NOCG":acc_com['NOCG'],"EBITDA":acc_com['AB031']}

            result['financialPerformance'] = financialPerformance
            result['financialValue'] = financialValue

        return json.dumps(result)


class InstructionModel():
    def __init__(self):
        self.db = leadingdb

    def get_list(self):
        result = self.db.instruction_def.find({}, {"_id": 0})
        return list(result)

    def save(self, file):
        self.db.instruction_def.update_one({"_id": ObjectId(file['objectID'])}, {"$set": file}, upsert=True)
        return self.get_list()
