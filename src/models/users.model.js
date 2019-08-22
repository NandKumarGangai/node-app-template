const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  employeeId: String,
  employeeFirstName: String,
  employeeLastName: String,
  employeeEmail: String,
  employeePassword: String,
  team: String,
  votesPolled: [
    String,
  ],
  votesPending: [
    String,
  ],
  role: {
    type: String,
    enum: ['Admin', 'User'],
  },
  isActive: {
    type: String,
    enum: ['Yes', 'No', 'Removed'],
  },
});

module.exports = mongoose.model('users', userSchema, 'users');
