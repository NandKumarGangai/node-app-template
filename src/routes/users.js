const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config/jwt.config');
const middleware = require('../middlewares/jwt.middleware');

const salt = bcrypt.genSaltSync(10);

const User = require('../models/users.model');
const Team = require('../models/teams.model');


router.get('/', middleware.checkToken, (req, res, next) => {
    User.find()
        .exec()
        .then((users) => {
            if (users.length >= 0) {
                res.status(200).json(users);
            } else {
                res.status(404).json({
                    message: 'No entries found',
                });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});

router.get('/:employeeId', middleware.checkToken, (req, res, next) => {
    User.find({ employeeId: req.params.employeeId })
        .exec()
        .then((users) => {
            if (users.length >= 0) {
                res.status(200).json(users[0]);
            } else {
                res.status(404).json({
                    message: 'No entries found',
                });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});

router.post('/signup', (req, res, next) => {
    const user = new User({
        _id: new mongoose.Types.ObjectId(),
        employeeId: req.body.employeeId,
        employeeFirstName: req.body.employeeFirstName,
        employeeLastName: req.body.employeeLastName,
        employeeEmail: req.body.employeeEmail,
        employeePassword: bcrypt.hashSync(req.body.employeePassword, salt),
        team: req.body.team,
        votesPolled: [],
        votesPending: [],
        role: 'User',
        isActive: 'No',
    });
    User.find({ employeeEmail: req.body.employeeEmail }).exec().then((data) => {
        if (data.length === 0) {
            user
                .save()
                .then(() => {
                    res.status(200).json({
                        success: true,
                        // message: 'User registered successfully',
                    });
                    Team
                        .findOneAndUpdate({ teamId: req.body.team },
                            { $push: { teamMembers: req.body.employeeId } })
                        .exec()
                        .then()
                        .catch((err) => {
                            console.log(err);
                            res.status(500).json({
                                error: err,
                            });
                        })
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).json({
                        error: err,
                    });
                })
        } else {
            res.status(201).json({
                success: false,
                message: 'User already exists',
            })
        }
    });
});

router.post('/login', (req, res, next) => {
    User.find({ employeeEmail: req.body.email })
        .exec()
        .then((users) => {
            if (users.length > 0) {
                if (bcrypt.compareSync(req.body.password, users[0].employeePassword) && users[0].isActive === 'Yes') {
                    const token = jwt.sign({ email: req.body.email },
                        config.secret,
                        {
                            expiresIn: '24h',
                        });
                    res.status(200).json({
                        success: true,
                        message: 'Success',
                        token,
                        user: users[0],
                    });
                } else {
                    res.status(201).json({
                        message: 'Email or Password incorrect',
                    });
                }
            } else {
                res.status(201).json({
                    message: 'Email or Password incorrect',
                });
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});

router.put('/activateUser/:employeeId', (req, res) => {
    User.findOneAndUpdate({ employeeId: req.params.employeeId },
        { isActive: 'No' ? 'Yes' : null })
        .exec()
        .then(() => {
            res.status(200).json({
                success: true,
                message: 'User is now active',
            })
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});

router.get('/pending/user', (req, res) => {
    User.find({ isActive: 'No', role: 'User' })
        .exec()
        .then((result) => {
            res.status(200).json(result)
        })
        .catch();
});

router.put('/edit/:employeeId', middleware.checkToken, (req, res) => {
    const { employeeId } = req.params;
    const updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    User.updateOne({ employeeId }, { $set: updateOps })
        .exec()
        .then((result) => {
            res.status(200).json(result);
        })
        .catch((err) => {
            res.json(err)
        });
});

router.put('/changePassword/:employeeId', middleware.checkToken, (req, res, next) => {
    User.findOneAndUpdate({ employeeId: req.params.employeeId },
        { employeePassword: bcrypt.hashSync(req.body.employeePassword, salt) })
        .exec()
        .then(() => {
            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            })
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                error: err,
            });
        });
});

router.get("/checkId/:empId", (req, res, next) => {
    const { empId } = req.params;
    User.find({ employeeId: empId })
        .exec()
        .then(result => {
            if (result.length > 0) {
                res.status(200).json({
                    message: 'Employee ID is already in use'
                })
            }
            else {
                res.status(200).json({
                    message: 'false'
                })
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.get("/checkEmail/:email", (req, res, next) => {
    const { email } = req.params;
    User.find({ employeeEmail: email })
        .exec()
        .then(result => {
            if (result.length > 0) {
                res.status(200).json({
                    message: 'Email ID is already in use'
                })
            }
            else {
                res.status(200).json({
                    message: 'false'
                })
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});


module.exports = router;
