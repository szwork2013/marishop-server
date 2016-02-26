/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /Ideas              ->  index
 * POST    /Ideas              ->  create
 * GET     /Ideas/:id          ->  show
 * PUT     /Ideas/:id          ->  update
 * DELETE  /Ideas/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Idea = require('./idea.model');
var Reply = require('../reply/reply.model');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
var AWS = require('aws-sdk');
var uuid = require('node-uuid');

var CDN_URL ="http://d3na88nn7rq4zw.cloudfront.net/";

AWS.config.loadFromPath('server/config/config.json');

// Get list of Ideas
exports.index = function(req, res) {

  if(req.query.refresh){
    var first_id = req.query.first_id;
    var last_id = req.query.last_id;

    console.log(last_id);
    if(last_id!=""){
      find = {'_id':{$gte:last_id}};
    }
    Idea.find(find).populate('_creator', {'name':1,'email':1}).sort({date:-1})
    .exec(function (err, idea) {
      if(err) { return handleError(res, err); }
      if(!idea) { return res.status(404).send('Not Found'); }

      return res.json(idea);
    })
  }else{
    var last_id = req.query.last_id;
    var limit = req.query.limit;

    var find = {};

    if(last_id!=""){
      find = {'_id':{$lt:last_id}};
    }
    Idea.find(find).populate('_creator', {'name':1,'email':1}).limit(limit).sort({date:-1})
    .exec(function (err, idea) {
      if(err) { return handleError(res, err); }
      if(!idea) { return res.status(404).send('Not Found'); }

      return res.json(idea);
    })
  }


};


// Get a single Idea
exports.show = function(req, res) {
  Idea.findById(req.params.id).populate('_creator', {'name':1,'email':1})
  .exec(function (err, idea) {
    if(err) { return handleError(res, err); }
    if(!idea) { return res.status(404).send('Not Found'); }

    return res.json(idea);
  })
  //
  //Idea.findById(req.params.id, function (err, Idea) {
  //
  //  if(err) { return handleError(res, err); }
  //  if(!Idea) { return res.status(404).send('Not Found'); }
  //  return res.json(Idea);
  //});
};

// Creates a new Idea in the DB.
exports.create = function(req, res) {

  Idea.create(req.body, function(err, Idea) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(Idea);
  });
};

exports.upload = function(req, res) {

  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {

    var body = fields.body;
    var detail = fields.detail;
    var bg = fields.bg;
    var tags;
    if(fields.tags!=null&&fields.tags!=""){
      tags = fields.tags.split(",");
    }
    var _creator = fields._creator;
    var images = [];


    var fileCount = fields.fileCount;

    console.log(fileCount);

    filesSaver(fileCount, files, function(newPath, originalName, index){
      images.push({path:newPath,original:originalName});
      if(index==fileCount-1){//마지막 파일인 경우
        console.log("real save")
        var idea = {
          _creator:_creator,
          body:body,
          detail:detail,
          bg:bg,
          images:images,
          tags:tags
        }
        Idea.create(idea, function(err, Idea) {
          if(err) { return handleError(res, err); }
          console.log(Idea);
          return res.status(201).json(Idea);
        });
      }

    })

    //for (var i=0;i<fileCount; i++){
    //  if(files["fileField"+i]!==undefined){
    //
    //    var file = files["fileField"+i];
    //
    //    fileSaver(fileCount, i, file, function(err, newPath,originalName, index){
    //
    //      images.push({path:newPath,original:originalName});
    //      if(err){
    //        return res.status(201).json({result:false});
    //      }
    //      if(index==fileCount-1){//마지막 파일인 경우
    //        console.log("real save")
    //        var idea = {
    //          _creator:_creator,
    //          body:body,
    //          detail:detail,
    //          bg:bg,
    //          images:images,
    //          tags:tags
    //        }
    //        Idea.create(idea, function(err, Idea) {
    //          if(err) { return handleError(res, err); }
    //          console.log(Idea);
    //          return res.status(201).json(Idea);
    //        });
    //
    //      }
    //    });
    //
    //  }else{
    //    return res.status(201).json({result:false});
    //  }
    //}
  });
};


var fileExtension = function(filename){
  return filename.substr(filename.lastIndexOf('.'));
}
var filesSaver = function(fileCount, files, callback){
  var fileArray = [];
  for (var i=0;i<fileCount; i++) {
    if (files["fileField" + i] !== undefined) {
      var file = files["fileField" + i];
      var oldPath = file.path;
      var fileExt = fileExtension(file.name);
      var originalFileName = file.name;
      var uuidFileName = uuid.v4()+fileExt;

      var fileName = CDN_URL+uuidFileName;

      var fileObj= {oldPath:oldPath, uuidFileName:uuidFileName, file:file};
      fileArray.push(fileObj);

      callback(fileName,originalFileName, i);
      if(i==fileCount-1){
        actualFilsaveJob(fileArray);
      }
    }
  }
}

var actualFilsaveJob = function(fileArray){
  fileArray.forEach(function (file){
    var oldPath = file.oldPath;
    var uuidFileName = file.uuidFileName;

    fs.readFile(oldPath, function(err, data) {
      //uuid.v4() + '.png'

      var s3obj = new AWS.S3({params: {Bucket: 'marishop', Key: uuidFileName}});
      s3obj.upload({Body: data}).
      on('httpUploadProgress', function(evt) { console.log(evt); }).
      send(function(err, data) {

        fs.unlink(oldPath, function(err) {
          if(err) console.log("file unlink error: "+err);
        });
      });
    });

  });

}

var fileSaver = function(fileCount,index, file, callback){

  var oldPath = file.path;
  console.log(oldPath);
  var fileExt = fileExtension(file.name);
  var originalFileName = file.name;
  var uuidFileName = uuid.v4()+fileExt;

  var fileName = CDN_URL+uuidFileName;
  console.log(fileName);
  console.log(uuidFileName);
  //var newPath = __dirname + "/../../../client"+fileName;
  fs.readFile(oldPath, function(err, data) {
    //uuid.v4() + '.png'

    var s3obj = new AWS.S3({params: {Bucket: 'marishop', Key: uuidFileName}});
    s3obj.upload({Body: data}).
    on('httpUploadProgress', function(evt) { console.log(evt); }).
    send(function(err, data) {

      fs.unlink(oldPath, function(err) {
        if(err) console.log("file unlink error: "+err);
      });
      callback(err, fileName,originalFileName, index);
    });
  });
};


var fileRemover = function(removedFiles){

  for(var i=0 ; i< removedFiles.length;i++){
    console.log(i);
    var uuidFileName = removedFiles[i].path.replace(CDN_URL,"");
    console.log(uuidFileName);

    var s3obj = new AWS.S3();
    s3obj.deleteObject({Bucket: 'marishop', Key: uuidFileName}, function(err, data){
      console.log(err);
      if(err) return res.status(404).send('No Content');

    });
  }
}

// Updates an existing Idea in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }


  Idea.findById(req.params.id).populate('_creator', {'name':1,'email':1})
  .exec( function (err, idea) {
    console.log("here");
    console.log(req.body);
    if (err) { return handleError(res, err); }
    if(!idea) { return res.status(404).send('Not Found'); }

    idea.bg = req.body.bg;
    idea.body = req.body.body;
    idea.detail = req.body.detail;
    idea.tags = req.body.tags;
    idea.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(idea);
    });
  });
};

exports.updateWithFile = function(req, res){
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {

    var body = fields.body;
    var detail = fields.detail;
    var bg = fields.bg;

    var tags;
    if(fields.tags!=null&&fields.tags!=""){
      tags = fields.tags.split(",");
    }
    var _creator = fields._creator;
    var images = JSON.parse(fields.images);
    var removedFiles = JSON.parse(fields.removedFiles);
    var fileCount = fields.fileCount;

    fileRemover(removedFiles);

    var updateImages = [];

    for(var index=0 in images){
      if(images[index].original){
        updateImages.push(images[index]);
      }
    }
    if(fileCount>0){
      for (var i=0;i<fileCount; i++){
        if(files["fileField"+i]!==undefined){

          var file = files["fileField"+i];

          fileSaver(fileCount, i, file, function(err, newPath,originalName, index){
            updateImages.push({path:newPath,original:originalName});
            if(err){
              return res.status(201).json({result:false});
            }
            if(index==fileCount-1){//마지막 파일인 경우


              Idea.findById(req.params.id).populate('_creator', {'name':1,'email':1})
              .exec( function (err, idea) {


                if (err) { return handleError(res, err); }
                if(!idea) { return res.status(404).send('Not Found'); }

                idea.bg = bg;
                idea.body = body;
                idea.detail = detail;
                idea.tags =tags;
                idea.images =updateImages;

                idea.save(function (err) {
                  if (err) { return handleError(res, err); }
                  return res.status(200).json(idea);
                });
              });

            }
          });

        }
      }
    }else{
      Idea.findById(req.params.id).populate('_creator', {'name':1,'email':1})
      .exec( function (err, idea) {


        if (err) { return handleError(res, err); }
        if(!idea) { return res.status(404).send('Not Found'); }

        idea.bg = bg;
        idea.body = body;
        idea.detail = detail;
        idea.tags =tags;
        idea.images =updateImages;

        idea.save(function (err) {
          if (err) { return handleError(res, err); }
          return res.status(200).json(idea);
        });
      });
    }

  });
}

// Deletes a Idea from the DB.
exports.destroy = function(req, res) {
  Idea.findById(req.params.id, function (err, Idea) {
    if(err) { return handleError(res, err); }
    if(!Idea) { return res.status(404).send('Not Found'); }
    fileRemover(Idea.images);
    Idea.remove(function(err) {

      if(err) { return handleError(res, err); }

      Reply.find({ _idea:req.params.id }).remove().exec();

      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}