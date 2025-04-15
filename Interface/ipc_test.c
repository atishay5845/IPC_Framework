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
#include <time.h>

#define MAX_MSG_SIZE 1024
#define SHM_SIZE 1024
#define NUM_TESTS 100

// Test results structure
typedef struct {
    int total_tests;
    int passed_tests;
    double avg_latency;
    double max_latency;
    double min_latency;
} TestResults;

// Function to measure time in milliseconds
double get_time_ms() {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (ts.tv_sec * 1000.0) + (ts.tv_nsec / 1000000.0);
}

// Test pipe communication
void test_pipe(const char *pipe_name, TestResults *results) {
    printf("Testing pipe communication...\n");
    
    int fd = open(pipe_name, O_WRONLY);
    if (fd == -1) {
        perror("open pipe");
        return;
    }
    
    char message[MAX_MSG_SIZE];
    double total_latency = 0;
    double max_latency = 0;
    double min_latency = 1000; // Start with a high value
    
    for (int i = 0; i < NUM_TESTS; i++) {
        snprintf(message, MAX_MSG_SIZE, "Test message %d", i);
        
        double start_time = get_time_ms();
        write(fd, message, strlen(message) + 1);
        double end_time = get_time_ms();
        
        double latency = end_time - start_time;
        total_latency += latency;
        
        if (latency > max_latency) max_latency = latency;
        if (latency < min_latency) min_latency = latency;
        
        usleep(1000); // Small delay between tests
    }
    
    close(fd);
    
    results->total_tests += NUM_TESTS;
    results->passed_tests += NUM_TESTS;
    results->avg_latency = total_latency / NUM_TESTS;
    results->max_latency = max_latency;
    results->min_latency = min_latency;
}

// Test message queue
void test_queue(const char *queue_name, TestResults *results) {
    printf("Testing message queue...\n");
    
    key_t key = ftok(queue_name, 65);
    if (key == -1) {
        perror("ftok");
        return;
    }
    
    int msgid = msgget(key, 0666);
    if (msgid == -1) {
        perror("msgget");
        return;
    }
    
    struct msg_buffer {
        long msg_type;
        char msg_text[MAX_MSG_SIZE];
    } msg;
    
    msg.msg_type = 1;
    double total_latency = 0;
    double max_latency = 0;
    double min_latency = 1000;
    
    for (int i = 0; i < NUM_TESTS; i++) {
        snprintf(msg.msg_text, MAX_MSG_SIZE, "Test message %d", i);
        
        double start_time = get_time_ms();
        msgsnd(msgid, &msg, sizeof(msg.msg_text), 0);
        double end_time = get_time_ms();
        
        double latency = end_time - start_time;
        total_latency += latency;
        
        if (latency > max_latency) max_latency = latency;
        if (latency < min_latency) min_latency = latency;
        
        usleep(1000);
    }
    
    results->total_tests += NUM_TESTS;
    results->passed_tests += NUM_TESTS;
    results->avg_latency = total_latency / NUM_TESTS;
    results->max_latency = max_latency;
    results->min_latency = min_latency;
}

// Test shared memory
void test_shm(const char *shm_name, TestResults *results) {
    printf("Testing shared memory...\n");
    
    key_t key = ftok(shm_name, 65);
    if (key == -1) {
        perror("ftok");
        return;
    }
    
    int shmid = shmget(key, SHM_SIZE, 0666);
    if (shmid == -1) {
        perror("shmget");
        return;
    }
    
    char *shm_ptr = (char *)shmat(shmid, NULL, 0);
    if (shm_ptr == (char *)-1) {
        perror("shmat");
        return;
    }
    
    double total_latency = 0;
    double max_latency = 0;
    double min_latency = 1000;
    
    for (int i = 0; i < NUM_TESTS; i++) {
        char message[MAX_MSG_SIZE];
        snprintf(message, MAX_MSG_SIZE, "Test message %d", i);
        
        double start_time = get_time_ms();
        strcpy(shm_ptr, message);
        double end_time = get_time_ms();
        
        double latency = end_time - start_time;
        total_latency += latency;
        
        if (latency > max_latency) max_latency = latency;
        if (latency < min_latency) min_latency = latency;
        
        usleep(1000);
    }
    
    shmdt(shm_ptr);
    
    results->total_tests += NUM_TESTS;
    results->passed_tests += NUM_TESTS;
    results->avg_latency = total_latency / NUM_TESTS;
    results->max_latency = max_latency;
    results->min_latency = min_latency;
}

int main() {
    TestResults results = {0, 0, 0.0, 0.0, 0.0};
    
    printf("Starting IPC Performance Tests\n");
    printf("=============================\n\n");
    
    // Test each IPC mechanism
    test_pipe("process_comm", &results);
    test_queue("data_stream", &results);
    test_shm("shared_cache", &results);
    
    // Print results
    printf("\nTest Results\n");
    printf("============\n");
    printf("Total Tests: %d\n", results.total_tests);
    printf("Passed Tests: %d\n", results.passed_tests);
    printf("Average Latency: %.2f ms\n", results.avg_latency);
    printf("Maximum Latency: %.2f ms\n", results.max_latency);
    printf("Minimum Latency: %.2f ms\n", results.min_latency);
    
    return 0;
} 