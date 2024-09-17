import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { DataSource, Repository } from 'typeorm';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';
import { ConfigService } from '@nestjs/config';
import { roleMasterData } from './data/role';
import { Role } from '#/role/entities/role.entity';
import { User } from '#/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { generateUserMasterData } from './data/user';
import { paymentMethodMasterData } from './data/payment_method';
import { PaymentMethod } from '#/payment_method/entities/payment_method.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private logger = new Logger(SeederService.name);

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async insertIfNotExist<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
    data: Entity[],
  ) {
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(data)
      .orIgnore()
      .execute();
  }

  private async updateOrInsert<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
    data: Entity[],
  ) {
    for (const datum of data) {
      await this.dataSource.manager.upsert(entity, datum, ['id']);
    }
  }

  async seeder() {
    const userMasterData = await generateUserMasterData();
    await this.updateOrInsert(Role,roleMasterData);
    await this.updateOrInsert(User,userMasterData);
    await this.updateOrInsert(PaymentMethod,paymentMethodMasterData);
  }

  async onApplicationBootstrap() {
    if (this.configService.get('env') === 'development') {
      await this.seeder();
      this.logger.log('Seeder run successfully');
    }
  }
}
