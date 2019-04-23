from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017
DBS_NAME = 'testExport'
COLLECTION_NAME = 'testCollection'

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/testExport/testCollection")
def testExport_testCollection():
    connection = MongoClient(MONGODB_HOST, MONGODB_PORT)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(limit=50)
    json_data = []
    for project in projects:
        json_data.append(project)
    json_data = json.dumps(json_data, default=json_util.default)
    connection.close()

    return json_data

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)