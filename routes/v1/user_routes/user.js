const express = require('express');
const router = express.Router();

const UserController = require('../../../controllers/user');

router.post('/users', UserController._createUser);

router.get('/users', UserController._getAllUsers);

router.get('/users/:userId', UserController._getUserById);

router.get('/users-by-ids', UserController._getUsersByIds);

router.get('/get-user-by-role', UserController._getUsersByNameAndRole);

router.put('/users/:id', UserController._updateUserByIdOrEmail);

router.put('/users/updatePassword/:userId', UserController._updateUserPasswordById);

router.delete('/users/:userId', UserController._deleteUserById);

router.get('/users/exists/:email', UserController._checkUserByEmail);

router.get('/users/supplier-exists/:email', UserController._checkSupplierByEmail);

//Create User with status and acknowlege the user creation to make the user functional
router.post('/users/create-with-ack', UserController._createUserV2);

//Acknowlege already created user and send an email this new user
router.put('/users/acknowledge/:id', UserController._acknowledgeUserAndSendOnboardingMail);

router.put('/users/:userId/update-notification-tokens', UserController._updateNotificationTokens);

router.post('/users/:userId/delete-notification-tokens', UserController._deleteNotificationTokens);

module.exports = router;
