import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function AtLeastOneField(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (target: Function) {
    registerDecorator({
      name: 'atLeastOneField',
      target,
      propertyName: '_atLeastOneField',
      constraints: [fields],
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const object = args.object as Record<string, unknown>;
          const fieldNames = args.constraints[0] as string[];

          return fieldNames.some((field) => object[field] !== undefined);
        },
      },
    });
  };
}
