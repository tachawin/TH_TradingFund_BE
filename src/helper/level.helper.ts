import { CustomerLevel } from '../entities/schemas/customer_level.schema';

const findLevel = (levelList: CustomerLevel[], totalDepositAmount: number) => {
  const levels = {};
  const minimumDepositList = [];

  levelList.forEach((levelInfo) => {
    const {
      levelName, imageURL, minimumDepositAmount, maximumDepositAmount, investmentAmount, cashback,
    } = levelInfo;
    levels[minimumDepositAmount] = {
      levelName, imageURL, minimumDepositAmount, maximumDepositAmount, investmentAmount, cashback,
    };
    minimumDepositList.push(minimumDepositAmount);
  });

  minimumDepositList.sort((a, b) => a - b);

  let levelMinimumDeposit = 0;
  minimumDepositList.some((minimumDeposit) => {
    const isTotalDepositInRange = (totalDepositAmount <= levels[minimumDeposit].maximumDepositAmount && totalDepositAmount >= minimumDeposit);
    // && with investmant amount after get API
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
