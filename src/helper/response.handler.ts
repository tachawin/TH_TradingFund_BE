import { FastifyReply } from 'fastify';

import { ResponseInterface, SuccessType, ErrorType } from '../entities/interfaces/data/response.interface';

import errorHandler from './errors.handler';
import parseResponse from './response.parser';

export async function responseSender(data: ResponseInterface | SuccessType | ErrorType, reply: FastifyReply): Promise<void> {
  await errorHandler.reply(data, reply);

  reply.send(data);
}

async function responseHandler(next: Function, reply: FastifyReply): Promise<void> {
  try {
    const data = await next();

    responseSender(parseResponse(data), reply);
  } catch (error) {
    responseSender(parseResponse(error), reply);
  }
}

export default responseHandler;
