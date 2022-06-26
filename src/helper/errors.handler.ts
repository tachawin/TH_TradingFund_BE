import { FastifyReply } from 'fastify';

import { STANDARD_ERROR } from '../entities/constants/errors';
import { ResponseInterface } from '../entities/interfaces/data/response.interface';

export function LError(message: string, parentErr?: Error): Error {
  const err = parentErr ? new Error(`${message};  ${parentErr.message}.`) : new Error(`${message};`);

  console.error(err);

  return err;
}

export function SError(errorCode: string): Error {
  if (!(errorCode in STANDARD_ERROR)) {
    return new Error('something wrong, something went wrong, standard error code not exist, you should contact to admin');
  }

  const err = new Error(`[errorCode]:${errorCode}:${STANDARD_ERROR[errorCode].message}`);

  console.error(err);

  return err;
}

async function reply(data: ResponseInterface, replying: FastifyReply) {
  replying.header('Content-Type', 'application/json;charset=utf-8').code(200);

  if ('error' in data && 'code' in data.error) {
    replying.code(data.error.code);

    return;
  }

  if ('success' in data) {
    replying.code(data.success.code);
  }
}

export default { reply };
