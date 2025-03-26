/*
=============================
Phase 2: Implement Process Authentication (Access Control Lists - ACLs)
=============================
*/
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <pwd.h>

void check_user_access() {
    struct passwd *pw = getpwuid(geteuid());
    if (pw) {
        printf("User: %s\n", pw->pw_name);
        if (geteuid() == 0) {
            printf("Access Granted: Root User\n");
        } else {
            printf("Access Restricted: Non-Root User\n");
            exit(1);
        }
    }
}

int main() {
    check_user_access();
    printf("Process running with necessary access permissions.\n");
    return 0;
}
