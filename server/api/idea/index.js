'use strict';

var express = require('express');
var controller = require('./idea.controller');
var auth = require('../../auth/auth.service');
var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.post('/upload', controller.upload);
router.put('/:id', controller.update);
router.put('/upload/:id', controller.updateWithFile);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;