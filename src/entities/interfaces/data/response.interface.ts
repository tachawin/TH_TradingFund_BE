import { Admin } from '../../schemas/admin.schema';

interface responseInterface {
  code: number
  errorCode?: string
  message: string
}

export type SuccessType = {
  success: responseInterface
}

export type ErrorType = {
  error: responseInterface
}

export type ResponseInterface =
   | String
   | Error
   | responseInterface
   | SuccessType
   | ErrorType
   | Admin
   | Admin[];

export type ResponseSelector =
   & String
   & Error
   & responseInterface
   & SuccessType
   & ErrorType
   & Admin
   & Admin[];
