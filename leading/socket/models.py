from Queue import Queue
import threading


class ThreadWorker():
    def __init__(self, func):
        self.thread = None
        self.data = None
        self.func = func
        self.result = Queue()

    def save_data(self, *args, **kwargs):
        '''modify function to save its returned data'''
        self.data = None
        data = self.func(*args, **kwargs)
        # data['count']=self.count
        # print len(data)
        self.result.put(data)
        return self.result

    def start(self, interval, params):
        if self.thread is not None:
            if self.thread.isAlive():
                return 'running'  # could raise exception here
            else:
                return 'started'
        self.thread = threading.Timer(interval, self.save_data, [params, ])
        self.thread.start()

    def status(self):
        if self.thread is None:
            return 'not_started'
        else:
            if self.thread.isAlive():
                return 'running'
            else:
                return 'finished'

    def join(self, fn):
        self.thread.join(fn)
