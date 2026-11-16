import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const PROPERTY_NAME = '_atLeastOneField';

export function AtLeastOneField(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (target: Function) {
    registerDecorator({
      name: 'atLeastOneField',
      target,
      propertyName: PROPERTY_NAME,
      constraints: [fields],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (value !== undefined) {
            return false;
          }

          const object = args.object as Record<string, unknown>;
          const fieldNames = args.constraints[0] as string[];

          return fieldNames.some((field) => object[field] !== undefined);
        },
        defaultMessage(args: ValidationArguments) {
          if (args.value !== undefined) {
            return `property ${PROPERTY_NAME} should not exist`;
          }

          const fieldNames = args.constraints[0] as string[];
          return `At least one field (${fieldNames.join(', ')}) must be provided`;
        },
      },
    });
  };
}
