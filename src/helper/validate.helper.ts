import { Whitelist } from '../entities/interfaces/data/whitelist.interface';
import { whitelist } from '../entities/whitelists/whitelist.entity';

function validCheckInput(taskName: string, taskContent: string): boolean | string {
  return taskName !== null && taskContent !== null;
}

function validCheckID(id: string): boolean | string {
  return id !== null;
}

function isNotValidField(wh: Whitelist, fieldList: string): boolean {
  return !Object.keys(wh).includes(fieldList);
}

function validUpdatedFields(data: any): string[] {
  const errorFieldsUpdate: string[] = Object.keys(data).filter((key) => isNotValidField(whitelist.todo, key));
  return errorFieldsUpdate;
}

export {
  validCheckInput, validCheckID, isNotValidField, validUpdatedFields,
};
