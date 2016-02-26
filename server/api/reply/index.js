'use strict';

var express = require('express');
var controller = require('./reply.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', controller.index);
router.get('/:id',auth.isAuthenticated(), controller.show);
router.post('/',auth.isAuthenticated(), controller.create);
router.post('/recomment/:id',auth.isAuthenticated(), controller.createRecomment);
router.delete('/recomment/:id',auth.isAuthenticated(), controller.removeRecomment);
router.put('/:id',auth.isAuthenticated(), controller.update);
router.patch('/:id', controller.update);
router.delete('/:id',auth.isAuthenticated(), controller.destroy);

module.exports = router;