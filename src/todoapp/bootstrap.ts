import { Container } from "inversify";
import { Services } from "./services/services";
import { UsersService } from "./services/usersService";

const container: Container = new Container();


container.bind<UsersService>(Services.Users).to(UsersService).inSingletonScope();

export { container };
