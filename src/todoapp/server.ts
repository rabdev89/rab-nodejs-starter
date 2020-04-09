import { InversifyExpressServer } from "inversify-express-utils"
import { interfaces } from "inversify";
import { afterSetupConfig, setupConfig } from "./api/routers";
import { Application } from "express";

import {createConnection} from "./storage/db";

export async function initDB(): Promise<void> {

    await createConnection.setAutoReconnect();

    await createConnection.initConnection();

    return Promise.resolve();
}

export async function startServer(container: interfaces.Container,
                                  hostname: string,
                                  serverPort: number): Promise<InversifyExpressServer> {
    return new Promise<InversifyExpressServer>((resolve, reject) => {
        const server = createExpressApplication(container);
        const ioServer = require("http").createServer(server);
        //const io = require("socket.io")(ioServer);
        ioServer.listen(serverPort, hostname, () => {
            console.log("Express server listening on " + serverPort);
            resolve();
        });
    });
}

export function createExpressApplication(container: interfaces.Container): Application {
    return new InversifyExpressServer(container)
        .setConfig((app) => {
            setupConfig(app, container);
        })
        .setErrorConfig((app) => {
            afterSetupConfig(app, container);
        }).build();
}
