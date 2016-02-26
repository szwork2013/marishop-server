'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LikeSchema = new Schema({
  _liker : { type: Schema.ObjectId, ref: 'User' },
  _idea : { type: String, required: true },
  comment: {type: String, required: true, trim: true}, // channel
  like: {type: Number, default : 0}, // channel
  date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Like', LikeSchema);