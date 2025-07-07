import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

@InputType()
export class CreateTrayDto {
  @Field()
  @IsString()
  @MaxLength(100)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;
}