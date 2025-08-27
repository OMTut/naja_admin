# Server Operations
Handels the operations needed and used for the sessions table. There is also a background task running that periodically removes expired and inactive sessions.

- Get Session: Returns the session object
- Get User from Session


## Create Session
Create a new session for the user in the database.
Takes in the user_id, an expires variable    
- Generates a unique session id
- calculates the expires_at using the passed in expires variable
- sets is_active to true
- sets the last_accessed attribute to now
- commits it to the db

## Get Session
Takes a session id and returns the session object

## Get User from Session
Takes a session id and ruturns the user object associated with it

## Update Session Access
Updates the session's last accessed attribute.
- checks to see if there is a session and if it is active
- if there is, it sets the last_accessed to now and returns true
  - false if not

## Invalidate Session
Takes a session_id and sets the is_active attribute to false

## Clean up expired sessions
cleans up all the sessions that are past the expired date.
returns the number of sessions cleaned.

## Invalidate All User Sessions
Note: misleading function name.
This function actually invalidates all sessions for a specific user; it does not invalidate all sessions.
Given a user id, sets is_active to false for all sessions associated with the user_id and returns the number of invalidated sessions

## Delete All User Sessions
Give a user_id, deletes all sessions associated with the user_id from the sessions table and returns the number of sessions deleted.