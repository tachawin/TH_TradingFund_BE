export function hideMobileNumber(mobileNumber: string):string {
  return mobileNumber.replace(mobileNumber.substring(0, 6), 'XXXXXX');
}
