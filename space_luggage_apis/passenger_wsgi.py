import imp
import os
import sys

# Setting them to '1' ensures the program uses only one thread for heavy math libraries.
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
os.environ.setdefault('OMP_NUM_THREADS', '1')
os.environ.setdefault('MKL_NUM_THREADS', '1')
os.environ.setdefault('NUMEXPR_MAX_THREADS', '1')


sys.path.insert(0, os.path.dirname(__file__))

wsgi = imp.load_source('wsgi', 'app.py')
application = wsgi.app
