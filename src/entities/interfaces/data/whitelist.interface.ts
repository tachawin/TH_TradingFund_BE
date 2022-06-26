interface Whitelist {
  [index: string]: { [key: string]: string }
}

interface Whitelists {
  [index: string]: Whitelist
}

export { Whitelists, Whitelist };
