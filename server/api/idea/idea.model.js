'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var likerSchema = mongoose.Schema({
  _liker : { type: Schema.ObjectId, ref: 'User' }
}, {_id: false});

var IdeaSchema = new Schema({
  _creator : { type: Schema.ObjectId, ref: 'User' },
  body: {type: String, required: true, trim: true}, // channel
  detail: {type: String, trim: true}, // channel
  bg: {type: String}, // channel
  like: {type: Number, default : 0}, // channel
  liker:[],
  comment:{type:Number, default:0},
  date: {type: Date, default: Date.now}, // created
  images : [],
  tags : []
});

module.exports = mongoose.model('Idea', IdeaSchema);