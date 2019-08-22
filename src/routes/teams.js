const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const uniqid = require('uniqid');

const Team = require('../models/teams.model');

router.get('/', (req, res, next) => {
  Team.find()
    .exec()
    .then((teams) => {
      if (teams.length >= 0) {
        res.status(200).json(teams);
      } else {
        res.status(404).json({
          message: 'No team found',
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

router.get('/teamNames', (req, res, next) => {
  Team.find({}, { teamName: 1, teamId: 1, _id: 0 })
    .exec()
    .then((teams) => {
      if (teams.length >= 0) {
        res.status(200).json(teams);
      } else {
        res.status(404).json({
          message: 'No team found',
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

router.get('/:teamId', (req, res, next) => {
  Team.find({ teamId: req.params.teamId })
    .exec()
    .then((teams) => {
      if (teams.length >= 0) {
        res.status(200).json(teams[0].teamName);
      } else {
        res.status(404).json({
          message: 'No team found',
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

router.get('/getMembers/:teamId', (req, res, next) => {
  Team.find({ teamId: req.params.teamId })
    .exec()
    .then((teams) => {
      if (teams.length >= 0) {
        res.status(200).json(teams[0].teamMembers);
      } else {
        res.status(404).json({
          message: 'No team found',
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

router.post('/teamEntry', (req, res, next) => {
  const team = new Team({
    _id: new mongoose.Types.ObjectId(),
    teamId: uniqid.time(),
    teamName: req.body.teamName,
    teamMembers: [],
  });
  Team
    .find({ teamName: req.body.teamName })
    .exec()
    .then((data) => {
      if (data.length === 0) {
        team
          .save()
          .then(() => {
            res.status(200).json({
              success: true,
              message: 'Team entered successfully',
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({
              error: err,
            });
          })
      } else {
        res.status(201).json({
          message: 'Team already exists',
        })
      }
    });
});

router.get('/getTeamName/:employeeId', (req, res, next) => {
  const { employeeId } = req.params;
  Team.aggregate([{ "$unwind": "$teamMembers" }, { "$match": { "teamMembers": employeeId } },
  { "$project": { teamName: 1 } }
  ])
    .exec()
    .then(data => res.status(200).json(data[0].teamName))
})

module.exports = router;