'''
==============================
Phase 3: Implement Logging & Debugging Interface
==============================
'''

def log_message(message):
    with open("ipc_log.txt", "a") as log_file:
        log_file.write(message + "\n")

log_message("IPC Debugger Started")
print("Log Updated: IPC Debugger Started")
