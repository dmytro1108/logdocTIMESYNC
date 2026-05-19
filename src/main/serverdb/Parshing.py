#Functions used for checking commands from the client and getting results for those commands.

#from serverdb.ServerDB import ServerDB
from serverdb import ServerDB

#functions return with error codes:
#10 is connection to MariaDB is lost
#9 if username is missing
#8 if password is missing
#7 if email is missing


#function to create a new user. Return:
#0 if successful
#1 if username already exists
def create_new_user(MDB, code):
	
	#give an error code if none valid connection was passed in
	if ServerDB.is_connected(MDB) == False:
		return (10, MDB)
	
	#if user asked to create a new user without giving a username, return with an error code
	if "username" not in code:
		return (9, MDB)
		
	#if user asked to create a new user without giving a password, return with an error code
	if "password" not in code:
		return (8, MDB)
	
	#if user asked to create a new user without giving an email, return with an error code
	if "email" not in code:
		return (7, MDB)
	
	#return with error code if user with specified username already exists
	MDB = ServerDB.search_user(MDB, code["username"])
	if MDB["cursor"].rowcount > 0:
		return(1, MDB)
		
	#If no such user exists, then create the new user and return with success
	MDB = ServerDB.add_user(MDB, code["username"], code["email"], code["password"])
	return (0, MDB)

#function that validates a User with their username and password. Returns:
#0 and email address if a valid username and password combo was given
#1 password does not match for the username
#2 if username does not match any users\
def login_to_user(MDB, code):
	
	#give an error code if none valid connection was passed in
	if ServerDB.is_connected(MDB) == False:
		return (10, MDB)
		
	#if user asked to create a new user without giving a username, return with an error code
	if "username" not in code:
		return (9, MDB)
		
	#if user asked to create a new user without giving a password, return with an error code
	if "password" not in code:
		return (8, MDB)
	
	# search for specificed user
	MDB = ServerDB.search_user(MDB, code["username"])
	
	#check if username used for login does not exist
	if MDB["cursor"].rowcount == 0:
		return(2, MDB)
	
	#check if password matches for user
	results = MDB["cursor"].fetchone()
	#if successfull, then return with email
	if results[3] == code["password"]:
		return (0, (MDB, results[2]))
	#otherwise, return with an error code for incorrect password
	else:
		return (1, MDB)
	

