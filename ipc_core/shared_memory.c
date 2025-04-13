/*
=============================
Phase 4: Implement Shared Memory
=============================
*/
#include <sys/ipc.h>
#include <sys/shm.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define SHM_KEY 5678

void write_shared_memory() {
    int shmid = shmget(SHM_KEY, 1024, 0666 | IPC_CREAT);
    char *shared_mem = (char *)shmat(shmid, NULL, 0);
    strcpy(shared_mem, "Shared Memory IPC");
    printf("Written: %s\n", shared_mem);
    shmdt(shared_mem);
}

void read_shared_memory() {
    int shmid = shmget(SHM_KEY, 1024, 0666);
    char *shared_mem = (char *)shmat(shmid, NULL, 0);
    printf("Read: %s\n", shared_mem);
    shmdt(shared_mem);
    shmctl(shmid, IPC_RMID, NULL);
}

int main() {
    if (fork() == 0) {
        sleep(1);
        read_shared_memory();
    } else {
        write_shared_memory();
    }
    return 0;
}
