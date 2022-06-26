import bcrypt from 'bcryptjs';

export const hashing = (plaintext: string) => {
  const salt = bcrypt.genSaltSync(11);
  const hash = bcrypt.hashSync(plaintext, salt);

  return hash;
};

export const compareHashed = (plaintext: string, hashed: string) => {
  const matched = bcrypt.compareSync(plaintext, hashed);

  return matched;
};
