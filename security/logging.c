/*
=============================
Phase 4: Implement Secure Logging for IPC Access Attempts
=============================
*/
#include <stdio.h>
#include <time.h>

void log_access_attempt(const char *user, const char *action) {
    FILE *logfile = fopen("ipc_security.log", "a");
    time_t now = time(NULL);
    fprintf(logfile, "%s - User: %s | Action: %s\n", ctime(&now), user, action);
    fclose(logfile);
}

int main() {
    log_access_attempt("root", "Access Granted");
    log_access_attempt("guest", "Access Denied");
    return 0;
}


