/**
 * Routes for the project type
 */
const express = require('express');
const router = express.Router();

const ProjectTypeController = require('../../../controllers/project-type');

router.post('/project-type', ProjectTypeController._createProjectType);

router.get('/project-type', ProjectTypeController._getAllProjectTypes);

router.get('/project-type/:projectTypeId', ProjectTypeController._getProjectTypeById);

router.put('/project-type/:projectTypeId', ProjectTypeController._updateProjectTypeById);

router.delete('/project-type/:projectTypeId', ProjectTypeController._deleteProjectTypeById);

module.exports = router;