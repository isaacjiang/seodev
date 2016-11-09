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


    def queryDashboardData(self):
        username = request.args["username"]
        # print username
        userInfo = EntitiesService().get_user_info(username)

        self.teamName = userInfo['teamInfo']['teamName']
        self.companyName = userInfo['companyInfo']['companyName']
        self.currentPeriod = userInfo['companyInfo']['currentPeriod']
        self.systemCurrentPeriod = SystemSetting().get_system_current_period()
        #models.PerformanceModel().marketingShare(self.teamName, self.companyName, '0' + str(self.currentPeriod) + '100')
        result = {}
        if self.companyName is not None:
            # niches = ['B2B', 'B2C', 'Education', 'Government', 'Entertainment']
            #
            # for period in [self.currentPeriod - 1, self.currentPeriod]:
            #     #rank
            #     for niche in niches:
            #         niche_marketingshare_ranking = self.db.marketingshare_niche.find(
            #             {"flag": "#nicheSum", "niche": niche, "companyName": self.companyName,
            #              "currentPeriod": period}).sort([("shareRate", pymongo.ASCENDING)])
            #         for index,niche_rank in enumerate(niche_marketingshare_ranking):
            #             self.db.marketingshare_niche.update_one(
            #                 {"flag": "#nicheSum", "niche": niche, "teamName": self.teamName,
            #                  "companyName": self.companyName,
            #                  "currentPeriod": period},{"$set":{"ranking":index+1}})
            #
            # niche_marketingshare = self.db.marketingshare_niche.find(
            #     {"flag": "#nicheSum", "teamName": self.teamName, "companyName": self.companyName,
            #      "currentPeriod": {"$in": [self.currentPeriod - 1, self.currentPeriod]}})
            selectedNiches = self.db.niches_def.find(
                {"period": {"$in": [self.systemCurrentPeriod - 1, self.systemCurrentPeriod]}})
            marketPerformance = []
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

            result["marketPerformance"] = marketPerformance

            index_com = self.db.marketingshare_com.find(
                {"flag": "#comSum", "teamName": self.teamName, "companyName": self.companyName,
                 "currentPeriod": {"$in": [self.currentPeriod - 1, self.currentPeriod]}}, {"_id": 0})
            managementPerformance = []

            #rank first
            accountItem = ['AB010','AB011', 'AB012', 'AB013', 'AB014', 'AB015']
            for period in [self.currentPeriod - 1, self.currentPeriod]:
                for acc in accountItem:
                    niche_index_ranking = self.db.marketingshare_com.find(
                        {"flag": "#comSum", "accountDescID": acc, "companyName": self.companyName,
                         "currentPeriod": period}).sort([("competenceIndex", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(niche_index_ranking):
                        self.db.marketingshare_com.update_one(
                            {"flag": "#comSum", "accountDescID": acc, "teamName": self.teamName,
                             "companyName": self.companyName,
                             "currentPeriod": period}, {"$set": {"competenceIndexRank": index + 1}})
                    niche_index_ranking2 = self.db.marketingshare_com.find(
                        {"flag": "#comSum", "accountDescID": acc, "companyName": self.companyName,
                         "currentPeriod": period}).sort([("stressIndex", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(niche_index_ranking2):
                        self.db.marketingshare_com.update_one(
                            {"flag": "#comSum", "accountDescID": acc, "teamName": self.teamName,
                             "companyName": self.companyName,
                             "currentPeriod": period}, {"$set": {"stressIndexRank": index + 1}})
                    niche_index_ranking3 = self.db.marketingshare_com.find(
                        {"flag": "#comSum", "accountDescID": acc, "companyName": self.companyName,
                         "currentPeriod": period}).sort([("adaptabilityIndex", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(niche_index_ranking3):
                        self.db.marketingshare_com.update_one(
                            {"flag": "#comSum", "accountDescID": acc, "teamName": self.teamName,
                             "companyName": self.companyName,
                             "currentPeriod": period}, {"$set": {"adaptabilityIndexRank": index + 1}})
                    niche_index_ranking4 = self.db.marketingshare_com.find(
                        {"flag": "#comSum", "accountDescID": acc, "companyName": self.companyName,
                         "currentPeriod": period}).sort([("legitimacyIndex", pymongo.ASCENDING)])
                    for index, acc_rank in enumerate(niche_index_ranking4):
                        self.db.marketingshare_com.update_one(
                            {"flag": "#comSum", "accountDescID": acc, "teamName": self.teamName,
                             "companyName": self.companyName,
                             "currentPeriod": period}, {"$set": {"legitimacyIndexRank": index + 1}})

            for index in index_com:
                #print index
                if index['currentPeriod'] == self.currentPeriod:
                    period = 'Current'
                else:
                    period = 'Previous'

                managementPerformance.append(
                    {"teamName": self.teamName, "companyName": self.companyName,
                     "period":period,"periodNumber":index['currentPeriod'],
                     "accountDescID": index['accountDescID'], "legitimacyIndex": index['legitimacyIndex'],
                     "stressIndex": index['stressIndex'], "competenceIndex": index['competenceIndex'],
                     "adaptabilityIndex": index['adaptabilityIndex'],"legitimacyIndexRank": index['legitimacyIndexRank'],
                     "stressIndexRank": index['stressIndexRank'], "competenceIndexRank": index['competenceIndexRank'],
                     "adaptabilityIndexRank": index['adaptabilityIndexRank'],"weight": index['weight']})

            result["managementPerformance"] = managementPerformance


            accounts_desc = ['AB031','AA200','BA100','CA041']
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
                    ROS = 0 if acc_r['AA200'] == 0 else acc_r['AB031']/ acc_r['AA200']
                    ROA = 0 if acc_r['AA200'] == 0 else acc_r['BA100'] / acc_r['AA200']
                    CA041_previdous = self.db.account_ranking.find_one(
                        {'period': period - 1, 'teamName': acc_r['teamName'],
                         'companyName': acc_r['companyName']}, {"_id": 0})

                    NOCG = (acc_r['CA041']-CA041_previdous['CA041']) if CA041_previdous != None else acc_r['CA041']

                    NOCG = 0 if NOCG < 0 else NOCG
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']}, {"$set": {'ROS': ROS,'ROA':ROA,"NOCG":NOCG}},
                                               upsert=True)
                acc_ranking = self.db.account_ranking.find({'period': period, "companyName": self.companyName},
                                                           {"_id": 0}).sort([("ROS", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                               {"$set": {'ROSrank': index+1}})
                acc_ranking2 = self.db.account_ranking.find({'period': period, "companyName": self.companyName},
                                                            {"_id": 0}).sort([("ROA", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking2):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                               {"$set": {'ROArank': index + 1}})
                acc_ranking3 = self.db.account_ranking.find({'period': period, "companyName": self.companyName},
                                                            {"_id": 0}).sort([("NOCG", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking3):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                               {"$set": {'NOCGrank': index + 1}})

                acc_ranking_com = self.db.account_ranking.find_one(
                    {'period': period, "teamName": self.teamName, "companyName": self.companyName}, {"_id": 0})

                if period == self.currentPeriod:
                    period_alt = 'Current'
                else:
                    period_alt = 'Previous'
                financialPerformance.append({"period":period_alt,"periodNumber":period,'values':acc_ranking_com})

            result['financialPerformance'] = financialPerformance
            #print result
        return json.dumps(result)