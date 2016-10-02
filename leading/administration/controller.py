__author__ = 'isaac'

from flask import render_template

def userRegister():
    return render_template('system/register.html')

def userLogin():
    return render_template('system/login.html')

def backupSetting():
    return render_template('system/backupsetting.html')

def scanports():
    return render_template('scanports.html')

def exportExcel():
    return render_template('exportExcel.html')


