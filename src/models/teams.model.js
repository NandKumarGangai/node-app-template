const mongoose = require('mongoose');

const teamSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  teamId: String,
  teamName: String,
  teamMembers: [
    String,
  ],
});

module.exports = mongoose.model('teams', teamSchema, 'teams');
