const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  // We store the serialized workspace (bodies and constraints) as a string
  data: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Experiment', experimentSchema);