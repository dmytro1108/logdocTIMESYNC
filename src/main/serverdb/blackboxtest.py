import unittest
import ServerDB
import Parshing
import json


#Black box test. Tests the function for parshing code on the server for logining in a user. 
#When the user passes a username and password, the server validates if the login is succeccfull
#If incorrect information was passed through (such as the wrong password) then an appropriate 
#error code need to be given so that the appropriate error message can be sent back to the user
class TestBlackBoxForUserLogin(unittest.TestCase):

	#tests that a user can successfully login
	def test_successful_login(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"username" : "A" , "password" : "password2"}
		(result, MDB) = Parshing.login_to_user(MDB, code)
		self.assertEqual(result, 0)
		MDB = ServerDB.closeconnection(MDB)
		
	#tests that the function gives the correct error code back if user tried to login with the wrong password  
	def test_incorrect_password(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"username" : "A" , "password" : "password"}
		(result, MDB) = Parshing.login_to_user(MDB, code)
		self.assertEqual(result, 1)
		MDB = ServerDB.closeconnection(MDB)
		
	#tests that the function gives the correct error code back if the username that the user tries to log in under does not exist
	def test_nonexistent_user(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"username" : "B" , "password" : "password2"}
		(result, MDB) = Parshing.login_to_user(MDB, code)
		self.assertEqual(result, 2)
		MDB = ServerDB.closeconnection(MDB)
	
	#tests that the function gives the correct error code back if no username is passed into the function
	def test_missing_username(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"password" : "password2"}
		(result, MDB) = Parshing.login_to_user(MDB, code)
		self.assertEqual(result, 3)
		MDB = ServerDB.closeconnection(MDB)
	
	#tests that the function gives the correct error code back if no password is passed into the function
	def test_missing_password(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"username" : "A"}
		(result, MDB) = Parshing.login_to_user(MDB, code)
		self.assertEqual(result, 4)
		MDB = ServerDB.closeconnection(MDB)
	
	#tests that the function gives the correct error code back if no database connecction is passed into the function
	def test_successful_login(self):
		code = {"username" : "A" , "password" : "password2"}
		(result, MDB) = Parshing.login_to_user(0, code)
		self.assertEqual(result, 5)

if __name__ == '__main__':
    unittest.main()
