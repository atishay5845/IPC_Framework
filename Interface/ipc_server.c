#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/ipc.h>
#include <sys/msg.h>
#include <sys/shm.h>
#include <sys/sem.h>
#include <errno.h>

#define MAX_MSG_SIZE 1024
#define SHM_SIZE 1024
#define MAX_PROCESSES 10

// Security levels
typedef enum {
    SECURITY_LOW,
    SECURITY_MEDIUM,
    SECURITY_HIGH
} SecurityLevel;

// Process authentication structure
typedef struct {
    pid_t pid;
    char process_name[32];
    SecurityLevel security_level;
    time_t last_activity;
} ProcessAuth;

// Message structure for message queue
struct msg_buffer {
    long msg_type;
    char msg_text[MAX_MSG_SIZE];
    SecurityLevel security_level;
    pid_t sender_pid;
};

// Shared memory control structure
typedef struct {
    int sem_id;
    int is_locked;
    ProcessAuth authorized_processes[MAX_PROCESSES];
    int process_count;
} ShmControl;

// Simple XOR encryption/decryption
void xor_encrypt_decrypt(const char *input, char *output, const char *key, size_t len) {
    size_t key_len = strlen(key);
    for (size_t i = 0; i < len; i++) {
        output[i] = input[i] ^ key[i % key_len];
    }
}
// Setup named pipe with security
int setup_pipe(const char *pipe_name, SecurityLevel security) {
    if (mkfifo(pipe_name, 0666) == -1) {
        if (errno != EEXIST) {
            perror("mkfifo");
            return -1;
        }
    }
    
    // Set appropriate permissions based on security level
    mode_t mode = (security == SECURITY_HIGH) ? 0600 : 0666;
    chmod(pipe_name, mode);
    
    return 0;
}

// Setup message queue with security
int setup_queue(const char *queue_name, SecurityLevel security) {
    key_t key = ftok(queue_name, 65);
    if (key == -1) {
        perror("ftok");
        return -1;
    }
    
    int msgid = msgget(key, 0666 | IPC_CREAT);
    if (msgid == -1) {
        perror("msgget");
        return -1;
    }
    
    // Set queue permissions based on security level
    struct msqid_ds buf;
    msgctl(msgid, IPC_STAT, &buf);
    buf.msg_perm.mode = (security == SECURITY_HIGH) ? 0600 : 0666;
    msgctl(msgid, IPC_SET, &buf);
    
    return msgid;
}

// Setup shared memory with security
int setup_shm(const char *shm_name, SecurityLevel security) {
    key_t key = ftok(shm_name, 65);
    if (key == -1) {
        perror("ftok");
       return -1;
    }
    
    int shmid = shmget(key, SHM_SIZE, 0666 | IPC_CREAT);
    if (shmid == -1) {
        perror("shmget");
        return -1;
    }
    
    // Initialize semaphore for shared memory access control
    shm_control.sem_id = semget(key, 1, 0666 | IPC_CREAT);
    if (shm_control.sem_id == -1) {
        perror("semget");
        return -1;
    }
    
    // Set initial semaphore value
    semctl(shm_control.sem_id, 0, SETVAL, 1);
    
    return shmid;
}

// Process authentication
int authenticate_process(pid_t pid, const char *process_name, SecurityLevel security) {
    // Check if process is already authenticated
    for (int i = 0; i < shm_control.process_count; i++) {
        if (shm_control.authorized_processes[i].pid == pid) {
            shm_control.authorized_processes[i].last_activity = time(NULL);
            return 1;
        }
    }
    
    // Add new process if space available
    if (shm_control.process_count < MAX_PROCESSES) {
        ProcessAuth *auth = &shm_control.authorized_processes[shm_control.process_count++];
        auth->pid = pid;
        strncpy(auth->process_name, process_name, sizeof(auth->process_name) - 1);
        auth->security_level = security;
        auth->last_activity = time(NULL);
        return 1;
    }
    
    return 0;
}

int main() {
    const char *pipe_name = "process_comm";
    const char *queue_name = "data_stream";
    const char *shm_name = "shared_cache";
    const char *encryption_key = "neon_ipc_key";
    
    // Setup IPC mechanisms with security
    if (setup_pipe(pipe_name, SECURITY_HIGH) == -1) {
        fprintf(stderr, "Failed to setup pipe\n");
        return 1;
    }
    
    int msgid = setup_queue(queue_name, SECURITY_HIGH);
    if (msgid == -1) {
        fprintf(stderr, "Failed to setup message queue\n");
        return 1;
    }
    
    int shmid = setup_shm(shm_name, SECURITY_HIGH);
    if (shmid == -1) {
        fprintf(stderr, "Failed to setup shared memory\n");
        return 1;
    }
    
    printf("IPC Server started successfully\n");
    printf("Listening on:\n");
    printf("- Pipe: %s\n", pipe_name);
    printf("- Queue: %s\n", queue_name);
    printf("- Shared Memory: %s\n", shm_name);
    
    // Main server loop
    while (1) {
        // Handle pipe communication
        int pipe_fd = open(pipe_name, O_RDONLY | O_NONBLOCK);
        if (pipe_fd != -1) {
            char buffer[MAX_MSG_SIZE];
            char decrypted[MAX_MSG_SIZE];
            ssize_t bytes_read = read(pipe_fd, buffer, MAX_MSG_SIZE);
            if (bytes_read > 0) {
                xor_encrypt_decrypt(buffer, decrypted, encryption_key, bytes_read);
                printf("Pipe message received: %s\n", decrypted);
            }
            close(pipe_fd);
        }
        
        // Handle message queue
        struct msg_buffer msg;
        if (msgrcv(msgid, &msg, sizeof(msg.msg_text), 1, IPC_NOWAIT) != -1) {
            char decrypted[MAX_MSG_SIZE];
            xor_encrypt_decrypt(msg.msg_text, decrypted, encryption_key, strlen(msg.msg_text));
            printf("Queue message received from PID %d: %s\n", msg.sender_pid, decrypted);
        }
        
        // Handle shared memory
        char *shm_ptr = (char *)shmat(shmid, NULL, 0);
        if (shm_ptr != (char *)-1) {
            if (strlen(shm_ptr) > 0) {
                char decrypted[MAX_MSG_SIZE];
                xor_encrypt_decrypt(shm_ptr, decrypted, encryption_key, strlen(shm_ptr));
                printf("Shared memory message: %s\n", decrypted);
                memset(shm_ptr, 0, SHM_SIZE);
            }
            shmdt(shm_ptr);
        }
        
        usleep(100000); // Sleep for 100ms
    }
    
    return 0;
} 
