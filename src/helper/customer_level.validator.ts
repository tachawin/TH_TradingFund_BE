import { SError } from './errors.handler';

const NAME_LENGTH_MAXIMUM = 120;

function nameValidate(name: string): [boolean, string] {
  const isValid = name.length < NAME_LENGTH_MAXIMUM;

  return [isValid, 'ERR.CUSTOMERLEVEL.NAME.1'];
}

function minimumDepositAmountValidate(minimumDepositAmount: number): [boolean, string] {
  const isValid = minimumDepositAmount >= 0;

  return [isValid, 'ERR.CUSTOMERLEVEL.MINIMUMDEPOSITAMOUNT.1'];
}

function maximumDepositAmountValidate(maximumDepositAmount: number): [boolean, string] {
  const isValid = maximumDepositAmount >= 0;

  return [isValid, 'ERR.CUSTOMERLEVEL.MAXIMUMDEPOSITAMOUNT.1'];
}

function investmentAmountValidate(investmentAmount: number): [boolean, string] {
  const isValid = investmentAmount >= 0;

  return [isValid, 'ERR.CUSTOMERLEVEL.INVESTMENTAMOUNT.1'];
}

function cashbackValidate(cashback: number): [boolean, string] {
  const isValid = cashback >= 0;

  return [isValid, 'ERR.CUSTOMERLEVEL.CASHBACK.1'];
}

const FIELDS_UPDATE_VALIDATOR = {
  levelName: nameValidate,
  imageURL: () => [true, ''],
  minimumDepositAmount: minimumDepositAmountValidate,
  maximumDepositAmount: maximumDepositAmountValidate,
  investmentAmount: investmentAmountValidate,
  cashback: cashbackValidate,
};

export function customerLevelInformationUpdateValidate(infoChange: any) {
  Object.keys(infoChange).forEach((field) => {
    if (!(field in FIELDS_UPDATE_VALIDATOR)) {
      throw SError('ERR.CUSTOMERLEVEL.UPDATE.WHITELIST.FIELD');
    }

    const validator = FIELDS_UPDATE_VALIDATOR[field];
    const [isValid, errorCode] = validator(infoChange[field]);
    if (!isValid) {
      throw SError(errorCode);
    }
  });
}
