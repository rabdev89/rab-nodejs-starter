import mongoose from "mongoose";
import { startInternalServer } from "./internalServer";
import "reflect-metadata";
import config, { EnumEnvironments } from "./config";
import { initDB, startServer } from "./server";
import { container } from "./bootstrap";
import "./api/usersController";


global.Promise = require("bluebird");


if (config.environment === EnumEnvironments.production) {
    console.log = () => (undefined); // tslint:disable-line
}

process.on("uncaughtException", (err) => {
    console.log(err, "uncaughtException occurred. Server continuing to work");
});

process.on("unhandledRejection", (err, promise) => {
    console.log(err, "unhandledRejection", promise);
});

(async () => {
    await initDB();
    await startServer(container, config.server.host, config.server.port);
    await startInternalServer();
})();
