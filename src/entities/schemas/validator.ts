export const validateFeatureAccessLevel = {
  validator(value: string): boolean {
    return value.length === 4;
  },
  message: '{VALUE} format invalid, it should be { xxxx | x is 1 or 0 }',
};

export const validateMobileNumber = {
  validator(value: string): boolean {
    if (value === '') return true;

    return /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(value);
  },
  message: '{VALUE} is not a valid 10 digit number',
};
