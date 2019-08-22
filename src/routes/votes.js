const express = require('express');
const router = express.Router();
const moment = require('moment');
const config = require('../../config/jwt.config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const middleware = require('../middlewares/jwt.middleware');

const salt = bcrypt.genSaltSync(10);

const User = require('../models/users.model');
const Vote = require('../models/votes.model');
const Team = require('../models/teams.model');

router.get('/', (req, res, next) => {
    Vote.find()
        .exec()
        .then((votes) => {
            if (votes.length >= 0) {
                res.status(200).json(votes);
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

router.get('/:pollId', (req, res) => {
    Vote.find({ pollId: req.params.pollId })
        .exec()
        .then((votes) => {
            if (votes.length >= 0) {
                res.status(200).json(votes[0]);
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

router.put('/newVote/:pollId', middleware.checkToken, (req, res, next) => {
    const { pollId } = req.params;
    const voteObj = {
        employeeId: req.body.employeeId,
        optionId: req.body.optionId,
        votingTime: moment().unix(),
    }
    Vote.findOneAndUpdate({ pollId }, { $push: { voteResult: voteObj } })
        .exec()
        .then(result => res.status(200).json(result))
        .catch(err => console.log(err))
    User.updateOne({ employeeId: req.body.employeeId },
        { $pull: { votesPending: pollId }, $push: { votesPolled: pollId } }).exec()
        .then()
        .catch(err => console.log(err))
    res.status(200).json({
        success: true,
        message: 'Voting done successfully',
    })
});

router.get('/getResult/:pollId', (req, res, next) => {
    const { pollId } = req.params;
    Vote.aggregate([{ "$match": { "pollId": pollId } },
    { "$unwind": "$voteResult" },
    { "$group": { _id: "$voteResult.optionId", votes: { $sum: 1 } } },
    { "$project": { votes: 1 } },
    { "$sort": { _id: 1 } }
    ])
        .exec()
        .then((result) => {
            res.status(200).json(result);
        })
        .catch(err => console.log(err))
})

router.get('/stat/getAllVotes', (req, res, next) => {
    Vote.aggregate([{ "$unwind": "$voteResult" }, { "$project": { voteResult: 1 } }])
        .exec()
        .then(result => res.status(200).json(
            result.map(vote => vote.voteResult)
        ))
        .catch(err => console.log(err))
})

router.get('/stat/getVotesByTeam/:pollId', (req, res, next) => {
    const { pollId } = req.params;
    Vote.aggregate([{ "$match": { "pollId": pollId } }, { "$unwind": "$voteResult" }])
        .exec()
        .then((data) => {
            res.json(data.map(vote => vote.voteResult.employeeId + " " + vote.voteResult.optionId))
        })
        .catch(err => console.log(err))
})

module.exports = router;
