import { Controller, Get,NotFoundException,Param, ParseUUIDPipe } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './entities/role.entity';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

   // Endpoint untuk mendapatkan semua role
   @Get()
   async getAllRole(): Promise<Role[]> {
     return this.roleService.getAllRole();
   }

   @Get(':id')
    async getRoleById(@Param('id', ParseUUIDPipe) id: string): Promise<Role> {
      try {
        const role = await this.roleService.getRoleById(id);
        return role;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new NotFoundException(`Role with ID ${id} not found`);
        }
        throw error;
      }
    }
}
