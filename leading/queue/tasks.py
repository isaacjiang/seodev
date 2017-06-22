from celery import Celery

# from leading.desisiontools import controller as dsController
# from leading.general.models import PerformanceModel

# celery init
capp = Celery('leading', broker='mongodb://localhost:27017/leadingcelerydb')
capp.config_from_object('leading.queue.celeryconfig')


@capp.task(name='leading.queue.taskTasksCompleted')
def taskTasksCompleted(params):
    from leading.desisiontools.controller import PeriodicTasksService
    tasks = PeriodicTasksService()
    tasks.hiringDecision()
    tasks.employeesAccountBookkeeping()
    tasks.workforceAccountBookkeeping()
    print "Executed Task taskTasksCompleted @ " + params


@capp.task(name='leading.queue.taskTasksCompleted2')
def taskTasksCompleted2(params):
    from leading.desisiontools.controller import PeriodicTasksService
    tasks = PeriodicTasksService()
    tasks.budgetAccountBookkeeping()
    tasks.actionsAccountBookkeeping()
    tasks.nichesCalculation()
    tasks.resourcesComplete()
    tasks.negotiation1AccountBookkeeping()
    tasks.negotiation2AccountBookkeeping()
    print "Executed Task taskTasksCompleted @ " + params

@capp.task(name='leading.queue.taskAccountSum')
def taskAccountSum(params):
    from leading.desisiontools.controller import PeriodicTasksService
    PeriodicTasksService().account_sum()
    print "Executed Task taskAccountSum @ " + params

@capp.task(name='leading.queue.taskPerformance')
def taskPerformance(params):
    from leading.desisiontools.controller import PeriodicTasksService
    PeriodicTasksService().calculte_marketing_share()
    print "Executed Task taskPerformance @ " + params