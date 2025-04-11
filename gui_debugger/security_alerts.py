#### Phase 5: Security Alerts for Unauthorized Access


```python
def check_access(user):
    authorized_users = ["admin", "root"]
    if user not in authorized_users:
        print("Security Alert: Unauthorized access!")
    else:
        print("Access Granted")

check_access("guest")
```
