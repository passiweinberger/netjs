var pwd = require('couch-pwd');
var ms = require('ms');

var util = require('../util/util.js');
var levelup = require('../util/db.levelup.js');

/**
 * Adapter constructor function.
 *
 * @example
   var Adapter = require('lockit-mongodb-adapter');
   var config = require('./config.js');
   var adapter = new Adapter(config);
 *
 * @param {Object} config - Lockit configuration
 * @constructor
 */
var Adapter = module.exports = function (config, dboptions) {

	if (!(this instanceof Adapter)) return new Adapter(config, dboptions);

	this.config = config;

	if (dboptions.backend == 'memdown')
		this.db = levelup({db:require('memdown'), valueEncoding: 'json'});
	else
		this.db = levelup("users", { valueEncoding: 'json'});
};




/**
 * Create new user.
 *
 * @example
   adapter.save('john', 'john@email.com', 'secret', function(err, user) {
     if (err) console.log(err);
     console.log(user);
     // {
     //  name: 'john',
     //  email: 'john@email.com',
     //  signupToken: 'ef32a95a-d6ee-405a-8e4b-515b235f7c54',
     //  signupTimestamp: Wed Jan 15 2014 19:08:27 GMT+0100 (CET),
     //  signupTokenExpires: Wed Jan 15 2014 19:08:27 GMT+0100 (CET),
     //  failedLoginAttempts: 0,
     //  salt: '48cf9da376703199c30ba5c274580c98',
     //  derived_key: '502967e5a6e55091f4c2c80e7989623f051070fd',
     //  _id: 52d6ce9b651b4d825351641f
     // }
   });
 *
 * @param {String} name - User name
 * @param {String} email - User email
 * @param {String} pw - Plain text user password
 * @param {Function} done - Callback function `function(err, user){}`
 */
Adapter.prototype.save = function (name, email, pw, done) {
	var that = this;

	var now = new Date(); //moment().toDate();
	var timespan = ms(that.config.signup.tokenExpiration);
	var future = new Date(new Date().getTime() + timespan);//  moment().add(timespan, 'ms').toDate();

	var user = {
		name: name,
		email: email,
		signupToken: util.uuid()+util.uuid(),
		//signupToken: uuid.v4(),
		signupTimestamp: now,
		signupTokenExpires: future,
		failedLoginAttempts: 0
	};

	// create salt and hash
	pwd.hash(pw, function (err, salt, hash) {
		if (err) return done(err);
		user.salt = salt;
		user.derived_key = hash;
		that.db.set(user.name, user, function(err, u) {
			if (err) {
				return done(err);
			}
			return done(null, u);
		});
	});
};



/**
 * Find user. Match is either `'name'`, `'email'` or `'signupToken'`.
 *
 * @example
   adapter.find('name', 'john', function(err, user) {
     if (err) console.log(err);
     console.log(user);
     // {
     //   name: 'john',
     //   email: 'john@email.com',
     //   signupToken: '3a7f0f54-32f0-44f7-97c6-f1470b94c170',
     //   signupTimestamp: Fri Apr 11 2014 21:31:54 GMT+0200 (CEST),
     //   signupTokenExpires: Sat Apr 12 2014 21:31:54 GMT+0200 (CEST),
     //   failedLoginAttempts: 0,
     //   salt: '753981e8d8e30e8047cf5685d1f0a0d4',
     //   derived_key: '18ce03eddab6729aeaaf76729c90cb31f16a863c',
     //   _id: 5348432a98a8a6a4fef1f595
     // }
   });
 *
 * @param {String} match - Property to find user by. `'name'`, `'email'` or `'signupToken'`
 * @param {String} query - Corresponding value to `match`
 * @param {Function} done - Callback function `function(err, user){}`
 */
Adapter.prototype.find = function (key, value, done) {

	this.db.getAllByFieldValue(key, value, function(err, users) {
		if (err)
			return done(err);
		if (users.length > 0)
			return done(null, users[0]);
		return done(null, null);
	});
};



/**
 * Update existing user.
 *
 * @example
   // get user from db
   adapter.find('name', 'john', function(err, user) {
     if (err) console.log(err);

     // add some new properties
     user.newKey = 'and some value';
     user.hasBeenUpdated = true;

     // save updated user to db
     adapter.update(user, function(err, user) {
       if (err) console.log(err);
       // ...
     });
   });
 *
 * @param {Object} user - Existing user from db
 * @param {Function} done - Callback function `function(err, user){}`
 */
Adapter.prototype.update = function (user, done) {

	this.db.set(user.name, user, function(err, u) {
		if (err) {
			return done(err);
		}
		return done(null, u);
	});
}


/**
 * Delete existing user.
 *
 * @example
   adapter.remove('john', function(err, res) {
     if (err) console.log(err);
     console.log(res);
     // true
   });
 *
 * @param {String} name - User name
 * @param {Function} done - Callback function `function(err, res){}`
 */
Adapter.prototype.remove = function (name, done) {
	this.db.remove(name, function(err) {
		if (err)
			return done(err);
		return done(null, true);
	});
};
