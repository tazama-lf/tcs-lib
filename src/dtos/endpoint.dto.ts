import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { TransactionType, HttpMethod, ContentType } from '../interfaces/core.interfaces';

export class CreateEndpointDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsEnum(HttpMethod)
  method!: HttpMethod;

  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  samplePayload!: string;

  @IsEnum(ContentType)
  contentType!: ContentType;
}

export class InferSchemaDto {
  @IsString()
  @IsNotEmpty()
  payload!: string;

  @IsEnum(ContentType)
  contentType!: ContentType;
}
