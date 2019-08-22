const mongoose = require('mongoose');

const voteSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  pollId: String,
  voteResult: [
    {
      employeeId: String,
      optionId: String,
      votingTime: String,
    },
  ],
});

module.exports = mongoose.model('votes', voteSchema, 'votes');
