import models
from flask import json, request
from leading.config import leadingdb
from datetime import datetime
import pymongo


class PerformanceService():
    def __init__(self):
        self.db = leadingdb
        # self.teamName =  teamName
        # self.companyName = companyName
        # self.period = period


    def queryDashboardData(self):
        username = request.args["username"]
        print username
        currentPeriod = models.getCurrentPeriod(username)
        models.marketingShare(currentPeriod['teamName'], currentPeriod['companyName'],'0'+ str(currentPeriod['currentPeriod'])+'100')
        result = {}
        if currentPeriod is not None and "companyName" in currentPeriod.keys():
            niches = ['B2B', 'B2C', 'Education', 'Government', 'Entertainment']

            for period in [currentPeriod['currentPeriod'] - 1, currentPeriod['currentPeriod']]:
                #rank
                for niche in niches:

                    niche_marketingshare_ranking = self.db.marketingshare_niche.find(
                        {"flag": "#nicheSum", "niche":niche,"companyName": currentPeriod['companyName'],"currentPeriod":period}).sort([("shareRate", pymongo.ASCENDING)])
                    for index,niche_rank in enumerate(niche_marketingshare_ranking):
                        self.db.marketingshare_niche.update_one(
                            {"flag": "#nicheSum", "niche": niche, "teamName":currentPeriod['teamName'],"companyName": currentPeriod['companyName'],
                             "currentPeriod": period},{"$set":{"ranking":index+1}})

            niche_marketingshare = self.db.marketingshare_niche.find({"flag":"#nicheSum","teamName":currentPeriod['teamName'],"companyName":currentPeriod['companyName'],
                                                                  "currentPeriod":{"$in":[currentPeriod['currentPeriod']-1,currentPeriod['currentPeriod']]}})
            marketPerformance = []
            for niche_v in niche_marketingshare:
                # sprint niche_v
                if niche_v['currentPeriod'] == currentPeriod['currentPeriod']:
                    period = 'Current'
                else:
                    period = 'Previous'
                marketPerformance.append({"teamName":currentPeriod['teamName'],"companyName":currentPeriod['companyName'],"period":period,"periodNumber":niche_v['currentPeriod'],
                                          "niche":niche_v['niche'],"shareRate":niche_v['shareRate'],"ranking":niche_v['ranking'],"customerNum":niche_v['totalCustomers'],"sharedMarketValue":niche_v['sharedMarketValue']})

            result["marketPerformance"] = marketPerformance

            index_com = self.db.marketingshare_com.find({"flag":"#comSum","teamName": currentPeriod['teamName'], "companyName": currentPeriod['companyName'],
                                                     "currentPeriod": {"$in":[currentPeriod['currentPeriod']-1,currentPeriod['currentPeriod']]}},{"_id":0})
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

            for period in [currentPeriod['currentPeriod']-1, currentPeriod['currentPeriod']]:
                for acc in accounts_desc:
                    value = self.db.account_bookkeeping.aggregate([{"$match": {"period": period,"companyName":currentPeriod["companyName"],
                                                                           "accountDescID": acc}},
                                                               {"$group": {"_id": {"teamName": "$teamName",
                                                                                   "companyName": "$companyName",
                                                                                   "period": "$period",
                                                                                   "accountDescID": "$accountDescID"},
                                                                           "value": {"$sum": "$value"}}}
                                                               ])

                    self.db.account_ranking.update({'teamName':currentPeriod["teamName"], 'companyName': currentPeriod["companyName"],'period': period}, {"$set": {acc: 0}}, upsert=True)
                    for v in value:
                        self.db.account_ranking.update({'teamName': v['_id']['teamName'], 'companyName': v['_id']['companyName'],'period': v['_id']['period']},{"$set": {acc: v['value']}})


                account_ranking = self.db.account_ranking.find({'period':period,"companyName":currentPeriod["companyName"]},{"_id":0})
                for acc_r in account_ranking:
                    ROS = 0 if acc_r['AA200'] == 0 else acc_r['AB031']/ acc_r['AA200']
                    ROA = 0 if acc_r['AA200'] == 0 else acc_r['BA100'] / acc_r['AA200']
                    CA041_previdous = self.db.account_ranking.find_one({'period': period-1, 'teamName': acc_r['teamName'], 'companyName': acc_r['companyName']},{"_id": 0})

                    NOCG = (acc_r['CA041']-CA041_previdous['CA041']) if CA041_previdous != None else acc_r['CA041']

                    NOCG = 0 if NOCG < 0 else NOCG
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']}, {"$set": {'ROS': ROS,'ROA':ROA,"NOCG":NOCG}},
                                               upsert=True)
                acc_ranking = self.db.account_ranking.find({'period': period, "companyName": currentPeriod["companyName"]},
                                                       {"_id": 0}).sort([("ROS", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                               {"$set": {'ROSrank': index+1}})
                acc_ranking2 = self.db.account_ranking.find({'period': period, "companyName": currentPeriod["companyName"]},
                                                        {"_id": 0}).sort([("ROA", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking2):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                               {"$set": {'ROArank': index + 1}})
                acc_ranking3 = self.db.account_ranking.find({'period': period, "companyName": currentPeriod["companyName"]},
                                                        {"_id": 0}).sort([("NOCG", pymongo.ASCENDING)])
                for index, acc_rank in enumerate(acc_ranking3):
                    self.db.account_ranking.update({'teamName': acc_r['teamName'], 'companyName': acc_r['companyName'],
                                                'period': acc_r['period']},
                                               {"$set": {'NOCGrank': index + 1}})

                acc_ranking_com = self.db.account_ranking.find_one({'period': period, "teamName": currentPeriod["teamName"],"companyName": currentPeriod["companyName"]},{"_id": 0})



                if period == currentPeriod['currentPeriod']:
                    period_alt = 'Current'
                else:
                    period_alt = 'Previous'
                financialPerformance.append({"period":period_alt,"periodNumber":period,'values':acc_ranking_com})

            result['financialPerformance'] = financialPerformance
            #print result
        return json.dumps(result)