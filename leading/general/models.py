from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb, leadingbase
from bson import ObjectId
from leading.account.models import Account
from leading.syssetting.models import SystemSetting
from pprint import pprint

class PerformanceModel():
    def __init__(self):
        self.db = leadingdb

    # Does not use
    def calculateMarketShare(self, systemCurrentPeriod):
        def get_com_acc_value(accountDescID, teamName, companyName, period):
            accValue = 0
            condition = {"$and": [{"period": {"$lte": period}},
                                  {"period": {"$gte": period - 3}},
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

                    if type(selectedByCom) is dict:
                        selectedByCom = selectedByCom['teamName']
                    selectedNiche['companyValue'][selectedByCom] = {}
                    #print selectedNiche
                    company_total = 0
                    competenceIndex_total = 1
                    stressIndex_total = 1
                    legitimacyIndex_total = 1
                    adaptabilityIndex_total = 1
                    selectedNiche['companyValue'][selectedByCom]['accountValue'] = {}
                    selectedNiche['companyValue'][selectedByCom]['competenceIndex'] = {}
                    selectedNiche['companyValue'][selectedByCom]['stressIndex'] = {}
                    selectedNiche['companyValue'][selectedByCom]['legitimacyIndex'] = {}
                    selectedNiche['companyValue'][selectedByCom]['adaptabilityIndex'] = {}
                    selectedNiche['companyValue'][selectedByCom]['weight'] = {}
                    for i, accItem in enumerate(accountItem):

                        nc = selectedNiche['companyValue'][selectedByCom]['accountValue'][accItem] = \
                            get_com_acc_value(accItem, selectedByCom, selectedNiche['company'], selectedNiche['period'])
                        selectedNiche['companyValue'][selectedByCom]['weight'][accItem] = weight[i]
                        competenceIndex = selectedNiche['companyValue'][selectedByCom]['competenceIndex'][accItem] = \
                            get_com_inx('competenceIndex', selectedByCom, selectedNiche['company'],
                                                      selectedNiche['period'], accItem)
                        stressIndex = selectedNiche['companyValue'][selectedByCom]['stressIndex'][accItem] = \
                            get_com_inx('stressIndex', selectedByCom, selectedNiche['company'],
                                        selectedNiche['period'], accItem)
                        legitimacyIndex = selectedNiche['companyValue'][selectedByCom]['legitimacyIndex'][accItem] = \
                            get_com_inx('legitimacyIndex', selectedByCom, selectedNiche['company'],
                                        selectedNiche['period'], accItem)
                        adaptabilityIndex_ = selectedNiche['companyValue'][selectedByCom]['adaptabilityIndex'][
                            accItem] = \
                            get_com_inx('adaptabilityIndex_', selectedByCom, selectedNiche['company'],
                                        selectedNiche['period'], accItem)
                        # newCo need change to legitmacyIndex
                        if selectedNiche['company'] == 'NewCo':
                            company_total += nc * legitimacyIndex * weight[i]
                        else:
                            company_total += nc * competenceIndex * weight[i]
                        competenceIndex_total = competenceIndex_total * competenceIndex
                        stressIndex_total = stressIndex_total * stressIndex
                        legitimacyIndex_total = legitimacyIndex_total * legitimacyIndex
                        adaptabilityIndex_total = adaptabilityIndex_total * adaptabilityIndex_
                    selectedNiche['companyValue'][selectedByCom]['company_total'] = company_total
                    selectedNiche['companyValue'][selectedByCom]['competenceIndex_total'] = competenceIndex_total
                    selectedNiche['companyValue'][selectedByCom]['stressIndex_total'] = stressIndex_total
                    selectedNiche['companyValue'][selectedByCom]['legitimacyIndex_total'] = legitimacyIndex_total
                    selectedNiche['companyValue'][selectedByCom]['adaptabilityIndex_total'] = adaptabilityIndex_total
                    selected_com_total += company_total
                selectedNiche['selected_com_total'] = selected_com_total

                for selectedByCom in selectedNiche['selectedByCompany']:
                    if type(selectedByCom) is dict:
                        selectedByCom = selectedByCom['teamName']
                    companiesNumber = len(selectedNiche['selectedByCompany'])
                    selectedNiche['companyValue'][selectedByCom]['shareRate'] = shareRate = \
                        selectedNiche['companyValue'][selectedByCom]['company_total'] / \
                        selectedNiche['selected_com_total'] if selectedNiche['selected_com_total'] != 0 else 1
                    selectedNiche['companyValue'][selectedByCom]['customersTotal'] = \
                        int(shareRate * selectedNiche['customersAvailable'] * companiesNumber)
                    selectedNiche['companyValue'][selectedByCom]['averageRecenuePPPC'] = selectedNiche[
                        'averageRecenuePPPC']
                    selectedNiche['companyValue'][selectedByCom]['sharedMarketValue'] = \
                        int(shareRate * selectedNiche['customersAvailable'] * companiesNumber) * selectedNiche[
                            'averageRecenuePPPC']
                selectedNiche['rankedCompany'] = sorted(selectedNiche['selectedByCompany'],
                                                        key=lambda x: selectedNiche['companyValue'][x]['shareRate']
                                                        , reverse=True)
                selectedNiche['rankedCompetenceIndex'] = {}
                selectedNiche['rankedStressIndex'] = {}
                selectedNiche['rankedLegitimacyIndex'] = {}
                selectedNiche['rankedAdaptabilityIndex'] = {}
                for accItem in accountItem:
                    selectedNiche['rankedCompetenceIndex'][accItem] = sorted(selectedNiche['selectedByCompany'],
                                                                             key=lambda x:
                                                                             selectedNiche['companyValue'][x][
                                                                                 'competenceIndex'][accItem],
                                                                             reverse=True)
                    selectedNiche['rankedStressIndex'][accItem] = sorted(selectedNiche['selectedByCompany'],
                                                                         key=lambda x: selectedNiche['companyValue'][x][
                                                                             'stressIndex'][accItem]
                                                                         , reverse=True)
                    selectedNiche['rankedLegitimacyIndex'][accItem] = sorted(selectedNiche['selectedByCompany'],
                                                                             key=lambda x:
                                                                             selectedNiche['companyValue'][x][
                                                                                 'legitimacyIndex'][accItem]
                                                                             , reverse=True)
                    selectedNiche['rankedAdaptabilityIndex'][accItem] = sorted(selectedNiche['selectedByCompany'],
                                                                               key=lambda x:
                                                                               selectedNiche['companyValue'][x][
                                                                                   'adaptabilityIndex'][accItem]
                                                                               , reverse=True)
                self.db.niches_cal.update_one({"_id": selectedNiche['_id']}, {"$set": selectedNiche})
            # pprint(selectedNiche)
            # account system
            for team in selectedNiche['companyValue'].keys():
                tValue = selectedNiche['companyValue'][team]
                print selectedNiche['niche']
                if selectedNiche['niche'] == "B2B":
                    accountDescID = 'AA011'
                elif selectedNiche['niche'] == "B2C":
                    accountDescID = 'AA012'
                elif selectedNiche['niche'] == "Education":
                    accountDescID = 'AA031'
                elif selectedNiche['niche'] == "Government":
                    accountDescID = 'AA032'
                else:
                    accountDescID = 'AA033'

                Account(teamName=team, companyName=selectedNiche['company'], period=selectedNiche['period']) \
                    .bookkeeping(accountDescID=accountDescID, objectID=selectedNiche["_id"],
                                 value=tValue['sharedMarketValue'], comments='Market Share')


    def marketingShare(self, teamName, companyName, period):

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
                                                      {"$inc": {"accValue": float(r['value'])}})

            condition2 = {"period": period, "accDescID": item, "companyName": companyName}
            index_value = self.db.index_bookkeeping.find(condition2, {"_id": 0})
            XXX = 1
            for c in index_value:
                # print "index",c['indexName'],c['category'],c['value']
                if c['indexName'] == "competenceIndex":
                    # if c['value']>1.8:

                    if c['period'] == 2 and c['accDescID'] == 'AB014' and c['companyName'] == 'LegacyCo' and c[
                        'teamName'] == 'Team C':
                        XXX = XXX * c['value']
                        print XXX, c['value']
                    # print c['teamName'],'  ',c['companyName'],":",c['value']
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

        self.db.marketingshare_total.drop()

        market = self.db.marketingshare_com.find({}, {"_id": 0})
        for m in market:
            self.db.marketingshare_total.update_one({"flag": "#comSum", "currentPeriod": m['currentPeriod'],
                                                     "teamName": m['teamName'], "companyName": m['companyName']},
                                                    {"$inc": {"value": float(m['accValue']) * m['competenceIndex'] * m[
                                                        'weight']}}, upsert=True)
            self.db.marketingshare_total.update_one({"flag": "#totalSum", "currentPeriod": m['currentPeriod'],
                                                     "teamName": '', "companyName": ''},
                                                    {"$inc": {"value": float(m['accValue']) * m['competenceIndex'] * m[
                                                        'weight']}}, upsert=True)

        # TODO,need recalculate the niches number of a company selected.
        companies = leadingbase.niches_def.find(
            {"period": period, "company": companyName},
            {"_id": 0}).count()
        companies = 1 if companies == 0 else companies

        totalvalue = \
        self.db.marketingshare_total.find_one({"flag": "#totalSum", "currentPeriod":period},
                                              {"_id": 0})['value'] / companies
        totalvalue = 1 if totalvalue == 0 else totalvalue

        niche_cal = self.db.niches_cal.find({"period": period})
        for niche in niche_cal:
            for n in niche['selectedByCompany']:
                if n != None:
                    # print 'currentPeriod',niche['period'], 'teamName',n, 'companyName',niche['company']
                    companyValue = self.db.marketingshare_total.find_one(
                        {'currentPeriod': niche['period'], 'teamName': n, 'companyName': niche['company'],
                         "flag": "#comSum"}, {"_id": 0})
                    if companyValue != None:
                        # print n,companyValue['value']/totalvalue
                        self.db.marketingshare_niche.update_one(
                            {"niche": niche['niche'], 'currentPeriod': niche['period'], 'teamName': n,
                             'companyName': niche['company'], "flag": "#nicheSum"},
                            {"$set": {'shareRate': companyValue['value'] / companies / totalvalue,
                                      'totalCustomers': niche['customersAvailable'] * companyValue[
                                          'value'] / companies / totalvalue,
                                      "averageRecenuePPPC": niche['averageRecenuePPPC'],
                                      "sharedMarketValue": niche['averageRecenuePPPC'] * niche['customersAvailable'] *
                                                           companyValue[
                                                               'value'] / companies / totalvalue}}, upsert=True)
                        # TODO change totalCuustomers to customersAvailiable
                        # print 'totalCustomers', n['totalCustomers'], companyValue['value'], companies, totalvalue
                        if niche['niche'] == "B2B":
                            accountDescID = 'AA011'
                            accountDescID2 = 'AA025'
                        elif niche['niche'] == "B2C":
                            accountDescID = 'AA012'
                            accountDescID2 = 'AA026'
                        elif niche['niche'] == "Education":
                            accountDescID = 'AA031'
                            accountDescID2 = 'AA131'
                        elif niche['niche'] == "Government":
                            accountDescID = 'AA032'
                            accountDescID2 = 'AA132'
                        else:
                            accountDescID = 'AA033'
                            accountDescID2 = 'AA133'

                        Account(teamName=n, companyName=niche['company'], period=niche['period']) \
                            .bookkeeping(accountDescID=accountDescID, objectID=niche["_id"],
                                         value=niche['averageRecenuePPPC'] * niche['customersAvailable'] * companyValue[
                                             'value'] / companies / totalvalue, comments='Market Share')

                        # Account(teamName=n, companyName=niche['company'], period=niche['period']) \
                        #     .bookkeeping(accountDescID=accountDescID2, objectID=niche["_id"],
                        #                  value=(niche['averageRecenuePPPC'] * niche[
                        #                      'customersAvailable'] * companyValue[
                        #                             'value'] / companies / totalvalue) / 4,
                        #                  comments='Market Share')

class InstructionModel():
    def __init__(self):
        self.db = leadingbase

    def get_list(self):
        currentPeriod = SystemSetting().get_system_current_period()
        result = self.db.instruction_def.find({'period': currentPeriod}, {"_id": 0}).sort("filename", 1)
        return list(result)

    def save(self, file):
        self.db.instruction_def.update_one({"_id": ObjectId(file['objectID'])}, {"$set": file}, upsert=True)
        return self.get_list()

    def delete(self, file):
        self.db.instruction_def.update_one({"_id": ObjectId(file['objectID'])}, {"$unset": file}, upsert=True)
        return self.get_list()
