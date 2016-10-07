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
            # objectID = objectID
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

