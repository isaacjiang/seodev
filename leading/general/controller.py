import models
from leading.entities.controller import EntitiesService
from flask import json, request
from leading.config import leadingdb
from leading.syssetting.models import SystemSetting
import pymongo
from pprint import pprint


class PerformanceService():
    def __init__(self):
        self.db = leadingdb

    def queryCurrentMarketData(self):
        username = request.args["username"]
        userInfo = EntitiesService().get_user_info(username)
        currentPeriod = {}
        currentPeriod['teamName'] = userInfo['teamInfo']['teamName']
        currentPeriod['companyName'] = userInfo['companyInfo']['companyName']
        currentPeriod['currentPeriod'] = userInfo['companyInfo']['currentPeriod']
        result = {}
        if "companyName" in currentPeriod.keys():

            niche_marketingshare = self.db.marketingshare_niche.find(
                {"flag": "#nicheSum", "companyName": currentPeriod['companyName'],})
            # marketPerformance = {}
            marketValue = {}
            for niche_v in niche_marketingshare:
                # if niche_v['niche'] not in marketPerformance.keys():
                #     marketPerformance[niche_v['niche']] = {'niche':niche_v['niche']}
                # if niche_v['teamName'] not in marketPerformance[niche_v['niche']].keys():
                #     marketPerformance[niche_v['niche']][niche_v['teamName']] = []

                # great Value
                if niche_v['teamName'] not in marketValue.keys():
                    marketValue[niche_v['teamName']] = {'teamName': niche_v['teamName']}
                if niche_v['currentPeriod'] not in marketValue[niche_v['teamName']].keys():
                    marketValue[niche_v['teamName']][niche_v['currentPeriod']] = 0

                if niche_v['niche'] == 'B2B' and niche_v['currentPeriod'] <= 4 and currentPeriod[
                    'companyName'] == 'LegacyCo':
                    marketValue[niche_v['teamName']][niche_v['currentPeriod']] += niche_v['shareRate'] * 0.7
                elif niche_v['niche'] == 'B2C' and niche_v['currentPeriod'] <= 4 and currentPeriod[
                    'companyName'] == 'LegacyCo':
                    marketValue[niche_v['teamName']][niche_v['currentPeriod']] += niche_v['shareRate'] * 0.3
                else:
                    marketValue[niche_v['teamName']][niche_v['currentPeriod']] += niche_v['totalCustomers']

                    # marketPerformance[niche_v['niche']][niche_v['teamName']].append({'x':niche_v['currentPeriod'],"y":niche_v['shareRate']*100})

            # result["marketPerformance"] = marketPerformance
            result["marketValue"] = marketValue
            index_com = self.db.marketingshare_com.find(
                {"flag": "#comSum", "companyName": currentPeriod['companyName']}, {"_id": 0})

            # managementPerformance_ci = {}
            # managementPerformance_si = {}
            # managementPerformance_ai = {}
            managementValue = {}
            for index in index_com:
                # # print index
                # if self.itemToCatogory(index['accountDescID']) not in managementPerformance_ci.keys():
                #     managementPerformance_ci[self.itemToCatogory(index['accountDescID'])] = {'category':self.itemToCatogory(index['accountDescID']),'accItem':'c'+index['accountDescID']}
                #     managementPerformance_si[self.itemToCatogory(index['accountDescID'])] = {'category': self.itemToCatogory(index['accountDescID']),'accItem':'s'+index['accountDescID']}
                #     managementPerformance_ai[self.itemToCatogory(index['accountDescID'])] = {'category': self.itemToCatogory(index['accountDescID']),'accItem':'a'+index['accountDescID']}
                # if index['teamName'] not in managementPerformance_ci[self.itemToCatogory(index['accountDescID'])].keys():
                #     managementPerformance_ci[self.itemToCatogory(index['accountDescID'])][index['teamName']] = []
                #     managementPerformance_si[self.itemToCatogory(index['accountDescID'])][index['teamName']] = []
                #     managementPerformance_ai[self.itemToCatogory(index['accountDescID'])][index['teamName']] = []
                #
                #     managementPerformance_ci[self.itemToCatogory(index['accountDescID'])][index['teamName']].append(
                #         {'x': index['currentPeriod'], "y": index['competenceIndex'] * 100})
                #     managementPerformance_si[self.itemToCatogory(index['accountDescID'])][index['teamName']].append(
                #         {'x': index['currentPeriod'],  "y": index['stressIndex'] * 100})
                #     managementPerformance_ai[self.itemToCatogory(index['accountDescID'])][index['teamName']].append(
                #         {'x': index['currentPeriod'],  "y": index['adaptabilityIndex'] * 100})
                #
                #     #great value

                if index['teamName'] not in managementValue.keys():
                    managementValue[index['teamName']] = {'teamName': index['teamName']}
                if index['currentPeriod'] not in managementValue[index['teamName']].keys():
                    managementValue[index['teamName']][index['currentPeriod']] = 1
                managementValue[index['teamName']][index['currentPeriod']] = managementValue[index['teamName']][
                                                                                 index['currentPeriod']] * index[
                                                                                 'weight'] * index[
                                                                                 'competenceIndex'] * 100 * 0.5 * index[
                                                                                 'stressIndex'] * 100 * 0.3 * index[
                                                                                 'adaptabilityIndex'] * 100 * 0.2

            # result["managementPerformance_ci"] = managementPerformance_ci
            # result["managementPerformance_si"] = managementPerformance_si
            # result["managementPerformance_ai"] = managementPerformance_ai
            result["managementValue"] = managementValue

            # financialPerformance={}
            financialValue = {}

            acc_ranking_com = self.db.account_ranking.find({"companyName": currentPeriod["companyName"]}, {"_id": 0})

            for acc_com in acc_ranking_com:
                # for item in ['ROA','ROS','NOCG']:
                #     if item not in financialPerformance.keys():
                #         financialPerformance[item] = {'item': item}
                #     if acc_com['teamName'] not in financialPerformance[item].keys():
                #         financialPerformance[item][acc_com['teamName']] = []
                #
                #         financialPerformance[item][acc_com['teamName']].append(
                #             {'x': acc_com['period'], "y": acc_com[item]})

                # great value

                if acc_com['teamName'] not in financialValue.keys():
                    financialValue[acc_com['teamName']] = {'teamName': acc_com['teamName']}
                if acc_com['period'] not in financialValue[acc_com['teamName']].keys():
                    financialValue[acc_com['teamName']][acc_com['period']] = {"NOCG": acc_com['NOCG'],
                                                                              "EBITDA": acc_com['AB031']}

            # result['financialPerformance'] = financialPerformance
            result['financialValue'] = financialValue

        return json.dumps(result)

    def itemToCatogory(self, accountDescID):
        if accountDescID == 'AB011':
            category = 'Sales & Distribution'

        elif accountDescID == 'AB012':
            category = 'Marketing & Advertizing'

        elif accountDescID == 'AB013':
            category = 'Market Support'

        elif accountDescID == 'AB014':
            category = 'Logistics & IT'

        elif accountDescID == 'AB015':
            category = 'Product Development'

        else:
            category = 'Leadership'

        return category

    def queryDashboardData(self):
        username = request.args["username"]
        userInfo = EntitiesService().get_user_info(username)
        currentPeriod = {}
        currentPeriod['teamName'] = userInfo['teamInfo']['teamName']
        currentPeriod['companyName'] = userInfo['companyInfo']['companyName']
        currentPeriod['currentPeriod'] = userInfo['companyInfo']['currentPeriod']
        systemCurrentPeriod = SystemSetting().get_system_current_period()

        # currentPeriod = models.getCurrentPeriod(username)
        #models.marketingShare(currentPeriod['teamName'], currentPeriod['companyName'],'0'+ str(currentPeriod['currentPeriod'])+'100')
        result = {}
        if currentPeriod is not None and "companyName" in currentPeriod.keys():
            niches = ['B2B', 'B2C', 'Education', 'Government', 'Entertainment']

            for period in [currentPeriod['currentPeriod'] - 1, currentPeriod['currentPeriod']]:
                # rank
                for niche in niches:

                    niche_marketingshare_ranking = self.db.marketingshare_niche.find(
                        {"flag": "#nicheSum", "niche": niche, "companyName": currentPeriod['companyName'],
                         "currentPeriod": period}).sort([("shareRate", pymongo.ASCENDING)])
                    for index, niche_rank in enumerate(niche_marketingshare_ranking):
                        self.db.marketingshare_niche.update_one(
                            {"flag": "#nicheSum", "niche": niche, "teamName": currentPeriod['teamName'],
                             "companyName": currentPeriod['companyName'],
                             "currentPeriod": period}, {"$set": {"ranking": index + 1}})

            niche_marketingshare = self.db.marketingshare_niche.find(
                {"flag": "#nicheSum", "teamName": currentPeriod['teamName'],
                 "companyName": currentPeriod['companyName'],
                 "currentPeriod": {"$in": [currentPeriod['currentPeriod'] - 1, currentPeriod['currentPeriod']]}})
            marketPerformance = []
            for niche_v in niche_marketingshare:
                # sprint niche_v
                if niche_v['currentPeriod'] == currentPeriod['currentPeriod']:
                    period = 'Current'
                else:
                    period = 'Previous'
                marketPerformance.append(
                    {"teamName": currentPeriod['teamName'], "companyName": currentPeriod['companyName'],
                     "period": period, "periodNumber": niche_v['currentPeriod'],
                     "niche": niche_v['niche'], "shareRate": niche_v['shareRate'], "ranking": niche_v['ranking'],
                     "customerNum": niche_v['totalCustomers'], "sharedMarketValue": niche_v['sharedMarketValue']})

            result["marketPerformance"] = marketPerformance

            index_com = self.db.marketingshare_com.find(
                {"flag": "#comSum", "teamName": currentPeriod['teamName'], "companyName": currentPeriod['companyName'],
                 "currentPeriod": {"$in": [currentPeriod['currentPeriod'] - 1, currentPeriod['currentPeriod']]}}, {"_id":0})
            managementPerformance = []

            #rank first
            accountItem = ['AB010','AB011', 'AB012', 'AB013', 'AB014', 'AB015']
            for period in [currentPeriod['currentPeriod'] - 1, currentPeriod['currentPeriod']]:
                for acc in accountItem:
                    niche_index_ranking = self.db.marketingshare_com.find(
                        {"flag": "#comSum", "accountDescID": acc, "companyName": currentPeriod['companyName'],
                         "currentPeriod": period}).sort([("competenceIndex", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(niche_index_ranking):
                        self.db.marketingshare_com.update_one(
                            {"flag": "#comSum", "accountDescID": acc, "teamName": currentPeriod['teamName'],
                             "companyName": currentPeriod['companyName'],
                             "currentPeriod": period}, {"$set": {"competenceIndexRank": index + 1}})
                    niche_index_ranking2 = self.db.marketingshare_com.find(
                        {"flag": "#comSum", "accountDescID": acc, "companyName": currentPeriod['companyName'],
                         "currentPeriod": period}).sort([("stressIndex", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(niche_index_ranking2):
                        self.db.marketingshare_com.update_one(
                            {"flag": "#comSum", "accountDescID": acc, "teamName": currentPeriod['teamName'],
                             "companyName": currentPeriod['companyName'],
                             "currentPeriod": period}, {"$set": {"stressIndexRank": index + 1}})
                    niche_index_ranking3 = self.db.marketingshare_com.find(
                        {"flag": "#comSum", "accountDescID": acc, "companyName": currentPeriod['companyName'],
                         "currentPeriod": period}).sort([("adaptabilityIndex", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(niche_index_ranking3):
                        self.db.marketingshare_com.update_one(
                            {"flag": "#comSum", "accountDescID": acc, "teamName": currentPeriod['teamName'],
                             "companyName": currentPeriod['companyName'],
                             "currentPeriod": period}, {"$set": {"adaptabilityIndexRank": index + 1}})
                    niche_index_ranking4 = self.db.marketingshare_com.find(
                        {"flag": "#comSum", "accountDescID": acc, "companyName": currentPeriod['companyName'],
                         "currentPeriod": period}).sort([("legitimacyIndex", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(niche_index_ranking4):
                        self.db.marketingshare_com.update_one(
                            {"flag": "#comSum", "accountDescID": acc, "teamName": currentPeriod['teamName'],
                             "companyName": currentPeriod['companyName'],
                             "currentPeriod": period}, {"$set": {"legitimacyIndexRank": index + 1}})

            for index in index_com:
                #print index
                if index['currentPeriod'] == currentPeriod['currentPeriod']:
                    period = 'Current'
                else:
                    period = 'Previous'

                managementPerformance.append(
                    {"teamName": currentPeriod['teamName'], "companyName": currentPeriod['companyName'],
                     "period":period,"periodNumber":index['currentPeriod'],
                     "accountDescID": index['accountDescID'], "legitimacyIndex": index['legitimacyIndex'],
                     "stressIndex": index['stressIndex'], "competenceIndex": index['competenceIndex'],
                     "adaptabilityIndex": index['adaptabilityIndex'],"legitimacyIndexRank": index['legitimacyIndexRank'],
                     "stressIndexRank": index['stressIndexRank'], "competenceIndexRank": index['competenceIndexRank'],
                     "adaptabilityIndexRank": index['adaptabilityIndexRank'],"weight": index['weight']})

            result["managementPerformance"] = managementPerformance


            accounts_desc = ['AB031','AA200','BA100','CA041']
            financialPerformance = []

            for period in [currentPeriod['currentPeriod'] - 1, currentPeriod['currentPeriod']]:
                for acc in accounts_desc:
                    value = self.db.account_bookkeeping.aggregate(
                        [{"$match": {"period": period, "companyName": currentPeriod["companyName"],
                                                                           "accountDescID": acc}},
                         {"$group": {"_id": {"teamName": "$teamName",
                                                                                   "companyName": "$companyName",
                                                                                   "period": "$period",
                                                                                   "accountDescID": "$accountDescID"},
                                                                           "value": {"$sum": "$value"}}}
                         ])

                    self.db.account_ranking.update(
                        {'teamName': currentPeriod["teamName"], 'companyName': currentPeriod["companyName"],
                         'period': period}, {"$set": {acc: 0}}, upsert=True)
                    for v in value:
                        self.db.account_ranking.update(
                            {'teamName': v['_id']['teamName'], 'companyName': v['_id']['companyName'],
                             'period': v['_id']['period']}, {"$set": {acc: v['value']}})

                account_ranking = self.db.account_ranking.find(
                    {'period': period, "companyName": currentPeriod["companyName"]}, {"_id":0})
                for acc_r in account_ranking:
                    ROS = 0 if acc_r['AA200'] == 0 else acc_r['AB031']/ acc_r['AA200']
                    ROA = 0 if acc_r['AA200'] == 0 else acc_r['BA100'] / acc_r['AA200']
                    CA041_previdous = self.db.account_ranking.find_one(
                        {'period': period - 1, 'teamName': acc_r['teamName'], 'companyName': acc_r['companyName']},
                        {"_id": 0})

                    NOCG = (acc_r['CA041']-CA041_previdous['CA041']) if CA041_previdous != None else acc_r['CA041']

                    NOCG = 0 if NOCG < 0 else NOCG
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']}, {"$set": {'ROS': ROS,'ROA':ROA,"NOCG":NOCG}},
                                                   upsert=True)
                acc_ranking = self.db.account_ranking.find(
                    {'period': period, "companyName": currentPeriod["companyName"]},
                    {"_id": 0}).sort([("ROS", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                                   {"$set": {'ROSrank': index+1}})
                acc_ranking2 = self.db.account_ranking.find(
                    {'period': period, "companyName": currentPeriod["companyName"]},
                    {"_id": 0}).sort([("ROA", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking2):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                                   {"$set": {'ROArank': index + 1}})
                acc_ranking3 = self.db.account_ranking.find(
                    {'period': period, "companyName": currentPeriod["companyName"]},
                    {"_id": 0}).sort([("NOCG", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking3):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                                   {"$set": {'NOCGrank': index + 1}})

                acc_ranking_com = self.db.account_ranking.find_one(
                    {'period': period, "teamName": currentPeriod["teamName"],
                     "companyName": currentPeriod["companyName"]}, {"_id": 0})

                if period == currentPeriod['currentPeriod']:
                    period_alt = 'Current'
                else:
                    period_alt = 'Previous'
                financialPerformance.append({"period":period_alt,"periodNumber":period,'values':acc_ranking_com})

            result['financialPerformance'] = financialPerformance
            #print result
        return json.dumps(result)

        def queryDashboardData_TODO(self):
            username = request.args["username"]
            userInfo = EntitiesService().get_user_info(username)
            self.teamName = userInfo['teamInfo']['teamName']
            self.companyName = userInfo['companyInfo']['companyName']
            self.currentPeriod = userInfo['companyInfo']['currentPeriod']
            self.systemCurrentPeriod = SystemSetting().get_system_current_period()
            result = {}
            if self.companyName is not None:
                selectedNiches = self.db.niches_def.find(
                    {"period": {"$in": [self.systemCurrentPeriod - 1, self.systemCurrentPeriod]}})
                marketPerformance = []
                managementPerformance = []
                marketValue = {}
                for selectedNiche in selectedNiches:
                    if selectedNiche['period'] == self.systemCurrentPeriod:
                        period = 'Current'
                    else:
                        period = 'Previous'
                    if 'rankedCompany' in selectedNiche.keys():
                        for index, company in enumerate(selectedNiche['rankedCompany']):
                            marketPerformance.append(
                                {"teamName": company, "companyName": selectedNiche['company'], "period": period,
                                 "periodNumber": selectedNiche['period'], "niche": selectedNiche['niche'],
                                 "shareRate": selectedNiche['companyValue'][company]['shareRate'],
                                 "ranking": index + 1,
                                 "customerNum": selectedNiche['companyValue'][company]['customersTotal'],
                                 "sharedMarketValue": selectedNiche['companyValue'][company]['sharedMarketValue']})
                            if company not in marketValue.keys():
                                marketValue[company] = {'teamName': company}
                            if selectedNiche['period'] not in marketValue[company].keys():
                                marketValue[company][selectedNiche['period']] = 0

                            if selectedNiche['niche'] == 'B2B' and selectedNiche[
                                'period'] <= 4 and self.companyName == 'LegacyCo':
                                marketValue[company][selectedNiche['period']] += selectedNiche['companyValue'][company][
                                                                                     'sharedMarketValue'] * 0.7
                            elif selectedNiche['niche'] == 'B2C' and selectedNiche[
                                'period'] <= 4 and self.companyName == 'LegacyCo':
                                marketValue[company][selectedNiche['period']] += selectedNiche['companyValue'][company][
                                                                                     'sharedMarketValue'] * 0.3
                            else:
                                marketValue[company][selectedNiche['period']] += selectedNiche['companyValue'][company][
                                    'sharedMarketValue']

                                # #
                                # for indexName in ['competenceIndex','stressIndex','legitimacyIndex','adaptabilityIndex']:
                                #     indexValue = 1
                                #     for accDescID in selectedNiche['companyValue'][company][indexName].keys() :
                                #         if accDescID != 'subTotal':
                                #             indexDic =   {"teamName": company, "companyName": selectedNiche['company'],
                                #                                     "period":period,"periodNumber":selectedNiche['period'],
                                #                                     "legitimacyIndex": selectedNiche['companyValue'][company]['legitimacyIndex'],
                                #                                     "stressIndex": selectedNiche['companyValue'][company]['stressIndex'],
                                #                                     "competenceIndex": selectedNiche['companyValue'][company]['competenceIndex'],
                                #                                     "adaptabilityIndex": selectedNiche['companyValue'][company]['adaptabilityIndex'],
                                #                                     "legitimacyIndexRank": selectedNiche['rankedLegitimacyIndex'],
                                #                                     "stressIndexRank": selectedNiche['rankedStressIndex'],
                                #                                     "competenceIndexRank": selectedNiche['rankedCompetenceIndex'],
                                #                                     "adaptabilityIndexRank": selectedNiche['rankedAdaptabilityIndex']}
                                #
                                # #
                                # #
                                # managementPerformance.append(result)

                result["marketValue"] = marketValue
                result["marketPerformance"] = marketPerformance
                result["managementPerformance"] = managementPerformance

                # index_com = self.db.marketingshare_com.find(
                #     {"flag": "#comSum", "teamName": self.teamName, "companyName": self.companyName,
                #      "currentPeriod": {"$in": [self.currentPeriod - 1, self.currentPeriod]}}, {"_id": 0})
                # managementPerformance = []

                # #rank first
                # accountItem = ['AB010','AB011', 'AB012', 'AB013', 'AB014', 'AB015']
                # for period in [self.currentPeriod - 1, self.currentPeriod]:
                #     for acc in accountItem:
                #         niche_index_ranking = self.db.marketingshare_com.find(
                #             {"flag": "#comSum", "accountDescID": acc, "companyName": self.companyName,
                #              "currentPeriod": period}).sort([("competenceIndex", pymongo.ASCENDING)])
                #         for index, acc_rank in enumerate(niche_index_ranking):
                #             self.db.marketingshare_com.update_one(
                #                 {"flag": "#comSum", "accountDescID": acc, "teamName": self.teamName,
                #                  "companyName": self.companyName,
                #                  "currentPeriod": period}, {"$set": {"competenceIndexRank": index + 1}})
                #         niche_index_ranking2 = self.db.marketingshare_com.find(
                #             {"flag": "#comSum", "accountDescID": acc, "companyName": self.companyName,
                #              "currentPeriod": period}).sort([("stressIndex", pymongo.ASCENDING)])
                #         for index, acc_rank in enumerate(niche_index_ranking2):
                #             self.db.marketingshare_com.update_one(
                #                 {"flag": "#comSum", "accountDescID": acc, "teamName": self.teamName,
                #                  "companyName": self.companyName,
                #                  "currentPeriod": period}, {"$set": {"stressIndexRank": index + 1}})
                #         niche_index_ranking3 = self.db.marketingshare_com.find(
                #             {"flag": "#comSum", "accountDescID": acc, "companyName": self.companyName,
                #              "currentPeriod": period}).sort([("adaptabilityIndex", pymongo.ASCENDING)])
                #         for index, acc_rank in enumerate(niche_index_ranking3):
                #             self.db.marketingshare_com.update_one(
                #                 {"flag": "#comSum", "accountDescID": acc, "teamName": self.teamName,
                #                  "companyName": self.companyName,
                #                  "currentPeriod": period}, {"$set": {"adaptabilityIndexRank": index + 1}})
                #         niche_index_ranking4 = self.db.marketingshare_com.find(
                #             {"flag": "#comSum", "accountDescID": acc, "companyName": self.companyName,
                #              "currentPeriod": period}).sort([("legitimacyIndex", pymongo.ASCENDING)])
                #         for index, acc_rank in enumerate(niche_index_ranking4):
                #             self.db.marketingshare_com.update_one(
                #                 {"flag": "#comSum", "accountDescID": acc, "teamName": self.teamName,
                #                  "companyName": self.companyName,
                #                  "currentPeriod": period}, {"$set": {"legitimacyIndexRank": index + 1}})
                #
                # for index in index_com:
                #     #print index
                #     if index['currentPeriod'] == self.currentPeriod:
                #         period = 'Current'
                #     else:
                #         period = 'Previous'
                #
                #     managementPerformance.append(
                #         {"teamName": self.teamName, "companyName": self.companyName,
                #          "period":period,"periodNumber":index['currentPeriod'],
                #          "accountDescID": index['accountDescID'], "legitimacyIndex": index['legitimacyIndex'],
                #          "stressIndex": index['stressIndex'], "competenceIndex": index['competenceIndex'],
                #          "adaptabilityIndex": index['adaptabilityIndex'],"legitimacyIndexRank": index['legitimacyIndexRank'],
                #          "stressIndexRank": index['stressIndexRank'], "competenceIndexRank": index['competenceIndexRank'],
                #          "adaptabilityIndexRank": index['adaptabilityIndexRank'],"weight": index['weight']})
                #
                # result["managementPerformance"] = managementPerformance


                accounts_desc = ['AB031', 'AA200', 'BA100', 'CA041']
                financialPerformance = []

                for period in [self.currentPeriod - 1, self.currentPeriod]:
                    for acc in accounts_desc:
                        value = self.db.account_bookkeeping.aggregate(
                            [{"$match": {"period": period, "companyName": self.companyName,
                                         "accountDescID": acc}},
                             {"$group": {"_id": {"teamName": "$teamName",
                                                 "companyName": "$companyName",
                                                 "period": "$period",
                                                 "accountDescID": "$accountDescID"},
                                         "value": {"$sum": "$value"}}}
                             ])

                        self.db.account_ranking.update(
                            {'teamName': self.teamName, 'companyName': self.companyName, 'period': period},
                            {"$set": {acc: 0}}, upsert=True)
                        for v in value:
                            self.db.account_ranking.update(
                                {'teamName': v['_id']['teamName'], 'companyName': v['_id']['companyName'],
                                 'period': v['_id']['period']}, {"$set": {acc: v['value']}})

                    account_ranking = self.db.account_ranking.find({'period': period, "companyName": self.companyName},
                                                                   {"_id": 0})
                    for acc_r in account_ranking:
                        ROS = 0 if acc_r['AA200'] == 0 else acc_r['AB031'] / acc_r['AA200']
                        ROA = 0 if acc_r['AA200'] == 0 else acc_r['BA100'] / acc_r['AA200']
                        CA041_previdous = self.db.account_ranking.find_one(
                            {'period': period - 1, 'teamName': acc_r['teamName'],
                             'companyName': acc_r['companyName']}, {"_id": 0})

                        NOCG = (acc_r['CA041'] - CA041_previdous['CA041']) if CA041_previdous != None else acc_r[
                            'CA041']

                        NOCG = 0 if NOCG < 0 else NOCG
                        self.db.account_ranking.update(
                            {'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                             'period': acc_r['period']}, {"$set": {'ROS': ROS, 'ROA': ROA, "NOCG": NOCG}},
                            upsert=True)
                    acc_ranking = self.db.account_ranking.find({'period': period, "companyName": self.companyName},
                                                               {"_id": 0}).sort([("ROS", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(acc_ranking):
                        self.db.account_ranking.update(
                            {'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                             'period': acc_r['period']},
                            {"$set": {'ROSrank': index + 1}})
                    acc_ranking2 = self.db.account_ranking.find({'period': period, "companyName": self.companyName},
                                                                {"_id": 0}).sort([("ROA", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(acc_ranking2):
                        self.db.account_ranking.update(
                            {'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                             'period': acc_r['period']},
                            {"$set": {'ROArank': index + 1}})
                    acc_ranking3 = self.db.account_ranking.find({'period': period, "companyName": self.companyName},
                                                                {"_id": 0}).sort([("NOCG", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(acc_ranking3):
                        self.db.account_ranking.update(
                            {'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                             'period': acc_r['period']},
                            {"$set": {'NOCGrank': index + 1}})

                    acc_ranking_com = self.db.account_ranking.find_one(
                        {'period': period, "teamName": self.teamName, "companyName": self.companyName}, {"_id": 0})

                    if period == self.currentPeriod:
                        period_alt = 'Current'
                    else:
                        period_alt = 'Previous'
                    financialPerformance.append(
                        {"period": period_alt, "periodNumber": period, 'values': acc_ranking_com})

                result['financialPerformance'] = financialPerformance
                # result['Values'] = self.queryCurrentMarketData(self.teamName,self.companyName,self.currentPeriod,self.systemCurrentPeriod)
                # print result
            return json.dumps(result)

        def queryCurrentMarketData_TODO(self, teamName, companyName, currentPeriod, systemCurrentPeriod):
            # username = request.args["username"]
            # userInfo = EntitiesService().get_user_info(username)

            self.teamName = teamName
            self.companyName = companyName
            self.currentPeriod = currentPeriod
            self.systemCurrentPeriod = systemCurrentPeriod

            # currentPeriod = models.getCurrentPeriod(username)
            result = {}
            if self.companyName:
                niches = self.db.niches_def.find({"companyName": self.companyName})
                marketValue = {}
                managementValue = {}
                for niche in niches:
                    if len(niche['selectedByCompany']) > 0 and 'companyValue' in niche.keys():
                        for team in niche['companyValue'].keys():
                            if team not in marketValue.keys():
                                marketValue[team] = {'teamName': team}
                                managementValue[team] = {'teamName': team}
                            if niche['period'] not in marketValue[team].keys():
                                marketValue[team][niche['period']] = 0
                                managementValue[team][niche['period']] = 1

                            if niche['niche'] == 'B2B' and niche[
                                'currentPeriod'] <= 4 and self.companyName == 'LegacyCo':
                                marketValue[team][niche['period']] += niche['companyValue']['sharedMarketValue'] * 0.7
                            elif niche['niche'] == 'B2C' and niche[
                                'currentPeriod'] <= 4 and self.companyName == 'LegacyCo':
                                marketValue[team][niche['period']] += niche['companyValue']['sharedMarketValue'] * 0.3
                            else:
                                marketValue[team][niche['period']] += niche['companyValue']['sharedMarketValue']

                            managementValue[team][niche['period']] = managementValue[team][niche['period']] \
                                                                     * niche['competenceIndex'] * 100 * 0.5 * \
                                                                     niche['stressIndex'] * 100 * 0.3 * \
                                                                     niche['adaptabilityIndex'] * 100 * 0.2

                result["marketValue"] = marketValue
                result["managementValue"] = managementValue

                financialValue = {}

                acc_ranking_com = self.db.account_ranking.find({"companyName": self.companyName}, {"_id": 0})

                for acc_com in acc_ranking_com:
                    # for item in ['ROA','ROS','NOCG']:
                    #     if item not in financialPerformance.keys():
                    #         financialPerformance[item] = {'item': item}
                    #     if acc_com['teamName'] not in financialPerformance[item].keys():
                    #         financialPerformance[item][acc_com['teamName']] = []
                    #
                    #         financialPerformance[item][acc_com['teamName']].append(
                    #             {'x': acc_com['period'], "y": acc_com[item]})

                    # great value

                    if acc_com['teamName'] not in financialValue.keys():
                        financialValue[acc_com['teamName']] = {'teamName': acc_com['teamName']}
                    if acc_com['period'] not in financialValue[acc_com['teamName']].keys():
                        financialValue[acc_com['teamName']][acc_com['period']] = {"NOCG": acc_com['NOCG'],
                                                                                  "EBITDA": acc_com['AB031']}
                result['financialValue'] = financialValue

            return result

    def queryKPIData(self):

        result = {}
        if len(request.args.keys()) > 0:

            username = request.args["username"]
            print username
            userInfo = EntitiesService().get_user_info(username)
            systemCurrentPeriod = SystemSetting().get_system_current_period()

            print userInfo.keys()
            if 'teamInfo' in userInfo.keys():
                result["hiredEmployees"] = list(
                    self.db.employees_com.find({"status": "Hired", "HiredBy.teamName": userInfo['teamInfo']['teamName']
                                                   , "HiredBy.companyName": userInfo['companyInfo']['companyName']
                                                   ,
                                                "HiredBy.period": {"$lte": userInfo['companyInfo']['currentPeriod']}},
                                               {"_id": 0}))
                result["workforce"] = list(
                    self.db.workforce_com.find({"teamName": userInfo['teamInfo']['teamName']
                                                   , "companyName": userInfo['companyInfo']['companyName']
                                                   , "period": userInfo['companyInfo']['currentPeriod']},
                                               {"_id": 0}))
                result["forecast"] = list(
                    self.db.forecast_com.find({"teamName": userInfo['teamInfo']['teamName']
                                                  , "companyName": userInfo['companyInfo']['companyName']},
                                              {"_id": 0}))
                result["actions"] = list(
                    self.db.actions_com.find({"teamName": userInfo['teamInfo']['teamName']
                                                 , "companyName": userInfo['companyInfo']['companyName']
                                                 , "currentPeriod": userInfo['companyInfo']['currentPeriod']},
                                             {"_id": 0}))
                result["resources"] = list(
                    self.db.resources_com.find({"teamName": userInfo['teamInfo']['teamName']
                                                   , "companyName": userInfo['companyInfo']['companyName']
                                                   , "currentPeriod": userInfo['companyInfo']['currentPeriod']},
                                               {"_id": 0}))
                result["budget"] = list(
                    self.db.budget_com.find({"teamName": userInfo['teamInfo']['teamName']
                                                , "companyName": userInfo['companyInfo']['companyName']
                                                , "period": userInfo['companyInfo']['currentPeriod']},
                                            {"_id": 0}))
        return json.dumps(result)


class InstructionService():
    def __init__(self):
        self.db = leadingdb

    def instruction(self):
        if request.method == 'POST':
            f = json.loads(request.data)
            # pprint(f.keys())
            if f:
                result = models.InstructionModel().save(f[u'file'])

        else:
            result = models.InstructionModel().get_list()

        return json.dumps(result)

    def deleteInstruction(self):

        if request.method == 'POST':
            f = json.loads(request.data)
            # pprint(f[u'file'])
            result = models.InstructionModel().delete(f[u'file'])
        else:
            result = models.InstructionModel().get_list()
        return json.dumps(result)
