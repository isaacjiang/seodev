__author__ = 'isaac'

from flask import render_template
from .models import DatabaseInit

def userRegister():
    return render_template('system/register.html')

def userLogin():
    return render_template('system/login.html')

def backupSetting():
    return render_template('system/backupsetting.html')

def datainit():
    return render_template('system/addDataConf.html')


def init_visionary_competition():
    DatabaseInit().delete_visionary_competition_data()
    return 'success'


def init_system():
    DatabaseInit().drop_database()
    return 'success'
