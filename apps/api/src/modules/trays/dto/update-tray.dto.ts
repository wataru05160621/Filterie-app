import { InputType, PartialType } from '@nestjs/graphql';
import { CreateTrayDto } from './create-tray.dto';

@InputType()
export class UpdateTrayDto extends PartialType(CreateTrayDto) {}