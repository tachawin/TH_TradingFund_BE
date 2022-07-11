import {
  connect, connection, Connection, ConnectOptions,
} from 'mongoose';

import config from '../config/config';

class MongoAdapter {
  private database: Connection;
  private URI: string;

  private _required = {
    isAuth: config.db.mongo.required.isAuth,
  };

  private info = {
    protocol: config.db.mongo.protocol,
    username: config.db.mongo.username,
    password: config.db.mongo.password,
    host: config.db.mongo.host,
    database: config.db.mongo.database,
    options: config.db.mongo.options,
  };

  constructor() {
    this.URI = this.createURI();

    connect(this.URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);

    this.database = connection;
    this.database.on('open', this.connected);
    this.database.on('error', this.error);
  }

  private connected() {
    console.info('[MongoAdapter.connected]: Mongoose has connected 🎉');
  }

  private error(error: Error) {
    console.error('[MongoAdapter.connected]: ', error);

    throw error;
  }

  private createURI() {
    const {
      protocol, username, password, host, database, options,
    } = this.info;

    if (this._required.isAuth) {
      return `${protocol}://${username}:${password}@${host}/${database}${options}`;
    }

    return `${protocol}://${host}/${database}${options}`;
  }
}

export default MongoAdapter;
