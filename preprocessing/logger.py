import sys
import logging

from datetime import datetime


class FlushFileHandler(logging.FileHandler):
    def emit(self, record):
        super().emit(record)
        self.flush()


# Capture the start time of the application
app_start_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# Logger config
logger = logging.getLogger('main')

# Set the logging level to INFO
logger.setLevel(logging.INFO)

# Create handlers
console_handler = logging.StreamHandler()
file_handler = FlushFileHandler(f'{app_start_time}_log_file.log')

# Create formatters and add them to handlers
formatter = logging.Formatter('[%(asctime)s | %(name)s | %(levelname)s ]: %(message)s')
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

# Set the logging level for the handlers to INFO
console_handler.setLevel(logging.INFO)
file_handler.setLevel(logging.INFO)

# Add handlers to the logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# startup message
logger.info(f'Application started at {app_start_time}')
