__author__ = 'isaac'

from flask import render_template

def userRegister():
    return render_template('system/register.html')

def userLogin():
    return render_template('system/login.html')

def backupSetting():
    return render_template('system/backupsetting.html')

def datainit():
    return render_template('system/addDataConf.html')


