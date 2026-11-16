import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export const MAX_DB_ID = 2_147_483_647;

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = /^\d+$/.test(value) ? Number(value) : NaN;

    if (!Number.isInteger(id) || id < 1 || id > MAX_DB_ID) {
      throw new BadRequestException(
        `id must be an integer between 1 and ${MAX_DB_ID}`,
      );
    }

    return id;
  }
}
