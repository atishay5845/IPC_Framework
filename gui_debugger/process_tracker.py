#### Phase 4: Process Activity Tracker
```python
import os

def list_processes():
    os.system("ps aux > process_list.txt")
    print("Process list saved.")

list_processes()
```
