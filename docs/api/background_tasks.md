# Background Tasks
The api server has runs some tasks in the background
- Session cleanup

There is a BackgroundTaskManager class in api/services/background_tasks.py. For the moment, all the session tasks are included in the file, but will be eventually and properly be moved out.

## Session Cleanup
Cleans up expired and inactive sessions from the sessions table. The frequency is set through environment variables. Uses the sessions_operations.
