const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true }, // e.g. "10"
    rollNo: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Student', studentSchema)

