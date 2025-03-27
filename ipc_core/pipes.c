
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>


#define FIFO_NAME "mypipe"
#define BUFFER_SIZE 100

void anonymous_pipe() {
    int fd[2];
    char buffer[BUFFER_SIZE];
    pipe(fd);
    
    if (fork() == 0) {
        close(fd[1]);
        read(fd[0], buffer, BUFFER_SIZE);
        printf("Child received: %s\n", buffer);
        close(fd[0]);
        exit(0);
    } else {
        close(fd[0]);
        write(fd[1], "Hello from parent", 18);
        close(fd[1]);
    }
}

void named_pipe() {
    mkfifo(FIFO_NAME, 0666);
    if (fork() == 0) {
        int fd = open(FIFO_NAME, O_RDONLY);
        char buffer[BUFFER_SIZE];
        read(fd, buffer, BUFFER_SIZE);
        printf("Child read: %s\n", buffer);
        close(fd);
        exit(0);
    } else {
        int fd = open(FIFO_NAME, O_WRONLY);
        write(fd, "Message through FIFO", 21);
        close(fd);
    }
}

int main() {
    printf("\nAnonymous Pipe Example:\n");
    anonymous_pipe();
    sleep(1);
    printf("\nNamed Pipe Example:\n");
    named_pipe();
    return 0;
}
