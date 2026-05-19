import unittest
import ServerDB
import Parshing
import json


#Integration test. Tests the "create_new_user" and "login_to_user" functions by creating a new user that did not exist
#and then trying to succeffully log into that user.
class Testintegration(unittest.TestCase):

	#tests that a user can successfully login
	def test_log_into_new_user(self):
		serverCrFile = open("../credentials.json")
		serverCR = json.load(serverCrFile)
		(result, MDB) = ServerDB.startconnection(serverCR)
		code = {"username" : "C" , "password" : "password3"}
		#first check to make usre that the user does not already exist
		(result, MDB) = Parshing.login_to_user(MDB, code)
		self.assertEqual(result, 2)
		#now test that user was created successfully
		(result, MDB) = Parshing.create_new_user(MDB, code)
		self.assertEqual(result, 0)
		#finally test that that the new user can be logged into
		(result, MDB) = Parshing.login_to_user(MDB, code)
		self.assertEqual(result, 0)
		MDB = ServerDB.delete_user(MDB, code["username"])
		MDB = ServerDB.closeconnection(MDB)

if __name__ == '__main__':
    unittest.main()
