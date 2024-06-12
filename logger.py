# -*- coding: utf-8 -*-
#!/usr/bin/env python3
import sys
import logging

from datetime import datetime


# Capture the start time of the application
app_start_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# logger config
logger = logging.getLogger('main')

# Create handlers
console_handler = logging.StreamHandler()
file_handler = logging.FileHandler(f'{app_start_time}_log_file.log')

# Create formatters and add them to handlers
formatter = logging.Formatter('[%(asctime)s | %(name)s | %(levelname)s ]: %(message)s')
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)
logger.setFormatter(formatter)

# Add handlers to the logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# startup message
logger.info(f'Application started at {app_start_time}')
