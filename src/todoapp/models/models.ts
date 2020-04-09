// import { SyncOptions } from "sequelize";
// import { getUserModel } from "./user";
 import { getUserSessionModel } from "./userSession";

export class Models {
 //   public static readonly userModel = getUserModel();
    public static readonly userSessionModel = getUserSessionModel();

    // noinspection JSUnusedGlobalSymbols
    // public static async sync(options: SyncOptions): Promise<void> {
    //     await this.userModel.sync(options);
    //     await this.userSessionModel.sync(options);
    // }
}
