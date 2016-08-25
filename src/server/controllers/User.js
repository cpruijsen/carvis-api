import { User } from '../models/User';
import { redisSetHash, redisHashGetAll, redisHashGetOne, redisSetKey, redisSetKeyWithExpire, redisGetKey, redisDelete } from './../../redis/redisHelperFunctions';

export const getUserDashboardData = (req, res) => {
  let userId = req.params.userid;
  redisHashGetAll(userId, user => {
    if (user) {
      console.log('found user in redis, getUserDashboardData', user);
      res.json(user);
      // NOTE: redis returns the encrypted version.
      // do we depend on a decrypted version anywhere?
      // ie. lyftToken ?
    } else {
      console.log('no redis - doing db fetch getUserDashboardData');
      User.find({ id: userId })
        .then((user) => user.length === 0 ? res.json({}) : res.json([User.decryptModel(user[0])]))
        .catch((err) => res.status(400)
          .json(err));
    }
  });
};

export const updateUserData = (req, res) => {
  let userId = req.params.userid;
  let redisKeyValArray = [];
  let newKeys = Object.keys(req.body);
  for (let i = 0, len = newKeys.length; i < len; i++) {
    redisKeyValArray.push(newKeys[i]);
    redisKeyValArray.push(req.body[newKeys[i]]);
  }
  console.log('redisKeyValArray', userId, redisKeyValArray);
  // update redis, and after updating redis, update the DB.
  redisSetHash(userId, redisKeyValArray, result => {
    User.update({ id: userId }, req.body)
      .then((user) => user.length === 0 ? res.json({}) : res.json(user))
      .catch((err) => res.status(400)
        .json(err));
  });
};

export const createUser = (req, res) => {
  User.create(req.body)
    .then((user) => {
      // add user to redis only after successful DB add
      let userId = user[0].id; // Carvis userId
      console.log(user[0]);
      let redisKeyValArray = [];
      for (let key in user[0]) {
        redisKeyValArray.push(key);
        redisKeyValArray.push(user[0][key]);
      }
      redisSetHash(userId, redisKeyValArray, result => {
        user.length === 0 ? res.json({}) : res.json(user);
      });
    })
    .catch((err) => res.status(400)
      .json(err));
};

export const getAllUserData = (req, res) => {
  User.findAll()
    .then(users => {
      console.log('users in getAllUserData', users);
      users.length === 0 ? res.json({}) : res.json(User.decryptCollection(users));
    })
    .catch(err => res.status(400)
      .json(err));
};

export const rawUserData = (req, res) => {
  User.findAll()
    .then(users => res.json(users))
    .catch(err => res.status(400)
      .json(err));
};

// note: if not found in redis, and not in db, it is created in DB, however, on that action we don't also add to Redis (todo?)
export const findOrCreateUser = (req, res) => {
  let userId = req.body.userId || req.body.id; // format?
  redisHashGetAll(userId, user => {
    if (user) {
      res.json(User.decryptModel(user)); // store encrypted in redis.
    } else {
      User.findOrCreate(req.body)
        .then((user) => user.length === 0 ? res.json({}) : res.json(User.decryptModel(user)))
        .catch((err) => res.status(400)
          .json(err));
    }
  });
};

// TODO - redis for lyft/uber signup! very important.
export const updateOrCreateUser = (req, res) => {
  let firstParam = Object.keys(req.body)[0];
  User.updateOrCreate({
      [firstParam]: req.body[firstParam]
    }, req.body)
    .then((user) => {
      return user.length === 0 ? res.json({}) : res.json(User.decryptModel(user[0]));
    })
    .catch((err) => res.status(400)
      .json(err));
};

export const deleteUser = (req, res) => {
  let userId = req.params.userid;

  // in this case we want to delete both from redis and the DB.
  redisDelete(userId, user => {
    if (user) {
      console.log('success delete', userId, user);
    } else {
      console.log('user was not in redis', userId, user);
    }
    User.remove({ id: userId })
      .then((user) => user.length === 0 ? res.json({}) : res.json(User.decryptModel(user[0])))
      .catch((err) => res.status(400)
        .json(err));
  });
};

export const getRawUser = (req, res) => {
  User.find({ id: req.params.userid })
    .then((user) => user.length === 0 ? res.json({}) : res.json(user))
    .catch((err) => res.status(400)
      .json(err));
};

// what is this? @alex?
function handleUserReturn(modelResults, req, res) {

}
