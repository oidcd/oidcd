"use strict";

const unixTimestamp = require("../util/unix_timestamp");
const grantConstant = require("../constant/grant");

let storage = null;

module.exports = class Store {
  constructor(model) {
    this.model = model;
    if (storage === null) {
      storage = require("./in_memory")();
    }
  }

  key(id) {
    return `${this.model}:${id}`;
  }

  grantIdKey(id) {
    return `${grantConstant.GRANT_ID_KEY_PREFIX}:${id}`;
  }
  sessionUidKey(uid) {
    return `${grantConstant.GRANT_SESSION_UID_KEY_PREFIX}:${uid}`;
  }

  userCodeKey(userCode) {
    return `${grantConstant.GRANT_USER_CODE_KEY_PREFIX}:${userCode}`;
  }

  async destroy(id) {
    const key = this.key(id);
    storage.delete(key);
  }

  async consume(id) {
    storage.get(this.key(id)).consumed = unixTimestamp();
  }

  async find(id) {
    return storage.get(this.key(id));
  }

  async findByUid(uid) {
    const id = storage.get(this.sessionUidKey(uid));
    return this.find(id);
  }

  async findByUserCode(userCode) {
    const id = storage.get(this.userCodeKey(userCode));
    return this.find(id);
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);

    if (this.model === "Session") {
      storage.set(this.sessionUidKey(payload.uid), id, expiresIn * 1000);
    }

    const { grantId, userCode } = payload;
    if (grantConstant.GRANTABLE.has(this.name) && grantId) {
      const grantKey = this.grantIdKey(grantId);
      const grant = storage.get(grantKey);
      if (!grant) {
        storage.set(grantKey, [key]);
      } else {
        grant.push(key);
      }
    }

    if (userCode) {
      storage.set(this.userCodeKey(userCode), id, expiresIn * 1000);
    }

    storage.set(key, payload, expiresIn * 1000);
  }

  async revokeByGrantId(grantId) {
    // eslint-disable-line class-methods-use-this
    const grantKey = this.grantIdKey(grantId);
    const grant = storage.get(grantKey);
    if (grant) {
      grant.forEach((token) => storage.delete(token));
      storage.delete(grantKey);
    }
  }
};

module.exports.setStorage = (store) => {
  storage = store;
};
