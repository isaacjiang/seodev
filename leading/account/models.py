from pymongo import TEXT, ASCENDING, DESCENDING, IndexModel
from leading.config import leadingdb
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
    def __init__(self, teamName, comapanyName, period):
        self.data = leadingdb.account_bookkeeping
        self.teamName = teamName
        self.companyName = comapanyName
        self.period = period

    def bookkeeping(self, accountDescID, value, type=None, comments=None):
        if type == 'Detail':
            result = self.data.insert_one(
                {"teamName": self.teamName, "companyName": self.companyName, "period": self.period,
                 "accountDescID": accountDescID,
                 "type": type, "value": value, "comments": comments})
        else:
            result = self.data.update_one(
                {"teamName": self.teamName, "companyName": self.companyName, "period": self.period,
                 "accountDescID": accountDescID},
                {"$set": {"value": value, "type": type, "comments": comments}}, upsert=True)
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
        self.bookkeeping(destItem, value=value * rate, type='SubSum', comments='sum' + destItem)

    def subset_minus(self, itemA, itemB, destItem, rate):
        valueA = self.get_item_sum(itemA)
        valueB = self.get_item_sum(itemB)
        self.bookkeeping(destItem, value=(valueA - valueB) * rate, type='Minus', comments='sum' + destItem)

    def trans_item(self, sourceItem, destItem, destPeriod, rate=None):
        value = Account(self.teamName, self.companyName, destPeriod - 1).get_item_sum(sourceItem)
        if rate is None:
            rate = 1
        Account(self.teamName, self.companyName, destPeriod).bookkeeping(destItem, value=value * rate, type='Trans',
                                                                         comments='trans' + destItem)

    def sum(self):
        # 1-14
        self.subset_plus(["AA011", "AA012"], "AA021", 1)
        self.subset_plus(["AA011"], "AA025", 0.25)
        self.subset_plus(["AA012"], "AA026", 0.25)
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
        self.subset_plus(["AB011", "AB012", "AB013", "AB014", "AB015", "AB016", "AB017"], "AB021", 1)
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
        self.subset_minus("BA061", "BA062", "BA061", 1)

        self.subset_plus(["AA025"], "BB011", 0.1)
        self.subset_plus(["AA026"], "BB012", 0.1)
        self.subset_plus(["AA141"], "BB013", 0.1)
        self.subset_plus(["AA011"], "BB014", 0.1)
        self.subset_plus(["AA012"], "BB015", 0.1)
        self.subset_plus(["AA041"], "BB016", 0.1)
        self.subset_plus(["BB011", "BB012", "BB013", "BB014", "BB015", "BB016"], "BB021", 1)

        self.trans_item(["BB031", "BB032"], "BB031", self.period + 1)
        self.trans_item("BB050", "BB041", self.period + 1)
        self.subset_plus(["BB041,""BB042"], "BB050", 1)
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
        self.subset_plus(['BA062'], "CA071", -1)
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
        self.trans_item("BA043", "BA043", self.period)
        self.subset_plus(["AB061", "BA043"], "BA043", 1)
        self.subset_minus("BA042", "BA043", "BA051", 1)
        self.subset_minus("AB051", "AB061", "AB071", 1)
        self.subset_plus(["BA021", 'BA051', 'BA063'], "BA100", 1)

        self.trans_item("BB113", "BB113", self.period)
        self.subset_plus(["AB100", "BB113"], "BB113", 1)
        self.subset_plus(["BB111", "BB112", 'BB113'], "BB121", 1)
        self.subset_plus(["BB021", "BB060", 'BB121'], "BB131", 1)


class Index():
    def __init__(self, teamName, comapanyName, period):
        self.data = leadingdb.index_bookkeeping
        self.teamName = teamName
        self.companyName = comapanyName
        self.period = period

    def bookkeeping(self, indexName, category, value, type=None, comments=None):
        if type == 'Detail':
            result = self.data.insert_one(
                {"teamName": self.teamName, "companyName": self.companyName, "period": self.period,
                 "indexName": indexName, "category": category,
                 "type": type, "value": value, "comments": comments})
        else:
            result = self.data.update_one(
                {"teamName": self.teamName, "companyName": self.companyName, "period": self.period,
                 "indexName": indexName, "category": category},
                {"$set": {"value": value, "type": type, "comments": comments}}, upsert=True)
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
