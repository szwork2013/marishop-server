/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var reply = require('./reply.model');
var idea = require('../idea/idea.model');

exports.register = function(io, socket) {

  //reply.schema.post('save', function (doc) {
  //
  //  reply.findById(doc._id).populate('_creator', {'name':1,'email':1})
  //  .exec(function (err, i) {
  //    onSave(io, socket, i);
  //  })
  //
  //
  //});
  //reply.schema.post('remove', function (doc) {
  //  onRemove(io, socket, doc);
  //});


  socket.on("idea:detail", function(info){
    if(info.before!=info.current){
      socket.leave(info.before);
    }

    socket.join(info.current);

    console.log(socket.rooms);

  });

  socket.on("reply:save",function(info){
    console.log("emit reply:save");
    var _id = info._id;
    var _idea = info._idea;

    reply.findById(_id).populate('_creator', {'name':1,'email':1})
    .exec(function (err, doc) {
      io.sockets.in("idea^"+_idea).emit('reply:save', doc);
    })
  });

  socket.on("reply:remove",function(info){
    console.log("emit reply:remove");
    var _id = info._id;
    var _idea = info._idea;
    io.sockets.in("idea^"+_idea).emit('reply:remove', info);

  });

  socket.on("reply:like", function(data){
    console.log("on reply like");
    console.log(data);
    var _liker = data._liker;
    var _idea = data._idea;
    var _id = data._id;

    reply.findOne({_id:_id,liker:{$in:[_liker]}}).exec(function(err,data){

      console.log(data);
      if(data){ //기존에 liker인 경우
        reply.update({_id:_id},{like:data.like-1, $pull:{liker:_liker}}).exec(function(err,_pull){
          console.log("liker not now");
          io.to("idea^"+_idea).emit('reply:like',{like:data.like-1,plus:false, liker:_liker,_id:_id});
        });
      }else{ //기존에 liker 아닌경우

        reply.update({_id:_id},{ $inc:{like:1},$push:{liker:_liker}}).exec(function(err,_push){
          console.log("liker now");
          reply.findById(_id).exec(function(err, result){
            io.to("idea^"+_idea).emit('reply:like',{like:result.like,plus:true, liker:_liker,_id:_id});
          });

        });
      }
    });

  });

}
//
//function onSave(io,socket, doc, cb) {
//  //socket.emit('reply:save', doc);
//
//  socket.broadcast.to("idea^"+doc._idea).emit('reply:save', doc);
//  //io.sockets.in(doc._id).emit('reply:save',doc);
//}
//
//function onRemove(io, socket, doc, cb) {
//  io.sockets.in(doc._id).emit('reply:remove',doc);
//}