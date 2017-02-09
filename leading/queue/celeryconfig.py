from datetime import timedelta

CELERY_ENABLE_UTC = True
CELERY_TIMEZONE = 'UTC'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERYD_PREFETCH_MULTIPLIER = 1
CELERYD_TASK_TIME_LIMIT = 600
CELERYD_MAX_TASKS_PER_CHILD = 4
CELERY_IMPORTS = ("leading.queue.tasks",)
CELERY_IGNORE_RESULT = True

CELERYBEAT_SCHEDULE = {
    'tasks-per-10s': {
        'task': 'leading.queue.taskTasksCompleted',
        'schedule': timedelta(seconds=60),
        'args': ('tasks-per-10s',)
    },
    'tasks-per-10s-2': {
        'task': 'leading.queue.taskTasksCompleted2',
        'schedule': timedelta(seconds=60),
        'args': ('tasks-per-10s-2',)
    },
    'tasks-per-30s': {
        'task': 'leading.queue.taskAccountSum',
        'schedule': timedelta(seconds=180),
        'args': ('tasks-per-30s',)
    },
    'tasks-per-30s2': {
        'task': 'leading.queue.taskPerformance',
        'schedule': timedelta(seconds=180),
        'args': ('tasks-per-30s2',)
    },
}
