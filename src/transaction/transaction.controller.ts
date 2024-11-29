import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor() {}

}
