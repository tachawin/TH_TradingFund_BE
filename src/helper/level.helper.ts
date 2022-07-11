import { CustomerLevel } from '../entities/schemas/customer_level.schema';

const findLevel = (levelList: CustomerLevel[], totalDepositAmount: number, currentInvestment: number) => {
  const levels = {};
  const minimumDepositList = [];

  levelList.forEach((levelInfo) => {
    const {
      investmentAmount,
      levelName,
      imageURL,
      minimumDepositAmount,
      maximumDepositAmount,
      cashback,
    } = levelInfo;

    levels[minimumDepositAmount] = {
      investmentAmount,
      levelName,
      imageURL,
      minimumDepositAmount,
      maximumDepositAmount,
      cashback,
    };

    minimumDepositList.push(minimumDepositAmount);
  });

  minimumDepositList.sort((a, b) => a - b);

  let levelMinimumDeposit = 0;
  minimumDepositList.some((minimumDeposit) => {
    const { maximumDepositAmount, investmentAmount: minimumInvestmentAmount } = levels[minimumDeposit];

    const isNotExceedMaximumDepositAmount = totalDepositAmount <= maximumDepositAmount;
    const isNotBelowMinimumDepositAmount = totalDepositAmount >= minimumDeposit;
    const isNotBelowMinimumInvestAmount = currentInvestment >= minimumInvestmentAmount;

    const isTotalDepositInRange = isNotExceedMaximumDepositAmount
      && isNotBelowMinimumDepositAmount
      && isNotBelowMinimumInvestAmount;

    if (isTotalDepositInRange) {
      levelMinimumDeposit = minimumDeposit;

      return true;
    }

    return false;
  });

  return { ...levels[levelMinimumDeposit] };
};

export {
  findLevel,
};
