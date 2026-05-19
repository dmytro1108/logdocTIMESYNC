import unittest
import ServerDB
import Parshing
import json

#White box test. Tests the function for parshing code on the server for creating a new user account
#I am doing "branch coverage". The code I am testing is:

# def create_new_user(MDB, code):
	
	# #give an error code if none valid connection was passed in
	# if ServerDB.is_connected(MDB) == False:
		# return (4, MDB)
	
	# #if user asked to create a new user without giving a username, return with an error code
	# if "username" not in code:
		# return (2, MDB)
	
	# #if user asked to create a new user without giving a password, return with an error code
	# if "password" not in code:
		# return (3, MDB)
	
	# #return with error code if user with specified username already exists
	# MDB = ServerDB.search_user(MDB, code["username"])

	# if MDB["cursor"].rowcount > 0:
		# return(1, MDB)
		
	# #If no such user exists, then create the new user and return with success
	# MDB = ServerDB.add_user(MDB, code["username"], code["password"])
	# return (0, MDB)
	
class TestWhiteBoxForNewUser(unittest.TestCase):

	def test_successfully_create_user(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"username" : "C" , "password" : "password3"}
		(result, MDB) = Parshing.create_new_user(MDB, code)
		self.assertEqual(result, 0)
		MDB = ServerDB.delete_user(MDB, code["username"])
		MDB = ServerDB.closeconnection(MDB)
		
	def test_user_already_exists(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"username" : "A" , "password" : "password2"}
		(result, MDB) = Parshing.create_new_user(MDB, code)
		self.assertEqual(result, 1)
		MDB = ServerDB.closeconnection(MDB)
		
	def test_missing_username(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"password" : "password3"}
		(result, MDB) = Parshing.create_new_user(MDB, code)
		self.assertEqual(result, 2)
		MDB = ServerDB.closeconnection(MDB)
		
	def test_missing_password(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"username" : "C"}
		(result, MDB) = Parshing.create_new_user(MDB, code)
		self.assertEqual(result, 3)
		MDB = ServerDB.closeconnection(MDB)
		
	def test_missing_database_connection(self):
		code = {"username" : "C" , "password" : "password3"}
		(result, MDB) = Parshing.create_new_user(0, code)
		self.assertEqual(result, 4)

if __name__ == '__main__':
    unittest.main()
