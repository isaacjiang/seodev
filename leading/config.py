__author__ = 'isaac'

from pymongo import MongoClient
import os

SECRET_KEY = os.urandom(24)
SESSION_COOKIE_NAME = 'session'
SESSION_PERMANENT = True
PERMANENT_SESSION_LIFETIME = 32000000
DEBUG = True
TESTING = True

APPLICATION_ROOT = os.path.dirname(os.path.abspath(__file__))
APPLICATION_DATA = os.path.join(APPLICATION_ROOT, 'static', 'data')

DATABASE_DOMAIN = 'localhost'  # 52.34.181.89 localhost  192.168.254.3
DATABASE_PORT = 27017

client = MongoClient(DATABASE_DOMAIN, DATABASE_PORT, maxPoolSize=200, connect=False)
leadingdb = client.leadingdb
leadingbase = client.leadingbase
leadingfiledb = client.leadingfiledb

