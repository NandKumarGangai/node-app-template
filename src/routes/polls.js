const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const uniqid = require('uniqid');
const moment = require('moment');
const config = require('../../config/jwt.config');
const middleware = require('../middlewares/jwt.middleware');

const salt = bcrypt.genSaltSync(10);

const User = require("../models/users.model");
const Poll = require("../models/polls.model");
const Vote = require("../models/votes.model");

router.get("/", (req, res, next) => {
    Poll.find()
        .exec()
        .then(polls => {
            if (polls.length >= 0) {
                res.status(200).json(polls);
            } else {
                res.status(404).json({
                    message: 'No entries found'
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.get("/:pollId", (req, res, next) => {
    Poll.find({ pollId: req.params.pollId })
        .exec()
        .then(polls => {
            if (polls.length >= 0) {
                res.status(200).json(polls[0]);
            } else {
                res.status(404).json({
                    message: 'No entries found'
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.post("/newPoll", middleware.checkToken, (req, res, next) => {
    const poll = new Poll({
        _id: new mongoose.Types.ObjectId(),
        pollId: uniqid.time(),
        pollQuestion: req.body.pollQuestion,
        pollOptions: req.body.pollOptions,
        pollStatus: "open",
        pollOpenDate: moment().format('L'),
        pollCloseDate: '',
        pollConductedForTeam: req.body.pollConductedForTeam
    });
    const vote = new Vote({
        _id: new mongoose.Types.ObjectId(),
        pollId: poll.pollId,
        voteResult: [],
    });
    vote.save()
        .then()
        .catch();
    poll
        .save()
        .then(() => {
            res.status(200).json({
                success: true,
                message: "Poll created successfully",
            });
            req.body.pollConductedForTeam.map(team => {
                User.update({ team: team },
                    { $push: { votesPending: poll.pollId } }, { multi: true })
                    .exec()
                    .then()
                    .catch(err => console.log(err))
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        })
});

router.put("/closePoll/:pollId", (req, res, next) => {
    const { pollId } = req.params;
    Poll.findOneAndUpdate({ pollId: pollId },
        { pollCloseDate: moment().format('L'), pollStatus: 'close' }
    ).exec()
        .then(() => {
            User.updateMany({},
                { $pull: { votesPending: pollId } },
                { multi: true }
            ).exec()
                .then()
                .catch(err => console.log(err))
            res.status(200).json({
                success: true,
                message: 'Poll closed successfully'
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        })
});

router.get("/teams/:pollId", (req, res, next) => {
    Poll.find({ pollId: req.params.pollId })
        .exec()
        .then(polls => {
            res.status(200).json(polls[0].pollConductedForTeam)
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.get("/getPollForId/:employeeId", (req, res, next) => {
    User.find({ employeeId: req.params.employeeId })
        .exec()
        .then(user => {
            Poll.aggregate([{ "$unwind": "$pollConductedForTeam" }, { "$match": { "pollConductedForTeam": user[0].team } },
            { "$sort": { pollOpenDate: -1 } }
            ])
                .exec()
                .then(result => res.status(200).json(result))
                .catch()
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.get("/getActivePolls/:employeeId", (req, res, next) => {
    User.find({ employeeId: req.params.employeeId })
        .exec()
        .then(user => {
            Poll.aggregate([{ "$unwind": "$pollConductedForTeam" }, { "$match": { "pollConductedForTeam": user[0].team } },
            { "$match": { "pollStatus": 'open' } },
            { "$sort": { pollOpenDate: -1 } }
            ])
                .exec()
                .then(result => res.status(200).json(result[0]))
                .catch()
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.get("/getOpenPoll/:status", (req, res, next) => {
    Poll.find({ pollStatus: req.params.status })
        .exec()
        .then(polls => {
            if (polls.length >= 0) {
                res.status(200).json(polls);
            } else {
                res.status(404).json({
                    message: 'No polls found'
                });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
})

module.exports = router;