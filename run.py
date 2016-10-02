__author__ = 'isaac'


from leading import app


#app.register_blueprint(bppwiki)

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5001,debug=True)


