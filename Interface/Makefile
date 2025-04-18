CC = gcc
CFLAGS = -Wall -Wextra -g -O2
LDFLAGS = -lws2_32
TARGET = ipc_server.exe
TEST_TARGET = ipc_test.exe
SRC = ipc_server.c
TEST_SRC = ipc_test.c

all: $(TARGET) $(TEST_TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

$(TEST_TARGET): $(TEST_SRC)
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

clean:
	del /F /Q $(TARGET) $(TEST_TARGET)
	del /F /Q process_comm
	del /F /Q data_stream
	del /F /Q shared_cache
	del /F /Q *.o

run: $(TARGET)
	.\$(TARGET)

debug: $(TARGET)
	gdb .\$(TARGET)

test: $(TEST_TARGET)
	.\$(TEST_TARGET)

.PHONY: all clean run debug test 