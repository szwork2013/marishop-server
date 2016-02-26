/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /Replys              ->  index
 * POST    /Replys              ->  create
 * GET     /Replys/:id          ->  show
 * PUT     /Replys/:id          ->  update
 * DELETE  /Replys/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Reply = require('./reply.model');
var Idea = require('../idea/idea.model');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');


// Get list of Replys
exports.index = function(req, res) {

  Reply.find({_idea:req.params.id}).populate('_creator', {'name':1,'email':1}).sort({date:-1})
  .exec(function (err, idea) {
    if(err) { return handleError(res, err); }
    if(!idea) { return res.status(404).send('Not Found'); }

    return res.json(idea);
  })
};

// Get a single Reply
exports.show = function(req, res) {



  Reply.find({_idea:req.params.id}).populate('_creator', {'name':1,'email':1}).sort({date:1})
  .exec(function (err, idea) {
    if(err) { return handleError(res, err); }
    if(!idea) { return res.status(404).send('Not Found'); }

    return res.json(idea);
  })
  //
  //Reply.findById(req.params.id, function (err, Reply) {
  //
  //  if(err) { return handleError(res, err); }
  //  if(!Reply) { return res.status(404).send('Not Found'); }
  //  return res.json(Reply);
  //});
};

// Creates a new Reply in the DB.
exports.create = function(req, res) {
  req.body._creator = req.user._id;
  Idea.update({_id:req.body._idea},{ $inc:{comment:1}}).exec(function(err,_push){});
  Reply.create(req.body, function(err, reply) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(reply);
  });
};

exports.createRecomment = function(req, res){
  var _id = req.params.id;
  var recomment = {recommenter:req.user.id,recommenter_name:req.user.name, recomment:req.body.recomment}

  Reply.findById(_id, function (err, reply) {
    if (err) { return handleError(res, err); }
    if(!reply) { return res.status(404).send('Not Found'); }

    reply.recomment.push(recomment);

    reply.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(reply);
    });
  });
}


exports.removeRecomment = function(req, res){
  var _id = req.params.id;
  var _recomment = req.query._recomment;

  console.log(_id);
  console.log("_recomment:"+_recomment);

  Reply.findById(_id, function (err, reply) {
    if (err) { return handleError(res, err); }
    if(!reply) { return res.status(404).send('Not Found'); }

    reply.recomment.forEach(function(a,b){

      if(a._id==_recomment){
        reply.recomment.splice(b,1);
        reply.save(function (err) {
          if (err) { return handleError(res, err); }
          return res.status(200).json(reply);
        });
      }
    })
  });
}



// Updates an existing Reply in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  console.log(req.body);
  Reply.findById(req.params.id, function (err, reply) {
    if (err) { return handleError(res, err); }
    if(!reply) { return res.status(404).send('Not Found'); }

    reply.comment = req.body.comment;

    reply.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(reply);
    });
  });
};

// Deletes a Reply from the DB.
exports.destroy = function(req, res) {

  Reply.findById(req.params.id, function (err, reply) {
    if(err) { return handleError(res, err); }
    if(!reply) { return res.status(404).send('Not Found'); }

    Idea.update({_id:req.query._idea},{ $inc:{comment:-1}}).exec(function(err,_push){});
    reply.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(200).json(reply);
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}