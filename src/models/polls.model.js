const mongoose = require('mongoose');

const pollSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  pollId: String,
  pollQuestion: String,
  pollOptions: [
    {
      optionId: String,
      optionName: String,
    },
  ],
  pollStatus: {
    type: String,
    enum: ['open', 'close'],
  },
  pollOpenDate: Date,
  pollCloseDate: Date,
  pollConductedForTeam: [
    String,
  ],
});

module.exports = mongoose.model('polls', pollSchema, 'polls');
