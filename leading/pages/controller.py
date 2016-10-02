__author__ = 'isaac'

from flask import render_template, request


def index():
    return render_template('index.html')


def dashboard():
    return render_template('resource.html')

def market():
    return render_template('market.html')

def finance():
    return render_template('finance.html')

def help():
    return render_template('finance.html')

def settings():
    return render_template('settings.html')






