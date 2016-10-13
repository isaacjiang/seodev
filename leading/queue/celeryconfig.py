from datetime import timedelta

CELERY_ENABLE_UTC = True
CELERY_TIMEZONE = 'UTC'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERYD_PREFETCH_MULTIPLIER = 1
CELERYD_TASK_TIME_LIMIT = 60
CELERYD_MAX_TASKS_PER_CHILD = 4
CELERY_IMPORTS = ("leading.queue.tasks",)
CELERY_IGNORE_RESULT = True

CELERYBEAT_SCHEDULE = {
    'tasks-per-10s': {
        'task': 'leading.queue.task1',
        'schedule': timedelta(seconds=10),
        'args': ('XX',)
    },
}
