from celery import Celery

# celery init
capp = Celery('leading', broker='mongodb://localhost:27017/leadingcelerydb')
capp.config_from_object('leading.queue.celeryconfig')


@capp.task(name='leading.queue.task1')
def task1(params):
    print "Executed Task taskScanAllPorts @ " + params
