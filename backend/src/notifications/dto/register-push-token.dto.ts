import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PushPlatform } from '../notification.enum';

export class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  

  @IsEnum(PushPlatform)
  platform!: PushPlatform;
}