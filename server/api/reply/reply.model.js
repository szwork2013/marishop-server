'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
//
//var userSchema = mongoose.Schema({
//  _creator : { type: Schema.ObjectId, ref: 'User' },
//  comment: {type: String, required: true, trim: true}, // channel
//  like: {type: Number, default : 0}, // channel
//  date: {type: Date, default: Date.now}
//}, {_id: false});
//
//var ReplySchema = new Schema({
//  _idea : { type: String, required: true },
//  replies:[userSchema]
//});

var RecommentSchema = new Schema({
  recommenter:{type:String},
  recommenter_name:{type:String},
  recomment:{type:String},
  date: {type: Date, default: Date.now}
})

var ReplySchema = new Schema({
  _creator : { type: Schema.ObjectId, ref: 'User' },
  _idea : { type: String, required: true },
  comment: {type: String, required: true, trim: true}, // channel
  recomment:[RecommentSchema],
  like: {type: Number, default : 0}, // channel
  liker:[],
  date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Reply', ReplySchema);