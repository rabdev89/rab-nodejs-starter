import { errorHandler, setupConfig } from "./api/routers";
import { Application } from "express";
import * as express from "express";
import config from "./config";
import { lazy } from "./utilities/lazy";

export async function startInternalServer() {

    console.log("Server Internal is starting");
    const app = application.get();
    const internalServer = require("http").createServer(app);

    app.use(errorHandler);

    return new Promise((resolve, reject) => {
        const port = config.internalServer.port;
        internalServer.listen(port, null, (err) => {
            if (err) {
                return reject(err);
            }
            resolve(internalServer);
            console.log("TodoList Internal API listening on " + port);
        });
    });
}

const application = lazy(() => {
    const app: Application = express();
    setupConfig(app, undefined);
    return app;
});
