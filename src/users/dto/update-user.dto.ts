import { PartialType } from '@nestjs/swagger';
import { AtLeastOneField } from '../validators/at-least-one-field.validator.js';
import { UserFieldsDto } from './user-fields.dto.js';
@AtLeastOneField(['login', 'email', 'age', 'about'])
export class UpdateUserDto extends PartialType(UserFieldsDto, {
  skipNullProperties: false,
}) {}
