import time

import gridfs
from bson.objectid import ObjectId
from leading.config import leadingfiledb
from datetime import datetime
from flask import make_response, request, json
import importlib

def fileDownload():
    # print request.method
    if request.method == "GET":
        filename = request.args['filename']
        content_type = request.args['ctype']
        objectID = request.args['id']
        # print req
        gfs = gridfs.GridFS(leadingfiledb)
        if len(request.args) > 0:
            objectID = objectID
            # print objectID
            file = gfs.get(ObjectId(objectID)).read()
            response = make_response(file)
            response.headers['Content-Type'] = content_type
            response.headers['filename'] = filename
        else:
            response = 'Error'
        # print response
        return response

def fileUpload():
    if request.method == "POST":
        output = []
        gfs = gridfs.GridFS(leadingfiledb)
        if len(request.files) > 0:
            for i in range(0, len(request.files)):
                # print request.files['files[' + str(i) + ']']
                objectID = gfs.put(request.files['files[' + str(i) + ']'].read(),
                                   content_type=request.files['files[' + str(i) + ']'].content_type,
                                   filename=request.files['files[' + str(i) + ']'].filename)
                gridfsOut = gfs.get(objectID)  # .length,gfs.get(objectID).upload_date
                output.append({"objectID": str(objectID),
                               "content_type": gridfsOut.content_type,
                               "filename": gridfsOut.filename,
                               "length": gridfsOut.length,
                               "upload_date": gridfsOut.upload_date.strftime('%Y-%m-%d %H:%M:%S')
                               })
        return json.dumps(output)


# def queryAllFiles():
#     results = []
#     devicesList = DeviceModel().get_all()
#     for devices in devicesList:
#         if devices['properties']['deviceType'] != 'PTN':
#             result = {"id": devices['_id'], "value": devices['deviceName'], "size": 0, "open": True,
#                       "type": "folder", "date": dateConverter(devices['updateDate']), "webix_files": 1}
#
#             data = []
#             if len(devices['filenames']) > 0:
#                 for file in devices['filenames']:
#                     data.append({"id": file['objectID'], "value": file['filename'], "size": file['length'],
#                                  "type": file['content_type'], "date": dateConverter(file['upload_date'])})
#             result['data'] = data
#             results.append(result)
#     return json.dumps(
#         [{"id": "FilesDrive", "value": 'Files Drive', "size": 0, "type": "folder", "open": True, "data": results}])
class FileService():
    def __init__(self):
        self.model_nodes = importlib.import_module("mvrtREST.nodes.models")
        self.model_devices = importlib.import_module("mvrtREST.devices.models")
        self.utils = importlib.import_module("mvrtREST.utils")
        self.NodeModel = self.model_nodes.NodeModel
        self.DeviceModel = self.model_devices.DeviceModel

    def queryAllFiles(self):
        results = []
        nodes = self.NodeModel().get_all()
        for node in nodes:
            folder = {"id": node['_id'], "value": node['nodeName'], "size": 0, "open": False,
                      "type": "folder", "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "webix_files": 1}
            folder_AG = {"id": node['_id'] + 'ag', "value": 'Aggregators', "size": 0,
                         "type": "folder", "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "data": []}
            folder_DF = {"id": node['_id'] + 'df', "value": 'Dark Fiber', "size": 0,
                         "type": "folder", "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "data": []}
            folder_FP = {"id": node['_id'] + 'fp', "value": 'Flight Pack', "size": 0,
                         "type": "folder", "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'), "data": []}
            folder['data'] = [folder_AG, folder_DF, folder_FP]

            if 'deviceList' in node.keys():
                for dev in node['deviceList']:
                    print dev, node['_id']
                    device = self.DeviceModel(dev).get()
                    if device['properties']['deviceType'] != 'PTN':
                        device = self.DeviceModel(dev).get()
                        folder_Devie = {"id": device['_id'], "value": device['deviceName'], "size": 0,
                           "type": "folder", "date": self.utils.dateConverter(device['updateDate'])}
                        data = []
                        if len(device['filenames']) > 0:
                            for file in device['filenames']:
                                data.append({"id": file['objectID'], "value": file['filename'], "size": file['length'],
                                             "type": file['content_type'], "date": self.utils.dateConverter(file['upload_date'])})
                        folder_Devie['data'] = data

                        if device['properties']['deviceType'] == 'IPX':
                            folder_AG['data'].append(folder_Devie)
                        elif device['properties']['deviceType'] == 'Mux' or device['properties']['deviceType'] == 'DEMUX':
                            folder_DF['data'].append(folder_Devie)
                        elif device['properties']['deviceType'] == 'FP':
                            folder_FP['data'].append(folder_Devie)


            results.append(folder)
        return json.dumps(
            [{"id": "FilesDrive", "value": 'Files Drive', "size": 0, "type": "folder", "open": True, "data": results}])
        # for devices in devicesList:
        #     if devices['properties']['deviceType'] != 'PTN':
        #         result = {"id": devices['_id'], "value": devices['deviceName'], "size": 0, "open": True,
        #                   "type": "folder", "date": dateConverter(devices['updateDate']), "webix_files": 1}
        #
        #         data = []
        #         if len(devices['filenames']) > 0:
        #             for file in devices['filenames']:
        #                 data.append({"id": file['objectID'], "value": file['filename'], "size": file['length'],
        #                              "type": file['content_type'], "date": dateConverter(file['upload_date'])})
        #         result['data'] = data
        #         results.append(result)
        # return json.dumps(
        #     [{"id": "FilesDrive", "value": 'Files Drive', "size": 0, "type": "folder", "open": True, "data": results}])


    def dateConverter(self, strDate):
        # strDate formart like  ('%Y-%m-%d %H:%M:%S') to microseconds
        st = str(strDate).split('.')

        dt = st[0].split()
        d = dt[0].split('-')
        t = dt[1].split(':')
        return time.mktime((int(d[0]), int(d[1]), int(d[2]), int(t[0]), int(t[1]), int(t[2]), 0, 0, 0))


    def filesService(self):
        gfs = gridfs.GridFS(DBfile)
        if request.form['action'] == "files":
            devices = self.DeviceModel(request.form['source']).get()
            data = []
            if len(devices['filenames']) > 0:
                for file in devices['filenames']:
                    data.append({"id": file['objectID'], "value": file['filename'], "size": file['length'],
                                 "type": file['content_type'], "date": self.utils.dateConverter(file['upload_date'])})
            return json.dumps({"parent": request.form['source'], "data": data})

        if request.form['action'] == "openPDF":
            objectID = request.form['source']
            gfs = gridfs.GridFS(DBfile)
            file = gfs.get(ObjectId(objectID)).read()
            response = make_response(file)
            response.headers['Content-Type'] = gfs.get(ObjectId(objectID)).content_type
            response.headers['filename'] = gfs.get(ObjectId(objectID)).filename
            return response

        if request.form['action'] == "download":
            objectID = request.form['source']
            gfs = gridfs.GridFS(DBfile)
            file = gfs.get(ObjectId(objectID)).read()
            response = make_response(file)
            response.headers['Content-Type'] = gfs.get(ObjectId(objectID)).content_type
            response.headers['filename'] = gfs.get(ObjectId(objectID)).filename
            response.headers["Content-Disposition"] = "attachment; filename= " + response.headers['filename'] + " "
            return response

        if request.form['action'] == "move":
            fileObjectIDs = request.form['source'].split(",")
            sourceParentID = request.form['sourceParentID']
            target = request.form['target']
            response = []
            for fileObjectID in fileObjectIDs:
                gridfsOut = gfs.get(ObjectId(fileObjectID))
                file = {"objectID": str(fileObjectID),
                        "content_type": gridfsOut.content_type,
                        "filename": gridfsOut.filename,
                        "length": gridfsOut.length,
                        "upload_date": gridfsOut.upload_date.strftime('%Y-%m-%d %H:%M:%S')
                        }
                self.DeviceModel(sourceParentID).update_filenames(file, delete=True)
                self.DeviceModel(target).update_filenames(file)
                response.append({"id": str(fileObjectID), "value": gridfsOut.filename})
            return json.dumps(response)

        if request.form['action'] == "copy":
            fileObjectIDs = request.form['source'].split(",")
            sourceParentID = request.form['sourceParentID']
            target = request.form['target']
            response = []
            for fileObjectID in fileObjectIDs:
                gridfsOut = gfs.get(ObjectId(fileObjectID))
                file = {"objectID": str(fileObjectID),
                        "content_type": gridfsOut.content_type,
                        "filename": gridfsOut.filename,
                        "length": gridfsOut.length,
                        "upload_date": gridfsOut.upload_date.strftime('%Y-%m-%d %H:%M:%S')
                        }

                newOjectID = gfs.put(gridfsOut.read(),
                                     content_type=gridfsOut.content_type,
                                     filename=gridfsOut.filename)

                newgridfsOut = gfs.get(ObjectId(newOjectID))
                newfile = {"objectID": str(newOjectID),
                           "content_type": newgridfsOut.content_type,
                           "filename": newgridfsOut.filename,
                           "length": newgridfsOut.length,
                           "upload_date": newgridfsOut.upload_date.strftime('%Y-%m-%d %H:%M:%S')
                           }

                self.DeviceModel(target).update_filenames(newfile)
                response.append({"id": str(newOjectID), "value": newgridfsOut.filename})
            return json.dumps(response)

        if request.form['action'] == "remove":
            fileObjectIDs = request.form['source'].split(",")
            sourceParentID = request.form['sourceParentID']
            response = []
            for fileObjectID in fileObjectIDs:
                gridfsOut = gfs.get(ObjectId(fileObjectID))
                file = {"objectID": str(fileObjectID),
                        "content_type": gridfsOut.content_type,
                        "filename": gridfsOut.filename,
                        "length": gridfsOut.length,
                        "upload_date": gridfsOut.upload_date.strftime('%Y-%m-%d %H:%M:%S')
                        }
                self.DeviceModel(sourceParentID).update_filenames(file, delete=True)
                response.append({"id": str(fileObjectID), "value": gridfsOut.filename})
            return json.dumps(response)

        if request.form['action'] == "rename":
            fileObjectID = request.form['source']
            sourceParentID = request.form['sourceParentID']
            newfilename = request.form['target']
            oldFileOut = gfs.get(ObjectId(fileObjectID))
            oldFile = {"objectID": str(fileObjectID),
                       "content_type": oldFileOut.content_type,
                       "filename": oldFileOut.filename,
                       "length": oldFileOut.length,
                       "upload_date": oldFileOut.upload_date.strftime('%Y-%m-%d %H:%M:%S')
                       }
            newOjectID = gfs.put(oldFileOut.read(),
                                 content_type=oldFileOut.content_type,
                                 filename=newfilename)
            gfs.delete(ObjectId(fileObjectID))
            gridfsOut = gfs.get(ObjectId(newOjectID))
            file = {"objectID": str(newOjectID),
                    "content_type": gridfsOut.content_type,
                    "filename": gridfsOut.filename,
                    "length": gridfsOut.length,
                    "upload_date": gridfsOut.upload_date.strftime('%Y-%m-%d %H:%M:%S')
                    }
            self.DeviceModel(sourceParentID).update_filenames(oldFile, delete=True)
            self.DeviceModel(sourceParentID).update_filenames(file)
            return json.dumps({"id": str(newOjectID), "value": gridfsOut.filename})


    def uploadFile(self):
        # upload sigle file
        if request.method == "POST":
            # print request.form
            if request.form['action'] == 'upload':

                deviceID = request.form['target'] if request.form['target'] != 'FilesDrive' else ''
                gfs = gridfs.GridFS(DBfile)
                if len(request.files) > 0:
                    # print request.files['upload']
                    objectID = gfs.put(request.files['upload'].read(),
                                       content_type=request.files['upload'].content_type,
                                       filename=request.files['upload'].filename)
                    gridfsOut = gfs.get(objectID)  # .length,gfs.get(objectID).upload_date
                    file = {"objectID": str(objectID),
                            "content_type": gridfsOut.content_type,
                            "filename": gridfsOut.filename,
                            "length": gridfsOut.length,
                            "upload_date": gridfsOut.upload_date.strftime('%Y-%m-%d %H:%M:%S')
                            }
                    self.DeviceModel(deviceID).update_filenames(file)

            return json.dumps(file)
