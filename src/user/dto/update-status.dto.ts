import { IsEnum, IsNotEmpty } from "class-validator";
import { StatusUser } from "../entities/user.entity";

export class UpdateStatusDto{
    @IsEnum(StatusUser, { message: 'Status must be either active or inactive' })
    @IsNotEmpty()
    status_user: StatusUser;  // Status user hanya bisa 'active' atau 'inactive'
}
