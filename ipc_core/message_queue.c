/*
=============================
Phase 3: Implement Message Queues
=============================
*/
#include <sys/ipc.h>
#include <sys/msg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MSGQ_KEY 1234

struct msg_buffer {
    long msg_type;
    char msg_text[100];
} message;

void send_message() {
    int msgid = msgget(MSGQ_KEY, 0666 | IPC_CREAT);
    message.msg_type = 1;
    strcpy(message.msg_text, "Hello from sender!");
    msgsnd(msgid, &message, sizeof(message), 0);
    printf("Sent: %s\n", message.msg_text);
}

void receive_message() {
    int msgid = msgget(MSGQ_KEY, 0666 | IPC_CREAT);
    msgrcv(msgid, &message, sizeof(message), 1, 0);
    printf("Received: %s\n", message.msg_text);
    msgctl(msgid, IPC_RMID, NULL);
}

int main() {
    if (fork() == 0) {
        receive_message();
    } else {
        sleep(1);
        send_message();
    }
    return 0;
}
