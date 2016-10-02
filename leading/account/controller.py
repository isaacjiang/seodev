import models
from flask import json, request
from datetime import datetime


class GeneralService():
    def __init__(self):
        self.model = models

    def verifyIP(self):
        ipAddress = request.args['ipAddress']
        oid0 = '.1.3.6.1.4.1.6827.500.213.3.1.1.1.1'  # ipxportcount
        oid1 = '.1.3.6.1.4.1.6827.500.213.4.1.1.3.1'  # ipxSystemQuartzServerPort
        oid2 = '.1.3.6.1.4.1.6827.500.213.4.1.1.8.1'  # productName
        oid3 = '.1.3.6.1.4.1.6827.500.213.4.10.1.2.1.1'  # IPAddress
        # oid4 = '.1.3.6.1.4.1.6827.500.213.4.10.1.2.2.1'  # ipAddress 2s
        oid5 = '.1.3.6.1.4.1.6827.500.213.4.10.1.5.1.1'  # networkGateway

        from mvrtRealtime.devices import models as modelsdaily
        ipxportcount = modelsdaily.TrafficTracesModel(ipAddress).queryIPXbyOID(oid0)
        ipxSystemQuartzServerPort = modelsdaily.TrafficTracesModel(ipAddress).queryIPXbyOID(oid1)
        productName = modelsdaily.TrafficTracesModel(ipAddress).queryIPXbyOID(oid2)
        IPAddress = modelsdaily.TrafficTracesModel(ipAddress).queryIPXbyOID(oid3)
        networkGateway = modelsdaily.TrafficTracesModel(ipAddress).queryIPXbyOID(oid5)
        if IPAddress != None:
            result = {
                "ipxportcount": str(ipxportcount),
                "ipxSystemQuartzServerPort": str(ipxSystemQuartzServerPort),
                "productName": str(productName),
                "verifiedIPAddress": str(IPAddress),
                "networkGateway": str(networkGateway)
            }
        else:
            result = {"message": "No SNMP response received before timeout."}
        return json.dumps(result)