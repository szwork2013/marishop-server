/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var idea = require('./idea.model');
var like = require('./like.model');

exports.register = function(io, socket) {

  idea.schema.post('save', function (doc) {

    idea.findById(doc._id).populate('_creator', {'name':1,'email':1})
    .exec(function (err, i) {
      onSave(socket, i);
    })
  });

  idea.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });

  socket.on("idea:like", function(data){
    var _liker = data._liker;
    var _idea = data._idea;

    idea.findOne({_id:_idea,liker:{$in:[_liker]}}).exec(function(err,data){

      if(data){ //기존에 liker인 경우
        idea.update({_id:_idea},{like:data.like-1, $pull:{liker:_liker}}).exec(function(err,_pull){
          console.log("liker not now");
          io.to("idea^"+_idea).emit('idea:like',{like:data.like-1,plus:false, liker:_liker});
        });
      }else{ //기존에 liker 아닌경우

        idea.update({_id:_idea},{ $inc:{like:1},$push:{liker:_liker}}).exec(function(err,_push){
          console.log("liker now");
          idea.findById(_idea).exec(function(err, result){
            io.to("idea^"+_idea).emit('idea:like',{like:result.like,plus:true, liker:_liker});
          });

        });
      }
    });

  });

  socket.on("idea:remove",function(_idea){
    //io.to("idea^"+_idea).emit('idea:remove',{_idea:_idea});

    socket.broadcast.to("idea^"+_idea).emit('idea:remove',{_idea:_idea});
  })

}



function onSave(socket, doc, cb) {
  socket.emit('idea:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('idea:remove', doc);
}