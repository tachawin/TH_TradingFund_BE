MONGO_AUTH_NAME := admin

mgo-shutdown: shutdown-mongo-on-local

shutdown-mongo-on-local:
	mongo --eval "db.getSiblingDB('${MONGO_AUTH_NAME}').shutdownServer()"

renew-container:
	docker-compose up --build --force-recreate --renew-anon-volumes

compilation-and-run: 
	npm run build
	npm run start

start:
	docker compose up

stop:
	@ echo "> Stop development environment"
	@ docker-compose down
	@ echo "> ----- Complete -----"
