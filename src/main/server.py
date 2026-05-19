#Code for running a websocket server in python. Acts as a middle man between the typyscript client and the Mariadb server
#This file and all files related to handeling the server should eventually be moved to a separate repository 

import asyncio
import websockets
import json
from serverdb import ServerDB
from serverdb import Parshing

serverCrFile = open("credentials.json")
serverCR = json.load(serverCrFile)

(e, MDB) = ServerDB.startconnection(serverCR)

if e == 1:
	print("Could not connect to MariaDB")
	print("Error: ", end="")
	print(MDB)
	exit()

async def echo(websocket):
	async for message in websocket:
		global MDB
		y = json.loads(message)
		if y["command"] == "create_account":
			(e, MDB) = Parshing.create_new_user(MDB, y["code"])
			response = { "response":e}
		elif y["command"] == "login":
			(e, MDB) = Parshing.login_to_user(MDB, y["code"])
			if e == 0:
				(MDB, email) = MDB
				response = { "response":e, "email":email}
			else:
				response = { "response":e}
		#turn dictionary response into a string
		response = json.dumps(response)
		await websocket.send(response)
		
async def main():
	async with websockets.serve(echo, "0.0.0.0", 3050):
		await asyncio.Future() # run forever
		
asyncio.run(main())



